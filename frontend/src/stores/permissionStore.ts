import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Role } from "#/core/permissions/roles";

export interface OrgSummary {
  id: string;
  name: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  org_id: string;
}

export interface Membership {
  member_id: string;
  organization: OrgSummary;
  workspace: WorkspaceSummary;
  role: Role;
}

export interface UserContext {
  user: { id: string; email: string; full_name: string };
  organization: OrgSummary | null;
  workspace: WorkspaceSummary | null;
  role: Role | null;
  permissions: string[];
  organizations: Membership[];
  subscription_plan: string | null;
  features: string[];
}

interface PermissionState {
  /** Loaded from GET /api/current-user/context after login. */
  context: UserContext | null;
  /** Active workspace — sent as x-workspace-id on every request. */
  workspaceId: string | null;
  status: "idle" | "loading" | "ready" | "error";
  setContext: (context: UserContext) => void;
  setStatus: (status: PermissionState["status"]) => void;
  switchWorkspace: (workspaceId: string) => void;
  clear: () => void;
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set) => ({
      context: null,
      workspaceId: null,
      status: "idle",
      setContext: (context) =>
        set({ context, status: "ready", workspaceId: context.workspace?.id ?? null }),
      setStatus: (status) => set({ status }),
      switchWorkspace: (workspaceId) => set({ workspaceId, status: "loading" }),
      clear: () => set({ context: null, workspaceId: null, status: "idle" }),
    }),
    {
      name: "crewmind-permissions",
      partialize: (s) => ({ workspaceId: s.workspaceId }),
    }
  )
);
