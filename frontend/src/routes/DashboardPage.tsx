import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  MoveHorizontal,
  Pin,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { listDocuments } from "#/api/documents";
import { listReports } from "#/api/reports";
import { getMetrics } from "#/api/metrics";
import { AppShell } from "#/components/layout/AppShell";
import { EmptyState, GlowChip, Panel, ThinkingDots } from "#/components/os/ui";
import { WidgetFrame } from "#/components/os/WidgetFrame";
import { useContextMenu } from "#/components/os/ContextMenu";
import { useWidgetLayout } from "#/components/dashboard/useWidgetLayout";
import {
  AlertsWidget,
  CashRunwayWidget,
  CompanyDnaWidget,
  DecisionQueueWidget,
  GrowthScoreWidget,
  MarketIntelWidget,
  PredictionsWidget,
  RiskRadarWidget,
  UtilizationWidget,
} from "#/components/dashboard/widgets";
import { CountUp } from "#/components/world/primitives";
import { AGENTS } from "#/types";
import { useAuthStore } from "#/stores/authStore";
import { cn } from "#/lib/utils";

/* Live activity lines the crew cycles through while idle */
const ACTIVITY_FEED = [
  { key: "research", text: "cross-referencing two competitor pricing moves" },
  { key: "finance", text: "recomputing runway under the new burn profile" },
  { key: "strategy", text: "drafting a land-and-expand play for EU accounts" },
  { key: "operations", text: "tracing a cycle-time regression in fulfilment" },
  { key: "legal", text: "watching 3 jurisdictions for regulatory changes" },
  { key: "research", text: "summarizing 47 fresh industry signals" },
  { key: "finance", text: "reconciling invoices against the ledger" },
  { key: "operations", text: "stress-testing the Q4 capacity plan" },
] as const;

function agentByKey(key: string) {
  return AGENTS.find((a) => a.key === key)!;
}

