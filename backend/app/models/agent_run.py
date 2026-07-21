from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin


class AgentRun(Base, IdMixin, TimestampMixin):
    __tablename__ = "agent_runs"

    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), index=True)
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
