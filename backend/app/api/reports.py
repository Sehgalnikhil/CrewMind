import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_org
from app.core.database import get_db
from app.models.organization import Organization
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
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> list[ReportResponse]:
    result = await db.execute(
        select(Report).where(Report.org_id == org.id).order_by(Report.created_at.desc())
    )
    return [_to_response(r) for r in result.scalars().all()]


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> ReportResponse:
    report = await db.get(Report, report_id)
    if report is None or report.org_id != org.id:
        raise HTTPException(status_code=404, detail="Report not found")
    return _to_response(report)
