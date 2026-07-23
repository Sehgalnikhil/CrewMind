"""Backward-compatible memory store — delegates to the tiered memory engine.

Existing code that calls write_memory() / read_recent_memory() /
format_memory_for_prompt() continues to work exactly as before.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.memory import MemoryRecord
from app.services.memory.memory_engine import (
    format_for_prompt,
    read_recent,
    write,
)


async def write_memory(
    db: AsyncSession, workspace_id: str, agent_source: str, kind: str, content: str
) -> None:
    """Write a memory record.  Backward-compatible wrapper."""
    await write(db, workspace_id, agent_source, kind, content)


async def read_recent_memory(
    db: AsyncSession, workspace_id: str, limit: int = 20
) -> list[MemoryRecord]:
    return await read_recent(db, workspace_id, limit=limit)


def format_memory_for_prompt(records: list[MemoryRecord]) -> str:
    return format_for_prompt(records)
