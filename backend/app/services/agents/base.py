"""Shared behavior for every CrewMind agent.

Each concrete agent supplies identity (key/name/title) and a system prompt.
`run()` retrieves relevant document chunks for the query, layers in shared
memory and any context passed by the orchestrator (e.g. the Research
Agent's findings), and calls the LLM.

Phase 1 additions:
  - Loads/saves persistent AgentState (goals, observations, confidence)
  - Injects personality profile into the system prompt
  - Records observations after each run
  - Tracks last_active_at
"""

import json
import logging
from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from datetime import timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent_state import AgentState
from app.models.mixins import utcnow
from app.schemas.reasoning import AgentReasoningOutput
from app.services.agents.personality import get_profile, personality_prompt_block
from app.services.agents.progress_bus import publish
from app.services.document_processing.embedding_store import query as retrieve_chunks
from app.services.llm.gemini_client import chat, stream_chat
from app.services.memory.memory_store import format_memory_for_prompt, read_recent_memory

logger = logging.getLogger("crewmind.agent")

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

    def _build_full_system_prompt(self, state: AgentState | None = None) -> str:
        """Combine the base system prompt with personality and state context."""
        parts = [self.system_prompt]

        # Inject personality
        profile = get_profile(self.key)
        personality_block = personality_prompt_block(profile)
        if personality_block:
            parts.append(personality_block)

        # Inject current state context if available
        if state is not None:
            goals = json.loads(state.goals_json) if state.goals_json else []
            if goals:
                parts.append("## Your current goals")
                for g in goals:
                    parts.append(f"- {g}")

            observations = json.loads(state.observations_json) if state.observations_json else []
            if observations:
                parts.append("## Your recent observations")
                for obs in observations[-5:]:  # Last 5 observations
                    parts.append(f"- {obs}")

            parts.append(f"\nYour current confidence level: {state.confidence:.0f}/100")

        return "\n\n".join(parts)

    async def _get_or_create_state(self, db: AsyncSession, workspace_id: str) -> AgentState:
        """Load persistent state, creating it if this is the first run."""
        result = await db.execute(
            select(AgentState).where(
                AgentState.workspace_id == workspace_id,
                AgentState.agent_key == self.key,
            )
        )
        state = result.scalar_one_or_none()

        if state is None:
            profile = get_profile(self.key)
            state = AgentState(
                workspace_id=workspace_id,
                agent_key=self.key,
                personality_json=json.dumps({
                    "verbosity": profile.verbosity,
                    "risk_tolerance": profile.risk_tolerance,
                    "formality": profile.formality,
                    "assertiveness": profile.assertiveness,
                    "empiricism": profile.empiricism,
                    "curiosity": profile.curiosity,
                }),
            )
            db.add(state)
            await db.commit()
            await db.refresh(state)

        return state

    async def _record_observation(
        self, db: AsyncSession, state: AgentState, observation: str
    ) -> None:
        """Append an observation and update last_active_at."""
        observations = json.loads(state.observations_json) if state.observations_json else []
        observations.append(observation)
        # Keep last 20 observations
        state.observations_json = json.dumps(observations[-20:])
        state.last_active_at = utcnow()
        await db.commit()

    async def _build_context_block(self, db: AsyncSession, workspace_id: str, query_text: str) -> str:
        chunks = retrieve_chunks(workspace_id, query_text, top_k=6)
        if chunks:
            doc_section = "\n\n".join(f"[Document excerpt {i+1}]\n{c}" for i, c in enumerate(chunks))
        else:
            doc_section = "No relevant documents have been uploaded yet."

        memory_records = await read_recent_memory(db, workspace_id)
        memory_section = format_memory_for_prompt(memory_records)

        return (
            f"## Relevant document excerpts\n{doc_section}\n\n"
            f"## Shared team memory (recent findings from other agents)\n{memory_section}"
        )

    async def _build_user_message(
        self, db: AsyncSession, workspace_id: str, message: str, extra_context: str
    ) -> str:
        context_block = await self._build_context_block(db, workspace_id, message)
        full_context = context_block
        if extra_context:
            full_context += f"\n\n## Additional context from the team\n{extra_context}"
        return f"{full_context}\n\n## Question / task\n{message}"

    async def run(
        self,
        db: AsyncSession,
        workspace_id: str,
        message: str,
        extra_context: str = "",
        execution_id: str | None = None,
    ) -> str:
        # Load persistent state
        state = await self._get_or_create_state(db, workspace_id)

        max_retries = 2
        for attempt in range(max_retries):
            system = self._build_full_system_prompt(state)
            user_message = await self._build_user_message(db, workspace_id, message, extra_context)
            
            result_json = await chat(
                system=system,
                user_message=user_message,
                use_web_search=self.uses_web_search,
                response_schema=AgentReasoningOutput,
            )
            
            try:
                data = json.loads(result_json)
                reasoning = AgentReasoningOutput.model_validate(data)
            except Exception as e:
                logger.error("Failed to parse AgentReasoningOutput: %s (Raw: %s)", e, result_json)
                return result_json
            
            # Record reasoning in state
            history = json.loads(state.reasoning_history_json) if state.reasoning_history_json else []
            history.append(data)
            state.reasoning_history_json = json.dumps(history[-10:])
            state.confidence = reasoning.confidence
            
            # Emit thought process to War Room
            if execution_id:
                await publish(execution_id, {
                    "type": "reasoning_step",
                    "agent": self.key,
                    "monologue": reasoning.internal_monologue,
                    "critic": reasoning.critic_reflection,
                    "confidence": reasoning.confidence,
                })
            
            # Reflection loop
            if reasoning.critic_reflection and reasoning.confidence < 75 and attempt < max_retries - 1:
                logger.info("Agent %s reflecting and retrying. Critic: %s", self.key, reasoning.critic_reflection)
                extra_context += f"\n\n## Self-Correction (Attempt {attempt+1})\nYou previously criticized your own output: {reasoning.critic_reflection}\nPlease generate a better response addressing this."
                continue
                
            break

        # Handle spawned tasks
        if reasoning.spawned_tasks:
            from app.services.agents import task_engine
            for st in reasoning.spawned_tasks:
                await task_engine.enqueue(
                    db=db,
                    workspace_id=workspace_id,
                    agent_key=st.agent_key,
                    title=st.title,
                    description=st.description,
                    priority=st.priority,
                    source=f"agent:{self.key}"
                )
                logger.info("Agent %s spawned task '%s' for %s", self.key, st.title, st.agent_key)
            
            # Record an observation about the spawned tasks
            await self._record_observation(
                db, state, f"Spawned {len(reasoning.spawned_tasks)} sub-tasks for other agents."
            )

        # Record what we did as an observation
        summary = reasoning.final_response[:150].replace("\n", " ")
        await self._record_observation(
            db, state, f"Completed task: {message[:80]}. Key finding: {summary}"
        )

        return reasoning.final_response

    async def stream(
        self,
        db: AsyncSession,
        workspace_id: str,
        message: str,
        extra_context: str = "",
    ) -> AsyncIterator[str]:
        state = await self._get_or_create_state(db, workspace_id)
        system = self._build_full_system_prompt(state)

        user_message = await self._build_user_message(db, workspace_id, message, extra_context)
        full_text = ""
        async for delta in stream_chat(system=system, user_message=user_message):
            full_text += delta
            yield delta

        # Record observation after streaming completes
        summary = full_text[:150].replace("\n", " ")
        await self._record_observation(
            db, state, f"Answered: {message[:80]}. Response: {summary}"
        )
