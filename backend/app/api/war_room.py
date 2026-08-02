from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.api.deps import RequestContext, get_request_context
from app.models.war_room import WarRoomSession, WarRoomTurn
from app.schemas.war_room import (
    WarRoomSessionCreate,
    WarRoomSessionDetailResponse,
    WarRoomSessionResponse,
)

router = APIRouter()


@router.post("", response_model=WarRoomSessionDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_war_room_session(
    payload: WarRoomSessionCreate,
    ctx: RequestContext = Depends(get_request_context),
) -> WarRoomSessionDetailResponse:
    """Create a new mocked War Room session with its turns for playback."""
    async with AsyncSessionLocal() as db:
        session = WarRoomSession(
            workspace_id=ctx.workspace.id,
            question=payload.question,
            verdict_json=payload.verdict,
            status="running",
        )
        db.add(session)
        await db.flush()

        for idx, t in enumerate(payload.turns):
            turn = WarRoomTurn(
                session_id=session.id,
                turn_index=idx,
                is_user=t.is_user,
                speaker=t.speaker,
                responding_to=t.responding_to,
                phase=t.phase,
                reasoning=t.reasoning,
                text=t.text,
                stance=t.stance,
                confidence=t.confidence,
                evidence_json=t.evidence,
            )
            db.add(turn)

        await db.commit()
        await db.refresh(session)
        
        # Load turns for response
        stmt = (
            select(WarRoomSession)
            .options(selectinload(WarRoomSession.turns))
            .where(WarRoomSession.id == session.id)
        )
        result = await db.execute(stmt)
        return result.scalar_one()


@router.get("", response_model=list[WarRoomSessionResponse])
async def list_war_room_sessions(ctx: RequestContext = Depends(get_request_context)) -> list[WarRoomSession]:
    """List all war room sessions for the current workspace."""
    async with AsyncSessionLocal() as db:
        stmt = (
            select(WarRoomSession)
            .where(WarRoomSession.workspace_id == ctx.workspace.id)
            .order_by(WarRoomSession.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())


@router.get("/{session_id}", response_model=WarRoomSessionDetailResponse)
async def get_war_room_session(session_id: str, ctx: RequestContext = Depends(get_request_context)) -> WarRoomSession:
    """Get a specific war room session with all turns."""
    async with AsyncSessionLocal() as db:
        stmt = (
            select(WarRoomSession)
            .options(selectinload(WarRoomSession.turns))
            .where(
                WarRoomSession.id == session_id,
                WarRoomSession.workspace_id == ctx.workspace.id,
            )
        )
        result = await db.execute(stmt)
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session


from app.schemas.war_room import VoiceCommandRequest, VoiceCommandResponse
from app.services.llm.gemini_client import chat

@router.post("/voice-command", response_model=VoiceCommandResponse)
async def handle_voice_command(
    payload: VoiceCommandRequest,
    ctx: RequestContext = Depends(get_request_context),
) -> VoiceCommandResponse:
    """Parse a voice command into updated scenario levers using Gemini."""
    system_prompt = (
        "You are Atlas, the AI Executive Assistant for Crewmind. Your job is to parse voice commands "
        "and update the current scenario levers. Return a valid JSON object matching the requested schema.\n"
        "Lever constraints:\n"
        "- priceChange: -20 to 30 (%)\n"
        "- headcount: -5 to 15\n"
        "- marketing: 50 to 300 (K/mo)\n"
        "- churn: 1 to 6 (%)\n"
        "- euEntry: true/false\n"
    )
    
    user_prompt = (
        f"Current Levers: {payload.current_levers.model_dump_json()}\n"
        f"User Voice Command: '{payload.transcript}'\n\n"
        "Adjust the levers accordingly and provide a short, confident acknowledgement in `understood_command` (e.g., 'Cutting marketing by 50K and entering the EU market.')."
    )
    
    raw_response = await chat(
        system=system_prompt,
        user_message=user_prompt,
        response_schema=VoiceCommandResponse,
    )
    
    import json
    try:
        data = json.loads(raw_response)
        return VoiceCommandResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to parse LLM response")
