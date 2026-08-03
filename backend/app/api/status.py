from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import get_settings
from app.models.user import User

router = APIRouter(prefix="/api/status", tags=["status"])


@router.get("/latest-error")
async def get_latest_error(db: AsyncSession = Depends(get_db)):
    from app.models.agent_run import AgentRun
    from sqlalchemy import select
    result = await db.execute(
        select(AgentRun)
        .where(AgentRun.status == "failed")
        .order_by(AgentRun.created_at.desc())
        .limit(1)
    )
    run = result.scalar_one_or_none()
    if run:
        return {"error_message": run.error_message, "id": run.id}
    return {"error_message": None}


@router.get("")
async def get_status(_user: User = Depends(get_current_user)) -> dict:
    settings = get_settings()
    return {"llm_configured": settings.has_llm_key, "llm_model": settings.gemini_model}
