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
