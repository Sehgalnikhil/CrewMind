import { motion } from "framer-motion";

import { cn } from "#/lib/utils";
import { AGENTS, type AgentKey } from "#/types";

function agentMeta(key: AgentKey | null) {
  return AGENTS.find((a) => a.key === key);
}

export function MessageBubble({
  role,
  agentKey,
  content,
}: {
  role: "user" | "agent" | "system";
  agentKey: AgentKey | null;
  content: string;
}) {
  const isUser = role === "user";
  const agent = agentMeta(agentKey);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
        style={{ backgroundColor: isUser ? "#3E3585" : agent?.color ?? "#6C5CE7" }}
      >
        {isUser ? "You" : agent?.name[0] ?? "A"}
      </div>
      <div
        className={cn(
          "max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-crew-500/15 text-slate-100"
            : "border border-surface-border bg-surface-card text-slate-200"
        )}
      >
        {!isUser && agent && (
          <p className="mb-1 text-xs font-medium" style={{ color: agent.color }}>
            {agent.name}
          </p>
        )}
        {content}
      </div>
    </motion.div>
  );
}
