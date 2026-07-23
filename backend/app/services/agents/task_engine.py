"""Agent task queue engine.

Each executive owns a queue of tasks.  Tasks can be created manually,
spawned by workflows, or generated autonomously by agents.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent_task import AgentTask
from app.models.mixins import utcnow

logger = logging.getLogger("crewmind.task_engine")

# Default task templates per agent — seed the queue when an org is created.
DEFAULT_TASKS: dict[str, list[dict]] = {
    "research": [
        {"title": "Analyze competitors", "description": "Identify and profile key competitors, their strengths, weaknesses, and recent moves.", "priority": 3},
        {"title": "Monitor market trends", "description": "Track industry trends, market shifts, and emerging opportunities.", "priority": 3},
        {"title": "Industry news scan", "description": "Review recent industry news and publications for relevant signals.", "priority": 2},
        {"title": "Customer sentiment analysis", "description": "Assess customer feedback, reviews, and social media sentiment.", "priority": 2},
    ],
    "finance": [
        {"title": "Revenue forecast", "description": "Project revenue for next quarter based on current trends and pipeline.", "priority": 4},
        {"title": "Cash runway analysis", "description": "Calculate current burn rate and remaining runway.", "priority": 4},
        {"title": "Burn rate review", "description": "Break down operational costs and identify optimization opportunities.", "priority": 3},
        {"title": "Pricing analysis", "description": "Evaluate current pricing strategy against market and margins.", "priority": 3},
    ],
    "operations": [
        {"title": "Team utilization review", "description": "Assess team capacity, workload distribution, and bottlenecks.", "priority": 3},
        {"title": "Delivery risk assessment", "description": "Identify projects or deliverables at risk of delay.", "priority": 4},
        {"title": "Resource planning", "description": "Plan resource allocation for upcoming quarter.", "priority": 3},
        {"title": "Process efficiency audit", "description": "Review key workflows for improvement opportunities.", "priority": 2},
    ],
    "legal": [
        {"title": "Compliance review", "description": "Check current compliance status across applicable regulations.", "priority": 4},
        {"title": "Contract audit", "description": "Review active contracts for risks, renewals, and unfavorable terms.", "priority": 3},
        {"title": "Privacy assessment", "description": "Review data handling and privacy practices.", "priority": 3},
        {"title": "IP protection check", "description": "Verify intellectual property protections are current.", "priority": 2},
    ],
    "strategy": [
        {"title": "Executive summary", "description": "Synthesize the current state of the business for leadership.", "priority": 4},
        {"title": "Strategic planning", "description": "Develop strategic priorities for the next quarter.", "priority": 4},
        {"title": "Growth opportunity analysis", "description": "Identify and evaluate growth opportunities.", "priority": 3},
        {"title": "SWOT analysis", "description": "Update the company's strengths, weaknesses, opportunities, and threats.", "priority": 3},
    ],
}


async def enqueue(
    db: AsyncSession,
    workspace_id: str,
    agent_key: str,
    title: str,
    description: str = "",
    *,
    priority: int = 3,
    source: str = "manual",
    due_at: datetime | None = None,
    parent_task_id: str | None = None,
) -> AgentTask:
    """Add a task to an agent's queue."""
    task = AgentTask(
        workspace_id=workspace_id,
        agent_key=agent_key,
        title=title,
        description=description,
        priority=priority,
        source=source,
        due_at=due_at,
        parent_task_id=parent_task_id,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    logger.info("Enqueued task '%s' for %s (workspace=%s)", title, agent_key, workspace_id)
    return task


async def dequeue(db: AsyncSession, workspace_id: str, agent_key: str) -> AgentTask | None:
    """Get the highest-priority queued task for an agent and mark it running."""
    result = await db.execute(
        select(AgentTask)
        .where(
            AgentTask.workspace_id == workspace_id,
            AgentTask.agent_key == agent_key,
            AgentTask.status == "queued",
        )
        .order_by(AgentTask.priority.desc(), AgentTask.created_at.asc())
        .limit(1)
    )
    task = result.scalar_one_or_none()
    if task is not None:
        task.status = "running"
        task.started_at = utcnow()
        await db.commit()
    return task


async def complete(
    db: AsyncSession, task_id: str, result_json: str | None = None
) -> AgentTask | None:
    """Mark a task as completed with an optional result."""
    task = await db.get(AgentTask, task_id)
    if task is None:
        return None
    task.status = "completed"
    task.completed_at = utcnow()
    task.result_json = result_json
    await db.commit()
    return task


async def fail(
    db: AsyncSession, task_id: str, error_message: str
) -> AgentTask | None:
    """Mark a task as failed."""
    task = await db.get(AgentTask, task_id)
    if task is None:
        return None
    task.status = "failed"
    task.completed_at = utcnow()
    task.error_message = error_message
    await db.commit()
    return task


async def list_tasks(
    db: AsyncSession,
    workspace_id: str,
    agent_key: str | None = None,
    *,
    status: str | None = None,
    limit: int = 50,
) -> list[AgentTask]:
    """List tasks, optionally filtered by agent and/or status."""
    stmt = select(AgentTask).where(AgentTask.workspace_id == workspace_id)
    if agent_key:
        stmt = stmt.where(AgentTask.agent_key == agent_key)
    if status:
        stmt = stmt.where(AgentTask.status == status)
    stmt = stmt.order_by(AgentTask.priority.desc(), AgentTask.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_queue_stats(
    db: AsyncSession, workspace_id: str, agent_key: str
) -> dict:
    """Get task queue statistics for an agent."""
    result = await db.execute(
        select(AgentTask.status, func.count(AgentTask.id))
        .where(AgentTask.workspace_id == workspace_id, AgentTask.agent_key == agent_key)
        .group_by(AgentTask.status)
    )
    counts = dict(result.all())
    return {
        "queued": counts.get("queued", 0),
        "running": counts.get("running", 0),
        "completed": counts.get("completed", 0),
        "failed": counts.get("failed", 0),
        "total": sum(counts.values()),
    }


async def seed_default_tasks(db: AsyncSession, workspace_id: str) -> int:
    """Seed default tasks for all agents in a new workspace. Returns count created."""
    count = 0
    for agent_key, templates in DEFAULT_TASKS.items():
        for tmpl in templates:
            await enqueue(
                db, workspace_id, agent_key,
                title=tmpl["title"],
                description=tmpl["description"],
                priority=tmpl["priority"],
                source="system",
            )
            count += 1
    return count
