from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin


class OrganizationMetric(Base, IdMixin, TimestampMixin):
    __tablename__ = "organization_metrics"

    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), index=True, unique=True)
    
    revenue_run_rate: Mapped[float] = mapped_column(default=0.0)
    revenue_trend: Mapped[str] = mapped_column(String(255), default="")
    revenue_trend_up: Mapped[bool] = mapped_column(default=True)
    revenue_series_json: Mapped[str] = mapped_column(Text, default="[]")
    
    net_cash_flow: Mapped[float] = mapped_column(default=0.0)
    cash_flow_trend: Mapped[str] = mapped_column(String(255), default="")
    cash_flow_trend_up: Mapped[bool] = mapped_column(default=True)
    cash_flow_series_json: Mapped[str] = mapped_column(Text, default="[]")
