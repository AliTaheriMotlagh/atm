# Ali's Project Island

An interactive 3D portfolio for **Ali Taheri Motlagh** — Software Engineer and Senior Frontend Developer.

Instead of scrolling through a conventional portfolio, visitors drive around a small 3D Tehran: Milad Tower, Azadi Tower, the Grand Bazaar, Valiasr Street and the Alborz mountains. Each landmark in the middle of the city represents a real project and opens a detailed project dossier with a live website preview, repository links, technical analysis, documentation, recent GitHub commit messages, and a project-themed mini-game.

## Portfolio

- GitHub: https://github.com/AliTaheriMotlagh
- CV: https://atm-cv.vercel.app
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
| StreetQuest | https://streetquest-free.vercel.app | https://github.com/AliTaheriMotlagh/streetquest |
| Nexus SCADA | https://nexus-scada.onrender.com | https://github.com/AliTaheriMotlagh/nexus-scada |
| Khabar (Future Focus) | https://khabar-ai.vercel.app | https://github.com/AliTaheriMotlagh/khabar |
| walki | https://walki-free.vercel.app | https://github.com/AliTaheriMotlagh/walki |
| Project Island (this site) | https://alitaherimotlagh.vercel.app | https://github.com/AliTaheriMotlagh/atm |

## Short films

Ali's short films from the [AlanFilm YouTube channel](https://www.youtube.com/@Alitaherimotlagh):

- Hamshahri: https://www.youtube.com/watch?v=Kb0F_Y6gJpk
- A Little Thing: https://www.youtube.com/watch?v=EAyJJ59wsDE

They play in two places: the **🎬 Films** panel (button or <kbd>V</kbd>), and the **drive-in cinema** on the island, between VasatYab and Siktir. Its big screen cycles through the film posters, and driving up to it opens the player. To add a film, append `{ id, title, fa }` to the `FILMS` array in `js/films.js`.

## Billboards

Billboards stand just outside the ring road, one in each gap between spokes. They cycle through Ali's logo (GitHub avatar), the app logo cards for every project, and the film posters.

## Social

