# Graph Report - atm  (2026-11-22)

## Corpus Check
- 67 files · ~114,344 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 26 file(s) not represented in the graph (top: .css 22, (none) 3, .xml 1)

## Summary
- 600 nodes · 2064 edges · 20 communities (16 shown, 4 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `27041a7e`
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
- functions/api/visits.js
- shake
- buzz
- hexNum
- walki.js

## God Nodes (most connected - your core abstractions)
1. `$` - 124 edges
2. `buzz()` - 49 edges
3. `rnd()` - 41 edges
4. `startWorld()` - 37 edges
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

## Communities (20 total, 4 thin omitted)

### Community 0 - "shuffle"
Cohesion: 0.12
Nodes (22): shuffle(), orderGame(), gMemory(), gStack(), gTimeline(), landmark(), project, gMesh() (+14 more)

### Community 1 - "net.js"
Cohesion: 0.06
Nodes (100): confetti(), fx, toast(), emit(), handlers, store, fmtTime(), ordinal() (+92 more)

### Community 2 - "plan.js"
Cohesion: 0.05
Nodes (101): reduceMotion, TAU, battleLocked(), raceLocked(), updateGame(), TOUR, input, overlayOpen() (+93 more)

### Community 3 - "projects/index.js"
Cohesion: 0.21
Nodes (17): sfx, isTouch, keepFocus(), secs(), gSort(), project, project, project (+9 more)

### Community 4 - "$"
Cohesion: 0.06
Nodes (92): app, setMode(), on(), $, copyText(), esc(), fmt(), inkFor() (+84 more)

### Community 5 - "Ali's Project Island"
Cohesion: 0.08
Nodes (26): M(), About Ali, Adding a project, Ali's Project Island, Billboards, Code layout, Controls, Desktop (+18 more)

### Community 6 - "bigmap.js"
Cohesion: 0.10
Nodes (40): net, NET_COLORS, draw(), card(), draw(), draw(), bigmap, card (+32 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (18): ws, http, rooms, send(), server, { WebSocketServer }, wss, dependencies (+10 more)

### Community 10 - "joinRoom"
Cohesion: 0.83
Nodes (4): joinRoom(), connect(), open(), retryLater()

### Community 11 - "rnd"
Cohesion: 0.14
Nodes (20): rnd(), gBinary(), gMixer(), gRhythm(), tap(), gTempo(), countIn(), tap() (+12 more)

### Community 12 - "screens.js"
Cohesion: 0.23
Nodes (12): CINEMA, FILMS, landmark(), ytThumb(), createScreens(), makeScreen(), drawSlide(), drawThumb() (+4 more)

### Community 13 - "functions/api/visits.js"
Cohesion: 0.53
Nodes (5): headers, onRequest(), readCount(), send(), writeCount()

### Community 14 - "shake"
Cohesion: 0.13
Nodes (22): shake(), gHanoi(), pick(), gRoute(), pick(), gRush(), send(), gTagger() (+14 more)

### Community 16 - "buzz"
Cohesion: 0.14
Nodes (18): buzz(), clamp(), gCoinRun(), gCatch(), gFlow(), gGlide(), gLanding(), landmark() (+10 more)

### Community 17 - "hexNum"
Cohesion: 0.19
Nodes (13): hexNum(), landmark(), landmark(), landmark(), landmark(), landmark(), landmark(), buildCars() (+5 more)

### Community 18 - "walki.js"
Cohesion: 0.36
Nodes (7): gFloor(), end(), start(), gHold(), landmark(), project, ptt()

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$` connect `$` to `shuffle`, `net.js`, `plan.js`, `projects/index.js`, `bigmap.js`, `rnd`, `screens.js`, `shake`, `buzz`, `hexNum`, `walki.js`?**
  _High betweenness centrality (0.344) - this node is a cross-community bridge._
- **Should `shuffle` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Why does `startWorld()` connect `plan.js` to `net.js`, `$`, `Ali's Project Island`, `bigmap.js`, `screens.js`, `buzz`, `hexNum`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `net.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06005056890012642 - nodes in this community are weakly interconnected._
- **Why does `buzz()` connect `buzz` to `shuffle`, `net.js`, `plan.js`, `projects/index.js`, `$`, `shake`, `walki.js`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Should `plan.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `$` be split into smaller, more focused modules?**
  _Cohesion score 0.062454212454212454 - nodes in this community are weakly interconnected._