"""Tiered memory engine — the organizational brain.

Replaces the simple read/write memory_store with a full lifecycle engine:
  - write():        classify tier, compute importance, create vector embedding
  - query():        semantic search across tiers with decay weighting
  - consolidate():  promote frequently-accessed short-term → long-term
  - expire():       clean up working memories past their TTL

The original memory_store.py functions continue to work — they delegate here.
"""

import json
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.memory import MemoryRecord
from app.models.mixins import new_uuid, utcnow
from app.services.document_processing.embedding_store import get_collection

logger = logging.getLogger("crewmind.memory_engine")

# Tier TTLs (None = never expires)
TIER_TTL: dict[str, timedelta | None] = {
    "working": timedelta(hours=2),
    "short_term": timedelta(days=7),
    "long_term": None,
    "semantic": None,
    "executive": None,
}

# Importance weights by kind
KIND_IMPORTANCE: dict[str, float] = {
    "decision": 0.9,
    "risk": 0.8,
    "opportunity": 0.8,
    "fact": 0.5,
    "metric": 0.6,
    "finding": 0.5,
    "observation": 0.4,
    "recommendation": 0.75,
}

# How many accesses before short-term gets promoted to long-term
CONSOLIDATION_THRESHOLD = 5

# ChromaDB collection name prefix for memory vectors
MEMORY_COLLECTION_PREFIX = "mem_"


def _memory_collection_name(workspace_id: str) -> str:
    return f"{MEMORY_COLLECTION_PREFIX}{workspace_id.replace('-', '')}"


def _compute_importance(kind: str, tier: str) -> float:
    """Compute initial importance based on kind and tier."""
    base = KIND_IMPORTANCE.get(kind, 0.5)
    tier_boost = {"executive": 0.2, "long_term": 0.1, "semantic": 0.05}.get(tier, 0.0)
    return min(1.0, base + tier_boost)


def _classify_tier(kind: str, content: str) -> str:
    """Auto-classify the tier for a new memory based on its kind."""
    if kind in ("decision", "recommendation"):
        return "executive"
    if kind == "fact":
        return "semantic"
    if kind in ("observation",):
        return "working"
    return "short_term"


