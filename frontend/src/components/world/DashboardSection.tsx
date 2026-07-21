import { motion, useScroll, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Lightbulb } from "lucide-react";
import { AGENTS, HEALTH_SCORE, REVENUE_SERIES } from "./data";
import { CountUp } from "./primitives";

/* Build a smooth-ish revenue path */
function linePath(w: number, h: number, series: readonly number[]) {
  const max = Math.max(...series);
  const min = Math.min(...series);
  return series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - 8 - ((v - min) / (max - min)) * (h - 16);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function Panel({
  progress,
  range,
  from = "bottom",
  className,
  children,
}: {
  progress: MotionValue<number>;
  range: [number, number];
  from?: "bottom" | "left" | "right" | "top";
  className?: string;
  children: React.ReactNode;
}) {
  const opacity = useTransform(progress, range, [0, 1]);
  const dist = 90;
  const x = useTransform(progress, range, from === "left" ? [-dist, 0] : from === "right" ? [dist, 0] : [0, 0]);
  const y = useTransform(progress, range, from === "bottom" ? [dist, 0] : from === "top" ? [-dist, 0] : [0, 0]);
  const rotateX = useTransform(progress, range, [from === "bottom" ? 24 : 0, 0]);
  const scale = useTransform(progress, range, [0.92, 1]);

  return (
    <motion.div style={{ opacity, x, y, rotateX, scale }} className={`preserve-3d ${className ?? ""}`}>
      {children}
    </motion.div>
  );
}

export function DashboardSection() {
  const wrap = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });

  const chartDraw = useTransform(scrollYProgress, [0.28, 0.55], [0, 1]);
  const gaugeDraw = useTransform(scrollYProgress, [0.45, 0.7], [0, HEALTH_SCORE / 100]);
  const gaugeDash = useTransform(gaugeDraw, (v) => `${v * 264} 264`);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.12], [0, 1]);
  const titleY = useTransform(scrollYProgress, [0, 0.12], [60, 0]);

  const W = 560;
  const H = 190;
  const path = linePath(W, H, REVENUE_SERIES);

  return (
    <div ref={wrap} id="dashboard" className="relative h-[280vh]">
      <div className="sticky top-0 flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
        <motion.div style={{ opacity: titleOpacity, y: titleY }} className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-crew-300 backdrop-blur-md">
            <span className="relative h-1.5 w-1.5 rounded-full bg-crew-400 status-ping" />
            Command Center
          </span>
          <h2 className="mt-5 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Watch your business <span className="text-aurora">assemble itself.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Keep scrolling — every panel is being built live by an agent that just finished reading your data.
          </p>
        </motion.div>

        <div className="stage-3d w-full max-w-5xl">
          <div className="preserve-3d grid gap-4 md:grid-cols-3">
            {/* KPI row */}
            <Panel progress={scrollYProgress} range={[0.1, 0.24]} from="left">
              <div className="glass rounded-2xl p-5">
                <p className="text-[11px] font-medium text-slate-400">ARR</p>
                <p className="mt-1 text-3xl font-bold text-white">
                  <CountUp to={12.1} decimals={1} prefix="$" suffix="M" />
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <ArrowUpRight className="h-3.5 w-3.5" /> +38% YoY — verified by Ledger
                </p>
              </div>
            </Panel>
            <Panel progress={scrollYProgress} range={[0.15, 0.29]} from="bottom">
              <div className="glass rounded-2xl p-5">
                <p className="text-[11px] font-medium text-slate-400">Gross margin</p>
                <p className="mt-1 text-3xl font-bold text-white">
                  <CountUp to={74} suffix="%" />
                </p>
                <p className="mt-1 text-xs text-slate-500">Flux found 3.2 pts of recoverable margin</p>
              </div>
            </Panel>
            <Panel progress={scrollYProgress} range={[0.2, 0.34]} from="right">
              <div className="glass rounded-2xl p-5">
                <p className="text-[11px] font-medium text-slate-400">Runway</p>
                <p className="mt-1 text-3xl font-bold text-white">
                  <CountUp to={31} suffix=" mo" />
                </p>
                <p className="mt-1 text-xs text-slate-500">At current burn — scenario B extends to 40</p>
              </div>
            </Panel>

            {/* revenue chart draws itself */}
            <Panel progress={scrollYProgress} range={[0.26, 0.42]} from="bottom" className="md:col-span-2">
              <div className="glass rounded-2xl p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Revenue trajectory</p>
                    <p className="text-xs text-slate-500">Trailing 12 months · $K MRR</p>
                  </div>
                  <span className="rounded-full border border-crew-500/30 bg-crew-500/10 px-3 py-1 text-[10px] font-semibold text-crew-300">
                    Atlas: momentum accelerating
                  </span>
                </div>
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Monthly recurring revenue rising from $42K to $121K over twelve months">
                  <defs>
                    <linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8A7BEF" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#8A7BEF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75].map((f) => (
                    <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  ))}
                  <motion.path d={path} fill="none" stroke="#8A7BEF" strokeWidth="2.5" strokeLinecap="round" style={{ pathLength: chartDraw }} />
                  <motion.path d={`${path} L${W},${H} L0,${H} Z`} fill="url(#dashFill)" style={{ opacity: chartDraw }} />
                  {/* last point + direct label */}
                  <motion.g style={{ opacity: useTransform(scrollYProgress, [0.52, 0.58], [0, 1]) }}>
                    <circle cx={W} cy={12} r="5" fill="#8A7BEF" stroke="#05060C" strokeWidth="2" />
                    <text x={W - 12} y={16} textAnchor="end" fill="#e6e9f2" fontSize="13" fontWeight="700">
                      $121K
                    </text>
                  </motion.g>
                </svg>
              </div>
            </Panel>

            {/* health gauge */}
            <Panel progress={scrollYProgress} range={[0.4, 0.55]} from="right">
              <div className="glass flex h-full flex-col items-center justify-center rounded-2xl p-6">
                <p className="mb-3 text-sm font-semibold text-white">Business health</p>
                <div className="relative h-32 w-32">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="url(#gaugeGrad)"
                      strokeWidth="7"
                      strokeLinecap="round"
                      style={{ strokeDasharray: gaugeDash }}
                    />
                    <defs>
                      <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#8A7BEF" />
                        <stop offset="100%" stopColor="#0891CF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-white">
                      <CountUp to={HEALTH_SCORE} duration={2.4} />
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">/ 100</span>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs text-slate-500">Composite of 42 signals, refreshed hourly</p>
              </div>
            </Panel>

            {/* agent status strip */}
            <Panel progress={scrollYProgress} range={[0.55, 0.7]} from="bottom" className="md:col-span-3">
              <div className="glass rounded-2xl p-4">
                <div className="grid gap-2 md:grid-cols-5">
                  {AGENTS.map((a, i) => (
                    <motion.div
                      key={a.id}
                      style={{ opacity: useTransform(scrollYProgress, [0.56 + i * 0.03, 0.62 + i * 0.03], [0, 1]) }}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
                    >
                      <span className="relative h-2 w-2 shrink-0 rounded-full status-ping" style={{ backgroundColor: a.color, color: a.color }} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white">{a.name}</p>
                        <p className="truncate font-mono text-[9px] text-slate-500">
                          {["mapping Q3 options", "closing the books", "auditing pipeline", "reviewing 4 contracts", "scanning 212 sources"][i]}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Panel>

            {/* insight toasts */}
            <Panel progress={scrollYProgress} range={[0.72, 0.86]} from="bottom" className="md:col-span-3">
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { icon: Lightbulb, color: "#8A7BEF", title: "Opportunity", body: "Expansion revenue in EU accounts is 2.3× benchmark — Atlas drafted a land-and-expand play." },
                  { icon: AlertTriangle, color: "#D97706", title: "Watch", body: "Ledger projects margin compression in Q4 if infra costs keep scaling linearly." },
                  { icon: CheckCircle2, color: "#059669", title: "Resolved", body: "Clause renegotiated the auto-renewal exposure across 12 vendor contracts." },
                ].map((t) => (
                  <div key={t.title} className="glass holo-sheen rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${t.color}22`, color: t.color }}>
                        <t.icon className="h-4 w-4" />
                      </span>
                      <p className="text-xs font-bold uppercase tracking-wider text-white">{t.title}</p>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">{t.body}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
