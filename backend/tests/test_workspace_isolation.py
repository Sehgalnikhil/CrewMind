import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_workspace_isolation_documents(client: AsyncClient, workspace_user1: dict, workspace_user2: dict):
    """Verify that User 2 cannot access User 1's documents"""
    
    # User 1 lists documents and sees none initially
    response = await client.get(
        "/api/documents",
        headers={"Authorization": f"Bearer {workspace_user1['token']}", "x-workspace-id": workspace_user1['workspace_id']}
    )
    assert response.status_code == 200

    # User 2 tries to access User 1's workspace directly
    response = await client.get(
        "/api/documents",
        headers={"Authorization": f"Bearer {workspace_user2['token']}", "x-workspace-id": workspace_user1['workspace_id']}
    )
    assert response.status_code == 403 # Forbidden
    
async def test_workspace_isolation_memory(client: AsyncClient, workspace_user1: dict, workspace_user2: dict):
    """Verify that User 2 cannot search User 1's memory"""
    # User 2 attempts to use User 1's workspace
    response = await client.post(
        "/api/memory/search",
        json={"query": "test"},
        headers={"Authorization": f"Bearer {workspace_user2['token']}", "x-workspace-id": workspace_user1['workspace_id']}
    )
    assert response.status_code == 403

async def test_workspace_isolation_agent_runs(client: AsyncClient, workspace_user1: dict, workspace_user2: dict):
    """Verify that User 2 cannot access User 1's agent runs"""
    response = await client.get(
        "/api/agent-runs",
        headers={"Authorization": f"Bearer {workspace_user2['token']}", "x-workspace-id": workspace_user1['workspace_id']}
    )
    assert response.status_code == 403

async def test_workspace_isolation_reports(client: AsyncClient, workspace_user1: dict, workspace_user2: dict):
    """Verify that User 2 cannot access User 1's reports"""
    response = await client.get(
        "/api/reports",
        headers={"Authorization": f"Bearer {workspace_user2['token']}", "x-workspace-id": workspace_user1['workspace_id']}
    )
    assert response.status_code == 403
