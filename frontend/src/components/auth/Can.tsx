import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import type { Permission } from "#/core/permissions/permissions";
import { usePermission } from "#/core/permissions/usePermission";
import { usePermissionStore } from "#/stores/permissionStore";

/**
 * Renders children only when the current user holds the permission.
 *
 *   <Can permission="billing.manage">
 *     <Button>Manage Subscription</Button>
 *   </Can>
 */
export function Can({
  permission,
  fallback = null,
  children,
}: {
  permission: Permission | string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const allowed = usePermission(permission);
  return <>{allowed ? children : fallback}</>;
}

/** Full-page premium "no access" state — shown instead of silently redirecting. */
export function AccessRestricted({ capability }: { capability?: string }) {
  const role = usePermissionStore((s) => s.context?.role);
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]"
      >
        <ShieldAlert className="h-7 w-7 text-crew-300" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="max-w-md space-y-2"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">Access restricted</p>
        <h2 className="text-xl font-extrabold text-white">
          Your organization administrator has restricted this capability.
        </h2>
        <p className="text-sm leading-relaxed text-slate-400">
          {capability ? `“${capability}” is` : "This area is"} not included in your current role
          {role ? ` (${role.charAt(0) + role.slice(1).toLowerCase()})` : ""}. Contact your organization
          administrator if you need access.
        </p>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}>
        <Link
          to="/dashboard"
          className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
        >
          Back to Mission Control
        </Link>
      </motion.div>
    </div>
  );
}
