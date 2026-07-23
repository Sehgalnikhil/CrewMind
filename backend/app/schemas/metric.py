from datetime import datetime
from pydantic import BaseModel

class OrganizationMetricResponse(BaseModel):
    id: str
    workspace_id: str
    revenue_run_rate: float
    revenue_trend: str
    revenue_trend_up: bool
    revenue_series: list[float]
    net_cash_flow: float
    cash_flow_trend: str
    cash_flow_trend_up: bool
    cash_flow_series: list[float]
    created_at: datetime
