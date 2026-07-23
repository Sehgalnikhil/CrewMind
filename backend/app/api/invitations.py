from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import secrets

from app.api.deps import RequestContext, get_request_context, RequiresPermission
from app.core.database import get_db
from app.models.security import WorkspaceInvitation
from app.models.rbac import OrganizationMember, Role
from app.models.user import User

router = APIRouter(prefix="/api/invitations", tags=["invitations"])


class InviteRequest(BaseModel):
    email: EmailStr
    role_id: str


class InviteResponse(BaseModel):
    id: str
    email: str
    token: str # Normally we'd email this, but we return it for testing


class AcceptInviteRequest(BaseModel):
    token: str


@router.post("", response_model=InviteResponse, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    payload: InviteRequest,
    ctx: RequestContext = Depends(RequiresPermission("users.invite")),
    db: AsyncSession = Depends(get_db)
) -> InviteResponse:
    if not ctx.workspace:
        raise HTTPException(status_code=400, detail="Workspace context required")
        
    # Check if role exists
    role = await db.get(Role, payload.role_id)
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    raw_token = secrets.token_urlsafe(32)
    from app.core.security import hash_token
    token_hash = hash_token(raw_token)
    
    invitation = WorkspaceInvitation(
        workspace_id=ctx.workspace.id,
        email=payload.email,
        role_id=payload.role_id,
        invited_by=ctx.user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    db.add(invitation)
    await db.commit()
    
    from app.core.audit import log_audit_event
    await log_audit_event(
        db,
        workspace_id=ctx.workspace.id,
        user_id=ctx.user.id,
        action="invitation.sent",
        resource_type="workspace",
        resource_id=ctx.workspace.id,
        details={"email": payload.email, "role": role.name}
    )
    
    return InviteResponse(id=invitation.id, email=invitation.email, token=raw_token)


@router.post("/accept", status_code=status.HTTP_200_OK)
async def accept_invitation(
    payload: AcceptInviteRequest,
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db)
) -> dict:
    from app.core.security import hash_token
    token_hash = hash_token(payload.token)
    
    result = await db.execute(select(WorkspaceInvitation).where(WorkspaceInvitation.token_hash == token_hash))
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found or invalid")
        
    if invitation.accepted_at:
        raise HTTPException(status_code=400, detail="Invitation already accepted")
        
    expires_at = invitation.expires_at
    if expires_at.tzinfo is None:  # SQLite stores naive UTC timestamps
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invitation expired")
        
    if invitation.email != ctx.user.email:
        raise HTTPException(status_code=403, detail="Email mismatch")
        
    # Add to workspace
    from app.models.tenant import Workspace
    target_workspace = await db.get(Workspace, invitation.workspace_id)
    if target_workspace is None:
        raise HTTPException(status_code=404, detail="Workspace no longer exists")
    member = OrganizationMember(
        user_id=ctx.user.id,
        org_id=target_workspace.org_id,
        workspace_id=invitation.workspace_id,
        role_id=invitation.role_id
    )
    db.add(member)
    
    invitation.accepted_at = datetime.now(timezone.utc)
    await db.commit()
    
    from app.core.audit import log_audit_event
    await log_audit_event(
        db,
        workspace_id=invitation.workspace_id,
        user_id=ctx.user.id,
        action="invitation.accepted",
        resource_type="workspace",
        resource_id=invitation.workspace_id
    )
    
    return {"status": "success", "workspace_id": invitation.workspace_id}


@router.delete("/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_invitation(
    invitation_id: str,
    ctx: RequestContext = Depends(RequiresPermission("users.invite")),
    db: AsyncSession = Depends(get_db)
) -> None:
    if not ctx.workspace:
        raise HTTPException(status_code=400, detail="Workspace context required")
        
    invitation = await db.get(WorkspaceInvitation, invitation_id)
    if not invitation or invitation.workspace_id != ctx.workspace.id:
        raise HTTPException(status_code=404, detail="Invitation not found")
        
    await db.delete(invitation)
    await db.commit()
    
    from app.core.audit import log_audit_event
    await log_audit_event(
        db,
        workspace_id=ctx.workspace.id,
        user_id=ctx.user.id,
        action="invitation.revoked",
        resource_type="workspace",
        resource_id=ctx.workspace.id,
        details={"email": invitation.email}
    )
