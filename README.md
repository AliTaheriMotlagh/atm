# Ali's Project Island

An interactive 3D portfolio for **Ali Taheri Motlagh** — Software Engineer and Senior Frontend Developer.

Instead of scrolling through a conventional portfolio, visitors drive around a 3D island. Each landmark represents a real project and opens a detailed project dossier with a live website preview, repository links, technical analysis, documentation, recent GitHub commit messages, and a project-themed mini-game.

## Portfolio

- GitHub: https://github.com/AliTaheriMotlagh
- LinkedIn: https://www.linkedin.com/in/alitaherimotlagh/
- Projects: https://github.com/AliTaheriMotlagh?tab=repositories

## Featured projects

| Project | Live website | Source |
| --- | --- | --- |
| Remixt | https://remixt-free.vercel.app | https://github.com/AliTaheriMotlagh/remixt |
| Khalabani | https://khalabani.vercel.app | https://github.com/AliTaheriMotlagh/khalabani |
| Gridways | https://gridways.vercel.app | https://github.com/AliTaheriMotlagh/gridways |
| VasatYab | https://vasatyab.vercel.app | https://github.com/AliTaheriMotlagh/vasat-yab |
| Siktir | https://siktir-backend.onrender.com | Frontend: https://github.com/AliTaheriMotlagh/siktir-frontend · Backend: https://github.com/AliTaheriMotlagh/siktir-backend |
| TypeScript Algorithms | — | https://github.com/AliTaheriMotlagh/typescript-algorithms-and-data-structures |

## What makes the portfolio different

### Drivable 3D project island

The interface is a small Three.js game world rather than a normal list of cards. Visitors can drive between landmarks using keyboard controls on desktop and touch controls on mobile/tablet.

### A mini-game for every project

Each project has a challenge inspired by what the project actually does:

- **Remixt — Stem Sync:** repeat a rhythm pattern to sync vocal and beat.
- **Khalabani — Perfect Touchdown:** time an aircraft landing over the runway touchdown zone.
- **Gridways — Route Builder:** connect a house to a shop while avoiding water.
- **VasatYab — Find the Midpoint:** find the exact midpoint between two positions.
- **Siktir — Dokme Reflex:** hit a moving Siktir button five times quickly.
- **TypeScript Algorithms — Sort It:** sort a group of values from smallest to largest.

Project-game completion is part of the full island objective.

### Portfolio goals

To complete the island tour, the visitor must:

1. Visit every project landmark.
2. Open project dossiers.
3. Collect coins.
4. Complete all six project mini-games.

A local best time is stored in the browser.

### Live project previews

Projects with deployed websites can be opened directly inside the portfolio with a sandboxed iframe. Visitors can switch between:

- live website;
- website screenshot;
- full-screen preview;
- direct “open in new tab” link.

### GitHub activity

Each project dossier loads recent commit messages from the GitHub API at runtime. Repositories with multiple parts, such as Siktir frontend/backend, show activity from both.

### Project documentation

The portfolio includes project-specific material based on the repositories and their README files, including architecture, feature design, setup instructions, stacks, constraints, and technical decisions.

## Responsive design

The island is designed for:

- phones;
- tablets and iPad;
- laptops;
- desktop monitors;
- ultrawide and large displays;
- TVs and presentation screens.

The UI includes touch driving controls, adaptive project panels, safe-area support, full-screen live previews, large-display scaling and landscape-height handling.

## Tech

- HTML / CSS / JavaScript
- Three.js
- WebGL
- Canvas
- Web Audio API
- GitHub REST API
- responsive/touch input
- sandboxed iframe previews
- localStorage for game preferences and best time

The portfolio intentionally stays deployable as a static site.

## Run locally

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/ali-project-island-complete.html
```

You can also use any static server such as `npx serve` or deploy the file to Vercel, Netlify, GitHub Pages, Cloudflare Pages, or another static host.

## Controls

### Desktop

- `W A S D` / arrow keys — drive
- `Shift` — boost
- `E` — open nearby project
- `M` — project list
- `Esc` — close active panel

### Mobile / tablet

Touch joystick and boost controls appear automatically.

## About Ali

Ali Taheri Motlagh is a Software Engineer / Senior Frontend Developer with 13+ years of professional experience across frontend engineering, full-stack development, DevOps and infrastructure.

Primary skills include **TypeScript, Angular and NgRx**, with experience across Canvas, SVG, RxJS, React.js, Next.js, NestJS, Prisma, PostgreSQL, Docker, Linux and other web/infrastructure technologies.

See the full career timeline and skills inside the **About Ali** landmark.

---

Built as a portfolio that visitors can explore instead of merely scroll through.
