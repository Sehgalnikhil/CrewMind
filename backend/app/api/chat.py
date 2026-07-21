from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_org
from app.core.database import get_db
from app.models.conversation import Conversation, Message
from app.models.organization import Organization
from app.schemas.chat import ConversationCreateRequest, ConversationResponse, MessageResponse
from app.services.agents import AGENT_REGISTRY

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/conversations", response_model=ConversationResponse, status_code=201)
async def create_conversation(
    payload: ConversationCreateRequest,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    if payload.mode == "single_agent":
        if payload.agent_key not in AGENT_REGISTRY:
            raise HTTPException(status_code=400, detail=f"Unknown agent: {payload.agent_key}")
        agent = AGENT_REGISTRY[payload.agent_key]
        default_title = f"Chat with {agent.name}"
    elif payload.mode == "all_agents":
        default_title = "Chat with the whole crew"
    else:
        raise HTTPException(status_code=400, detail=f"Unknown conversation mode: {payload.mode}")

    conversation = Conversation(
        org_id=org.id,
        title=payload.title or default_title,
        mode=payload.mode,
        agent_key=payload.agent_key if payload.mode == "single_agent" else None,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return ConversationResponse.model_validate(conversation)


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> list[ConversationResponse]:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.org_id == org.id)
        .order_by(Conversation.created_at.desc())
    )
    return [ConversationResponse.model_validate(c) for c in result.scalars().all()]


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def list_messages(
    conversation_id: str,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> list[MessageResponse]:
    conversation = await db.get(Conversation, conversation_id)
    if conversation is None or conversation.org_id != org.id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    return [MessageResponse.model_validate(m) for m in result.scalars().all()]
