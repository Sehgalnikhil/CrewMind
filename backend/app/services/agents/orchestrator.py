"""The core CrewMind workflow: Research -> parallel domain agents -> Coordinator.

Runs as a background task kicked off by the /api/agents/runs endpoint. Progress
is published to progress_bus so a connected WebSocket client can render it live,
and every step is persisted so history survives a disconnect.
"""

import asyncio
import json
import logging

from app.core.database import AsyncSessionLocal
from app.models.agent_run import AgentRun, AgentRunOutput
from app.models.report import Report
from app.services.agents import AGENT_REGISTRY, DOMAIN_AGENT_KEYS
from app.services.agents.coordinator import synthesize
from app.services.agents.progress_bus import publish
from app.services.llm.gemini_client import LLMNotConfiguredError
from app.services.memory.memory_store import write_memory

logger = logging.getLogger("crewmind.orchestrator")

STANDARD_TASK_PROMPT = (
    "Review the uploaded business documents and any external research provided, and produce "
    "your assessment from your role's perspective. Be specific and reference what you actually "
    "found — call out concrete risks, opportunities, and any figures or facts that stand out."
)

RESEARCH_TASK_PROMPT = (
    "Based on the uploaded business documents, identify the company's industry, market, and "
    "key competitors, then provide relevant external context: market trends, competitor "
    "activity, and industry benchmarks that the other agents should factor into their analysis."
)


async def _run_agent(agent_key: str, db, workspace_id: str, extra_context: str = "", execution_id: str | None = None) -> str:
    agent = AGENT_REGISTRY[agent_key]
    prompt = RESEARCH_TASK_PROMPT if agent_key == "research" else STANDARD_TASK_PROMPT
    return await agent.run(db, workspace_id, message=prompt, extra_context=extra_context, execution_id=execution_id)


async def run_analysis(agent_run_id: str, workspace_id: str) -> None:
    async def emit(event: dict) -> None:
        await publish(agent_run_id, event)

    async def set_status(db, status: str) -> None:
        run = await db.get(AgentRun, agent_run_id)
        if run is not None:
            run.status = status
            await db.commit()
        await emit({"type": "run_status", "status": status})

    try:
        # --- Step 1: Research ---
        async with AsyncSessionLocal() as db:
            await set_status(db, "researching")
            await emit({"type": "agent_status", "agent_key": "research", "status": "running"})

        async with AsyncSessionLocal() as db:
            research_output = await _run_agent("research", db, workspace_id, execution_id=agent_run_id)

        async with AsyncSessionLocal() as db:
            db.add(AgentRunOutput(agent_run_id=agent_run_id, agent_key="research", output_json=json.dumps(research_output)))
            await write_memory(db, workspace_id, "research", "finding", research_output)
            await emit({"type": "agent_status", "agent_key": "research", "status": "done"})

        # --- Step 2: Domain agents, in parallel ---
        async with AsyncSessionLocal() as db:
            await set_status(db, "analyzing")
            for key in DOMAIN_AGENT_KEYS:
                await emit({"type": "agent_status", "agent_key": key, "status": "running"})

        async def run_and_record(key: str) -> tuple[str, str]:
            async with AsyncSessionLocal() as read_db:
                output = await _run_agent(key, read_db, workspace_id, extra_context=research_output, execution_id=agent_run_id)
            async with AsyncSessionLocal() as db:
                db.add(
                    AgentRunOutput(
                        agent_run_id=agent_run_id, agent_key=key, output_json=json.dumps(output)
                    )
                )
                await write_memory(db, workspace_id, key, "finding", output)
            await emit({"type": "agent_status", "agent_key": key, "status": "done"})
            return key, output

        results = await asyncio.gather(*(run_and_record(key) for key in DOMAIN_AGENT_KEYS))
        agent_outputs = {"research": research_output, **dict(results)}

        # --- Step 3: Coordinator synthesis ---
        async with AsyncSessionLocal() as db:
            await set_status(db, "synthesizing")
            await emit({"type": "agent_status", "agent_key": "coordinator", "status": "running"})

        report_data = await synthesize(agent_outputs)

        async with AsyncSessionLocal() as db:
            report = Report(
                workspace_id=workspace_id,
                agent_run_id=agent_run_id,
                business_health_score=report_data["business_health_score"],
                summary=report_data["summary"],
                risks_json=json.dumps(report_data["risks"]),
                opportunities_json=json.dumps(report_data["opportunities"]),
                recommendations_json=json.dumps(report_data["recommendations"]),
            )
            db.add(report)
            await set_status(db, "completed")
            await db.commit()
            await db.refresh(report)

        await emit({"type": "agent_status", "agent_key": "coordinator", "status": "done"})
        await emit({"type": "completed", "report_id": report.id})

    except LLMNotConfiguredError as exc:
        async with AsyncSessionLocal() as db:
            run = await db.get(AgentRun, agent_run_id)
            if run is not None:
                run.status = "failed"
                run.error_message = str(exc)
                await db.commit()
        await emit({"type": "failed", "message": str(exc)})
    except Exception:  # noqa: BLE001
        logger.exception("Analysis run %s failed", agent_run_id)
        async with AsyncSessionLocal() as db:
            run = await db.get(AgentRun, agent_run_id)
            if run is not None:
                run.status = "failed"
                run.error_message = "Unexpected error during analysis."
                await db.commit()
        await emit({"type": "failed", "message": "Unexpected error during analysis."})
