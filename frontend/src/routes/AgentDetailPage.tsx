import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  FileText,
  FlaskConical,
  Landmark,
  Lightbulb,
  MessageSquare,
  Scale,
  Sparkles,
  Target,
  Workflow,
  Zap,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";

import { listDocuments } from "#/api/documents";
import { listReports } from "#/api/reports";
import { getAgentState, getAgentTaskStats } from "#/api/agents";
import { AppShell } from "#/components/layout/AppShell";
import { BlockTitle, EmptyState, GlowChip, Panel, ThinkingDots } from "#/components/os/ui";
import { CountUp } from "#/components/world/primitives";
import { AGENTS } from "#/types";
import type { AgentKey, AgentMeta, Report } from "#/types";

const ICONS: Record<AgentKey, React.ElementType> = {
  strategy: Briefcase,
  finance: Landmark,
  operations: Workflow,
  legal: Scale,
  research: FlaskConical,
};

const TAGLINES: Record<AgentKey, string> = {
  strategy: "Sees three quarters ahead.",
  finance: "Every rupee, accounted for.",
  operations: "Friction is a bug. Flux fixes it.",
  legal: "Reads the fine print so you don't.",
  research: "Nothing ships un-researched.",
};

const CONFIDENCE: Record<AgentKey, number> = {
  strategy: 94,
  finance: 97,
  operations: 92,
  legal: 96,
  research: 91,
};



/** What this agent contributes to a report — pulled from the real latest report. */
function agentFindings(agent: AgentMeta, report: Report | undefined) {
  if (!report) return [];
  switch (agent.key) {
    case "legal":
      return report.risks.map((r) => ({ icon: AlertTriangle, color: "#EC4899", label: "Risk", text: r }));
    case "strategy":
      return report.opportunities.map((o) => ({ icon: Target, color: "#059669", label: "Opportunity", text: o }));
    case "finance":
    case "operations":
      return report.recommendations.map((r) => ({ icon: Lightbulb, color: agent.color, label: "Recommendation", text: r }));
    case "research":
      return [{ icon: Sparkles, color: agent.color, label: "Context", text: report.summary }];
  }
}

function HoloAvatar({ agent }: { agent: AgentMeta }) {
  const Icon = ICONS[agent.key];
  return (
    <div className="relative h-24 w-24 shrink-0">
      <motion.div
        className="absolute inset-0 rounded-full border"
        style={{ borderColor: `${agent.color}55` }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 14, ease: "linear" }}
      >
        <span
          className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full"
          style={{ backgroundColor: agent.color, boxShadow: `0 0 12px ${agent.color}` }}
        />
      </motion.div>
      <motion.div
        className="absolute inset-2 rounded-full border border-dashed"
        style={{ borderColor: `${agent.color}40` }}
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 22, ease: "linear" }}
      />
      <div
        className="absolute inset-4 flex items-center justify-center rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 30%, ${agent.color}50, ${agent.color}14 70%)`,
          boxShadow: `0 0 34px -6px ${agent.color}66, inset 0 1px 0 rgba(255,255,255,0.25)`,
        }}
      >
        <Icon className="h-7 w-7" style={{ color: agent.color }} />
      </div>
    </div>
  );
}

