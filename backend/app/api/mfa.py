from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import pyotp
import json
import secrets

from app.api.deps import RequestContext, get_request_context
from app.core.database import get_db
from app.models.security import UserSecurity
from app.core.security import hash_token

router = APIRouter(prefix="/api/mfa", tags=["mfa"])

class MFASetupResponse(BaseModel):
    secret: str
    provisioning_uri: str
    
class MFAVerifyRequest(BaseModel):
    code: str

class MFAVerifyResponse(BaseModel):
    backup_codes: list[str]

class MFADisableRequest(BaseModel):
    code: str


@router.post("/setup", response_model=MFASetupResponse)
async def mfa_setup(
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db)
) -> MFASetupResponse:
    # First, get or create UserSecurity
    result = await db.execute(select(UserSecurity).where(UserSecurity.user_id == ctx.user.id))
    user_sec = result.scalar_one_or_none()
    
    if not user_sec:
        user_sec = UserSecurity(user_id=ctx.user.id)
        db.add(user_sec)
    
    if user_sec.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled")
        
    secret = pyotp.random_base32()
    user_sec.totp_secret = secret
    await db.commit()
    
    totp = pyotp.TOTP(secret)
    # Get organization name from context if available
    issuer_name = "CrewMind"
    if ctx.organization:
        issuer_name = f"CrewMind ({ctx.organization.name})"
        
    uri = totp.provisioning_uri(name=ctx.user.email, issuer_name=issuer_name)
    
    return MFASetupResponse(secret=secret, provisioning_uri=uri)


@router.post("/verify", response_model=MFAVerifyResponse)
async def mfa_verify(
    payload: MFAVerifyRequest,
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db)
) -> MFAVerifyResponse:
    result = await db.execute(select(UserSecurity).where(UserSecurity.user_id == ctx.user.id))
    user_sec = result.scalar_one_or_none()
    
    if not user_sec or not user_sec.totp_secret:
        raise HTTPException(status_code=400, detail="MFA setup not initiated")
        
    if user_sec.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled")
        
    totp = pyotp.TOTP(user_sec.totp_secret)
    if not totp.verify(payload.code):
        raise HTTPException(status_code=400, detail="Invalid MFA code")
        
    # Generate backup codes
    backup_codes = [secrets.token_hex(4) + "-" + secrets.token_hex(4) for _ in range(10)]
    hashed_codes = [hash_token(code) for code in backup_codes]
    
    user_sec.mfa_enabled = True
    user_sec.backup_codes = json.dumps(hashed_codes)
    await db.commit()
    
    from app.core.audit import log_audit_event
    await log_audit_event(
        db,
        workspace_id=ctx.workspace.id if ctx.workspace else "none",
        user_id=ctx.user.id,
        action="mfa.enabled",
        resource_type="user",
        resource_id=ctx.user.id
    )
    
    return MFAVerifyResponse(backup_codes=backup_codes)


@router.post("/disable", status_code=status.HTTP_204_NO_CONTENT)
async def mfa_disable(
    payload: MFADisableRequest,
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db)
) -> None:
    result = await db.execute(select(UserSecurity).where(UserSecurity.user_id == ctx.user.id))
    user_sec = result.scalar_one_or_none()
    
    if not user_sec or not user_sec.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is not enabled")
        
    # Verify code (either TOTP or backup)
    totp = pyotp.TOTP(user_sec.totp_secret)
    is_valid_totp = totp.verify(payload.code)
    
    is_valid_backup = False
    if not is_valid_totp and user_sec.backup_codes:
        code_hash = hash_token(payload.code)
        codes = json.loads(user_sec.backup_codes)
        if code_hash in codes:
            is_valid_backup = True
            codes.remove(code_hash)
            user_sec.backup_codes = json.dumps(codes)
            
    if not is_valid_totp and not is_valid_backup:
        raise HTTPException(status_code=400, detail="Invalid code")
        
    user_sec.mfa_enabled = False
    user_sec.totp_secret = None
    user_sec.backup_codes = None
    await db.commit()
    
    from app.core.audit import log_audit_event
    await log_audit_event(
        db,
        workspace_id=ctx.workspace.id if ctx.workspace else "none",
        user_id=ctx.user.id,
        action="mfa.disabled",
        resource_type="user",
        resource_id=ctx.user.id
    )
