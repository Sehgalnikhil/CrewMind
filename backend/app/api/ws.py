import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import decode_access_token
from app.models.agent_run import AgentRun
from app.models.conversation import Conversation, Message
from app.models.rbac import OrganizationMember
from app.models.user import User
from app.services.agents import AGENT_REGISTRY, DOMAIN_AGENT_KEYS
from app.services.agents.coordinator import synthesize_chat_reply
from app.services.agents.progress_bus import subscribe, unsubscribe
from app.services.llm.gemini_client import LLMNotConfiguredError, LLMRateLimitError

logger = logging.getLogger("crewmind.ws")
router = APIRouter()

ALL_CREW_KEYS = ["research", *DOMAIN_AGENT_KEYS]

class DashboardConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, workspace_id: str, websocket: WebSocket):
        await websocket.accept()
        if workspace_id not in self.active_connections:
            self.active_connections[workspace_id] = []
        self.active_connections[workspace_id].append(websocket)

    def disconnect(self, workspace_id: str, websocket: WebSocket):
        if workspace_id in self.active_connections:
            self.active_connections[workspace_id].remove(websocket)
            if not self.active_connections[workspace_id]:
                del self.active_connections[workspace_id]

    async def broadcast(self, workspace_id: str, message: dict):
        if workspace_id in self.active_connections:
            # Create a copy of the list to safely iterate over it
            for connection in list(self.active_connections[workspace_id]):
                try:
                    await connection.send_json(message)
                except Exception:
                    # Ignore errors, as they're typically just closed connections
                    pass

ws_manager = DashboardConnectionManager()


async def _authenticate(token: str | None) -> tuple[User, str] | None:
    """Returns User, workspace_id."""
    if token is None:
        return None
    payload = decode_access_token(token)
    if payload is None:
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    async with AsyncSessionLocal() as db:
        user = await db.get(User, user_id)
        if user is None:
            return None
        result = await db.execute(
            select(OrganizationMember)
            .where(OrganizationMember.user_id == user.id)
            .limit(1)
        )
        member = result.scalar_one_or_none()
        if member is None:
            return None
        return user, member.workspace_id


async def _persist_agent_message(conversation_id: str, agent_key: str, content: str) -> Message:
    async with AsyncSessionLocal() as db:
        message = Message(
            conversation_id=conversation_id, role="agent", agent_key=agent_key, content=content
        )
        db.add(message)
        await db.commit()
        await db.refresh(message)
        return message


async def _send_single_agent_reply(
    websocket: WebSocket, conversation_id: str, workspace_id: str, agent_key: str, content: str
) -> None:
    agent = AGENT_REGISTRY[agent_key]
    await websocket.send_json({"type": "start", "agent_key": agent_key})

    full_text = ""
    async with AsyncSessionLocal() as db:
        try:
            async for delta in agent.stream(db, workspace_id, content):
                full_text += delta
                await websocket.send_json({"type": "delta", "content": delta})
        except (LLMNotConfiguredError, LLMRateLimitError) as exc:
            await websocket.send_json({"type": "error", "message": str(exc)})
            raise
        except Exception:  # noqa: BLE001
            logger.exception("Agent stream failed for conversation %s", conversation_id)
            await websocket.send_json({"type": "error", "message": "The agent hit an unexpected error."})
            raise

    message = await _persist_agent_message(conversation_id, agent_key, full_text)
    await websocket.send_json({"type": "done", "message_id": message.id})


async def _send_crew_reply(websocket: WebSocket, conversation_id: str, workspace_id: str, content: str) -> None:
    """Fans the question out to all 5 agents concurrently, then has the
    Coordinator merge their answers into one collective reply."""

    async def run_one(key: str) -> tuple[str, str] | None:
        agent = AGENT_REGISTRY[key]
        await websocket.send_json({"type": "start", "agent_key": key})
        try:
            async with AsyncSessionLocal() as db:
                text = await agent.run(db, workspace_id, content)
        except (LLMNotConfiguredError, LLMRateLimitError) as exc:
            await websocket.send_json({"type": "error", "message": str(exc)})
            return None
        except Exception:  # noqa: BLE001
            logger.exception("Agent %s failed for conversation %s", key, conversation_id)
            await websocket.send_json(
                {"type": "error", "message": f"The {agent.name} agent hit an unexpected error."}
            )
            return None

        await websocket.send_json({"type": "delta", "content": text})
        message = await _persist_agent_message(conversation_id, key, text)
        await websocket.send_json({"type": "done", "message_id": message.id, "agent_key": key})
        return key, text

    results = await asyncio.gather(*(run_one(key) for key in ALL_CREW_KEYS))
    agent_outputs = dict(r for r in results if r is not None)
    if not agent_outputs:
        return  # every agent failed; errors were already sent individually

    await websocket.send_json({"type": "start", "agent_key": "coordinator"})
    try:
        combined = await synthesize_chat_reply(agent_outputs, content)
    except (LLMNotConfiguredError, LLMRateLimitError) as exc:
        await websocket.send_json({"type": "error", "message": str(exc)})
        return
    except Exception:  # noqa: BLE001
        logger.exception("Coordinator synthesis failed for conversation %s", conversation_id)
        await websocket.send_json({"type": "error", "message": "The coordinator hit an unexpected error."})
        return

    await websocket.send_json({"type": "delta", "content": combined})
    message = await _persist_agent_message(conversation_id, "coordinator", combined)
    await websocket.send_json({"type": "done", "message_id": message.id, "agent_key": "coordinator"})


@router.websocket("/ws/chat/{conversation_id}")
async def chat_websocket(websocket: WebSocket, conversation_id: str, token: str | None = None) -> None:
    await websocket.accept()

    auth = await _authenticate(token)
    if auth is None:
        await websocket.send_json({"type": "error", "message": "Authentication failed."})
        await websocket.close()
        return
    _user, workspace_id = auth

    async with AsyncSessionLocal() as db:
        conversation = await db.get(Conversation, conversation_id)
        if conversation is None or conversation.workspace_id != workspace_id:
            await websocket.send_json({"type": "error", "message": "Conversation not found."})
            await websocket.close()
            return

        if conversation.mode == "single_agent" and conversation.agent_key not in AGENT_REGISTRY:
            await websocket.send_json({"type": "error", "message": "Unknown agent for this conversation."})
            await websocket.close()
            return
        if conversation.mode not in ("single_agent", "all_agents"):
            await websocket.send_json({"type": "error", "message": "Unsupported conversation mode."})
            await websocket.close()
            return

        mode = conversation.mode
        agent_key = conversation.agent_key

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
                db.add(Message(conversation_id=conversation_id, role="user", content=content))
                await db.commit()

            if mode == "single_agent":
                await _send_single_agent_reply(websocket, conversation_id, workspace_id, agent_key, content)
            else:
                await _send_crew_reply(websocket, conversation_id, workspace_id, content)
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
    _user, workspace_id = auth

    async with AsyncSessionLocal() as db:
        run = await db.get(AgentRun, run_id)
        if run is None or run.workspace_id != workspace_id:
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


@router.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket, token: str | None = None) -> None:
    auth = await _authenticate(token)
    if auth is None:
        await websocket.accept()
        await websocket.send_json({"type": "error", "message": "Authentication failed."})
        await websocket.close()
        return
    _user, workspace_id = auth

    await ws_manager.connect(workspace_id, websocket)
    try:
        while True:
            # Just keep the connection open, waiting for broadcasts
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(workspace_id, websocket)
