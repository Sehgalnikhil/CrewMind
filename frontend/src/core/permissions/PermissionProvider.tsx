import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";

import { fetchCurrentUserContext } from "#/api/rbac";
import { OrbitalLoader } from "#/components/os/ui";
import { usePermissionStore } from "#/stores/permissionStore";

/**
 * Boots the RBAC context after Clerk authentication: fetches the current
 * user's organization, workspace, role and permissions, and keeps them in
 * the permission store. Re-fetches when the active workspace changes so an
 * organization switch atomically swaps the whole permission set.
 */
export function PermissionProvider({ children }: { children: ReactNode }) {
  const workspaceId = usePermissionStore((s) => s.workspaceId);
  const setContext = usePermissionStore((s) => s.setContext);
  const setStatus = usePermissionStore((s) => s.setStatus);
  const hasContext = usePermissionStore((s) => s.context !== null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["current-user-context", workspaceId],
    queryFn: fetchCurrentUserContext,
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (data) setContext(data);
    else if (isError) setStatus("error");
  }, [data, isError, setContext, setStatus]);

  if (!hasContext && isLoading) {
    return (
      <div className="world flex h-screen items-center justify-center bg-[#05060C]">
        <OrbitalLoader label="loading your workspace" />
      </div>
    );
  }

  return <>{children}</>;
}
