import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";

import { listMessages } from "#/api/chat";
import { ChatInput } from "#/components/chat/ChatInput";
import { MessageBubble } from "#/components/chat/MessageBubble";
import { Spinner } from "#/components/ui/Spinner";
import { useAgentChatSocket } from "#/hooks/useAgentChatSocket";
import type { AgentKey } from "#/types";

export function ChatWindow({
  conversationId,
  agentKey,
}: {
  conversationId: string;
  agentKey: AgentKey;
}) {
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => listMessages(conversationId),
  });

  const { isStreaming, streamedText, error, sendMessage } = useAgentChatSocket(
    conversationId,
    () => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] })
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedText]);

  // The user's message is persisted server-side even if the agent call then
  // fails, so refetch history on error too — otherwise it silently vanishes.
  useEffect(() => {
    if (error) {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    }
  }, [error, conversationId, queryClient]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          messages?.map((m) => (
            <MessageBubble key={m.id} role={m.role} agentKey={m.agent_key} content={m.content} />
          ))
        )}

        {isStreaming && (
          <MessageBubble role="agent" agentKey={agentKey} content={streamedText || "..."} />
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-surface-border p-4">
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
}
