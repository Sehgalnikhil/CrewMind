from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import json
import secrets

from app.api.deps import RequestContext, get_request_context, RequiresPermission
from app.core.database import get_db
from app.models.tenant import Organization
from app.models.security import OrganizationDomain

router = APIRouter(prefix="/api/organization", tags=["organization"])


class OrganizationSettingsResponse(BaseModel):
    require_mfa: bool = False
    allowed_domains: list[str] = []
    sso_required: bool = False
    session_duration_minutes: int = 1440
    password_policy: dict = {}


class UpdateSettingsRequest(BaseModel):
    require_mfa: bool | None = None
    allowed_domains: list[str] | None = None
    sso_required: bool | None = None
    session_duration_minutes: int | None = None
    password_policy: dict | None = None


@router.get("/settings", response_model=OrganizationSettingsResponse)
async def get_settings(
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db)
) -> OrganizationSettingsResponse:
    if not ctx.organization:
        raise HTTPException(status_code=400, detail="Organization context required")
        
    settings = {}
    if ctx.organization.settings:
        try:
            settings = json.loads(ctx.organization.settings)
        except Exception:
            pass
            
    return OrganizationSettingsResponse(**settings)


@router.put("/settings", response_model=OrganizationSettingsResponse)
async def update_settings(
    payload: UpdateSettingsRequest,
    ctx: RequestContext = Depends(RequiresPermission("organization.manage")),
    db: AsyncSession = Depends(get_db)
) -> OrganizationSettingsResponse:
    if not ctx.organization:
        raise HTTPException(status_code=400, detail="Organization context required")
        
    settings = {}
    if ctx.organization.settings:
        try:
            settings = json.loads(ctx.organization.settings)
        except Exception:
            pass
            
    update_data = payload.model_dump(exclude_unset=True)
    settings.update(update_data)
    
    ctx.organization.settings = json.dumps(settings)
    await db.commit()
    
    from app.core.audit import log_audit_event
    await log_audit_event(
        db,
        workspace_id=ctx.workspace.id if ctx.workspace else "none",
        user_id=ctx.user.id,
        action="organization.settings_updated",
        resource_type="organization",
        resource_id=ctx.organization.id
    )
    
    return OrganizationSettingsResponse(**settings)


class DomainRequest(BaseModel):
    domain: str

class DomainResponse(BaseModel):
    id: str
    domain: str
    verification_token: str
    verified_at: datetime | None


@router.post("/domains", response_model=DomainResponse, status_code=status.HTTP_201_CREATED)
async def add_domain(
    payload: DomainRequest,
    ctx: RequestContext = Depends(RequiresPermission("organization.manage")),
    db: AsyncSession = Depends(get_db)
) -> DomainResponse:
    if not ctx.organization:
        raise HTTPException(status_code=400, detail="Organization context required")
        
    # Check if domain exists
    result = await db.execute(select(OrganizationDomain).where(OrganizationDomain.domain == payload.domain))
    existing = result.scalar_one_or_none()
    
    if existing:
        if existing.organization_id != ctx.organization.id:
            raise HTTPException(status_code=400, detail="Domain claimed by another organization")
        return DomainResponse(
            id=existing.id,
            domain=existing.domain,
            verification_token=existing.verification_token,
            verified_at=existing.verified_at
        )
        
    token = secrets.token_hex(32)
    domain_record = OrganizationDomain(
        organization_id=ctx.organization.id,
        domain=payload.domain,
        verification_token=token
    )
    db.add(domain_record)
    await db.commit()
    
    return DomainResponse(
        id=domain_record.id,
        domain=domain_record.domain,
        verification_token=domain_record.verification_token,
        verified_at=domain_record.verified_at
    )


@router.post("/domains/{domain_id}/verify", response_model=DomainResponse)
async def verify_domain(
    domain_id: str,
    ctx: RequestContext = Depends(RequiresPermission("organization.manage")),
    db: AsyncSession = Depends(get_db)
) -> DomainResponse:
    if not ctx.organization:
        raise HTTPException(status_code=400, detail="Organization context required")
        
    domain_record = await db.get(OrganizationDomain, domain_id)
    if not domain_record or domain_record.organization_id != ctx.organization.id:
        raise HTTPException(status_code=404, detail="Domain not found")
        
    # Here we would normally check DNS TXT records for the verification_token
    # For now, we just mock the verification as successful
    domain_record.verified_at = datetime.now(timezone.utc)
    await db.commit()
    
    from app.core.audit import log_audit_event
    await log_audit_event(
        db,
        workspace_id=ctx.workspace.id if ctx.workspace else "none",
        user_id=ctx.user.id,
        action="domain.verified",
        resource_type="organization",
        resource_id=ctx.organization.id,
        details={"domain": domain_record.domain}
    )
    
    return DomainResponse(
        id=domain_record.id,
        domain=domain_record.domain,
        verification_token=domain_record.verification_token,
        verified_at=domain_record.verified_at
    )
