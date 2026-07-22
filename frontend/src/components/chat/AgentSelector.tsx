import { motion } from "framer-motion";

import { cn } from "#/lib/utils";
import { AGENTS, type AgentKey } from "#/types";

export function AgentSelector({
  selected,
  onSelect,
}: {
  selected: AgentKey | null;
  onSelect: (key: AgentKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {AGENTS.map((agent, i) => {
        const active = selected === agent.key;
        return (
          <motion.button
            key={agent.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(agent.key)}
            className={cn(
              "flex items-center gap-2.5 rounded-2xl border px-3.5 py-2 text-sm font-bold backdrop-blur-md transition-all",
              active ? "border-transparent text-white" : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/25",
            )}
            style={
              active
                ? { backgroundColor: `${agent.color}25`, boxShadow: `0 0 0 1px ${agent.color}66, 0 0 30px -8px ${agent.color}88` }
                : undefined
            }
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-extrabold"
              style={{ backgroundColor: `${agent.color}22`, color: agent.color }}
            >
              {agent.persona[0]}
            </span>
            {agent.persona}
            <span className={cn("text-[10px] font-semibold", active ? "text-slate-300" : "text-slate-600")}>{agent.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
