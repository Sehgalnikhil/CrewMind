import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeDollarSign,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  FileText,
  Lightbulb,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import clsx from "clsx";

import { listDocuments } from "#/api/documents";
import { listReports } from "#/api/reports";
import { AppShell } from "#/components/layout/AppShell";
import { EmptyState, GlowChip } from "#/components/os/ui";
import { PageHero, timeAgo } from "#/components/system/shared";
import { useUiStore } from "#/stores/uiStore";
import { AGENTS, type AgentKey } from "#/types";

type NotificationKind = "insight" | "system";

interface FeedItem {
  id: string;
  kind: NotificationKind;
  icon: "report" | "document" | "insight" | "billing" | "member" | "risk";
  color: string;
  title: string;
  body: string;
  at: string;
  to: string;
  agentKey?: AgentKey;
}

/* Deterministic anchor so simulated timestamps are stable for the session. */
const NOW = Date.now();
const min = (m: number) => new Date(NOW - m * 60_000).toISOString();

function agent(key: AgentKey) {
  return AGENTS.find((a) => a.key === key)!;
}

/* ~10 simulated system events, offsets fixed relative to now. */
const SIMULATED: FeedItem[] = [
  {
    id: "sim-insight-strategy",
    kind: "insight",
    icon: "insight",
    color: agent("strategy").color,
    title: "Atlas surfaced a strategic insight",
    body: "EU expansion window is widening — two competitors just retreated from the region.",
    at: min(14),
    to: "/agents/strategy",
    agentKey: "strategy",
  },
  {
    id: "sim-risk-legal",
    kind: "insight",
    icon: "risk",
    color: agent("legal").color,
    title: "Clause flagged a compliance risk",
    body: "New data-residency rules take effect in 60 days — 3 contracts need addenda.",
    at: min(52),
    to: "/agents/legal",
    agentKey: "legal",
  },
  {
    id: "sim-insight-finance",
    kind: "insight",
    icon: "insight",
    color: agent("finance").color,
    title: "Ledger updated the runway model",
    body: "Runway extended to 19 months after the vendor renegotiation landed.",
    at: min(3 * 60 + 5),
    to: "/agents/finance",
    agentKey: "finance",
  },
  {
    id: "sim-member-joined",
    kind: "system",
    icon: "member",
    color: "#059669",
    title: "New member joined",
    body: "Priya Nair accepted the invite and joined as Admin.",
    at: min(5 * 60 + 20),
    to: "/admin",
  },
  {
    id: "sim-insight-research",
    kind: "insight",
    icon: "insight",
    color: agent("research").color,
    title: "Scout published a market brief",
    body: "47 fresh industry signals summarized — two pricing moves worth a response.",
    at: min(8 * 60 + 40),
    to: "/agents/research",
    agentKey: "research",
  },
  {
    id: "sim-billing-invoice",
    kind: "system",
    icon: "billing",
    color: "#D97706",
    title: "Invoice paid",
    body: "Boardroom plan · ₹24,900 settled via card ending 4421.",
    at: min(22 * 60),
    to: "/billing",
  },
  {
    id: "sim-risk-operations",
    kind: "insight",
    icon: "risk",
    color: agent("operations").color,
    title: "Flux raised an operations alert",
    body: "Fulfilment cycle time regressed 11% week-over-week — bottleneck traced to QA.",
    at: min(27 * 60),
    to: "/agents/operations",
    agentKey: "operations",
  },
  {
    id: "sim-insight-operations",
    kind: "insight",
    icon: "insight",
    color: agent("operations").color,
    title: "Flux finished the capacity stress-test",
    body: "Q4 plan holds up to 1.4× projected demand with current headcount.",
    at: min(31 * 60),
    to: "/agents/operations",
    agentKey: "operations",
  },
  {
    id: "sim-billing-seats",
    kind: "system",
    icon: "billing",
    color: "#D97706",
    title: "Seat usage approaching limit",
    body: "9 of 10 seats in use — add seats before inviting more members.",
    at: min(49 * 60),
    to: "/billing",
  },
  {
    id: "sim-member-invited",
    kind: "system",
    icon: "member",
    color: "#059669",
    title: "Invite sent",
    body: "dev.mehta@northwind.co was invited as Member.",
    at: min(3 * 24 * 60 + 30),
    to: "/admin",
  },
  {
    id: "sim-risk-legal-2",
    kind: "insight",
    icon: "risk",
    color: agent("legal").color,
    title: "Clause is watching a jurisdiction change",
    body: "Draft legislation in one of your 3 watched jurisdictions moved to committee.",
    at: min(4 * 24 * 60 + 90),
    to: "/agents/legal",
    agentKey: "legal",
  },
];

