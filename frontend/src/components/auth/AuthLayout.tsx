import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { OsBackground } from "#/components/layout/OsBackground";
import { AGENTS } from "#/types";

const AGENT_LINES: Record<string, string> = {
  research: "Scanning 212 sources…",
  strategy: "Mapping Q3 options…",
  finance: "Reconciling the ledger…",
  operations: "Auditing the pipeline…",
  legal: "Reviewing 4 contracts…",
};

/** The crew, waiting for you — floating roster beside the form. */
function BoardroomShowcase() {
  return (
    <div className="relative hidden h-full flex-col justify-center overflow-hidden border-r border-white/[0.06] px-12 lg:flex xl:px-16">
      <div aria-hidden className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-crew-600/15 blur-[110px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">the boardroom is live</p>
        <h2 className="mt-3 max-w-sm text-4xl font-extrabold leading-[1.08] tracking-tight text-white">
          Five executives are <span className="text-aurora">already at work.</span>
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
          Sign in and your crew hands you what changed, what it means, and what to do about it.
        </p>
      </motion.div>

      <div className="relative z-10 mt-10 flex max-w-sm flex-col gap-3">
        {AGENTS.map((a, i) => (
          <motion.div
            key={a.key}
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.25 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className={`glass holo-sheen flex items-center gap-3 rounded-2xl px-4 py-3 ${i % 2 ? "float-b" : "float-a"}`}
            style={{ animationDelay: `${i * -1.4}s` }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold"
              style={{ backgroundColor: `${a.color}22`, color: a.color, boxShadow: `0 0 22px -6px ${a.color}` }}
            >
              {a.persona[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">
                {a.persona} <span className="ml-1 text-[10px] font-semibold text-slate-500">{a.title}</span>
              </p>
              <p className="truncate font-mono text-[10px] text-slate-500">{AGENT_LINES[a.key]}</p>
            </div>
            <span className="relative h-1.5 w-1.5 shrink-0 rounded-full status-ping" style={{ backgroundColor: a.color, color: a.color }} />
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="relative z-10 mt-10 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-600"
      >
        soc 2 type ii · zero training on your data
      </motion.p>
    </div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="world relative flex min-h-screen font-sans text-slate-100 antialiased selection:bg-crew-500 selection:text-white">
      <OsBackground />
      <div className="world-noise" aria-hidden />

      <div className="relative z-10 grid w-full lg:grid-cols-[44%_56%]">
        <BoardroomShowcase />

        <div className="relative flex flex-col items-center justify-center px-6 py-12 sm:px-12">
          <div className="absolute left-6 top-6 z-20 sm:left-10 sm:top-8">
            <Link to="/" className="group flex items-center gap-2.5">
              <div className="conic-ring flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105">
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#0B0D14]">
                  <span className="bg-gradient-to-br from-crew-300 to-[#67c7f5] bg-clip-text text-sm font-extrabold text-transparent">C</span>
                </div>
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white">CrewMind</span>
            </Link>
          </div>

          <div className="relative z-10 w-full max-w-[440px]">
            <div className="glass-deep scanline relative overflow-hidden rounded-[28px] p-8 sm:p-10">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
