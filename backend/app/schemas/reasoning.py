"""Pydantic schemas for LLM Structured Outputs and Reasoning."""

from pydantic import BaseModel, Field


class SpawnedTask(BaseModel):
    agent_key: str = Field(description="The key of the agent to delegate to (e.g., 'research', 'legal').")
    title: str = Field(description="A short title for the task.")
    description: str = Field(description="Detailed instructions for the delegated task.")
    priority: int = Field(default=3, description="Priority from 1 (lowest) to 5 (highest).")

class AgentReasoningOutput(BaseModel):
    """The structured output format forced upon the agent."""
    internal_monologue: list[str] = Field(
        description="A list of step-by-step thoughts detailing how you arrived at your conclusion. Must be detailed and show your work."
    )
    critic_reflection: str | None = Field(
        description="A critical review of your own thoughts. Are there flaws? Did you miss anything? If it looks perfect, this can be null."
    )
    spawned_tasks: list[SpawnedTask] | None = Field(
        default=None,
        description="If you realize another agent (e.g., research, finance, operations, legal, strategy) needs to perform a sub-task for you to succeed, you can spawn tasks here. Only use this if absolutely necessary."
    )
    final_response: str = Field(
        description="The final markdown-formatted answer to the user or orchestrator."
    )
    confidence: float = Field(
        description="Your confidence in this final response, from 0.0 to 100.0.",
        ge=0.0,
        le=100.0,
    )
