import { api } from "#/api/client";
import type { AgentRun } from "#/types";

export async function startAgentRun(): Promise<AgentRun> {
  const { data } = await api.post<AgentRun>("/agents/runs");
  return data;
}

export async function listAgentRuns(): Promise<AgentRun[]> {
  const { data } = await api.get<AgentRun[]>("/agents/runs");
  return data;
}

export async function getAgentRun(id: string): Promise<AgentRun> {
  const { data } = await api.get<AgentRun>(`/agents/runs/${id}`);
  return data;
}

export async function listAgentStates(): Promise<import("#/types").AgentState[]> {
  const { data } = await api.get<import("#/types").AgentState[]>("/agents/state");
  return data;
}

export async function getAgentState(agentKey: string): Promise<import("#/types").AgentState> {
  const { data } = await api.get<import("#/types").AgentState>(`/agents/${agentKey}/state`);
  return data;
}

export async function updateAgentState(
  agentKey: string,
  payload: { goals?: string[]; confidence?: number }
): Promise<import("#/types").AgentState> {
  const { data } = await api.patch<import("#/types").AgentState>(`/agents/${agentKey}/state`, payload);
  return data;
}

export async function listAgentTasks(agentKey: string, status?: string): Promise<import("#/types").AgentTask[]> {
  const params = status ? { status } : undefined;
  const { data } = await api.get<import("#/types").AgentTask[]>(`/agents/${agentKey}/tasks`, { params });
  return data;
}

export async function createAgentTask(
  agentKey: string,
  payload: { title: string; description?: string; priority?: number; due_at?: string }
): Promise<import("#/types").AgentTask> {
  const { data } = await api.post<import("#/types").AgentTask>(`/agents/${agentKey}/tasks`, payload);
  return data;
}

export async function getAgentTaskStats(agentKey: string): Promise<import("#/types").TaskQueueStats> {
  const { data } = await api.get<import("#/types").TaskQueueStats>(`/agents/${agentKey}/tasks/stats`);
  return data;
}

export async function listAgentMessages(limit: number = 50, executionId?: string): Promise<import("#/types").AgentMessage[]> {
  const params: Record<string, any> = { limit };
  if (executionId) params.execution_id = executionId;
  const { data } = await api.get<import("#/types").AgentMessage[]>("/agents/messages", { params });
  return data;
}

export async function getMessageThread(threadId: string): Promise<import("#/types").AgentMessage[]> {
  const { data } = await api.get<import("#/types").AgentMessage[]>(`/agents/messages/thread/${threadId}`);
  return data;
}
