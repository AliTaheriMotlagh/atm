# Graph Report - atm  (2026-11-25)

## Corpus Check
- 68 files · ~152,519 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 31 file(s) not represented in the graph (top: .css 23, (none) 5, .webmanifest 1)

## Summary
- 614 nodes · 2101 edges · 22 communities (18 shown, 4 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 103 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aad9db51`
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
- streetquest.js
- shake
- buzz
- core/visits.js
- walki.js
- progress.js
- gTempo

## God Nodes (most connected - your core abstractions)
1. `$` - 126 edges
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
- `Cloudflare deployment` --references--> `VisitCounter`  [INFERRED]
  README.md → worker.js
- `visits()` --calls--> `onRequest()`  [EXTRACTED]
  worker.js → functions/api/visits.js

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
Cohesion: 0.16
Nodes (14): shuffle(), gMemory(), gStack(), gMesh(), paint(), pick(), gQuiz(), answer() (+6 more)

### Community 1 - "net.js"
Cohesion: 0.08
Nodes (75): store, ordinal(), applyGem(), award(), battle, BATTLE_ACTIONS, battleBusy(), battleKey() (+67 more)

### Community 2 - "plan.js"
Cohesion: 0.05
Nodes (101): TAU, battleLocked(), raceLocked(), updateGame(), TOUR, overlayOpen(), buildCity(), builder() (+93 more)

### Community 3 - "projects/index.js"
Cohesion: 0.13
Nodes (32): sfx, hexNum(), isTouch, keepFocus(), orderGame(), secs(), gTimeline(), landmark() (+24 more)

### Community 4 - "$"
Cohesion: 0.06
Nodes (102): app, setMode(), confetti(), $, copyText(), esc(), fmt(), inkFor() (+94 more)

### Community 5 - "Ali's Project Island"
Cohesion: 0.06
Nodes (38): headers, onRequest(), readCount(), send(), writeCount(), M(), About Ali, Adding a project (+30 more)

### Community 6 - "bigmap.js"
Cohesion: 0.09
Nodes (47): clamp(), net, NET_COLORS, draw(), gCatch(), card(), draw(), gGlide() (+39 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (18): ws, http, rooms, send(), server, { WebSocketServer }, wss, dependencies (+10 more)

### Community 10 - "joinRoom"
Cohesion: 0.83
Nodes (4): joinRoom(), connect(), open(), retryLater()

### Community 11 - "rnd"
Cohesion: 0.17
Nodes (17): rnd(), gBinary(), gRhythm(), tap(), spawn(), gFair(), setup(), gMapMid() (+9 more)

### Community 12 - "screens.js"
Cohesion: 0.23
Nodes (12): CINEMA, FILMS, landmark(), ytThumb(), createScreens(), makeScreen(), drawSlide(), drawThumb() (+4 more)

### Community 13 - "streetquest.js"
Cohesion: 0.31
Nodes (7): gDefuse(), boom(), cut(), setup(), gHunt(), landmark(), project

### Community 14 - "shake"
Cohesion: 0.18
Nodes (17): shake(), gHanoi(), pick(), gRoute(), pick(), gRush(), send(), gAlarms() (+9 more)

### Community 16 - "buzz"
Cohesion: 0.21
Nodes (13): buzz(), gTagger(), pick(), show(), gLanding(), gReact(), press(), gReflex() (+5 more)

### Community 17 - "core/visits.js"
Cohesion: 1.00
Nodes (3): fmt(), initVisits(), show()

### Community 18 - "walki.js"
Cohesion: 0.36
Nodes (7): gFloor(), end(), start(), gHold(), landmark(), project, ptt()

### Community 21 - "progress.js"
Cohesion: 0.22
Nodes (17): fx, toast(), emit(), handlers, on(), fmtTime(), reduceMotion, checkWin() (+9 more)

### Community 22 - "gTempo"
Cohesion: 1.00
Nodes (3): gTempo(), countIn(), tap()

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$` connect `$` to `shuffle`, `net.js`, `plan.js`, `projects/index.js`, `bigmap.js`, `rnd`, `screens.js`, `streetquest.js`, `shake`, `buzz`, `walki.js`, `progress.js`?**
  _High betweenness centrality (0.346) - this node is a cross-community bridge._
- **Should `net.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0846312077578607 - nodes in this community are weakly interconnected._
- **Why does `startWorld()` connect `plan.js` to `$`, `Ali's Project Island`, `bigmap.js`, `screens.js`, `buzz`, `progress.js`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Should `plan.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05172413793103448 - nodes in this community are weakly interconnected._
- **Should `projects/index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12790697674418605 - nodes in this community are weakly interconnected._
- **Should `$` be split into smaller, more focused modules?**
  _Cohesion score 0.0575712143928036 - nodes in this community are weakly interconnected._
- **Should `Ali's Project Island` be split into smaller, more focused modules?**
  _Cohesion score 0.06025369978858351 - nodes in this community are weakly interconnected._