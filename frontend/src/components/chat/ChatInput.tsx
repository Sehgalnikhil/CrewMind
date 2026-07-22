import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { useState } from "react";

export function ChatInput({
  onSend,
  disabled,
  placeholder = "Ask your executives anything…",
}: {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
      <div className="relative flex-1">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none backdrop-blur-md transition-all placeholder:text-slate-600 focus:border-crew-500/50 focus:bg-white/[0.06] focus:ring-4 focus:ring-crew-500/15 disabled:opacity-50"
        />
      </div>
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-black shadow-[0_0_36px_-10px_rgba(138,123,239,0.9)] transition-shadow hover:shadow-[0_0_48px_-8px_rgba(138,123,239,1)] disabled:opacity-40 disabled:shadow-none"
      >
        <Send className="h-4 w-4" />
      </motion.button>
    </form>
  );
}
