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

export async function fetchCurrentUserContext(): Promise<UserContext> {
  const { data } = await api.get<UserContext>("/current-user/context");
  return data;
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
  const { data } = await api.get<RoleRow[]>("/organization/roles");
  return data;
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
