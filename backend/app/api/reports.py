import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import RequestContext, get_request_context
from app.core.database import get_db
from app.models.report import Report
from app.schemas.report import ReportResponse

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _to_response(report: Report) -> ReportResponse:
    return ReportResponse(
        id=report.id,
        agent_run_id=report.agent_run_id,
        business_health_score=report.business_health_score,
        summary=report.summary,
        risks=json.loads(report.risks_json),
        opportunities=json.loads(report.opportunities_json),
        recommendations=json.loads(report.recommendations_json),
        title=report.title,
        created_at=report.created_at,
    )


@router.get("", response_model=list[ReportResponse])
async def list_reports(
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> list[ReportResponse]:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    result = await db.execute(
        select(Report).where(Report.workspace_id == workspace_id).order_by(Report.created_at.desc())
    )
    return [_to_response(r) for r in result.scalars().all()]


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> ReportResponse:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    report = await db.get(Report, report_id)
    if report is None or report.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Report not found")
    return _to_response(report)

from pydantic import BaseModel
from app.services.llm.gemini_client import chat

class TimelineEvent(BaseModel):
    id: str
    title: str
    description: str
    date: str
    type: str # 'risk' or 'opportunity'
    impact_score: int # 1 to 10
    agent_rationale: str

class CrystalBallResponse(BaseModel):
    events: list[TimelineEvent]

@router.get("/crystal-ball/predict")
async def crystal_ball_predict(
    ctx: RequestContext = Depends(get_request_context)
) -> dict:
    """Predicts 3 risk events and 3 opportunity events over the next 12 months using the Strategy Agent."""
    
    prompt = "Based on current market conditions and general corporate strategy, predict 3 major risk events and 3 major opportunity windows that could occur in the next 12 months. Assign each a future date (YYYY-MM-DD), an impact score (1-10), and a detailed 2-sentence rationale from a Chief Strategy Officer perspective."
    system_instruction = "You are the Chief Strategy Officer AI. Output strictly valid JSON conforming to the requested schema."
    
    try:
        response_str = await chat(
            system=system_instruction,
            user_message=prompt,
            response_schema=CrystalBallResponse
        )
        return json.loads(response_str)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate prediction: {e}")
