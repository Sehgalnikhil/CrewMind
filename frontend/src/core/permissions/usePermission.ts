import type { Permission } from "#/core/permissions/permissions";
import type { Role } from "#/core/permissions/roles";
import { usePermissionStore } from "#/stores/permissionStore";

/** True when the current user holds the permission in the active workspace. */
export function usePermission(permission: Permission | string): boolean {
  return usePermissionStore((s) => (Array.isArray(s.context?.permissions) ? s.context!.permissions : []).includes(permission));
}

/** True when the user holds EVERY listed permission. */
export function usePermissions(...permissions: (Permission | string)[]): boolean {
  return usePermissionStore((s) => {
    const held = s.context?.permissions;
    if (!held) return false;
    return permissions.every((p) => held.includes(p));
  });
}

export function useRole(): Role | null {
  return usePermissionStore((s) => s.context?.role ?? null);
}

export function hasPermission(permission: string): boolean {
  const context = usePermissionStore.getState().context;
  return (Array.isArray(context?.permissions) ? context!.permissions : []).includes(permission);
}
