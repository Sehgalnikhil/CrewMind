"""Single point of contact with the Gemini API for all agents.

Centralizes model choice, the optional web-search tool, and graceful
degradation when no API key is configured (so the rest of the app can be
built and tested without live credentials).

Free-tier Gemini keys have a very low requests-per-minute quota, and the
boardroom "all agents" mode fans one question out to several agents at
once — so every call goes through a shared semaphore (to avoid bursting)
and retries 429/503 responses with backoff before giving up.
"""

import asyncio
import logging
import re
from collections.abc import AsyncIterator
from typing import Any

from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from app.core.config import get_settings

logger = logging.getLogger("crewmind.llm")
settings = get_settings()


class LLMNotConfiguredError(Exception):
    """Raised when an agent call is attempted without an API key."""


class LLMRateLimitError(Exception):
    """Raised when the Gemini quota stays exhausted after retries."""

    def __init__(self) -> None:
        super().__init__(
            "The Gemini API rate limit was hit and didn't clear after several retries. "
            "Wait a minute and try again, or upgrade the key's quota at https://aistudio.google.com/."
        )


_client: genai.Client | None = None

# Keep concurrent Gemini requests low: free-tier keys allow only a handful of
# requests per minute, and crew mode alone would otherwise fire 6 at once.
_semaphore = asyncio.Semaphore(2)

_MAX_ATTEMPTS = 4
_BASE_DELAY_SECONDS = 5.0


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


def _is_retryable(exc: genai_errors.APIError) -> bool:
    return exc.code in (429, 500, 503)


def _model_for_attempt(requested: str | None, attempt: int, rate_limited: bool) -> str:
    """Gemini quotas are per-model: after the primary model 429s, later
    attempts go to the fallback model, which has its own quota pool."""
    primary = requested or settings.gemini_model
    fallback = settings.gemini_fallback_model
    if rate_limited and attempt > 0 and fallback and fallback != primary:
        return fallback
    return primary


def _retry_delay(exc: genai_errors.APIError, attempt: int) -> float:
    """Honor the server-suggested retryDelay when present, else back off exponentially."""
    try:
        for detail in (exc.details or {}).get("error", {}).get("details", []):
            if detail.get("@type", "").endswith("RetryInfo"):
                match = re.match(r"([\d.]+)s", detail.get("retryDelay", ""))
                if match:
                    return float(match.group(1)) + 1.0
    except Exception:  # noqa: BLE001 — details shape varies; fall back to backoff
        pass
    return _BASE_DELAY_SECONDS * (2**attempt)


async def chat(
    system: str,
    user_message: str,
    model: str | None = None,
    max_tokens: int = 8192,
    use_web_search: bool = False,
    response_schema: type[Any] | None = None,
) -> str:
    """Single-shot, non-streaming call. Returns the concatenated text output."""
    client = _get_client()
    web_search = use_web_search
    rate_limited = False

    async with _semaphore:
        for attempt in range(_MAX_ATTEMPTS):
            target = _model_for_attempt(model, attempt, rate_limited)
            # Thinking models spend output tokens on reasoning before the
            # answer, so the cap must leave room for both.
            config = types.GenerateContentConfig(
                system_instruction=system,
                max_output_tokens=max_tokens,
            )
            if web_search:
                config.tools = [{"google_search": {}}]
            if response_schema:
                config.response_mime_type = "application/json"
                config.response_schema = response_schema

            try:
                response = await client.aio.models.generate_content(
                    model=target,
                    contents=user_message,
                    config=config,
                )
                return response.text or ""
            except genai_errors.APIError as exc:
                if not _is_retryable(exc) or attempt == _MAX_ATTEMPTS - 1:
                    if exc.code == 429:
                        raise LLMRateLimitError() from exc
                    raise
                if exc.code == 429 and web_search:
                    # Search grounding has its own (tiny) free-tier quota;
                    # answer from context alone rather than failing.
                    web_search = False
                    logger.warning("Google Search grounding rate-limited; retrying without web search")
                    continue
                if exc.code == 429 and not rate_limited:
                    # Switch to the fallback model right away — its quota is separate.
                    rate_limited = True
                    logger.warning("Gemini %s rate-limited; falling back to %s", target, settings.gemini_fallback_model)
                    continue
                rate_limited = rate_limited or exc.code == 429
                delay = _retry_delay(exc, attempt)
                logger.warning(
                    "Gemini returned %s; retrying in %.1fs (attempt %d/%d)",
                    exc.code, delay, attempt + 1, _MAX_ATTEMPTS,
                )
                await asyncio.sleep(delay)

    raise LLMRateLimitError()


async def stream_chat(
    system: str,
    user_message: str,
    model: str | None = None,
    max_tokens: int = 8192,
) -> AsyncIterator[str]:
    """Streams incremental text deltas for a single-turn chat message."""
    client = _get_client()
    config = types.GenerateContentConfig(
        system_instruction=system,
        max_output_tokens=max_tokens,
    )

    rate_limited = False
    async with _semaphore:
        for attempt in range(_MAX_ATTEMPTS):
            target = _model_for_attempt(model, attempt, rate_limited)
            yielded = False
            try:
                stream = await client.aio.models.generate_content_stream(
                    model=target,
                    contents=user_message,
                    config=config,
                )
                async for chunk in stream:
                    if chunk.text:
                        yielded = True
                        yield chunk.text
                return
            except genai_errors.APIError as exc:
                # Retrying after partial output would duplicate text downstream.
                if yielded or not _is_retryable(exc) or attempt == _MAX_ATTEMPTS - 1:
                    if exc.code == 429:
                        raise LLMRateLimitError() from exc
                    raise
                if exc.code == 429 and not rate_limited:
                    rate_limited = True
                    logger.warning("Gemini %s rate-limited; falling back to %s", target, settings.gemini_fallback_model)
                    continue
                rate_limited = rate_limited or exc.code == 429
                delay = _retry_delay(exc, attempt)
                logger.warning(
                    "Gemini stream returned %s; retrying in %.1fs (attempt %d/%d)",
                    exc.code, delay, attempt + 1, _MAX_ATTEMPTS,
                )
                await asyncio.sleep(delay)

    raise LLMRateLimitError()
