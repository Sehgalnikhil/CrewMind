from typing import Any

from sqlalchemy import Boolean, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin


class WarRoomSession(Base, IdMixin, TimestampMixin):
    __tablename__ = "war_room_sessions"

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    question: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="running")  # idle, running, verdict
    verdict_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)

    turns: Mapped[list["WarRoomTurn"]] = relationship("WarRoomTurn", back_populates="session", cascade="all, delete-orphan", order_by="WarRoomTurn.turn_index")


class WarRoomTurn(Base, IdMixin, TimestampMixin):
    __tablename__ = "war_room_turns"

    session_id: Mapped[str] = mapped_column(ForeignKey("war_room_sessions.id", ondelete="CASCADE"), index=True)
    turn_index: Mapped[int] = mapped_column(Integer, nullable=False)
    
    is_user: Mapped[bool] = mapped_column(Boolean, default=False)
    speaker: Mapped[str | None] = mapped_column(String, nullable=True)
    responding_to: Mapped[str | None] = mapped_column(String, nullable=True)
    phase: Mapped[str | None] = mapped_column(String, nullable=True)
    reasoning: Mapped[str | None] = mapped_column(String, nullable=True)
    text: Mapped[str] = mapped_column(String, nullable=False)
    stance: Mapped[str | None] = mapped_column(String, nullable=True)
    confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)
    evidence_json: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    session: Mapped["WarRoomSession"] = relationship("WarRoomSession", back_populates="turns")
