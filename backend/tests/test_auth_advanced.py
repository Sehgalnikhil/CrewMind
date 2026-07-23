import pytest
from httpx import AsyncClient
from app.main import app
from app.models.user import User
from app.models.security import UserSession, RefreshToken
from app.core.security import hash_password, create_access_token
from sqlalchemy import select
from datetime import datetime, timezone, timedelta

@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient, db_session):
    # Register
    res = await client.post("/api/auth/register", json={
        "email": "enterprise@example.com",
        "password": "SecurePassword123!",
        "full_name": "Enterprise User",
        "organization_name": "Enterprise Corp"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    
    # Login
    res = await client.post("/api/auth/login", json={
        "email": "enterprise@example.com",
        "password": "SecurePassword123!"
    })
    assert res.status_code == 200
    login_data = res.json()
    assert "access_token" in login_data
    assert "refresh_token" in login_data
    
    # Token Rotation
    res = await client.post("/api/auth/refresh", json={
        "refresh_token": login_data["refresh_token"]
    })
    assert res.status_code == 200
    refresh_data = res.json()
    assert "access_token" in refresh_data
    assert "refresh_token" in refresh_data
    assert refresh_data["refresh_token"] != login_data["refresh_token"]
    
    # Revoked token rejection
    res = await client.post("/api/auth/refresh", json={
        "refresh_token": login_data["refresh_token"]
    })
    assert res.status_code == 401 # Should reject old token

@pytest.mark.asyncio
async def test_session_management(client: AsyncClient, db_session):
    res = await client.post("/api/auth/register", json={
        "email": "session@example.com",
        "password": "SecurePassword123!",
        "full_name": "Session User",
        "organization_name": "Session Corp"
    })
    token = res.json()["access_token"]
    
    res = await client.get("/api/sessions", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    sessions = res.json()
    assert len(sessions) == 1
    session_id = sessions[0]["id"]
    
    # Revoke it
    res = await client.delete(f"/api/sessions/{session_id}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 204
    
    # Should be rejected now
    res = await client.get("/api/sessions", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401 # Session revoked
