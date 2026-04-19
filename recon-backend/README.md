# Recon Backend

Recon Backend is the FastAPI service for the Recon platform. It provides the event API used by the participant app, admin operations surface, and partner workflows.

## Features

- FastAPI async API with SQLModel and Alembic
- PostgreSQL persistence via asyncpg
- Redis-backed cache and realtime helpers
- Google OAuth plus cookie-based JWT auth
- Domain modules for participants, points, zones, announcements, teams, incidents, partners, and storage

## Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/getting-started/installation/)
- PostgreSQL
- Redis

## Setup

```bash
cd recon-backend
cp .env.example .env
uv sync
```

Edit `.env` and set at minimum:

```dotenv
MODE=development
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=recon_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=change-me
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
BOOTSTRAP_ADMIN_EMAILS=maintainer@example.com
```

The committed Google OAuth allowlist file contains placeholder values only. Replace it or override `GOOGLE_OAUTH_ALLOWLIST_PATH` for real deployments.

## Run

```bash
uv run uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`.

- OpenAPI docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Tests

```bash
uv run pytest
```

## Database migrations

```bash
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "describe your change"
```

## Project structure

```text
app/
  domains/           Participant-facing event features
  admin/             Ops/admin surface
  partners/          Sponsor/partner surface
  infrastructure/    Shared technical capabilities
  utils/             Framework plumbing
  core/              Config, security, OAuth
  db/                Async database session setup
  models/            Alembic model aggregator
  api/v1/api.py      Router mount point
  main.py            App entry point
```

See `AGENTS.md` for the internal architecture guide and current project state.
