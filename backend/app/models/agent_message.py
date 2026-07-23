"""Inter-agent communication messages.

Structured messages that flow between executives — visible in the War Room
and persisted for audit.  Each message carries intent, confidence, evidence,
and threading information so conversations can be reconstructed.
"""

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin


class AgentMessage(Base, IdMixin, TimestampMixin):
    __tablename__ = "agent_messages"

    workspace_id: Mapped[str] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )

    sender: Mapped[str] = mapped_column(String(30), index=True)
    receiver: Mapped[str] = mapped_column(String(30), index=True)

    # Structured intent: request_review | provide_input | flag_risk |
    # share_finding | challenge | agree | delegate | ask_question
    intent: Mapped[str] = mapped_column(String(40))

    content: Mapped[str] = mapped_column(Text)

    # How confident the sender is (0-100).
    confidence: Mapped[float] = mapped_column(Float, default=75.0)

    # 1 (low) – 5 (critical)
    priority: Mapped[int] = mapped_column(Integer, default=3)

    # JSON list of evidence references (document IDs, memory IDs, URLs).
    evidence_json: Mapped[str] = mapped_column(Text, default="[]")

    # Thread grouping — all messages in one deliberation share this ID.
    thread_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)

    # Tie to an agent run or reasoning pipeline execution.
    execution_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)

    # Optional structured result (JSON) for completed requests.
    result_json: Mapped[str | None] = mapped_column(Text, nullable=True)
