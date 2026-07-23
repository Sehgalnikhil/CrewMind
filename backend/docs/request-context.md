# Request Context (`RequestContext`)

The `RequestContext` is a core FastAPI dependency injected into almost all protected routes in Crewmind.

## Flow
1. **Authentication**: Validates the JWT Bearer token and extracts `user_id`.
2. **Header Parsing**: Extracts `x-workspace-id` from the HTTP request headers.
3. **Membership Validation**: Queries the `organization_members` table to ensure the authenticated user belongs to the requested `workspace_id`.
4. **Hydration**: The dependency loads the user, workspace, organization (parent of workspace), role, and role permissions into a single `RequestContext` object.

## Advantages
- **Security Default**: No endpoint can bypass workspace isolation if it depends on `RequestContext`.
- **Performance**: Loads membership and permissions in a single optimized SQLAlchemy query, avoiding N+1 database lookups across different middlewares and handlers.
- **Convenience**: Route handlers immediately have access to `ctx.user.id`, `ctx.workspace.id`, and `ctx.permissions`.
