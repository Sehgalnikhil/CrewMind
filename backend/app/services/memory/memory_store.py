"""Shared, org-scoped memory that every agent reads from and writes to.

This is what makes the crew feel like a team rather than five isolated
chatbots: a finding one agent records becomes context for the next.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.memory import MemoryRecord


async def write_memory(db: AsyncSession, org_id: str, agent_source: str, kind: str, content: str) -> None:
    db.add(MemoryRecord(org_id=org_id, agent_source=agent_source, kind=kind, content=content))
    await db.commit()


async def read_recent_memory(db: AsyncSession, org_id: str, limit: int = 20) -> list[MemoryRecord]:
    result = await db.execute(
        select(MemoryRecord)
        .where(MemoryRecord.org_id == org_id)
        .order_by(MemoryRecord.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


def format_memory_for_prompt(records: list[MemoryRecord]) -> str:
    if not records:
        return "No shared memory yet."
    lines = [f"- [{r.agent_source} · {r.kind}] {r.content}" for r in reversed(records)]
    return "\n".join(lines)
