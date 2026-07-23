import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FileText, MessageSquare, History, Activity, ShieldCheck, X } from "lucide-react";

import { BlockTitle, GlowChip } from "#/components/os/ui";
import { AGENTS, COORDINATOR_META, type CrewAgentKey } from "#/types";
import { cn } from "#/lib/utils";
import type { PlayedTurn, TranscriptItem } from "#/routes/WarRoomPage";

function meta(key: CrewAgentKey) {
  const CREW = [...AGENTS, COORDINATOR_META];
  return CREW.find((a) => a.key === key) ?? COORDINATOR_META;
}

interface ExecutivePanelProps {
  selected: CrewAgentKey;
  onClose: () => void;
  transcript: TranscriptItem[];
}

type TabKey = "conversation" | "notes" | "evidence" | "timeline" | "metrics";

export function ExecutivePanel({ selected, onClose, transcript }: ExecutivePanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("conversation");
  const agent = meta(selected);

  const myTurns = transcript.filter((t) => !("user" in t) && t.speaker === selected) as PlayedTurn[];
  const lastTurn = myTurns.length > 0 ? myTurns[myTurns.length - 1] : null;

  const notes = myTurns.map(t => t.reasoning).filter(Boolean);
  const evidence = [...new Set(myTurns.flatMap(t => t.evidence || []))];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0B0D14]"
      style={{ boxShadow: `0 0 60px -20px ${agent.color}40` }}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-extrabold"
            style={{ backgroundColor: `${agent.color}22`, color: agent.color, boxShadow: `0 0 20px -5px ${agent.color}` }}
          >
            {agent.persona[0]}
          </span>
          <div>
            <h3 className="text-sm font-bold text-white" style={{ color: agent.color }}>
              {agent.persona}
            </h3>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              {agent.title}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {lastTurn && lastTurn.done && (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">Confidence</p>
                <p className="text-xs font-bold text-white">{lastTurn.confidence}%</p>
              </div>
              <GlowChip color={lastTurn.stance === "support" ? "#059669" : lastTurn.stance === "caution" ? "#D97706" : "#EC4899"}>
                {lastTurn.stance}
              </GlowChip>
            </div>
          )}
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 border-b border-white/[0.06] px-4">
        {[
          { id: "conversation", icon: MessageSquare, label: "Conversation" },
          { id: "notes", icon: FileText, label: "Notes" },
          { id: "evidence", icon: ShieldCheck, label: "Evidence" },
          { id: "timeline", icon: History, label: "Timeline" },
          { id: "metrics", icon: Activity, label: "Metrics" },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as TabKey)}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold transition-colors",
                active ? "text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {active && (
                <motion.div
                  layoutId="exec_tab_indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ backgroundColor: agent.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === "conversation" && (
              <div className="flex flex-col gap-4">
                {myTurns.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-10">No messages yet.</p>
                ) : (
                  myTurns.map((turn) => (
                    <div key={turn.id} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
                          {turn.phase} Phase
                        </span>
                        {turn.respondingTo && (
                          <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
                            → {turn.respondingTo}
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] leading-relaxed text-slate-300">
                        "{turn.shown}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "notes" && (
              <div className="flex flex-col gap-2">
                <BlockTitle label="internal thoughts" title="Executive Notebook" />
                {notes.length === 0 ? (
                  <p className="text-xs text-slate-500">Notebook is empty.</p>
                ) : (
                  notes.map((note, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 rounded-lg bg-white/[0.02] px-3 py-2">
                      <div className="mt-1 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: agent.color }} />
                      <p className="text-[12px] italic leading-relaxed text-slate-400">{note}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "evidence" && (
              <div className="flex flex-col gap-3">
                <BlockTitle label="cited material" title="Evidence Log" />
                {evidence.length === 0 ? (
                  <p className="text-xs text-slate-500">No evidence cited yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {evidence.map((ev, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-300">{ev}</span>
                        </div>
                        <button className="text-[10px] font-bold text-crew-400 hover:text-crew-300 transition-colors">
                          View source
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="flex flex-col gap-4">
                <BlockTitle label="process" title="Reasoning Timeline" />
                <div className="relative border-l border-white/10 ml-2 pl-4 py-2 space-y-5">
                  {myTurns.map((turn, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border border-[#0B0D14]" style={{ backgroundColor: agent.color }} />
                      <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                        {turn.phase}
                      </p>
                      <p className="text-[12px] font-semibold text-slate-300">
                        {turn.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "metrics" && lastTurn && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Confidence</p>
                  <p className="mt-1 text-2xl font-extrabold text-white">{lastTurn.confidence}%</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Evidence Used</p>
                  <p className="mt-1 text-2xl font-extrabold text-white">{evidence.length}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Messages</p>
                  <p className="mt-1 text-2xl font-extrabold text-white">{myTurns.length}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Stance</p>
                  <p className="mt-1 text-lg font-bold capitalize text-white">{lastTurn.stance}</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
