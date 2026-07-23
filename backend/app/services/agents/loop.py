import asyncio
import logging
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.tenant import Organization
from app.services.agents.base import AGENT_REGISTRY
from app.services.agents import task_engine
from app.services.memory import memory_engine
from app.services.insights.aggregation import get_dashboard_metrics
from app.api.ws import ws_manager

logger = logging.getLogger("crewmind.agent_loop")

async def process_organization(workspace_id: str) -> None:
    """Process pending tasks and consolidate memory for a single organization."""
    async with AsyncSessionLocal() as db:
        # 1. Sweep and Consolidate memory (opportunistically do this every time we process the org)
        try:
            await memory_engine.consolidate(db, workspace_id)
            await memory_engine.expire(db, workspace_id)
        except Exception as e:
            logger.error(f"Error during memory consolidation for org {workspace_id}: {e}", exc_info=True)

        # 1.5. Cluster unassigned memories into topics
        try:
            from app.services.knowledge import knowledge_engine
            await knowledge_engine.cluster_memories(db, workspace_id)
        except Exception as e:
            logger.error(f"Error during memory clustering for org {workspace_id}: {e}", exc_info=True)

        # 2. Pluck tasks for idle agents
        for agent_key, agent in AGENT_REGISTRY.items():
            # Check if agent is already busy (has a 'running' task)
            stats = await task_engine.get_queue_stats(db, workspace_id, agent_key)
            if stats.get("running", 0) > 0:
                continue  # Agent is busy, skip

            # Try to dequeue the next task
            task = await task_engine.dequeue(db, workspace_id, agent_key)
            if not task:
                continue  # No tasks queued

            logger.info(f"Agent '{agent_key}' picked up task '{task.title}' for org {workspace_id}")
            try:
                # We'll spawn it as an asyncio task so the loop can keep going.
                asyncio.create_task(run_agent_task(workspace_id, agent_key, task.id, task.title, task.description))
            except Exception as e:
                logger.error(f"Failed to kick off task {task.id}: {e}", exc_info=True)

        # Broadcast live dashboard metrics
        try:
            metrics = await get_dashboard_metrics(db, workspace_id)
            await ws_manager.broadcast(workspace_id, {
                "type": "dashboard_metrics",
                "metrics": metrics
            })
        except Exception as e:
            logger.error(f"Failed to broadcast metrics for org {workspace_id}: {e}", exc_info=True)


async def run_agent_task(workspace_id: str, agent_key: str, task_id: str, title: str, description: str) -> None:
    """Run an agent task in the background with its own DB session."""
    agent = AGENT_REGISTRY.get(agent_key)
    if not agent:
        return
    
    async with AsyncSessionLocal() as db:
        try:
            message = f"{title}\n\n{description}" if description else title
            result = await agent.run(db, workspace_id, message)
            await task_engine.complete(db, task_id, result_json=result)
        except Exception as e:
            logger.error(f"Error in background task {task_id}: {e}", exc_info=True)
            await task_engine.fail(db, task_id, str(e))


async def run_autonomous_loop() -> None:
    """The main background loop that runs continuously."""
    logger.info("Starting autonomous agent loop...")
    while True:
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Organization.id))
                workspace_ids = result.scalars().all()
            
            for workspace_id in workspace_ids:
                await process_organization(workspace_id)
                
        except Exception as e:
            logger.error(f"Error in autonomous loop: {e}", exc_info=True)
        
        # Poll every 10 seconds
        await asyncio.sleep(10)
