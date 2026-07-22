import { AnimatePresence, motion } from "framer-motion";
import { Gauge, Pause, Play, RotateCcw, Send, Swords, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "#/components/layout/AppShell";
import { BlockTitle, GlowChip, Panel, ThinkingDots } from "#/components/os/ui";
import {
  PHASES,
  STANCE_COLOR,
  SUGGESTED_QUESTIONS,
  buildAckTurn,
  buildFollowUpTurns,
  resolveScript,
} from "#/components/warroom/scripts";
import type { DeliberationScript, PhaseKey, ScriptTurn, Verdict } from "#/components/warroom/scripts";
import { AGENTS, COORDINATOR_META } from "#/types";
import type { CrewAgentKey } from "#/types";
import { cn } from "#/lib/utils";

const CREW = [...AGENTS, COORDINATOR_META];

function meta(key: CrewAgentKey) {
  return CREW.find((a) => a.key === key) ?? COORDINATOR_META;
}

/* Seat positions along an arc, in % of the stage width/height */
const SEATS: Record<string, { x: number; y: number }> = {
  research: { x: 8, y: 62 },
  finance: { x: 28, y: 24 },
  strategy: { x: 50, y: 10 },
  operations: { x: 72, y: 24 },
  legal: { x: 92, y: 62 },
  coordinator: { x: 50, y: 78 },
};

type SessionState = "idle" | "running" | "verdict";

interface PlayedTurn extends ScriptTurn {
  id: number;
  /** Text visible so far (streaming). */
  shown: string;
  done: boolean;
}

interface UserTurn {
  id: number;
  user: true;
  text: string;
}

type TranscriptItem = PlayedTurn | UserTurn;

function isUserTurn(t: TranscriptItem): t is UserTurn {
  return "user" in t;
}

/* ---------------- stage: the strategy table ---------------- */

function TableStage({ speaker, respondingTo }: { speaker: CrewAgentKey | null; respondingTo?: CrewAgentKey | "user" }) {
  const from = speaker ? SEATS[speaker] : null;
  const to = respondingTo && respondingTo !== "user" ? SEATS[respondingTo] : null;
  return (
    <div className="relative h-44 w-full sm:h-52" aria-hidden>
      {/* table surface */}
      <div className="absolute inset-x-[12%] bottom-2 top-[38%] rounded-[50%] border border-white/[0.08] bg-white/[0.02] grid-lines" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {from && to && (
          <motion.line
            key={`${speaker}-${respondingTo}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={meta(speaker!).color}
            strokeWidth="0.5"
            className="dash-flow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
          />
        )}
      </svg>
      {CREW.map((a, i) => {
        const seat = SEATS[a.key];
        const active = speaker === a.key;
        return (
          <motion.div
            key={a.key}
            className={cn("absolute -translate-x-1/2 -translate-y-1/2", ["float-a", "float-b", "float-c"][i % 3])}
            style={{ left: `${seat.x}%`, top: `${seat.y}%` }}
            animate={{ scale: active ? 1.18 : 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
          >
            <div
              className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-extrabold backdrop-blur-md sm:h-12 sm:w-12")}
              style={{
                backgroundColor: `${a.color}${active ? "38" : "1d"}`,
                borderColor: `${a.color}${active ? "aa" : "44"}`,
                color: a.color,
                boxShadow: active ? `0 0 34px -6px ${a.color}` : `0 0 18px -10px ${a.color}`,
              }}
            >
              {a.persona[0]}
            </div>
            <p className="mt-1 text-center font-mono text-[8px] uppercase tracking-widest text-slate-500">{a.persona}</p>
            {active && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full status-ping" style={{ backgroundColor: a.color, color: a.color }} />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

/* ---------------- right rail widgets ---------------- */

function PhaseRail({ phase, done }: { phase: PhaseKey | null; done: boolean }) {
  const activeIdx = done ? PHASES.length : phase ? PHASES.findIndex((p) => p.key === phase) : -1;
  return (
    <ol className="flex flex-col gap-1.5">
      {PHASES.map((p, i) => {
        const state = i < activeIdx ? "done" : i === activeIdx ? "active" : "next";
        return (
          <li key={p.key} className="flex items-center gap-3">
            <span
              className={cn(
                "relative flex h-2 w-2 rounded-full transition-colors",
                state === "done" && "bg-emerald-400",
                state === "active" && "bg-crew-400 status-ping text-crew-400",
                state === "next" && "bg-white/15",
              )}
            />
            <span className={cn("text-xs font-bold", state === "next" ? "text-slate-600" : "text-white")}>{p.label}</span>
            {state === "active" && <ThinkingDots />}
          </li>
        );
      })}
    </ol>
  );
}

function stanceAgreement(a?: ScriptTurn, b?: ScriptTurn): number | null {
  if (!a || !b) return null;
  if (a.stance === b.stance) return 1;
  if ((a.stance === "support" && b.stance === "oppose") || (a.stance === "oppose" && b.stance === "support")) return 0;
  return 0.5;
}

function AgreementMatrix({ latest }: { latest: Partial<Record<CrewAgentKey, ScriptTurn>> }) {
  return (
    <div>
      <div className="grid grid-cols-6 gap-1" role="table" aria-label="Executive agreement matrix">
        <span />
        {AGENTS.map((a) => (
          <span key={a.key} className="text-center font-mono text-[8px] font-extrabold" style={{ color: a.color }}>
            {a.persona[0]}
          </span>
        ))}
        {AGENTS.map((row) => (
          <div key={row.key} className="contents">
            <span className="self-center font-mono text-[8px] font-extrabold" style={{ color: row.color }}>
              {row.persona[0]}
            </span>
            {AGENTS.map((col) => {
              if (row.key === col.key)
                return <span key={col.key} className="aspect-square rounded-md bg-white/[0.04]" />;
              const v = stanceAgreement(latest[row.key], latest[col.key]);
              const bg = v === null ? "rgba(255,255,255,0.04)" : v === 1 ? "#05966955" : v === 0 ? "#EC489955" : "#D9770644";
              return (
                <motion.span
                  key={col.key}
                  className="aspect-square rounded-md"
                  animate={{ backgroundColor: bg }}
                  transition={{ duration: 0.6 }}
                  title={v === null ? "No position yet" : v === 1 ? "Aligned" : v === 0 ? "Opposed" : "Partial"}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-3 font-mono text-[8px] uppercase tracking-widest text-slate-500">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-[#059669]/60" /> aligned</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-[#D97706]/50" /> partial</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-[#EC4899]/60" /> opposed</span>
      </div>
    </div>
  );
}

function ConsensusGauge({ latest }: { latest: Partial<Record<CrewAgentKey, ScriptTurn>> }) {
  const turns = AGENTS.map((a) => latest[a.key]).filter(Boolean) as ScriptTurn[];
  let pct = 0;
  if (turns.length >= 2) {
    let sum = 0;
    let n = 0;
    for (let i = 0; i < turns.length; i++)
      for (let j = i + 1; j < turns.length; j++) {
        sum += stanceAgreement(turns[i], turns[j]) ?? 0;
        n++;
      }
    const conf = turns.reduce((s, t) => s + t.confidence, 0) / turns.length / 100;
    pct = Math.round(((sum / Math.max(n, 1)) * 0.7 + conf * 0.3) * 100);
  }
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
          <motion.circle
            cx="50" cy="50" r="42" fill="none" stroke="#8A7BEF" strokeWidth="9" strokeLinecap="round"
            animate={{ strokeDasharray: `${(pct / 100) * 264} 264` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-white">{pct}</span>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-400">
        Table consensus. Blends stance alignment across all pairs with average stated confidence.
      </p>
    </div>
  );
}

/* ---------------- transcript ---------------- */

function TurnBubble({ turn }: { turn: PlayedTurn }) {
  const a = meta(turn.speaker);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="flex gap-3">
      <span
        className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold"
        style={{ backgroundColor: `${a.color}22`, color: a.color, boxShadow: `0 0 18px -8px ${a.color}` }}
      >
        {a.persona[0]}
      </span>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.03] p-4">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold" style={{ color: a.color }}>{a.persona}</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-slate-600">{a.title}</span>
          {turn.respondingTo && (
            <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
              → {turn.respondingTo === "user" ? "you" : meta(turn.respondingTo).persona}
            </span>
          )}
          <span className="ml-auto flex items-center gap-2">
            <GlowChip color={STANCE_COLOR[turn.stance]}>{turn.stance}</GlowChip>
          </span>
        </div>
        {!turn.done && turn.shown.length === 0 ? (
          <p className="flex items-center gap-2 text-[12px] italic text-slate-500">
            <ThinkingDots color={a.color} /> {turn.reasoning}…
          </p>
        ) : (
          <>
            <p className="text-[13.5px] leading-relaxed text-slate-300">
              {turn.shown}
              {!turn.done && <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-crew-300 align-middle" />}
            </p>
            {turn.done && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">confidence</span>
                  <span className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.07]">
                    <motion.span
                      className="block h-full rounded-full"
                      style={{ backgroundColor: a.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${turn.confidence}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </span>
                  <span className="text-[10px] font-bold text-slate-300">{turn.confidence}%</span>
                </div>
                <span className="ml-auto flex flex-wrap gap-1.5">
                  {turn.evidence.map((e) => (
                    <span key={e} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold text-slate-400">
                      {e}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ---------------- page ---------------- */

export function WarRoomPage() {
  const [session, setSession] = useState<SessionState>("idle");
  const [script, setScript] = useState<DeliberationScript | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [input, setInput] = useState("");
  const [followInput, setFollowInput] = useState("");

  const queueRef = useRef<ScriptTurn[]>([]);
  const verdictRef = useRef<Verdict | null>(null);
  const timerRef = useRef<number | null>(null);
  const idRef = useRef(0);
  const ackRef = useRef(0);
  const playingRef = useRef(true);
  const speedRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  playingRef.current = playing;
  speedRef.current = speed;

  const clearTimer = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };
  useEffect(() => clearTimer, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript, verdict]);

  const schedule = useCallback((fn: () => void, ms: number) => {
    clearTimer();
    const tick = () => {
      if (!playingRef.current) {
        timerRef.current = window.setTimeout(tick, 150);
        return;
      }
      fn();
    };
    timerRef.current = window.setTimeout(tick, ms / speedRef.current);
  }, []);

  /** Play the next queued turn: reasoning beat → typewriter stream → settle. */
  const playNext = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) {
      setVerdict(verdictRef.current);
      setSession("verdict");
      return;
    }
    const id = ++idRef.current;
    setTranscript((t) => [...t, { ...next, id, shown: "", done: false }]);

    schedule(() => {
      let pos = 0;
      const step = () => {
        if (!playingRef.current) {
          timerRef.current = window.setTimeout(step, 150);
          return;
        }
        pos = Math.min(pos + 3, next.text.length);
        const shown = next.text.slice(0, pos);
        const done = pos >= next.text.length;
        setTranscript((t) => t.map((x) => (x.id === id ? { ...x, shown, done } : x)));
        if (done) schedule(playNext, 900);
        else timerRef.current = window.setTimeout(step, 34 / speedRef.current);
      };
      step();
    }, 1500);
  }, [schedule]);

  const start = useCallback(
    (question: string) => {
      const s = resolveScript(question);
      clearTimer();
      setScript(s);
      setTranscript([]);
      setVerdict(null);
      verdictRef.current = s.verdict;
      queueRef.current = [...s.turns];
      setSession("running");
      setPlaying(true);
      schedule(playNext, 400);
    },
    [playNext, schedule],
  );

  const interject = useCallback(() => {
    const text = input.trim();
    if (!text || session !== "running") return;
    setInput("");
    setTranscript((t) => [...t, { id: ++idRef.current, user: true, text }]);
    const upcoming = queueRef.current[0];
    const speaker: CrewAgentKey = upcoming?.speaker ?? "coordinator";
    queueRef.current.unshift(buildAckTurn(text, speaker, ackRef.current++, upcoming?.phase ?? "challenge"));
  }, [input, session]);

  const followUp = useCallback(() => {
    const q = followInput.trim();
    if (!q) return;
    setFollowInput("");
    const { turns, verdict: v } = buildFollowUpTurns(q);
    setTranscript((t) => [...t, { id: ++idRef.current, user: true, text: q }]);
    setVerdict(null);
    verdictRef.current = v;
    queueRef.current = [...turns];
    setSession("running");
    setPlaying(true);
    schedule(playNext, 400);
  }, [followInput, playNext, schedule]);

  const restart = useCallback(() => {
    clearTimer();
    queueRef.current = [];
    setScript(null);
    setTranscript([]);
    setVerdict(null);
    setSession("idle");
  }, []);

  /* Latest stance per executive — drives matrix + consensus */
  const latest = useMemo(() => {
    const m: Partial<Record<CrewAgentKey, ScriptTurn>> = {};
    for (const t of transcript) if (!isUserTurn(t) && t.done) m[t.speaker] = t;
    return m;
  }, [transcript]);

  const streamingTurn = useMemo(() => {
    const last = transcript[transcript.length - 1];
    return last && !isUserTurn(last) && !last.done ? last : null;
  }, [transcript]);

  const evidenceCollected = useMemo(
    () => [...new Set(transcript.flatMap((t) => (isUserTurn(t) ? [] : t.done ? t.evidence : [])))],
    [transcript],
  );

  const currentPhase = streamingTurn?.phase ?? (transcript.length ? (transcript.filter((t) => !isUserTurn(t)).slice(-1)[0] as PlayedTurn | undefined)?.phase ?? null : null);

  return (
    <AppShell title="War Room" wide flush>
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 pb-28 sm:p-6 xl:flex-row xl:overflow-hidden xl:pb-6">
        {/* main stage */}
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <Panel deep className="scanline relative shrink-0 overflow-hidden px-5 pb-2 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-500">the strategy table</p>
                <h2 className="text-lg font-extrabold tracking-tight text-white">
                  {script ? script.question : "Five executives. One decision."}
                </h2>
              </div>
              {session !== "idle" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPlaying((p) => !p)}
                    aria-label={playing ? "Pause deliberation" : "Resume deliberation"}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:text-white"
                  >
                    {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setSpeed((s) => (s === 1 ? 2 : 1))}
                    aria-label="Toggle playback speed"
                    className={cn(
                      "flex h-9 items-center gap-1 rounded-xl border px-2.5 text-xs font-bold transition-colors",
                      speed === 2 ? "border-crew-500/40 bg-crew-500/15 text-crew-300" : "border-white/10 bg-white/[0.04] text-slate-300",
                    )}
                  >
                    <Gauge className="h-3.5 w-3.5" /> {speed}x
                  </button>
                  <button
                    onClick={restart}
                    aria-label="Restart session"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:text-white"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <TableStage speaker={streamingTurn?.speaker ?? null} respondingTo={streamingTurn?.respondingTo} />
          </Panel>

          {/* transcript / idle prompt */}
          {session === "idle" ? (
            <Panel className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
              <motion.span
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="flex h-14 w-14 items-center justify-center rounded-3xl border border-crew-500/25 bg-crew-500/10 text-crew-300 shadow-[0_0_40px_-12px_rgba(108,92,231,0.8)]"
              >
                <Swords className="h-6 w-6" />
              </motion.span>
              <div>
                <p className="text-lg font-extrabold tracking-tight text-white">Bring a decision to the table.</p>
                <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-slate-400">
                  Scout, Atlas, Ledger, Flux and Clause will debate it live — positions, challenges, evidence and a signed verdict.
                </p>
              </div>
              <div className="flex w-full max-w-xl items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-1.5 pl-5 pr-1.5 transition-colors focus-within:border-crew-500/40">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && input.trim() && start(input)}
                  placeholder="Should we…"
                  aria-label="Decision question"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
                <button
                  onClick={() => input.trim() && start(input)}
                  className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-black shadow-[0_0_36px_-10px_rgba(138,123,239,0.9)] transition-transform hover:-translate-y-0.5"
                >
                  <Zap className="h-4 w-4" /> Convene
                </button>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => start(q)}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:-translate-y-0.5 hover:border-crew-500/40 hover:text-white"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </Panel>
          ) : (
            <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
              <div ref={scrollRef} role="log" aria-label="Deliberation transcript" className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                {transcript.map((t) =>
                  isUserTurn(t) ? (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-crew-500/25 px-4 py-3 text-[13.5px] leading-relaxed text-white">
                        {t.text}
                      </div>
                    </motion.div>
                  ) : (
                    <TurnBubble key={t.id} turn={t} />
                  ),
                )}

                <AnimatePresence>
                  {verdict && (
                    <motion.div
                      initial={{ opacity: 0, y: 26, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="glass-deep conic-ring rounded-3xl p-6"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-500">signed verdict</p>
                        <GlowChip color={verdict.confidence >= 70 ? "#059669" : "#D97706"}>confidence {verdict.confidence}%</GlowChip>
                      </div>
                      <p className="mt-3 text-[15px] font-semibold leading-relaxed text-white">{verdict.recommendation}</p>
                      {verdict.dissent && (
                        <p className="mt-3 rounded-xl border border-[#EC4899]/20 bg-[#EC4899]/[0.07] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-slate-300">
                          <span className="font-bold" style={{ color: meta(verdict.dissent.agent).color }}>
                            {meta(verdict.dissent.agent).persona} dissents:
                          </span>{" "}
                          {verdict.dissent.note}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3.5">
                        <div className="flex -space-x-1.5">
                          {AGENTS.map((a) => (
                            <span
                              key={a.key}
                              title={`${a.persona} signed`}
                              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0a0c14] text-[9px] font-extrabold"
                              style={{ backgroundColor: `${a.color}30`, color: a.color }}
                            >
                              {a.persona[0]}
                            </span>
                          ))}
                        </div>
                        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">crewmind war room</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* interject / follow-up */}
              <div className="border-t border-white/[0.07] p-3">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-1.5 pl-4 pr-1.5 transition-colors focus-within:border-crew-500/40">
                  <input
                    value={session === "verdict" ? followInput : input}
                    onChange={(e) => (session === "verdict" ? setFollowInput(e.target.value) : setInput(e.target.value))}
                    onKeyDown={(e) => e.key === "Enter" && (session === "verdict" ? followUp() : interject())}
                    placeholder={session === "verdict" ? "Ask a follow-up — the table reconvenes…" : "Interject — the table will take your point…"}
                    aria-label={session === "verdict" ? "Follow-up question" : "Interjection"}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                  <button
                    onClick={session === "verdict" ? followUp : interject}
                    aria-label="Send"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-crew-500 text-white shadow-glow transition-transform hover:scale-105 active:scale-95"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Panel>
          )}
        </div>

        {/* right rail */}
        <div className="flex w-full shrink-0 flex-col gap-4 xl:w-80 xl:overflow-y-auto">
          <Panel delay={0.1} className="p-5">
            <BlockTitle label="session" title="Deliberation phase" />
            <PhaseRail phase={currentPhase} done={session === "verdict"} />
          </Panel>
          <Panel delay={0.16} className="p-5">
            <BlockTitle label="alignment" title="Table consensus" />
            <ConsensusGauge latest={latest} />
          </Panel>
          <Panel delay={0.22} className="p-5">
            <BlockTitle label="who agrees with whom" title="Agreement matrix" />
            <AgreementMatrix latest={latest} />
          </Panel>
          <Panel delay={0.28} className="p-5">
            <BlockTitle label="cited this session" title="Evidence" />
            {evidenceCollected.length === 0 ? (
              <p className="py-3 text-center text-xs text-slate-500">Evidence lands here as executives cite it.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {evidenceCollected.map((e) => (
                  <span key={e} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-slate-300">
                    {e}
                  </span>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
