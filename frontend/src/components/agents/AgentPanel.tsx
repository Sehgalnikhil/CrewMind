import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, FileText, FileCheck2, Play, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { startAgentRun } from "#/api/agents";
import { BlockTitle, Panel, ThinkingDots } from "#/components/os/ui";
import { useAgentRunSocket } from "#/hooks/useAgentRunSocket";
import type { AgentPanelStatus, PanelAgentKey } from "#/hooks/useAgentRunSocket";
import { AGENTS, COORDINATOR_META } from "#/types";

const RUN_STATUS_LABEL: Record<string, string> = {
  pending: "Waking the crew…",
  researching: "Scout is gathering external intelligence…",
  analyzing: "Four executives are reading your documents in parallel…",
  synthesizing: "Nexus is combining every finding into one report…",
  completed: "Analysis complete — the report is signed.",
  failed: "The run hit a wall.",
};

/* Rotating "thoughts" per agent while running */
const THINKING_LINES: Record<PanelAgentKey, string[]> = {
  research: ["scanning market signals…", "pulling competitor moves…", "ranking source credibility…"],
  strategy: ["weighing strategic options…", "mapping positioning…", "pricing the tradeoffs…"],
  finance: ["reading the numbers…", "modelling cash flow…", "checking margin drift…"],
  operations: ["tracing workflows…", "hunting bottlenecks…", "estimating cycle times…"],
  legal: ["reviewing clauses…", "checking compliance…", "flagging exposure…"],
  coordinator: ["reconciling findings…", "resolving disagreements…", "drafting the verdict…"],
};

const CREW_META = [
  ...AGENTS.map((a) => ({ key: a.key as PanelAgentKey, persona: a.persona, name: `${a.name} Agent`, title: a.title, color: a.color })),
  { key: "coordinator" as PanelAgentKey, persona: COORDINATOR_META.persona, name: "AI Coordinator", title: COORDINATOR_META.title, color: COORDINATOR_META.color },
];

interface TimelineEvent {
  id: number;
  color: string;
  text: string;
  at: string;
}

function statusText(key: PanelAgentKey, status: AgentPanelStatus, persona: string) {
  if (status === "running") return `${persona} started ${key === "coordinator" ? "synthesizing the report" : "its analysis"}`;
  if (status === "done") return `${persona} finished — findings shared with the crew`;
  return "";
}

