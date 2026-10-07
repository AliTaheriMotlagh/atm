# Graph Report - atm  (2026-10-07)

## Corpus Check
- 56 files · ~78,848 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: .css 19, (none) 3)

## Summary
- 446 nodes · 1541 edges · 16 communities (13 shown, 3 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12874500`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- shake
- net.js
- world.js
- progress.js
- $
- Ali's Project Island
- projects/index.js
- CLAUDE.md
- images/README.md
- package.json
- buzz
- gridways.js
- rnd
- gRhythm
- gMesh

## God Nodes (most connected - your core abstractions)
1. `$` - 109 edges
2. `buzz()` - 40 edges
3. `rnd()` - 32 edges
4. `esc()` - 30 edges
5. `hexNum()` - 30 edges
6. `startWorld()` - 28 edges
7. `shake()` - 27 edges
8. `selfKey()` - 26 edges
9. `renderNet()` - 24 edges
10. `sfx` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Desktop` --references--> `M()`  [INFERRED]
  README.md → js/world/world.js
- `connect()` --indirect_call--> `add()`  [INFERRED]
  js/net/socket.js → js/projects/nexus.js
- `gMixer()` --calls--> `rnd()`  [EXTRACTED]
  js/projects/remixt.js → js/core/util.js
- `spawn()` --calls--> `rnd()`  [EXTRACTED]
  js/projects/siktir.js → js/core/util.js
- `spawn()` --calls--> `rnd()`  [EXTRACTED]
  js/projects/streetquest.js → js/core/util.js

## Import Cycles
- 3-file cycle: `js/net/net.js -> js/net/race.js -> js/ui/shell.js -> js/net/net.js`
- 3-file cycle: `js/net/panel.js -> js/net/race.js -> js/ui/shell.js -> js/net/panel.js`
- 3-file cycle: `js/net/net.js -> js/world/world.js -> js/world/cars.js -> js/net/net.js`
- 3-file cycle: `js/net/net.js -> js/world/world.js -> js/world/minimap.js -> js/net/net.js`
- 4-file cycle: `js/net/net.js -> js/net/panel.js -> js/net/race.js -> js/ui/shell.js -> js/net/net.js`
- 4-file cycle: `js/net/net.js -> js/net/race.js -> js/world/world.js -> js/world/cars.js -> js/net/net.js`
- 4-file cycle: `js/net/net.js -> js/net/race.js -> js/world/world.js -> js/world/minimap.js -> js/net/net.js`
- 4-file cycle: `js/net/net.js -> js/net/panel.js -> js/world/world.js -> js/world/cars.js -> js/net/net.js`
- 4-file cycle: `js/net/net.js -> js/net/panel.js -> js/world/world.js -> js/world/minimap.js -> js/net/net.js`
- 5-file cycle: `js/net/net.js -> js/net/race.js -> js/ui/shell.js -> js/world/world.js -> js/world/cars.js -> js/net/net.js`
- 5-file cycle: `js/net/net.js -> js/net/race.js -> js/ui/shell.js -> js/world/world.js -> js/world/minimap.js -> js/net/net.js`
- 5-file cycle: `js/net/net.js -> js/net/panel.js -> js/net/race.js -> js/world/world.js -> js/world/cars.js -> js/net/net.js`
- 5-file cycle: `js/net/net.js -> js/net/panel.js -> js/net/race.js -> js/world/world.js -> js/world/minimap.js -> js/net/net.js`

## Communities (16 total, 3 thin omitted)

### Community 0 - "shake"
Cohesion: 0.12
Nodes (24): shake(), keepFocus(), gHanoi(), pick(), gSort(), landmark(), project, gQuiz() (+16 more)

### Community 1 - "net.js"
Cohesion: 0.08
Nodes (75): store, applyGem(), award(), battle, BATTLE_ACTIONS, battleBusy(), battleKey(), battleOnPeerJoin() (+67 more)

### Community 2 - "world.js"
Cohesion: 0.08
Nodes (52): clamp(), inkFor(), TAU, CINEMA, FILMS, landmark(), ytThumb(), battleLocked() (+44 more)

### Community 3 - "progress.js"
Cohesion: 0.09
Nodes (40): confetti(), fx, toast(), emit(), handlers, on(), fmtTime(), ordinal() (+32 more)

### Community 4 - "$"
Cohesion: 0.07
Nodes (78): app, setMode(), $, copyText(), esc(), fmt(), prettyUrl(), ytWatch() (+70 more)

### Community 5 - "Ali's Project Island"
Cohesion: 0.08
Nodes (25): M(), About Ali, Adding a project, Ali's Project Island, Billboards, Code layout, Controls, Desktop (+17 more)

### Community 6 - "projects/index.js"
Cohesion: 0.15
Nodes (20): sfx, hexNum(), landmark(), project, landmark(), project, landmark(), project (+12 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (18): ws, http, rooms, send(), server, { WebSocketServer }, wss, dependencies (+10 more)

### Community 10 - "buzz"
Cohesion: 0.16
Nodes (16): buzz(), gCoinRun(), gLanding(), gReact(), press(), gReflex(), gWhack(), spawn() (+8 more)

### Community 11 - "gridways.js"
Cohesion: 0.24
Nodes (9): isTouch, shuffle(), orderGame(), secs(), gMemory(), gStack(), gTimeline(), gSpin() (+1 more)

### Community 12 - "rnd"
Cohesion: 0.23
Nodes (11): rnd(), gBinary(), gHunt(), gFair(), setup(), gMapMid(), setup(), gMidpoint() (+3 more)

### Community 13 - "gRhythm"
Cohesion: 0.50
Nodes (4): gRhythm(), gTempo(), countIn(), tap()

### Community 14 - "gMesh"
Cohesion: 1.00
Nodes (3): gMesh(), paint(), pick()

## Knowledge Gaps
- **53 isolated node(s):** `fx`, `handlers`, `arcEl`, `pgEl`, `NET_SERVER` (+48 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 72 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$` connect `$` to `shake`, `net.js`, `world.js`, `progress.js`, `projects/index.js`, `buzz`, `gridways.js`, `rnd`?**
  _High betweenness centrality (0.349) - this node is a cross-community bridge._
- **What connects `fx`, `handlers`, `arcEl` to the rest of the system?**
  _53 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `shake` be split into smaller, more focused modules?**
  _Cohesion score 0.12307692307692308 - nodes in this community are weakly interconnected._
- **Why does `startWorld()` connect `world.js` to `buzz`, `progress.js`, `$`, `Ali's Project Island`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Should `net.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0846312077578607 - nodes in this community are weakly interconnected._
- **Why does `M()` connect `Ali's Project Island` to `world.js`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Should `world.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08125 - nodes in this community are weakly interconnected._