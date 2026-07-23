"""REST endpoints for the tiered memory system.

GET  /api/memory            — paginated, filterable by tier/kind/agent
POST /api/memory/search     — semantic search across memories
GET  /api/memory/{id}       — single memory detail
GET  /api/memory/{id}/links — linked memories (evidence chain)
GET  /api/memory/stats      — tier-level statistics
"""

import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import RequestContext, get_request_context
from app.core.database import get_db
from app.models.memory import MemoryRecord
from app.schemas.agent import MemoryRecordResponse, MemorySearchRequest
from app.services.memory.memory_engine import query as memory_query

router = APIRouter(prefix="/api/memory", tags=["memory"])


def _to_response(record: MemoryRecord) -> MemoryRecordResponse:
    return MemoryRecordResponse(
        id=record.id,
        agent_source=record.agent_source,
        kind=record.kind,
        content=record.content,
        title=record.title or record.content[:100],
        tier=record.tier if hasattr(record, "tier") and record.tier else "short_term",
        importance=record.importance if hasattr(record, "importance") else 0.5,
        linked_memory_ids=json.loads(record.linked_memory_ids) if hasattr(record, "linked_memory_ids") and record.linked_memory_ids else [],
        access_count=record.access_count if hasattr(record, "access_count") else 0,
        expires_at=record.expires_at if hasattr(record, "expires_at") else None,
        created_at=record.created_at,
    )


@router.get("", response_model=list[MemoryRecordResponse])
async def list_memories(
    tier: str | None = Query(None),
    kind: str | None = Query(None),
    agent: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> list[MemoryRecordResponse]:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    stmt = select(MemoryRecord).where(MemoryRecord.workspace_id == workspace_id)
    if tier:
        stmt = stmt.where(MemoryRecord.tier == tier)
    if kind:
        stmt = stmt.where(MemoryRecord.kind == kind)
    if agent:
        stmt = stmt.where(MemoryRecord.agent_source == agent)
    stmt = stmt.order_by(MemoryRecord.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(stmt)
    return [_to_response(r) for r in result.scalars().all()]


@router.post("/search", response_model=list[MemoryRecordResponse])
async def search_memories(
    payload: MemorySearchRequest,
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> list[MemoryRecordResponse]:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    records = await memory_query(
        db, workspace_id, payload.query,
        tiers=payload.tiers,
        kinds=payload.kinds,
        agent_key=payload.agent_key,
        top_k=payload.top_k,
    )
    return [_to_response(r) for r in records]


@router.get("/stats")
async def memory_stats(
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get memory statistics grouped by tier and kind."""
    workspace_id = ctx.workspace.id if ctx.workspace else None
    # By tier
    tier_result = await db.execute(
        select(MemoryRecord.tier, func.count(MemoryRecord.id))
        .where(MemoryRecord.workspace_id == workspace_id)
        .group_by(MemoryRecord.tier)
    )
    by_tier = dict(tier_result.all())

    # By kind
    kind_result = await db.execute(
        select(MemoryRecord.kind, func.count(MemoryRecord.id))
        .where(MemoryRecord.workspace_id == workspace_id)
        .group_by(MemoryRecord.kind)
    )
    by_kind = dict(kind_result.all())

    # Total
    total_result = await db.execute(
        select(func.count(MemoryRecord.id))
        .where(MemoryRecord.workspace_id == workspace_id)
    )
    total = total_result.scalar() or 0

    return {"total": total, "by_tier": by_tier, "by_kind": by_kind}


@router.get("/{memory_id}", response_model=MemoryRecordResponse)
async def get_memory(
    memory_id: str,
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> MemoryRecordResponse:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    record = await db.get(MemoryRecord, memory_id)
    if record is None or record.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Memory not found")
    return _to_response(record)


@router.get("/{memory_id}/links", response_model=list[MemoryRecordResponse])
async def get_linked_memories(
    memory_id: str,
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> list[MemoryRecordResponse]:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    record = await db.get(MemoryRecord, memory_id)
    if record is None or record.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Memory not found")

    linked_ids = json.loads(record.linked_memory_ids) if record.linked_memory_ids else []
    if not linked_ids:
        return []

    result = await db.execute(
        select(MemoryRecord).where(
            MemoryRecord.id.in_(linked_ids),
            MemoryRecord.workspace_id == workspace_id,
        )
    )
    return [_to_response(r) for r in result.scalars().all()]
