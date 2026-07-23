"""Pydantic schemas for agent state, tasks, and inter-agent messages."""

from datetime import datetime

from pydantic import BaseModel


# ── Agent State ──────────────────────────────────────────────────

class AgentStateResponse(BaseModel):
    id: str
    agent_key: str
    goals: list[str]
    observations: list[str]
    confidence: float
    personality: dict
    reasoning_history: list
    last_active_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentStateUpdate(BaseModel):
    """Partial update for agent state (goals, confidence)."""
    goals: list[str] | None = None
    confidence: float | None = None


# ── Agent Tasks ──────────────────────────────────────────────────

class AgentTaskResponse(BaseModel):
    id: str
    agent_key: str
    title: str
    description: str
    status: str
    priority: int
    source: str
    due_at: datetime | None
    started_at: datetime | None
    completed_at: datetime | None
    result_json: str | None
    parent_task_id: str | None
    error_message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentTaskCreate(BaseModel):
    title: str
    description: str = ""
    priority: int = 3
    due_at: datetime | None = None


class TaskQueueStats(BaseModel):
    queued: int
    running: int
    completed: int
    failed: int
    total: int


# ── Agent Messages ───────────────────────────────────────────────

class AgentMessageResponse(BaseModel):
    id: str
    sender: str
    receiver: str
    intent: str
    content: str
    confidence: float
    priority: int
    evidence: list[str]
    thread_id: str | None
    execution_id: str | None
    result_json: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Memory ───────────────────────────────────────────────────────

class MemoryRecordResponse(BaseModel):
    id: str
    agent_source: str
    kind: str
    content: str
    title: str
    tier: str
    importance: float
    linked_memory_ids: list[str]
    access_count: int
    expires_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class MemorySearchRequest(BaseModel):
    query: str
    tiers: list[str] | None = None
    kinds: list[str] | None = None
    agent_key: str | None = None
    top_k: int = 10
