# Recon Frontend

Recon Frontend is a React + Vite client for the Recon platform. It includes the public event experience plus portal and admin-facing screens backed by the API.

## Features

- React 19 + TypeScript 6 application
- Shared API client integration with the backend
- Public event pages alongside portal/admin views
- Tailwind CSS v4 styling
- Vitest and Playwright test setup

## Prerequisites

- Node.js 22.x
- npm 9+

## Setup

```bash
cd recon-frontend
cp .env.example .env
npm install
```

Default local configuration:

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SITE_URL=http://localhost:5173
VITE_PORTAL_DEV_BYPASS_AUTH=0
```

## Run

```bash
npm run dev
```

By default, Vite serves the app at `http://localhost:5173`.

## Scripts

- `npm run dev` starts the development server
- `npm run build` builds the production bundle
- `npm run test` runs Vitest
- `npm run preview` previews the production bundle
- `npm run test:e2e` runs Playwright

## Project structure

```text
src/
  api/               Backend API client code
  components/        Shared UI sections/components
  portal/            Portal and admin routes
  lib/               Frontend utilities
  data.ts            Static event content
  main.tsx           App entry point
```
