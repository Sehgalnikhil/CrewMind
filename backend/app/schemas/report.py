from datetime import datetime

from pydantic import BaseModel


class ReportResponse(BaseModel):
    id: str
    agent_run_id: str
    business_health_score: int
    summary: str
    risks: list[str]
    opportunities: list[str]
    recommendations: list[str]
    title: str
    created_at: datetime


class AgentRunResponse(BaseModel):
    id: str
    workspace_id: str
    trigger: str
    status: str
    error_message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
