from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin


class MemoryRecord(Base, IdMixin, TimestampMixin):
    """Shared, org-scoped memory that every agent reads from and writes to."""

    __tablename__ = "memory_records"

    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), index=True)
    agent_source: Mapped[str] = mapped_column(String(50))
    kind: Mapped[str] = mapped_column(String(30))  # fact | decision | metric | risk | opportunity
    content: Mapped[str] = mapped_column(Text)
