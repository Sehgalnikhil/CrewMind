from typing import Any
import urllib.parse
import httpx
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
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

    redirect_uri = f"{settings.frontend_url.rstrip('/')}/api/integrations/{provider}/callback"

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
    elif provider == "notion":
        if not settings.notion_client_id:
            raise HTTPException(status_code=400, detail="Notion Client ID not configured")
        url = f"https://api.notion.com/v1/oauth/authorize?client_id={settings.notion_client_id}&response_type=code&owner=user&redirect_uri={redirect_uri}&state={workspace_id}"
    elif provider == "jira":
        if not settings.jira_client_id:
            raise HTTPException(status_code=400, detail="Jira Client ID not configured")
        scopes = urllib.parse.quote("read:jira-work read:jira-user offline_access")
        url = f"https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id={settings.jira_client_id}&scope={scopes}&redirect_uri={redirect_uri}&state={workspace_id}&response_type=code&prompt=consent"
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

    redirect_uri = f"{settings.frontend_url.rstrip('/')}/api/integrations/{provider}/callback"
    
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
            
        elif provider == "notion":
            import base64
            auth_str = f"{settings.notion_client_id}:{settings.notion_client_secret}"
            auth_b64 = base64.b64encode(auth_str.encode()).decode()
            res = await client.post(
                "https://api.notion.com/v1/oauth/token",
                headers={
                    "Authorization": f"Basic {auth_b64}",
                    "Content-Type": "application/json",
                },
                json={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
            )
            data = res.json()
            access_token = data.get("access_token")
            
        elif provider == "jira":
            res = await client.post(
                "https://auth.atlassian.com/oauth/token",
                json={
                    "grant_type": "authorization_code",
                    "client_id": settings.jira_client_id,
                    "client_secret": settings.jira_client_secret,
                    "code": code,
                    "redirect_uri": redirect_uri,
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
    
    return RedirectResponse(url=f"{settings.frontend_url.rstrip('/')}/documents")


@router.post("/google/sync")
async def sync_google_drive(
    background_tasks: BackgroundTasks,
    ctx: RequestContext = Depends(RequiresPermission("workspace.manage")),
    db: AsyncSession = Depends(get_db),
):
    """
    Sync recent files from Google Drive and ingest them into the knowledge base.
    """
    import uuid
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseDownload
    from app.models.document import Document
    from app.models.job import BackgroundJob
    from app.api.documents import _run_ingest_in_new_session
    
    workspace_id = ctx.workspace.id if ctx.workspace else None
    if not workspace_id:
        raise HTTPException(status_code=400, detail="Workspace required")
        
    result = await db.execute(
        select(Integration).where(
            Integration.workspace_id == workspace_id,
            Integration.provider == "google"
        )
    )
    integration = result.scalar_one_or_none()
    if not integration or not integration.access_token:
        raise HTTPException(status_code=400, detail="Google integration not connected")
        
    creds = Credentials(
        token=integration.access_token,
        refresh_token=integration.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
    )
    
    try:
        service = build('drive', 'v3', credentials=creds)
        # Query for recent PDFs and Google Docs
        query = "mimeType='application/pdf' or mimeType='application/vnd.google-apps.document'"
        results = service.files().list(q=query, pageSize=5, fields="nextPageToken, files(id, name, mimeType)", orderBy="modifiedTime desc").execute()
        items = results.get('files', [])
        
        if not items:
            return {"status": "success", "synced": 0}
            
        org_dir = settings.storage_dir / workspace_id
        org_dir.mkdir(parents=True, exist_ok=True)
        
        synced_count = 0
        for item in items:
            file_id = item['id']
            file_name = item['name']
            mime_type = item['mimeType']
            
            if mime_type == 'application/vnd.google-apps.document':
                request = service.files().export_media(fileId=file_id, mimeType='application/pdf')
                if not file_name.endswith(".pdf"):
                    file_name += ".pdf"
                file_type = "pdf"
            else:
                request = service.files().get_media(fileId=file_id)
                file_type = "pdf"
                
            stored_name = f"{uuid.uuid4()}.{file_type}"
            storage_path = org_dir / stored_name
            
            with open(storage_path, "wb") as fh:
                downloader = MediaIoBaseDownload(fh, request)
                done = False
                while done is False:
                    status, done = downloader.next_chunk()
            
            document = Document(
                workspace_id=workspace_id,
                uploaded_by=ctx.user.id,
                filename=file_name,
                file_type=file_type,
                storage_path=str(storage_path),
                status="uploaded",
            )
            db.add(document)
            
            job = BackgroundJob(
                workspace_id=workspace_id,
                user_id=ctx.user.id,
                task_type="document_processing",
                status="pending"
            )
            db.add(job)
            await db.flush()
            
            background_tasks.add_task(_run_ingest_in_new_session, document.id, workspace_id, job.id)
            synced_count += 1
            
        await db.commit()
        return {"status": "success", "synced": synced_count}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


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

async def _save_and_process_integration_data(
    provider: str,
    workspace_id: str,
    user_id: str,
    data_content: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession
):
    import uuid
    from app.models.document import Document
    from app.models.job import BackgroundJob
    from app.api.documents import _run_ingest_in_new_session
    
    org_dir = settings.storage_dir / workspace_id
    org_dir.mkdir(parents=True, exist_ok=True)
    
    stored_name = f"{provider}_{uuid.uuid4()}.md"
    storage_path = org_dir / stored_name
    
    with open(storage_path, "w") as fh:
        fh.write(data_content)
        
    document = Document(
        workspace_id=workspace_id,
        uploaded_by=user_id,
        filename=f"{provider}_sync.md",
        file_type="markdown",
        storage_path=str(storage_path),
        status="uploaded",
    )
    db.add(document)
    
    job = BackgroundJob(
        workspace_id=workspace_id,
        user_id=user_id,
        task_type="document_processing",
        status="pending"
    )
    db.add(job)
    await db.flush()
    
    background_tasks.add_task(_run_ingest_in_new_session, document.id, workspace_id, job.id)
    await db.commit()


@router.post("/slack/sync")
async def sync_slack(
    background_tasks: BackgroundTasks,
    ctx: RequestContext = Depends(RequiresPermission("workspace.manage")),
    db: AsyncSession = Depends(get_db),
):
    workspace_id = ctx.workspace.id if ctx.workspace else None
    result = await db.execute(select(Integration).where(Integration.workspace_id == workspace_id, Integration.provider == "slack"))
    integration = result.scalar_one_or_none()
    if not integration or not integration.access_token:
        raise HTTPException(status_code=400, detail="Slack not connected")
        
    async with httpx.AsyncClient() as client:
        # Get channels
        res = await client.get("https://slack.com/api/conversations.list", headers={"Authorization": f"Bearer {integration.access_token}"})
        channels = res.json().get("channels", [])
        
        all_messages = []
        for ch in channels[:3]:  # Limit to 3 channels for demo
            res_hist = await client.get(f"https://slack.com/api/conversations.history?channel={ch['id']}&limit=50", headers={"Authorization": f"Bearer {integration.access_token}"})
            messages = res_hist.json().get("messages", [])
            for msg in messages:
                if msg.get("text"):
                    all_messages.append(f"**Channel {ch['name']}**: {msg.get('text')}")
                    
    if not all_messages:
        return {"status": "success", "synced": 0}
        
    content = "# Slack Synchronization\\n\\n" + "\\n\\n".join(all_messages)
    await _save_and_process_integration_data("slack", workspace_id, ctx.user.id, content, background_tasks, db)
    return {"status": "success", "synced": len(all_messages)}


@router.post("/github/sync")
async def sync_github(
    background_tasks: BackgroundTasks,
    ctx: RequestContext = Depends(RequiresPermission("workspace.manage")),
    db: AsyncSession = Depends(get_db),
):
    workspace_id = ctx.workspace.id if ctx.workspace else None
    result = await db.execute(select(Integration).where(Integration.workspace_id == workspace_id, Integration.provider == "github"))
    integration = result.scalar_one_or_none()
    if not integration or not integration.access_token:
        raise HTTPException(status_code=400, detail="GitHub not connected")
        
    async with httpx.AsyncClient() as client:
        res = await client.get("https://api.github.com/user/repos?sort=updated&per_page=3", headers={"Authorization": f"token {integration.access_token}", "Accept": "application/vnd.github.v3+json"})
        repos = res.json()
        if isinstance(repos, dict) and "message" in repos:
            raise HTTPException(status_code=400, detail=repos["message"])
            
        all_data = []
        for repo in repos:
            all_data.append(f"## Repository: {repo['name']}\\n{repo.get('description', '')}")
            
    content = "# GitHub Synchronization\\n\\n" + "\\n\\n".join(all_data)
    await _save_and_process_integration_data("github", workspace_id, ctx.user.id, content, background_tasks, db)
    return {"status": "success", "synced": len(all_data)}


@router.post("/notion/sync")
async def sync_notion(
    background_tasks: BackgroundTasks,
    ctx: RequestContext = Depends(RequiresPermission("workspace.manage")),
    db: AsyncSession = Depends(get_db),
):
    workspace_id = ctx.workspace.id if ctx.workspace else None
    result = await db.execute(select(Integration).where(Integration.workspace_id == workspace_id, Integration.provider == "notion"))
    integration = result.scalar_one_or_none()
    if not integration or not integration.access_token:
        raise HTTPException(status_code=400, detail="Notion not connected")
        
    async with httpx.AsyncClient() as client:
        res = await client.post("https://api.notion.com/v1/search", headers={"Authorization": f"Bearer {integration.access_token}", "Notion-Version": "2022-06-28"}, json={"page_size": 5})
        pages = res.json().get("results", [])
        
        all_data = []
        for page in pages:
            title = "Untitled"
            if "properties" in page and "title" in page["properties"] and page["properties"]["title"]["title"]:
                title = page["properties"]["title"]["title"][0]["plain_text"]
            all_data.append(f"## Notion Page: {title}\\nURL: {page.get('url')}")
            
    content = "# Notion Synchronization\\n\\n" + "\\n\\n".join(all_data)
    await _save_and_process_integration_data("notion", workspace_id, ctx.user.id, content, background_tasks, db)
    return {"status": "success", "synced": len(all_data)}


@router.post("/jira/sync")
async def sync_jira(
    background_tasks: BackgroundTasks,
    ctx: RequestContext = Depends(RequiresPermission("workspace.manage")),
    db: AsyncSession = Depends(get_db),
):
    workspace_id = ctx.workspace.id if ctx.workspace else None
    result = await db.execute(select(Integration).where(Integration.workspace_id == workspace_id, Integration.provider == "jira"))
    integration = result.scalar_one_or_none()
    if not integration or not integration.access_token:
        raise HTTPException(status_code=400, detail="Jira not connected")
        
    async with httpx.AsyncClient() as client:
        # Get accessible resources (cloud ids)
        res = await client.get("https://api.atlassian.com/oauth/token/accessible-resources", headers={"Authorization": f"Bearer {integration.access_token}"})
        resources = res.json()
        if not resources:
            return {"status": "success", "synced": 0}
            
        cloud_id = resources[0]["id"]
        # JQL search
        jql_res = await client.get(f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/search?jql=order%20by%20created%20DESC&maxResults=10", headers={"Authorization": f"Bearer {integration.access_token}"})
        issues = jql_res.json().get("issues", [])
        
        all_data = []
        for issue in issues:
            key = issue.get("key")
            fields = issue.get("fields", {})
            summary = fields.get("summary", "")
            all_data.append(f"## Jira Issue: {key}\\n{summary}")
            
    content = "# Jira Synchronization\\n\\n" + "\\n\\n".join(all_data)
    await _save_and_process_integration_data("jira", workspace_id, ctx.user.id, content, background_tasks, db)
    return {"status": "success", "synced": len(all_data)}
