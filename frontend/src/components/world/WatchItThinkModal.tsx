import { AnimatePresence, motion } from "framer-motion";
import { Terminal, X, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SIMULATED_LOGS = [
  { text: "> Initializing Boardroom session...", delay: 500, color: "text-slate-400" },
  { text: "> Loading context: Q3 Financials, Competitor Analysis, Ops Reports", delay: 1000, color: "text-slate-400" },
  { text: "[Research Agent] Analyzing Acme Corp's recent pricing changes...", delay: 1500, color: "text-pink-400" },
  { text: "[Finance Agent] Querying burn rate metrics for Q4 expansion plan...", delay: 2200, color: "text-emerald-400" },
  { text: "[Operations Agent] Evaluating logistics capacity vs. projected 20% demand bump...", delay: 3000, color: "text-amber-400" },
  { text: "[Strategy Agent] Cross-referencing market share trends...", delay: 3700, color: "text-blue-400" },
  { text: "--------------------------------------------------", delay: 4200, color: "text-slate-600" },
  { text: "[Finance Agent] Warning: Burn rate is acceptable, but Q4 margins will squeeze if we expand aggressively.", delay: 5000, color: "text-emerald-300" },
  { text: "[Strategy Agent] Counter: We must expand now to capture share while Acme Corp is distracted.", delay: 6000, color: "text-blue-300" },
  { text: "[Operations Agent] Confirmed. Our current throughput can handle the 20% volume bump safely.", delay: 6800, color: "text-amber-300" },
  { text: "[Research Agent] Acme's pricing is up 5%—we have a window to undercut.", delay: 7600, color: "text-pink-300" },
  { text: "--------------------------------------------------", delay: 8200, color: "text-slate-600" },
  { text: "[Coordinator Agent] Synthesizing executive consensus...", delay: 9000, color: "text-purple-400" },
  { text: "> FINAL DECISION: Greenlight Q4 expansion. Cap logistics budget at 15% increase and undercut Acme by 2%.", delay: 10500, color: "text-white font-bold" },
];

export function WatchItThinkModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [logs, setLogs] = useState<typeof SIMULATED_LOGS>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setLogs([]);
      return;
    }

    let timeouts: ReturnType<typeof setTimeout>[] = [];

    SIMULATED_LOGS.forEach((log) => {
      const t = setTimeout(() => {
        setLogs((prev) => [...prev, log]);
      }, log.delay);
      timeouts.push(t);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative flex h-full max-h-[600px] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <Terminal className="h-4 w-4" />
                <span>Live Agent Deliberation</span>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Terminal Body */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 font-mono text-sm leading-relaxed antialiased"
            >
              <div className="space-y-3">
                {logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={log.color}
                  >
                    {log.text}
                  </motion.div>
                ))}
                {logs.length < SIMULATED_LOGS.length && (
                  <motion.div
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block h-4 w-2 bg-crew-400 align-middle"
                  />
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-white/5 bg-white/[0.01] px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {logs.length === SIMULATED_LOGS.length ? "Deliberation complete." : "Agents are thinking..."}
              </span>
              {logs.length === SIMULATED_LOGS.length && (
                <button 
                  onClick={() => {
                    setLogs([]);
                    SIMULATED_LOGS.forEach((log) => {
                      setTimeout(() => {
                        setLogs((prev) => [...prev, log]);
                      }, log.delay);
                    });
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-crew-300 hover:text-crew-200 transition-colors"
                >
                  <Play className="h-3 w-3" /> Replay
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
