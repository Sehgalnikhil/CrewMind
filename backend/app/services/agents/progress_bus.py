"""In-process pub/sub so the orchestrator can push live progress events to a
WebSocket-connected client without coupling the two together. Single-process
only — fine for this deployment stage; swap for Redis pub/sub if scaled out.
"""

import asyncio

_queues: dict[str, list[asyncio.Queue]] = {}


def subscribe(agent_run_id: str) -> asyncio.Queue:
    queue: asyncio.Queue = asyncio.Queue()
    _queues.setdefault(agent_run_id, []).append(queue)
    return queue


def unsubscribe(agent_run_id: str, queue: asyncio.Queue) -> None:
    subscribers = _queues.get(agent_run_id, [])
    if queue in subscribers:
        subscribers.remove(queue)
    if not subscribers:
        _queues.pop(agent_run_id, None)


async def publish(agent_run_id: str, event: dict) -> None:
    for queue in _queues.get(agent_run_id, []):
        await queue.put(event)
