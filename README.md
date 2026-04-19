# Recon

Recon is an open-source split-repository workspace for an event platform.

- `recon-backend/` contains the FastAPI API, database migrations, and backend tests.
- `recon-frontend/` contains the React/Vite client.

The repository root keeps shared documentation and repository-level metadata only.

## Repository layout

```text
.
|-- recon-backend/
|-- recon-frontend/
|-- DOCS/
|-- .github/
|-- AGENTS.md
|-- CONTRIBUTING.md
|-- SECURITY.md
```

## Quick start

Backend:

```bash
cd recon-backend
cp .env.example .env
uv sync
uv run uvicorn app.main:app --reload
```

Frontend:

```bash
cd recon-frontend
cp .env.example .env
npm install
npm run dev
```

## Documentation

- Backend setup and architecture: [recon-backend/README.md](recon-backend/README.md)
- Frontend setup and scripts: [recon-frontend/README.md](recon-frontend/README.md)
- Contributor workflow: [CONTRIBUTING.md](CONTRIBUTING.md)
- Security policy: [SECURITY.md](SECURITY.md)

## Open-source defaults

- No deploy workflow is active by default. Parked workflow files live under `.github/workflows.disabled/`.
- No real secrets are committed. Example environment files are included for local setup.
- Editor and build artifacts are ignored at the repo root and app level.
