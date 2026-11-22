# Graph Report - atm  (2026-11-22)

## Corpus Check
- 67 files · ~115,309 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 27 file(s) not represented in the graph (top: .css 22, (none) 4, .xml 1)

## Summary
- 602 nodes · 2066 edges · 23 communities (19 shown, 4 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6471375b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- shuffle
- net.js
- plan.js
- sfx.js
- $
- Ali's Project Island
- world.js
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
- preview.js
- streetquest.js
- gRhythm

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

## Communities (23 total, 4 thin omitted)

### Community 0 - "shuffle"
Cohesion: 0.16
Nodes (14): shuffle(), gMemory(), gStack(), gMesh(), paint(), pick(), gQuiz(), answer() (+6 more)

### Community 1 - "net.js"
Cohesion: 0.08
Nodes (78): confetti(), fx, toast(), store, ordinal(), applyGem(), award(), battle (+70 more)

### Community 2 - "plan.js"
Cohesion: 0.06
Nodes (79): TAU, net, NET_COLORS, buildCity(), builder(), box(), geo(), quad() (+71 more)

### Community 3 - "sfx.js"
Cohesion: 0.20
Nodes (16): sfx, isTouch, reduceMotion, keepFocus(), secs(), gSort(), project, project (+8 more)

### Community 4 - "$"
Cohesion: 0.06
Nodes (97): app, setMode(), emit(), handlers, on(), $, copyText(), esc() (+89 more)

### Community 5 - "Ali's Project Island"
Cohesion: 0.07
Nodes (28): M(), About Ali, Adding a project, Ali's Project Island, Billboards, Cloudflare Pages deployment, Code layout, Controls (+20 more)

### Community 6 - "world.js"
Cohesion: 0.06
Nodes (68): clamp(), battleLocked(), raceLocked(), gameCoin(), gameStamp(), updateGame(), gCoinRun(), draw() (+60 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (18): ws, http, rooms, send(), server, { WebSocketServer }, wss, dependencies (+10 more)

### Community 10 - "joinRoom"
Cohesion: 0.83
Nodes (4): joinRoom(), connect(), open(), retryLater()

### Community 11 - "rnd"
Cohesion: 0.29
Nodes (11): rnd(), gBinary(), gMixer(), gFair(), setup(), gMapMid(), setup(), gMidpoint() (+3 more)

### Community 12 - "screens.js"
Cohesion: 0.23
Nodes (12): CINEMA, FILMS, landmark(), ytThumb(), createScreens(), makeScreen(), drawSlide(), drawThumb() (+4 more)

### Community 13 - "functions/api/visits.js"
Cohesion: 0.53
Nodes (5): headers, onRequest(), readCount(), send(), writeCount()

### Community 14 - "shake"
Cohesion: 0.18
Nodes (17): shake(), gHanoi(), pick(), gRoute(), pick(), gRush(), send(), gAlarms() (+9 more)

### Community 16 - "buzz"
Cohesion: 0.18
Nodes (15): buzz(), gTagger(), pick(), show(), gReact(), press(), gReflex(), gWhack() (+7 more)

### Community 17 - "hexNum"
Cohesion: 0.13
Nodes (18): hexNum(), orderGame(), gTimeline(), landmark(), project, landmark(), landmark(), landmark() (+10 more)

### Community 18 - "walki.js"
Cohesion: 0.36
Nodes (7): gFloor(), end(), start(), gHold(), landmark(), project, ptt()

### Community 19 - "preview.js"
Cohesion: 0.22
Nodes (17): prettyUrl(), canEmbed(), composeShots(), fitSite(), imageCache, poster(), resolveImage(), setCaption() (+9 more)

### Community 21 - "streetquest.js"
Cohesion: 0.31
Nodes (7): gDefuse(), boom(), cut(), setup(), gHunt(), landmark(), project

### Community 22 - "gRhythm"
Cohesion: 0.32
Nodes (8): gRhythm(), tap(), gTempo(), countIn(), tap(), gQueue(), play(), tap()

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$` connect `$` to `shuffle`, `net.js`, `plan.js`, `sfx.js`, `world.js`, `rnd`, `screens.js`, `shake`, `buzz`, `hexNum`, `walki.js`, `preview.js`, `streetquest.js`?**
  _High betweenness centrality (0.344) - this node is a cross-community bridge._
- **Should `net.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08313285217856188 - nodes in this community are weakly interconnected._
- **Why does `startWorld()` connect `world.js` to `plan.js`, `$`, `Ali's Project Island`, `screens.js`, `buzz`, `hexNum`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `plan.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05860805860805861 - nodes in this community are weakly interconnected._
- **Why does `buzz()` connect `buzz` to `shuffle`, `net.js`, `sfx.js`, `$`, `world.js`, `shake`, `hexNum`, `walki.js`, `streetquest.js`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Should `$` be split into smaller, more focused modules?**
  _Cohesion score 0.06163084702907712 - nodes in this community are weakly interconnected._
- **Should `Ali's Project Island` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._