import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Link2, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { listDocuments } from "#/api/documents";
import { listReports } from "#/api/reports";
import { AppShell } from "#/components/layout/AppShell";
import { BlockTitle, EmptyState, GlowChip, Panel } from "#/components/os/ui";
import { PageHero } from "#/components/system/shared";
import {
  MEMORY_KIND_META,
  SIM_MEMORIES,
  agentMeta,
  hash01,
  memoriesFromDocuments,
  memoriesFromReports,
  timeAgo,
} from "#/components/intel/data";
import type { MemoryKind, MemoryRecord } from "#/components/intel/data";
import { cn } from "#/lib/utils";

const KINDS = Object.keys(MEMORY_KIND_META) as MemoryKind[];
const RANGES = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "q", label: "Quarter", days: 92 },
  { key: "all", label: "All time", days: Infinity },
] as const;

function highlight(text: string, q: string) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-crew-500/30 px-0.5 text-crew-200">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function MemoryCard({ m, query, onOpen, delay }: { m: MemoryRecord; query: string; onOpen: () => void; delay: number }) {
  const km = MEMORY_KIND_META[m.kind];
  const a = agentMeta(m.agent);
  const relevance = query ? Math.round(62 + hash01(m.id + query) * 36) : null;
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      onClick={onOpen}
      className="glass holo-sheen w-full rounded-3xl p-5 text-left transition-transform hover:-translate-y-0.5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <GlowChip color={km.color}>{km.label}</GlowChip>
        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">{timeAgo(m.createdAt)}</span>
        {relevance !== null && (
          <span className="ml-auto text-[10px] font-bold text-crew-300">{relevance}% match</span>
        )}
      </div>
      <p className="mt-2.5 text-sm font-bold text-white">{highlight(m.title, query)}</p>
      <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-slate-400">{highlight(m.snippet, query)}</p>
      <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-2.5">
        <span
          className="flex h-5 w-5 items-center justify-center rounded-md text-[8px] font-extrabold"
          style={{ backgroundColor: `${a.color}22`, color: a.color }}
        >
          {a.persona[0]}
        </span>
        <span className="text-[10px] font-semibold text-slate-500">{a.persona}</span>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-500">
          <Link2 className="h-3 w-3" /> {m.links.length} linked
        </span>
      </div>
    </motion.button>
  );
}

