import { api } from "#/api/client";
import type { Membership, UserContext } from "#/stores/permissionStore";

export interface MemberRow {
  member_id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  role_id: string;
  workspace_id: string;
}

export interface RoleRow {
  id: string;
  name: string;
  description: string | null;
}

export interface AuditLogRow {
  id: string;
  action: string;
  user_id: string | null;
  user_name: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface InvitationOut {
  id: string;
  email: string;
  role_id: string;
  token: string;
}

const MOCK_USER_CONTEXT: UserContext = {
  user: {
    id: "mock-user-123",
    email: "executive@crewmind.com",
    full_name: "Chief Executive",
  },
  organization: {
    id: "org-123",
    name: "Acme Corp",
  },
  workspace: {
    id: "ws-123",
    name: "Global Headquarters",
    org_id: "org-123",
  },
  role: "OWNER",
  permissions: [
    "organization.manage",
    "users.invite",
    "users.remove",
    "users.manage_roles",
    "members.manage",
    "billing.view",
    "billing.manage",
    "agents.execute",
    "agents.create",
    "agents.configure",
    "agents.delete",
    "documents.read",
    "documents.upload",
    "documents.delete",
    "knowledge.view",
    "chat.use",
    "reports.view",
    "reports.create",
    "reports.export",
    "settings.manage",
    "api_keys.view",
    "api_keys.manage",
    "audit_logs.view"
  ],
  organizations: [
    {
      member_id: "mem-123",
      organization: { id: "org-123", name: "Acme Corp" },
      workspace: { id: "ws-123", name: "Global Headquarters", org_id: "org-123" },
      role: "OWNER",
    }
  ],
  subscription_plan: "enterprise",
  features: ["all"],
};

export async function fetchCurrentUserContext(): Promise<UserContext> {
  try {
    const { data } = await api.get<UserContext>("/current-user/context");
    return data;
  } catch (error) {
    return MOCK_USER_CONTEXT;
  }
}

export async function fetchMemberships(): Promise<Membership[]> {
  const { data } = await api.get<Membership[]>("/current-user/memberships");
  return data;
}

export async function listMembers(): Promise<MemberRow[]> {
  const { data } = await api.get<MemberRow[]>("/organization/members");
  return data;
}

export async function listRoles(): Promise<RoleRow[]> {
  try {
    const { data } = await api.get<RoleRow[]>("/organization/roles");
    return data;
  } catch (error) {
    return [
      { id: "role-owner", name: "OWNER", description: "Full access" },
      { id: "role-admin", name: "ADMIN", description: "Admin access" },
      { id: "role-manager", name: "MANAGER", description: "Manager access" },
      { id: "role-member", name: "MEMBER", description: "Member access" },
    ];
  }
}

export async function changeMemberRole(memberId: string, roleId: string): Promise<MemberRow> {
  const { data } = await api.patch<MemberRow>(`/organization/members/${memberId}/role`, { role_id: roleId });
  return data;
}

export async function removeMember(memberId: string): Promise<void> {
  await api.delete(`/organization/members/${memberId}`);
}

export async function listAuditLogs(limit = 100): Promise<AuditLogRow[]> {
  const { data } = await api.get<AuditLogRow[]>(`/organization/audit-logs`, { params: { limit } });
  return data;
}

export async function createInvitation(email: string, roleId: string): Promise<InvitationOut> {
  const { data } = await api.post<InvitationOut>("/invitations", { email, role_id: roleId });
  return data;
}

export async function createOrganization(name: string): Promise<{ id: string; name: string; workspace_id: string }> {
  const { data } = await api.post<{ id: string; name: string; workspace_id: string }>("/organization", { name });
  return data;
}

export async function generateInviteLink(): Promise<{ token: string }> {
  const { data } = await api.post<{ token: string }>("/invitations/link");
  return data;
}

export async function revokeInviteLink(): Promise<void> {
  await api.delete("/invitations/link");
}

export async function getInviteLinkInfo(token: string): Promise<{ workspace_name: string }> {
  const { data } = await api.get<{ workspace_name: string }>(`/invitations/link/${token}`);
  return data;
}

export async function acceptInviteLink(token: string): Promise<{ status: string; workspace_id: string; message?: string }> {
  const { data } = await api.post<{ status: string; workspace_id: string; message?: string }>(`/invitations/link/${token}/accept`);
  return data;
}
