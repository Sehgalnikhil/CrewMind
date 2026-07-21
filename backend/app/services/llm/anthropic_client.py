"""Single point of contact with the Anthropic API for all agents.

Centralizes model choice, the optional web-search tool, and graceful
degradation when no API key is configured (so the rest of the app can be
built and tested without live credentials).
"""

import logging
from collections.abc import AsyncIterator

import anthropic

from app.core.config import get_settings

logger = logging.getLogger("crewmind.llm")
settings = get_settings()


class LLMNotConfiguredError(Exception):
    """Raised when an agent call is attempted without an API key."""


_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if not settings.has_llm_key:
        raise LLMNotConfiguredError(
            "ANTHROPIC_API_KEY is not configured. Add it to backend/.env to enable agents."
        )
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


WEB_SEARCH_TOOL = {"type": "web_search_20250305", "name": "web_search", "max_uses": 3}


async def chat(
    system: str,
    user_message: str,
    model: str | None = None,
    max_tokens: int = 2048,
    use_web_search: bool = False,
) -> str:
    """Single-shot, non-streaming call. Returns the concatenated text output."""
    client = _get_client()
    kwargs: dict = {
        "model": model or settings.anthropic_model,
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": user_message}],
    }
    if use_web_search:
        kwargs["tools"] = [WEB_SEARCH_TOOL]

    try:
        response = await client.messages.create(**kwargs)
    except anthropic.BadRequestError as exc:
        if use_web_search:
            logger.warning("web_search tool unavailable on this account, retrying without it: %s", exc)
            kwargs.pop("tools", None)
            response = await client.messages.create(**kwargs)
        else:
            raise

    return "".join(block.text for block in response.content if block.type == "text").strip()


async def stream_chat(
    system: str,
    user_message: str,
    model: str | None = None,
    max_tokens: int = 2048,
) -> AsyncIterator[str]:
    """Streams incremental text deltas for a single-turn chat message."""
    client = _get_client()
    async with client.messages.stream(
        model=model or settings.anthropic_model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user_message}],
    ) as stream:
        async for text in stream.text_stream:
            yield text
