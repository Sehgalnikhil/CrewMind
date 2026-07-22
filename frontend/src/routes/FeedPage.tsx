import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Sparkles, Star, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { AppShell } from "#/components/layout/AppShell";
import { GlowChip, Panel, ThinkingDots } from "#/components/os/ui";
import { PageHero } from "#/components/system/shared";
import { FEED_KIND_META, FEED_SCRIPT, agentMeta } from "#/components/intel/data";
import type { FeedItem, FeedKind } from "#/components/intel/data";
import { AGENTS } from "#/types";
import type { AgentKey } from "#/types";
import { cn } from "#/lib/utils";

const KINDS = Object.keys(FEED_KIND_META) as FeedKind[];
const INITIAL_COUNT = 8;

interface LiveItem extends FeedItem {
  at: number;
}

export function FeedPage() {
  const [items, setItems] = useState<LiveItem[]>(() =>
    FEED_SCRIPT.slice(0, INITIAL_COUNT).map((f, i) => ({ ...f, at: Date.now() - (INITIAL_COUNT - i) * 8 * 60000 })),
  );
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [agentFilter, setAgentFilter] = useState<AgentKey | null>(null);
  const [kindFilter, setKindFilter] = useState<FeedKind | null>(null);
  const cursorRef = useRef(INITIAL_COUNT);
  const pausedRef = useRef(false);

  /* new insights arrive while the page is open */
  useEffect(() => {
    const t = setInterval(() => {
      if (pausedRef.current) return;
      setItems((prev) => {
        const next = FEED_SCRIPT[cursorRef.current % FEED_SCRIPT.length];
        cursorRef.current++;
        return [{ ...next, id: `${next.id}-${cursorRef.current}`, at: Date.now() }, ...prev].slice(0, 30);
      });
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const visible = useMemo(
    () =>
      items.filter(
        (i) => !dismissed.has(i.id) && (!agentFilter || i.agent === agentFilter) && (!kindFilter || i.kind === kindFilter),
      ),
    [items, dismissed, agentFilter, kindFilter],
  );

  return (
    <AppShell title="Executive Feed">
      <PageHero
        label="live thought stream"
        title="What the crew is"
        accent="thinking."
        body="Observations, warnings, opportunities and predictions from your five executives — as they form."
      />

      {/* catch me up */}
      <Panel deep delay={0.05} className="scanline mb-6 flex items-start gap-4 overflow-hidden p-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-crew-500/15 text-crew-300">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-500">catch me up · last 24h</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">
            The EU pilot stayed on track while Northwind's price cut opened a poaching window on their power users. Ledger flagged
            support-cost growth as the one trend that could dent margin by October — the cloud renegotiation is your counterweight.
          </p>
        </div>
      </Panel>

      {/* filter rail */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {AGENTS.map((a) => (
          <button
            key={a.key}
            onClick={() => setAgentFilter(agentFilter === a.key ? null : a.key)}
            aria-pressed={agentFilter === a.key}
            aria-label={`Filter by ${a.persona}`}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl border text-[11px] font-extrabold transition-all",
              agentFilter === a.key ? "scale-110" : "opacity-60 hover:opacity-100",
            )}
            style={{ backgroundColor: `${a.color}22`, borderColor: agentFilter === a.key ? a.color : `${a.color}44`, color: a.color }}
          >
            {a.persona[0]}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-white/10" />
        {KINDS.map((k) => {
          const on = kindFilter === k;
          const km = FEED_KIND_META[k];
          return (
            <button
              key={k}
              onClick={() => setKindFilter(on ? null : k)}
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
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-emerald-400">
          <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400 status-ping" /> live
        </span>
      </div>

      {/* the stream */}
      <div
        className="mx-auto flex max-w-2xl flex-col gap-3"
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
        role="feed"
        aria-label="Executive insight feed"
      >
        <AnimatePresence initial={false}>
          {visible.map((item) => {
            const a = agentMeta(item.agent);
            const km = FEED_KIND_META[item.kind];
            const fresh = Date.now() - item.at < 9000;
            return (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, y: -22, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                className="glass relative overflow-hidden rounded-3xl p-5"
                style={{ borderLeft: `2px solid ${a.color}66` }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-[11px] font-extrabold"
                    style={{ backgroundColor: `${a.color}22`, color: a.color }}
                  >
                    {a.persona[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white">{a.persona}</p>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-slate-600">{a.title}</p>
                  </div>
                  <GlowChip color={km.color}>{km.label}</GlowChip>
                  {fresh && <ThinkingDots color={a.color} />}
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-slate-300">{item.body}</p>
                <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-2.5">
                  {item.confidence !== undefined && (
                    <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
                      confidence <span className="font-bold text-slate-300">{item.confidence}%</span>
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() =>
                        setStarred((s) => {
                          const n = new Set(s);
                          if (n.has(item.id)) n.delete(item.id);
                          else n.add(item.id);
                          return n;
                        })
                      }
                      aria-label={starred.has(item.id) ? "Remove bookmark" : "Bookmark insight"}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                        starred.has(item.id) ? "text-amber-300" : "text-slate-500 hover:text-slate-300",
                      )}
                    >
                      <Star className={cn("h-3.5 w-3.5", starred.has(item.id) && "fill-current")} />
                    </button>
                    <Link
                      to="/chat"
                      aria-label="Discuss in Boardroom"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-crew-300"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => setDismissed((s) => new Set(s).add(item.id))}
                      aria-label="Dismiss insight"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
        {visible.length === 0 && (
          <p className="py-16 text-center text-sm text-slate-500">Nothing matches — the crew will keep posting.</p>
        )}
      </div>
    </AppShell>
  );
}
