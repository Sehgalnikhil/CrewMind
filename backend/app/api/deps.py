from dataclasses import dataclass
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.tenant import Organization, Workspace, Subscription
from app.models.rbac import OrganizationMember, Role, Permission, RolePermission
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


@dataclass
class RequestContext:
    user: User
    organization: Organization | None = None
    workspace: Workspace | None = None
    member: OrganizationMember | None = None
    role: Role | None = None
    permissions: list[str] | None = None
    subscription: Subscription | None = None
    features: list[str] | None = None


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if token is None:
        raise credentials_error
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_error
    user_id = payload.get("sub")
    session_id = payload.get("session_id")
    if not user_id:
        raise credentials_error
    
    user = await db.get(User, user_id)
    if user is None:
        if user_id.startswith("user_"):
            from app.core.security import hash_password
            import uuid
            
            email = payload.get("email") or f"{user_id}@clerk.local"
            name = payload.get("name") or "Clerk User"
            
            stmt = select(User).where(User.email == email)
            existing_user = (await db.execute(stmt)).scalar_one_or_none()
            
            if existing_user:
                user = existing_user
            else:
                user = User(
                    id=user_id,
                    email=email,
                    full_name=name,
                    hashed_password=hash_password(str(uuid.uuid4()))
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
                
                org = Organization(name=f"{name}'s Org")
                db.add(org)
                await db.commit()
                
                workspace = Workspace(name="Default Workspace", org_id=org.id)
                db.add(workspace)
                await db.commit()
                
                admin_role = (await db.execute(select(Role).where(Role.name.ilike("admin")))).scalar_one_or_none()
                if admin_role:
                    member = OrganizationMember(
                        user_id=user.id,
                        org_id=org.id,
                        workspace_id=workspace.id,
                        role_id=admin_role.id
                    )
                    db.add(member)
                    await db.commit()
        else:
            raise credentials_error
        
    # Session Validation
    if session_id:
        from app.models.security import UserSession
        session = await db.get(UserSession, session_id)
        if not session or session.status != "active":
            raise HTTPException(status_code=401, detail="Session revoked or expired")
    
    # Store payload for MFA checks if needed by routes
    user._token_payload = payload
    
    return user


async def get_request_context(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RequestContext:
    workspace_id = request.headers.get("x-workspace-id")

    ctx = RequestContext(user=user)

    if not workspace_id:
        stmt = select(OrganizationMember).where(OrganizationMember.user_id == user.id)
        result = await db.execute(stmt)
        fallback_member = result.scalars().first()
        if fallback_member:
            workspace_id = fallback_member.workspace_id
        else:
            # Auto-create if user somehow has no workspaces (fixes previous bug)
            org = Organization(name=f"{user.full_name}'s Org")
            db.add(org)
            await db.commit()
            
            workspace = Workspace(name="Default Workspace", org_id=org.id)
            db.add(workspace)
            await db.commit()
            
            admin_role = (await db.execute(select(Role).where(Role.name.ilike("admin")))).scalar_one_or_none()
            if admin_role:
                member = OrganizationMember(
                    user_id=user.id,
                    org_id=org.id,
                    workspace_id=workspace.id,
                    role_id=admin_role.id
                )
                db.add(member)
                await db.commit()
            
            workspace_id = workspace.id

    # Find membership
    stmt = (
        select(OrganizationMember)
        .options(
            selectinload(OrganizationMember.organization),
            selectinload(OrganizationMember.workspace).selectinload(Workspace.features),
            selectinload(OrganizationMember.workspace).selectinload(Workspace.subscriptions),
            selectinload(OrganizationMember.role).selectinload(Role.role_permissions).selectinload(RolePermission.permission)
        )
        .where(OrganizationMember.user_id == user.id)
        .where(OrganizationMember.workspace_id == workspace_id)
    )

    result = await db.execute(stmt)
    member = result.scalars().first()

    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this context")

    ctx.member = member
    ctx.organization = member.organization
    ctx.workspace = member.workspace
    ctx.role = member.role
    
    if member.workspace:
        ctx.subscription = member.workspace.subscriptions[0] if member.workspace.subscriptions else None
        ctx.features = [f.feature_name for f in member.workspace.features if f.enabled]
    else:
        ctx.subscription = None
        ctx.features = []
    
    # We must explicitly query permissions for the role
    perm_stmt = (
        select(Permission.name)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .where(RolePermission.role_id == member.role_id)
    )
    perm_result = await db.execute(perm_stmt)
    ctx.permissions = list(perm_result.scalars().all())

    return ctx


def RequiresPermission(permission: str):
    async def permission_dependency(ctx: RequestContext = Depends(get_request_context)):
        if not ctx.permissions or permission not in ctx.permissions:
            raise HTTPException(status_code=403, detail=f"Requires permission: {permission}")
        return ctx
    return permission_dependency
