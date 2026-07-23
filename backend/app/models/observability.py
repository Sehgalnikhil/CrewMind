from typing import TYPE_CHECKING
from sqlalchemy import JSON, ForeignKey, String, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin


class AuditLog(Base, IdMixin, TimestampMixin):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_auditlogs_workspace_created", "workspace_id", "created_at"),
        Index("ix_auditlogs_workspace_action", "workspace_id", "action"),
    )

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    
    action: Mapped[str] = mapped_column(String(255), index=True) # e.g. "documents.create", "auth.login"
    resource_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    metadata_json: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)


class UsageRecord(Base, IdMixin, TimestampMixin):
    __tablename__ = "usage_records"
    __table_args__ = (
        Index("ix_usagerecords_workspace_created", "workspace_id", "created_at"),
        Index("ix_usagerecords_workspace_metric", "workspace_id", "metric_name"),
    )

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    
    metric_name: Mapped[str] = mapped_column(String(255), index=True) # e.g. "ai_tokens", "storage_bytes"
    value: Mapped[float] = mapped_column(default=0.0)
