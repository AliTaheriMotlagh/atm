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

### Three mini-games for every landmark (21 in total)

| Landmark | Challenges |
| --- | --- |
| About Ali (bonus) | Career Timeline · Skill Memory · Stack Sorter |
| Remixt | Stem Sync · Keep the Tempo · Mixdown |
| Khalabani | Perfect Touchdown · Glide Slope · Pre-flight Flow |
| Gridways | Route Builder · Rush Hour · Road Spin |
| VasatYab | Find the Midpoint · Meet in the Middle · Fair Café |
| Siktir | Dokme Reflex · Whack-a-Link · Quick Draw |
| TS Algorithms | Sort It · Binary Search · Tower of Hanoi |

Every challenge is playable from its dossier or from the **Arcade** (`G`). Each new clear is worth a coin, a "Next challenge" button chains them, and personal bests are saved in the browser. Wins trigger confetti and, on phones, haptic feedback.

### Portfolio goals

To complete the island tour, the visitor must:

1. Visit every project landmark.
2. Open 3 project dossiers.
3. Collect 8 coins.
4. Beat at least one challenge at every project.

A local best time is stored in the browser.

### Drive together (multiplayer, no server)

Every visitor gets their own car, and everyone online sees each other drive around the island. Press `R` (or use **Online**) to start a race: anyone online can join during a 9-second window, then everyone lines up on the grid for 2 laps of the ring road through 8 checkpoint gates. Alone? It becomes a solo time trial with a saved best time.

- Browsers connect directly over WebRTC via [Trystero](https://github.com/dmotz/trystero), loaded from a CDN. Public Nostr relays are used only to find each other.
- Each browser simulates only its own car and broadcasts position 10×/second; everything is client-side, so the site stays a static Vercel deploy.
- **Private room:** use *Make a private room* and share the invite link (`?room=code`) to drive only with friends.
- Pick your driver name and car colour in the **Online** panel (`N`).

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
- WebRTC peer-to-peer multiplayer (Trystero, Nostr signalling)
- localStorage for game preferences and best time

The portfolio intentionally stays deployable as a static site.

## Run locally

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

You can also use any static server such as `npx serve` or deploy the file to Vercel, Netlify, GitHub Pages, Cloudflare Pages, or another static host.

## Controls

### Desktop

- `W A S D` / arrow keys — drive
- `Shift` — boost
- `E` — open nearby project
- `M` — project list
- `G` — arcade
- `H` — horn
- `N` — drivers online
- `R` — start or join a race
- `Esc` — close active panel

### Mobile / tablet

Touch joystick, boost and horn controls appear automatically. Challenges and the arcade open as bottom sheets that you can swipe down to close, and the tour panel collapses to keep the island visible.

## About Ali

Ali Taheri Motlagh is a Software Engineer / Senior Frontend Developer with 13+ years of professional experience across frontend engineering, full-stack development, DevOps and infrastructure.

Primary skills include **TypeScript, Angular and NgRx**, with experience across Canvas, SVG, RxJS, React.js, Next.js, NestJS, Prisma, PostgreSQL, Docker, Linux and other web/infrastructure technologies.

See the full career timeline and skills inside the **About Ali** landmark.

---

Built as a portfolio that visitors can explore instead of merely scroll through.
