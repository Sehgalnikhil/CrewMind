import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MessageSquare, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { AppShell } from "#/components/layout/AppShell";
import { BlockTitle, GlowChip, Panel } from "#/components/os/ui";
import { PageHero, MeterBar } from "#/components/system/shared";
import { AGENTS } from "#/types";
import { cn } from "#/lib/utils";

interface Dept {
  key: string;
  name: string;
  head: string;
  people: number;
  health: number;
  color: string;
  watcher: string; // agent key
  kpi: { label: string; value: string };
}

const DEPTS: Dept[] = [
  { key: "eng", name: "Engineering", head: "Priya Raman", people: 26, health: 84, color: "#8A7BEF", watcher: "operations", kpi: { label: "Sprint predictability", value: "87%" } },
  { key: "sales", name: "Sales", head: "Marco Silva", people: 14, health: 76, color: "#059669", watcher: "strategy", kpi: { label: "Pipeline coverage", value: "3.1x" } },
  { key: "mkt", name: "Marketing", head: "Sana Iyer", people: 9, health: 71, color: "#EC4899", watcher: "research", kpi: { label: "SQL velocity", value: "+12%" } },
  { key: "fin", name: "Finance", head: "Dev Kapoor", people: 6, health: 90, color: "#D97706", watcher: "finance", kpi: { label: "Close cycle", value: "4.2d" } },
  { key: "ops", name: "Operations", head: "Lena Fischer", people: 17, health: 68, color: "#0891CF", watcher: "operations", kpi: { label: "Cycle time", value: "-18%" } },
  { key: "legal", name: "Legal", head: "Ade Okafor", people: 4, health: 93, color: "#A395F4", watcher: "legal", kpi: { label: "Contract SLA", value: "98%" } },
];

const PROJECTS = [
  { name: "EU Expansion Pilot", dept: "sales", progress: 42, status: "On track", color: "#059669" },
  { name: "Pricing Refresh", dept: "mkt", progress: 18, status: "Paused", color: "#D97706" },
  { name: "SOC 2 Type II", dept: "legal", progress: 74, status: "On track", color: "#059669" },
  { name: "Warehouse Routing Fix", dept: "ops", progress: 91, status: "Ahead", color: "#0891CF" },
  { name: "Onboarding Localization", dept: "eng", progress: 33, status: "At risk", color: "#EC4899" },
  { name: "Platform v3 Migration", dept: "eng", progress: 58, status: "On track", color: "#059669" },
];

const CUSTOMERS = [
  { name: "Acme Industries", arr: 38, trend: "+9%" },
  { name: "Borealis Labs", arr: 27, trend: "+4%" },
  { name: "Cinder & Co", arr: 21, trend: "flat" },
  { name: "Deltaline", arr: 17, trend: "+16%" },
  { name: "Everfield", arr: 12, trend: "-3%" },
  { name: "Fjord Systems", arr: 8, trend: "new" },
];

const COMPETITORS = [
  { name: "Northwind", threat: "High", note: "Cut mid-tier pricing 9% — retention play; their power users are churning.", color: "#EC4899" },
  { name: "Skyforge", threat: "Medium", note: "Hiring enterprise AEs in DACH — likely collision with our pilot.", color: "#D97706" },
  { name: "Quantel", threat: "Low", note: "Pivoting upmarket; overlap shrinking two quarters running.", color: "#059669" },
];

const CONTRACTS = [
  { name: "Acme Industries MSA", renews: 148, risk: null },
  { name: "Cloud committed-use", renews: 94, risk: "Renegotiation open" },
  { name: "Analytics vendor", renews: 21, risk: "Auto-renews — flagged by Clause" },
  { name: "Borealis Labs DPA", renews: 233, risk: null },
];

const RISKS = [
  { name: "GDPR readiness gap", sev: "High", owner: "Legal", color: "#EC4899" },
  { name: "Support cost drift", sev: "Medium", owner: "Finance", color: "#D97706" },
  { name: "Key-person dependency", sev: "Medium", owner: "Engineering", color: "#D97706" },
  { name: "Cloud commit overage", sev: "Low", owner: "Operations", color: "#059669" },
];

const GOALS = [
  { name: "₹2L ARR run-rate", pct: 73, color: "#8A7BEF" },
  { name: "Churn below 2.4%", pct: 88, color: "#059669" },
  { name: "12 EU pilot logos", pct: 25, color: "#0891CF" },
  { name: "SOC 2 Type II", pct: 74, color: "#A395F4" },
];

