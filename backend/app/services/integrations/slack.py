from typing import Any
import logging
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

logger = logging.getLogger("crewmind.integrations.slack")

class SlackService:
    def __init__(self, access_token: str):
        self.client = WebClient(token=access_token)

    def search_messages(self, query: str) -> list[dict[str, Any]]:
        """Search Slack for messages matching a query."""
        try:
            response = self.client.search_messages(query=query)
            return response.data.get("messages", {}).get("matches", [])
        except SlackApiError as e:
            logger.error(f"Error searching Slack: {e.response['error']}")
            return []

    def send_message(self, channel: str, text: str) -> dict[str, Any]:
        """Send a message to a specific Slack channel."""
        try:
            response = self.client.chat_postMessage(channel=channel, text=text)
            return response.data
        except SlackApiError as e:
            logger.error(f"Error sending message to Slack: {e.response['error']}")
            return {"error": e.response['error']}
