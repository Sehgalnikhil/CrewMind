import { motion } from "framer-motion";
import { useState } from "react";
import { Briefcase, FlaskConical, Landmark, Scale, Workflow } from "lucide-react";
import { AGENTS } from "./data";
import type { Agent } from "./data";
import { Aurora, SectionHeading, TiltCard } from "./primitives";

const ICONS: Record<string, React.ElementType> = {
  strategy: Briefcase,
  finance: Landmark,
  operations: Workflow,
  legal: Scale,
  research: FlaskConical,
};

/* Stylized 3D avatar: layered rings + core, tinted per agent */
function HoloAvatar({ agent }: { agent: Agent }) {
  const Icon = ICONS[agent.id];
  return (
    <div className="preserve-3d relative mx-auto h-24 w-24">
      <motion.div
        className="absolute inset-0 rounded-full border"
        style={{ borderColor: `${agent.color}55` }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 14, ease: "linear" }}
      >
        <span
          className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full"
          style={{ backgroundColor: agent.color, boxShadow: `0 0 12px ${agent.color}` }}
        />
      </motion.div>
      <motion.div
        className="absolute inset-2 rounded-full border border-dashed"
        style={{ borderColor: `${agent.color}40` }}
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 22, ease: "linear" }}
      />
      <div
        className="absolute inset-4 flex items-center justify-center rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 30%, ${agent.color}50, ${agent.color}14 70%)`,
          boxShadow: `0 0 34px -6px ${agent.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
        }}
      >
        <Icon className="h-7 w-7" style={{ color: agent.color }} />
      </div>
    </div>
  );
}

function ExecutiveCard({ agent, index }: { agent: Agent; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 90, rotateY: -18, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, delay: index * 0.14, ease: [0.22, 1, 0.36, 1] }}
      className={index % 2 === 0 ? "float-a" : "float-b"}
      style={{ animationDelay: `${index * -1.7}s` }}
    >
      <TiltCard maxTilt={10} className="h-full">
        <motion.div
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          animate={{ y: hovered ? -10 : 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="glass holo-sheen scanline group relative h-full overflow-hidden rounded-3xl p-6 text-center"
          style={{
            boxShadow: hovered
              ? `0 30px 80px -20px ${agent.glow}, 0 0 0 1px ${agent.color}44, inset 0 1px 0 rgba(255,255,255,0.1)`
              : undefined,
          }}
        >
          {/* top glow line */}
          <span
            aria-hidden
            className="absolute inset-x-8 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)` }}
          />

          <HoloAvatar agent={agent} />

          <p className="mt-5 text-lg font-bold text-white">{agent.name}</p>
          <p className="text-xs font-semibold" style={{ color: agent.color }}>
            {agent.role}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">{agent.title}</p>

          <p className="mt-4 text-[13px] leading-relaxed text-slate-400">{agent.tagline}</p>

          {/* hover expansion */}
          <motion.div
            initial={false}
            animate={{ height: hovered ? "auto" : 0, opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-relaxed text-slate-400">
              {agent.description}
            </p>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-left">
              <div className="rounded-lg bg-white/[0.04] p-2">
                <dt className="text-[9px] uppercase tracking-wider text-slate-500">Decisions</dt>
                <dd className="text-xs font-bold text-white">{agent.stats.decisions}</dd>
              </div>
              <div className="rounded-lg bg-white/[0.04] p-2">
                <dt className="text-[9px] uppercase tracking-wider text-slate-500">Confidence</dt>
                <dd className="text-xs font-bold text-white">{agent.stats.confidence}%</dd>
              </div>
              <div className="rounded-lg bg-white/[0.04] p-2">
                <dt className="text-[9px] uppercase tracking-wider text-slate-500">Focus</dt>
                <dd className="truncate text-xs font-bold text-white">{agent.stats.focus}</dd>
              </div>
            </dl>
          </motion.div>

          {/* animated status */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span
              className="relative h-1.5 w-1.5 rounded-full status-ping"
              style={{ backgroundColor: agent.color, color: agent.color }}
            />
            <motion.span
              key={hovered ? "active" : "idle"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-[10px] text-slate-500"
            >
              {hovered ? "engaged · reading your data" : "online · monitoring"}
            </motion.span>
          </div>

          {/* soft reflection under the card */}
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-10 left-1/2 h-12 w-3/4 -translate-x-1/2 rounded-[100%] blur-2xl transition-opacity duration-500"
            style={{ background: agent.glow, opacity: hovered ? 0.9 : 0.35 }}
          />
        </motion.div>
      </TiltCard>
    </motion.div>
  );
}

export function TeamSection() {
  return (
    <section id="agents" className="relative px-6 py-32">
      <Aurora variant="violet" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="The Executive Team"
          title={
            <>
              Five minds. <span className="text-aurora">One boardroom.</span>
            </>
          }
          sub="Each agent is a specialist trained on its discipline — and they don't work in silos. They argue, cross-check and sign off on each other's work before anything reaches you."
        />
        <div className="stage-3d grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
          {AGENTS.map((agent, i) => (
            <ExecutiveCard key={agent.id} agent={agent} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
