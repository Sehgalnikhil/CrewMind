import { api } from "./client";

export interface Integration {
  id: string;
  provider: string;
  connected_at: string;
}

export async function getIntegrations(): Promise<Integration[]> {
  const res = await api.get<Integration[]>("/integrations/");
  return res.data;
}

export async function getAuthUrl(provider: string): Promise<{ url: string }> {
  const res = await api.get<{ url: string }>(`/integrations/${provider}/auth`);
  return res.data;
}

export async function disconnectIntegration(provider: string): Promise<void> {
  await api.delete(`/integrations/${provider}`);
}

export async function syncGoogleDrive(): Promise<{ status: string, synced: number }> {
  const res = await api.post<{ status: string, synced: number }>("/integrations/google/sync");
  return res.data;
}
