# Graph Report - atm  (2026-10-07)

## Corpus Check
- 51 files · ~51,430 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .css 19, (none) 1)

## Summary
- 413 nodes · 1498 edges · 9 communities (7 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5ce3f19a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- buzz
- race.js
- world.js
- index.js
- $
- Ali's Project Island
- preview.js
- CLAUDE.md
- images/README.md

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
- `openDossier()` --calls--> `setMode()`  [EXTRACTED]
  js/ui/dossier.js → js/core/app.js
- `toast()` --calls--> `$`  [EXTRACTED]
  js/core/effects.js → js/core/util.js
- `completeChallenge()` --calls--> `toast()`  [EXTRACTED]
  js/progress.js → js/core/effects.js
- `gameCoin()` --calls--> `toast()`  [EXTRACTED]
  js/progress.js → js/core/effects.js

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

## Communities (9 total, 2 thin omitted)

### Community 0 - "buzz"
Cohesion: 0.05
Nodes (79): sfx, buzz(), hexNum(), isTouch, rnd(), shake(), shuffle(), landmark() (+71 more)

### Community 1 - "race.js"
Cohesion: 0.09
Nodes (75): confetti(), fx, toast(), store, ordinal(), boot(), applyGem(), award() (+67 more)

### Community 2 - "world.js"
Cohesion: 0.08
Nodes (51): clamp(), reduceMotion, TAU, CINEMA, FILMS, ytThumb(), battleLocked(), raceLocked() (+43 more)

### Community 3 - "index.js"
Cohesion: 0.08
Nodes (53): app, emit(), handlers, on(), esc(), fmt(), fmtTime(), inkFor() (+45 more)

### Community 4 - "$"
Cohesion: 0.11
Nodes (45): setMode(), $, copyText(), ytWatch(), arcade, closeGame(), gameOpen(), initRunner() (+37 more)

### Community 5 - "Ali's Project Island"
Cohesion: 0.08
Nodes (24): M(), About Ali, Adding a project, Ali's Project Island, Billboards, Code layout, Controls, Desktop (+16 more)

### Community 6 - "preview.js"
Cohesion: 0.18
Nodes (21): prettyUrl(), canEmbed(), composeShots(), fitSite(), imageCache, initPreview(), isFull(), poster() (+13 more)

## Knowledge Gaps
- **37 isolated node(s):** `fx`, `handlers`, `arcEl`, `pgEl`, `netEl` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 54 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$` connect `$` to `buzz`, `race.js`, `world.js`, `index.js`, `preview.js`?**
  _High betweenness centrality (0.392) - this node is a cross-community bridge._
- **What connects `fx`, `handlers`, `arcEl` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `buzz` be split into smaller, more focused modules?**
  _Cohesion score 0.0533028745478774 - nodes in this community are weakly interconnected._
- **Why does `startWorld()` connect `world.js` to `buzz`, `race.js`, `index.js`, `$`, `Ali's Project Island`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Should `race.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0921409214092141 - nodes in this community are weakly interconnected._
- **Why does `M()` connect `Ali's Project Island` to `world.js`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Should `world.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08448540706605223 - nodes in this community are weakly interconnected._