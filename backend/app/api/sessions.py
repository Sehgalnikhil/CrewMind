from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import RequestContext, get_request_context
from app.core.database import get_db
from app.models.security import UserSession, RefreshToken

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class SessionResponse(BaseModel):
    id: str
    device_name: str | None
    device_type: str | None
    browser: str | None
    os: str | None
    ip_address: str | None
    location: str | None
    last_active_at: datetime | None
    status: str
    is_current: bool = False


@router.get("", response_model=list[SessionResponse])
async def list_sessions(
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db)
) -> list[SessionResponse]:
    result = await db.execute(
        select(UserSession)
        .where(UserSession.user_id == ctx.user.id)
        .where(UserSession.status == "active")
        .order_by(UserSession.last_active_at.desc())
    )
    sessions = result.scalars().all()
    
    current_session_id = ctx.user._token_payload.get("session_id") if hasattr(ctx.user, "_token_payload") else None
    
    responses = []
    for s in sessions:
        responses.append(SessionResponse(
            id=s.id,
            device_name=s.device_name,
            device_type=s.device_type,
            browser=s.browser,
            os=s.os,
            ip_address=s.ip_address,
            location=s.location,
            last_active_at=s.last_active_at,
            status=s.status,
            is_current=(s.id == current_session_id)
        ))
        
    return responses


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_session(
    session_id: str,
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db)
) -> None:
    session = await db.get(UserSession, session_id)
    if not session or session.user_id != ctx.user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.status = "revoked"
    
    # Also revoke associated refresh tokens
    refresh_result = await db.execute(
        select(RefreshToken)
        .where(RefreshToken.session_id == session_id)
        .where(RefreshToken.revoked_at.is_(None))
    )
    refresh_tokens = refresh_result.scalars().all()
    now = datetime.now(timezone.utc)
    for rt in refresh_tokens:
        rt.revoked_at = now
        
    await db.commit()
    
    from app.core.audit import log_audit_event
    await log_audit_event(
        db,
        workspace_id=ctx.workspace.id if ctx.workspace else "none",
        user_id=ctx.user.id,
        action="session.revoked",
        resource_type="session",
        resource_id=session_id
    )


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_all_other_sessions(
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db)
) -> None:
    current_session_id = ctx.user._token_payload.get("session_id") if hasattr(ctx.user, "_token_payload") else None
    
    if not current_session_id:
        raise HTTPException(status_code=400, detail="Cannot identify current session")
        
    result = await db.execute(
        select(UserSession)
        .where(UserSession.user_id == ctx.user.id)
        .where(UserSession.status == "active")
        .where(UserSession.id != current_session_id)
    )
    other_sessions = result.scalars().all()
    
    now = datetime.now(timezone.utc)
    for s in other_sessions:
        s.status = "revoked"
        
        # Revoke tokens
        refresh_result = await db.execute(
            select(RefreshToken)
            .where(RefreshToken.session_id == s.id)
            .where(RefreshToken.revoked_at.is_(None))
        )
        refresh_tokens = refresh_result.scalars().all()
        for rt in refresh_tokens:
            rt.revoked_at = now
            
    await db.commit()
    
    from app.core.audit import log_audit_event
    await log_audit_event(
        db,
        workspace_id=ctx.workspace.id if ctx.workspace else "none",
        user_id=ctx.user.id,
        action="session.revoked_others",
        resource_type="user",
        resource_id=ctx.user.id
    )
