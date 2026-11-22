# Graph Report - atm  (2026-10-25)

## Corpus Check
- 64 files · ~112,721 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 25 file(s) not represented in the graph (top: .css 22, (none) 3)

## Summary
- 589 nodes · 2050 edges · 19 communities (16 shown, 3 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `16618efb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- shuffle
- net.js
- plan.js
- projects/index.js
- $
- Ali's Project Island
- bigmap.js
- CLAUDE.md
- images/README.md
- package.json
- joinRoom
- rnd
- screens.js
- preview.js
- shake
- buzz
- hexNum
- walki.js

## God Nodes (most connected - your core abstractions)
1. `$` - 124 edges
2. `buzz()` - 49 edges
3. `rnd()` - 41 edges
4. `startWorld()` - 36 edges
5. `esc()` - 35 edges
6. `hexNum()` - 34 edges
7. `shake()` - 32 edges
8. `sfx` - 27 edges
9. `selfKey()` - 26 edges
10. `clamp()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Desktop` --references--> `H()`  [INFERRED]
  README.md → js/ui/bigmap.js
- `Desktop` --references--> `M()`  [INFERRED]
  README.md → js/world/world.js
- `Radar, map and GPS` --references--> `M()`  [INFERRED]
  README.md → js/world/world.js
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

## Communities (19 total, 3 thin omitted)

### Community 0 - "shuffle"
Cohesion: 0.12
Nodes (22): shuffle(), orderGame(), gMemory(), gStack(), gTimeline(), landmark(), project, gMesh() (+14 more)

### Community 1 - "net.js"
Cohesion: 0.09
Nodes (79): toast(), store, fmtTime(), ordinal(), applyGem(), award(), battle, BATTLE_ACTIONS (+71 more)

### Community 2 - "plan.js"
Cohesion: 0.05
Nodes (103): inkFor(), TAU, battleLocked(), raceLocked(), updateGame(), TOUR, input, overlayOpen() (+95 more)

### Community 3 - "projects/index.js"
Cohesion: 0.16
Nodes (22): sfx, isTouch, keepFocus(), secs(), gSort(), project, project, project (+14 more)

### Community 4 - "$"
Cohesion: 0.06
Nodes (96): app, setMode(), confetti(), fx, emit(), handlers, on(), $ (+88 more)

### Community 5 - "Ali's Project Island"
Cohesion: 0.08
Nodes (26): M(), About Ali, Adding a project, Ali's Project Island, Billboards, Code layout, Controls, Desktop (+18 more)

### Community 6 - "bigmap.js"
Cohesion: 0.12
Nodes (38): clamp(), draw(), gCatch(), card(), draw(), gGlide(), draw(), card (+30 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (18): ws, http, rooms, send(), server, { WebSocketServer }, wss, dependencies (+10 more)

### Community 10 - "joinRoom"
Cohesion: 0.83
Nodes (4): joinRoom(), connect(), open(), retryLater()

### Community 11 - "rnd"
Cohesion: 0.16
Nodes (19): rnd(), gBinary(), gMixer(), gRhythm(), tap(), gTempo(), countIn(), tap() (+11 more)

### Community 12 - "screens.js"
Cohesion: 0.17
Nodes (17): CINEMA, FILMS, ytThumb(), buildCars(), buildCar(), nameTag(), peerCar(), puff() (+9 more)

### Community 13 - "preview.js"
Cohesion: 0.22
Nodes (17): prettyUrl(), canEmbed(), composeShots(), fitSite(), imageCache, poster(), refreshImage(), resolveImage() (+9 more)

### Community 14 - "shake"
Cohesion: 0.18
Nodes (17): shake(), gHanoi(), pick(), gRoute(), pick(), gRush(), send(), gAlarms() (+9 more)

### Community 16 - "buzz"
Cohesion: 0.19
Nodes (14): buzz(), gCoinRun(), gTagger(), pick(), show(), gReact(), press(), gReflex() (+6 more)

### Community 17 - "hexNum"
Cohesion: 0.15
Nodes (11): hexNum(), landmark(), landmark(), landmark(), landmark(), landmark(), landmark(), gHunt() (+3 more)

### Community 18 - "walki.js"
Cohesion: 0.36
Nodes (7): gFloor(), end(), start(), gHold(), landmark(), project, ptt()

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$` connect `$` to `shuffle`, `net.js`, `plan.js`, `projects/index.js`, `bigmap.js`, `rnd`, `screens.js`, `preview.js`, `shake`, `buzz`, `hexNum`, `walki.js`?**
  _High betweenness centrality (0.354) - this node is a cross-community bridge._
- **Should `shuffle` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Why does `startWorld()` connect `plan.js` to `$`, `Ali's Project Island`, `bigmap.js`, `screens.js`, `buzz`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `net.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0855386260358193 - nodes in this community are weakly interconnected._
- **Why does `buzz()` connect `buzz` to `shuffle`, `net.js`, `plan.js`, `projects/index.js`, `$`, `bigmap.js`, `shake`, `hexNum`, `walki.js`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Should `plan.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05113718673040707 - nodes in this community are weakly interconnected._
- **Should `$` be split into smaller, more focused modules?**
  _Cohesion score 0.05978705978705979 - nodes in this community are weakly interconnected._