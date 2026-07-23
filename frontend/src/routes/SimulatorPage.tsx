import { motion } from "framer-motion";
import { Download, FlaskConical, Save, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import { AppShell } from "#/components/layout/AppShell";
import { BlockTitle, GlowChip, Panel } from "#/components/os/ui";
import { PageHero } from "#/components/system/shared";
import { STANCE_COLOR } from "#/components/warroom/scripts";
import type { Stance } from "#/components/warroom/scripts";
import { AGENTS } from "#/types";
import { cn } from "#/lib/utils";

interface Levers {
  priceChange: number; // -20..30 %
  headcount: number; // -5..15
  marketing: number; // 50..300 (₹K/mo)
  churn: number; // 1..6 %
  euEntry: boolean;
}

const BASELINE: Levers = { priceChange: 0, headcount: 0, marketing: 120, churn: 2.8, euEntry: false };

/** Deterministic 12-month projections from lever values. */
function project(l: Levers) {
  const rev: number[] = [];
  const cash: number[] = [];
  let mrr = 121; // ₹K, matches the dashboard story
  let bank = 1850; // ₹K
  for (let m = 0; m < 12; m++) {
    const priceLift = 1 + (l.priceChange / 100) * 0.72; // elasticity discount
    const demandDrag = 1 - Math.max(l.priceChange, 0) * 0.004;
    const mktGrowth = 1 + (l.marketing / 120) * 0.012;
    const euBoost = l.euEntry && m >= 3 ? 1.018 : 1;
    const churnDrag = 1 - l.churn / 100 / 2.2;
    mrr = mrr * mktGrowth * demandDrag * euBoost * churnDrag * (m === 0 ? priceLift : 1 + (priceLift - 1) * 0.02);
    const burn = 96 + l.headcount * 9.5 + (l.marketing - 120) + (l.euEntry ? 40 : 0);
    bank += mrr - burn;
    rev.push(Math.round(mrr));
    cash.push(Math.round(bank));
  }
  const burnNow = 96 + l.headcount * 9.5 + (l.marketing - 120) + (l.euEntry ? 40 : 0);
  const net = rev[11] - burnNow;
  const runway = net >= 0 ? 99 : Math.max(Math.round(cash[11] / (burnNow - rev[11])), 0);
  return { rev, cash, runway, endMrr: rev[11], endCash: cash[11] };
}

function reactions(l: Levers, p: ReturnType<typeof project>) {
  const r: Record<string, { stance: Stance; confidence: number; note: string }> = {
    research: l.priceChange > 15
      ? { stance: "caution", confidence: 64, note: "Two competitors just cut prices — a hike this size hands them the comparison-page narrative." }
      : l.euEntry
        ? { stance: "support", confidence: 78, note: "DACH demand signals support entry; buyer consolidation favors platforms that show up early." }
        : { stance: "support", confidence: 70, note: "Nothing in the external signal set argues against this configuration." },
    strategy: l.euEntry && l.headcount >= 2
      ? { stance: "support", confidence: 82, note: "Expansion with real staffing behind it — this is the land-and-expand play I've been modelling." }
      : l.euEntry
        ? { stance: "caution", confidence: 58, note: "EU entry without headcount is a tourist visa, not an expansion. Staff it or defer it." }
        : { stance: "support", confidence: 68, note: "Conservative but coherent. Keeps optionality for a stronger move next quarter." },
    finance: p.runway < 12
      ? { stance: "oppose", confidence: 84, note: `Runway compresses to ${p.runway} months — below my 12-month floor. I won't sign this without a cost offset.` }
      : p.runway < 18
        ? { stance: "caution", confidence: 71, note: `Runway lands at ${p.runway} months. Workable, but it spends our slack before the raise window.` }
        : { stance: "support", confidence: 86, note: `Runway holds at ${p.runway >= 99 ? "cash-flow positive" : `${p.runway} months`} — this configuration funds itself.` },
    operations: l.headcount > 8
      ? { stance: "caution", confidence: 66, note: "Onboarding more than 8 at once will drop team throughput ~15% for a quarter. Sequence the hires." }
      : { stance: "support", confidence: 79, note: "Load model absorbs this comfortably; no new bottlenecks introduced." },
    legal: l.euEntry
      ? { stance: "caution", confidence: 73, note: "GDPR readiness and the pending data-residency amendment must close before first EU customer data lands." }
      : { stance: "support", confidence: 92, note: "No new regulatory surface in this scenario." },
  };
  return r;
}

function linePath(w: number, h: number, series: number[], min: number, max: number) {
  return series
    .map((v, i) => `${i === 0 ? "M" : "L"}${((i / (series.length - 1)) * w).toFixed(1)},${(h - 4 - ((v - min) / (max - min || 1)) * (h - 8)).toFixed(1)}`)
    .join(" ");
}

function Slider({ label, value, min, max, step = 1, unit, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
        {label}
        <span className="font-mono text-xs font-bold text-white">{value > 0 && label.includes("Pricing") ? "+" : ""}{value}{unit}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-[#8A7BEF]"
        aria-label={label}
      />
    </label>
  );
}

interface Saved {
  name: string;
  levers: Levers;
  color: string;
}

const SAVE_COLORS = ["#0891CF", "#059669", "#EC4899"];

export function SimulatorPage() {
  const [levers, setLevers] = useState<Levers>(BASELINE);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [name, setName] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const p = useMemo(() => project(levers), [levers]);
  const base = useMemo(() => project(BASELINE), []);
  const reacts = useMemo(() => reactions(levers, p), [levers, p]);

  const allRev = [...p.rev, ...base.rev, ...saved.flatMap((s) => project(s.levers).rev)];
  const [minR, maxR] = [Math.min(...allRev), Math.max(...allRev)];

  const deltas = [
    { label: "MRR month 12", v: p.endMrr, d: p.endMrr - base.endMrr, unit: "K" },
    { label: "Cash month 12", v: p.endCash, d: p.endCash - base.endCash, unit: "K" },
    { label: "Runway", v: p.runway >= 99 ? Infinity : p.runway, d: (p.runway >= 99 ? 36 : p.runway) - (base.runway >= 99 ? 36 : base.runway), unit: "mo" },
  ];

  const downloadPDF = async () => {
    if (!gridRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(gridRef.current, {
        // @ts-expect-error - html2canvas types might be slightly outdated depending on version
        backgroundColor: "#05060C",
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("p", "pt", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`simulator-report-${Date.now()}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppShell title="Scenario Simulator" wide>
      <PageHero
        label="decision laboratory"
        title="Stress-test it before you"
        accent="commit."
        body="Pull the levers. The projection reacts instantly — and so do your five executives."
        action={
          <button
            onClick={downloadPDF}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-xl bg-crew-500 px-4 py-2 text-sm font-bold text-white shadow-glow transition-all hover:bg-crew-400 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Generating PDF..." : "Download Report"}
          </button>
        }
      />

      <div ref={gridRef} className="grid gap-5 xl:grid-cols-4 p-2 -m-2">
        {/* levers */}
        <Panel delay={0.05} className="p-6 xl:col-span-1">
          <BlockTitle label="scenario builder" title="Levers" />
          <div className="flex flex-col gap-5">
            <Slider label="Pricing change" value={levers.priceChange} min={-20} max={30} unit="%" onChange={(v) => setLevers({ ...levers, priceChange: v })} />
            <Slider label="Headcount delta" value={levers.headcount} min={-5} max={15} unit="" onChange={(v) => setLevers({ ...levers, headcount: v })} />
            <Slider label="Marketing spend" value={levers.marketing} min={50} max={300} step={10} unit="K/mo" onChange={(v) => setLevers({ ...levers, marketing: v })} />
            <Slider label="Churn assumption" value={levers.churn} min={1} max={6} step={0.1} unit="%" onChange={(v) => setLevers({ ...levers, churn: v })} />
            <label className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Enter EU market</span>
              <button
                role="switch"
                aria-checked={levers.euEntry}
                aria-label="Enter EU market"
                onClick={() => setLevers({ ...levers, euEntry: !levers.euEntry })}
                className={cn(
                  "relative h-6 w-11 rounded-full border transition-colors",
                  levers.euEntry ? "border-crew-500/50 bg-crew-500/40" : "border-white/12 bg-white/[0.06]",
                )}
              >
                <span className={cn("absolute top-[3px] h-4 w-4 rounded-full transition-all", levers.euEntry ? "left-[calc(100%-19px)] bg-white" : "left-[3px] bg-slate-400")} />
              </button>
            </label>
            <button
              onClick={() => setLevers(BASELINE)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] py-2 text-xs font-bold text-slate-300 transition-colors hover:text-white"
            >
              Reset to baseline
            </button>
            <div className="border-t border-white/[0.07] pt-4">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-1 pl-3 pr-1">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name this scenario…"
                  aria-label="Scenario name"
                  className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
                />
                <button
                  onClick={() => {
                    if (!name.trim() || saved.length >= 3) return;
                    setSaved([...saved, { name: name.trim(), levers: { ...levers }, color: SAVE_COLORS[saved.length] }]);
                    setName("");
                  }}
                  disabled={saved.length >= 3}
                  aria-label="Save scenario"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-crew-500 text-white shadow-glow transition-transform hover:scale-105 disabled:opacity-40"
                >
                  <Save className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                {saved.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-2.5 py-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <button onClick={() => setLevers({ ...s.levers })} className="flex-1 truncate text-left text-xs font-semibold text-slate-300 hover:text-white">
                      {s.name}
                    </button>
                    <button onClick={() => setSaved(saved.filter((_, j) => j !== i))} aria-label={`Delete ${s.name}`} className="text-slate-600 hover:text-[#EC4899]">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        {/* projection */}
        <div className="flex flex-col gap-5 xl:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            {deltas.map((d, i) => (
              <Panel key={d.label} delay={0.1 + i * 0.05} className="p-4">
                <p className="text-[10px] font-semibold text-slate-400">{d.label}</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-white">
                  {d.v === Infinity ? "∞" : `${d.label.startsWith("Runway") ? "" : "₹"}${d.v}${d.unit === "mo" ? " mo" : d.unit}`}
                </p>
                <p className={cn("mt-0.5 text-xs font-bold", d.d >= 0 ? "text-emerald-400" : "text-[#f5a9cf]")}>
                  {d.d >= 0 ? "+" : ""}{d.d}{d.unit === "mo" ? " mo" : d.unit} vs baseline
                </p>
              </Panel>
            ))}
          </div>

          <Panel delay={0.2} className="p-6">
            <BlockTitle
              label="12-month projection"
              title="Revenue trajectory"
              action={<GlowChip color="#8A7BEF">live · reacts to levers</GlowChip>}
            />
            <svg viewBox="0 0 560 170" className="w-full" role="img" aria-label="Projected monthly revenue for this scenario against baseline">
              {[0.33, 0.66].map((f) => (
                <line key={f} x1="0" x2="560" y1={170 * f} y2={170 * f} stroke="rgba(255,255,255,0.05)" />
              ))}
              <path d={linePath(560, 170, base.rev, minR, maxR)} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="5 5" />
              {saved.map((s) => (
                <path key={s.name} d={linePath(560, 170, project(s.levers).rev, minR, maxR)} fill="none" stroke={s.color} strokeWidth="1.5" opacity="0.7" />
              ))}
              <motion.path
                d={linePath(560, 170, p.rev, minR, maxR)}
                fill="none"
                stroke="#8A7BEF"
                strokeWidth="2.5"
                strokeLinecap="round"
                animate={{ d: linePath(560, 170, p.rev, minR, maxR) }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="mt-2 flex flex-wrap items-center gap-4 font-mono text-[9px] uppercase tracking-widest text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-[#8A7BEF]" /> this scenario</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 border-t border-dashed border-white/40" /> baseline</span>
              {saved.map((s) => (
                <span key={s.name} className="flex items-center gap-1.5"><span className="h-0.5 w-5" style={{ backgroundColor: s.color }} /> {s.name}</span>
              ))}
            </div>
          </Panel>

          <Panel delay={0.26} className="p-6">
            <BlockTitle label="12-month projection" title="Cash position" />
            <svg viewBox="0 0 560 130" className="w-full" role="img" aria-label="Projected cash position for this scenario">
              <defs>
                <linearGradient id="simCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0891CF" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0891CF" stopOpacity="0" />
                </linearGradient>
              </defs>
              {(() => {
                const all = [...p.cash, ...base.cash];
                const [mn, mx] = [Math.min(...all), Math.max(...all)];
                const d = linePath(560, 130, p.cash, mn, mx);
                return (
                  <>
                    <path d={linePath(560, 130, base.cash, mn, mx)} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="5 5" />
                    <motion.path d={d} animate={{ d }} transition={{ duration: 0.5 }} fill="none" stroke="#67c7f5" strokeWidth="2.5" strokeLinecap="round" />
                    <path d={`${d} L560,130 L0,130 Z`} fill="url(#simCash)" />
                  </>
                );
              })()}
            </svg>
          </Panel>
        </div>

        {/* executive reactions */}
        <Panel delay={0.15} className="p-6 xl:col-span-1">
          <BlockTitle label="the table reacts" title="Executive verdicts" action={<FlaskConical className="h-4 w-4 text-crew-300" />} />
          <div className="flex flex-col gap-3">
            {AGENTS.map((a, i) => {
              const r = reacts[a.key];
              return (
                <motion.div
                  key={a.key}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.07 }}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-extrabold"
                      style={{ backgroundColor: `${a.color}22`, color: a.color }}
                    >
                      {a.persona[0]}
                    </span>
                    <span className="text-xs font-bold text-white">{a.persona}</span>
                    <span className="ml-auto flex items-center gap-1.5">
                      <GlowChip color={STANCE_COLOR[r.stance]}>{r.stance}</GlowChip>
                    </span>
                  </div>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-slate-400">{r.note}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                      <motion.span
                        className="block h-full rounded-full"
                        style={{ backgroundColor: a.color }}
                        animate={{ width: `${r.confidence}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </span>
                    <span className="font-mono text-[9px] text-slate-500">{r.confidence}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
