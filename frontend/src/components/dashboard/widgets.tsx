import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, Check, Clock } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { GlowChip } from "#/components/os/ui";
import { MeterBar } from "#/components/system/shared";
import { CountUp } from "#/components/world/primitives";
import { AGENTS } from "#/types";

/* ---------- Risk Radar ---------- */
const RISK_AXES = [
  { label: "Market", v: 0.55 },
  { label: "Financial", v: 0.4 },
  { label: "Legal", v: 0.62 },
  { label: "Ops", v: 0.3 },
  { label: "Tech", v: 0.45 },
];

export function RiskRadarWidget() {
  const pts = (scale: number) =>
    RISK_AXES.map((_, i) => {
      const ang = (i / RISK_AXES.length) * Math.PI * 2 - Math.PI / 2;
      return `${60 + Math.cos(ang) * 48 * scale},${60 + Math.sin(ang) * 48 * scale}`;
    }).join(" ");
  const shape = RISK_AXES.map((a, i) => {
    const ang = (i / RISK_AXES.length) * Math.PI * 2 - Math.PI / 2;
    return `${60 + Math.cos(ang) * 48 * a.v},${60 + Math.sin(ang) * 48 * a.v}`;
  }).join(" ");
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0" role="img" aria-label="Risk radar across five dimensions">
        {[0.33, 0.66, 1].map((s) => (
          <polygon key={s} points={pts(s)} fill="none" stroke="rgba(255,255,255,0.08)" />
        ))}
        <motion.polygon
          points={shape}
          fill="rgba(236,72,153,0.18)"
          stroke="#EC4899"
          strokeWidth="1.5"
          initial={{ opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "60px 60px" }}
        />
        {RISK_AXES.map((a, i) => {
          const ang = (i / RISK_AXES.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <text key={a.label} x={60 + Math.cos(ang) * 57} y={60 + Math.sin(ang) * 57 + 3} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#8b90a8">
              {a.label}
            </text>
          );
        })}
      </svg>
      <div className="flex min-w-0 flex-col gap-2">
        {RISK_AXES.map((a) => (
          <div key={a.label} className="flex items-center gap-2">
            <span className="w-16 text-[11px] font-semibold text-slate-400">{a.label}</span>
            <span className="w-20"><MeterBar pct={a.v * 100} color="#EC4899" /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Cash Runway ---------- */
export function CashRunwayWidget({ months = 16.8 }: { months?: number }) {
  return (
    <div>
      <p className="text-3xl font-extrabold tracking-tight text-white">
        <CountUp to={months} decimals={1} /> <span className="text-sm font-bold text-slate-500">months</span>
      </p>
      <div className="mt-3">
        <MeterBar pct={Math.min((months / 24) * 100, 100)} color={months >= 12 ? "#059669" : "#EC4899"} />
        <div className="mt-1 flex justify-between font-mono text-[8px] uppercase tracking-widest text-slate-600">
          <span>now</span><span>12mo floor</span><span>24mo</span>
        </div>
      </div>
      <p className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[11.5px] leading-relaxed text-slate-400">
        <span className="font-bold text-[#D97706]">Ledger:</span> the cloud renegotiation would push this to 19.4 months — past the raise window with margin.
      </p>
    </div>
  );
}

/* ---------- Decision Queue ---------- */
const DECISIONS = [
  { id: "d1", title: "Approve EU pilot phase 2 budget", owner: "finance", waiting: "2d" },
  { id: "d2", title: "Terminate analytics vendor auto-renewal", owner: "legal", waiting: "5d" },
  { id: "d3", title: "Sequence August contractor hire", owner: "operations", waiting: "1d" },
];

export function DecisionQueueWidget() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [deferred, setDeferred] = useState<Set<string>>(new Set());
  return (
    <div className="flex flex-col gap-2">
      {DECISIONS.map((d) => {
        const a = AGENTS.find((x) => x.key === d.owner)!;
        const resolved = done.has(d.id) || deferred.has(d.id);
        return (
          <motion.div
            key={d.id}
            animate={{ opacity: resolved ? 0.45 : 1 }}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[9px] font-extrabold" style={{ backgroundColor: `${a.color}22`, color: a.color }}>
                {a.persona[0]}
              </span>
              <p className="min-w-0 flex-1 text-[12.5px] font-bold text-white">{d.title}</p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-[#f5a9cf]">
                <Clock className="h-3 w-3" /> waiting {d.waiting}
              </span>
              <span className="ml-auto flex gap-1.5">
                {done.has(d.id) ? (
                  <GlowChip color="#059669">approved</GlowChip>
                ) : deferred.has(d.id) ? (
                  <GlowChip color="#D97706">deferred</GlowChip>
                ) : (
                  <>
                    <button
                      onClick={() => setDone((s) => new Set(s).add(d.id))}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-400 transition-transform hover:scale-105"
                    >
                      <Check className="h-3 w-3" /> Approve
                    </button>
                    <button
                      onClick={() => setDeferred((s) => new Set(s).add(d.id))}
                      className="rounded-lg bg-white/[0.06] px-2 py-1 text-[10px] font-bold text-slate-300 transition-transform hover:scale-105"
                    >
                      Defer
                    </button>
                  </>
                )}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ---------- Alerts ---------- */
const ALERTS = [
  { sev: "high", color: "#EC4899", text: "Analytics vendor auto-renews in 21 days — Clause flagged the termination window." },
  { sev: "med", color: "#D97706", text: "Support costs growing 2.3x faster than revenue; margin dips below 70% by Oct if unchecked." },
  { sev: "low", color: "#0891CF", text: "Northwind price cut is churning their power users — poaching window open." },
];

export function AlertsWidget() {
  return (
    <ul className="flex flex-col gap-2">
      {ALERTS.map((a, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="flex gap-2.5 rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed text-slate-300"
          style={{ backgroundColor: `${a.color}0d`, border: `1px solid ${a.color}26` }}
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: a.color }} />
          {a.text}
        </motion.li>
      ))}
    </ul>
  );
}

/* ---------- Predictions ---------- */
const PREDICTIONS = [
  { agent: "research", text: "Churn lands at 2.3% in Q3 — lowest in company history.", p: 69 },
  { agent: "finance", text: "Runway extends to 19.4mo if cloud renegotiation closes.", p: 77 },
  { agent: "strategy", text: "EU pilot hits its 12-logo bar in week 11 of 13.", p: 66 },
];

export function PredictionsWidget() {
  return (
    <div className="flex flex-col gap-2">
      {PREDICTIONS.map((pr, i) => {
        const a = AGENTS.find((x) => x.key === pr.agent)!;
        return (
          <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5">
            <p className="text-[12px] leading-relaxed text-slate-300">
              <span className="font-bold" style={{ color: a.color }}>{a.persona}:</span> {pr.text}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                <motion.span
                  className="block h-full rounded-full"
                  style={{ backgroundColor: a.color }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pr.p}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                />
              </span>
              <span className="font-mono text-[9px] font-bold text-slate-400">{pr.p}%</span>
              <ArrowUpRight className="h-3 w-3 text-emerald-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Market Intelligence ---------- */
const INTEL = [
  { source: "Scout · pricing watch", text: "Northwind cut mid-tier list pricing 9%. Assessed as a retention play, not a land grab." },
  { source: "Scout · category signals", text: "Enterprise buyers are consolidating AI vendors from 5+ to 2. Platform positioning matters more this quarter." },
  { source: "Scout · hiring signals", text: "Skyforge is hiring enterprise AEs in DACH — likely collision with the EU pilot." },
];

export function MarketIntelWidget() {
  return (
    <div className="flex flex-col gap-2">
      {INTEL.map((it, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5">
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#67c7f5]">{it.source}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-300">{it.text}</p>
        </div>
      ))}
      <Link to="/feed" className="mt-1 text-center text-[11px] font-bold text-crew-300 hover:text-crew-200">
        Open the full feed →
      </Link>
    </div>
  );
}

/* ---------- AI Utilization ---------- */
export function UtilizationWidget() {
  const U: Record<string, number> = { research: 78, strategy: 64, finance: 86, operations: 71, legal: 52 };
  return (
    <div className="grid grid-cols-5 gap-2">
      {AGENTS.map((a, i) => (
        <div key={a.key} className="flex flex-col items-center gap-1.5">
          <div className="relative h-12 w-12">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
              <motion.circle
                cx="50" cy="50" r="40" fill="none" stroke={a.color} strokeWidth="10" strokeLinecap="round"
                initial={{ strokeDasharray: "0 251" }}
                whileInView={{ strokeDasharray: `${(U[a.key] / 100) * 251} 251` }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-white">{U[a.key]}</span>
          </div>
          <span className="font-mono text-[8px] font-bold uppercase tracking-wider" style={{ color: a.color }}>{a.persona}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Growth Score / Company DNA ---------- */
export function GrowthScoreWidget() {
  return (
    <div>
      <p className="text-4xl font-extrabold tracking-tight text-white">
        <CountUp to={72} /><span className="text-base text-slate-500">/100</span>
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {[
          { label: "Net revenue retention 114%", up: true },
          { label: "Expansion outpacing new logos", up: true },
          { label: "Category search volume −8%", up: false },
        ].map((f) => (
          <p key={f.label} className="flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: f.up ? "#34d399" : "#f5a9cf" }}>
            {f.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />} {f.label}
          </p>
        ))}
      </div>
    </div>
  );
}

const DNA = [
  { label: "Product-led", v: 34, color: "#8A7BEF" },
  { label: "Efficient", v: 26, color: "#059669" },
  { label: "Expansion-minded", v: 22, color: "#0891CF" },
  { label: "Risk-aware", v: 18, color: "#D97706" },
];

export function CompanyDnaWidget() {
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {DNA.map((d, i) => (
          <motion.span
            key={d.label}
            className="h-full"
            style={{ backgroundColor: d.color }}
            initial={{ width: 0 }}
            whileInView={{ width: `${d.v}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {DNA.map((d) => (
          <span key={d.label} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: d.color }} /> {d.label} · {d.v}%
          </span>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Derived by Nexus from twelve months of decisions, spend patterns and crew verdicts.
      </p>
    </div>
  );
}
