import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_org
from app.core.database import get_db
from app.models.agent_run import AgentRun
from app.models.organization import Organization
from app.schemas.report import AgentRunResponse
from app.services.agents.orchestrator import run_analysis

router = APIRouter(prefix="/api/agents", tags=["agents"])

# Keep references so background tasks aren't garbage-collected mid-flight.
_background_tasks: set[asyncio.Task] = set()


@router.post("/runs", response_model=AgentRunResponse, status_code=201)
async def start_run(
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> AgentRunResponse:
    run = AgentRun(org_id=org.id, trigger="manual", status="pending")
    db.add(run)
    await db.commit()
    await db.refresh(run)

    task = asyncio.create_task(run_analysis(run.id, org.id))
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)

    return AgentRunResponse.model_validate(run)


@router.get("/runs", response_model=list[AgentRunResponse])
async def list_runs(
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> list[AgentRunResponse]:
    result = await db.execute(
        select(AgentRun).where(AgentRun.org_id == org.id).order_by(AgentRun.created_at.desc())
    )
    return [AgentRunResponse.model_validate(r) for r in result.scalars().all()]


@router.get("/runs/{run_id}", response_model=AgentRunResponse)
async def get_run(
    run_id: str,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> AgentRunResponse:
    run = await db.get(AgentRun, run_id)
    if run is None or run.org_id != org.id:
        raise HTTPException(status_code=404, detail="Run not found")
    return AgentRunResponse.model_validate(run)
