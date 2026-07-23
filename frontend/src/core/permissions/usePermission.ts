import type { Permission } from "#/core/permissions/permissions";
import type { Role } from "#/core/permissions/roles";
import { usePermissionStore } from "#/stores/permissionStore";

/** True when the current user holds the permission in the active workspace. */
export function usePermission(permission: Permission | string): boolean {
  return usePermissionStore((s) => s.context?.permissions.includes(permission) ?? false);
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

/** Non-hook check for use outside components (e.g. filtering nav lists). */
export function hasPermission(permission: string): boolean {
  return usePermissionStore.getState().context?.permissions.includes(permission) ?? false;
}
