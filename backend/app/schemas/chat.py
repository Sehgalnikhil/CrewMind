from datetime import datetime

from pydantic import BaseModel


class ConversationCreateRequest(BaseModel):
    mode: str = "single_agent"  # single_agent | all_agents
    agent_key: str | None = None
    title: str | None = None


class ConversationResponse(BaseModel):
    id: str
    title: str
    mode: str
    agent_key: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    id: str
    role: str
    agent_key: str | None
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SendMessageRequest(BaseModel):
    content: str
