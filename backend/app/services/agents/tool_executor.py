import json
from typing import Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tenant import Integration
from app.core.config import get_settings
from app.services.integrations.github import GitHubService
from app.services.integrations.slack import SlackService
from app.services.integrations.google_workspace import GoogleWorkspaceService

async def execute_tool(tool_name: str, arguments: dict[str, Any], workspace_id: str, db: AsyncSession) -> str:
    """
    Executes a specific tool action requested by an agent.
    Fetches the necessary OAuth token for the workspace.
    """
    settings = get_settings()

    # Determine provider based on prefix
    provider = None
    if tool_name.startswith("github_"):
        provider = "github"
    elif tool_name.startswith("slack_"):
        provider = "slack"
    elif tool_name.startswith("google_"):
        provider = "google"
    else:
        return f"Error: Unknown tool provider for tool {tool_name}"

    # Fetch integration
    result = await db.execute(
        select(Integration).where(
            Integration.workspace_id == workspace_id,
            Integration.provider == provider
        )
    )
    integration = result.scalar_one_or_none()

    if not integration or not integration.access_token:
        return f"Error: The {provider} integration is not connected. Please ask the user to connect it in Settings."

    try:
        res = None
        if provider == "github":
            service = GitHubService(integration.access_token)
            if tool_name == "github_search_repositories":
                res = service.search_repositories(arguments.get("query", ""))
            elif tool_name == "github_read_issue":
                res = service.read_issue(arguments.get("repo_full_name", ""), int(arguments.get("issue_number", 0)))
            else:
                return f"Error: Unknown github tool {tool_name}"

        elif provider == "slack":
            service = SlackService(integration.access_token)
            if tool_name == "slack_search_messages":
                res = service.search_messages(arguments.get("query", ""))
            elif tool_name == "slack_send_message":
                res = service.send_message(arguments.get("channel", ""), arguments.get("text", ""))
            else:
                return f"Error: Unknown slack tool {tool_name}"

        elif provider == "google":
            service = GoogleWorkspaceService(
                access_token=integration.access_token,
                refresh_token=integration.refresh_token,
                client_id=settings.google_client_id,
                client_secret=settings.google_client_secret
            )
            if tool_name == "google_search_drive":
                res = service.search_drive(arguments.get("query", ""))
            elif tool_name == "google_read_document":
                res = service.read_document(arguments.get("document_id", ""))
            else:
                return f"Error: Unknown google tool {tool_name}"

        # Format result as JSON string for the agent context
        if isinstance(res, str):
            return res
        return json.dumps(res, indent=2)

    except Exception as e:
        return f"Error executing tool {tool_name}: {str(e)}"
