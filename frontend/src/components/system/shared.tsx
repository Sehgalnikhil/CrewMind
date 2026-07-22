import { motion } from "framer-motion";
import type { ReactNode } from "react";
import clsx from "clsx";

/** Relative time label from an ISO timestamp. */
export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** Page hero: micro-label + extrabold heading + optional subline / action. */
export function PageHero({
  label,
  title,
  accent,
  body,
  action,
}: {
  label: string;
  title: string;
  /** Word(s) rendered with the aurora gradient at the end of the title. */
  accent: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">{label}</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          {title} <span className="text-aurora">{accent}</span>
        </h2>
        {body && <p className="mt-2 max-w-xl text-sm text-slate-400">{body}</p>}
      </motion.div>
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-center gap-3"
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}

/** Keyboard key cap. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={clsx(
        "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md border border-white/12 bg-white/[0.06] px-1.5 font-mono text-[10px] font-bold text-slate-200 shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

/** iOS-style toggle switch matching the glass language. */
export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={clsx(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-300",
        on ? "border-crew-500/50 bg-crew-500/40" : "border-white/12 bg-white/[0.06]",
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={clsx(
          "absolute top-[3px] h-4 w-4 rounded-full shadow",
          on ? "left-[calc(100%-19px)] bg-white" : "left-[3px] bg-slate-400",
        )}
        style={on ? { boxShadow: "0 0 12px -2px rgba(138,123,239,0.9)" } : undefined}
      />
    </button>
  );
}

/** Animated horizontal usage bar. */
export function MeterBar({
  pct,
  color,
  over = false,
  delay = 0,
}: {
  pct: number;
  color: string;
  over?: boolean;
  delay?: number;
}) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: over
            ? "linear-gradient(90deg, #EC4899, #f5a9cf)"
            : `linear-gradient(90deg, ${color}, ${color}cc)`,
          boxShadow: `0 0 14px -4px ${over ? "#EC4899" : color}`,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
