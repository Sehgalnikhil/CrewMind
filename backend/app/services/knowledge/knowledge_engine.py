import json
import logging
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.memory import MemoryRecord
from app.models.topic import Topic
from app.services.llm.gemini_client import chat

logger = logging.getLogger("crewmind.knowledge")

class TopicMappingResult(BaseModel):
    suggested_topic_name: str = Field(description="The name of the topic this memory belongs to. Can be a new topic or an existing one.")
    topic_description: str = Field(description="A brief description of the topic.")

async def cluster_memories(db: AsyncSession, workspace_id: str) -> None:
    """Finds memories that don't belong to any topic and assigns them."""
    
    # Get unassigned memories
    # We do a LEFT JOIN to memory_topic_links and check where it's NULL, 
    # but since SQLAlchemy makes this a bit verbose, we can just load all memories without topics.
    stmt = select(MemoryRecord).where(~MemoryRecord.topics.any()).where(MemoryRecord.workspace_id == workspace_id).limit(10)
    result = await db.execute(stmt)
    unassigned_memories = result.scalars().all()
    
    if not unassigned_memories:
        return
        
    # Get existing topics to guide the LLM
    topic_stmt = select(Topic).where(Topic.workspace_id == workspace_id)
    topic_result = await db.execute(topic_stmt)
    existing_topics = topic_result.scalars().all()
    existing_topics_str = "\n".join([f"- {t.name}: {t.description}" for t in existing_topics])
    
    system_prompt = f"""You are a Knowledge Graph extraction engine.
Given a memory record, you must assign it to a topic.
Here are the existing topics in the organization's brain map:
{existing_topics_str if existing_topics else "None yet."}

If the memory fits nicely into one of the existing topics, return that topic's exact name.
If it represents a distinctly new concept, create a new topic name (keep it 1-4 words).
"""

    for memory in unassigned_memories:
        user_msg = f"Memory Title: {memory.title}\nContent: {memory.content}\nKind: {memory.kind}"
        try:
            res_json = await chat(
                system=system_prompt,
                user_message=user_msg,
                response_schema=TopicMappingResult
            )
            mapping = TopicMappingResult.model_validate_json(res_json)
            
            # Find or create topic
            topic = next((t for t in existing_topics if t.name.lower() == mapping.suggested_topic_name.lower()), None)
            
            if not topic:
                topic = Topic(
                    workspace_id=workspace_id,
                    name=mapping.suggested_topic_name,
                    description=mapping.topic_description
                )
                db.add(topic)
                existing_topics.append(topic)
                
            memory.topics.append(topic)
            await db.commit()
            logger.info(f"Clustered memory {memory.id} into topic '{topic.name}'")
            
        except Exception as e:
            logger.error(f"Failed to cluster memory {memory.id}: {e}", exc_info=True)
            await db.rollback()


class WikiGenerationResult(BaseModel):
    markdown_content: str = Field(description="The full markdown synthesized content for this corporate wiki page.")

async def generate_wiki_page(db: AsyncSession, workspace_id: str, topic_id: str) -> str | None:
    """Generates a markdown synthesis of all memories for a topic."""
    stmt = select(Topic).options(selectinload(Topic.memories)).where(Topic.id == topic_id, Topic.workspace_id == workspace_id)
    result = await db.execute(stmt)
    topic = result.scalar_one_or_none()
    
    if not topic or not topic.memories:
        return None
        
    system_prompt = """You are a Corporate Wiki synthesizer.
Your goal is to read a list of related memory records and synthesize them into a single, highly readable, structured Markdown document.
Organize the information logically with headers, bullet points, and highlight key decisions or metrics.
Do NOT just list the memories. Weave them together into a coherent knowledge base page.
"""

    user_msg = f"Topic: {topic.name}\nDescription: {topic.description}\n\nMemories:\n"
    for m in topic.memories:
        user_msg += f"- [{m.kind}] {m.title}: {m.content}\n"
        
    try:
        res_json = await chat(
            system=system_prompt,
            user_message=user_msg,
            response_schema=WikiGenerationResult
        )
        wiki = WikiGenerationResult.model_validate_json(res_json)
        
        topic.wiki_content = wiki.markdown_content
        await db.commit()
        
        return wiki.markdown_content
    except Exception as e:
        logger.error(f"Failed to generate wiki for topic {topic_id}: {e}", exc_info=True)
        return None
