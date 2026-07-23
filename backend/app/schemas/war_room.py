from typing import Any
from pydantic import BaseModel


class WarRoomTurnCreate(BaseModel):
    is_user: bool = False
    speaker: str | None = None
    responding_to: str | None = None
    phase: str | None = None
    reasoning: str | None = None
    text: str
    stance: str | None = None
    confidence: int | None = None
    evidence: list[str] | None = None


class WarRoomSessionCreate(BaseModel):
    question: str
    verdict: dict[str, Any] | None = None
    turns: list[WarRoomTurnCreate]


class WarRoomSessionResponse(BaseModel):
    id: str
    workspace_id: str
    question: str
    status: str
    verdict_json: dict[str, Any] | None

    class Config:
        from_attributes = True


class WarRoomTurnResponse(BaseModel):
    id: str
    session_id: str
    turn_index: int
    is_user: bool
    speaker: str | None
    responding_to: str | None
    phase: str | None
    reasoning: str | None
    text: str
    stance: str | None
    confidence: int | None
    evidence_json: list[str] | None

    class Config:
        from_attributes = True


class WarRoomSessionDetailResponse(WarRoomSessionResponse):
    turns: list[WarRoomTurnResponse]
