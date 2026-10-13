<h1 align="center">
  <img src="../assets/recon-platform-mark.png" width="200" alt="Teal and indigo circular route links four location pins">
  Recon Frontend
</h1>

<h4 align="center">A React and Vite event site with data-driven content and portal views.</h4>

<p align="center">
  <a href="https://github.com/AbhiramVSA/Recon/blob/74d9e4bb88f2a9261b82c0619c5852cd4e9f3f9f/recon-frontend/package.json"><img alt="Node.js 22.x" src="https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&amp;logo=nodedotjs&amp;logoColor=white"></a>  <a href="https://github.com/AbhiramVSA/Recon/blob/74d9e4bb88f2a9261b82c0619c5852cd4e9f3f9f/recon-frontend/package.json"><img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&amp;logo=react&amp;logoColor=black"></a>
</p>

<p align="center">
  <a href="https://github.com/AbhiramVSA/Recon/blob/74d9e4bb88f2a9261b82c0619c5852cd4e9f3f9f/recon-frontend/package.json"><img alt="TypeScript 6" src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&amp;logo=typescript&amp;logoColor=white"></a>
</p>

<p align="center">
  <a href="https://github.com/AbhiramVSA/Recon/blob/74d9e4bb88f2a9261b82c0619c5852cd4e9f3f9f/recon-frontend/package.json"><img alt="Vite 8, from package.json" src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&amp;logo=vite&amp;logoColor=white"></a>
  <a href="https://github.com/AbhiramVSA/Recon/blob/74d9e4bb88f2a9261b82c0619c5852cd4e9f3f9f/recon-frontend/package.json"><img alt="Tailwind CSS 4, from package.json" src="https://img.shields.io/badge/Tailwind-CSS%204-06B6D4?style=flat-square&amp;logo=tailwindcss&amp;logoColor=white"></a>
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-use">How to Use</a> •
  <a href="#scripts">Scripts</a>
</p>

<p align="center">
  <a href="#content-updates">Content Updates</a> •
  <a href="#license">License</a>
</p>

The repository has no screenshot from a verified browser run.

## Key Features

- A single-page event site uses modular React components.
- Motion effects use Framer Motion.
- Event content lives in a central data file.
- Tailwind CSS styles the interface.
- Vite provides development and build commands.

## How to Use

The package declares Node.js 22.x in its `engines` field. Install dependencies and start the development server.

```bash
npm install
npm run dev
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run test` | Run the Vitest suite |
| `npm run test:e2e` | Run the Playwright suite |
| `npm run build` | Type-check and build the site |
| `npm run preview` | Preview the production build locally |

These commands come from `package.json`. This draft does not report test results.

## Content Updates

- Edit event copy, statistics, schedules, team content, and partner content in `src/data.ts`.
- Edit section visuals and behavior in `src/components/`.
- Edit global styles and effects in `src/index.css`.

## License

No root `LICENSE` file exists. The frontend package has no `license` field. This README assigns no license.

---

<p align="center">
  <a href="../README.md">Recon overview</a> •
  <a href="../recon-backend/README.md">Backend guide</a> •
  <a href="../CONTRIBUTING.md">Contributor guide</a>
</p>
