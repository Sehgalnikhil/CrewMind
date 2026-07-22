import { motion } from "framer-motion";
import type { InputHTMLAttributes, ReactNode } from "react";

/** Labelled glass input used across the auth screens. */
export function AuthField({
  label,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  return (
    <div className="group">
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400 transition-colors group-focus-within:text-crew-300"
      >
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white outline-none backdrop-blur-md transition-all placeholder:text-slate-600 focus:border-crew-500/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-crew-500/15"
        {...props}
      />
    </div>
  );
}

/** Primary glowing submit button. */
export function AuthSubmit({
  loading,
  children,
}: {
  loading: boolean;
  children: ReactNode;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      type="submit"
      disabled={loading}
      className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-black shadow-[0_0_50px_-12px_rgba(138,123,239,0.8)] transition-shadow hover:shadow-[0_0_65px_-10px_rgba(138,123,239,1)] focus:outline-none focus:ring-4 focus:ring-crew-500/30 disabled:opacity-70"
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-crew-200/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative z-10 inline-flex items-center gap-2">
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
        ) : (
          children
        )}
      </span>
    </motion.button>
  );
}

/** Divider between social and email auth. */
export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="my-7 flex items-center justify-center gap-4">
      <div className="h-px flex-1 bg-white/[0.08]" />
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{children}</span>
      <div className="h-px flex-1 bg-white/[0.08]" />
    </div>
  );
}

/** Inline error banner. */
export function AuthError({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
      <div className="rounded-2xl border border-[#EC4899]/30 bg-[#EC4899]/10 px-4 py-3 text-sm font-medium text-[#f5a9cf]">
        {message}
      </div>
    </motion.div>
  );
}
