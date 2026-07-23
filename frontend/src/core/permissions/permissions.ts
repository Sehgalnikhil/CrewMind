/** Canonical permission taxonomy — mirrors backend/app/scripts/seed.py. */

export const PERMISSIONS = [
  // Organization & people
  "organization.manage",
  "users.invite",
  "users.remove",
  "users.manage_roles",
  "members.manage",
  // Billing
  "billing.view",
  "billing.manage",
  // Agents
  "agents.execute",
  "agents.create",
  "agents.configure",
  "agents.delete",
  // Documents
  "documents.read",
  "documents.upload",
  "documents.delete",
  // Knowledge & collaboration
  "knowledge.view",
  "chat.use",
  // Reports
  "reports.view",
  "reports.create",
  "reports.export",
  // Administration
  "settings.manage",
  "api_keys.view",
  "api_keys.manage",
  "audit_logs.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Route → permission required to enter. Routes not listed are open to any member. */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/organization": "organization.manage",
  "/admin": "members.manage",
  "/billing": "billing.view",
  "/settings": "settings.manage",
  "/war-room": "agents.create",
  "/simulator": "agents.configure",
};