const ICONS = {
  report: Sparkles,
  document: FileText,
  insight: Lightbulb,
  billing: BadgeDollarSign,
  member: UserPlus,
  risk: AlertTriangle,
} as const;

type Tab = "all" | "unread" | "insights" | "system";
const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "insights", label: "Insights" },
  { key: "system", label: "System" },
];

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(d, today)) return "Today";
  if (same(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function NotificationRow({
  item,
  unread,
  index,
  onRead,
}: {
  item: FeedItem;
  unread: boolean;
  index: number;
  onRead: () => void;
}) {
  const navigate = useNavigate();
  const Icon = ICONS[item.icon];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.5), ease: [0.22, 1, 0.36, 1] }}
      className={clsx(
        "group relative flex items-start gap-4 rounded-2xl border px-4 py-3.5 transition-colors",
        unread
          ? "border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.08]"
          : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]",
      )}
    >
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${item.color}1e`, color: item.color, boxShadow: `0 0 20px -10px ${item.color}` }}
      >
        <Icon className="h-4 w-4" />
      </span>

      <button
        type="button"
        onClick={() => {
          onRead();
          navigate(item.to);
        }}
        className="min-w-0 flex-1 text-left"
        aria-label={`Open: ${item.title}`}
      >
        <span className="flex items-center gap-2">
          <span className={clsx("truncate text-[13px] font-bold", unread ? "text-white" : "text-slate-300")}>
            {item.title}
          </span>
          {item.agentKey && (
            <span
              className="hidden shrink-0 rounded-full px-2 py-px font-mono text-[8px] uppercase tracking-[0.2em] sm:inline"
              style={{ backgroundColor: `${item.color}18`, color: item.color }}
            >
              {agent(item.agentKey).persona}
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-xs leading-relaxed text-slate-400">{item.body}</span>
        <span className="mt-1 block font-mono text-[9px] uppercase tracking-wider text-slate-600">{timeAgo(item.at)}</span>
      </button>

      {/* hover actions */}
      <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={() => {
            onRead();
            navigate(item.to);
          }}
          aria-label={`Open ${item.title}`}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-300 transition-all hover:border-white/25 hover:text-white"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
        {unread && (
          <button
            type="button"
            onClick={onRead}
            aria-label={`Mark ${item.title} as read`}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-300 transition-all hover:border-emerald-500/40 hover:text-emerald-400"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* unread glowing dot */}
      {unread && (
        <span
          aria-label="Unread"
          className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-crew-400 shadow-[0_0_10px_2px_rgba(138,123,239,0.7)] group-hover:opacity-0"
        />
      )}
    </motion.div>
  );
}

export function NotificationsPage() {
  const { data: reports } = useQuery({ queryKey: ["reports"], queryFn: listReports });
  const { data: documents } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const readIds = useUiStore((s) => s.readNotificationIds);
  const markRead = useUiStore((s) => s.markNotificationsRead);

  const [tab, setTab] = useState<Tab>("all");
  const [agentFilter, setAgentFilter] = useState<AgentKey | null>(null);

  const items = useMemo<FeedItem[]>(() => {
    const fromReports: FeedItem[] = (reports ?? []).slice(0, 6).map((r) => ({
      id: `r-${r.id}`,
      kind: "insight",
      icon: "report",
      color: "#8A7BEF",
      title: "Executive report ready",
      body: `Health score ${r.business_health_score} · ${r.title}`,
      at: r.created_at,
      to: "/reports",
    }));
    const fromDocuments: FeedItem[] = (documents ?? []).slice(0, 8).map((d) => ({
      id: `d-${d.id}`,
      kind: "system",
      icon: "document",
      color: "#0891CF",
      title: d.status === "indexed" ? "Document indexed" : d.status === "failed" ? "Document failed" : "Document processing",
      body: d.filename,
      at: d.created_at,
      to: "/documents",
    }));
    return [...fromReports, ...fromDocuments, ...SIMULATED].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [reports, documents]);

  const unreadCount = items.filter((i) => !readIds.includes(i.id)).length;

  const filtered = items.filter((i) => {
    if (tab === "unread" && readIds.includes(i.id)) return false;
    if (tab === "insights" && i.kind !== "insight") return false;
    if (tab === "system" && i.kind !== "system") return false;
    if (agentFilter && i.agentKey !== agentFilter) return false;
    return true;
  });

  /* Group by day, preserving order */
  const groups = useMemo(() => {
    const out: { label: string; items: FeedItem[] }[] = [];
    for (const item of filtered) {
      const label = dayLabel(item.at);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(item);
      else out.push({ label, items: [item] });
    }
    return out;
  }, [filtered]);

  return (
    <AppShell title="Notifications">
      <div className="mx-auto max-w-4xl">
        <PageHero
          label="system · inbox"
          title="Everything that needs"
          accent="your eyes."
          body="Crew insights, document events and workspace activity — collected in one stream."
          action={
            <button
              type="button"
              onClick={() => markRead(items.map((i) => i.id))}
              disabled={unreadCount === 0}
              className="glass flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:border-white/25 disabled:pointer-events-none disabled:opacity-40"
            >
              <CheckCheck className="h-4 w-4 text-emerald-400" /> Mark all read
            </button>
          }
        />

        {/* filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 flex flex-wrap items-center gap-2"
        >
          <div className="glass flex rounded-2xl p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={clsx(
                  "relative rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors",
                  tab === t.key ? "text-white" : "text-slate-500 hover:text-slate-300",
                )}
              >
                {tab === t.key && (
                  <motion.span
                    layoutId="notif-tab"
                    className="absolute inset-0 rounded-xl border border-white/12 bg-white/[0.08]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {t.label}
                  {t.key === "unread" && unreadCount > 0 && (
                    <span className="rounded-full bg-crew-500/30 px-1.5 font-mono text-[9px] text-crew-200">{unreadCount}</span>
                  )}
                </span>
              </button>
            ))}
          </div>

          <span className="mx-1 hidden h-5 w-px bg-white/[0.08] sm:block" aria-hidden />

          {AGENTS.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setAgentFilter(agentFilter === a.key ? null : a.key)}
              aria-pressed={agentFilter === a.key}
              aria-label={`Filter by ${a.persona}`}
              className="rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all hover:-translate-y-px"
              style={
                agentFilter === a.key
                  ? { borderColor: `${a.color}88`, color: a.color, backgroundColor: `${a.color}1c`, boxShadow: `0 0 18px -8px ${a.color}` }
                  : { borderColor: "rgba(255,255,255,0.08)", color: "#8d93ad", backgroundColor: "rgba(255,255,255,0.03)" }
              }
            >
              {a.persona}
            </button>
          ))}
        </motion.div>

        {/* stream */}
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-3xl p-4 sm:p-5"
        >
          {groups.length === 0 ? (
            tab === "unread" ? (
              <EmptyState
                icon={<BellOff className="h-6 w-6" />}
                title="Inbox zero"
                body="Nothing unread. Your crew will light this up the moment something needs a decision."
              />
            ) : (
              <EmptyState
                icon={<Bell className="h-6 w-6" />}
                title="Quiet for now"
                body="No activity matches this filter yet. Run an analysis or upload documents and updates will stream in here."
                action={
                  <Link
                    to="/agents"
                    className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-black shadow-[0_0_36px_-10px_rgba(138,123,239,0.9)] transition-transform hover:-translate-y-0.5"
                  >
                    Run an analysis
                  </Link>
                }
              />
            )
          ) : (
            <div className="flex flex-col gap-5">
              <AnimatePresence mode="popLayout">
                {groups.map((g, gi) => (
                  <motion.section
                    layout
                    key={g.label}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: gi * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="mb-2.5 flex items-center gap-3 px-1">
                      <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-500">{g.label}</p>
                      <span className="h-px flex-1 bg-white/[0.06]" aria-hidden />
                      <GlowChip color="#8A7BEF" className="!py-0">{g.items.length}</GlowChip>
                    </div>
                    <div className="flex flex-col gap-2">
                      {g.items.map((item, i) => (
                        <NotificationRow
                          key={item.id}
                          item={item}
                          index={i}
                          unread={!readIds.includes(item.id)}
                          onRead={() => markRead([item.id])}
                        />
                      ))}
                    </div>
                  </motion.section>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </AppShell>
  );
}