export function MemoryPage() {
  const { data: documents } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const { data: reports } = useQuery({ queryKey: ["reports"], queryFn: listReports });
  const [query, setQuery] = useState("");
  const [kinds, setKinds] = useState<Set<MemoryKind>>(new Set());
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const all = useMemo<MemoryRecord[]>(
    () =>
      [...SIM_MEMORIES, ...memoriesFromDocuments(documents ?? []), ...memoriesFromReports(reports ?? [])].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      ),
    [documents, reports],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const maxDays = RANGES.find((r) => r.key === range)!.days;
    return all.filter((m) => {
      if (kinds.size && !kinds.has(m.kind)) return false;
      if ((Date.now() - +new Date(m.createdAt)) / 86400000 > maxDays) return false;
      if (q && !`${m.title} ${m.snippet}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, query, kinds, range]);

  const open = openId ? all.find((m) => m.id === openId) : null;
  const mostConnected = useMemo(() => [...all].sort((a, b) => b.links.length - a.links.length).slice(0, 3), [all]);

  return (
    <AppShell title="Executive Memory" wide>
      <PageHero
        label="organizational memory"
        title="Everything your company"
        accent="remembers."
        body="Documents, chats, reports, decisions, meetings and predictions — one searchable memory with a chain of evidence behind every item."
      />

      {/* spotlight search */}
      <Panel deep className="conic-ring mb-5 p-2">
        <div className="flex items-center gap-3 px-4 py-2">
          <Search className="h-5 w-5 shrink-0 text-crew-300" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search organizational memory…"
            aria-label="Search memory"
            className="w-full bg-transparent text-base text-white outline-none placeholder:text-slate-500"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="text-slate-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </Panel>

      {/* filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {KINDS.map((k) => {
          const on = kinds.has(k);
          const km = MEMORY_KIND_META[k];
          return (
            <button
              key={k}
              onClick={() =>
                setKinds((s) => {
                  const n = new Set(s);
                  if (n.has(k)) n.delete(k);
                  else n.add(k);
                  return n;
                })
              }
              aria-pressed={on}
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-bold transition-all",
                on ? "text-white" : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200",
              )}
              style={on ? { borderColor: `${km.color}66`, backgroundColor: `${km.color}1f`, color: km.color } : undefined}
            >
              {km.label}
            </button>
          );
        })}
        <span className="mx-1 h-5 w-px bg-white/10" />
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            aria-pressed={range === r.key}
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-bold transition-all",
              range === r.key
                ? "border-crew-500/50 bg-crew-500/15 text-crew-300"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200",
            )}
          >
            {r.label}
          </button>
        ))}
        <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-slate-500">
          {results.length} memories
        </span>
      </div>

      {/* memory surface stats (empty query) */}
      {!query && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total memories", value: all.length, hint: "and growing with every analysis" },
            { label: "Formed this week", value: all.filter((m) => (Date.now() - +new Date(m.createdAt)) / 86400000 <= 7).length, hint: "fresh organizational context" },
            { label: "Most connected", value: mostConnected[0]?.links.length ?? 0, hint: mostConnected[0]?.title ?? "—" },
          ].map((s, i) => (
            <Panel key={s.label} delay={0.08 + i * 0.06} className="p-5">
              <p className="text-[11px] font-semibold text-slate-400">{s.label}</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-white">{s.value}</p>
              <p className="mt-1 truncate text-xs text-slate-500">{s.hint}</p>
            </Panel>
          ))}
        </div>
      )}

      {results.length === 0 ? (
        <Panel className="p-4">
          <EmptyState
            icon={<BrainCircuit className="h-6 w-6" />}
            title="Nothing in memory matches"
            body="Try a broader term, clear a filter, or upload documents — everything the crew reads becomes memory."
          />
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.slice(0, 24).map((m, i) => (
            <MemoryCard key={m.id} m={m} query={query.trim()} onOpen={() => setOpenId(m.id)} delay={Math.min(i * 0.05, 0.4)} />
          ))}
        </div>
      )}

      {/* detail drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenId(null)}
              className="fixed inset-0 z-[70] bg-[#020308]/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.45 }}
              className="glass-deep fixed inset-y-0 right-0 z-[75] flex w-[min(94vw,440px)] flex-col overflow-y-auto p-6"
              role="dialog"
              aria-label={open.title}
            >
              <div className="flex items-start justify-between gap-3">
                <GlowChip color={MEMORY_KIND_META[open.kind].color}>{MEMORY_KIND_META[open.kind].label}</GlowChip>
                <button onClick={() => setOpenId(null)} aria-label="Close" className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <h3 className="mt-3 text-xl font-extrabold tracking-tight text-white">{open.title}</h3>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                {agentMeta(open.agent).persona} · {timeAgo(open.createdAt)}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">{open.snippet}</p>

              <div className="mt-6">
                <BlockTitle label="chain of evidence" title="Linked memories" />
                {open.links.length === 0 ? (
                  <p className="text-xs text-slate-500">No links yet — connections form as the crew reasons.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {open.links
                      .map((id) => all.find((m) => m.id === id))
                      .filter(Boolean)
                      .map((lm) => (
                        <button
                          key={lm!.id}
                          onClick={() => setOpenId(lm!.id)}
                          className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
                        >
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: MEMORY_KIND_META[lm!.kind].color }} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-bold text-white">{lm!.title}</span>
                            <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-600">
                              {MEMORY_KIND_META[lm!.kind].label} · {timeAgo(lm!.createdAt)}
                            </span>
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
