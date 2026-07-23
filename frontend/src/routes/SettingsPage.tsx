import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, CheckCircle2, Cpu, ShieldCheck, User, XCircle } from "lucide-react";

import { getStatus } from "#/api/status";
import { AppShell } from "#/components/layout/AppShell";
import { BlockTitle, GlowChip, OrbitalLoader, Panel } from "#/components/os/ui";
import { ROLE_LABELS } from "#/core/permissions/roles";
import { AGENTS } from "#/types";
import { useAuthStore } from "#/stores/authStore";
import { usePermissionStore } from "#/stores/permissionStore";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-semibold text-slate-100">{value}</dd>
    </div>
  );
}

function RoleChip() {
  const role = usePermissionStore((s) => s.context?.role);
  if (!role) return null;
  return (
    <GlowChip className="ml-auto" color="#059669">
      <User className="h-3 w-3" /> {ROLE_LABELS[role] ?? role}
    </GlowChip>
  );
}

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { data: status, isLoading } = useQuery({ queryKey: ["status"], queryFn: getStatus });

  return (
    <AppShell title="Settings">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">system</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-white">
            Workspace <span className="text-aurora">settings.</span>
          </h2>
        </motion.div>

        {/* profile */}
        <Panel delay={0.08} className="p-6">
          <BlockTitle label="you" title="Profile" />
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-crew-500 to-[#0891CF] text-xl font-extrabold text-white shadow-glow">
              {user?.full_name?.charAt(0) ?? "?"}
            </div>
            <div>
              <p className="text-base font-bold text-white">{user?.full_name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <RoleChip />
          </div>
          <dl className="space-y-2">
            <Row label="Full name" value={user?.full_name} />
            <Row label="Email" value={user?.email} />
          </dl>
        </Panel>

        {/* organization */}
        <Panel delay={0.14} className="p-6">
          <BlockTitle label="company" title="Organization" />
          <dl className="space-y-2">
            <Row
              label="Workspace"
              value={
                <span className="flex items-center justify-end gap-2">
                  <Building2 className="h-4 w-4 text-crew-300" /> {user?.org_name}
                </span>
              }
            />
            <Row
              label="Executives"
              value={
                <span className="flex items-center justify-end gap-1.5">
                  {AGENTS.map((a) => (
                    <span
                      key={a.key}
                      title={a.persona}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-extrabold"
                      style={{ backgroundColor: `${a.color}25`, color: a.color }}
                    >
                      {a.persona[0]}
                    </span>
                  ))}
                  <span className="ml-1 text-xs text-slate-500">5 / 5 hired</span>
                </span>
              }
            />
          </dl>
        </Panel>

        {/* AI engine */}
        <Panel delay={0.2} className="p-6">
          <BlockTitle
            label="the brain"
            title="AI Engine"
            action={
              status?.llm_configured ? (
                <GlowChip color="#059669">
                  <CheckCircle2 className="h-3 w-3" /> Operational
                </GlowChip>
              ) : (
                <GlowChip color="#EC4899">
                  <XCircle className="h-3 w-3" /> Not configured
                </GlowChip>
              )
            }
          />
          {isLoading ? (
            <OrbitalLoader label="checking systems" />
          ) : (
            <dl className="space-y-2">
              <Row
                label="Anthropic API key"
                value={
                  status?.llm_configured ? (
                    <span className="flex items-center justify-end gap-2 text-emerald-400">
                      <ShieldCheck className="h-4 w-4" /> Configured
                    </span>
                  ) : (
                    <span className="text-[#f5a9cf]">Missing</span>
                  )
                }
              />
              {status?.llm_configured && (
                <Row
                  label="Model"
                  value={
                    <span className="flex items-center justify-end gap-2 font-mono text-xs">
                      <Cpu className="h-4 w-4 text-crew-300" /> {status.llm_model}
                    </span>
                  }
                />
              )}
            </dl>
          )}
          {!isLoading && !status?.llm_configured && (
            <p className="mt-3 rounded-2xl border border-[#D97706]/25 bg-[#D97706]/[0.08] px-4 py-3 text-xs leading-relaxed text-[#f3c583]">
              Add <code className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[11px]">GEMINI_API_KEY</code> to{" "}
              <code className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[11px]">backend/.env</code> and restart the
              server to wake your executive team.
            </p>
          )}
        </Panel>

        {/* data & security */}
        <Panel delay={0.26} className="p-6">
          <BlockTitle label="trust" title="Data & security" />
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { title: "Zero training on your data", body: "Documents never train shared models." },
              { title: "Encrypted at rest & in transit", body: "AES-256 storage, TLS 1.3 transport." },
              { title: "Full audit trail", body: "Every agent action is logged and reviewable." },
              { title: "Delete anytime", body: "Remove a document and its chunks are purged." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4"
              >
                <p className="flex items-center gap-2 text-xs font-bold text-white">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> {f.title}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
