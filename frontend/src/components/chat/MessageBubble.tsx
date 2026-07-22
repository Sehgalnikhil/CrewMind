import { motion } from "framer-motion";

import { ThinkingDots } from "#/components/os/ui";
import { cn } from "#/lib/utils";
import { AGENTS, COORDINATOR_META, type CrewAgentKey } from "#/types";

function agentMeta(key: CrewAgentKey | null) {
  if (key === "coordinator") return COORDINATOR_META;
  return AGENTS.find((a) => a.key === key);
}

export function MessageBubble({
  role,
  agentKey,
  content,
  streaming = false,
}: {
  role: "user" | "agent" | "system";
  agentKey: CrewAgentKey | null;
  content: string;
  streaming?: boolean;
}) {
  const isUser = role === "user";
  const agent = agentMeta(agentKey);
  const color = agent?.color ?? "#8A7BEF";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      {/* avatar */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[11px] font-extrabold"
        style={
          isUser
            ? { background: "linear-gradient(135deg, #6C5CE7, #0891CF)", color: "#fff", boxShadow: "0 0 20px -8px rgba(108,92,231,0.9)" }
            : { backgroundColor: `${color}20`, color, boxShadow: `0 0 20px -8px ${color}` }
        }
      >
        {isUser ? "You" : (agent?.persona ?? "A")[0]}
      </div>

      <div
        className={cn(
          "max-w-[78%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed backdrop-blur-md",
          isUser
            ? "rounded-tr-md border border-crew-500/25 bg-crew-500/15 text-slate-100"
            : "glass rounded-tl-md text-slate-200",
        )}
        style={!isUser && streaming ? { boxShadow: `0 0 0 1px ${color}33, 0 0 30px -12px ${color}66` } : undefined}
      >
        {!isUser && agent && (
          <p className="mb-1.5 flex items-center gap-2 text-[11px] font-bold" style={{ color }}>
            {agent.persona}
            <span className="font-mono text-[9px] font-medium uppercase tracking-wider text-slate-500">{agent.title}</span>
            {streaming && <ThinkingDots color={color} />}
          </p>
        )}
        {content}
        {streaming && !isUser && (
          <motion.span
            className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 rounded-full"
            style={{ backgroundColor: color }}
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ repeat: Infinity, duration: 0.9 }}
          />
        )}
      </div>
    </motion.div>
  );
}
