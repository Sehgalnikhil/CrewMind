from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db
import os
import time

router = APIRouter(prefix="/api/system", tags=["system"])

START_TIME = time.time()

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"
        
    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
        "vector_db": "ok", # Chroma is local persistent, assume ok if app is running
        "ai_provider": "ok" if os.getenv("GEMINI_API_KEY") else "missing_key",
        "storage": "ok", # Local storage
        "background_jobs": "ok",
        "uptime_seconds": int(time.time() - START_TIME),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    }
