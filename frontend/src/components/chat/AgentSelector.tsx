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
      {AGENTS.map((agent) => (
        <button
          key={agent.key}
          onClick={() => onSelect(agent.key)}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
            selected === agent.key
              ? "border-transparent text-white"
              : "border-surface-border bg-surface-raised text-slate-300 hover:border-crew-500/40"
          )}
          style={selected === agent.key ? { backgroundColor: agent.color } : undefined}
        >
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: selected === agent.key ? "rgba(0,0,0,0.2)" : agent.color }}
          >
            {agent.name[0]}
          </span>
          {agent.name}
        </button>
      ))}
    </div>
  );
}
