from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import RequestContext, get_current_user, get_request_context
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.tenant import Organization, Workspace
from app.models.rbac import Role, OrganizationMember
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest, 
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        hashed = hash_password(payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    user = User(
        email=payload.email,
        hashed_password=hashed,
        full_name=payload.full_name,
    )
    db.add(user)
    await db.flush()

    org = Organization(name=payload.organization_name)
    db.add(org)
    await db.flush()

    workspace = Workspace(name="General", org_id=org.id)
    db.add(workspace)
    await db.flush()

    # Find or create Owner role
    role_res = await db.execute(select(Role).where(Role.name == "Owner"))
    owner_role = role_res.scalar_one_or_none()
    if not owner_role:
        owner_role = Role(name="Owner", description="Full access", is_system=True)
        db.add(owner_role)
        await db.flush()

    member = OrganizationMember(
        user_id=user.id,
        org_id=org.id,
        workspace_id=workspace.id,
        role_id=owner_role.id
    )
    db.add(member)
    await db.commit()

    from app.models.security import UserSecurity, UserSession, RefreshToken
    from app.core.security import generate_refresh_token, hash_token
    from datetime import datetime, timedelta, timezone

    user_sec = UserSecurity(user_id=user.id)
    db.add(user_sec)
    await db.flush()

    from app.core.audit import log_audit_event
    await log_audit_event(
        db,
        workspace_id=workspace.id,
        user_id=user.id,
        action="organization.created",
        resource_type="organization",
        resource_id=org.id,
        details={"name": org.name}
    )
    
    user_agent = request.headers.get("user-agent", "")
    ip_address = request.client.host if request.client else None
    
    session = UserSession(
        user_id=user.id,
        device_name=user_agent[:255] if user_agent else "Unknown",
        ip_address=ip_address,
        last_active_at=datetime.now(timezone.utc)
    )
    db.add(session)
    await db.flush()

    raw_refresh_token = generate_refresh_token()
    refresh_entry = RefreshToken(
        user_id=user.id,
        session_id=session.id,
        token_hash=hash_token(raw_refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=30)
    )
    db.add(refresh_entry)
    await db.commit()

    access_token = create_access_token(subject=user.id, session_id=session.id)
    return TokenResponse(access_token=access_token, refresh_token=raw_refresh_token)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest, 
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    from app.models.security import UserSession, RefreshToken
    from app.core.security import generate_refresh_token, hash_token
    from datetime import datetime, timedelta, timezone
    from fastapi import Request

    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    
    # We should also check UserSecurity for failed logins / locked out logic
    from app.models.security import UserSecurity
    sec_result = await db.execute(select(UserSecurity).where(UserSecurity.user_id == (user.id if user else "fake")))
    user_sec = sec_result.scalar_one_or_none()
    
    if user_sec and user_sec.locked_until and user_sec.locked_until > datetime.now(timezone.utc):
        raise HTTPException(status_code=403, detail="Account is temporarily locked")

    if user is None or not verify_password(payload.password, user.hashed_password):
        if user_sec:
            user_sec.failed_login_attempts += 1
            if user_sec.failed_login_attempts >= 5:
                user_sec.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
            await db.commit()
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if user_sec:
        user_sec.failed_login_attempts = 0
        await db.commit()

    # Determine user-agent and IP
    user_agent = request.headers.get("user-agent", "")
    ip_address = request.client.host if request.client else None
    
    session = UserSession(
        user_id=user.id,
        device_name=user_agent[:255] if user_agent else "Unknown",
        ip_address=ip_address,
        last_active_at=datetime.now(timezone.utc)
    )
    db.add(session)
    await db.flush()

    raw_refresh_token = generate_refresh_token()
    refresh_entry = RefreshToken(
        user_id=user.id,
        session_id=session.id,
        token_hash=hash_token(raw_refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=30)
    )
    db.add(refresh_entry)
    await db.commit()

    from app.models.rbac import OrganizationMember
    mem_res = await db.execute(select(OrganizationMember).where(OrganizationMember.user_id == user.id).limit(1))
    member = mem_res.scalar_one_or_none()
    
    if member:
        from app.core.audit import log_audit_event
        await log_audit_event(
            db,
            workspace_id=member.workspace_id,
            user_id=user.id,
            action="user.login.success",
            resource_type="user",
            resource_id=user.id
        )

    mfa_verified = not (user_sec and user_sec.mfa_enabled)
    
    if not mfa_verified:
        # Issue a temporary token for MFA verification, no refresh token yet
        access_token = create_access_token(subject=user.id, expires_minutes=5, mfa_verified=False)
        return TokenResponse(access_token=access_token, refresh_token=None)

    access_token = create_access_token(subject=user.id, session_id=session.id, mfa_verified=True)
    return TokenResponse(access_token=access_token, refresh_token=raw_refresh_token)

class MFALoginRequest(BaseModel):
    mfa_code: str
    
@router.post("/login/mfa", response_model=TokenResponse)
async def login_mfa(
    payload: MFALoginRequest,
    request: Request,
    user: User = Depends(get_current_user), # This will read the partial access token
    db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    from app.models.security import UserSecurity, UserSession, RefreshToken
    from app.core.security import generate_refresh_token, hash_token, create_access_token
    from datetime import datetime, timedelta, timezone
    import pyotp
    import json

    result = await db.execute(select(UserSecurity).where(UserSecurity.user_id == user.id))
    user_sec = result.scalar_one_or_none()

    if not user_sec or not user_sec.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is not enabled for this user")
        
    is_valid = False
    
    # Try TOTP
    if user_sec.totp_secret:
        totp = pyotp.TOTP(user_sec.totp_secret)
        if totp.verify(payload.mfa_code):
            is_valid = True
            
    # Try Backup codes
    if not is_valid and user_sec.backup_codes:
        code_hash = hash_token(payload.mfa_code)
        codes = json.loads(user_sec.backup_codes)
        if code_hash in codes:
            is_valid = True
            codes.remove(code_hash)
            user_sec.backup_codes = json.dumps(codes)
            await db.commit()
            
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid MFA code")

    # Create session
    user_agent = request.headers.get("user-agent", "")
    ip_address = request.client.host if request.client else None
    
    session = UserSession(
        user_id=user.id,
        device_name=user_agent[:255] if user_agent else "Unknown",
        ip_address=ip_address,
        last_active_at=datetime.now(timezone.utc)
    )
    db.add(session)
    await db.flush()

    raw_refresh_token = generate_refresh_token()
    refresh_entry = RefreshToken(
        user_id=user.id,
        session_id=session.id,
        token_hash=hash_token(raw_refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=30)
    )
    db.add(refresh_entry)
    await db.commit()
    
    access_token = create_access_token(subject=user.id, session_id=session.id, mfa_verified=True)
    return TokenResponse(access_token=access_token, refresh_token=raw_refresh_token)


class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    from app.models.security import RefreshToken, UserSession
    from app.core.security import hash_token, generate_refresh_token
    from datetime import datetime, timedelta, timezone

    token_hash = hash_token(payload.refresh_token)
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    refresh_entry = result.scalar_one_or_none()

    if not refresh_entry or refresh_entry.revoked_at or refresh_entry.expires_at < datetime.now(timezone.utc):
        # If reused, we should revoke the entire session as a security measure
        if refresh_entry and refresh_entry.last_used_at:
            session = await db.get(UserSession, refresh_entry.session_id)
            if session:
                session.status = "revoked"
                await db.commit()
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    refresh_entry.last_used_at = datetime.now(timezone.utc)
    
    # Generate new refresh token (rotation)
    new_raw_refresh = generate_refresh_token()
    new_refresh_entry = RefreshToken(
        user_id=refresh_entry.user_id,
        session_id=refresh_entry.session_id,
        token_hash=hash_token(new_raw_refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=30)
    )
    db.add(new_refresh_entry)
    
    # Revoke old
    refresh_entry.revoked_at = datetime.now(timezone.utc)
    
    session = await db.get(UserSession, refresh_entry.session_id)
    if session:
        session.last_active_at = datetime.now(timezone.utc)
        
    await db.commit()
    
    access_token = create_access_token(subject=refresh_entry.user_id, session_id=refresh_entry.session_id)
    return TokenResponse(access_token=access_token, refresh_token=new_raw_refresh)


@router.get("/me", response_model=UserResponse)
async def me(
    ctx: RequestContext = Depends(get_request_context),
) -> UserResponse:
    user = ctx.user
    workspace = ctx.workspace
    
    # Backward compatibility with existing UserResponse schema
    return UserResponse(
        id=user.id, 
        email=user.email, 
        full_name=user.full_name, 
        workspace_id=workspace.id if workspace else "", 
        workspace_name=workspace.name if workspace else ""
    )
