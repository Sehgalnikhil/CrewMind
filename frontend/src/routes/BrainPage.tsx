import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { listDocuments } from "#/api/documents";
import { listReports } from "#/api/reports";
import { AppShell } from "#/components/layout/AppShell";
import { BlockTitle, GlowChip, Panel, ThinkingDots } from "#/components/os/ui";
import { PageHero, MeterBar } from "#/components/system/shared";
import { COGNITION_SCRIPT, agentMeta } from "#/components/intel/data";
import { CountUp } from "#/components/world/primitives";
import { AGENTS, COORDINATOR_META } from "#/types";

/* Executive capability matrix — how strongly each agent covers each skill */
const SKILLS = ["Analysis", "Forecasting", "Synthesis", "Monitoring", "Drafting"];
const SKILL_MATRIX: Record<string, number[]> = {
  research: [0.9, 0.7, 0.5, 1, 0.6],
  strategy: [0.85, 0.9, 0.95, 0.5, 0.7],
  finance: [1, 0.95, 0.6, 0.8, 0.5],
  operations: [0.8, 0.6, 0.55, 0.95, 0.4],
  legal: [0.75, 0.4, 0.7, 0.85, 1],
};

const UTILIZATION: Record<string, number> = { research: 78, strategy: 64, finance: 86, operations: 71, legal: 52 };

