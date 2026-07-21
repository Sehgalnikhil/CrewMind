"""Synthesizes the outputs of all five agents into one executive report."""

import json
import logging
import re

from app.services.llm.anthropic_client import chat

logger = logging.getLogger("crewmind.coordinator")

COORDINATOR_SYSTEM_PROMPT = (
    "You are the Coordinator for CrewMind, an AI executive team. You have just received "
    "independent assessments from five specialist agents: Research (external market context), "
    "Strategy/CEO, Finance/CFO, Operations/COO, and Legal. Your job is to synthesize their "
    "findings into a single executive report for a business leader.\n\n"
    "Respond with ONLY a single valid JSON object — no markdown code fences, no commentary "
    "before or after — matching exactly this schema:\n"
    "{\n"
    '  "summary": "2-4 sentence executive summary of the overall business state",\n'
    '  "business_health_score": <integer 0-100>,\n'
    '  "risks": ["specific risk 1", "specific risk 2", ...],\n'
    '  "opportunities": ["specific opportunity 1", ...],\n'
    '  "recommendations": ["specific, actionable recommendation 1", ...]\n'
    "}\n\n"
    "The business_health_score should reflect overall health considering growth, financial "
    "stability, operational efficiency, and legal/compliance risk — 0 is failing, 50 is stable "
    "but with real concerns, 100 is thriving with no material risks. Base every risk, "
    "opportunity, and recommendation on what the specialist agents actually found — do not "
    "invent findings that weren't raised. Keep each list item to one concise sentence. Aim for "
    "3-6 items per list."
)


class CoordinatorError(Exception):
    pass


def _strip_code_fences(text: str) -> str:
    text = text.strip()
    match = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.DOTALL)
    return match.group(1) if match else text


async def synthesize(agent_outputs: dict[str, str]) -> dict:
    """agent_outputs maps agent_key -> that agent's raw text output."""
    sections = "\n\n".join(
        f"## {key.title()} Agent findings\n{text}" for key, text in agent_outputs.items()
    )
    user_message = f"Here are the specialist agents' findings:\n\n{sections}"

    raw = await chat(system=COORDINATOR_SYSTEM_PROMPT, user_message=user_message, max_tokens=1536)

    try:
        parsed = json.loads(_strip_code_fences(raw))
    except json.JSONDecodeError:
        logger.warning("Coordinator returned non-JSON output, using fallback report: %r", raw[:300])
        return {
            "summary": raw.strip()[:1000] or "The coordinator could not produce a structured summary.",
            "business_health_score": 50,
            "risks": [],
            "opportunities": [],
            "recommendations": [],
        }

    return {
        "summary": str(parsed.get("summary", "")).strip(),
        "business_health_score": max(0, min(100, int(parsed.get("business_health_score", 50)))),
        "risks": [str(r) for r in parsed.get("risks", [])],
        "opportunities": [str(o) for o in parsed.get("opportunities", [])],
        "recommendations": [str(r) for r in parsed.get("recommendations", [])],
    }
