from sqlalchemy import ForeignKey, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin


class Conversation(Base, IdMixin, TimestampMixin):
    __tablename__ = "conversations"
    __table_args__ = (
        Index("ix_conversations_workspace_created", "workspace_id", "created_at"),
        Index("ix_conversations_workspace_user", "workspace_id", "user_id"),
    )

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), default="New conversation")
    mode: Mapped[str] = mapped_column(String(20), default="single_agent")  # single_agent | all_agents
    agent_key: Mapped[str | None] = mapped_column(String(30), nullable=True)

    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at"
    )


class Message(Base, IdMixin, TimestampMixin):
    __tablename__ = "messages"

    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"), index=True)
    role: Mapped[str] = mapped_column(String(20))  # user | agent | system
    agent_key: Mapped[str | None] = mapped_column(String(30), nullable=True)
    content: Mapped[str] = mapped_column(Text)

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")
