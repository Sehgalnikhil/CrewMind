import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

import type { AgentPanelStatus } from "#/hooks/useAgentRunSocket";

export function AgentStatusCard({
  name,
  title,
  color,
  status,
}: {
  name: string;
  title: string;
  color: string;
  status: AgentPanelStatus;
}) {
  return (
    <motion.div
      layout
      className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-raised px-4 py-3"
      style={status === "running" ? { boxShadow: `0 0 0 1px ${color}55, 0 0 24px -6px ${color}66` } : undefined}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {status === "running" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === "done" ? (
          <Check className="h-4 w-4" />
        ) : (
          name[0]
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-100">{name}</p>
        <p className="text-xs text-slate-500">{title}</p>
      </div>
    </motion.div>
  );
}
