import { api } from "./client";

export interface AssistantTurn {
  role: "user" | "nexus";
  text: string;
}

export interface NexusChatRequest {
  query: string;
  history: AssistantTurn[];
}

export interface NexusChatResponse {
  reply: string;
  to?: string | null;
  toLabel?: string | null;
}

export async function askNexus(req: NexusChatRequest): Promise<NexusChatResponse> {
  const { data } = await api.post<NexusChatResponse>("/nexus/chat", req);
  return data;
}
