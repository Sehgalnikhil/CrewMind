import { motion } from "framer-motion";
import { FileText, FlaskConical, Landmark, Briefcase, Workflow, Scale, FileCheck2 } from "lucide-react";
import { Aurora, Reveal, SectionHeading } from "./primitives";

/**
 * Documents → Research → Finance → Strategy → Operations → Legal → Executive Report
 * drawn as a holographic circuit; glowing particles travel every path.
 */

const NODES = [
  { id: "docs", label: "Your documents", sub: "P&L · contracts · CRM", icon: FileText, x: 60, y: 200, color: "#e6e9f2" },
  { id: "research", label: "Scout", sub: "Research", icon: FlaskConical, x: 250, y: 80, color: "#0891CF" },
  { id: "finance", label: "Ledger", sub: "Finance", icon: Landmark, x: 250, y: 320, color: "#D97706" },
  { id: "strategy", label: "Atlas", sub: "Strategy", icon: Briefcase, x: 460, y: 200, color: "#8A7BEF" },
  { id: "ops", label: "Flux", sub: "Operations", icon: Workflow, x: 660, y: 90, color: "#059669" },
  { id: "legal", label: "Clause", sub: "Legal", icon: Scale, x: 660, y: 310, color: "#EC4899" },
  { id: "report", label: "Executive report", sub: "Signed by all five", icon: FileCheck2, x: 860, y: 200, color: "#e6e9f2" },
] as const;

const EDGES: { from: string; to: string; color: string }[] = [
  { from: "docs", to: "research", color: "#0891CF" },
  { from: "docs", to: "finance", color: "#D97706" },
  { from: "research", to: "strategy", color: "#0891CF" },
  { from: "finance", to: "strategy", color: "#D97706" },
  { from: "strategy", to: "ops", color: "#8A7BEF" },
  { from: "strategy", to: "legal", color: "#8A7BEF" },
  { from: "ops", to: "report", color: "#059669" },
  { from: "legal", to: "report", color: "#EC4899" },
];

function edgePath(from: (typeof NODES)[number], to: (typeof NODES)[number]) {
  const mx = (from.x + to.x) / 2;
  return `M${from.x},${from.y} C${mx},${from.y} ${mx},${to.y} ${to.x},${to.y}`;
}

export function WorkflowSection() {
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

  return (
    <section className="relative overflow-hidden px-6 py-32">
      <Aurora variant="cyan" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="The Pipeline"
          title={
            <>
              From raw documents to a <span className="text-aurora">signed decision.</span>
            </>
          }
          sub="Drop in your files. Watch the crew route every fact through research, finance, strategy, operations and legal — and hand back one report they all stand behind."
        />

        <Reveal>
          <div className="glass-deep grid-lines relative overflow-hidden rounded-3xl p-4 md:p-8">
            <svg viewBox="0 0 920 400" className="w-full" role="img" aria-label="Diagram: documents flow through the research and finance agents into strategy, then operations and legal, producing an executive report">
              <defs>
                <filter id="nodeGlow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="6" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* edges */}
              {EDGES.map((e, i) => {
                const d = edgePath(byId[e.from], byId[e.to]);
                return (
                  <g key={i}>
                    <motion.path
                      d={d}
                      fill="none"
                      stroke={e.color}
                      strokeOpacity="0.25"
                      strokeWidth="1.5"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, delay: 0.3 + i * 0.12, ease: "easeInOut" }}
                    />
                    {/* travelling particles */}
                    {[0, 1].map((k) => (
                      <circle key={k} r="3.5" fill={e.color} filter="url(#nodeGlow)">
                        <animateMotion dur={`${2.6 + i * 0.3}s`} begin={`${k * 1.4 + i * 0.2}s`} repeatCount="indefinite" path={d} />
                      </circle>
                    ))}
                  </g>
                );
              })}

              {/* nodes */}
              {NODES.map((n, i) => (
                <motion.g
                  key={n.id}
                  initial={{ opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.15, type: "spring", bounce: 0.45 }}
                  style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                >
                  <circle cx={n.x} cy={n.y} r="34" fill="#0B0D14" stroke={n.color} strokeOpacity="0.5" strokeWidth="1.5" filter="url(#nodeGlow)" />
                  <circle cx={n.x} cy={n.y} r="34" fill={n.color} fillOpacity="0.08" />
                  <foreignObject x={n.x - 12} y={n.y - 12} width="24" height="24">
                    <n.icon className="h-6 w-6" style={{ color: n.color }} />
                  </foreignObject>
                  <text x={n.x} y={n.y + 56} textAnchor="middle" fill="#e6e9f2" fontSize="14" fontWeight="700">
                    {n.label}
                  </text>
                  <text x={n.x} y={n.y + 74} textAnchor="middle" fill="#8b90a3" fontSize="11">
                    {n.sub}
                  </text>
                </motion.g>
              ))}
            </svg>

            {/* live caption */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/[0.06] pt-4">
              {["Scout cites 212 sources", "Ledger reconciles to the ledger", "Clause reviews every clause", "Atlas prices the tradeoffs"].map((t, i) => (
                <motion.span
                  key={t}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.2 + i * 0.2 }}
                  className="font-mono text-[10px] uppercase tracking-widest text-slate-500"
                >
                  ● {t}
                </motion.span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
