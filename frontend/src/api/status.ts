import { api } from "#/api/client";

export interface SystemStatus {
  llm_configured: boolean;
  llm_model: string;
}

export async function getStatus(): Promise<SystemStatus> {
  const { data } = await api.get<SystemStatus>("/status");
  return data;
}
