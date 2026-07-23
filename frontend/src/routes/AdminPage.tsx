import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, Lock, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { queryClient } from "#/api/client";
import { changeMemberRole, listAuditLogs, listMembers, listRoles, removeMember } from "#/api/rbac";
import { Can } from "#/components/auth/Can";
import { AppShell } from "#/components/layout/AppShell";
import { BlockTitle, GlowChip, OrbitalLoader, Panel } from "#/components/os/ui";
import { PageHero, timeAgo } from "#/components/system/shared";
import { ROLE_MATRIX, ROLES, type Role } from "#/core/permissions/roles";
import { usePermissionStore } from "#/stores/permissionStore";
import { cn } from "#/lib/utils";

const AUDIT_KINDS = ["all", "members", "documents", "agents", "billing", "auth"] as const;
type AuditKind = (typeof AUDIT_KINDS)[number];

function auditKind(action: string): AuditKind {
  const prefix = action.split(".")[0];
  if (prefix === "members" || prefix === "invitations") return "members";
  if (prefix === "documents") return "documents";
  if (prefix === "agents") return "agents";
  if (prefix === "billing") return "billing";
  return "auth";
}

function describeAction(action: string): string {
  const map: Record<string, string> = {
    "members.role_changed": "changed a member's role",
    "members.removed": "removed a member",
    "invitations.created": "invited a member",
    "invitations.accepted": "accepted an invitation",
    "invitations.revoked": "revoked an invitation",
    "documents.uploaded": "uploaded a document",
    "documents.deleted": "deleted a document",
    "agents.configured": "configured an agent",
    "agents.task_created": "created an agent task",
    "agents.run_started": "started a crew analysis",
    "billing.subscription_created": "started a subscription",
    "billing.subscription_activated": "activated a subscription",
  };
  return map[action] ?? action.replace(".", " · ");
}

export function AdminPage() {
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [auditFilter, setAuditFilter] = useState<AuditKind>("all");
  const [error, setError] = useState<string | null>(null);
  const currentUserId = usePermissionStore((s) => s.context?.user.id);

  const { data: members, isLoading: membersLoading } = useQuery({ queryKey: ["org-members"], queryFn: listMembers });
  const { data: roles } = useQuery({ queryKey: ["org-roles"], queryFn: listRoles });
  const { data: auditLogs } = useQuery({ queryKey: ["audit-logs"], queryFn: () => listAuditLogs(200) });

  const onError = (e: unknown) => {
    const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
    setError(detail ?? "That action could not be completed.");
  };

  const roleMutation = useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) => changeMemberRole(memberId, roleId),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["org-members"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
    onError,
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(memberId),
    onSuccess: () => {
      setError(null);
      setConfirmRemove(null);
      queryClient.invalidateQueries({ queryKey: ["org-members"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
    onError,
  });

  const audit = useMemo(
    () => (auditLogs ?? []).filter((a) => auditFilter === "all" || auditKind(a.action) === auditFilter),
    [auditLogs, auditFilter],
  );

  return (
    <AppShell title="Admin Console" wide>
      <PageHero
        label="governance"
        title="Run the OS like an"
        accent="operator."
        body="Members, roles, permissions and a full audit trail."
      />

      {error && (
        <div className="mb-4 rounded-2xl border border-[#D97706]/30 bg-[#D97706]/10 px-4 py-3 text-sm text-[#f3c583]">
          {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        {/* members */}
        <Panel delay={0.05} className="p-6 xl:col-span-2">
          <BlockTitle
            label={`${members?.length ?? 0} people`}
            title="Members"
            action={<ShieldCheck className="h-4 w-4 text-crew-300" />}
          />
          {membersLoading ? (
            <OrbitalLoader label="loading members" />
          ) : (
            <div className="flex flex-col">
              {(members ?? []).map((m, i) => (
                <motion.div
                  key={m.member_id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  className="flex flex-wrap items-center gap-3 border-b border-white/[0.05] py-3 last:border-0"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-crew-500/60 to-[#0891CF]/60 text-xs font-extrabold text-white">
                    {m.full_name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-white">
                      {m.full_name}
                      {m.user_id === currentUserId && <span className="ml-2 font-mono text-[9px] uppercase text-crew-300">you</span>}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">{m.email}</span>
                  </span>
                  <GlowChip color="#6C5CE7">{m.role}</GlowChip>
                  <Can permission="users.manage_roles">
                    <select
                      value={m.role_id}
                      disabled={roleMutation.isPending || m.user_id === currentUserId}
                      onChange={(e) => roleMutation.mutate({ memberId: m.member_id, roleId: e.target.value })}
                      aria-label={`Role for ${m.full_name}`}
                      className="rounded-lg border border-white/10 bg-[#0B0D14] px-2 py-1.5 text-xs font-bold text-slate-300 outline-none disabled:opacity-50"
                    >
                      {(roles ?? []).map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </Can>
                  <Can permission="users.remove">
                    {m.user_id !== currentUserId &&
                      (confirmRemove === m.member_id ? (
                        <button
                          onClick={() => removeMutation.mutate(m.member_id)}
                          disabled={removeMutation.isPending}
                          className="rounded-lg bg-[#EC4899]/15 px-2.5 py-1.5 text-[10px] font-bold text-[#EC4899]"
                        >
                          Confirm?
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmRemove(m.member_id)}
                          aria-label={`Remove ${m.full_name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-[#EC4899]/10 hover:text-[#EC4899]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ))}
                  </Can>
                </motion.div>
              ))}
              {(members ?? []).length === 0 && (
                <p className="py-6 text-center text-sm text-slate-500">No members yet — invite people from the Organization page.</p>
              )}
            </div>
          )}
        </Panel>

        {/* roles matrix */}
        <Panel delay={0.12} className="p-6">
          <BlockTitle label="permissions" title="Roles matrix" />
          <div className="grid grid-cols-5 gap-1.5 text-center" role="table" aria-label="Role permissions">
            <span />
            {ROLES.map((r) => (
              <span key={r} className="font-mono text-[8px] uppercase tracking-wider text-slate-500">{r}</span>
            ))}
            {ROLE_MATRIX.map((row) => (
              <div key={row.permission} className="contents">
                <span className="self-center text-left text-[10.5px] font-semibold text-slate-300">{row.capability}</span>
                {ROLES.map((r: Role) => (
                  <span key={r} className="flex h-8 items-center justify-center rounded-lg bg-white/[0.03]">
                    {row.roles.includes(r) ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Lock className="h-3 w-3 text-slate-600" />
                    )}
                  </span>
                ))}
              </div>
            ))}
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
            {audit.map((a) => (
              <div key={a.id} className="flex items-center gap-3 border-b border-white/[0.05] py-2.5 text-[12.5px] last:border-0">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-crew-400/70" />
                <span className="font-bold text-white">{a.user_name ?? "System"}</span>
                <span className="text-slate-400">{describeAction(a.action)}</span>
                <span className="truncate font-semibold text-slate-300">
                  {typeof a.metadata === "object" && a.metadata
                    ? Object.values(a.metadata).filter((v) => typeof v === "string").slice(0, 2).join(" · ")
                    : ""}
                </span>
                <span className="ml-auto shrink-0 font-mono text-[10px] text-slate-600">{timeAgo(a.created_at)}</span>
              </div>
            ))}
            {audit.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">No audit events yet for this filter.</p>
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
