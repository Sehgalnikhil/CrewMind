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

export async function syncSlack(): Promise<{ status: string, synced: number }> {
  const res = await api.post<{ status: string, synced: number }>("/integrations/slack/sync");
  return res.data;
}

export async function syncGithub(): Promise<{ status: string, synced: number }> {
  const res = await api.post<{ status: string, synced: number }>("/integrations/github/sync");
  return res.data;
}

export async function syncNotion(): Promise<{ status: string, synced: number }> {
  const res = await api.post<{ status: string, synced: number }>("/integrations/notion/sync");
  return res.data;
}

export async function syncJira(): Promise<{ status: string, synced: number }> {
  const res = await api.post<{ status: string, synced: number }>("/integrations/jira/sync");
  return res.data;
}
