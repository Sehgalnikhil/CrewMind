import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, documents
from app.core.config import get_settings
from app.core.database import init_db

logger = logging.getLogger("crewmind")
settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)


@app.on_event("startup")
async def on_startup() -> None:
    await init_db()
    if not settings.has_llm_key:
        logger.warning(
            "ANTHROPIC_API_KEY is not set — agent features will be unavailable until it is "
            "configured in backend/.env"
        )


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "app": settings.app_name, "llm_configured": settings.has_llm_key}
