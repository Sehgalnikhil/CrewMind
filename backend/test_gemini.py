import asyncio
from google import genai
from google.genai import types
import os
from pydantic import BaseModel, Field
from typing import Any

with open(".env", "r") as f:
    for line in f:
        if line.startswith("GEMINI_API_KEY="):
            os.environ["GEMINI_API_KEY"] = line.split("=", 1)[1].strip()

class ToolAction(BaseModel):
    tool_name: str
    arguments_json: str

class SpawnedTask(BaseModel):
    agent_key: str
    title: str
    description: str
    priority: int

class AgentReasoningOutput(BaseModel):
    internal_monologue: list[str]
    critic_reflection: str | None = None
    spawned_tasks: list[SpawnedTask] | None = None
    tool_actions: list[ToolAction] | None = None
    final_response: str
    confidence: float

async def main():
    try:
        client = genai.Client()
        response = await client.aio.models.generate_content(
            model="gemini-flash-latest",
            contents="Say hi",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AgentReasoningOutput,
            )
        )
        print("Success:", response.text)
    except Exception as e:
        print("Error:", type(e), e)

asyncio.run(main())
