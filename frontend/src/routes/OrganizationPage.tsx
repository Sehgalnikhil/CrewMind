import { AnimatePresence, motion } from "framer-motion";
import { Building2, Check, ChevronDown, Plus, Send } from "lucide-react";
import { useEffect, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";

import { createInvitation, listRoles } from "#/api/rbac";
import { AppShell } from "#/components/layout/AppShell";
import { BlockTitle, GlowChip, Panel } from "#/components/os/ui";
import { PageHero, MeterBar } from "#/components/system/shared";
import { AGENTS } from "#/types";
import { useAuthStore } from "#/stores/authStore";
import { usePermissionStore } from "#/stores/permissionStore";
import { cn } from "#/lib/utils";

const WORKSPACES = [
  { id: "hq", name: "Headquarters", hint: "Primary workspace — the full crew", color: "#8A7BEF" },
  { id: "eu", name: "EU Pilot", hint: "DACH expansion sandbox", color: "#0891CF" },
  { id: "board", name: "Board Prep", hint: "Quarterly narrative & deck", color: "#D97706" },
];

const DEPARTMENTS = [
  { name: "Engineering", lead: "Priya Raman", people: 26, health: 84, watcher: "operations", teams: ["Platform", "Product", "Infra"] },
  { name: "Sales", lead: "Marco Silva", people: 14, health: 76, watcher: "strategy", teams: ["Mid-market", "Enterprise"] },
  { name: "Marketing", lead: "Sana Iyer", people: 9, health: 71, watcher: "research", teams: ["Demand gen", "Brand"] },
  { name: "Finance", lead: "Dev Kapoor", people: 6, health: 90, watcher: "finance", teams: ["FP&A", "RevOps"] },
  { name: "Operations", lead: "Lena Fischer", people: 17, health: 68, watcher: "operations", teams: ["Fulfilment", "Support"] },
  { name: "Legal", lead: "Ade Okafor", people: 4, health: 93, watcher: "legal", teams: ["Commercial", "Compliance"] },
];

export function OrganizationPage() {
  const user = useAuthStore((s) => s.user);
  const [workspace, setWorkspace] = useState(() => localStorage.getItem("crewmind-workspace") ?? "hq");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState<string>("");
  const [invites, setInvites] = useState<{ email: string; role: string }[]>([]);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const orgName = usePermissionStore((s) => s.context?.organization?.name);

  const { data: roles } = useQuery({ queryKey: ["org-roles"], queryFn: listRoles });
  const inviteMutation = useMutation({
    mutationFn: ({ email, roleId }: { email: string; roleId: string }) => createInvitation(email, roleId),
    onSuccess: (inv) => {
      setInviteError(null);
      const roleName = roles?.find((r) => r.id === inv.role_id)?.name ?? "MEMBER";
      setInvites((prev) => [{ email: inv.email, role: roleName }, ...prev]);
      setInviteEmail("");
    },
    onError: (e: unknown) => {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setInviteError(typeof detail === "string" ? detail : "Could not send the invitation.");
    },
  });
  const [profile, setProfile] = useState({ industry: "B2B SaaS", size: "51–100", founded: "2021" });

  useEffect(() => localStorage.setItem("crewmind-workspace", workspace), [workspace]);

  return (
    <AppShell title="Organization" wide>
      <PageHero
        label="company & workspaces"
        title="The shape of"
        accent={orgName ?? user?.org_name ?? "your company."}
        body="Identity, workspaces, departments and the people inside them."
      />

      <div className="grid gap-5 xl:grid-cols-3">
        {/* identity */}
        <Panel delay={0.05} className="p-6">
          <BlockTitle label="identity" title="Company profile" />
          <div className="mb-4 flex items-center gap-3">
            <span className="conic-ring flex h-12 w-12 items-center justify-center rounded-2xl">
              <span className="flex h-full w-full items-center justify-center rounded-2xl bg-[#0B0D14]">
                <Building2 className="h-5 w-5 text-crew-300" />
              </span>
            </span>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-white">{user?.org_name ?? "Your Company"}</p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">operated by crewmind</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {(
              [
                ["Industry", "industry"],
                ["Company size", "size"],
                ["Founded", "founded"],
              ] as const
            ).map(([label, key]) => (
              <label key={key} className="block">
                <span className="text-[11px] font-semibold text-slate-400">{label}</span>
                <input
                  value={profile[key]}
                  onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm text-white outline-none transition-colors focus:border-crew-500/40"
                />
              </label>
            ))}
          </div>
        </Panel>

        {/* workspaces */}
        <Panel delay={0.1} className="p-6">
          <BlockTitle label="switch context" title="Workspaces" />
          <div className="flex flex-col gap-2.5">
            {WORKSPACES.map((w) => {
              const active = workspace === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => setWorkspace(w.id)}
                  aria-pressed={active}
                  className={cn(
                    "glass relative flex items-center gap-3 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5",
                    active && "conic-ring",
                  )}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold" style={{ backgroundColor: `${w.color}22`, color: w.color }}>
                    {w.name[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-white">{w.name}</span>
                    <span className="block truncate text-[11px] text-slate-500">{w.hint}</span>
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0 text-crew-300" />}
                </button>
              );
            })}
            <button className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-3 text-xs font-bold text-slate-400 transition-colors hover:border-crew-500/40 hover:text-slate-200">
              <Plus className="h-3.5 w-3.5" /> New workspace
            </button>
          </div>
        </Panel>

        {/* invites */}
        <Panel delay={0.15} className="p-6">
          <BlockTitle label="grow the org" title="Invite people" />
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-1.5 pl-4 pr-1.5 transition-colors focus-within:border-crew-500/40">
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@company.com"
              aria-label="Invite email"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
            <select
              value={inviteRoleId || roles?.find((r) => r.name === "MEMBER")?.id || ""}
              onChange={(e) => setInviteRoleId(e.target.value)}
              aria-label="Role"
              className="rounded-lg border border-white/10 bg-[#0B0D14] px-2 py-1.5 text-xs font-bold text-slate-300 outline-none"
            >
              {(roles ?? []).filter((r) => r.name !== "OWNER").map((r) => (
                <option key={r.id} value={r.id}>{r.name.charAt(0) + r.name.slice(1).toLowerCase()}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const roleId = inviteRoleId || roles?.find((r) => r.name === "MEMBER")?.id;
                if (!inviteEmail.trim() || !roleId) return;
                inviteMutation.mutate({ email: inviteEmail.trim(), roleId });
              }}
              disabled={inviteMutation.isPending}
              aria-label="Send invite"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-crew-500 text-white shadow-glow transition-transform hover:scale-105 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          {inviteError && <p className="mt-2 text-[11px] text-[#f3c583]">{inviteError}</p>}
          <div className="mt-3 flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {invites.map((i) => (
                <motion.div
                  key={i.email}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2"
                >
                  <span className="flex-1 truncate text-xs font-semibold text-slate-200">{i.email}</span>
                  <GlowChip color="#D97706">pending · {i.role}</GlowChip>
                </motion.div>
              ))}
            </AnimatePresence>
            {invites.length === 0 && <p className="py-3 text-center text-xs text-slate-500">No pending invites.</p>}
          </div>
        </Panel>
      </div>

      {/* departments */}
      <div className="mt-5">
        <Panel delay={0.2} className="p-6">
          <BlockTitle label="structure" title="Departments & teams" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {DEPARTMENTS.map((d, i) => {
              const watcher = AGENTS.find((a) => a.key === d.watcher)!;
              const open = expanded === d.name;
              return (
                <motion.div
                  key={d.name}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"
                >
                  <button onClick={() => setExpanded(open ? null : d.name)} className="flex w-full items-center gap-3 text-left" aria-expanded={open}>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-white">{d.name}</span>
                      <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-500">
                        {d.lead} · {d.people} people
                      </span>
                    </span>
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-extrabold"
                      title={`${watcher.persona} watching`}
                      style={{ backgroundColor: `${watcher.color}22`, color: watcher.color }}
                    >
                      {watcher.persona[0]}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", open && "rotate-180")} />
                  </button>
                  <div className="mt-3">
                    <MeterBar pct={d.health} color={watcher.color} delay={0.1 + i * 0.04} />
                  </div>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 flex flex-col gap-1.5 border-t border-white/[0.07] pt-3">
                          {d.teams.map((t) => (
                            <div key={t} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-slate-300">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: watcher.color }} />
                              {t} team
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