The **📣 Social** panel (button or <kbd>P</kbd>) has an X tab ([@Atmbanksepah](https://x.com/Atmbanksepah)) and a LinkedIn tab. Neither network gives signed-out visitors a public feed of recent posts, so posts are pinned in the `SOCIAL` object in `js/ui/social.js`:

- `SOCIAL.x.posts`: X post links or IDs, embedded with X's widget.
- `SOCIAL.linkedin.posts`: LinkedIn post links, or the `urn:li:…` from a post's "Embed this post" menu.

With no posts pinned, each tab shows the profile card with follow and recent-posts links.

## What makes the portfolio different

### Drivable 3D Tehran

The interface is a small Three.js game world rather than a normal list of cards. Visitors can drive between landmarks using keyboard controls on desktop and touch controls on mobile/tablet.

The projects stand on the **Project Ring** in the middle (the race track). Around it runs the ring highway, and around that the districts, laid out like the real city with north at the top of the map:

| District | What's there |
| --- | --- |
| Vanak · Valiasr (north-east) | The skyline, with a spire on the tallest tower |
| Tajrish (north) | Villas on the foothills, Tajrish Square at the top of Valiasr Street |
| Gisha (north-west) | Milad Tower in its park, Tabiat Bridge over the avenue |
| Chitgar · Azadi (west) | Azadi Tower on its square, Chitgar Lake with a pier, a fountain and a Ferris wheel |
| Grand Bazaar (south) | Brick roofs and domes on narrow lanes, the mosque with the turquoise dome |
| Tehranpars (east) | Apartment blocks |

Valiasr Street runs north from the highway to Tajrish under two rows of plane trees. The Alborz rise behind the northern districts with Damavand in the distance, and the desert starts at the city limits. Taxis (yellow and green), Prides and Peykans drive the highway and the district streets.

The whole city is generated from `js/world/plan.js`: every road, lot and landmark as plain data from a fixed seed, so every visitor gets the same city. Buildings are merged into one mesh per facade style, so the city costs a handful of draw calls.

### Radar, map and GPS

- **Radar** (bottom left; top right on phones): GTA style. It's centred on you, turns with the car, zooms out at speed, and shows the GPS route, blips, a north marker and your speed.
- **Map** (`M`, or click the radar): the whole city, north-up. Drag to move, scroll or pinch to zoom. Click a blip for its card (set waypoint, open the dossier, drive there), or click anywhere to drop a waypoint. The legend lists every project and sight.
- **GPS**: the route follows the roads (Dijkstra over the road graph) and re-routes as you drive. A light beacon marks the spot, and the chip above the radar shows the distance. The project list also has a 📍 GPS button per project.
- Driving into a new district shows its name, bottom right.

### Three mini-games for every landmark (36 in total)

| Landmark | Challenges |
| --- | --- |
| About Ali (bonus) | Career Timeline · Skill Memory · Stack Sorter |
| Remixt | Stem Sync · Keep the Tempo · Mixdown |
| Khalabani | Perfect Touchdown · Glide Slope · Pre-flight Flow |
| Gridways | Route Builder · Rush Hour · Road Spin |
| VasatYab | Find the Midpoint · Meet in the Middle · Fair Café |
| Siktir | Dokme Reflex · Whack-a-Link · Quick Draw |
| TS Algorithms | Sort It · Binary Search · Tower of Hanoi |
| StreetQuest | Bomb Defuse · Shooting Range · Treasure Hunt |
| Nexus SCADA | Tank Level · Alarm Triage · Value Map |
| Khabar | Topic Tagger · Channel Catch · Keep the Streak |
| walki | Hold to Talk · Grab the Floor · Clip Queue |
| Project Island | Coin Run · Full Mesh · Landmark Quiz |

Every challenge is playable from its dossier or from the **Arcade** (`G`). Each new clear is worth a coin, a "Next challenge" button chains them, and personal bests are saved in the browser. Wins trigger confetti and, on phones, haptic feedback.

### Portfolio goals

To complete the tour, the visitor must:

1. Visit every project landmark.
2. Open 3 project dossiers.
3. Collect 8 coins.
4. Beat at least one challenge at every project.

A local best time is stored in the browser.

### Drive together (multiplayer, no server)

Every visitor gets their own car, and **everyone on the site sees everyone else's car**, whichever room they are in. Two online games:

- **Race** (`R`): anyone online can join during a short lobby, then everyone lines up on the grid for 2 laps of the Project Ring through 8 checkpoint gates. Alone, it becomes a solo time trial with a saved best time.
- **Gem battle** (`B`): 60 seconds to grab as many gems as you can. The gems appear in the same places for every player (shared seed), and the host's browser decides who reached each gem first, so a gem never counts twice. Alone, it's a solo gem run with a saved best.

How it works:

- Browsers connect directly over WebRTC via [Trystero](https://github.com/dmotz/trystero), loaded from a CDN. Public Nostr relays are used only to find each other.
- Each browser simulates only its own car and broadcasts position 10×/second; everything is client-side, so the site stays a static Vercel deploy.
- **Presence** (cars, names, horns) always runs in the public room, so nobody is ever invisible.
- **Private room:** *Make a private room* and share the invite link (`?room=code`). You still drive among everyone, but your races and gem battles only invite the friends who opened the link.
- When the island is embedded in another page (for example as a preview), it stays offline so it never shows up as a ghost driver.
- Pick your driver name and car colour in the **Online** panel (`N`).

### Game server (recommended for phone + desktop)

Browser-to-browser WebRTC often can't connect a phone on mobile data to a desktop on home Wi-Fi. The fix is the tiny WebSocket relay in `server/`:

1. On render.com: **New → Blueprint**, pick this repo. `render.yaml` deploys `server/` for free.
2. Put its address in `js/net/config.js`: `NET_SERVER = 'wss://<your-service>.onrender.com/ws'`, then redeploy the site.

Everyone then connects through the server, on any network, and phones that come back from the lock screen rejoin automatically. The free plan sleeps after 15 idle minutes and takes about a minute to wake. Test locally with `cd server && npm install && npm start`, then open `http://localhost:8000/?server=ws://localhost:8787/ws`.

Without a server the site falls back to WebRTC. `api/turn.js` (a Vercel function) can then hand out TURN relay credentials (Cloudflare or any TURN server, set by environment variables) to help phones connect.

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

## Code layout

No build step: plain ES modules loaded by `index.html`, which only holds markup.

```text
index.html          markup only
css/                base, hud, dossier, modals, cinema, social, net, games, responsive
  projects/         styles for each project's challenges
js/
  main.js           entry point: wires every panel, then builds the island
  core/             util, store, sfx, effects (toast, confetti), events, app state
  projects/         one module per landmark: dossier data, three challenges, 3D landmark
    index.js        the list of landmarks (order = position around the ring road)
  games/            challenge runner, arcade, shared game helpers
  progress.js       the island tour: stamps, coins, records, HUD
  ui/               shell (keys, buttons, drawer), bigmap, dossier, preview, commits, cinema, social, modal
  net/              net (presence + rooms), race, battle, panel
  world/            Three.js city: layout (districts, city limits), plan (roads, lots, road graph),
                    terrain, city (buildings and sights), screens, landmarks, scenery, cars,
                    traffic, track, gems, gps, mapimage, minimap (radar), snapshots,
                    world (loop and camera)
  films.js          short films and the drive-in landmark
```

### Adding a project

1. Create `js/projects/<id>.js` exporting `{ id, name, color, tagline, repos, site, pitch, design, tech, docs, glyph, games, landmark }`. Copy an existing project as a template. `games` holds three `{ key, icon, title, desc, run(c) }` challenges, and `landmark(group, color, kit)` builds its 3D model.
2. Add it to the list in `js/projects/index.js`. The Project Ring makes room for it automatically, and it shows up on the radar, the map and in the GPS.
3. Optionally, add `css/projects/<id>.css` for its challenges and link it in `index.html`.

Set `embed: false` on a project whose site refuses to load in an iframe, and `shots: [...]` to use phone screenshots as its dossier image.

## Run locally

```bash
python3 -m http.server 8000
```

The code is ES modules, so it must be served over HTTP; opening `index.html` as a file won't work.

Then open:

```text
http://localhost:8000/
```

Deep links: `#drive` skips the intro, `#map` opens the map, and `#<project id>` (for example `#walki`) opens that dossier.

You can also use any static server such as `npx serve` or deploy the file to Vercel, Netlify, GitHub Pages, Cloudflare Pages, or another static host.

## Controls

### Desktop

- `W A S D` / arrow keys — drive
- `Shift` — boost
- `E` — open nearby project
- `M` — map and GPS
- `L` — project list
- `G` — arcade
- `H` — horn
- `N` — drivers online
- `R` — start or join a race
- `B` — start or join a gem battle
- `Esc` — close active panel

### Mobile / tablet

Touch joystick, boost and horn controls appear automatically. Tap the radar for the map. Challenges and the arcade open as bottom sheets that you can swipe down to close, and the tour panel collapses to keep the island visible.

## About Ali

Ali Taheri Motlagh is a Software Engineer / Senior Frontend Developer with 13+ years of professional experience across frontend engineering, full-stack development, DevOps and infrastructure.

Primary skills include **TypeScript, Angular and NgRx**, with experience across Canvas, SVG, RxJS, React.js, Next.js, NestJS, Prisma, PostgreSQL, Docker, Linux and other web/infrastructure technologies.

See the full career timeline and skills inside the **About Ali** landmark.

---

Built as a portfolio that visitors can explore instead of merely scroll through.
