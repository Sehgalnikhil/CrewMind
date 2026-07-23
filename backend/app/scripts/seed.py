import asyncio
import logging
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, init_db
from app.models.rbac import Role, Permission

logger = logging.getLogger("crewmind.seed")

PERMISSIONS = [
    "documents.read",
    "documents.write",
    "documents.delete",
    "agents.execute",
    "reports.read",
    "reports.create",
    "members.manage",
    "billing.manage",
    "settings.manage",
]

ROLES = {
    "Owner": PERMISSIONS,
    "Admin": [
        "documents.read",
        "documents.write",
        "documents.delete",
        "agents.execute",
        "reports.read",
        "reports.create",
        "members.manage",
        "settings.manage",
    ],
    "Executive": [
        "documents.read",
        "agents.execute",
        "reports.read",
        "reports.create",
    ],
    "Analyst": [
        "documents.read",
        "documents.write",
        "reports.read",
    ],
    "Viewer": [
        "documents.read",
        "reports.read",
    ],
}

from sqlalchemy.orm import selectinload

async def seed():
    await init_db()
    
    async with AsyncSessionLocal() as session:
        # 1. Ensure all permissions exist
        perm_map = {}
        for perm_name in PERMISSIONS:
            result = await session.execute(select(Permission).where(Permission.name == perm_name))
            perm = result.scalar_one_or_none()
            if not perm:
                perm = Permission(name=perm_name)
                session.add(perm)
            perm_map[perm_name] = perm
            
        await session.commit()
        
        from app.models.rbac import RolePermission
        # 2. Ensure all roles exist and have correct permissions
        for role_name, role_perms in ROLES.items():
            result = await session.execute(
                select(Role)
                .options(selectinload(Role.role_permissions))
                .where(Role.name == role_name)
            )
            role = result.scalar_one_or_none()
            if not role:
                role = Role(name=role_name, description=f"{role_name} Role")
                session.add(role)
                
            # Clear old permissions and add new ones
            role.role_permissions = []
            for p in role_perms:
                role.role_permissions.append(RolePermission(permission=perm_map[p]))
            
        await session.commit()
        print("Database seeding completed.")

if __name__ == "__main__":
    asyncio.run(seed())
