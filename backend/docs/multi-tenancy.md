# Crewmind Architecture: Multi-Tenancy

Crewmind supports multi-tenancy at the **Workspace** level. The original tenancy model exposed `org_id` widely, but to enhance security and isolation, the application is moving strictly to a **Workspace-first** isolation model.

## Tenancy Hierarchy

- **User**: Represents a distinct individual logging into the platform (identified by email).
- **Organization**: Groups workspaces for administrative or billing purposes. This is rarely used in standard API flows now, but it's kept at the database level for potential super-admin views and cross-workspace billing.
- **Workspace**: The primary tenant container. All application data (documents, AI memory, agents, metrics) belongs strictly to a single workspace.

## Database Enforcement

To prevent data leaks, every single entity that can be scoped to a tenant contains a `workspace_id UUID NOT NULL` column. This includes:
- `documents`
- `agent_runs`
- `memory_records`
- `audit_logs`
- `usage_records`

Queries must filter by `workspace_id` to ensure no cross-tenant leakage.
