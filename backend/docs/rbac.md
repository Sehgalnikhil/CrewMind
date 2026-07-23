# Role-Based Access Control (RBAC)

The RBAC system governs what a user can do inside a specific Workspace. 

## Core Roles
- **Owner**: Full administrative control. Can manage workspace settings, members, billing, execute agents, and delete resources.
- **Admin**: Can manage users, documents, and settings. Cannot access billing or delete the workspace itself.
- **Executive**: Read-heavy role. Can view reports, execute agents, and access analytics. Cannot manage users.
- **Analyst**: Focused on operations. Can upload documents and view insights. Cannot execute arbitrary agents or manage users.
- **Viewer**: Read-only access to permitted resources (e.g. approved reports and documents).

## Implementation
Roles are linked to `Permission` rows through `RolePermission`. When a user authenticates, the system looks up their `OrganizationMember` row for the `workspace_id` in question. The role and its associated permissions are loaded into the `RequestContext`.

Endpoints use the `RequiresPermission("permission.name")` dependency to enforce access at the route level.
