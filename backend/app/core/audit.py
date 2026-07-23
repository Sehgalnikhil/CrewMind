from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any
import json

from app.models.observability import AuditLog

async def log_audit_event(
    db: AsyncSession,
    workspace_id: str,
    user_id: str | None,
    action: str,
    resource_type: str | None = None,
    resource_id: str | None = None,
    details: dict[str, Any] | None = None
) -> AuditLog:
    """Creates and persists an audit log entry."""
    audit = AuditLog(
        workspace_id=workspace_id,
        user_id=user_id,
        action=action,
        resource_id=resource_id,
        metadata_json=details
    )
    db.add(audit)
    await db.commit()
    await db.refresh(audit)
    return audit
