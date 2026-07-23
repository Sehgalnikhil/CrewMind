from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import RequestContext, get_request_context
from app.core.database import get_db
from app.models.conversation import Conversation, Message
from app.schemas.chat import ConversationCreateRequest, ConversationResponse, MessageResponse
from app.services.agents import AGENT_REGISTRY

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/conversations", response_model=ConversationResponse, status_code=201)
async def create_conversation(
    payload: ConversationCreateRequest,
    ctx: RequestContext = Depends(get_request_context),
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

    workspace_id = ctx.workspace.id if ctx.workspace else None
    conversation = Conversation(
        workspace_id=workspace_id,
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
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> list[ConversationResponse]:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    result = await db.execute(
        select(Conversation)
        .where(Conversation.workspace_id == workspace_id)
        .order_by(Conversation.created_at.desc())
    )
    return [ConversationResponse.model_validate(c) for c in result.scalars().all()]


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def list_messages(
    conversation_id: str,
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> list[MessageResponse]:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    conversation = await db.get(Conversation, conversation_id)
    if conversation is None or conversation.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    return [MessageResponse.model_validate(m) for m in result.scalars().all()]
