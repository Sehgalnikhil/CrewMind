"""Persistent state for each executive agent within an organization.

Each agent maintains its own goals, observations, confidence level, and
personality profile.  This state persists across runs and informs the agent's
system prompt, letting it behave as a continuous entity rather than a
stateless function.
"""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin, utcnow


class AgentState(Base, IdMixin, TimestampMixin):
    __tablename__ = "agent_states"
    __table_args__ = (UniqueConstraint("workspace_id", "agent_key", name="uq_agent_state_workspace_key"),)

    workspace_id: Mapped[str] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )
    agent_key: Mapped[str] = mapped_column(String(30), index=True)

    # Current goals (JSON list of strings).
    goals_json: Mapped[str] = mapped_column(Text, default="[]")

    # Recent observations the agent has accumulated (JSON list).
    observations_json: Mapped[str] = mapped_column(Text, default="[]")

    # Self-assessed confidence on its current understanding (0-100).
    confidence: Mapped[float] = mapped_column(Float, default=50.0)

    # Personality parameters that modulate system prompt generation (JSON dict).
    personality_json: Mapped[str] = mapped_column(Text, default="{}")

    # Reasoning history — last N reasoning traces (JSON list).
    reasoning_history_json: Mapped[str] = mapped_column(Text, default="[]")

    last_active_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
