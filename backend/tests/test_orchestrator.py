"""End-to-end orchestration test with the Anthropic API mocked.

Verifies the full Research -> parallel domain agents -> Coordinator pipeline:
correct DB writes (AgentRun status transitions, AgentRunOutput rows, shared
MemoryRecord writes, final Report), and the progress events an orchestration
consumer would see over the WebSocket.
"""

import json
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.database import Base
from app.models.agent_run import AgentRun, AgentRunOutput
from app.models.memory import MemoryRecord
from app.models.report import Report
from app.services.agents.orchestrator import run_analysis
from app.services.agents.progress_bus import subscribe, unsubscribe

ORG_ID = "org-test-1"

COORDINATOR_JSON = json.dumps(
    {
        "summary": "The business is growing steadily with some financial risk.",
        "business_health_score": 72,
        "risks": ["Customer concentration in top 2 accounts."],
        "opportunities": ["Expand into the enterprise tier."],
        "recommendations": ["Diversify the customer base this quarter."],
    }
)


@pytest.fixture
async def test_db_session_factory():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    yield factory
    await engine.dispose()


@pytest.mark.asyncio
async def test_full_orchestration_pipeline(test_db_session_factory):
    async with test_db_session_factory() as db:
        run = AgentRun(id="run-1", org_id=ORG_ID, trigger="manual", status="pending")
        db.add(run)
        await db.commit()

    queue = subscribe("run-1")

    with (
        patch("app.services.agents.orchestrator.AsyncSessionLocal", test_db_session_factory),
        patch("app.services.agents.base.retrieve_chunks", return_value=[]),
        patch(
            "app.services.agents.base.chat",
            new_callable=AsyncMock,
            return_value="Specialist finding text.",
        ),
        patch(
            "app.services.agents.coordinator.chat",
            new_callable=AsyncMock,
            return_value=COORDINATOR_JSON,
        ),
    ):
        await run_analysis("run-1", ORG_ID)

    events = []
    while not queue.empty():
        events.append(await queue.get())
    unsubscribe("run-1", queue)

    # Status transitions happened in order, ending in completion.
    statuses = [e["status"] for e in events if e["type"] == "run_status"]
    assert statuses == ["researching", "analyzing", "synthesizing", "completed"]
    assert events[-1]["type"] == "completed"

    # Research ran and finished before the domain agents started.
    agent_events = [e for e in events if e["type"] == "agent_status"]
    research_done_index = next(
        i for i, e in enumerate(agent_events) if e["agent_key"] == "research" and e["status"] == "done"
    )
    domain_running_indexes = [
        i
        for i, e in enumerate(agent_events)
        if e["agent_key"] in ("strategy", "finance", "operations", "legal") and e["status"] == "running"
    ]
    assert all(i > research_done_index for i in domain_running_indexes)

    async with test_db_session_factory() as db:
        run = await db.get(AgentRun, "run-1")
        assert run.status == "completed"

        outputs = (
            (await db.execute(select(AgentRunOutput).where(AgentRunOutput.agent_run_id == "run-1")))
            .scalars()
            .all()
        )
        assert {o.agent_key for o in outputs} == {"research", "strategy", "finance", "operations", "legal"}

        memory_records = (
            (await db.execute(select(MemoryRecord).where(MemoryRecord.org_id == ORG_ID))).scalars().all()
        )
        assert len(memory_records) == 5

        report = (
            (await db.execute(select(Report).where(Report.agent_run_id == "run-1"))).scalars().first()
        )
        assert report is not None
        assert report.business_health_score == 72
        assert json.loads(report.risks_json) == ["Customer concentration in top 2 accounts."]


@pytest.mark.asyncio
async def test_orchestration_fails_gracefully_without_llm_key(test_db_session_factory):
    async with test_db_session_factory() as db:
        run = AgentRun(id="run-2", org_id=ORG_ID, trigger="manual", status="pending")
        db.add(run)
        await db.commit()

    queue = subscribe("run-2")

    # No mocking of chat() here — real gemini_client.chat() runs and raises
    # LLMNotConfiguredError since no API key is set in the test environment.
    with patch("app.services.agents.orchestrator.AsyncSessionLocal", test_db_session_factory):
        await run_analysis("run-2", ORG_ID)

    events = []
    while not queue.empty():
        events.append(await queue.get())
    unsubscribe("run-2", queue)

    assert events[-1]["type"] == "failed"

    async with test_db_session_factory() as db:
        run = await db.get(AgentRun, "run-2")
        assert run.status == "failed"
        assert run.error_message
