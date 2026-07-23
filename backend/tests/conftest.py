import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app
from app.core.security import create_access_token
from app.models.user import User
from app.models.tenant import Organization, Workspace
from app.models.rbac import OrganizationMember, Role, Permission

@pytest_asyncio.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest_asyncio.fixture
async def async_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    session_local = async_sessionmaker(engine, expire_on_commit=False)
    async with session_local() as session:
        # Seed basic RBAC
        role = Role(name="Owner", description="Owner Role")
        session.add(role)
        perm = Permission(name="documents.read")
        session.add(perm)
        await session.commit()
        
        yield session

    await engine.dispose()

@pytest_asyncio.fixture
async def client(async_session):
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()

@pytest_asyncio.fixture
async def workspace_user1(async_session):
    org = Organization(name="Org 1")
    ws = Workspace(name="WS 1", organization=org)
    user = User(email="user1@example.com", hashed_password="dummy", full_name="User 1")
    async_session.add_all([org, ws, user])
    await async_session.commit()
    
    role = await async_session.execute("SELECT id FROM roles WHERE name='Owner'")
    role_id = role.scalar_one()
    
    member = OrganizationMember(org_id=org.id, workspace_id=ws.id, user_id=user.id, role_id=role_id)
    async_session.add(member)
    await async_session.commit()
    
    return {"workspace_id": ws.id, "user_id": user.id, "token": create_access_token(user.id)}

@pytest_asyncio.fixture
async def workspace_user2(async_session):
    org = Organization(name="Org 2")
    ws = Workspace(name="WS 2", organization=org)
    user = User(email="user2@example.com", hashed_password="dummy", full_name="User 2")
    async_session.add_all([org, ws, user])
    await async_session.commit()
    
    role = await async_session.execute("SELECT id FROM roles WHERE name='Owner'")
    role_id = role.scalar_one()
    
    member = OrganizationMember(org_id=org.id, workspace_id=ws.id, user_id=user.id, role_id=role_id)
    async_session.add(member)
    await async_session.commit()
    
    return {"workspace_id": ws.id, "user_id": user.id, "token": create_access_token(user.id)}
