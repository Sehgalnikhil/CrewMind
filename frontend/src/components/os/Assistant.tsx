import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ThinkingDots } from "#/components/os/ui";
import { COORDINATOR_META } from "#/types";
import { useUiStore } from "#/stores/uiStore";

interface AssistantTurn {
  role: "user" | "nexus";
  text: string;
  to?: string;
  toLabel?: string;
}

/* Nexus routes intent locally — a lightweight concierge over the OS. */
const INTENTS: { match: RegExp; reply: string; to: string; toLabel: string }[] = [
  { match: /war\s*room|debate|deliberat/i, reply: "Convening the boardroom. The five executives will take your question to the strategy table.", to: "/war-room", toLabel: "Open War Room" },
  { match: /risk|runway|cash|burn/i, reply: "Ledger tracks runway and burn on Mission Control — the Risk Radar widget has the live picture.", to: "/dashboard", toLabel: "Open Mission Control" },
  { match: /graph|connect|relation/i, reply: "Everything CrewMind knows is linked in the Knowledge Graph. I'll take you to the map.", to: "/graph", toLabel: "Open Knowledge Graph" },
  { match: /simulat|what if|scenario/i, reply: "The Scenario Simulator can stress-test that decision before you commit to it.", to: "/simulator", toLabel: "Open Simulator" },
  { match: /report|verdict/i, reply: "The latest signed verdicts live in Reports.", to: "/reports", toLabel: "Open Reports" },
  { match: /upload|document|file/i, reply: "Drop files into Documents and the crew will index them into organizational memory.", to: "/documents", toLabel: "Open Documents" },
  { match: /remember|memory|search|find/i, reply: "Executive Memory can search every document, chat, report and decision at once.", to: "/memory", toLabel: "Search Memory" },
];

export function Assistant() {
  const open = useUiStore((s) => s.assistantOpen);
  const setOpen = useUiStore((s) => s.setAssistantOpen);
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, thinking]);

  function ask() {
    const q = input.trim();
    if (!q || thinking) return;
    setInput("");
    setTurns((t) => [...t, { role: "user", text: q }]);
    setThinking(true);
    const intent = INTENTS.find((i) => i.match.test(q));
    setTimeout(() => {
      setThinking(false);
      setTurns((t) => [
        ...t,
        intent
          ? { role: "nexus", text: intent.reply, to: intent.to, toLabel: intent.toLabel }
          : {
              role: "nexus",
              text: "That deserves the full crew. Take it to the Boardroom and I'll bring the right executives in.",
              to: "/chat",
              toLabel: "Open Boardroom Chat",
            },
      ]);
    }, 900);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="glass-deep fixed bottom-24 right-5 z-50 flex h-[min(560px,70vh)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl"
          role="dialog"
          aria-label="Nexus AI assistant"
        >
          <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
            <span className="conic-ring flex h-9 w-9 items-center justify-center rounded-2xl">
              <span className="flex h-full w-full items-center justify-center rounded-2xl bg-[#0B0D14]">
                <Sparkles className="h-4 w-4 text-crew-300" />
              </span>
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{COORDINATOR_META.persona}</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">os concierge</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {turns.length === 0 && (
              <div className="px-2 py-6 text-center">
                <p className="text-sm font-bold text-white">Where to?</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Ask me anything about the OS — I'll route you to the right workspace or executive.
                </p>
              </div>
            )}
            {turns.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={t.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    t.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-md bg-crew-500/25 px-3.5 py-2.5 text-[13px] leading-relaxed text-white"
                      : "max-w-[85%] rounded-2xl rounded-bl-md border border-white/[0.07] bg-white/[0.04] px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-200"
                  }
                >
                  {t.text}
                  {t.to && (
                    <button
                      onClick={() => {
                        setOpen(false);
                        navigate(t.to!);
                      }}
                      className="mt-2 flex items-center gap-1.5 text-xs font-bold text-crew-300 transition-colors hover:text-crew-200"
                    >
                      {t.toLabel} <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
            {thinking && (
              <div className="flex items-center gap-2 px-2">
                <ThinkingDots />
                <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">nexus is routing</span>
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.07] p-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-1.5 pl-4 pr-1.5 transition-colors focus-within:border-crew-500/40">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask()}
                placeholder="Ask Nexus…"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
              <button
                onClick={ask}
                aria-label="Send"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-crew-500 text-white shadow-glow transition-transform hover:scale-105 active:scale-95"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
