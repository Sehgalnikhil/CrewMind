import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import RequestContext, get_request_context
from app.core.database import get_db
from app.models.agent_run import AgentRun
from app.schemas.report import AgentRunResponse
from app.services.agents.orchestrator import run_analysis

router = APIRouter(prefix="/api/agents", tags=["agents"])

# Keep references so background tasks aren't garbage-collected mid-flight.
_background_tasks: set[asyncio.Task] = set()


from app.core.audit import log_audit_event

@router.post("/runs", response_model=AgentRunResponse, status_code=201)
async def start_run(
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> AgentRunResponse:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    run = AgentRun(workspace_id=workspace_id, trigger="manual", status="pending")
    db.add(run)
    await db.commit()
    await db.refresh(run)

    if ctx.organization:
        await log_audit_event(
            db, 
            workspace_id=workspace_id, 
            user_id=ctx.user.id if ctx.user else None,
            action="agent_run.triggered",
            resource_type="agent_run",
            resource_id=run.id,
            details={"trigger": "manual", "org_id": ctx.organization.id}
        )

    task = asyncio.create_task(run_analysis(run.id, workspace_id))
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)

    return AgentRunResponse.model_validate(run)


@router.get("/runs", response_model=list[AgentRunResponse])
async def list_runs(
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> list[AgentRunResponse]:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    result = await db.execute(
        select(AgentRun).where(AgentRun.workspace_id == workspace_id).order_by(AgentRun.created_at.desc())
    )
    return [AgentRunResponse.model_validate(r) for r in result.scalars().all()]


@router.get("/runs/{run_id}", response_model=AgentRunResponse)
async def get_run(
    run_id: str,
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> AgentRunResponse:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    run = await db.get(AgentRun, run_id)
    if run is None or run.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Run not found")
    return AgentRunResponse.model_validate(run)