async def write(
    db: AsyncSession,
    workspace_id: str,
    agent_source: str,
    kind: str,
    content: str,
    *,
    title: str = "",
    tier: str | None = None,
    linked_ids: list[str] | None = None,
    importance: float | None = None,
) -> MemoryRecord:
    """Write a new memory record with full tiered metadata."""
    resolved_tier = tier or _classify_tier(kind, content)
    resolved_importance = importance if importance is not None else _compute_importance(kind, resolved_tier)

    ttl = TIER_TTL.get(resolved_tier)
    expires_at = (utcnow() + ttl) if ttl else None

    # Create the embedding for semantic search
    embedding_id = new_uuid()
    try:
        collection = get_collection(f"{MEMORY_COLLECTION_PREFIX}{workspace_id.replace('-', '')}")
        collection.add(
            ids=[embedding_id],
            documents=[f"{title}\n{content}" if title else content],
            metadatas=[{"agent": agent_source, "kind": kind, "tier": resolved_tier}],
        )
    except Exception:  # noqa: BLE001
        logger.warning("Failed to create memory embedding, continuing without vector", exc_info=True)
        embedding_id = None

    record = MemoryRecord(
        workspace_id=workspace_id,
        agent_source=agent_source,
        kind=kind,
        content=content,
        title=title or content[:100],
        tier=resolved_tier,
        importance=resolved_importance,
        embedding_id=embedding_id,
        linked_memory_ids=json.dumps(linked_ids or []),
        expires_at=expires_at,
        access_count=0,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def query(
    db: AsyncSession,
    workspace_id: str,
    query_text: str,
    *,
    tiers: list[str] | None = None,
    kinds: list[str] | None = None,
    agent_key: str | None = None,
    top_k: int = 10,
) -> list[MemoryRecord]:
    """Semantic + DB search for relevant memories.

    Returns memories ranked by a combination of vector similarity and
    importance, filtered by optional tier/kind/agent constraints.
    """
    # Step 1: semantic search via ChromaDB
    try:
        collection = get_collection(f"{MEMORY_COLLECTION_PREFIX}{workspace_id.replace('-', '')}")
        if collection.count() > 0:
            where_filters: dict = {}
            if tiers:
                where_filters["tier"] = {"$in": tiers}
            if agent_key:
                where_filters["agent"] = agent_key

            results = collection.query(
                query_texts=[query_text],
                n_results=min(top_k * 2, collection.count()),
                where=where_filters if where_filters else None,
            )
            matched_ids = results.get("ids", [[]])[0]
        else:
            matched_ids = []
    except Exception:  # noqa: BLE001
        logger.warning("Memory vector search failed, falling back to DB", exc_info=True)
        matched_ids = []

    # Step 2: fetch full records from DB
    stmt = (
        select(MemoryRecord)
        .where(MemoryRecord.workspace_id == workspace_id)
    )
    if matched_ids:
        stmt = stmt.where(MemoryRecord.embedding_id.in_(matched_ids))
    else:
        # Fallback: recent records if vector search returned nothing
        stmt = stmt.order_by(MemoryRecord.created_at.desc()).limit(top_k)

    if tiers:
        stmt = stmt.where(MemoryRecord.tier.in_(tiers))
    if kinds:
        stmt = stmt.where(MemoryRecord.kind.in_(kinds))
    if agent_key:
        stmt = stmt.where(MemoryRecord.agent_source == agent_key)

    # Filter out expired
    now = utcnow()
    stmt = stmt.where(
        (MemoryRecord.expires_at.is_(None)) | (MemoryRecord.expires_at > now)
    )

    result = await db.execute(stmt.limit(top_k))
    records = list(result.scalars().all())

    # Increment access counts
    if records:
        record_ids = [r.id for r in records]
        await db.execute(
            update(MemoryRecord)
            .where(MemoryRecord.id.in_(record_ids))
            .values(access_count=MemoryRecord.access_count + 1)
        )
        await db.commit()

    # Sort by importance descending
    records.sort(key=lambda r: r.importance, reverse=True)
    return records[:top_k]


async def consolidate(db: AsyncSession, workspace_id: str) -> int:
    """Promote frequently-accessed short-term memories to long-term.

    Returns the number of memories promoted.
    """
    stmt = (
        select(MemoryRecord)
        .where(
            MemoryRecord.workspace_id == workspace_id,
            MemoryRecord.tier == "short_term",
            MemoryRecord.access_count >= CONSOLIDATION_THRESHOLD,
        )
    )
    result = await db.execute(stmt)
    records = list(result.scalars().all())

    for record in records:
        record.tier = "long_term"
        record.expires_at = None
        record.importance = min(1.0, record.importance + 0.15)

    if records:
        await db.commit()
        logger.info("Consolidated %d memories to long-term for workspace %s", len(records), workspace_id)

    return len(records)


async def expire(db: AsyncSession, workspace_id: str) -> int:
    """Remove expired working/short-term memories. Returns count deleted."""
    now = utcnow()
    stmt = (
        select(MemoryRecord)
        .where(
            MemoryRecord.workspace_id == workspace_id,
            MemoryRecord.expires_at.isnot(None),
            MemoryRecord.expires_at <= now,
        )
    )
    result = await db.execute(stmt)
    expired = list(result.scalars().all())

    for record in expired:
        await db.delete(record)

    if expired:
        await db.commit()
        logger.info("Expired %d memories for workspace %s", len(expired), workspace_id)

    return len(expired)


async def read_recent(
    db: AsyncSession, workspace_id: str, *, limit: int = 20
) -> list[MemoryRecord]:
    """Backward-compatible: read the most recent memories (any tier)."""
    now = utcnow()
    result = await db.execute(
        select(MemoryRecord)
        .where(
            MemoryRecord.workspace_id == workspace_id,
            (MemoryRecord.expires_at.is_(None)) | (MemoryRecord.expires_at > now),
        )
        .order_by(MemoryRecord.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


def format_for_prompt(records: list[MemoryRecord]) -> str:
    """Format memories into a prompt-friendly text block."""
    if not records:
        return "No shared memory yet."
    lines = []
    for r in reversed(records):
        tier_tag = f"[{r.tier}]" if hasattr(r, "tier") and r.tier else ""
        lines.append(f"- [{r.agent_source} · {r.kind} {tier_tag}] {r.content}")
    return "\n".join(lines)
