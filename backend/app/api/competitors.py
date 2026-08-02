import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import RequestContext, get_request_context
from app.services.llm.gemini_client import chat

router = APIRouter(prefix="/api/competitors", tags=["competitors"])

class ScrapeRequest(BaseModel):
    url: str

class CompetitorProfile(BaseModel):
    name: str
    threat_level: str # 'High', 'Medium', 'Low'
    positioning: str
    strengths: list[str]
    weaknesses: list[str]
    pricing_strategy: str

@router.post("/scrape")
async def scrape_competitor(
    req: ScrapeRequest,
    ctx: RequestContext = Depends(get_request_context)
) -> dict:
    """Mock endpoint to scrape a competitor URL and synthesize a digital twin profile."""
    prompt = f"Analyze the competitor website at URL: {req.url}. Synthesize their strategic positioning, 3 key strengths, 3 weaknesses, and their pricing strategy as if you are the Chief Strategy Officer. Assign a threat level of High, Medium, or Low."
    system_instruction = "You are an expert corporate strategist. Output strictly valid JSON conforming to the requested schema."
    
    try:
        response_str = await chat(
            system=system_instruction,
            user_message=prompt,
            response_schema=CompetitorProfile
        )
        return json.loads(response_str)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to synthesize competitor twin: {e}")

class DebateRequest(BaseModel):
    url: str
    user_message: str

@router.post("/debate")
async def debate_competitor(
    req: DebateRequest,
    ctx: RequestContext = Depends(get_request_context)
) -> dict:
    """Mock endpoint to debate against a competitor digital twin."""
    prompt = f"You are the CEO of the competitor company located at {req.url}. The user (your rival) just said: '{req.user_message}'. Respond directly, aggressively, and strategically defending your position."
    system_instruction = "You are a ruthless CEO of a competitor company. Keep your response under 3 sentences."
    
    try:
        response_str = await chat(
            system=system_instruction,
            user_message=prompt
        )
        return {"response": response_str}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to debate competitor twin: {e}")