function agentByKey(key: string) {
  return AGENTS.find((a) => a.key === key)!;
}

function OrbitalMap({ hovered, onSelect }: { hovered: string | null; onSelect: (d: Dept) => void }) {
  return (
    <div className="relative mx-auto h-[340px] w-[340px] sm:h-[400px] sm:w-[400px]" aria-hidden>
      {[100, 72].map((r) => (
        <motion.span
          key={r}
          className="absolute rounded-full border border-white/[0.08]"
          style={{ inset: `${(100 - r) / 2}%` }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: r === 100 ? 80 : 60, ease: "linear" }}
        >
          <span className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-crew-400/70" />
        </motion.span>
      ))}
      {/* core */}
      <div className="conic-ring absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#0B0D14] text-center">
          <span className="text-aurora text-sm font-extrabold">YourCo</span>
          <span className="font-mono text-[8px] uppercase tracking-widest text-slate-500">76 people</span>
        </div>
      </div>
      {/* departments on the outer orbit */}
      {DEPTS.map((d, i) => {
        const ang = (i / DEPTS.length) * Math.PI * 2 - Math.PI / 2;
        const R = 160;
        const lit = hovered === d.key || hovered === null;
        const watcher = agentByKey(d.watcher);
        return (
          <motion.button
            key={d.key}
            onClick={() => onSelect(d)}
            className={cn("absolute left-1/2 top-1/2 flex flex-col items-center", ["float-a", "float-b", "float-c"][i % 3], "pointer-events-auto")}
            initial={{ x: Math.cos(ang) * R - 34, y: Math.sin(ang) * R - 30 }}
            animate={{ opacity: lit ? 1 : 0.35, scale: hovered === d.key ? 1.12 : 1, x: Math.cos(ang) * R - 34, y: Math.sin(ang) * R - 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            aria-label={`Open ${d.name}`}
          >
            <span
              className="flex h-14 w-16 flex-col items-center justify-center rounded-2xl border backdrop-blur-md"
              style={{ backgroundColor: `${d.color}1d`, borderColor: `${d.color}55`, boxShadow: `0 0 26px -10px ${d.color}` }}
            >
              <span className="text-xs font-extrabold" style={{ color: d.color }}>{d.people}</span>
              <span className="font-mono text-[7px] uppercase tracking-wider text-slate-400">people</span>
            </span>
            <span className="mt-1 text-[10px] font-bold text-white">{d.name}</span>
            <span className="flex items-center gap-1 font-mono text-[7px] uppercase tracking-wider text-slate-500">
              <span className="h-1 w-1 rounded-full" style={{ backgroundColor: watcher.color }} /> {watcher.persona} watching
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

export function DigitalTwinPage() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [openDept, setOpenDept] = useState<Dept | null>(null);
  const totalArr = useMemo(() => CUSTOMERS.reduce((s, c) => s + c.arr, 0), []);

  return (
    <AppShell title="Digital Twin" wide>
      <PageHero
        label="living organization"
        title="Your company,"
        accent="mirrored."
        body="Teams, projects, customers, contracts, risks and goals — one connected model the crew reasons over."
      />

      {/* orbital hero */}
      <Panel deep delay={0.05} className="scanline relative mb-5 overflow-hidden p-6">
        <div className="grid items-center gap-6 lg:grid-cols-2">
          <OrbitalMap hovered={hovered} onSelect={setOpenDept} />
          <div>
            <BlockTitle label="the map" title="Company at a glance" />
            <div className="flex flex-col gap-2">
              {DEPTS.map((d) => (
                <button
                  key={d.key}
                  onMouseEnter={() => setHovered(d.key)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setOpenDept(d)}
                  className="group flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color, boxShadow: `0 0 10px ${d.color}` }} />
                  <span className="w-28 text-sm font-bold text-white">{d.name}</span>
                  <span className="hidden flex-1 sm:block">
                    <MeterBar pct={d.health} color={d.color} />
                  </span>
                  <span className="w-12 text-right font-mono text-xs font-bold text-slate-300">{d.health}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* projects */}
        <Panel delay={0.1} className="p-6 xl:col-span-2">
          <BlockTitle label="in motion" title="Projects" />
          <div className="grid gap-3 sm:grid-cols-2">
            {PROJECTS.map((p, i) => {
              const dept = DEPTS.find((d) => d.key === p.dept)!;
              return (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  onMouseEnter={() => setHovered(p.dept)}
                  onMouseLeave={() => setHovered(null)}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-bold text-white">{p.name}</p>
                    <GlowChip color={p.color}>{p.status}</GlowChip>
                  </div>
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">{dept.name} · {dept.head}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="flex-1"><MeterBar pct={p.progress} color={dept.color} delay={0.15 + i * 0.05} /></span>
                    <span className="font-mono text-[10px] font-bold text-slate-300">{p.progress}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Panel>

        {/* goals */}
        <Panel delay={0.15} className="p-6">
          <BlockTitle label="north stars" title="Goals" />
          <div className="flex flex-col gap-4">
            {GOALS.map((g, i) => (
              <div key={g.name}>
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-slate-300">{g.name}</span>
                  <span className="font-mono font-bold text-slate-400">{g.pct}%</span>
                </div>
                <MeterBar pct={g.pct} color={g.color} delay={0.1 + i * 0.08} />
              </div>
            ))}
          </div>
        </Panel>

        {/* customers */}
        <Panel delay={0.2} className="p-6">
          <BlockTitle label="revenue base" title="Customers" action={<GlowChip color="#059669">₹{totalArr * 10}K ARR</GlowChip>} />
          <div className="flex flex-col gap-2">
            {CUSTOMERS.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="w-32 truncate text-[12.5px] font-semibold text-slate-300">{c.name}</span>
                <span className="flex-1"><MeterBar pct={(c.arr / CUSTOMERS[0].arr) * 100} color="#059669" delay={i * 0.06} /></span>
                <span className={cn("w-10 text-right font-mono text-[10px] font-bold", c.trend.startsWith("-") ? "text-[#f5a9cf]" : "text-emerald-400")}>{c.trend}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* competitors */}
        <Panel delay={0.25} className="p-6">
          <BlockTitle label="scout's watchlist" title="Competitors" />
          <div className="flex flex-col gap-2.5">
            {COMPETITORS.map((c) => (
              <div key={c.name} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-white">{c.name}</p>
                  <GlowChip color={c.color}>{c.threat} threat</GlowChip>
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-400">{c.note}</p>
              </div>
            ))}
          </div>
        </Panel>

        {/* contracts & risks */}
        <Panel delay={0.3} className="p-6">
          <BlockTitle label="clause's desk" title="Contracts & risks" />
          <div className="flex flex-col gap-2">
            {CONTRACTS.map((c) => (
              <div key={c.name} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-white">{c.name}</span>
                  {c.risk && <span className="block text-[10px] text-[#f5a9cf]">{c.risk}</span>}
                </span>
                <GlowChip color={c.renews < 30 ? "#EC4899" : c.renews < 100 ? "#D97706" : "#059669"}>{c.renews}d</GlowChip>
              </div>
            ))}
            <div className="mt-2 border-t border-white/[0.07] pt-3">
              {RISKS.map((r) => (
                <div key={r.name} className="flex items-center gap-2.5 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="flex-1 text-[12px] font-semibold text-slate-300">{r.name}</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{r.owner}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* department drawer */}
      <AnimatePresence>
        {openDept && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenDept(null)} className="fixed inset-0 z-[70] bg-[#020308]/70 backdrop-blur-sm" />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.45 }}
              className="glass-deep fixed inset-y-0 right-0 z-[75] flex w-[min(94vw,420px)] flex-col overflow-y-auto p-6"
              role="dialog"
              aria-label={openDept.name}
            >
              <div className="flex items-start justify-between">
                <GlowChip color={openDept.color}>{openDept.name}</GlowChip>
                <button onClick={() => setOpenDept(null)} aria-label="Close" className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-white">{openDept.name}</h3>
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">led by {openDept.head} · {openDept.people} people</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                  <p className="text-[10px] font-semibold text-slate-400">Health</p>
                  <p className="text-2xl font-extrabold text-white">{openDept.health}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                  <p className="text-[10px] font-semibold text-slate-400">{openDept.kpi.label}</p>
                  <p className="text-2xl font-extrabold text-white">{openDept.kpi.value}</p>
                </div>
              </div>
              <div className="mt-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Active projects</p>
                {PROJECTS.filter((p) => p.dept === openDept.key).map((p) => (
                  <div key={p.name} className="mb-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{p.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">{p.progress}%</span>
                    </div>
                  </div>
                ))}
                {!PROJECTS.some((p) => p.dept === openDept.key) && <p className="text-xs text-slate-500">No active projects.</p>}
              </div>
              <div className="mt-auto pt-6">
                <Link
                  to="/chat"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.05] py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:border-crew-500/40"
                >
                  <MessageSquare className="h-4 w-4 text-crew-300" /> Ask the crew about {openDept.name}
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
