import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import decode_access_token
from app.models.agent_run import AgentRun
from app.models.conversation import Conversation, Message
from app.models.organization import Organization
from app.models.user import User
from app.services.agents import AGENT_REGISTRY
from app.services.agents.progress_bus import subscribe, unsubscribe
from app.services.llm.anthropic_client import LLMNotConfiguredError

logger = logging.getLogger("crewmind.ws")
router = APIRouter()


async def _authenticate(token: str | None) -> tuple[User, Organization] | None:
    if token is None:
        return None
    user_id = decode_access_token(token)
    if user_id is None:
        return None
    async with AsyncSessionLocal() as db:
        user = await db.get(User, user_id)
        if user is None:
            return None
        result = await db.execute(select(Organization).where(Organization.owner_id == user.id))
        org = result.scalar_one_or_none()
        if org is None:
            return None
        return user, org


@router.websocket("/ws/chat/{conversation_id}")
async def chat_websocket(websocket: WebSocket, conversation_id: str, token: str | None = None) -> None:
    await websocket.accept()

    auth = await _authenticate(token)
    if auth is None:
        await websocket.send_json({"type": "error", "message": "Authentication failed."})
        await websocket.close()
        return
    _user, org = auth

    async with AsyncSessionLocal() as db:
        conversation = await db.get(Conversation, conversation_id)
        if conversation is None or conversation.org_id != org.id:
            await websocket.send_json({"type": "error", "message": "Conversation not found."})
            await websocket.close()
            return

        if conversation.mode != "single_agent" or conversation.agent_key not in AGENT_REGISTRY:
            await websocket.send_json(
                {"type": "error", "message": "This conversation mode isn't supported yet."}
            )
            await websocket.close()
            return

        agent = AGENT_REGISTRY[conversation.agent_key]

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                payload = json.loads(raw)
                content = str(payload["content"]).strip()
            except (json.JSONDecodeError, KeyError, TypeError):
                await websocket.send_json({"type": "error", "message": "Invalid message format."})
                continue
            if not content:
                continue

            async with AsyncSessionLocal() as db:
                user_message = Message(
                    conversation_id=conversation_id, role="user", content=content
                )
                db.add(user_message)
                await db.commit()

                await websocket.send_json({"type": "start", "agent_key": agent.key})

                full_text = ""
                try:
                    async for delta in agent.stream(db, org.id, content):
                        full_text += delta
                        await websocket.send_json({"type": "delta", "content": delta})
                except LLMNotConfiguredError as exc:
                    await websocket.send_json({"type": "error", "message": str(exc)})
                    continue
                except Exception:  # noqa: BLE001
                    logger.exception("Agent stream failed for conversation %s", conversation_id)
                    await websocket.send_json(
                        {"type": "error", "message": "The agent hit an unexpected error."}
                    )
                    continue

                agent_message = Message(
                    conversation_id=conversation_id,
                    role="agent",
                    agent_key=agent.key,
                    content=full_text,
                )
                db.add(agent_message)
                await db.commit()
                await db.refresh(agent_message)

                await websocket.send_json({"type": "done", "message_id": agent_message.id})
    except WebSocketDisconnect:
        pass


@router.websocket("/ws/agent-runs/{run_id}")
async def agent_run_progress_websocket(websocket: WebSocket, run_id: str, token: str | None = None) -> None:
    await websocket.accept()

    auth = await _authenticate(token)
    if auth is None:
        await websocket.send_json({"type": "error", "message": "Authentication failed."})
        await websocket.close()
        return
    _user, org = auth

    async with AsyncSessionLocal() as db:
        run = await db.get(AgentRun, run_id)
        if run is None or run.org_id != org.id:
            await websocket.send_json({"type": "error", "message": "Run not found."})
            await websocket.close()
            return
        # If the run already finished before the client connected, replay the
        # terminal state immediately instead of hanging waiting for an event.
        if run.status in ("completed", "failed"):
            await websocket.send_json({"type": "run_status", "status": run.status})
            await websocket.close()
            return

    queue = subscribe(run_id)
    try:
        while True:
            event = await queue.get()
            await websocket.send_json(event)
            if event["type"] in ("completed", "failed"):
                break
    except WebSocketDisconnect:
        pass
    finally:
        unsubscribe(run_id, queue)
