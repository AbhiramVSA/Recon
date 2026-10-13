<h1 align="center">
  <img src="assets/recon-platform-mark.png" width="200" alt="Teal and indigo circular route links four location pins">
  Recon
</h1>

<h4 align="center">A split event platform for a DEFCON-style cybersecurity fest.</h4>

<p align="center">
  <a href="https://github.com/AbhiramVSA/Recon/blob/74d9e4bb88f2a9261b82c0619c5852cd4e9f3f9f/recon-backend/pyproject.toml"><img alt="Python 3.12+" src="https://img.shields.io/badge/Python-3.12%2B-3776AB?style=flat-square&amp;logo=python&amp;logoColor=white"></a>  <a href="https://github.com/AbhiramVSA/Recon/blob/74d9e4bb88f2a9261b82c0619c5852cd4e9f3f9f/recon-backend/pyproject.toml"><img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-API-009688?style=flat-square&amp;logo=fastapi&amp;logoColor=white"></a>
</p>

<p align="center">
  <a href="https://github.com/AbhiramVSA/Recon/blob/74d9e4bb88f2a9261b82c0619c5852cd4e9f3f9f/recon-frontend/package.json"><img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&amp;logo=react&amp;logoColor=black"></a>
</p>

<p align="center">
  <a href="https://github.com/AbhiramVSA/Recon/blob/74d9e4bb88f2a9261b82c0619c5852cd4e9f3f9f/recon-frontend/package.json"><img alt="TypeScript 6" src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&amp;logo=typescript&amp;logoColor=white"></a>  <a href="https://github.com/AbhiramVSA/Recon/blob/74d9e4bb88f2a9261b82c0619c5852cd4e9f3f9f/recon-frontend/package.json"><img alt="Vite 8" src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&amp;logo=vite&amp;logoColor=white"></a>
</p>

<p align="center">
  <a href="https://github.com/AbhiramVSA/Recon/blob/74d9e4bb88f2a9261b82c0619c5852cd4e9f3f9f/recon-frontend/package.json"><img alt="Node.js 22.x" src="https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&amp;logo=nodedotjs&amp;logoColor=white"></a>
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#how-to-use">How to Use</a>
</p>

<p align="center">
  <a href="#tests-and-build">Tests and Build</a> •
  <a href="#security">Security</a> •
  <a href="#license">License</a>
</p>

The repository has no screenshot from a verified local demo.

## Key Features

- Participant flows cover profiles, schedules, announcements, registration, passes, teams, and points.
- Operations flows cover check-in, announcements, incidents, and event oversight.
- Partner flows cover applications, approvals, assets, incentives, and reports.
- Event activities include leaderboards, treasure-hunt progress, and zone attendance.
- The frontend provides public pages and portal or admin views.

## Architecture

Recon keeps its API and web client in separate project folders.

| Area | Stack |
| --- | --- |
| Backend | FastAPI, SQLModel, PostgreSQL, Redis, and Alembic |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Vitest, and Playwright |

See the [backend guide](recon-backend/README.md) and [frontend guide](recon-frontend/README.md).

## How to Use

Use two terminals from the repository root.

**Backend**

```bash
cd recon-backend
uv sync
touch .env
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

Backend settings read `.env` from `recon-backend/` or the repository root. The contributor guide lists database, Redis, application-secret, and Google OAuth settings. The repository does not track an `.env.example` file. Add local values for your services. Do not commit secrets. The API documentation is available at `http://localhost:8000/docs`.

**Frontend**

```bash
cd recon-frontend
npm install
npm run dev
```

The frontend package declares Node.js 22.x in its `engines` field. The frontend source reads `VITE_API_BASE_URL` when set. The repository does not track an `.env.example` file. Set this variable in your local environment only when you need to change the API URL.

## Tests and Build

Run the commands from their project directories.

**Backend**

```bash
cd recon-backend
uv run pytest
```

**Frontend**

```bash
cd recon-frontend
npm run test
npm run test:e2e
npm run build
```

These commands are documented or declared by the source. This draft does not report a test result.

## Development

The frontend keeps event copy, statistics, schedules, team content, and partner content in `recon-frontend/src/data.ts`. Its component files control section visuals and behavior.

The backend uses domain, admin, and partner areas. Recon works with Luma, CTFd, KOTH, n8n, Grafana, CloudWatch, Telegram, and WhatsApp. This repository does not reimplement those systems. Every change here must improve Recon itself. Do not rebuild those event systems here. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) before you change backend structure or database models.

## Security

Do not report vulnerabilities in public issues. Follow the instructions in [SECURITY.md](SECURITY.md).

Use local configuration for external services. Keep credentials and real event data out of commits.

## License

The source README states: “A repository-wide LICENSE file is not currently present. Add one before accepting broad third-party reuse or external contributions under a defined open-source license.”

---

<p align="center">
  <a href="CONTRIBUTING.md">Contributor guide</a> •
  <a href="SECURITY.md">Security</a> •
  <a href="DOCS/treasure_hunt/README.md">Treasure Hunt notes</a>
</p>
