"""Inter-agent communication protocol.

Structured messaging between executives — every message carries intent,
confidence, evidence, and threading so the War Room can display real-time
deliberation.  Messages are both persisted to DB and published to the
progress_bus for live WebSocket observation.
"""

import json
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent_message import AgentMessage
from app.services.agents.progress_bus import publish

logger = logging.getLogger("crewmind.comms")


async def send_message(
    db: AsyncSession,
    workspace_id: str,
    *,
    sender: str,
    receiver: str,
    intent: str,
    content: str,
    confidence: float = 75.0,
    priority: int = 3,
    evidence: list[str] | None = None,
    thread_id: str | None = None,
    execution_id: str | None = None,
) -> AgentMessage:
    """Send a structured inter-agent message.

    Persists to DB and publishes a real-time event via the progress bus
    so connected WebSocket clients (War Room) can observe it live.
    """
    if thread_id is None:
        thread_id = str(uuid.uuid4())

    message = AgentMessage(
        workspace_id=workspace_id,
        sender=sender,
        receiver=receiver,
        intent=intent,
        content=content,
        confidence=confidence,
        priority=priority,
        evidence_json=json.dumps(evidence or []),
        thread_id=thread_id,
        execution_id=execution_id,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)

    # Publish for real-time WebSocket observation
    if execution_id:
        await publish(execution_id, {
            "type": "agent_message",
            "id": message.id,
            "sender": sender,
            "receiver": receiver,
            "intent": intent,
            "content": content,
            "confidence": confidence,
            "priority": priority,
            "evidence": evidence or [],
            "thread_id": thread_id,
            "timestamp": message.created_at.isoformat(),
        })

    logger.info(
        "Agent %s → %s [%s] (confidence=%.0f): %s",
        sender, receiver, intent, confidence, content[:80],
    )
    return message


async def get_inbox(
    db: AsyncSession,
    workspace_id: str,
    agent_key: str,
    *,
    limit: int = 20,
    unread_only: bool = False,
) -> list[AgentMessage]:
    """Get messages sent to a specific agent."""
    stmt = (
        select(AgentMessage)
        .where(
            AgentMessage.workspace_id == workspace_id,
            AgentMessage.receiver == agent_key,
        )
        .order_by(AgentMessage.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_thread(
    db: AsyncSession,
    workspace_id: str,
    thread_id: str,
) -> list[AgentMessage]:
    """Get all messages in a conversation thread, ordered chronologically."""
    result = await db.execute(
        select(AgentMessage)
        .where(
            AgentMessage.workspace_id == workspace_id,
            AgentMessage.thread_id == thread_id,
        )
        .order_by(AgentMessage.created_at.asc())
    )
    return list(result.scalars().all())


async def get_execution_messages(
    db: AsyncSession,
    workspace_id: str,
    execution_id: str,
) -> list[AgentMessage]:
    """Get all inter-agent messages for a specific execution (analysis run)."""
    result = await db.execute(
        select(AgentMessage)
        .where(
            AgentMessage.workspace_id == workspace_id,
            AgentMessage.execution_id == execution_id,
        )
        .order_by(AgentMessage.created_at.asc())
    )
    return list(result.scalars().all())


async def get_recent_messages(
    db: AsyncSession,
    workspace_id: str,
    *,
    limit: int = 50,
) -> list[AgentMessage]:
    """Get the most recent inter-agent messages across all agents."""
    result = await db.execute(
        select(AgentMessage)
        .where(AgentMessage.workspace_id == workspace_id)
        .order_by(AgentMessage.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())
