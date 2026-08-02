from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.api.deps import RequestContext, get_request_context
from app.services.llm.gemini_client import chat

router = APIRouter(prefix="/api/slack", tags=["slack"])

class SlackWebhookPayload(BaseModel):
    text: str
    channel: str | None = None
    user: str | None = None

@router.post("/webhook")
async def slack_webhook(
    payload: SlackWebhookPayload,
    ctx: RequestContext = Depends(get_request_context)
) -> dict:
    """Mock endpoint to receive Slack webhooks and synthesize a Board response."""
    
    # In a real integration, we'd verify the Slack signature.
    # Here, we just extract the question and consult the agents.
    question = payload.text.replace("@CrewMind", "").strip()
    
    prompt = f"The board was just asked this question via Slack: '{question}'. As the Coordinator Agent, synthesize a final 'Signed Verdict' integrating perspectives from Finance, Operations, Strategy, Research, and Legal. Provide a clear recommendation."
    system_instruction = "You are the Coordinator AI for an executive board. Keep your response concise, professional, and formatted for Slack."
    
    try:
        response_str = await chat(
            system=system_instruction,
            user_message=prompt
        )
        return {"response": response_str}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to synthesize board response: {e}")
