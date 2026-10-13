<h1 align="center">
  <img src="../assets/recon-platform-mark.png" width="200" alt="Teal and indigo circular route links four location pins">
  Recon Backend
</h1>

<h4 align="center">FastAPI services for Recon participant, operations, and partner workflows.</h4>

<p align="center">
  <a href="https://github.com/AbhiramVSA/Recon/blob/74d9e4bb88f2a9261b82c0619c5852cd4e9f3f9f/recon-backend/pyproject.toml"><img alt="Python 3.12+" src="https://img.shields.io/badge/Python-3.12%2B-3776AB?style=flat-square&amp;logo=python&amp;logoColor=white"></a>  <a href="https://github.com/AbhiramVSA/Recon/blob/74d9e4bb88f2a9261b82c0619c5852cd4e9f3f9f/recon-backend/pyproject.toml"><img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-API-009688?style=flat-square&amp;logo=fastapi&amp;logoColor=white"></a>
</p>

<p align="center">
  <a href="https://github.com/AbhiramVSA/Recon/blob/74d9e4bb88f2a9261b82c0619c5852cd4e9f3f9f/recon-backend/pyproject.toml"><img alt="SQLModel" src="https://img.shields.io/badge/SQLModel-ORM-3E6B8B?style=flat-square"></a>
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#requirements">Requirements</a> •
  <a href="#how-to-use">How to Use</a>
</p>

<p align="center">
  <a href="#development">Development</a> •
  <a href="#license">License</a>
</p>

## Key Features

- FastAPI provides the asynchronous API layer.
- SQLModel and PostgreSQL support application data.
- Redis supports cache and publish-subscribe workflows.
- Alembic manages database migrations.
- Authlib and cookie-based JWT support sign-in and session flows.
- Domain, admin, partner, and infrastructure folders separate service areas.

## Requirements

- Python 3.12 or later.
- `uv` for dependency management.
- A PostgreSQL service.
- A Redis service.
- Local values for any configured external service.

## How to Use

Run these commands from the repository root.

```bash
cd recon-backend
uv sync
touch .env
```

The backend `Settings` class reads `.env` from `recon-backend/` or the repository root. The contributor guide lists database, Redis, application-secret, and Google OAuth settings. The repository does not track an `.env.example` file. Add local values for your services. Keep credentials out of version control.

Apply database migrations and start the API.

```bash
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

The API listens at `http://localhost:8000`. Open `http://localhost:8000/docs` for interactive API documentation.

## Development

Run backend tests from `recon-backend/`.

```bash
uv run pytest
```

Create and apply migrations from the same directory.

```bash
uv run alembic revision --autogenerate -m "describe your change"
uv run alembic upgrade head
```

Roll back one migration only when the change requires it.

```bash
uv run alembic downgrade -1
```

See the [root README](../README.md) for the broader project map and [SECURITY.md](../SECURITY.md) for responsible disclosure.

## License

The repository has no root `LICENSE` file. This README assigns no license.

---

<p align="center">
  <a href="../README.md">Recon overview</a> •
  <a href="../recon-frontend/README.md">Frontend guide</a> •
  <a href="../CONTRIBUTING.md">Contributor guide</a>
</p>
