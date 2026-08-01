from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import RequestContext, get_request_context
from app.core.database import get_db
from app.schemas.nexus import NexusChatRequest, NexusChatResponse
from app.services.llm import gemini_client

router = APIRouter(prefix="/api/nexus", tags=["nexus"])

NEXUS_SYSTEM_PROMPT = """You are Nexus, the highly efficient AI OS concierge for CrewMind.
CrewMind is an autonomous AI ERP system.
Your job is to answer quick questions about how to use the system and route the user to the correct tools when they want to do something.
If the user greets you, greet them back warmly and ask how you can help.
If they ask about high-level metrics, cash flow, burn rate, or KPIs, tell them to check the Risk Radar on Mission Control and route them to /dashboard.
If they want to debate, deliberate, or hold a meeting, route them to the War Room (/war-room).
If they want to run a simulation or scenario, route them to the Simulator (/simulator).
If they want to find signed verdicts or finalized decisions, route them to Reports (/reports).
If they want to find a document, upload a file, or review data, route them to Documents (/documents).
If they want to search for something from the past, route them to Executive Memory (/memory).
If they want to chat with the full AI crew or a specific executive, route them to the Boardroom chat (/chat).

If they ask something you cannot handle or that requires deep analysis, tell them "That deserves the full crew. Take it to the Boardroom and I'll bring the right executives in." and route them to /chat (with label "Open Boardroom Chat").

Keep your replies short, professional, and confident (1-2 sentences max).
Do not use markdown.
"""

@router.post("/chat", response_model=NexusChatResponse)
async def nexus_chat(
    payload: NexusChatRequest,
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> NexusChatResponse:
    # Build context string from history
    context_str = ""
    if payload.history:
        for turn in payload.history:
            context_str += f"{turn.role.capitalize()}: {turn.text}\n"
    
    user_message = f"{context_str}User: {payload.query}" if context_str else payload.query

    # Call Gemini to get a structured JSON response
    response_text = await gemini_client.chat(
        system=NEXUS_SYSTEM_PROMPT,
        user_message=user_message,
        response_schema=NexusChatResponse,
    )
    
    # Parse the structured JSON response
    # gemini_client returns a JSON string since we passed response_schema
    return NexusChatResponse.model_validate_json(response_text)
