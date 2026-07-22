import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";

import { listMessages } from "#/api/chat";
import { ChatInput } from "#/components/chat/ChatInput";
import { MessageBubble } from "#/components/chat/MessageBubble";
import { OrbitalLoader } from "#/components/os/ui";
import { useAgentChatSocket } from "#/hooks/useAgentChatSocket";

export function ChatWindow({ conversationId }: { conversationId: string }) {
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => listMessages(conversationId),
  });

  const { isStreaming, streamedText, streamingAgentKey, error, sendMessage } = useAgentChatSocket(
    conversationId,
    () => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] }),
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
      <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
        {isLoading ? (
          <OrbitalLoader label="opening the boardroom" />
        ) : messages && messages.length === 0 && !isStreaming ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-bold text-white"
            >
              The floor is yours.
            </motion.p>
            <p className="max-w-xs text-xs leading-relaxed text-slate-500">
              Ask about your numbers, contracts, market position — anything the crew has read.
            </p>
          </div>
        ) : (
          messages?.map((m) => (
            <MessageBubble key={m.id} role={m.role} agentKey={m.agent_key} content={m.content} />
          ))
        )}

        {isStreaming && (
          <MessageBubble role="agent" agentKey={streamingAgentKey} content={streamedText || ""} streaming />
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 rounded-2xl border border-[#D97706]/30 bg-[#D97706]/10 px-4 py-3 text-sm text-[#f3c583]"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/[0.07] bg-white/[0.015] p-4">
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
}
