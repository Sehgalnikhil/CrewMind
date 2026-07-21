import { api } from "#/api/client";
import type { AgentKey, ChatMessage, Conversation, ConversationMode } from "#/types";

export async function createConversation(
  mode: ConversationMode,
  agentKey?: AgentKey
): Promise<Conversation> {
  const { data } = await api.post<Conversation>("/chat/conversations", {
    mode,
    agent_key: agentKey ?? null,
  });
  return data;
}

export async function listConversations(): Promise<Conversation[]> {
  const { data } = await api.get<Conversation[]>("/chat/conversations");
  return data;
}

export async function listMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data } = await api.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`);
  return data;
}