function CrewMemberCard({
  meta,
  status,
  index,
}: {
  meta: (typeof CREW_META)[number];
  status: AgentPanelStatus;
  index: number;
}) {
  const [line, setLine] = useState(0);
  useEffect(() => {
    if (status !== "running") return;
    const t = setInterval(() => setLine((l) => l + 1), 2400);
    return () => clearInterval(t);
  }, [status]);

  const lines = THINKING_LINES[meta.key];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative overflow-hidden rounded-2xl p-4 transition-shadow duration-500"
      style={
        status === "running"
          ? { boxShadow: `0 0 0 1px ${meta.color}55, 0 0 40px -10px ${meta.color}88` }
          : status === "done"
            ? { boxShadow: `0 0 0 1px ${meta.color}30` }
            : undefined
      }
    >
      {status === "running" && (
        <motion.span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        />
      )}
      <div className="flex items-center gap-3">
        <div
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold"
          style={{ backgroundColor: `${meta.color}20`, color: meta.color, boxShadow: `0 0 24px -8px ${meta.color}` }}
        >
          {status === "running" ? (
            <motion.span
              className="absolute inset-0 rounded-2xl border"
              style={{ borderColor: `${meta.color}66` }}
              animate={{ scale: [1, 1.25], opacity: [0.8, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut" }}
            />
          ) : null}
          {status === "done" ? <Check className="h-5 w-5" /> : meta.persona[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">
            {meta.persona} <span className="ml-1 text-[10px] font-semibold text-slate-500">{meta.name}</span>
          </p>
          <div className="mt-0.5 flex h-4 items-center gap-2">
            {status === "running" ? (
              <>
                <ThinkingDots color={meta.color} />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={line}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="truncate font-mono text-[10px]"
                    style={{ color: meta.color }}
                  >
                    {lines[line % lines.length]}
                  </motion.span>
                </AnimatePresence>
              </>
            ) : (
              <span className="truncate font-mono text-[10px] text-slate-500">
                {status === "done" ? "analysis complete · signed" : "standing by"}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* The pipeline: documents → scout → analysts → nexus → report */
function Pipeline({
  agentStatuses,
  running,
}: {
  agentStatuses: Record<PanelAgentKey, AgentPanelStatus>;
  running: boolean;
}) {
  const analysts = AGENTS.filter((a) => a.key !== "research");
  const research = AGENTS.find((a) => a.key === "research")!;
  const nodeColor = (key: PanelAgentKey, base: string) =>
    agentStatuses[key] === "done" ? base : agentStatuses[key] === "running" ? base : "rgba(148,155,175,0.5)";

  const stages: { x: number; y: number; label: string; color: string; icon?: "doc" | "report"; key?: PanelAgentKey; sideLabel?: boolean }[] = [
    { x: 55, y: 120, label: "Documents", color: "#e6e9f2", icon: "doc" },
    { x: 215, y: 120, label: research.persona, color: nodeColor("research", research.color), key: "research" },
    ...analysts.map((a, i) => ({
      x: 410,
      y: 30 + i * 60,
      label: a.persona,
      color: nodeColor(a.key, a.color),
      key: a.key as PanelAgentKey,
      sideLabel: true,
    })),
    { x: 620, y: 120, label: COORDINATOR_META.persona, color: nodeColor("coordinator", COORDINATOR_META.color), key: "coordinator" },
    { x: 762, y: 120, label: "Report", color: "#e6e9f2", icon: "report" },
  ];

  const edges: [number, number][] = [
    [0, 1],
    [1, 2], [1, 3], [1, 4], [1, 5],
    [2, 6], [3, 6], [4, 6], [5, 6],
    [6, 7],
  ];

  return (
    <svg viewBox="0 0 800 240" className="w-full" role="img" aria-label="Analysis pipeline: documents flow through Scout to four analyst agents, then to the coordinator, producing the executive report">
      {edges.map(([a, b], i) => {
        const from = stages[a];
        const to = stages[b];
        const mx = (from.x + to.x) / 2;
        const d = `M${from.x + 22},${from.y} C${mx},${from.y} ${mx},${to.y} ${to.x - 22},${to.y}`;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke="rgba(138,123,239,0.18)" strokeWidth="1.2" className={running ? "dash-flow" : undefined} strokeDasharray={running ? undefined : "4 5"} />
            {running && (
              <circle r="2.8" fill="#A395F4">
                <animateMotion dur={`${2 + (i % 4) * 0.4}s`} begin={`${i * 0.25}s`} repeatCount="indefinite" path={d} />
              </circle>
            )}
          </g>
        );
      })}
      {stages.map((s, i) => {
        return (
          <g key={i}>
            <circle cx={s.x} cy={s.y} r="20" fill="#0B0D14" stroke={s.color} strokeOpacity="0.7" strokeWidth="1.4" />
            <circle cx={s.x} cy={s.y} r="20" fill={s.color} fillOpacity="0.09" />
            {s.icon === "doc" && <FileText x={s.x - 8} y={s.y - 8} width={16} height={16} color="#e6e9f2" />}
            {s.icon === "report" && <FileCheck2 x={s.x - 8} y={s.y - 8} width={16} height={16} color="#e6e9f2" />}
            {!s.icon && (
              <text x={s.x} y={s.y + 4} textAnchor="middle" fill={s.color} fontSize="12" fontWeight="800">
                {s.label[0]}
              </text>
            )}
            {s.sideLabel ? (
              <text x={s.x + 30} y={s.y + 4} textAnchor="start" fill="#aab0c4" fontSize="11" fontWeight="600">
                {s.label}
              </text>
            ) : (
              <text x={s.x} y={s.y + 40} textAnchor="middle" fill="#aab0c4" fontSize="11" fontWeight="600">
                {s.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function AgentPanel({
  runId,
  onRunStarted,
}: {
  runId: string | null;
  onRunStarted: (runId: string) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { runStatus, agentStatuses, reportId, error, reasoningSteps } = useAgentRunSocket(runId);

  const [mutationError, setMutationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: startAgentRun,
    onSuccess: (run) => {
      setMutationError(null);
      onRunStarted(run.id);
    },
    onError: (err: any) => {
      setMutationError(err.response?.data?.detail || err.message || "Failed to start analysis run.");
    },
  });

  const isRunning = runStatus !== null && runStatus !== "completed" && runStatus !== "failed";
  const displayError = error || mutationError;

  /* Build a live timeline from status transitions and reasoning */
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const prevStatuses = useRef<Record<PanelAgentKey, AgentPanelStatus> | null>(null);
  const prevReasoningCount = useRef(0);
  const eventId = useRef(0);

  useEffect(() => {
    if (runStatus === "pending" && events.length > 0 && prevStatuses.current === null) {
      setEvents([]);
    }
    const prev = prevStatuses.current;
    const next: TimelineEvent[] = [];
    
    // Status transitions
    for (const meta of CREW_META) {
      const before = prev?.[meta.key] ?? "idle";
      const now = agentStatuses[meta.key];
      if (before !== now && now !== "idle") {
        next.push({
          id: eventId.current++,
          color: meta.color,
          text: statusText(meta.key, now, meta.persona),
          at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        });
      }
    }
    
    // Reasoning steps
    if (reasoningSteps.length > prevReasoningCount.current) {
      const newSteps = reasoningSteps.slice(prevReasoningCount.current);
      for (const step of newSteps) {
        const meta = CREW_META.find(m => m.key === step.agent);
        if (!meta) continue;
        
        let text = `Internal Monologue:\n${step.monologue.map(m => `• ${m}`).join('\n')}`;
        if (step.critic) {
          text += `\n\nReflection: ${step.critic}`;
        }
        
        next.push({
          id: eventId.current++,
          color: meta.color,
          text,
          at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        });
      }
    }
    
    if (next.length) setEvents((e) => [...next, ...e].slice(0, 30));
    prevStatuses.current = { ...agentStatuses };
    prevReasoningCount.current = reasoningSteps.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentStatuses, runStatus, reasoningSteps]);

  useEffect(() => {
    if (reportId) {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    }
  }, [reportId, queryClient]);

  return (
    <div className="flex flex-col gap-5">
      {/* header */}
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">multi-agent run</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white">
            The boardroom, <span className="text-aurora">in session.</span>
          </h2>
          <div className="mt-1.5 flex h-5 items-center gap-2">
            <AnimatePresence mode="wait">
              <motion.p
                key={runStatus ?? "idle"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-sm text-slate-400"
              >
                {runStatus ? RUN_STATUS_LABEL[runStatus] ?? runStatus : "Run a full crew analysis over your uploaded documents."}
              </motion.p>
            </AnimatePresence>
            {isRunning && <ThinkingDots />}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || isRunning}
          className="group relative flex shrink-0 items-center gap-2 overflow-hidden rounded-2xl bg-white px-6 py-3 text-sm font-bold text-black shadow-[0_0_50px_-10px_rgba(138,123,239,0.9)] transition-shadow hover:shadow-[0_0_70px_-8px_rgba(138,123,239,1)] disabled:opacity-60"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-crew-200/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          {mutation.isPending || isRunning ? (
            <span className="relative z-10 h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
          ) : (
            <Play className="relative z-10 h-4 w-4" />
          )}
          <span className="relative z-10">{isRunning ? "Crew at work…" : "Run analysis"}</span>
        </motion.button>
      </div>

      {displayError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 rounded-2xl border border-[#D97706]/30 bg-[#D97706]/10 px-4 py-3 text-sm text-[#f3c583]"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {displayError}
        </motion.div>
      )}

      {/* pipeline */}
      <Panel deep className="scanline relative hidden overflow-hidden p-6 md:block">
        <BlockTitle label="the pipeline" title="How this run flows" />
        <Pipeline agentStatuses={agentStatuses} running={isRunning} />
      </Panel>

      {/* crew grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CREW_META.map((meta, i) => (
          <CrewMemberCard key={meta.key} meta={meta} status={agentStatuses[meta.key]} index={i} />
        ))}
      </div>

      {/* timeline */}
      <Panel className="p-6">
        <BlockTitle
          label="run log"
          title="Agent timeline"
          action={
            isRunning ? (
              <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-emerald-400">
                <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400 status-ping" /> streaming
              </span>
            ) : undefined
          }
        />
        {events.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500">
            The play-by-play of your next run will stream here — who started, who finished, who signed.
          </p>
        ) : (
          <ol className="relative ml-2 space-y-3 border-l border-white/[0.08] pl-5">
            <AnimatePresence initial={false}>
              {events.map((e) => (
                <motion.li
                  key={e.id}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative"
                >
                  <span
                    className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0a0c14]"
                    style={{ backgroundColor: e.color, boxShadow: `0 0 10px ${e.color}` }}
                  />
                  <p className="whitespace-pre-wrap text-[13px] text-slate-300">{e.text}</p>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-slate-600">{e.at}</p>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        )}
      </Panel>

      {/* report ready */}
      <AnimatePresence>
        {reportId && (
          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="glass-deep conic-ring relative overflow-hidden rounded-3xl p-6"
          >
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <motion.span
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-crew-500/30 to-[#0891CF]/30 text-crew-200 shadow-glow"
              >
                <Sparkles className="h-6 w-6" />
              </motion.span>
              <div className="flex-1">
                <p className="text-lg font-extrabold text-white">The verdict is in.</p>
                <p className="text-sm text-slate-400">All five executives signed. Your report is ready to read.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/reports")}
                className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black shadow-[0_0_44px_-10px_rgba(138,123,239,0.9)]"
              >
                Open executive report <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
