from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin


class Report(Base, IdMixin, TimestampMixin):
    __tablename__ = "reports"

    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), index=True)
    agent_run_id: Mapped[str] = mapped_column(ForeignKey("agent_runs.id"))
    business_health_score: Mapped[int] = mapped_column(Integer)
    summary: Mapped[str] = mapped_column(Text)
    risks_json: Mapped[str] = mapped_column(Text)  # JSON list[str | dict]
    opportunities_json: Mapped[str] = mapped_column(Text)
    recommendations_json: Mapped[str] = mapped_column(Text)
    title: Mapped[str] = mapped_column(String(255), default="Executive Report")
