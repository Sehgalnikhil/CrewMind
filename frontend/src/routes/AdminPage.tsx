import { motion } from "framer-motion";
import { Check, Lock, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "#/components/layout/AppShell";
import { BlockTitle, GlowChip, Panel } from "#/components/os/ui";
import { PageHero, timeAgo } from "#/components/system/shared";
import { cn } from "#/lib/utils";

type Role = "Owner" | "Admin" | "Member" | "Viewer";

const INITIAL_MEMBERS: { name: string; email: string; role: Role; twoFa: boolean; lastActive: number }[] = [
  { name: "Priya Raman", email: "priya@yourco.com", role: "Owner", twoFa: true, lastActive: 0.1 },
  { name: "Dev Kapoor", email: "dev@yourco.com", role: "Admin", twoFa: true, lastActive: 0.4 },
  { name: "Sana Iyer", email: "sana@yourco.com", role: "Admin", twoFa: true, lastActive: 2 },
  { name: "Marco Silva", email: "marco@yourco.com", role: "Member", twoFa: false, lastActive: 5 },
  { name: "Lena Fischer", email: "lena@yourco.com", role: "Member", twoFa: true, lastActive: 8 },
  { name: "Ade Okafor", email: "ade@yourco.com", role: "Member", twoFa: true, lastActive: 26 },
  { name: "Noor Haddad", email: "noor@yourco.com", role: "Member", twoFa: false, lastActive: 30 },
  { name: "Tomás Vega", email: "tomas@yourco.com", role: "Viewer", twoFa: true, lastActive: 50 },
  { name: "Yuki Tanaka", email: "yuki@yourco.com", role: "Viewer", twoFa: false, lastActive: 120 },
  { name: "Emeka Obi", email: "emeka@yourco.com", role: "Viewer", twoFa: true, lastActive: 300 },
];

const CAPABILITIES = ["Run analyses", "Upload documents", "Manage members", "Billing", "Delete data"];
const ROLE_MATRIX: Record<Role, boolean[]> = {
  Owner: [true, true, true, true, true],
  Admin: [true, true, true, true, false],
  Member: [true, true, false, false, false],
  Viewer: [false, false, false, false, false],
};

const AUDIT_KINDS = ["all", "auth", "data", "billing", "members"] as const;
const AUDIT_LOG: { actor: string; action: string; target: string; kind: (typeof AUDIT_KINDS)[number]; hoursAgo: number }[] = [
  { actor: "Priya Raman", action: "ran crew analysis", target: "Q2 verdict", kind: "data", hoursAgo: 2 },
  { actor: "Dev Kapoor", action: "downloaded invoice", target: "Jul 2026", kind: "billing", hoursAgo: 5 },
  { actor: "Sana Iyer", action: "uploaded document", target: "DACH Market Study.pdf", kind: "data", hoursAgo: 9 },
  { actor: "System", action: "rotated API keys", target: "workspace HQ", kind: "auth", hoursAgo: 14 },
  { actor: "Marco Silva", action: "signed in", target: "new device · Lisbon", kind: "auth", hoursAgo: 20 },
  { actor: "Priya Raman", action: "changed role", target: "Tomás Vega → Viewer", kind: "members", hoursAgo: 30 },
  { actor: "Dev Kapoor", action: "updated payment method", target: "Visa ···· 4412", kind: "billing", hoursAgo: 46 },
  { actor: "Lena Fischer", action: "deleted document", target: "old-forecast-v1.xlsx", kind: "data", hoursAgo: 51 },
  { actor: "System", action: "failed sign-in blocked", target: "unknown IP", kind: "auth", hoursAgo: 70 },
  { actor: "Priya Raman", action: "invited member", target: "noor@yourco.com", kind: "members", hoursAgo: 96 },
  { actor: "Sana Iyer", action: "exported report", target: "Pricing Elasticity Review", kind: "data", hoursAgo: 110 },
  { actor: "System", action: "SOC 2 evidence snapshot", target: "monthly", kind: "auth", hoursAgo: 160 },
];

export function AdminPage() {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [auditFilter, setAuditFilter] = useState<(typeof AUDIT_KINDS)[number]>("all");
  const [deleteText, setDeleteText] = useState("");

  const audit = useMemo(
    () => AUDIT_LOG.filter((a) => auditFilter === "all" || a.kind === auditFilter),
    [auditFilter],
  );

  return (
    <AppShell title="Admin Console" wide>
      <PageHero
        label="governance"
        title="Run the OS like an"
        accent="operator."
        body="Members, roles, permissions and a full audit trail."
      />

      <div className="grid gap-5 xl:grid-cols-3">
        {/* members */}
        <Panel delay={0.05} className="p-6 xl:col-span-2">
          <BlockTitle label={`${members.length} people`} title="Members" action={<ShieldCheck className="h-4 w-4 text-crew-300" />} />
          <div className="flex flex-col">
            {members.map((m, i) => (
              <motion.div
                key={m.email}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="flex flex-wrap items-center gap-3 border-b border-white/[0.05] py-3 last:border-0"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-crew-500/60 to-[#0891CF]/60 text-xs font-extrabold text-white">
                  {m.name.split(" ").map((p) => p[0]).join("")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-white">{m.name}</span>
                  <span className="block truncate text-[11px] text-slate-500">{m.email}</span>
                </span>
                <GlowChip color={m.twoFa ? "#059669" : "#D97706"}>{m.twoFa ? "2FA" : "no 2FA"}</GlowChip>
                <span className="hidden w-20 text-right font-mono text-[10px] text-slate-500 sm:block">
                  {timeAgo(new Date(Date.now() - m.lastActive * 3600000).toISOString())}
                </span>
                <select
                  value={m.role}
                  disabled={m.role === "Owner"}
                  onChange={(e) => setMembers(members.map((x) => (x.email === m.email ? { ...x, role: e.target.value as Role } : x)))}
                  aria-label={`Role for ${m.name}`}
                  className="rounded-lg border border-white/10 bg-[#0B0D14] px-2 py-1.5 text-xs font-bold text-slate-300 outline-none disabled:opacity-50"
                >
                  {(["Owner", "Admin", "Member", "Viewer"] as Role[]).map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                {m.role !== "Owner" &&
                  (confirmRemove === m.email ? (
                    <button
                      onClick={() => {
                        setMembers(members.filter((x) => x.email !== m.email));
                        setConfirmRemove(null);
                      }}
                      className="rounded-lg bg-[#EC4899]/15 px-2.5 py-1.5 text-[10px] font-bold text-[#EC4899]"
                    >
                      Confirm?
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmRemove(m.email)}
                      aria-label={`Remove ${m.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-[#EC4899]/10 hover:text-[#EC4899]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ))}
              </motion.div>
            ))}
          </div>
        </Panel>

        {/* roles matrix */}
        <Panel delay={0.12} className="p-6">
          <BlockTitle label="permissions" title="Roles matrix" />
          <div className="grid grid-cols-5 gap-1.5 text-center" role="table" aria-label="Role permissions">
            <span />
            {(Object.keys(ROLE_MATRIX) as Role[]).map((r) => (
              <span key={r} className="font-mono text-[8px] uppercase tracking-wider text-slate-500">{r}</span>
            ))}
            {CAPABILITIES.map((c, ci) => (
              <div key={c} className="contents">
                <span className="self-center text-left text-[10.5px] font-semibold text-slate-300">{c}</span>
                {(Object.keys(ROLE_MATRIX) as Role[]).map((r) => (
                  <span key={r} className="flex h-8 items-center justify-center rounded-lg bg-white/[0.03]">
                    {ROLE_MATRIX[r][ci] ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Lock className="h-3 w-3 text-slate-600" />
                    )}
                  </span>
                ))}
              </div>
            ))}
          </div>

          {/* danger zone */}
          <div className="mt-6 rounded-2xl border border-[#EC4899]/25 bg-[#EC4899]/[0.05] p-4">
            <p className="text-sm font-bold text-[#EC4899]">Danger zone</p>
            <button className="mt-3 w-full rounded-xl border border-white/12 bg-white/[0.04] py-2 text-xs font-bold text-slate-200 transition-colors hover:border-white/25">
              Export all organization data
            </button>
            <p className="mt-4 text-[11px] text-slate-400">
              Type <span className="font-mono font-bold text-[#EC4899]">DELETE</span> to enable organization deletion.
            </p>
            <div className="mt-2 flex gap-2">
              <input
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                aria-label="Type DELETE to confirm"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#EC4899]/50"
              />
              <button
                disabled={deleteText !== "DELETE"}
                className={cn(
                  "shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition-all",
                  deleteText === "DELETE" ? "bg-[#EC4899] text-white" : "bg-[#EC4899]/15 text-[#EC4899]/50",
                )}
              >
                Delete org
              </button>
            </div>
          </div>
        </Panel>
      </div>

      {/* audit log */}
      <div className="mt-5">
        <Panel delay={0.2} className="p-6">
          <BlockTitle
            label="every action, recorded"
            title="Audit log"
            action={
              <div className="flex gap-1.5">
                {AUDIT_KINDS.map((k) => (
                  <button
                    key={k}
                    onClick={() => setAuditFilter(k)}
                    aria-pressed={auditFilter === k}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize transition-all",
                      auditFilter === k
                        ? "border-crew-500/50 bg-crew-500/15 text-crew-300"
                        : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200",
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>
            }
          />
          <div className="flex max-h-80 flex-col overflow-y-auto">
            {audit.map((a, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-white/[0.05] py-2.5 text-[12.5px] last:border-0">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-crew-400/70" />
                <span className="font-bold text-white">{a.actor}</span>
                <span className="text-slate-400">{a.action}</span>
                <span className="truncate font-semibold text-slate-300">{a.target}</span>
                <span className="ml-auto shrink-0 font-mono text-[10px] text-slate-600">
                  {timeAgo(new Date(Date.now() - a.hoursAgo * 3600000).toISOString())}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
