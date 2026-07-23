import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import agent_runs, agent_state, auth, chat, documents, me, members, memory, metrics, reports, status, ws, knowledge, system, sessions, mfa, invitations, organization, api_keys, billing, war_room
from app.core.config import get_settings
from app.core.database import init_db
import logging

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
app.include_router(chat.router)
app.include_router(agent_runs.router)
app.include_router(reports.router)
app.include_router(metrics.router)
app.include_router(status.router)
app.include_router(ws.router)
app.include_router(agent_state.router)
app.include_router(memory.router)
app.include_router(knowledge.router)
app.include_router(system.router)
app.include_router(sessions.router)
app.include_router(mfa.router)
app.include_router(invitations.router)
app.include_router(organization.router)
app.include_router(api_keys.router)
app.include_router(billing.router)
app.include_router(me.router)
app.include_router(members.router)
app.include_router(war_room.router, prefix="/api/warroom", tags=["War Room"])


import asyncio

@app.on_event("startup")
async def on_startup() -> None:
    from app.services.agents.loop import run_autonomous_loop
    await init_db()
    # Keep RBAC roles/permissions in sync with the canonical matrix.
    from app.scripts.seed import seed
    await seed()
    if not settings.has_llm_key:
        logger.warning(
            "GEMINI_API_KEY is not set — agent features will be unavailable until it is "
            "configured in backend/.env"
        )
    asyncio.create_task(run_autonomous_loop())

@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "app": settings.app_name, "llm_configured": settings.has_llm_key}
