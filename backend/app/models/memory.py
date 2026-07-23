from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.topic import Topic


class MemoryRecord(Base, IdMixin, TimestampMixin):
    """Shared, org-scoped memory that every agent reads from and writes to.

    Supports a tiered memory architecture:
      - working:    scratch-pad during a single reasoning run (auto-expires)
      - short_term: recent findings, relevant for hours/days
      - long_term:  consolidated knowledge, persists indefinitely
      - semantic:   facts extracted from documents, always searchable
      - executive:  high-level strategic decisions and insights
    """

    __tablename__ = "memory_records"
    __table_args__ = (
        Index("ix_memory_workspace_created", "workspace_id", "created_at"),
        Index("ix_memory_workspace_tier", "workspace_id", "tier"),
        Index("ix_memory_workspace_kind", "workspace_id", "kind"),
    )

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    agent_source: Mapped[str] = mapped_column(String(50))
    kind: Mapped[str] = mapped_column(String(30))  # fact | decision | metric | risk | opportunity
    content: Mapped[str] = mapped_column(Text)

    # --- New tiered memory fields ---

    # Human-readable title for display in the Memory page.
    title: Mapped[str] = mapped_column(String(255), default="")

    # Memory tier — drives retention and retrieval weighting.
    tier: Mapped[str] = mapped_column(
        String(20), default="short_term", index=True
    )  # working | short_term | long_term | semantic | executive

    # Decay-based relevance score (0.0–1.0).  Higher = more important.
    importance: Mapped[float] = mapped_column(Float, default=0.5)

    # ChromaDB vector ID for semantic search.  None if not yet embedded.
    embedding_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    # JSON list of related memory IDs — the evidence chain.
    linked_memory_ids: Mapped[str] = mapped_column(Text, default="[]")

    # TTL for working / short-term memories.  None = never expires.
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # How many times this memory has been retrieved (drives consolidation).
    access_count: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    topics: Mapped[list["Topic"]] = relationship(
        "Topic",
        secondary="memory_topic_links",
        back_populates="memories",
        lazy="selectin"
    )
