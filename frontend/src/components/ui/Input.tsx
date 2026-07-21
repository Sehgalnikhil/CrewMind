import type { InputHTMLAttributes } from "react";

import { cn } from "#/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "rounded-xl border border-surface-border bg-surface-raised px-4 py-2.5 text-sm text-slate-100",
          "placeholder:text-slate-500 outline-none transition-colors",
          "focus:border-crew-500 focus:ring-2 focus:ring-crew-500/20",
          error && "border-red-500/60 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
