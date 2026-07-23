from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import secrets

from app.api.deps import RequestContext, get_request_context, RequiresPermission
from app.core.database import get_db
from app.models.security import APIKey
from app.core.security import hash_token

router = APIRouter(prefix="/api/keys", tags=["api_keys"])


class CreateAPIKeyRequest(BaseModel):
    name: str
    expires_in_days: int | None = None
    permissions: list[str] | None = None


class APIKeyCreatedResponse(BaseModel):
    id: str
    name: str
    key: str # Only returned once
    expires_at: datetime | None


class APIKeyResponse(BaseModel):
    id: str
    name: str
    permissions: list[str] | None
    last_used_at: datetime | None
    expires_at: datetime | None
    created_at: datetime


@router.post("", response_model=APIKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    payload: CreateAPIKeyRequest,
    ctx: RequestContext = Depends(RequiresPermission("workspace.manage")),
    db: AsyncSession = Depends(get_db)
) -> APIKeyCreatedResponse:
    if not ctx.workspace:
        raise HTTPException(status_code=400, detail="Workspace context required")
        
    raw_key = f"cm_live_{secrets.token_urlsafe(32)}"
    key_hash = hash_token(raw_key)
    
    expires_at = None
    if payload.expires_in_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=payload.expires_in_days)
        
    api_key = APIKey(
        workspace_id=ctx.workspace.id,
        created_by=ctx.user.id,
        name=payload.name,
        key_hash=key_hash,
        permissions=payload.permissions,
        expires_at=expires_at
    )
    db.add(api_key)
    await db.commit()
    
    from app.core.audit import log_audit_event
    await log_audit_event(
        db,
        workspace_id=ctx.workspace.id,
        user_id=ctx.user.id,
        action="api_key.created",
        resource_type="workspace",
        resource_id=ctx.workspace.id,
        details={"name": payload.name}
    )
    
    return APIKeyCreatedResponse(
        id=api_key.id,
        name=api_key.name,
        key=raw_key,
        expires_at=api_key.expires_at
    )


@router.get("", response_model=list[APIKeyResponse])
async def list_api_keys(
    ctx: RequestContext = Depends(RequiresPermission("workspace.read")),
    db: AsyncSession = Depends(get_db)
) -> list[APIKeyResponse]:
    if not ctx.workspace:
        raise HTTPException(status_code=400, detail="Workspace context required")
        
    result = await db.execute(
        select(APIKey)
        .where(APIKey.workspace_id == ctx.workspace.id)
        .order_by(APIKey.created_at.desc())
    )
    keys = result.scalars().all()
    
    return [
        APIKeyResponse(
            id=k.id,
            name=k.name,
            permissions=k.permissions,
            last_used_at=k.last_used_at,
            expires_at=k.expires_at,
            created_at=k.created_at
        )
        for k in keys
    ]


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: str,
    ctx: RequestContext = Depends(RequiresPermission("workspace.manage")),
    db: AsyncSession = Depends(get_db)
) -> None:
    if not ctx.workspace:
        raise HTTPException(status_code=400, detail="Workspace context required")
        
    key = await db.get(APIKey, key_id)
    if not key or key.workspace_id != ctx.workspace.id:
        raise HTTPException(status_code=404, detail="API key not found")
        
    await db.delete(key)
    await db.commit()
    
    from app.core.audit import log_audit_event
    await log_audit_event(
        db,
        workspace_id=ctx.workspace.id,
        user_id=ctx.user.id,
        action="api_key.revoked",
        resource_type="workspace",
        resource_id=ctx.workspace.id,
        details={"name": key.name}
    )
