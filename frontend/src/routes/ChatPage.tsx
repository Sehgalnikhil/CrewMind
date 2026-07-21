import { useMutation } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useState } from "react";

import { createConversation } from "#/api/chat";
import { AgentSelector } from "#/components/chat/AgentSelector";
import { ChatWindow } from "#/components/chat/ChatWindow";
import { AppShell } from "#/components/layout/AppShell";
import { Card } from "#/components/ui/Card";
import { Spinner } from "#/components/ui/Spinner";
import { cn } from "#/lib/utils";
import type { AgentKey } from "#/types";

export function ChatPage() {
  const [selected, setSelected] = useState<AgentKey | "all_agents" | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (key: AgentKey | "all_agents") =>
      key === "all_agents" ? createConversation("all_agents") : createConversation("single_agent", key),
    onSuccess: (conversation) => setConversationId(conversation.id),
  });

  function handleSelect(key: AgentKey | "all_agents") {
    setSelected(key);
    setConversationId(null);
    mutation.mutate(key);
  }

  return (
    <AppShell title="Chat">
      <div className="mx-auto flex h-full max-w-4xl flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <AgentSelector selected={selected === "all_agents" ? null : selected} onSelect={handleSelect} />
          <button
            onClick={() => handleSelect("all_agents")}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
              selected === "all_agents"
                ? "border-transparent bg-crew-500 text-white"
                : "border-surface-border bg-surface-raised text-slate-300 hover:border-crew-500/40"
            )}
          >
            <Users className="h-4 w-4" />
            All Agents
          </button>
        </div>

        <Card className="flex-1 overflow-hidden p-0">
          {mutation.isPending ? (
            <div className="flex h-full items-center justify-center">
              <Spinner />
            </div>
          ) : conversationId ? (
            <ChatWindow conversationId={conversationId} />
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
