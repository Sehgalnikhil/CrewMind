from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin


class WorkspaceUsage(Base, IdMixin, TimestampMixin):
    __tablename__ = "workspace_usage"

    workspace_id: Mapped[str] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, unique=True
    )

    ai_requests_used: Mapped[int] = mapped_column(Integer, default=0)
    storage_bytes_used: Mapped[int] = mapped_column(BigInteger, default=0)
    additional_ai_credits: Mapped[int] = mapped_column(Integer, default=0)
    
    reset_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    workspace = relationship("Workspace", backref="usage")

    @property
    def total_credits_available(self) -> int:
        # In a real app, you would sum the plan's base credits + additional_ai_credits
        # The API will calculate this dynamically using billing_catalog
        return self.additional_ai_credits