function sparkPath(w: number, h: number, series: number[]) {
  const max = Math.max(...series);
  const min = Math.min(...series);
  return series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - 4 - ((v - min) / (max - min || 1)) * (h - 8);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function LiveActivity() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % ACTIVITY_FEED.length), 3600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2].map((offset) => {
        const item = ACTIVITY_FEED[(idx + offset) % ACTIVITY_FEED.length];
        const agent = agentByKey(item.key);
        return (
          <AnimatePresence mode="popLayout" key={offset}>
            <motion.div
              key={`${idx}-${offset}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1 - offset * 0.28, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold"
                style={{ backgroundColor: `${agent.color}22`, color: agent.color }}
              >
                {agent.persona[0]}
              </span>
              <p className="min-w-0 flex-1 truncate text-xs text-slate-300">
                <span className="font-bold" style={{ color: agent.color }}>
                  {agent.persona}
                </span>{" "}
                is {item.text}
              </p>
              {offset === 0 && <ThinkingDots color={agent.color} />}
            </motion.div>
          </AnimatePresence>
        );
      })}
    </div>
  );
}

interface WidgetDef {
  id: string;
  label: string;
  title: string;
  render: () => React.ReactNode;
}

export function DashboardPage() {
  const { data: reports } = useQuery({ queryKey: ["reports"], queryFn: listReports });
  const { data: documents } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const { data: metrics } = useQuery({ queryKey: ["metrics"], queryFn: getMetrics });
  const user = useAuthStore((s) => s.user);
  const openMenu = useContextMenu();
  const latestReport = reports?.[0];
  const health = latestReport?.business_health_score ?? null;

  const revSeries = metrics?.revenue_series ?? [0, 0];
  const cashSeries = metrics?.cash_flow_series ?? [0, 0];
  const currentMrr = `Rs ${revSeries[revSeries.length - 1] ?? 0}K`;

  const kpis = [
    { label: "Revenue run-rate", value: metrics?.revenue_run_rate ?? 0, decimals: 2, prefix: "Rs ", suffix: "M", trend: metrics?.revenue_trend ?? "", trendUp: metrics?.revenue_trend_up ?? true, series: revSeries, color: "#8A7BEF" },
    { label: "Net cash flow", value: metrics?.net_cash_flow ?? 0, prefix: "Rs ", suffix: "K/mo", trend: metrics?.cash_flow_trend ?? "", trendUp: metrics?.cash_flow_trend_up ?? true, series: cashSeries, color: "#0891CF" },
    { label: "Open risks", value: latestReport?.risks.length ?? 0, trend: latestReport ? "flagged in latest report" : "run an analysis to populate", trendUp: false, color: "#EC4899" },
    { label: "Opportunities", value: latestReport?.opportunities.length ?? 0, trend: latestReport ? "identified by the crew" : "run an analysis to populate", trendUp: true, color: "#059669" },
  ] as const;

  /* ---------------- widget registry ---------------- */
  const WIDGETS: WidgetDef[] = useMemo(
    () => [
      {
        id: "summary",
        label: "latest verdict",
        title: "Executive Summary",
        render: () =>
          latestReport ? (
            <>
              <p className="text-[14px] leading-relaxed text-slate-300">{latestReport.summary}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3.5">
                <div className="flex -space-x-1.5">
                  {AGENTS.map((a) => (
                    <span key={a.key} title={`${a.persona} signed`} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0a0c14] text-[9px] font-extrabold" style={{ backgroundColor: `${a.color}30`, color: a.color }}>
                      {a.persona[0]}
                    </span>
                  ))}
                </div>
                <Link to="/reports" className="flex items-center gap-1.5 text-sm font-bold text-crew-300 transition-colors hover:text-crew-200">
                  Read full report <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Sparkles className="h-6 w-6" />}
              title="No verdict yet"
              body="Upload a few documents and run your first crew analysis."
              action={
                <Link to="/agents" className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-black shadow-[0_0_36px_-10px_rgba(138,123,239,0.9)] transition-transform hover:-translate-y-0.5">
                  <Zap className="h-4 w-4" /> Run first analysis
                </Link>
              }
            />
          ),
      },
      {
        id: "health",
        label: "composite of 42 signals",
        title: "Business Health",
        render: () => (
          <div className="flex flex-col items-center">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
                <motion.circle cx="50" cy="50" r="42" fill="none" stroke="url(#ccGauge)" strokeWidth="7" strokeLinecap="round" initial={{ strokeDasharray: "0 264" }} animate={{ strokeDasharray: `${((health ?? 0) / 100) * 264} 264` }} transition={{ duration: 1.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }} />
                <defs>
                  <linearGradient id="ccGauge" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8A7BEF" />
                    <stop offset="100%" stopColor="#0891CF" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {health !== null ? (
                  <>
                    <span className="text-3xl font-extrabold text-white"><CountUp to={health} duration={2.2} /></span>
                    <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500">/ 100</span>
                  </>
                ) : (
                  <span className="px-4 text-center text-[11px] leading-relaxed text-slate-500">Awaiting first analysis</span>
                )}
              </div>
            </div>
            {health !== null && (
              <GlowChip className="mt-3" color={health >= 70 ? "#059669" : health >= 45 ? "#D97706" : "#EC4899"}>
                {health >= 70 ? "Healthy & stable" : health >= 45 ? "Needs attention" : "At risk"}
              </GlowChip>
            )}
          </div>
        ),
      },
      {
        id: "revenue",
        label: "forecast",
        title: "Revenue Trends",
        render: () => (
          <>
            <svg viewBox="0 0 560 150" className="w-full" role="img" aria-label={`Monthly recurring revenue trend, currently ${currentMrr}`}>
              <defs>
                <linearGradient id="ccRevFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8A7BEF" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#8A7BEF" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.3, 0.6].map((f) => (
                <line key={f} x1="0" x2="560" y1={150 * f} y2={150 * f} stroke="rgba(255,255,255,0.05)" />
              ))}
              <motion.path d={sparkPath(560, 150, revSeries)} fill="none" stroke="#8A7BEF" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2, ease: "easeInOut" }} />
              <path d={`${sparkPath(560, 150, revSeries)} L560,150 L0,150 Z`} fill="url(#ccRevFill)" />
              <text x="548" y="14" textAnchor="end" fill="#e6e9f2" fontSize="12" fontWeight="700">{currentMrr} MRR</text>
            </svg>
            <div className="mt-1 flex justify-end"><GlowChip color="#8A7BEF">Atlas: momentum accelerating</GlowChip></div>
          </>
        ),
      },
      { id: "risk-radar", label: "watchlist", title: "Risk Radar", render: () => <RiskRadarWidget /> },
      { id: "activity", label: "right now", title: "Executive Activity", render: () => <LiveActivity /> },
      { id: "runway", label: "ledger's meter", title: "Cash Runway", render: () => <CashRunwayWidget /> },
      { id: "decisions", label: "waiting on you", title: "Decision Queue", render: () => <DecisionQueueWidget /> },
      { id: "alerts", label: "priority", title: "Alerts", render: () => <AlertsWidget /> },
      { id: "predictions", label: "signed forecasts", title: "Predictions", render: () => <PredictionsWidget /> },
      { id: "intel", label: "scout's desk", title: "Market Intelligence", render: () => <MarketIntelWidget /> },
      { id: "utilization", label: "workload", title: "AI Utilization", render: () => <UtilizationWidget /> },
      { id: "growth", label: "trajectory", title: "Growth Score", render: () => <GrowthScoreWidget /> },
      { id: "dna", label: "who you are", title: "Company DNA", render: () => <CompanyDnaWidget /> },
      {
        id: "documents",
        label: "knowledge base",
        title: "Recent Documents",
        render: () =>
          documents && documents.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {documents.slice(0, 4).map((d) => (
                <Link key={d.id} to="/documents" className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.04]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0891CF]/15 text-[#67c7f5]"><FileText className="h-3.5 w-3.5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-200">{d.filename}</p>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-slate-600">{d.file_type} · {d.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-slate-500">Nothing here yet.</p>
              <Link to="/documents" className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-crew-300 hover:text-crew-200">
                <UploadCloud className="h-3.5 w-3.5" /> Upload your first document
              </Link>
            </div>
          ),
      },
      {
        id: "reports",
        label: "verdict history",
        title: "Recent Reports",
        render: () =>
          reports && reports.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {reports.slice(0, 4).map((r) => (
                <Link key={r.id} to="/reports" className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.04]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-crew-500/15 text-crew-300"><Sparkles className="h-3.5 w-3.5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-200">{r.title || "Executive report"}</p>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-slate-600">health {r.business_health_score}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-slate-500">Verdicts land here after each analysis.</p>
          ),
      },
      {
        id: "agents",
        label: "the crew",
        title: "Agent Status",
        render: () => (
          <div className="flex flex-col gap-1.5">
            {AGENTS.map((a) => (
              <Link key={a.key} to={`/agents/${a.key}`} className="group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl text-[11px] font-extrabold transition-transform group-hover:scale-110" style={{ backgroundColor: `${a.color}22`, color: a.color, boxShadow: `0 0 18px -8px ${a.color}` }}>
                  {a.persona[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white">{a.persona}</p>
                  <p className="truncate text-[10px] text-slate-500">{a.title}</p>
                </div>
                <span className="relative h-1.5 w-1.5 rounded-full status-ping" style={{ backgroundColor: a.color, color: a.color }} />
              </Link>
            ))}
          </div>
        ),
      },
    ],
    [latestReport, health, revSeries, currentMrr, documents, reports],
  );

  const allIds = useMemo(() => WIDGETS.map((w) => w.id), [WIDGETS]);
  const defaultHidden = useMemo(() => ["dna", "growth"], []);
  const defaultWide = useMemo(() => ["summary", "revenue"], []);
  const { layout, sorted, toggle, swap, move, reset } = useWidgetLayout(allIds, defaultHidden, defaultWide);

  const [customizeOpen, setCustomizeOpen] = useState(false);
  const customizeRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<string | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (customizeRef.current && !customizeRef.current.contains(e.target as Node)) setCustomizeOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    const onUp = () => (draggingRef.current = null);
    window.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <AppShell title="Mission Control" wide>
      {/* greeting + quick actions */}
      <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
            <span className="text-aurora">{user?.full_name?.split(" ")[0] || "Executive"}.</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400 md:text-base">
            All five executives are online. Here's the state of {user?.org_name ?? "your business"}.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="flex flex-wrap items-center gap-3">
          <div className="relative" ref={customizeRef}>
            <button
              onClick={() => setCustomizeOpen(!customizeOpen)}
              className="glass flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:border-white/25"
            >
              <SlidersHorizontal className="h-4 w-4 text-crew-300" /> Customize
            </button>
            <AnimatePresence>
              {customizeOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="glass-deep absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                    <p className="text-sm font-bold text-white">Widgets</p>
                    <button onClick={reset} className="text-[11px] font-bold text-crew-300 hover:text-crew-200">Reset layout</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-2">
                    {WIDGETS.map((w) => {
                      const hidden = layout.hidden.includes(w.id);
                      return (
                        <button
                          key={w.id}
                          onClick={() => toggle("hidden", w.id)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-slate-300 transition-colors hover:bg-white/[0.05]"
                        >
                          {hidden ? <EyeOff className="h-3.5 w-3.5 text-slate-600" /> : <Eye className="h-3.5 w-3.5 text-crew-300" />}
                          <span className={cn(hidden && "text-slate-500")}>{w.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link to="/agents" className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-black shadow-[0_0_40px_-10px_rgba(138,123,239,0.8)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_55px_-8px_rgba(138,123,239,1)]">
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-crew-200/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <Zap className="relative z-10 h-4 w-4" />
            <span className="relative z-10">Run analysis</span>
          </Link>
        </motion.div>
      </div>

      {/* KPI row */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <Panel key={k.label} delay={0.08 + i * 0.07} hover className="holo-sheen group relative overflow-hidden p-5">
            <span aria-hidden className="absolute inset-x-6 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${k.color}88, transparent)` }} />
            <p className="text-[11px] font-semibold text-slate-400">{k.label}</p>
            <p className="mt-1.5 text-3xl font-extrabold tracking-tight text-white">
              <CountUp to={k.value} decimals={"decimals" in k ? (k as { decimals?: number }).decimals ?? 0 : 0} prefix={"prefix" in k ? (k as { prefix?: string }).prefix ?? "" : ""} suffix={"suffix" in k ? (k as { suffix?: string }).suffix ?? "" : ""} />
            </p>
            <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold" style={{ color: k.trendUp ? "#34d399" : "#f5a9cf" }}>
              {k.trendUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              <span className="truncate">{k.trend}</span>
            </p>
            {"series" in k && k.series && (
              <svg viewBox="0 0 120 32" className="mt-3 w-full" aria-hidden>
                <motion.path d={sparkPath(120, 32, k.series as number[])} fill="none" stroke={k.color} strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, delay: 0.4 + i * 0.15, ease: "easeInOut" }} />
              </svg>
            )}
          </Panel>
        ))}
      </div>

      {/* widget grid */}
      <LayoutGroup>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sorted
            .filter((id) => !layout.hidden.includes(id))
            .map((id) => {
              const w = WIDGETS.find((x) => x.id === id);
              if (!w) return null;
              const wide = layout.wide.includes(id);
              const pinned = layout.pinned.includes(id);
              return (
                <motion.div
                  key={id}
                  layout
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={cn(wide && "md:col-span-2")}
                  onPointerEnter={() => {
                    const d = draggingRef.current;
                    if (d && d !== id) swap(d, id);
                  }}
                  onContextMenu={(e) =>
                    openMenu(e, [
                      { label: pinned ? "Unpin" : "Pin to top", icon: Pin, onSelect: () => toggle("pinned", id) },
                      { label: wide ? "Make narrower" : "Make wider", icon: MoveHorizontal, onSelect: () => toggle("wide", id) },
                      { label: "Move earlier", icon: ChevronUp, onSelect: () => move(id, -1) },
                      { label: "Move later", icon: ChevronDown, onSelect: () => move(id, 1) },
                      { label: "", divider: true, onSelect: () => {} },
                      { label: "Hide widget", icon: EyeOff, danger: true, onSelect: () => toggle("hidden", id) },
                    ])
                  }
                >
                  <WidgetFrame
                    id={id}
                    label={w.label}
                    title={w.title}
                    pinned={pinned}
                    onPinToggle={() => toggle("pinned", id)}
                    dragHandleProps={{
                      onPointerDown: (e: React.PointerEvent) => {
                        e.preventDefault();
                        draggingRef.current = id;
                      },
                    }}
                    className="h-full"
                  >
                    {w.render()}
                  </WidgetFrame>
                </motion.div>
              );
            })}
        </div>
      </LayoutGroup>
      <p className="mt-6 text-center font-mono text-[9px] uppercase tracking-[0.25em] text-slate-600">
        drag the grip to rearrange · right-click a widget for options
      </p>
    </AppShell>
  );
}
