import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import RequestContext, get_request_context
from app.core.database import get_db
from app.models.memory import MemoryRecord
from app.models.topic import Topic
from app.services.knowledge.knowledge_engine import generate_wiki_page

logger = logging.getLogger("crewmind.api.knowledge")
router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


@router.get("/topics")
async def list_topics(
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """Get all topics for a workspace."""
    workspace_id = ctx.workspace.id if ctx.workspace else None
    stmt = select(Topic).options(selectinload(Topic.memories)).where(Topic.workspace_id == workspace_id)
    result = await db.execute(stmt)
    topics = result.scalars().all()
    
    return [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "memory_count": len(t.memories),
        }
        for t in topics
    ]


@router.get("/graph")
async def get_knowledge_graph(
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> dict[str, list[dict[str, Any]]]:
    """Get nodes and links for the organizational brain map UI."""
    workspace_id = ctx.workspace.id if ctx.workspace else None
    stmt = select(Topic).options(selectinload(Topic.memories)).where(Topic.workspace_id == workspace_id)
    result = await db.execute(stmt)
    topics = result.scalars().all()
    
    nodes = []
    links = []
    
    for t in topics:
        # Add the Topic node (large node)
        nodes.append({
            "id": t.id,
            "name": t.name,
            "type": "topic",
            "val": 10 + len(t.memories)  # Size based on number of memories
        })
        
        for m in t.memories:
            # Only add memory node if it's not already in nodes (it might belong to multiple topics)
            if not any(n["id"] == m.id for n in nodes):
                nodes.append({
                    "id": m.id,
                    "name": m.title,
                    "type": "memory",
                    "val": 2  # Small node
                })
            
            # Link memory to topic
            links.append({
                "source": m.id,
                "target": t.id
            })
            
    return {"nodes": nodes, "links": links}


@router.get("/wiki/{topic_id}")
async def get_wiki_page(
    topic_id: str,
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Get or generate the wiki page for a specific topic."""
    workspace_id = ctx.workspace.id if ctx.workspace else None
    stmt = select(Topic).where(Topic.id == topic_id, Topic.workspace_id == workspace_id)
    result = await db.execute(stmt)
    topic = result.scalar_one_or_none()
    
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
        
    if not topic.wiki_content:
        # Generate on the fly
        content = await generate_wiki_page(db, workspace_id, topic_id)
        if not content:
            return {"content": "This topic has no memories yet."}
        return {"content": content}
        
    return {"content": topic.wiki_content}
