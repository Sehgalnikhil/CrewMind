"""Seeds the canonical RBAC roles and permissions.

Role hierarchy: OWNER > ADMIN > MANAGER > MEMBER.
Legacy roles (Executive/Analyst/Viewer) are kept but remapped onto the
closest canonical permission set so existing memberships don't break.

Idempotent — safe to run on every startup.
"""

import asyncio
import logging

from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal, init_db
from app.models.rbac import Permission, Role, RolePermission

logger = logging.getLogger("crewmind.seed")

PERMISSIONS = [
    # Organization & people
    "organization.manage",
    "users.invite",
    "users.remove",
    "users.manage_roles",
    "members.manage",  # legacy alias, still checked by older endpoints
    # Billing
    "billing.view",
    "billing.manage",
    # Agents
    "agents.execute",
    "agents.create",
    "agents.configure",
    "agents.delete",
    # Documents
    "documents.read",
    "documents.upload",
    "documents.write",  # legacy alias of documents.upload
    "documents.delete",
    # Knowledge & collaboration
    "knowledge.view",
    "chat.use",
    # Reports
    "reports.view",
    "reports.read",  # legacy alias of reports.view
    "reports.create",
    "reports.export",
    # Administration
    "settings.manage",
    "api_keys.view",
    "api_keys.manage",
    "audit_logs.view",
    "workspace.read",   # legacy
    "workspace.manage",  # legacy
]

_MEMBER_PERMS = [
    "agents.execute",
    "documents.read",
    "documents.upload",
    "documents.write",
    "knowledge.view",
    "chat.use",
    "reports.view",
    "reports.read",
]

_MANAGER_PERMS = [
    *_MEMBER_PERMS,
    "agents.create",
    "agents.configure",
    "documents.delete",
    "reports.create",
    "reports.export",
    "workspace.read",
]

_ADMIN_PERMS = list(PERMISSIONS)  # full access; Owner is distinguished by role name

ROLES = {
    "Owner": list(PERMISSIONS),
    "Admin": _ADMIN_PERMS,
    "Manager": _MANAGER_PERMS,
    "Member": _MEMBER_PERMS,
    # Legacy roles remapped to the nearest canonical set
    "Executive": _MANAGER_PERMS,
    "Analyst": _MEMBER_PERMS,
    "Viewer": ["documents.read", "reports.view", "reports.read", "knowledge.view", "chat.use"],
}


async def seed() -> None:
    await init_db()

    async with AsyncSessionLocal() as session:
        perm_map: dict[str, Permission] = {}
        for perm_name in PERMISSIONS:
            result = await session.execute(select(Permission).where(Permission.name == perm_name))
            perm = result.scalar_one_or_none()
            if not perm:
                perm = Permission(name=perm_name)
                session.add(perm)
            perm_map[perm_name] = perm

        await session.commit()

        for role_name, role_perms in ROLES.items():
            result = await session.execute(
                select(Role)
                .options(selectinload(Role.role_permissions))
                .where(Role.name == role_name)
            )
            role = result.scalar_one_or_none()
            if not role:
                role = Role(name=role_name, description=f"{role_name} role", is_system=True)
                session.add(role)
                await session.flush()

            # Delete-then-insert in separate flushes so the unique
            # (role_id, permission_id) constraint never sees both rows at once.
            await session.execute(delete(RolePermission).where(RolePermission.role_id == role.id))
            await session.flush()
            session.add_all(
                RolePermission(role_id=role.id, permission_id=perm_map[p].id) for p in role_perms
            )

        await session.commit()
        logger.info("RBAC seed completed: %d permissions, %d roles", len(PERMISSIONS), len(ROLES))


if __name__ == "__main__":
    asyncio.run(seed())
    print("Database seeding completed.")
