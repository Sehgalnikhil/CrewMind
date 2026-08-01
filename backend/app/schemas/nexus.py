from pydantic import BaseModel, Field


class AssistantTurn(BaseModel):
    role: str = Field(description="'user' or 'nexus'")
    text: str


class NexusChatRequest(BaseModel):
    query: str = Field(..., description="The user's latest message")
    history: list[AssistantTurn] = Field(default_factory=list, description="Previous chat turns for context")


class NexusChatResponse(BaseModel):
    reply: str = Field(..., description="Nexus's text reply to the user")
    to: str | None = Field(None, description="An optional URL path to route the user to (e.g. '/dashboard')")
    toLabel: str | None = Field(None, description="The label for the route link (e.g. 'Open Mission Control')")
