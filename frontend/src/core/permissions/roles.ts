import type { Permission } from "#/core/permissions/permissions";

export const ROLES = ["OWNER", "ADMIN", "MANAGER", "MEMBER"] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  MEMBER: "Member",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  OWNER: "Full control, including billing and organization lifecycle",
  ADMIN: "Manages people, agents, security and settings",
  MANAGER: "Runs agents, documents and reporting for their team",
  MEMBER: "Works with the crew: chat, documents and knowledge",
};

/**
 * Display-only matrix for the Admin console. The authoritative grants live
 * in the backend seed; keep the two in sync.
 */
export const ROLE_MATRIX: { capability: string; permission: Permission; roles: Role[] }[] = [
  { capability: "Manage organization", permission: "organization.manage", roles: ["OWNER", "ADMIN"] },
  { capability: "Invite & remove users", permission: "users.invite", roles: ["OWNER", "ADMIN"] },
  { capability: "Change member roles", permission: "users.manage_roles", roles: ["OWNER", "ADMIN"] },
  { capability: "Manage billing", permission: "billing.manage", roles: ["OWNER", "ADMIN"] },
  { capability: "Manage API keys", permission: "api_keys.manage", roles: ["OWNER", "ADMIN"] },
  { capability: "View audit logs", permission: "audit_logs.view", roles: ["OWNER", "ADMIN"] },
  { capability: "Manage settings", permission: "settings.manage", roles: ["OWNER", "ADMIN"] },
  { capability: "Create & configure agents", permission: "agents.create", roles: ["OWNER", "ADMIN", "MANAGER"] },
  { capability: "Delete agents", permission: "agents.delete", roles: ["OWNER", "ADMIN"] },
  { capability: "Delete documents", permission: "documents.delete", roles: ["OWNER", "ADMIN", "MANAGER"] },
  { capability: "Export reports", permission: "reports.export", roles: ["OWNER", "ADMIN", "MANAGER"] },
  { capability: "Run agents & chat", permission: "agents.execute", roles: ["OWNER", "ADMIN", "MANAGER", "MEMBER"] },
  { capability: "Upload documents", permission: "documents.upload", roles: ["OWNER", "ADMIN", "MANAGER", "MEMBER"] },
  { capability: "View reports & knowledge", permission: "reports.view", roles: ["OWNER", "ADMIN", "MANAGER", "MEMBER"] },
];
