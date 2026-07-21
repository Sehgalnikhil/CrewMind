"""Shared behavior for every CrewMind agent.

Each concrete agent supplies identity (key/name/title) and a system prompt.
`run()` retrieves relevant document chunks for the query, layers in shared
memory and any context passed by the orchestrator (e.g. the Research
Agent's findings), and calls the LLM.
"""

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.document_processing.embedding_store import query as retrieve_chunks
from app.services.llm.anthropic_client import chat, stream_chat
from app.services.memory.memory_store import format_memory_for_prompt, read_recent_memory

AGENT_REGISTRY: dict[str, "BaseAgent"] = {}


class BaseAgent(ABC):
    key: str
    name: str
    title: str
    uses_web_search: bool = False

    def __init_subclass__(cls, **kwargs) -> None:
        super().__init_subclass__(**kwargs)
        if getattr(cls, "key", None):
            AGENT_REGISTRY[cls.key] = cls()

    @property
    @abstractmethod
    def system_prompt(self) -> str: ...

    async def _build_context_block(self, db: AsyncSession, org_id: str, query_text: str) -> str:
        chunks = retrieve_chunks(org_id, query_text, top_k=6)
        if chunks:
            doc_section = "\n\n".join(f"[Document excerpt {i+1}]\n{c}" for i, c in enumerate(chunks))
        else:
            doc_section = "No relevant documents have been uploaded yet."

        memory_records = await read_recent_memory(db, org_id)
        memory_section = format_memory_for_prompt(memory_records)

        return (
            f"## Relevant document excerpts\n{doc_section}\n\n"
            f"## Shared team memory (recent findings from other agents)\n{memory_section}"
        )

    async def _build_user_message(
        self, db: AsyncSession, org_id: str, message: str, extra_context: str
    ) -> str:
        context_block = await self._build_context_block(db, org_id, message)
        full_context = context_block
        if extra_context:
            full_context += f"\n\n## Additional context from the team\n{extra_context}"
        return f"{full_context}\n\n## Question / task\n{message}"

    async def run(
        self,
        db: AsyncSession,
        org_id: str,
        message: str,
        extra_context: str = "",
    ) -> str:
        user_message = await self._build_user_message(db, org_id, message, extra_context)
        return await chat(
            system=self.system_prompt,
            user_message=user_message,
            use_web_search=self.uses_web_search,
        )

    async def stream(
        self,
        db: AsyncSession,
        org_id: str,
        message: str,
        extra_context: str = "",
    ) -> AsyncIterator[str]:
        user_message = await self._build_user_message(db, org_id, message, extra_context)
        async for delta in stream_chat(system=self.system_prompt, user_message=user_message):
            yield delta