function OrbitalBrain({ activeAgent }: { activeAgent: string }) {
  return (
    <div className="relative mx-auto h-64 w-64 sm:h-72 sm:w-72" aria-hidden>
      {/* orbit rings */}
      {[100, 76].map((r) => (
        <span key={r} className="absolute rounded-full border border-white/[0.07]" style={{ inset: `${100 - r}%` }} />
      ))}
      {/* nexus core */}
      <motion.div
        className="conic-ring absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <span className="flex h-full w-full items-center justify-center rounded-full bg-[#0B0D14] text-sm font-extrabold" style={{ color: COORDINATOR_META.color }}>
          N
        </span>
      </motion.div>
      {/* orbiting executives */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 46, ease: "linear" }}
      >
        {AGENTS.map((a, i) => {
          const ang = (i / AGENTS.length) * Math.PI * 2;
          const active = activeAgent === a.key;
          return (
            <div
              key={a.key}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `translate(${Math.cos(ang) * 108}px, ${Math.sin(ang) * 108}px)` }}
            >
              <motion.span
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 46, ease: "linear" }}
                className="flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border text-xs font-extrabold backdrop-blur-md"
                style={{
                  backgroundColor: `${a.color}${active ? "40" : "1d"}`,
                  borderColor: `${a.color}${active ? "aa" : "44"}`,
                  color: a.color,
                  boxShadow: active ? `0 0 30px -6px ${a.color}` : undefined,
                }}
              >
                {a.persona[0]}
              </motion.span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

export function BrainPage() {
  const { data: documents } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const { data: reports } = useQuery({ queryKey: ["reports"], queryFn: listReports });
  const [thoughtIdx, setThoughtIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setThoughtIdx((i) => i + 1), 4200);
    return () => clearInterval(t);
  }, []);

  const chunks = useMemo(() => (documents ?? []).reduce((s, d) => s + d.chunk_count, 0), [documents]);
  const docCount = documents?.length ?? 0;
  const thoughts = useMemo(
    () => Array.from({ length: 5 }, (_, i) => COGNITION_SCRIPT[(thoughtIdx + i) % COGNITION_SCRIPT.length]),
    [thoughtIdx],
  );
  const activeAgent = String(thoughts[0].agent);

  /* memory growth: cumulative documents by index (stable, real ordering) */
  const growth = useMemo(() => {
    const sorted = [...(documents ?? [])].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    let acc = 0;
    const pts = sorted.map((d) => (acc += d.chunk_count));
    return pts.length >= 2 ? pts : [0, chunks || 1];
  }, [documents, chunks]);

  const growthPath = useMemo(() => {
    const max = Math.max(...growth, 1);
    return growth.map((v, i) => `${i === 0 ? "M" : "L"}${((i / (growth.length - 1)) * 520).toFixed(1)},${(120 - (v / max) * 110).toFixed(1)}`).join(" ");
  }, [growth]);

  return (
    <AppShell title="AI Brain" wide>
      <PageHero
        label="inside the crew"
        title="The mind running your"
        accent="company."
        body="What the executives know, how hard they're working, and what they're thinking right now."
      />

      <div className="grid gap-5 xl:grid-cols-3">
        {/* orbital + cognition */}
        <Panel deep delay={0.05} className="scanline relative overflow-hidden p-6 xl:col-span-1">
          <BlockTitle label="live" title="Cognition" action={
            <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-emerald-400">
              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400 status-ping" /> active
            </span>
          } />
          <OrbitalBrain activeAgent={activeAgent} />
          <div className="mt-4 flex flex-col gap-2" role="log" aria-label="Cognition log">
            {thoughts.map((t, i) => {
              const a = agentMeta(t.agent);
              return (
                <motion.div
                  key={`${t.id}-${thoughtIdx}`}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1 - i * 0.18, x: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[9px] font-extrabold" style={{ backgroundColor: `${a.color}22`, color: a.color }}>
                    {a.persona[0]}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[11.5px] text-slate-300">{t.text}</p>
                  {i === 0 && <ThinkingDots color={a.color} />}
                </motion.div>
              );
            })}
          </div>
        </Panel>

        <div className="flex flex-col gap-5 xl:col-span-2">
          {/* counters */}
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: "Memories", value: 24 + docCount + (reports?.length ?? 0), color: "#8A7BEF" },
              { label: "Knowledge chunks", value: chunks, color: "#0891CF" },
              { label: "Analyses run", value: reports?.length ?? 0, color: "#059669" },
              { label: "Signals / day", value: 47, color: "#D97706" },
            ].map((s, i) => (
              <Panel key={s.label} delay={0.1 + i * 0.05} className="p-4">
                <p className="text-[10px] font-semibold text-slate-400">{s.label}</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-white">
                  <CountUp to={s.value} />
                </p>
                <span aria-hidden className="mt-2 block h-0.5 w-8 rounded-full" style={{ backgroundColor: s.color }} />
              </Panel>
            ))}
          </div>

          {/* memory growth */}
          <Panel delay={0.18} className="p-6">
            <BlockTitle label="knowledge base" title="Memory growth" action={<GlowChip color="#0891CF">{chunks} chunks indexed</GlowChip>} />
            <svg viewBox="0 0 520 130" className="w-full" role="img" aria-label="Cumulative knowledge chunks indexed over time">
              <defs>
                <linearGradient id="brainGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#67c7f5" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#67c7f5" stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.path
                d={growthPath}
                fill="none"
                stroke="#67c7f5"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
              />
              <path d={`${growthPath} L520,130 L0,130 Z`} fill="url(#brainGrowth)" />
            </svg>
          </Panel>

          {/* utilization */}
          <Panel delay={0.24} className="p-6">
            <BlockTitle label="workload" title="Agent utilization" />
            <div className="grid gap-5 sm:grid-cols-5">
              {AGENTS.map((a, i) => {
                const u = UTILIZATION[a.key];
                return (
                  <div key={a.key} className="flex flex-col items-center gap-2">
                    <div className="relative h-16 w-16">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
                        <motion.circle
                          cx="50" cy="50" r="40" fill="none" stroke={a.color} strokeWidth="9" strokeLinecap="round"
                          initial={{ strokeDasharray: "0 251" }}
                          whileInView={{ strokeDasharray: `${(u / 100) * 251} 251` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.3, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-white">{u}%</span>
                    </div>
                    <p className="text-[10px] font-bold" style={{ color: a.color }}>{a.persona}</p>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* skill matrix */}
          <Panel delay={0.3} className="p-6">
            <BlockTitle label="capabilities" title="Skill matrix" />
            <div className="grid grid-cols-6 gap-1.5" role="table" aria-label="Executive skill matrix">
              <span />
              {SKILLS.map((s) => (
                <span key={s} className="truncate text-center font-mono text-[8px] uppercase tracking-wider text-slate-500">{s}</span>
              ))}
              {AGENTS.map((a) => (
                <div key={a.key} className="contents">
                  <span className="self-center text-[10px] font-bold" style={{ color: a.color }}>{a.persona}</span>
                  {SKILL_MATRIX[a.key].map((v, i) => (
                    <motion.span
                      key={i}
                      className="flex h-8 items-center justify-center rounded-lg text-[9px] font-bold text-white/70"
                      style={{ backgroundColor: `${a.color}${Math.round(v * 60 + 8).toString(16).padStart(2, "0")}` }}
                      initial={{ opacity: 0, scale: 0.85 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04 }}
                    >
                      {Math.round(v * 100)}
                    </motion.span>
                  ))}
                </div>
              ))}
            </div>
          </Panel>

          {/* index health */}
          <Panel delay={0.36} className="p-6">
            <BlockTitle label="pipeline" title="Index health" />
            <div className="flex flex-col gap-4">
              {[
                { label: "Documents parsed", pct: docCount ? 100 : 0, color: "#0891CF" },
                { label: "Embeddings fresh", pct: 94, color: "#8A7BEF" },
                { label: "Signal coverage", pct: 81, color: "#059669" },
                { label: "Contract corpus", pct: 67, color: "#EC4899" },
              ].map((m, i) => (
                <div key={m.label}>
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-400">{m.label}</span>
                    <span className="font-mono font-bold text-slate-300">{m.pct}%</span>
                  </div>
                  <MeterBar pct={m.pct} color={m.color} delay={0.1 + i * 0.08} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
