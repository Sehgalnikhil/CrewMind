# Audit Logging & Usage Tracking

## Audit System
The Audit System records high-value user and system actions in the `audit_logs` table for compliance, security, and traceability.

### Tracked Events
- **Authentication**: `user.login`, `user.logout`
- **Users & Workspaces**: Workspace creation, user invites, role changes.
- **Documents**: Uploads, parsing failures, deletion.
- **AI**: Agent execution (start/finish), memory updates, report generation.

All audit logs strictly bind to `workspace_id`. If `user_id` is present, it indicates who triggered the action. System-triggered actions will have a null `user_id`.

## Usage Tracking
The `usage_records` table aggregates metrics for billing and analytics at the workspace level.
- Records are stored as a `metric_name` (e.g. `ai_tokens`, `storage_bytes`) and a float `value`.
- Bounded strictly by `workspace_id`.
