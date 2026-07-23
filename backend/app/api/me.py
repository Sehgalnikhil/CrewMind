"""Current-user context: identity, active organization/workspace, role and
permissions — the single payload the frontend RBAC layer boots from."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import RequestContext, get_current_user, get_request_context
from app.core.database import get_db
from app.models.rbac import OrganizationMember
from app.models.user import User

router = APIRouter(prefix="/api/current-user", tags=["current-user"])


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str


class OrgOut(BaseModel):
    id: str
    name: str


class WorkspaceOut(BaseModel):
    id: str
    name: str
    org_id: str


class MembershipOut(BaseModel):
    member_id: str
    organization: OrgOut
    workspace: WorkspaceOut
    role: str


class ContextResponse(BaseModel):
    user: UserOut
    organization: OrgOut | None
    workspace: WorkspaceOut | None
    role: str | None
    permissions: list[str]
    organizations: list[MembershipOut]
    subscription_plan: str | None = None
    features: list[str] = []


async def _list_memberships(db: AsyncSession, user_id: str) -> list[MembershipOut]:
    stmt = (
        select(OrganizationMember)
        .options(
            selectinload(OrganizationMember.organization),
            selectinload(OrganizationMember.workspace),
            selectinload(OrganizationMember.role),
        )
        .where(OrganizationMember.user_id == user_id)
    )
    members = (await db.execute(stmt)).scalars().all()
    return [
        MembershipOut(
            member_id=m.id,
            organization=OrgOut(id=m.organization.id, name=m.organization.name),
            workspace=WorkspaceOut(id=m.workspace.id, name=m.workspace.name, org_id=m.workspace.org_id),
            role=m.role.name.upper(),
        )
        for m in members
        if m.organization and m.workspace and m.role
    ]


@router.get("/context", response_model=ContextResponse)
async def get_context(
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> ContextResponse:
    memberships = await _list_memberships(db, ctx.user.id)
    return ContextResponse(
        user=UserOut(id=ctx.user.id, email=ctx.user.email, full_name=ctx.user.full_name),
        organization=OrgOut(id=ctx.organization.id, name=ctx.organization.name) if ctx.organization else None,
        workspace=(
            WorkspaceOut(id=ctx.workspace.id, name=ctx.workspace.name, org_id=ctx.workspace.org_id)
            if ctx.workspace
            else None
        ),
        role=ctx.role.name.upper() if ctx.role else None,
        permissions=ctx.permissions or [],
        organizations=memberships,
        subscription_plan=ctx.subscription.plan_name if ctx.subscription else None,
        features=ctx.features or [],
    )


@router.get("/memberships", response_model=list[MembershipOut])
async def get_memberships(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MembershipOut]:
    return await _list_memberships(db, user.id)
