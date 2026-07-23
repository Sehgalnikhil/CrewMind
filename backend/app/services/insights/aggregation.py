import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.agent_task import AgentTask
from app.models.memory import MemoryRecord
from app.models.agent_state import AgentState
from app.models.topic import Topic
from app.models.agent_message import AgentMessage

async def get_dashboard_metrics(db: AsyncSession, workspace_id: str) -> dict:
    # 1. Total active tasks (queued or running)
    tasks_query = await db.execute(
        select(func.count(AgentTask.id)).where(
            AgentTask.workspace_id == workspace_id,
            AgentTask.status.in_(["queued", "running"])
        )
    )
    active_tasks = tasks_query.scalar() or 0
    
    # Total failed tasks for risk radar
    failed_tasks_query = await db.execute(
        select(func.count(AgentTask.id)).where(
            AgentTask.workspace_id == workspace_id,
            AgentTask.status == "failed"
        )
    )
    failed_tasks = failed_tasks_query.scalar() or 0

    # 2. Total memories and topics (Knowledge Graph size)
    memories_query = await db.execute(
        select(func.count(MemoryRecord.id)).where(MemoryRecord.workspace_id == workspace_id)
    )
    total_memories = memories_query.scalar() or 0

    topics_query = await db.execute(
        select(func.count(Topic.id)).where(Topic.workspace_id == workspace_id)
    )
    total_topics = topics_query.scalar() or 0

    # 3. Agent Utilization (number of agents with non-idle state)
    # Get count per agent
    agent_counts_query = await db.execute(
        select(AgentTask.agent_key, func.count(AgentTask.id)).where(
            AgentTask.workspace_id == workspace_id,
            AgentTask.status == "running"
        ).group_by(AgentTask.agent_key)
    )
    agent_counts = agent_counts_query.all()
    
    active_agents = len(agent_counts)
    utilization_pct = min(100, int((active_agents / 5.0) * 100)) # 5 agents

    agent_utilization = {
        "research": 10,
        "strategy": 10,
        "finance": 10,
        "operations": 10,
        "legal": 10,
    }
    # For a real feel, just base it on the active agents
    for row in agent_counts:
        agent_key = row[0]
        count = row[1]
        agent_utilization[agent_key] = min(100, 10 + count * 20)

    # 4. Message volume (communication overhead)
    messages_query = await db.execute(
        select(func.count(AgentMessage.id)).where(AgentMessage.workspace_id == workspace_id)
    )
    total_messages = messages_query.scalar() or 0

    # 5. Estimated Token Burn (mocked based on messages & memories for now)
    estimated_tokens = (total_messages * 150) + (total_memories * 300)
    estimated_cost = (estimated_tokens / 1000) * 0.015 # roughly $0.015 per 1k tokens

    return {
        "active_tasks": active_tasks,
        "failed_tasks": failed_tasks,
        "total_memories": total_memories,
        "total_topics": total_topics,
        "active_agents": active_agents,
        "utilization_pct": utilization_pct,
        "agent_utilization": agent_utilization,
        "total_messages": total_messages,
        "estimated_cost_usd": round(estimated_cost, 2),
        "total_tokens": estimated_tokens
    }
