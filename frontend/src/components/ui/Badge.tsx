import type { ReactNode } from "react";

import { cn } from "#/lib/utils";

const toneClasses: Record<string, string> = {
  neutral: "bg-surface-border text-slate-300",
  success: "bg-emerald-500/15 text-emerald-400",
  warning: "bg-amber-500/15 text-amber-400",
  danger: "bg-red-500/15 text-red-400",
  brand: "bg-crew-500/15 text-crew-300",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof toneClasses;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
