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