export function AgentDetailPage() {
  const { key } = useParams<{ key: string }>();
  const agent = AGENTS.find((a) => a.key === key);
  const { data: reports } = useQuery({ queryKey: ["reports"], queryFn: listReports });
  const { data: documents } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  
  const { data: state } = useQuery({ 
    queryKey: ["agentState", key], 
    queryFn: () => getAgentState(key!),
    enabled: !!key
  });

  const { data: taskStats } = useQuery({
    queryKey: ["agentTaskStats", key],
    queryFn: () => getAgentTaskStats(key!),
    enabled: !!key
  });

  if (!agent) return <Navigate to="/agents" replace />;

  const latestReport = reports?.[0];
  const findings = agentFindings(agent, latestReport) ?? [];
  const indexed = (documents ?? []).filter((d) => d.status === "indexed");
  const colleagues = AGENTS.filter((a) => a.key !== agent.key);
  const confidence = state?.confidence ?? CONFIDENCE[agent.key];
  
  const activeGoals = state?.goals ?? [];

  return (
    <AppShell title={`${agent.persona} · ${agent.name} Agent`}>
      {/* hero header */}
      <Panel deep className="scanline relative mb-5 overflow-hidden p-7">
        <span
          aria-hidden
          className="absolute inset-x-10 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)` }}
        />
        <div
          aria-hidden
          className="absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
          style={{ backgroundColor: `${agent.color}20` }}
        />
        <div className="relative z-10 flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
          <HoloAvatar agent={agent} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <h2 className="text-3xl font-extrabold tracking-tight text-white">{agent.persona}</h2>
              <GlowChip color={agent.color}>{agent.name} Agent</GlowChip>
            </div>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{agent.title}</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
              {TAGLINES[agent.key]} {agent.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 md:justify-start">
              {agent.focus.map((f) => (
                <span key={f} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                  {f}
                </span>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-3">
            <div className="relative h-24 w-24">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={agent.color}
                  strokeWidth="7"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 251" }}
                  animate={{ strokeDasharray: `${(confidence / 100) * 251} 251` }}
                  transition={{ duration: 1.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-white">
                  <CountUp to={confidence} suffix="%" />
                </span>
                <span className="text-[8px] uppercase tracking-[0.2em] text-slate-500">confidence</span>
              </div>
            </div>
            <Link
              to="/chat"
              className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-black transition-transform hover:-translate-y-0.5"
              style={{ boxShadow: `0 0 36px -10px ${agent.color}` }}
            >
              <MessageSquare className="h-3.5 w-3.5" /> Chat with {agent.persona}
            </Link>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">
          {/* live thinking */}
          <Panel delay={0.1} className="p-6">
            <BlockTitle
              label="right now"
              title="Live thinking"
              action={
                <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest" style={{ color: agent.color }}>
                  <span className="relative h-1.5 w-1.5 rounded-full status-ping" style={{ backgroundColor: agent.color, color: agent.color }} /> online
                </span>
              }
            />
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
              <ThinkingDots color={agent.color} />
              <p className="font-mono text-[11px] text-slate-400">
                {agent.persona} is monitoring {indexed.length > 0 ? `${indexed.length} indexed document${indexed.length === 1 ? "" : "s"}` : "your workspace"} and{" "}
                {agent.key === "research" ? "external market signals" : "the crew's shared findings"}…
              </p>
            </div>
            {/* activity chart */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-400">Current Task Queue</p>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-xl bg-white/[0.03] p-3 border border-white/[0.05]">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Queued</p>
                  <p className="text-xl font-bold text-white">{taskStats?.queued ?? 0}</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-3 border border-white/[0.05]">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Running</p>
                  <p className="text-xl font-bold text-crew-300">{taskStats?.running ?? 0}</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-3 border border-white/[0.05]">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Completed</p>
                  <p className="text-xl font-bold text-emerald-400">{taskStats?.completed ?? 0}</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-3 border border-white/[0.05]">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Failed</p>
                  <p className="text-xl font-bold text-rose-400">{taskStats?.failed ?? 0}</p>
                </div>
              </div>
            </div>
          </Panel>

          {/* findings from the latest report */}
          <Panel delay={0.18} className="p-6">
            <BlockTitle
              label="from the latest report"
              title={`${agent.persona}'s findings`}
              action={
                latestReport && (
                  <Link to="/reports" className="text-xs font-bold text-crew-300 hover:text-crew-200">
                    Full report
                  </Link>
                )
              }
            />
            {findings.length > 0 ? (
              <ul className="space-y-2.5">
                {findings.slice(0, 5).map((f, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.08 }}
                    className="flex gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                  >
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${f.color}20`, color: f.color }}
                    >
                      <f.icon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: f.color }}>
                        {f.label}
                      </p>
                      <p className="text-[13px] leading-relaxed text-slate-300">{f.text}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Zap className="h-6 w-6" />}
                title={`${agent.persona} hasn't filed findings yet`}
                body="Run a crew analysis and this workspace fills with cited findings, ranked by impact."
                action={
                  <Link to="/agents" className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-black transition-transform hover:-translate-y-0.5">
                    <Zap className="h-4 w-4" /> Run analysis
                  </Link>
                }
              />
            )}
          </Panel>

          {/* activity history */}
          <Panel delay={0.26} className="p-6">
            <BlockTitle label="history" title="Recent runs" />
            {reports && reports.length > 0 ? (
              <ol className="relative ml-2 space-y-4 border-l border-white/[0.08] pl-5">
                {reports.slice(0, 5).map((r, i) => (
                  <motion.li
                    key={r.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="relative"
                  >
                    <span
                      className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0a0c14]"
                      style={{ backgroundColor: agent.color, boxShadow: `0 0 10px ${agent.color}` }}
                    />
                    <p className="text-[13px] font-semibold text-slate-200">{r.title}</p>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-slate-600">
                      {new Date(r.created_at).toLocaleString()} · health {r.business_health_score}
                    </p>
                  </motion.li>
                ))}
              </ol>
            ) : (
              <p className="py-4 text-center text-xs text-slate-500">No runs yet — {agent.persona} is ready when you are.</p>
            )}
          </Panel>
        </div>

        {/* right rail */}
        <div className="flex flex-col gap-5">
          {/* documents analyzed */}
          <Panel delay={0.14} className="p-6">
            <BlockTitle label="reading list" title="Documents analyzed" />
            {indexed.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {indexed.slice(0, 5).map((d) => (
                  <Link key={d.id} to="/documents" className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.04]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${agent.color}18`, color: agent.color }}>
                      <FileText className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-200">{d.filename}</p>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-slate-600">
                        {d.file_type} · {d.chunk_count} chunks
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-slate-500">
                Nothing indexed yet.{" "}
                <Link to="/documents" className="font-bold text-crew-300 hover:text-crew-200">
                  Upload documents
                </Link>{" "}
                for {agent.persona} to read.
              </p>
            )}
          </Panel>

          {/* collaboration panel */}
          <Panel delay={0.22} className="p-6">
            <BlockTitle label="the crew" title="Collaborates with" />
            <div className="flex flex-col gap-1.5">
              {colleagues.map((c) => (
                <Link
                  key={c.key}
                  to={`/agents/${c.key}`}
                  className="group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 transition-all hover:border-white/10 hover:bg-white/[0.04]"
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-[11px] font-extrabold transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${c.color}22`, color: c.color }}
                  >
                    {c.persona[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white">{c.persona}</p>
                    <p className="truncate text-[10px] text-slate-500">{c.name} Agent</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-slate-300" />
                </Link>
              ))}
            </div>
            <p className="mt-3 border-t border-white/[0.07] pt-3 text-[11px] leading-relaxed text-slate-500">
              {agent.persona}'s findings are cross-checked by the rest of the crew before they reach your report.
            </p>
          </Panel>

          {/* mandate */}
          <Panel delay={0.3} hover className="holo-sheen p-6">
            <BlockTitle label="state" title="Current Goals & Focus" />
            
            {activeGoals.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Goals</p>
                <ul className="space-y-2">
                  {activeGoals.map((g, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.06 }}
                      className="flex gap-2.5 text-[13px] text-slate-200 bg-white/[0.04] border border-white/[0.05] p-2.5 rounded-lg"
                    >
                      <Target className="h-4 w-4 shrink-0 mt-0.5" style={{ color: agent.color }} />
                      <span className="leading-snug">{g}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
            
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 mt-4">Core Mandate</p>
            <ul className="space-y-2">
              {agent.focus.map((f, i) => (
                <motion.li
                  key={f}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.06 }}
                  className="flex items-center gap-2.5 text-[13px] text-slate-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: agent.color }} />
                  {f}
                </motion.li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
