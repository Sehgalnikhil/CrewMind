from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.api.deps import CurrentMember
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
    member: CurrentMember,
) -> WarRoomSessionDetailResponse:
    """Create a new mocked War Room session with its turns for playback."""
    async with AsyncSessionLocal() as db:
        session = WarRoomSession(
            workspace_id=member.workspace_id,
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
async def list_war_room_sessions(member: CurrentMember) -> list[WarRoomSession]:
    """List all war room sessions for the current workspace."""
    async with AsyncSessionLocal() as db:
        stmt = (
            select(WarRoomSession)
            .where(WarRoomSession.workspace_id == member.workspace_id)
            .order_by(WarRoomSession.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())


@router.get("/{session_id}", response_model=WarRoomSessionDetailResponse)
async def get_war_room_session(session_id: str, member: CurrentMember) -> WarRoomSession:
    """Get a specific war room session with all turns."""
    async with AsyncSessionLocal() as db:
        stmt = (
            select(WarRoomSession)
            .options(selectinload(WarRoomSession.turns))
            .where(
                WarRoomSession.id == session_id,
                WarRoomSession.workspace_id == member.workspace_id,
            )
        )
        result = await db.execute(stmt)
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session
