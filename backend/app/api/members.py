"""Organization member management (list / change role / remove) and the
audit-log feed. All mutating actions require explicit permissions and are
audit-logged; the last Owner can never be demoted or removed."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import RequestContext, RequiresPermission
from app.core.audit import log_audit_event
from app.core.database import get_db
from app.models.observability import AuditLog
from app.models.rbac import OrganizationMember, Role
from app.models.user import User

router = APIRouter(prefix="/api/organization", tags=["members"])


class MemberOut(BaseModel):
    member_id: str
    user_id: str
    email: str
    full_name: str
    role: str
    role_id: str
    workspace_id: str


class RoleOut(BaseModel):
    id: str
    name: str
    description: str | None


class ChangeRoleRequest(BaseModel):
    role_id: str


class AuditLogOut(BaseModel):
    id: str
    action: str
    user_id: str | None
    user_name: str | None
    resource_id: str | None
    metadata: dict | list | None
    created_at: str


async def _org_members(db: AsyncSession, org_id: str) -> list[OrganizationMember]:
    stmt = (
        select(OrganizationMember)
        .options(
            selectinload(OrganizationMember.user),
            selectinload(OrganizationMember.role),
        )
        .where(OrganizationMember.org_id == org_id)
    )
    return list((await db.execute(stmt)).scalars().all())


async def _count_owners(db: AsyncSession, org_id: str) -> int:
    members = await _org_members(db, org_id)
    return sum(1 for m in members if m.role and m.role.name.lower() == "owner")


@router.get("/members", response_model=list[MemberOut])
async def list_members(
    ctx: RequestContext = Depends(RequiresPermission("members.manage")),
    db: AsyncSession = Depends(get_db),
) -> list[MemberOut]:
    members = await _org_members(db, ctx.organization.id)
    return [
        MemberOut(
            member_id=m.id,
            user_id=m.user_id,
            email=m.user.email,
            full_name=m.user.full_name,
            role=m.role.name.upper(),
            role_id=m.role_id,
            workspace_id=m.workspace_id,
        )
        for m in members
        if m.user and m.role
    ]


@router.get("/roles", response_model=list[RoleOut])
async def list_roles(
    ctx: RequestContext = Depends(RequiresPermission("members.manage")),
    db: AsyncSession = Depends(get_db),
) -> list[RoleOut]:
    canonical = ["owner", "admin", "manager", "member"]
    roles = (await db.execute(select(Role))).scalars().all()
    out = [RoleOut(id=r.id, name=r.name.upper(), description=r.description) for r in roles if r.name.lower() in canonical]
    out.sort(key=lambda r: canonical.index(r.name.lower()))
    return out


@router.patch("/members/{member_id}/role", response_model=MemberOut)
async def change_member_role(
    member_id: str,
    payload: ChangeRoleRequest,
    ctx: RequestContext = Depends(RequiresPermission("users.manage_roles")),
    db: AsyncSession = Depends(get_db),
) -> MemberOut:
    member = await db.get(
        OrganizationMember, member_id,
        options=[selectinload(OrganizationMember.user), selectinload(OrganizationMember.role)],
    )
    if member is None or member.org_id != ctx.organization.id:
        raise HTTPException(status_code=404, detail="Member not found")

    new_role = await db.get(Role, payload.role_id)
    if new_role is None:
        raise HTTPException(status_code=400, detail="Invalid role")

    was_owner = member.role and member.role.name.lower() == "owner"
    becomes_owner = new_role.name.lower() == "owner"
    if was_owner and not becomes_owner and await _count_owners(db, ctx.organization.id) <= 1:
        raise HTTPException(status_code=400, detail="An organization must keep at least one Owner.")

    old_role_name = member.role.name if member.role else None
    member.role_id = new_role.id
    await db.commit()

    await log_audit_event(
        db,
        workspace_id=ctx.workspace.id,
        user_id=ctx.user.id,
        action="members.role_changed",
        resource_type="member",
        resource_id=member.id,
        details={"member_email": member.user.email, "from": old_role_name, "to": new_role.name},
    )

    return MemberOut(
        member_id=member.id,
        user_id=member.user_id,
        email=member.user.email,
        full_name=member.user.full_name,
        role=new_role.name.upper(),
        role_id=new_role.id,
        workspace_id=member.workspace_id,
    )


@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    member_id: str,
    ctx: RequestContext = Depends(RequiresPermission("users.remove")),
    db: AsyncSession = Depends(get_db),
) -> None:
    member = await db.get(
        OrganizationMember, member_id,
        options=[selectinload(OrganizationMember.user), selectinload(OrganizationMember.role)],
    )
    if member is None or member.org_id != ctx.organization.id:
        raise HTTPException(status_code=404, detail="Member not found")

    if member.user_id == ctx.user.id:
        raise HTTPException(status_code=400, detail="You cannot remove yourself. Transfer ownership first.")
    if member.role and member.role.name.lower() == "owner" and await _count_owners(db, ctx.organization.id) <= 1:
        raise HTTPException(status_code=400, detail="An organization must keep at least one Owner.")

    removed_email = member.user.email if member.user else member.user_id
    workspace_id = ctx.workspace.id
    await db.delete(member)
    await db.commit()

    await log_audit_event(
        db,
        workspace_id=workspace_id,
        user_id=ctx.user.id,
        action="members.removed",
        resource_type="member",
        resource_id=member_id,
        details={"member_email": removed_email},
    )


@router.get("/audit-logs", response_model=list[AuditLogOut])
async def list_audit_logs(
    limit: int = 100,
    ctx: RequestContext = Depends(RequiresPermission("audit_logs.view")),
    db: AsyncSession = Depends(get_db),
) -> list[AuditLogOut]:
    stmt = (
        select(AuditLog, User.full_name)
        .outerjoin(User, User.id == AuditLog.user_id)
        .where(AuditLog.workspace_id == ctx.workspace.id)
        .order_by(AuditLog.created_at.desc())
        .limit(min(limit, 500))
    )
    rows = (await db.execute(stmt)).all()
    return [
        AuditLogOut(
            id=log.id,
            action=log.action,
            user_id=log.user_id,
            user_name=name,
            resource_id=log.resource_id,
            metadata=log.metadata_json,
            created_at=log.created_at.isoformat(),
        )
        for log, name in rows
    ]
