import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.rbac import OrganizationMember, RolePermission, Permission

async def check():
    async with AsyncSessionLocal() as db:
        members = (await db.execute(select(OrganizationMember))).scalars().all()
        for m in members:
            perms = (await db.execute(select(Permission.name).join(RolePermission, RolePermission.permission_id == Permission.id).where(RolePermission.role_id == m.role_id))).scalars().all()
            print(f"User {m.user_id} Role {m.role_id} Perms: {'users.invite' in perms}")

asyncio.run(check())
