# Recon

Recon is a Vite + React + TypeScript web app for the RECON 2026 cybersecurity event experience.

It ships a stylized, animated landing page with section-based content for hero, events, schedule, team, prizes, and footer modules.

## Features

- Single-page event site with modular React components
- Animated UI and motion effects via Framer Motion
- Data-driven content in a central source file
- Utility-first styling with Tailwind CSS (v4)
- Fast dev/build workflow using Vite

## Tech Stack

- React 19
- TypeScript 6
- Vite 8
- Tailwind CSS 4
- Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

By default, Vite serves the app at <http://localhost:5173>.

## Scripts

- `npm run dev` - start development server
- `npm run build` - type-check and build for production
- `npm run preview` - preview the production build locally

## Project Structure

```text
src/
  App.tsx              # Main page composition
  data.ts              # Event content (stats, events, schedule, team, partners)
  hooks.ts             # Shared hooks
  shader.ts            # Shader/background related logic
  index.css            # Global styles
  main.tsx             # App entry point
  components/
    Hero.tsx
    About.tsx
    Events.tsx
    Schedule.tsx
    Team.tsx
    Prizes.tsx
    Footer.tsx
    ...
```

## Content Updates

- Update event copy, stats, schedule, team, and partner data in `src/data.ts`.
- Update visuals and section behavior in `src/components/*`.
- Adjust global style tokens/effects in `src/index.css`.

## Build for Production

```bash
npm run build
```

The optimized output is generated in the `dist/` folder.

## Notes

No explicit license is currently defined in `package.json`.
