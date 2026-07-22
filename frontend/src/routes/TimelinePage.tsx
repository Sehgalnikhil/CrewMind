import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { listDocuments } from "#/api/documents";
import { listReports } from "#/api/reports";
import { AppShell } from "#/components/layout/AppShell";
import { GlowChip, Panel } from "#/components/os/ui";
import { PageHero } from "#/components/system/shared";
import { EVENT_KIND_META, SIM_EVENTS, agentMeta, shortDate, timeAgo } from "#/components/intel/data";
import type { EventKind, TimelineEvent } from "#/components/intel/data";
import { AGENTS } from "#/types";
import type { AgentKey } from "#/types";
import { cn } from "#/lib/utils";

const KINDS = Object.keys(EVENT_KIND_META) as EventKind[];

function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function TimelinePage() {
  const { data: documents } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const { data: reports } = useQuery({ queryKey: ["reports"], queryFn: listReports });
  const [kinds, setKinds] = useState<Set<EventKind>>(new Set());
  const [agent, setAgent] = useState<AgentKey | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const events = useMemo<TimelineEvent[]>(() => {
    const fromReports: TimelineEvent[] = (reports ?? []).map((r) => ({
      id: `rep-${r.id}`,
      kind: "report",
      title: r.title || "Executive report",
      summary: r.summary,
      createdAt: r.created_at,
      agents: ["coordinator"],
      link: "/reports",
    }));
    const fromDocs: TimelineEvent[] = (documents ?? []).map((d) => ({
      id: `doc-${d.id}`,
      kind: "document",
      title: d.filename,
      summary: `${d.file_type.toUpperCase()} indexed into organizational memory · ${d.chunk_count} chunks.`,
      createdAt: d.created_at,
      agents: ["research"],
      link: "/documents",
    }));
    return [...SIM_EVENTS, ...fromReports, ...fromDocs].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [documents, reports]);

  const filtered = useMemo(
    () =>
      events.filter(
        (e) =>
          (!kinds.size || kinds.has(e.kind)) &&
          (!agent || e.agents.includes(agent)),
      ),
    [events, kinds, agent],
  );

  /* density strip: events per week over the last 12 weeks */
  const weeks = useMemo(() => {
    const buckets = Array.from({ length: 12 }, () => 0);
    for (const e of filtered) {
      const w = Math.floor((Date.now() - +new Date(e.createdAt)) / (7 * 86400000));
      if (w >= 0 && w < 12) buckets[11 - w]++;
    }
    return buckets;
  }, [filtered]);
  const maxWeek = Math.max(...weeks, 1);

  const groups = useMemo(() => {
    const g = new Map<string, TimelineEvent[]>();
    for (const e of filtered) {
      const k = monthLabel(e.createdAt);
      g.set(k, [...(g.get(k) ?? []), e]);
    }
    return [...g.entries()];
  }, [filtered]);

  return (
    <AppShell title="Timeline" wide>
      <PageHero
        label="organizational history"
        title="Every decision on"
        accent="one axis."
        body="Reports, decisions, documents, meetings and alerts — the life of the company, in order."
      />

      {/* density strip */}
      <Panel delay={0.05} className="mb-5 p-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-500">activity · last 12 weeks</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{filtered.length} events</p>
        </div>
        <div className="flex h-14 items-end gap-1.5" aria-hidden>
          {weeks.map((v, i) => (
            <motion.button
              key={i}
              onClick={() => listRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="flex-1 rounded-t-md bg-gradient-to-t from-crew-500/60 to-[#67c7f5]/60 transition-opacity hover:opacity-100"
              style={{ opacity: v ? 0.85 : 0.25 }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((v / maxWeek) * 100, 6)}%` }}
              transition={{ duration: 0.7, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
        </div>
      </Panel>

      {/* filters */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {KINDS.map((k) => {
          const on = kinds.has(k);
          const km = EVENT_KIND_META[k];
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
                !on && "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200",
              )}
              style={on ? { borderColor: `${km.color}66`, backgroundColor: `${km.color}1f`, color: km.color } : undefined}
            >
              {km.label}
            </button>
          );
        })}
        <span className="mx-1 h-5 w-px bg-white/10" />
        {AGENTS.map((a) => (
          <button
            key={a.key}
            onClick={() => setAgent(agent === a.key ? null : a.key)}
            aria-pressed={agent === a.key}
            aria-label={`Filter by ${a.persona}`}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-extrabold transition-all",
              agent === a.key ? "scale-110" : "opacity-60 hover:opacity-100",
            )}
            style={{ backgroundColor: `${a.color}22`, borderColor: agent === a.key ? a.color : `${a.color}44`, color: a.color }}
          >
            {a.persona[0]}
          </button>
        ))}
      </div>

      {/* the spine */}
      <div ref={listRef} className="relative mx-auto max-w-3xl">
        <span aria-hidden className="absolute inset-y-0 left-4 w-px bg-gradient-to-b from-crew-500/50 via-white/10 to-transparent sm:left-1/2" />
        {groups.map(([month, items]) => (
          <div key={month}>
            <div className="sticky top-2 z-10 mb-6 flex justify-start sm:justify-center">
              <span className="glass rounded-full px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-300">
                {month}
              </span>
            </div>
            {items.map((e, i) => {
              const km = EVENT_KIND_META[e.kind];
              const right = i % 2 === 0;
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className={cn("relative mb-6 pl-12 sm:w-1/2 sm:pl-0", right ? "sm:ml-auto sm:pl-10" : "sm:pr-10 sm:text-right")}
                >
                  <span
                    aria-hidden
                    className={cn("absolute top-5 left-[13px] h-2 w-2 rounded-full status-ping", right ? "sm:left-[-4px]" : "sm:left-auto sm:right-[-4px]")}
                    style={{ backgroundColor: km.color, color: km.color }}
                  />
                  <div className="glass holo-sheen rounded-3xl p-5 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <GlowChip color={km.color}>{km.label}</GlowChip>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
                        {shortDate(e.createdAt)} · {timeAgo(e.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-white">{e.title}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-slate-400">{e.summary}</p>
                    <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-2.5">
                      <span className="flex -space-x-1">
                        {e.agents.map((k) => {
                          const a = agentMeta(k);
                          return (
                            <span
                              key={k}
                              title={a.persona}
                              className="flex h-5 w-5 items-center justify-center rounded-full border border-[#0a0c14] text-[8px] font-extrabold"
                              style={{ backgroundColor: `${a.color}30`, color: a.color }}
                            >
                              {a.persona[0]}
                            </span>
                          );
                        })}
                      </span>
                      <Link to={e.link} className="ml-auto flex items-center gap-1 text-[11px] font-bold text-crew-300 hover:text-crew-200">
                        Open <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-slate-500">No events match these filters.</p>
        )}
      </div>
    </AppShell>
  );
}
