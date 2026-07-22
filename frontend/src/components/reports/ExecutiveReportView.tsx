import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Target } from "lucide-react";

import { BlockTitle, GlowChip, Panel } from "#/components/os/ui";
import { CountUp } from "#/components/world/primitives";
import { AGENTS } from "#/types";
import type { Report } from "#/types";

function healthColor(score: number) {
  if (score >= 70) return "#059669";
  if (score >= 45) return "#D97706";
  return "#EC4899";
}

function healthLabel(score: number) {
  if (score >= 70) return "Healthy & stable";
  if (score >= 45) return "Needs attention";
  return "At risk";
}

export function ExecutiveReportView({ report }: { report: Report }) {
  const color = healthColor(report.business_health_score);

  return (
    <motion.div
      key={report.id}
      initial={{ opacity: 0, y: 18, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4"
    >
      {/* header artifact */}
      <Panel deep className="scanline conic-ring relative overflow-hidden p-7">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* gauge */}
          <div className="relative h-32 w-32 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={color}
                strokeWidth="7"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 264" }}
                animate={{ strokeDasharray: `${(report.business_health_score / 100) * 264} 264` }}
                transition={{ duration: 1.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white">
                <CountUp to={report.business_health_score} duration={1.8} />
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500">health</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                {new Date(report.created_at).toLocaleString()}
              </p>
              <GlowChip color={color}>{healthLabel(report.business_health_score)}</GlowChip>
            </div>
            <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-white">{report.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{report.summary}</p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-white/[0.07] pt-4 sm:justify-start">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">signed by</span>
              <div className="flex -space-x-1.5">
                {AGENTS.map((a) => (
                  <span
                    key={a.key}
                    title={`${a.persona} · ${a.name} Agent`}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0a0c14] text-[9px] font-extrabold"
                    style={{ backgroundColor: `${a.color}30`, color: a.color }}
                  >
                    {a.persona[0]}
                  </span>
                ))}
              </div>
              <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> 5/5 consensus
              </span>
            </div>
          </div>
        </div>
      </Panel>

      {/* risks & opportunities */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel delay={0.1} className="p-6">
          <BlockTitle label={`${report.risks.length} flagged`} title="Risks" />
          {report.risks.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">No material risks in this run.</p>
          ) : (
            <ul className="space-y-2.5">
              {report.risks.map((r, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="flex gap-2.5 rounded-2xl border border-[#EC4899]/15 bg-[#EC4899]/[0.06] px-4 py-3 text-[13px] leading-relaxed text-slate-300"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#EC4899]" />
                  {r}
                </motion.li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel delay={0.16} className="p-6">
          <BlockTitle label={`${report.opportunities.length} identified`} title="Opportunities" />
          {report.opportunities.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">No new opportunities in this run.</p>
          ) : (
            <ul className="space-y-2.5">
              {report.opportunities.map((o, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex gap-2.5 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] px-4 py-3 text-[13px] leading-relaxed text-slate-300"
                >
                  <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  {o}
                </motion.li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* recommendations — the action plan */}
      <Panel delay={0.22} className="p-6">
        <BlockTitle label="what to do about it" title="Recommendations & action items" />
        {report.recommendations.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500">No recommendations in this run.</p>
        ) : (
          <ol className="relative ml-2 space-y-4 border-l border-white/[0.08] pl-6">
            {report.recommendations.map((rec, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.26 + i * 0.09 }}
                className="relative"
              >
                <span className="absolute -left-[34px] top-0 flex h-5 w-5 items-center justify-center rounded-full border border-crew-500/40 bg-crew-500/15 font-mono text-[9px] font-bold text-crew-300">
                  {i + 1}
                </span>
                <p className="text-[13px] leading-relaxed text-slate-300">{rec}</p>
              </motion.li>
            ))}
          </ol>
        )}
      </Panel>
    </motion.div>
  );
}
