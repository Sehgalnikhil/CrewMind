"""REST endpoints for agent state, tasks, and inter-agent messages.

GET  /api/agents/state            — all agent states for the workspace
GET  /api/agents/{key}/state      — single agent state
PATCH /api/agents/{key}/state     — update goals/confidence
GET  /api/agents/{key}/tasks      — agent's task queue
POST /api/agents/{key}/tasks      — add a task
GET  /api/agents/{key}/tasks/stats — queue statistics
GET  /api/agents/messages         — inter-agent message log
GET  /api/agents/messages/{thread_id} — messages in a thread
"""

import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import RequestContext, RequiresPermission, get_request_context
from app.core.audit import log_audit_event
from app.core.database import get_db
from app.models.agent_message import AgentMessage
from app.models.agent_state import AgentState
from app.schemas.agent import (
    AgentMessageResponse,
    AgentStateResponse,
    AgentStateUpdate,
    AgentTaskCreate,
    AgentTaskResponse,
    TaskQueueStats,
)
from app.services.agents import AGENT_REGISTRY
from app.services.agents.task_engine import enqueue, get_queue_stats, list_tasks

router = APIRouter(prefix="/api/agents", tags=["agents-intelligence"])


def _state_to_response(state: AgentState) -> AgentStateResponse:
    return AgentStateResponse(
        id=state.id,
        agent_key=state.agent_key,
        goals=json.loads(state.goals_json) if state.goals_json else [],
        observations=json.loads(state.observations_json) if state.observations_json else [],
        confidence=state.confidence,
        personality=json.loads(state.personality_json) if state.personality_json else {},
        reasoning_history=json.loads(state.reasoning_history_json) if state.reasoning_history_json else [],
        last_active_at=state.last_active_at,
        created_at=state.created_at,
    )


def _message_to_response(msg: AgentMessage) -> AgentMessageResponse:
    return AgentMessageResponse(
        id=msg.id,
        sender=msg.sender,
        receiver=msg.receiver,
        intent=msg.intent,
        content=msg.content,
        confidence=msg.confidence,
        priority=msg.priority,
        evidence=json.loads(msg.evidence_json) if msg.evidence_json else [],
        thread_id=msg.thread_id,
        execution_id=msg.execution_id,
        result_json=msg.result_json,
        created_at=msg.created_at,
    )


# ── Agent State ──────────────────────────────────────────────────

@router.get("/state", response_model=list[AgentStateResponse])
async def list_agent_states(
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> list[AgentStateResponse]:
    """Get all agent states for the workspace."""
    workspace_id = ctx.workspace.id if ctx.workspace else None
    result = await db.execute(
        select(AgentState).where(AgentState.workspace_id == workspace_id)
    )
    states = list(result.scalars().all())

    # Auto-create states for any registered agents that don't have one yet
    existing_keys = {s.agent_key for s in states}
    for key, agent in AGENT_REGISTRY.items():
        if key not in existing_keys:
            new_state = AgentState(workspace_id=workspace_id, agent_key=key)
            db.add(new_state)
            states.append(new_state)
    if len(states) > len(existing_keys):
        await db.commit()
        for s in states:
            await db.refresh(s)

    return [_state_to_response(s) for s in states]


@router.get("/{agent_key}/state", response_model=AgentStateResponse)
async def get_agent_state(
    agent_key: str,
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> AgentStateResponse:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    result = await db.execute(
        select(AgentState).where(
            AgentState.workspace_id == workspace_id,
            AgentState.agent_key == agent_key,
        )
    )
    state = result.scalar_one_or_none()
    if state is None:
        # Auto-create
        state = AgentState(workspace_id=workspace_id, agent_key=agent_key)
        db.add(state)
        await db.commit()
        await db.refresh(state)
    return _state_to_response(state)


@router.patch("/{agent_key}/state", response_model=AgentStateResponse)
async def update_agent_state(
    agent_key: str,
    payload: AgentStateUpdate,
    ctx: RequestContext = Depends(RequiresPermission("agents.configure")),
    db: AsyncSession = Depends(get_db),
) -> AgentStateResponse:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    result = await db.execute(
        select(AgentState).where(
            AgentState.workspace_id == workspace_id,
            AgentState.agent_key == agent_key,
        )
    )
    state = result.scalar_one_or_none()
    if state is None:
        raise HTTPException(status_code=404, detail="Agent state not found")

    if payload.goals is not None:
        state.goals_json = json.dumps(payload.goals)
    if payload.confidence is not None:
        state.confidence = max(0, min(100, payload.confidence))
    await db.commit()
    await db.refresh(state)

    await log_audit_event(
        db, workspace_id=workspace_id, user_id=ctx.user.id,
        action="agents.configured",
        resource_type="agent", resource_id=agent_key,
        details={"goals_updated": payload.goals is not None, "confidence_updated": payload.confidence is not None},
    )
    return _state_to_response(state)


# ── Agent Tasks ──────────────────────────────────────────────────

@router.get("/{agent_key}/tasks", response_model=list[AgentTaskResponse])
async def get_agent_tasks(
    agent_key: str,
    status: str | None = Query(None),
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> list[AgentTaskResponse]:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    tasks = await list_tasks(db, workspace_id, agent_key, status=status)
    return [AgentTaskResponse.model_validate(t) for t in tasks]


@router.post("/{agent_key}/tasks", response_model=AgentTaskResponse, status_code=201)
async def create_agent_task(
    agent_key: str,
    payload: AgentTaskCreate,
    ctx: RequestContext = Depends(RequiresPermission("agents.create")),
    db: AsyncSession = Depends(get_db),
) -> AgentTaskResponse:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    task = await enqueue(
        db, workspace_id, agent_key,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        source="manual",
        due_at=payload.due_at,
    )
    await log_audit_event(
        db, workspace_id=workspace_id, user_id=ctx.user.id,
        action="agents.task_created",
        resource_type="agent_task", resource_id=task.id,
        details={"agent": agent_key, "title": payload.title},
    )
    return AgentTaskResponse.model_validate(task)


@router.get("/{agent_key}/tasks/stats", response_model=TaskQueueStats)
async def get_agent_task_stats(
    agent_key: str,
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> TaskQueueStats:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    stats = await get_queue_stats(db, workspace_id, agent_key)
    return TaskQueueStats(**stats)


# ── Agent Messages ───────────────────────────────────────────────

@router.get("/messages", response_model=list[AgentMessageResponse])
async def list_agent_messages(
    limit: int = Query(50, le=200),
    execution_id: str | None = Query(None),
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> list[AgentMessageResponse]:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    stmt = select(AgentMessage).where(AgentMessage.workspace_id == workspace_id)
    if execution_id:
        stmt = stmt.where(AgentMessage.execution_id == execution_id)
    stmt = stmt.order_by(AgentMessage.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return [_message_to_response(m) for m in result.scalars().all()]


@router.get("/messages/thread/{thread_id}", response_model=list[AgentMessageResponse])
async def get_message_thread(
    thread_id: str,
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> list[AgentMessageResponse]:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    result = await db.execute(
        select(AgentMessage)
        .where(
            AgentMessage.workspace_id == workspace_id,
            AgentMessage.thread_id == thread_id,
        )
        .order_by(AgentMessage.created_at.asc())
    )
    return [_message_to_response(m) for m in result.scalars().all()]
