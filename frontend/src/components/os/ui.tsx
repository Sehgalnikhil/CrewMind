import { motion } from "framer-motion";
import type { ReactNode } from "react";
import clsx from "clsx";

/* Section label + heading used at the top of every OS page block */
export function BlockTitle({
  label,
  title,
  action,
}: {
  label?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {label && <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-500">{label}</p>}
        <h3 className="mt-0.5 text-base font-bold tracking-tight text-white">{title}</h3>
      </div>
      {action}
    </div>
  );
}

/* Glass panel with entrance animation */
export function Panel({
  children,
  className,
  delay = 0,
  deep = false,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  deep?: boolean;
  hover?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -4 } : undefined}
      className={clsx(deep ? "glass-deep" : "glass", "rounded-3xl", className)}
    >
      {children}
    </motion.div>
  );
}

/* Orbital spinner — the OS loading mark */
export function OrbitalLoader({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={clsx("flex flex-col items-center gap-3 py-10", className)} role="status" aria-label={label ?? "Loading"}>
      <div className="relative h-10 w-10">
        <motion.span
          className="absolute inset-0 rounded-full border border-crew-500/30 border-t-crew-400"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
        />
        <motion.span
          className="absolute inset-[7px] rounded-full border border-[#0891CF]/30 border-b-[#67c7f5]"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
        />
        <span className="absolute inset-[16px] rounded-full bg-crew-400/70 shadow-glow" />
      </div>
      {label && <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">{label}</p>}
    </div>
  );
}

/* Empty state with a floating icon */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="flex h-14 w-14 items-center justify-center rounded-3xl border border-crew-500/25 bg-crew-500/10 text-crew-300 shadow-[0_0_40px_-12px_rgba(108,92,231,0.8)]"
      >
        {icon}
      </motion.div>
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="max-w-sm text-[13px] leading-relaxed text-slate-500">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* Three-dot "agent is thinking" indicator */
export function ThinkingDots({ color = "#8A7BEF" }: { color?: string }) {
  return (
    <span className="inline-flex items-center gap-1" role="status" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 1, delay: i * 0.18 }}
        />
      ))}
    </span>
  );
}

/* Small glowing chip */
export function GlowChip({
  children,
  color = "#8A7BEF",
  className,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={clsx("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold", className)}
      style={{ borderColor: `${color}44`, color, backgroundColor: `${color}12` }}
    >
      {children}
    </span>
  );
}
