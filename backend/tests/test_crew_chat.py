"""Tests the all-agents chat fan-out/synthesis logic with a fake WebSocket
and the Anthropic calls mocked, since a live run needs a real API key."""

from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.api.ws import _send_crew_reply
from app.core.database import Base
from app.models.conversation import Conversation, Message

ORG_ID = "org-crew-1"


class FakeWebSocket:
    def __init__(self):
        self.sent: list[dict] = []

    async def send_json(self, data: dict) -> None:
        self.sent.append(data)


@pytest.fixture
async def test_db_session_factory():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    yield factory
    await engine.dispose()


@pytest.mark.asyncio
async def test_crew_reply_fans_out_and_synthesizes(test_db_session_factory):
    async with test_db_session_factory() as db:
        conv = Conversation(id="conv-1", org_id=ORG_ID, mode="all_agents")
        db.add(conv)
        await db.commit()

    ws = FakeWebSocket()

    with (
        patch("app.api.ws.AsyncSessionLocal", test_db_session_factory),
        patch("app.services.agents.base.retrieve_chunks", return_value=[]),
        patch(
            "app.services.agents.base.chat",
            new_callable=AsyncMock,
            return_value="This agent's take on the question.",
        ),
        patch(
            "app.services.agents.coordinator.chat",
            new_callable=AsyncMock,
            return_value="The crew's combined answer.",
        ),
    ):
        await _send_crew_reply(ws, "conv-1", ORG_ID, "How is the business doing?")

    starts = [e["agent_key"] for e in ws.sent if e["type"] == "start"]
    dones = [e["agent_key"] for e in ws.sent if e["type"] == "done"]
    assert set(starts) == {"research", "strategy", "finance", "operations", "legal", "coordinator"}
    assert set(dones) == {"research", "strategy", "finance", "operations", "legal", "coordinator"}
    # Coordinator must start only after every specialist has finished.
    coordinator_start_index = next(i for i, e in enumerate(ws.sent) if e == {"type": "start", "agent_key": "coordinator"})
    specialist_done_indexes = [
        i for i, e in enumerate(ws.sent) if e["type"] == "done" and e.get("agent_key") != "coordinator"
    ]
    assert all(i < coordinator_start_index for i in specialist_done_indexes)

    final_delta = next(e for e in reversed(ws.sent) if e["type"] == "delta")
    assert final_delta["content"] == "The crew's combined answer."

    async with test_db_session_factory() as db:
        messages = (
            (await db.execute(select(Message).where(Message.conversation_id == "conv-1")))
            .scalars()
            .all()
        )
        assert {m.agent_key for m in messages} == {
            "research",
            "strategy",
            "finance",
            "operations",
            "legal",
            "coordinator",
        }
        coordinator_message = next(m for m in messages if m.agent_key == "coordinator")
        assert coordinator_message.content == "The crew's combined answer."


@pytest.mark.asyncio
async def test_crew_reply_skips_synthesis_if_every_agent_fails(test_db_session_factory):
    async with test_db_session_factory() as db:
        conv = Conversation(id="conv-2", org_id=ORG_ID, mode="all_agents")
        db.add(conv)
        await db.commit()

    ws = FakeWebSocket()

    # No mocking of chat() — it raises LLMNotConfiguredError for every agent
    # since no API key is set in the test environment.
    with patch("app.api.ws.AsyncSessionLocal", test_db_session_factory):
        await _send_crew_reply(ws, "conv-2", ORG_ID, "How is the business doing?")

    assert not any(e["type"] == "start" and e["agent_key"] == "coordinator" for e in ws.sent)
    error_count = sum(1 for e in ws.sent if e["type"] == "error")
    assert error_count == 5
