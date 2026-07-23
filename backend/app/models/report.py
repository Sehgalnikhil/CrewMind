from sqlalchemy import ForeignKey, Integer, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin


class Report(Base, IdMixin, TimestampMixin):
    __tablename__ = "reports"
    __table_args__ = (
        Index("ix_reports_workspace_created", "workspace_id", "created_at"),
        Index("ix_reports_workspace_user", "workspace_id", "user_id"),
    )

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    agent_run_id: Mapped[str] = mapped_column(ForeignKey("agent_runs.id"))
    business_health_score: Mapped[int] = mapped_column(Integer)
    summary: Mapped[str] = mapped_column(Text)
    risks_json: Mapped[str] = mapped_column(Text)  # JSON list[str | dict]
    opportunities_json: Mapped[str] = mapped_column(Text)
    recommendations_json: Mapped[str] = mapped_column(Text)
    title: Mapped[str] = mapped_column(String(255), default="Executive Report")
