import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MessagesSquare, Users } from "lucide-react";
import { useState } from "react";

import { createConversation } from "#/api/chat";
import { AgentSelector } from "#/components/chat/AgentSelector";
import { ChatWindow } from "#/components/chat/ChatWindow";
import { AppShell } from "#/components/layout/AppShell";
import { EmptyState, OrbitalLoader } from "#/components/os/ui";
import { cn } from "#/lib/utils";
import { AGENTS, type AgentKey } from "#/types";

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

  const allActive = selected === "all_agents";

  return (
    <AppShell title="Boardroom Chat" flush>
      <div className="mx-auto flex h-full max-w-5xl flex-col gap-4 p-4 sm:p-6">
        {/* selector rail */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-center gap-2"
        >
          <AgentSelector selected={allActive ? null : (selected as AgentKey | null)} onSelect={handleSelect} />
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect("all_agents")}
            className={cn(
              "flex items-center gap-2.5 rounded-2xl border px-3.5 py-2 text-sm font-bold backdrop-blur-md transition-all",
              allActive
                ? "border-transparent bg-crew-500/25 text-white shadow-[0_0_0_1px_rgba(138,123,239,0.5),0_0_34px_-8px_rgba(138,123,239,0.9)]"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/25",
            )}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-crew-500/25 text-crew-200">
              <Users className="h-3.5 w-3.5" />
            </span>
            The full boardroom
            <span className="flex -space-x-1">
              {AGENTS.map((a) => (
                <span key={a.key} className="h-2 w-2 rounded-full border border-[#0a0c14]" style={{ backgroundColor: a.color }} />
              ))}
            </span>
          </motion.button>
        </motion.div>

        {/* conversation */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="glass-deep min-h-0 flex-1 overflow-hidden rounded-3xl"
        >
          {mutation.isPending ? (
            <div className="flex h-full items-center justify-center">
              <OrbitalLoader label="convening the crew" />
            </div>
          ) : conversationId ? (
            <ChatWindow conversationId={conversationId} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <EmptyState
                icon={<MessagesSquare className="h-6 w-6" />}
                title="Who do you want in the room?"
                body="Pick one executive for a focused consult — or convene the full boardroom and let them debate your question."
              />
            </div>
          )}
        </motion.div>
      </div>
    </AppShell>
  );
}
