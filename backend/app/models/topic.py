from sqlalchemy import Column, ForeignKey, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING, List

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.memory import MemoryRecord


memory_topic_links = Table(
    "memory_topic_links",
    Base.metadata,
    Column("memory_id", String(36), ForeignKey("memory_records.id", ondelete="CASCADE"), primary_key=True),
    Column("topic_id", String(36), ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True),
)


class Topic(Base, IdMixin, TimestampMixin):
    __tablename__ = "topics"

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    
    # We will use this field to cache the generated wiki markdown.
    wiki_content: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    memories: Mapped[List["MemoryRecord"]] = relationship(
        "MemoryRecord",
        secondary=memory_topic_links,
        back_populates="topics",
        lazy="selectin"
    )
