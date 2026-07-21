from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.models.user import User

router = APIRouter(prefix="/api/status", tags=["status"])


@router.get("")
async def get_status(_user: User = Depends(get_current_user)) -> dict:
    settings = get_settings()
    return {"llm_configured": settings.has_llm_key, "llm_model": settings.anthropic_model}
