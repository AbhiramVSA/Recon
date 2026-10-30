<p align="center">
  <img src="recon-frontend/public/recon-512.png" alt="ReCon 2026 event mark" width="144" />
</p>

# Recon

Recon is a split frontend/backend event platform built for a DEFCON-style cybersecurity fest. It combines a FastAPI API, a React client, a points and leaderboard system, participant/team flows, zone registration and check-in, admin operations, partner workflows, and event-specific game mechanics in one repository.

<p align="center">
  <a href="#what-recon-covers">Product scope</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#repository-layout">Repository</a> ·
  <a href="#documentation-map">Docs</a> ·
  <a href="#security">Security</a> ·
  <a href="#license">License</a>
</p>

This repository is organized as a public, open-source-friendly workspace:

- `recon-backend/` contains the backend API, database models, migrations, and backend test suite.
- `recon-frontend/` contains the React + Vite application.
- The repository root contains shared documentation, contribution policy, and repo metadata only.

## What Recon Covers

Recon is designed to support an event platform with multiple stakeholder surfaces:

- Participant-facing experiences such as profiles, schedules, announcements, registrations, passes, team flows, and points.
- Operations and admin workflows such as check-in, announcements, incident handling, and event oversight.
- Partner and sponsor workflows such as application intake, approvals, assets, incentives, and reporting.
- Event mechanics such as leaderboard-driven activities, treasure hunt progression, and zone-based attendance/check-in.

## External Systems Not Owned Here

Recon integrates with or sits alongside several external systems. Those systems are not reimplemented in this repository:

- `Luma` for registration, RSVP, and ticket scanning.
- `CTFd` for the competition platform.
- `KOTH` for local network-based competition infrastructure.
- `n8n` for form and webhook automation.
- `Grafana` and `CloudWatch` for infrastructure monitoring.
- `Telegram` and `WhatsApp` for volunteer communications.

That boundary matters for contributors: changes in this repository should improve Recon itself, not rebuild surrounding event tooling.

## Repository Layout

```text
.
|-- recon-backend/             FastAPI backend, Alembic migrations, backend tests
|-- recon-frontend/            React + Vite frontend
|-- DOCS/                      Supporting project and event material
|-- .github/                   Repo metadata and parked workflow files
|-- AGENTS.md                  Architecture, conventions, and project state
|-- CONTRIBUTING.md            Contributor workflow and engineering rules
|-- SECURITY.md                Vulnerability reporting policy
```

## Stack Overview

### Backend

- `FastAPI` for the async API layer
- `SQLModel` and `SQLAlchemy` for models and persistence
- `PostgreSQL` via `asyncpg`
- `Redis` for cache and realtime/event support
- `Alembic` for schema migrations
- `Authlib` + cookie-based JWT auth for sign-in/session flows

### Frontend

- `React 19`
- `TypeScript`
- `Vite`
- `Tailwind CSS`
- `Vitest` and `Playwright`

## Architecture

The backend follows a layered pattern:

```text
Router -> Controller -> Service -> CRUD
```

- Routers stay thin and handle HTTP concerns only.
- Controllers orchestrate flows across services.
- Services contain business logic.
- CRUD modules perform raw database operations.

At the top level, the backend is split by audience:

- `domains/` for participant-facing product areas
- `admin/` for operations/admin surfaces
- `partners/` for sponsor and partner features
- `infrastructure/` for shared technical capabilities
- `utils/` for framework plumbing

This structure is explained in more detail in [`AGENTS.md`](AGENTS.md) and the backend-specific README.

## Current Feature Areas

The repository already includes meaningful implementation across several domains:

- Authentication with Google OAuth, JWT sessions, refresh/logout, RBAC, and bootstrap admin support
- Participant profiles and participant/admin discovery flows
- Points ledger, leaderboards, and team competition scoring
- Zone registration, QR pass generation, and atomic admin check-in
- Teams, treasure hunt progression, announcements, incidents, and partner workflows
- Storage helpers for presigned object access
- Frontend public pages plus portal/admin-facing surfaces

This is not a blank scaffold. It is an actively shaped event platform with real application structure and non-trivial backend logic.

## Quick Start

### Prerequisites

- `Python 3.12+`
- [`uv`](https://docs.astral.sh/uv/getting-started/installation/) for backend dependency management
- `Node.js 22.x`
- `npm`
- `PostgreSQL`
- `Redis`

### 1. Start the backend

```bash
cd recon-backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

Backend defaults:

- API: `http://localhost:8000`
- OpenAPI docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 2. Start the frontend

```bash
cd recon-frontend
npm install
npm run dev
```

Frontend default:

- App: `http://localhost:5173`

## Configuration

This repository does not include `.env.example` files for either app. Create local environment files from the variable names below and the setup examples in each app README.

- Backend settings: [`recon-backend/README.md`](recon-backend/README.md)
- Frontend API URL: `VITE_API_BASE_URL`
- Optional frontend site URL: `VITE_SITE_URL`

The repository does not commit real secrets. Before running locally, configure at minimum:

- database connection settings
- Redis connection settings
- JWT/application secret
- Google OAuth client credentials for backend auth flows
- frontend API base URL

The backend also ships a placeholder Google OAuth allowlist file for safe open-source publication. Replace it for real deployments.

## Development Workflow

### Backend

```bash
cd recon-backend
uv sync
uv run pytest
```

Common backend tasks:

```bash
cd recon-backend
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "describe change"
uv run uvicorn app.main:app --reload
```

### Frontend

```bash
cd recon-frontend
npm install
npm run dev
npm run test
npm run build
```

## Testing

The repository is set up for both backend and frontend validation:

- backend tests use `pytest`
- frontend unit tests use `Vitest`
- frontend end-to-end tests use `Playwright`

When changing API contracts, data models, or app flows, validate both sides of the split workspace where relevant.

## Documentation Map

- Backend setup and service-level details: [recon-backend/README.md](recon-backend/README.md)
- Frontend setup and scripts: [recon-frontend/README.md](recon-frontend/README.md)
- Contributor workflow and engineering rules: [CONTRIBUTING.md](CONTRIBUTING.md)
- Security reporting policy: [SECURITY.md](SECURITY.md)
- Architecture and living project state: [AGENTS.md](AGENTS.md)

## Open-Source Readiness Notes

This repository has been cleaned up for public publication:

- frontend and backend live in clearly separated top-level directories
- example env files are provided instead of committed secrets
- active deployment workflows are intentionally disabled by default
- parked GitHub Actions files live under `.github/workflows.disabled/`
- repository-level ignores are in place for local artifacts and editor noise

If you enable CI/CD later, move or recreate only the workflows that match your actual deployment target.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening changes. The main engineering rules live in [AGENTS.md](AGENTS.md), especially for:

- backend folder ownership and architecture
- model registration and router mounting
- migration workflow
- dependency injection rules
- project state maintenance

## Security

Please do not report vulnerabilities in public issues. See [SECURITY.md](SECURITY.md) for responsible disclosure instructions.

## Project Status

Recon is event-oriented software with active implementation across backend and frontend surfaces. Some areas are complete, some are scaffolded, and some are still evolving. The source of truth for current backend/domain status is the `Project State` section in [`AGENTS.md`](AGENTS.md).

## License

A repository-wide `LICENSE` file is not currently present. Add one before accepting broad third-party reuse or external contributions under a defined open-source license.
