import type { ReactNode } from "react";

import { AccessRestricted } from "#/components/auth/Can";
import type { Permission } from "#/core/permissions/permissions";
import type { Role } from "#/core/permissions/roles";
import { usePermissionStore } from "#/stores/permissionStore";

/**
 * Route-level guard. Renders the premium AccessRestricted state (inside the
 * normal shell chrome) instead of silently redirecting. Accepts either a
 * required permission or an allow-list of roles.
 */
export function PermissionRoute({
  permission,
  roles,
  label,
  children,
}: {
  permission?: Permission | string;
  roles?: Role[];
  label?: string;
  children: ReactNode;
}) {
  const context = usePermissionStore((s) => s.context);

  // Context still loading — PermissionProvider shows the loader above us.
  if (!context) return <>{children}</>;

  const permissionOk = !permission || context.permissions.includes(permission);
  const roleOk = !roles || (context.role !== null && roles.includes(context.role));

  if (!permissionOk || !roleOk) {
    return (
      <div className="world flex h-screen items-center justify-center bg-[#05060C]">
        <AccessRestricted capability={label} />
      </div>
    );
  }
  return <>{children}</>;
}

/** Role-only variant, for callers who think in roles rather than permissions. */
export function RoleProtectedRoute({ roles, children }: { roles: Role[]; children: ReactNode }) {
  return <PermissionRoute roles={roles}>{children}</PermissionRoute>;
}
