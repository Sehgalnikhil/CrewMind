"""Agent framework tests. The Anthropic API itself is mocked — these verify
that our prompt-building, retrieval, and registry wiring behave correctly
without requiring a live API key."""

from unittest.mock import AsyncMock, patch

import pytest

from app.services.agents import AGENT_REGISTRY, DOMAIN_AGENT_KEYS


def test_all_five_agents_registered():
    assert set(AGENT_REGISTRY.keys()) == {
        "research",
        "strategy",
        "finance",
        "operations",
        "legal",
    }


def test_domain_agents_exclude_research():
    assert "research" not in DOMAIN_AGENT_KEYS
    assert set(DOMAIN_AGENT_KEYS) == {"strategy", "finance", "operations", "legal"}


def test_only_research_agent_uses_web_search():
    for key, agent in AGENT_REGISTRY.items():
        assert agent.uses_web_search == (key == "research")


@pytest.mark.asyncio
async def test_agent_run_builds_prompt_with_retrieved_context(async_session):
    agent = AGENT_REGISTRY["finance"]

    with (
        patch(
            "app.services.agents.base.retrieve_chunks",
            return_value=["Q1 revenue was Rs 1.2M, up 20% QoQ."],
        ),
        patch("app.services.agents.base.chat", new_callable=AsyncMock) as mock_chat,
    ):
        mock_chat.return_value = "Revenue grew 20% quarter over quarter."
        result = await agent.run(async_session, org_id="org-1", message="How is revenue trending?")

    assert result == "Revenue grew 20% quarter over quarter."
    mock_chat.assert_awaited_once()
    _, kwargs = mock_chat.call_args
    assert "Q1 revenue was Rs 1.2M" in kwargs["user_message"]
    assert "How is revenue trending?" in kwargs["user_message"]
    assert kwargs["use_web_search"] is False


@pytest.mark.asyncio
async def test_research_agent_requests_web_search(async_session):
    agent = AGENT_REGISTRY["research"]

    with (
        patch("app.services.agents.base.retrieve_chunks", return_value=[]),
        patch("app.services.agents.base.chat", new_callable=AsyncMock) as mock_chat,
    ):
        mock_chat.return_value = "Competitor X raised a Rs 50M Series B last month."
        await agent.run(async_session, org_id="org-1", message="What are competitors doing?")

    _, kwargs = mock_chat.call_args
    assert kwargs["use_web_search"] is True
