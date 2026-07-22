import json
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_org
from app.core.database import get_db
from app.models.organization import Organization
from app.models.metric import OrganizationMetric
from app.schemas.metric import OrganizationMetricResponse

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

# The initial mock data to seed
INITIAL_REVENUE = [42.0, 48.0, 45.0, 61.0, 58.0, 72.0, 69.0, 84.0, 91.0, 88.0, 104.0, 121.0]
INITIAL_CASHFLOW = [12.0, 15.0, 11.0, 18.0, 14.0, 22.0, 20.0, 25.0, 28.0, 22.0, 27.0, 31.0]


@router.get("", response_model=OrganizationMetricResponse)
async def get_metrics(
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> OrganizationMetricResponse:
    result = await db.execute(select(OrganizationMetric).where(OrganizationMetric.org_id == org.id))
    metric = result.scalars().first()
    
    if not metric:
        metric = OrganizationMetric(
            org_id=org.id,
            revenue_run_rate=1.24,
            revenue_trend="+12% vs last quarter",
            revenue_trend_up=True,
            revenue_series_json=json.dumps(INITIAL_REVENUE),
            net_cash_flow=31.0,
            cash_flow_trend="+29% vs last quarter",
            cash_flow_trend_up=True,
            cash_flow_series_json=json.dumps(INITIAL_CASHFLOW)
        )
        db.add(metric)
        await db.commit()
        await db.refresh(metric)
        
    return OrganizationMetricResponse(
        id=metric.id,
        org_id=metric.org_id,
        revenue_run_rate=metric.revenue_run_rate,
        revenue_trend=metric.revenue_trend,
        revenue_trend_up=metric.revenue_trend_up,
        revenue_series=json.loads(metric.revenue_series_json),
        net_cash_flow=metric.net_cash_flow,
        cash_flow_trend=metric.cash_flow_trend,
        cash_flow_trend_up=metric.cash_flow_trend_up,
        cash_flow_series=json.loads(metric.cash_flow_series_json),
        created_at=metric.created_at
    )
