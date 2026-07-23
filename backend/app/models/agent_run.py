from sqlalchemy import ForeignKey, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin


class AgentRun(Base, IdMixin, TimestampMixin):
    __tablename__ = "agent_runs"
    __table_args__ = (
        Index("ix_agentruns_workspace_created", "workspace_id", "created_at"),
        Index("ix_agentruns_workspace_status", "workspace_id", "status"),
        Index("ix_agentruns_workspace_user", "workspace_id", "user_id"),
        Index("ix_agentruns_workspace_trigger", "workspace_id", "trigger"),
    )

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    trigger: Mapped[str] = mapped_column(String(30), default="manual")  # manual | document_upload
    status: Mapped[str] = mapped_column(String(20), default="pending")
    # pending -> researching -> analyzing -> synthesizing -> completed | failed
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    outputs: Mapped[list["AgentRunOutput"]] = relationship(
        back_populates="agent_run", cascade="all, delete-orphan"
    )


class AgentRunOutput(Base, IdMixin, TimestampMixin):
    __tablename__ = "agent_run_outputs"

    agent_run_id: Mapped[str] = mapped_column(ForeignKey("agent_runs.id"), index=True)
    agent_key: Mapped[str] = mapped_column(String(30))
    output_json: Mapped[str] = mapped_column(Text)

    agent_run: Mapped["AgentRun"] = relationship(back_populates="outputs")
