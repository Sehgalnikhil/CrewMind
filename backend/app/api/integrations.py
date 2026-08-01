from typing import Any
import urllib.parse
import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import RequestContext, RequiresPermission
from app.core.database import get_db
from app.core.config import get_settings
from app.models.tenant import Integration

router = APIRouter(prefix="/api/integrations", tags=["integrations"])
settings = get_settings()


@router.get("/{provider}/auth")
async def get_auth_url(
    provider: str,
    ctx: RequestContext = Depends(RequiresPermission("workspace.manage")),
):
    """
    Returns the OAuth consent screen URL for the given provider.
    """
    workspace_id = ctx.workspace.id if ctx.workspace else None
    if not workspace_id:
        raise HTTPException(status_code=400, detail="Workspace required")

    redirect_uri = f"http://localhost:5173/api/integrations/{provider}/callback"

    if provider == "github":
        if not settings.github_client_id:
            raise HTTPException(status_code=400, detail="GitHub Client ID not configured")
        url = f"https://github.com/login/oauth/authorize?client_id={settings.github_client_id}&scope=repo&state={workspace_id}"
    elif provider == "slack":
        if not settings.slack_client_id:
            raise HTTPException(status_code=400, detail="Slack Client ID not configured")
        scopes = "channels:history,channels:read,chat:write"
        url = f"https://slack.com/oauth/v2/authorize?client_id={settings.slack_client_id}&scope={scopes}&redirect_uri={redirect_uri}&state={workspace_id}"
    elif provider == "google":
        if not settings.google_client_id:
            raise HTTPException(status_code=400, detail="Google Client ID not configured")
        scopes = "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/documents.readonly"
        url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={settings.google_client_id}&redirect_uri={redirect_uri}&response_type=code&scope={scopes}&access_type=offline&prompt=consent&state={workspace_id}"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

    return {"url": url}


@router.get("/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Handles the OAuth callback, exchanges the code for tokens, and saves the Integration.
    """
    workspace_id = state
    if not workspace_id:
        raise HTTPException(status_code=400, detail="Workspace state required")

    redirect_uri = f"http://localhost:5173/api/integrations/{provider}/callback"
    
    access_token = None
    refresh_token = None

    async with httpx.AsyncClient() as client:
        if provider == "github":
            res = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                },
            )
            data = res.json()
            access_token = data.get("access_token")
        
        elif provider == "slack":
            res = await client.post(
                "https://slack.com/api/oauth.v2.access",
                data={
                    "client_id": settings.slack_client_id,
                    "client_secret": settings.slack_client_secret,
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
            )
            data = res.json()
            if data.get("ok"):
                access_token = data.get("access_token")
            else:
                raise HTTPException(status_code=400, detail=f"Slack auth failed: {data.get('error')}")
                
        elif provider == "google":
            res = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "code": code,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            data = res.json()
            access_token = data.get("access_token")
            refresh_token = data.get("refresh_token")

    if not access_token:
        raise HTTPException(status_code=400, detail="Failed to obtain access token from provider")

    # Check if integration already exists
    result = await db.execute(
        select(Integration).where(
            Integration.workspace_id == workspace_id,
            Integration.provider == provider
        )
    )
    integration = result.scalar_one_or_none()

    if integration:
        integration.access_token = access_token
        if refresh_token:
            integration.refresh_token = refresh_token
    else:
        integration = Integration(
            workspace_id=workspace_id,
            provider=provider,
            access_token=access_token,
            refresh_token=refresh_token or "",
        )
        db.add(integration)

    await db.commit()
    
    return RedirectResponse(url="http://localhost:5173/settings")


@router.get("/")
async def list_integrations(
    ctx: RequestContext = Depends(RequiresPermission("workspace.read")),
    db: AsyncSession = Depends(get_db),
):
    """
    Lists all connected integrations for the current workspace.
    """
    workspace_id = ctx.workspace.id if ctx.workspace else None
    if not workspace_id:
        return []

    result = await db.execute(
        select(Integration).where(Integration.workspace_id == workspace_id)
    )
    integrations = result.scalars().all()
    
    return [
        {"id": idx.id, "provider": idx.provider, "connected_at": idx.created_at}
        for idx in integrations
    ]

@router.delete("/{provider}")
async def disconnect_integration(
    provider: str,
    ctx: RequestContext = Depends(RequiresPermission("workspace.manage")),
    db: AsyncSession = Depends(get_db),
):
    """
    Disconnects an integration.
    """
    workspace_id = ctx.workspace.id if ctx.workspace else None
    if not workspace_id:
        raise HTTPException(status_code=400, detail="Workspace required")

    result = await db.execute(
        select(Integration).where(
            Integration.workspace_id == workspace_id,
            Integration.provider == provider
        )
    )
    integration = result.scalar_one_or_none()
    
    if integration:
        await db.delete(integration)
        await db.commit()
        
    return {"status": "success"}
