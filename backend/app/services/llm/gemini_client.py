"""Single point of contact with the Gemini API for all agents.

Centralizes model choice, the optional web-search tool, and graceful
degradation when no API key is configured (so the rest of the app can be
built and tested without live credentials).
"""

import logging
from collections.abc import AsyncIterator

from google import genai
from google.genai import types

from app.core.config import get_settings

logger = logging.getLogger("crewmind.llm")
settings = get_settings()


class LLMNotConfiguredError(Exception):
    """Raised when an agent call is attempted without an API key."""


_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if not settings.has_llm_key:
        raise LLMNotConfiguredError(
            "GEMINI_API_KEY is not configured. Add it to backend/.env to enable agents."
        )
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


WEB_SEARCH_TOOL = {"google_search": {}}


async def chat(
    system: str,
    user_message: str,
    model: str | None = None,
    max_tokens: int = 2048,
    use_web_search: bool = False,
) -> str:
    """Single-shot, non-streaming call. Returns the concatenated text output."""
    client = _get_client()
    config = types.GenerateContentConfig(
        system_instruction=system,
        max_output_tokens=max_tokens,
    )
    if use_web_search:
        config.tools = [{"google_search": {}}]

    response = await client.aio.models.generate_content(
        model=model or settings.gemini_model,
        contents=user_message,
        config=config,
    )

    return response.text or ""


async def stream_chat(
    system: str,
    user_message: str,
    model: str | None = None,
    max_tokens: int = 2048,
) -> AsyncIterator[str]:
    """Streams incremental text deltas for a single-turn chat message."""
    client = _get_client()
    config = types.GenerateContentConfig(
        system_instruction=system,
        max_output_tokens=max_tokens,
    )
    
    stream = await client.aio.models.generate_content_stream(
        model=model or settings.gemini_model,
        contents=user_message,
        config=config,
    )
    
    async for chunk in stream:
        if chunk.text:
            yield chunk.text
