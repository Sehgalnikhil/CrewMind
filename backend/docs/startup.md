# Clean Startup Guide

This document outlines the procedure for initializing the Crewmind application from a fresh clone, particularly focusing on database initialization and seeding for local development.

## 1. Prerequisites
- Python 3.11+
- Node.js (for frontend, optional here)
- UV / pip

## 2. Environment Setup
Create a `.env` file in the `backend` directory based on `.env.example` if it exists, or provide the minimum:

```env
ENVIRONMENT=development
GEMINI_API_KEY=your_gemini_key_here
```

## 3. Database Initialization & Migration
Because we are using SQLite in local development (which is ephemeral/disk-based) and the models enforce strict foreign-key relations (e.g. `workspace_id` everywhere), a completely fresh database is the easiest path for development environments.

If an older `crewmind.db` exists from prior to Phase 8.1, delete it:
```bash
rm -f crewmind.db
```

The database tables will be automatically created when you start the FastAPI server via SQLAlchemy's `Base.metadata.create_all()` in the `init_db()` hook.

## 4. Seeding Default Roles & Permissions
We have introduced a strict RBAC and Feature Flag system. To ensure that your workspace will function correctly, seed the initial permissions and roles.

Run the seed script from the `backend` directory:
```bash
python -m app.scripts.seed
```

This will create:
- Owner, Admin, Executive, Analyst, Viewer roles
- Necessary `documents.write`, `agents.execute` style permissions

## 5. Starting the Server
Start the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```

Verify that the server boots successfully and the health endpoint returns `ok`:
```bash
curl http://localhost:8000/api/system/health
```

## 6. Frontend Connection
Assuming the frontend is running on `localhost:3000`, the CORS headers are configured by default in `main.py` to allow the frontend to communicate with the backend seamlessly. Ensure that any login requests automatically provision an `OrganizationMember` attached to a `workspace_id`.
