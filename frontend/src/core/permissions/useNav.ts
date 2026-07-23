import { useMemo } from "react";

import { NAV_ENTRIES, type NavEntry } from "#/lib/navigation";
import { usePermissionStore } from "#/stores/permissionStore";

/**
 * NAV_ENTRIES filtered to what the current role may see. Gated entries stay
 * hidden until the permission context has loaded (safe default).
 */
export function useAllowedNav(): NavEntry[] {
  const permissions = usePermissionStore((s) => s.context?.permissions);
  return useMemo(
    () => NAV_ENTRIES.filter((e) => !e.permission || (permissions ?? []).includes(e.permission)),
    [permissions]
  );
}

/** Non-hook variant for event handlers (e.g. keyboard chords). */
export function navEntryAllowed(entry: NavEntry): boolean {
  if (!entry.permission) return true;
  const perms = usePermissionStore.getState().context?.permissions;
  return (perms ?? []).includes(entry.permission);
}
