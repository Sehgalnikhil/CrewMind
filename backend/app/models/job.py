from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin


class BackgroundJob(Base, IdMixin, TimestampMixin):
    __tablename__ = "background_jobs"
    __table_args__ = (
        Index("ix_jobs_workspace_created", "workspace_id", "created_at"),
        Index("ix_jobs_workspace_user", "workspace_id", "user_id"),
        Index("ix_jobs_workspace_status", "workspace_id", "status"),
        Index("ix_jobs_workspace_task_type", "workspace_id", "task_type"),
    )

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    task_type: Mapped[str] = mapped_column(String(50)) # e.g. document_processing, embedding_generation, agent_execution
    status: Mapped[str] = mapped_column(String(20), default="pending") # pending | running | completed | failed
    
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
