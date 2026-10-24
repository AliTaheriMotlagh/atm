# Graph Report - atm  (2026-10-24)

## Corpus Check
- 56 files · ~79,603 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: .css 19, (none) 3)

## Summary
- 448 nodes · 1544 edges · 12 communities (9 shown, 3 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4981b67f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- rnd
- net.js
- world.js
- buzz
- $
- Ali's Project Island
- social.js
- CLAUDE.md
- images/README.md
- package.json
- joinRoom

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
- `landmark()` --calls--> `hexNum()`  [EXTRACTED]
  js/films.js → js/core/util.js
- `whack()` --calls--> `buzz()`  [EXTRACTED]
  js/projects/siktir.js → js/core/util.js
- `open()` --indirect_call--> `add()`  [INFERRED]
  js/net/socket.js → js/projects/nexus.js
- `enterDrive()` --calls--> `setMode()`  [EXTRACTED]
  js/ui/shell.js → js/core/app.js

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

## Communities (12 total, 3 thin omitted)

### Community 0 - "rnd"
Cohesion: 0.05
Nodes (76): sfx, clamp(), hexNum(), isTouch, rnd(), shake(), shuffle(), keepFocus() (+68 more)

### Community 1 - "net.js"
Cohesion: 0.08
Nodes (77): store, ordinal(), applyGem(), award(), battle, BATTLE_ACTIONS, battleBusy(), battleKey() (+69 more)

### Community 2 - "world.js"
Cohesion: 0.08
Nodes (50): reduceMotion, TAU, CINEMA, FILMS, landmark(), ytThumb(), battleLocked(), raceLocked() (+42 more)

### Community 3 - "buzz"
Cohesion: 0.09
Nodes (42): confetti(), fx, toast(), emit(), handlers, on(), buzz(), fmtTime() (+34 more)

### Community 4 - "$"
Cohesion: 0.08
Nodes (76): app, setMode(), $, copyText(), esc(), fmt(), inkFor(), prettyUrl() (+68 more)

### Community 5 - "Ali's Project Island"
Cohesion: 0.08
Nodes (25): M(), About Ali, Adding a project, Ali's Project Island, Billboards, Code layout, Controls, Desktop (+17 more)

### Community 6 - "social.js"
Cohesion: 0.29
Nodes (9): modal(), sheetSwipe(), initSocial(), liUrn(), loadX(), renderSocial(), socEl, social (+1 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (18): ws, http, rooms, send(), server, { WebSocketServer }, wss, dependencies (+10 more)

### Community 10 - "joinRoom"
Cohesion: 0.83
Nodes (4): joinRoom(), connect(), open(), retryLater()

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$` connect `$` to `rnd`, `net.js`, `world.js`, `buzz`, `social.js`?**
  _High betweenness centrality (0.347) - this node is a cross-community bridge._
- **Should `rnd` be split into smaller, more focused modules?**
  _Cohesion score 0.05306930693069307 - nodes in this community are weakly interconnected._
- **Why does `startWorld()` connect `world.js` to `rnd`, `buzz`, `$`, `Ali's Project Island`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Should `net.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08347338935574229 - nodes in this community are weakly interconnected._
- **Why does `M()` connect `Ali's Project Island` to `world.js`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Should `world.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07885304659498207 - nodes in this community are weakly interconnected._
- **Should `buzz` be split into smaller, more focused modules?**
  _Cohesion score 0.08928571428571429 - nodes in this community are weakly interconnected._