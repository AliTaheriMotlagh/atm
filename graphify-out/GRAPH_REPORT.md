# Graph Report - atm  (2026-11-22)

## Corpus Check
- 69 files · ~115,736 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 50 file(s) not represented in the graph (top: .css 22, .sqlite 7, .sqlite-shm 7)

## Summary
- 606 nodes · 2075 edges · 22 communities (18 shown, 4 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `03222958`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- shuffle
- net.js
- plan.js
- hexNum
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
- about.js
- walki.js
- projects/index.js
- gTempo

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

## Communities (22 total, 4 thin omitted)

### Community 0 - "shuffle"
Cohesion: 0.19
Nodes (16): shuffle(), gMesh(), paint(), pick(), gQuiz(), answer(), show(), gSpin() (+8 more)

### Community 1 - "net.js"
Cohesion: 0.08
Nodes (81): confetti(), fx, toast(), store, fmtTime(), ordinal(), applyGem(), award() (+73 more)

### Community 2 - "plan.js"
Cohesion: 0.05
Nodes (102): reduceMotion, TAU, battleLocked(), raceLocked(), updateGame(), TOUR, input, overlayOpen() (+94 more)

### Community 3 - "hexNum"
Cohesion: 0.25
Nodes (15): sfx, hexNum(), isTouch, secs(), landmark(), landmark(), landmark(), HEADLINES (+7 more)

### Community 4 - "$"
Cohesion: 0.07
Nodes (82): app, setMode(), $, copyText(), esc(), fmt(), inkFor(), prettyUrl() (+74 more)

### Community 5 - "Ali's Project Island"
Cohesion: 0.07
Nodes (28): M(), About Ali, Adding a project, Ali's Project Island, Billboards, Cloudflare deployment, Code layout, Controls (+20 more)

### Community 6 - "bigmap.js"
Cohesion: 0.11
Nodes (39): clamp(), draw(), gCatch(), card(), draw(), gGlide(), draw(), card (+31 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (18): ws, http, rooms, send(), server, { WebSocketServer }, wss, dependencies (+10 more)

### Community 10 - "joinRoom"
Cohesion: 0.83
Nodes (4): joinRoom(), connect(), open(), retryLater()

### Community 11 - "rnd"
Cohesion: 0.15
Nodes (18): rnd(), gBinary(), gMixer(), gRhythm(), tap(), gHunt(), gFair(), setup() (+10 more)

### Community 12 - "screens.js"
Cohesion: 0.21
Nodes (14): buildCars(), buildCar(), nameTag(), peerCar(), puff(), createScreens(), makeScreen(), drawSlide() (+6 more)

### Community 13 - "functions/api/visits.js"
Cohesion: 0.36
Nodes (8): headers, onRequest(), readCount(), send(), writeCount(), fetch(), json(), turn()

### Community 14 - "shake"
Cohesion: 0.18
Nodes (17): shake(), gHanoi(), pick(), gRoute(), pick(), gRush(), send(), gAlarms() (+9 more)

### Community 16 - "buzz"
Cohesion: 0.18
Nodes (15): buzz(), gCoinRun(), gTagger(), pick(), show(), gLanding(), gReact(), press() (+7 more)

### Community 17 - "about.js"
Cohesion: 0.20
Nodes (8): keepFocus(), orderGame(), gMemory(), gStack(), gTimeline(), landmark(), gSort(), gFlow()

### Community 18 - "walki.js"
Cohesion: 0.43
Nodes (6): gFloor(), end(), start(), gHold(), landmark(), ptt()

### Community 21 - "projects/index.js"
Cohesion: 0.07
Nodes (48): emit(), handlers, on(), arcade, arcEl, initArcade(), initRunner(), makeCtx() (+40 more)

### Community 22 - "gTempo"
Cohesion: 1.00
Nodes (3): gTempo(), countIn(), tap()

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$` connect `$` to `shuffle`, `net.js`, `plan.js`, `hexNum`, `bigmap.js`, `rnd`, `screens.js`, `shake`, `buzz`, `about.js`, `walki.js`, `projects/index.js`?**
  _High betweenness centrality (0.339) - this node is a cross-community bridge._
- **Should `net.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08089887640449438 - nodes in this community are weakly interconnected._
- **Why does `startWorld()` connect `plan.js` to `$`, `Ali's Project Island`, `bigmap.js`, `screens.js`, `buzz`, `projects/index.js`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `plan.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05070259307547443 - nodes in this community are weakly interconnected._
- **Why does `buzz()` connect `buzz` to `shuffle`, `net.js`, `plan.js`, `hexNum`, `$`, `bigmap.js`, `shake`, `walki.js`, `projects/index.js`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Should `$` be split into smaller, more focused modules?**
  _Cohesion score 0.0694249649368864 - nodes in this community are weakly interconnected._
- **Should `Ali's Project Island` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._