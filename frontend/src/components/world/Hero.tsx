import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Play, Sparkles, TrendingUp, Zap } from "lucide-react";
import { AGENTS, REVENUE_SERIES } from "./data";
import { MagneticButton } from "./primitives";

/* Sparkline path from the revenue series */
function sparkPath(w: number, h: number, series: readonly number[]) {
  const max = Math.max(...series);
  const min = Math.min(...series);
  return series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - ((v - min) / (max - min)) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/* ------------------------------------------------------------------ */
/* The holographic dashboard centerpiece                               */
/* ------------------------------------------------------------------ */
function HoloDashboard() {
  const line = sparkPath(280, 80, REVENUE_SERIES);
  return (
    <div className="glass-deep scanline relative w-[min(92vw,880px)] overflow-hidden rounded-3xl p-5 md:p-7">
      {/* window chrome */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#EC4899]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#D97706]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#059669]/70" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">
          crewmind · executive os
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
          <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400 status-ping" />
          LIVE
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {/* revenue chart */}
        <div className="col-span-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400">Annual recurring revenue</p>
              <p className="mt-0.5 text-2xl font-bold text-white">₹12.1L</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" /> +38%
            </span>
          </div>
          <svg viewBox="0 0 280 90" className="mt-3 w-full" aria-hidden>
            <defs>
              <linearGradient id="heroSparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8A7BEF" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#8A7BEF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d={line}
              fill="none"
              stroke="#8A7BEF"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.4, ease: "easeInOut", delay: 0.6 }}
            />
            <path d={`${line} L280,90 L0,90 Z`} fill="url(#heroSparkFill)" opacity={0.8} />
          </svg>
        </div>

        {/* health */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
          <p className="text-[11px] font-medium text-slate-400">Business health</p>
          <p className="mt-0.5 text-2xl font-bold text-white">87</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-crew-500 to-[#0891CF]"
              initial={{ width: 0 }}
              animate={{ width: "87%" }}
              transition={{ duration: 1.8, delay: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="mt-2 text-[10px] text-slate-500">Top decile for your stage</p>
        </div>

        {/* decisions */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
          <p className="text-[11px] font-medium text-slate-400">Decisions this week</p>
          <p className="mt-0.5 text-2xl font-bold text-white">214</p>
          <div className="mt-3 flex items-end gap-1" aria-hidden>
            {[5, 8, 6, 11, 9, 14, 12].map((v, i) => (
              <motion.span
                key={i}
                className="w-full rounded-t bg-[#0891CF]/80"
                initial={{ height: 0 }}
                animate={{ height: v * 2.6 }}
                transition={{ delay: 1 + i * 0.08, duration: 0.5, ease: "easeOut" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* agent row */}
      <div className="mt-3 grid grid-cols-5 gap-2 md:gap-3">
        {AGENTS.map((a, i) => (
          <motion.div
            key={a.id}
            className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-2.5 py-2"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 + i * 0.12, duration: 0.5 }}
          >
            <span
              className="relative h-2 w-2 shrink-0 rounded-full status-ping"
              style={{ backgroundColor: a.color, color: a.color }}
            />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-white">{a.name}</p>
              <p className="hidden truncate text-[9px] text-slate-500 md:block">{a.role}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* Small floating glass widgets orbiting the dashboard */
function FloatingWidget({
  className,
  float,
  depth,
  children,
}: {
  className: string;
  float: string;
  depth: number;
  children: React.ReactNode;
}) {
  return (
    <div className={`absolute ${className}`} style={{ transform: `translateZ(${depth}px)` }}>
      <div className={`glass rounded-2xl px-4 py-3 ${float}`}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Camera-fly-away: the whole stage recedes and blurs as you scroll on.
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 0.82]);
  const stageY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const stageRotX = useTransform(scrollYProgress, [0, 1], [0, 14]);
  const stageOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 0.6], [0, -220]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);

  // Mouse rotates the entire hero scene.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotY = useSpring(useTransform(mx, [-1, 1], [-5, 5]), { stiffness: 60, damping: 18 });
  const rotX = useSpring(useTransform(my, [-1, 1], [4, -4]), { stiffness: 60, damping: 18 });

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden pb-24 pt-32"
      onMouseMove={(e) => {
        mx.set((e.clientX / window.innerWidth) * 2 - 1);
        my.set((e.clientY / window.innerHeight) * 2 - 1);
      }}
    >
      {/* copy */}
      <motion.div style={{ y: copyY, opacity: copyOpacity }} className="relative z-20 mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs font-semibold text-crew-200 backdrop-blur-md"
        >
          <Sparkles className="h-3.5 w-3.5 text-crew-300" />
          Introducing the AI Executive Suite
          <span className="rounded-full bg-crew-500/30 px-2 py-0.5 text-[10px] font-bold text-crew-200">v2.0</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl font-extrabold leading-[1.02] tracking-tight text-white md:text-7xl lg:text-[5.2rem]"
        >
          Your company,
          <br />
          <span className="text-aurora">run by five minds.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg"
        >
          CrewMind gives you an always-on executive team — Strategy, Finance, Operations, Legal and Research agents
          that read everything, debate each other, and hand you decisions instead of dashboards.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <MagneticButton href="/register">
            Hire your AI executives <ArrowRight className="h-4 w-4" />
          </MagneticButton>
          <MagneticButton href="#dashboard" variant="ghost">
            <Play className="h-4 w-4 text-crew-300" /> Watch it think
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* 3D stage */}
      <motion.div
        style={{ scale: stageScale, y: stageY, opacity: stageOpacity, rotateX: stageRotX }}
        className="stage-3d relative z-10 mt-16 w-full"
      >
        <motion.div
          style={{ rotateX: rotX, rotateY: rotY }}
          className="preserve-3d relative mx-auto flex w-fit items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 80, rotateX: 24 }}
            animate={{ opacity: 1, y: 0, rotateX: 8 }}
            transition={{ duration: 1.3, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="preserve-3d"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="conic-ring rounded-3xl">
              <HoloDashboard />
            </div>
            {/* floor reflection */}
            <div
              aria-hidden
              className="absolute -bottom-24 left-1/2 h-24 w-[85%] -translate-x-1/2 rounded-[100%] bg-crew-500/25 blur-3xl"
            />
          </motion.div>

          {/* orbiting glass widgets */}
          <FloatingWidget className="-left-10 top-2 hidden lg:block" float="float-a" depth={90}>
            <p className="text-[10px] font-medium text-slate-400">Burn multiple</p>
            <p className="text-lg font-bold text-white">
              1.1x <span className="text-xs font-semibold text-emerald-400">▼ 0.3</span>
            </p>
          </FloatingWidget>

          <FloatingWidget className="-right-14 top-14 hidden lg:block" float="float-b" depth={120}>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EC4899]/20 text-[#EC4899]">
                <Zap className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-[10px] text-slate-400">Clause flagged</p>
                <p className="text-xs font-bold text-white">Auto-renewal risk</p>
              </div>
            </div>
          </FloatingWidget>

          <FloatingWidget className="-left-20 bottom-16 hidden lg:block" float="float-c" depth={140}>
            <p className="text-[10px] font-medium text-slate-400">NRR</p>
            <p className="text-lg font-bold text-white">128%</p>
          </FloatingWidget>

          <FloatingWidget className="-right-8 bottom-4 hidden lg:block" float="float-a" depth={70}>
            <div className="flex items-center gap-2">
              <span className="relative h-2 w-2 rounded-full bg-[#0891CF] status-ping text-[#0891CF]" />
              <p className="text-xs font-semibold text-white">Scout is researching…</p>
            </div>
          </FloatingWidget>
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        style={{ opacity: copyOpacity }}
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-center"
      >
        <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-slate-500">Scroll to enter</p>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="mx-auto h-9 w-5 rounded-full border border-white/20 p-1"
        >
          <div className="h-2 w-1 mx-auto rounded-full bg-crew-300" />
        </motion.div>
      </motion.div>
    </section>
  );
}
