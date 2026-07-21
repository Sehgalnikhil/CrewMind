import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { createConversation } from "#/api/chat";
import { AgentSelector } from "#/components/chat/AgentSelector";
import { ChatWindow } from "#/components/chat/ChatWindow";
import { AppShell } from "#/components/layout/AppShell";
import { Card } from "#/components/ui/Card";
import { Spinner } from "#/components/ui/Spinner";
import type { AgentKey } from "#/types";

export function ChatPage() {
  const [agentKey, setAgentKey] = useState<AgentKey | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (key: AgentKey) => createConversation("single_agent", key),
    onSuccess: (conversation) => setConversationId(conversation.id),
  });

  function handleSelect(key: AgentKey) {
    setAgentKey(key);
    setConversationId(null);
    mutation.mutate(key);
  }

  return (
    <AppShell title="Chat">
      <div className="mx-auto flex h-full max-w-4xl flex-col gap-4">
        <AgentSelector selected={agentKey} onSelect={handleSelect} />

        <Card className="flex-1 overflow-hidden p-0">
          {mutation.isPending ? (
            <div className="flex h-full items-center justify-center">
              <Spinner />
            </div>
          ) : conversationId && agentKey ? (
            <ChatWindow conversationId={conversationId} agentKey={agentKey} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-500">
              <p className="text-sm">Choose an agent above to start a conversation.</p>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
