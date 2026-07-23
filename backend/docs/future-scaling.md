# Future Scaling Architecture

As the system grows, the multi-tenancy model relies on `workspace_id` everywhere. This enables future horizontal scaling and physical data partitioning without major code rewrites.

## Database Sharding
Because every table and primary query incorporates `workspace_id`, the relational database (SQLite -> Postgres) can be sharded cleanly based on `workspace_id`. Large enterprise workspaces can be isolated to dedicated hardware clusters effortlessly.

## Vector DB Scaling
ChromaDB collections are inherently partitioned by `workspace_id`. If migrated to Pinecone or Qdrant in the future, namespaces or tenant partitioning can be seamlessly adopted because our API already treats each workspace as an independent unit.

## Microservices
As Crewmind outgrows the monolith, `RequestContext` can be easily shifted to an API Gateway handling JWT validation and workspace-membership checking. Downstream microservices will trust the `x-workspace-id` forwarded by the Gateway.
