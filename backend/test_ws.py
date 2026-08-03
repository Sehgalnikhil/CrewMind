import asyncio
import websockets
import json

async def test():
    uri = "ws://localhost:8000/ws/warroom/live_debate_1234?token=" # no token auth
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            await websocket.send(json.dumps({"type": "trigger_debate", "question": "Should we do X?"}))
            print("Sent trigger_debate")
            while True:
                msg = await websocket.recv()
                print("Received:", msg)
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
