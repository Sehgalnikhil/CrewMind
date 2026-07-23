"""Per-agent task queue.

Every executive owns a queue of tasks that can be created manually, spawned
by workflows, or generated autonomously.  Tasks have priorities, statuses,
optional parent references (sub-task trees), and persisted results.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin


class AgentTask(Base, IdMixin, TimestampMixin):
    __tablename__ = "agent_tasks"

    workspace_id: Mapped[str] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )
    agent_key: Mapped[str] = mapped_column(String(30), index=True)

    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")

    # queued → running → completed | failed | cancelled
    status: Mapped[str] = mapped_column(String(20), default="queued", index=True)

    # 1 = lowest, 5 = critical
    priority: Mapped[int] = mapped_column(Integer, default=3)

    # Optional due date for scheduled tasks.
    due_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # JSON-serialized result once complete.
    result_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Self-referential for sub-tasks.
    parent_task_id: Mapped[str | None] = mapped_column(
        ForeignKey("agent_tasks.id", ondelete="SET NULL"), nullable=True
    )
    subtasks: Mapped[list["AgentTask"]] = relationship(
        back_populates="parent_task",
        cascade="all, delete-orphan",
    )
    parent_task: Mapped["AgentTask | None"] = relationship(
        back_populates="subtasks", remote_side="AgentTask.id"
    )

    # What triggered this task: manual | workflow | autonomous | inter-agent
    source: Mapped[str] = mapped_column(String(30), default="manual")

    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
