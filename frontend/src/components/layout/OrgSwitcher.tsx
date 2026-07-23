import { AnimatePresence, motion } from "framer-motion";
import { Building2, Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { queryClient } from "#/api/client";
import { ROLE_LABELS } from "#/core/permissions/roles";
import { usePermissionStore } from "#/stores/permissionStore";

/**
 * Organization switcher — for users who belong to several organizations.
 * Switching swaps the active workspace, which re-scopes every API call
 * (x-workspace-id) and reloads role + permissions, so the sidebar and all
 * available actions update automatically.
 */
export function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const context = usePermissionStore((s) => s.context);
  const workspaceId = usePermissionStore((s) => s.workspaceId);
  const switchWorkspace = usePermissionStore((s) => s.switchWorkspace);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!context?.organization) return null;
  const memberships = context.organizations;

  function pick(nextWorkspaceId: string) {
    setOpen(false);
    if (nextWorkspaceId === workspaceId) return;
    switchWorkspace(nextWorkspaceId);
    // Every cached query is scoped to the previous workspace — drop them all.
    queryClient.clear();
    navigate("/dashboard");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Switch organization"
        className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 backdrop-blur-md transition-all hover:border-white/25 hover:text-white sm:flex"
      >
        <Building2 className="h-4 w-4 text-crew-300" />
        <span className="max-w-[140px] truncate text-[13px] font-semibold">{context.organization.name}</span>
        {context.role && (
          <span className="rounded-md border border-crew-500/30 bg-crew-500/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-crew-300">
            {ROLE_LABELS[context.role]}
          </span>
        )}
        {memberships.length > 1 && <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}
      </button>

      <AnimatePresence>
        {open && memberships.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="glass-deep absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 p-1.5"
          >
            <p className="px-3 pb-1 pt-2 font-mono text-[9px] uppercase tracking-[0.28em] text-slate-500">
              Your organizations
            </p>
            {memberships.map((m) => {
              const active = m.workspace.id === workspaceId;
              return (
                <button
                  key={m.member_id}
                  onClick={() => pick(m.workspace.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                    <Building2 className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{m.organization.name}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {m.workspace.name} · {ROLE_LABELS[m.role] ?? m.role}
                    </p>
                  </div>
                  {active && <Check className="h-4 w-4 shrink-0 text-crew-300" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
