# Workspace Isolation

Workspace Isolation ensures that data boundaries are strictly respected, guaranteeing that users in Workspace A have zero access to Workspace B's data.

## API Endpoints
All API endpoints rely on `RequestContext` to fetch the active `workspace_id`. This ID is supplied via the `x-workspace-id` HTTP header. 
- If a user is NOT a member of that workspace, they receive a 403 Forbidden.
- All database queries append `.where(Model.workspace_id == ctx.workspace.id)`.

## WebSockets
WebSockets (`/ws/chat`, `/ws/agent-runs`, `/ws/dashboard`) authenticate the initial connection and extract the `workspace_id`. Connections are mapped to this workspace, and users cannot subscribe to events from other workspaces.

## Vector Database
The AI semantic search (ChromaDB) leverages separate collections per workspace (`ws_<workspace_id>`). Additionally, every embedding includes the `workspace_id` in its metadata as a secondary boundary guard.

## AI Memory
The Memory Engine restricts the Knowledge Graph and Conversation Memory to the active `workspace_id`. No global or cross-tenant AI memory exists.
