import { rnd, shuffle, shake, isTouch, hexNum } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { secs } from '../games/kit.js';
import { GH } from './links.js';

const project = {
  id: 'gridways', name: 'Gridways', color: '#19b39a', lang: 'TypeScript',
  tagline: 'Draw the roads, keep the city moving. A mobile-first traffic puzzle in one 80 kB file.',
  chips: ['Zero dependencies', 'Canvas', 'Updated 30 Aug 2026'], live: true,
  repos: [{ url: GH + 'gridways' }], site: 'https://gridways.vercel.app',
  pitch: {
    line: 'Houses send cars to the shop that matches their colour. You draw the roads before the backlog overflows.',
    rows: [
      ['Problem', 'Good traffic puzzle games are paid apps or big downloads, and most are awkward to play on a phone in a browser.'],
      ['Solution', 'A Mini Motorways-style puzzle built for one finger. It loads as a single HTML file with one network request.'],
      ['Who it\'s for', 'Casual puzzle players on phones, and anyone with five spare minutes.'],
      ['Why it stands out', 'No runtime dependencies, procedurally generated sprites and music, and colour-blind glyphs on every building.'],
      ['Status', 'Live at gridways.vercel.app.']
    ]
  },
  design: [
    { h: 'Core loop', items: [
      'Houses spawn cars that drive to the shop of the same colour. Draw roads to connect them.',
      'The city grows every week. The game ends when a shop\'s backlog overflows.',
      'Water blocks the way, so you need bridges. Weekly upgrades offer roads, bridges, motorways, roundabouts and traffic lights.'
    ] },
    { h: 'Controls', items: [
      'One finger draws roads. Two fingers pan and zoom.',
      'Tap a building to see its connections and car routes.',
      'Keyboard: `1`–`5` pick tools, `+` `−` `0` zoom, `Esc` pauses.'
    ] },
    { h: 'Accessibility', items: ['Each colour also has a glyph (circle, square, triangle and more), so the game works for colour-blind players.'] }
  ],
  tech: {
    stack: [
      ['Language', 'Strict TypeScript'],
      ['Build', 'Vite, then inlined into one `dist/gridways.html`'],
      ['Rendering', 'Canvas 2D on two layers: static terrain and roads, dynamic cars and effects'],
      ['Simulation', 'Fixed 1/60 s timestep with interpolated rendering'],
      ['Camera', 'Board coordinates rather than pixels'],
      ['Assets', 'Sprites and music generated in code'],
      ['Performance', 'No memory allocation in hot paths']
    ],
    arch: [{ h: 'Modules', items: [
      '`core/`: Loop, EventBus, Pool',
      '`engine/`: Viewport, Input, audio',
      '`game/`: Grid, MapGen, RoadNetwork, Pathfinder',
      '`systems/`: Traffic, City, Builder (the only state mutators)',
      '`render/`: canvas drawing',
      '`ui/`: Shell, icons, styles'
    ] }],
    numbers: [['~80 kB', 'whole game'], ['~24 kB', 'gzipped'], ['1', 'network request'], ['0', 'runtime deps']]
  },
  docs: {
    steps: [
      { t: 'Install and run', code: 'git clone https://github.com/AliTaheriMotlagh/gridways.git\ncd gridways\nnpm install\nnpm run dev        # Vite dev server' },
      { t: 'Build the single-file game', code: 'npm run build      # type-check, bundle, inline to dist/gridways.html' },
      { t: 'Checks', code: 'npm run typecheck\nnode scripts/verify.mjs   # headless test run' }
    ],
    tree: 'src/\n├─ core/      Loop, EventBus, Pool\n├─ engine/    Viewport, Input, audio\n├─ game/      Grid, MapGen, RoadNetwork, Pathfinder\n├─ systems/   Traffic, City, Builder\n├─ render/    canvas rendering\n└─ ui/        Shell, icons, styles'
  },
  glyph: '🚦',
  // Three challenges. `run(c)` builds the game into c.body (see games/runner.js);
  // `record` keeps a personal best on this device, where `lower` means a smaller score is better.
  games: [
    { key: 'route', icon: '🛣️', title: 'Route Builder', desc: 'Lay road from the house to the shop around the water. Tap the last tile to undo.', run: gRoute },
    { key: 'rush', icon: '🚗', title: 'Rush Hour', desc: 'Send 12 cars to the shop with the same colour and shape before time runs out.', run: gRush, record: { lower: true, fmt: secs } },
    { key: 'spin', icon: '🔄', title: 'Road Spin', desc: 'Rotate tiles until one road runs from the house to the shop.', run: gSpin, record: { lower: true, fmt: v => `${v} taps` } }
  ],
  landmark
};
export default project;

/* --- Challenges --- */
function gRoute(c) {
  const N = 5, START = 20, GOAL = 4;
  const nb = i => [i - N, i + N, i % N ? i - 1 : -1, i % N < N - 1 ? i + 1 : -1].filter(j => j >= 0 && j < N * N);
  const shortest = water => {
    const dist = { [START]: 0 }, q = [START];
    while (q.length) { const i = q.shift(); for (const j of nb(i)) if (!water.has(j) && dist[j] == null) { dist[j] = dist[i] + 1; q.push(j); } }
    return dist[GOAL];
  };
  // Random water, but always solvable and preferably forcing a detour.
  let water, best;
  for (let tries = 0; ; tries++) {
    water = new Set();
    while (water.size < 8) { const i = rnd(0, N * N - 1); if (i !== START && i !== GOAL) water.add(i); }
    best = shortest(water);
    if (best != null && (best >= 10 || tries > 300)) break;
  }
  const grid = c.el('div', 'road-grid'); c.body.append(grid);
  const path = [START];
  const cells = Array.from({ length: N * N }, (_, i) => {
    const b = c.el('button', 'road-cell'); grid.append(b);
    if (water.has(i)) { b.classList.add('block'); b.textContent = '🌊'; b.disabled = true; b.setAttribute('aria-label', 'Water'); }
    else if (i === START) { b.classList.add('start', 'path'); b.textContent = '🏠'; b.setAttribute('aria-label', 'House, start'); }
    else if (i === GOAL) { b.classList.add('goal'); b.textContent = '🏪'; b.setAttribute('aria-label', 'Shop, goal'); }
    else b.setAttribute('aria-label', `Row ${Math.floor(i / N) + 1}, column ${i % N + 1}`);
    b.onclick = () => pick(i);
    return b;
  });
  const paint = () => cells.forEach((b, i) => {
    if (water.has(i) || i === START) return;
    b.classList.toggle('path', path.includes(i));
    b.classList.toggle('tip', i === path[path.length - 1]);
  });
  function pick(i) {
    if (c.won) return;
    const last = path[path.length - 1];
    if (i === last && i !== START) { path.pop(); sfx.play('tick'); paint(); c.msg(`${path.length - 1} tiles laid.`); return; }
    if (path.includes(i)) { c.msg('Tap the last tile to undo.', 'bad'); return; }
    if (!nb(last).includes(i)) { shake(cells[i]); c.fail('Road tiles must touch the end of your route.'); return; }
    path.push(i); sfx.tone(480 + path.length * 25, 0.06, 'square', 0.03); paint();
    if (i === GOAL) {
      const len = path.length - 1;
      c.win(len === best ? `Optimal route: ${len} tiles!` : `Route complete in ${len} tiles. The shortest is ${best}.`);
    } else c.msg(`${path.length - 1} tiles laid.`);
  }
  c.msg('Tap tiles next to the end of the road to reach the shop.');
}
function gRush(c) {
  const SH = [{ n: 'red', c: '#ff5a5f', g: '●', ink: '#fff' }, { n: 'blue', c: '#3aa7ff', g: '■', ink: '#0a1222' }, { n: 'yellow', c: '#ffc53d', g: '▲', ink: '#1d1500' }];
  const NEED = 12, LIMIT = 20;
  const wrap = c.html(`<div class="w-game"><div class="bar" aria-hidden="true"><i></i></div><div class="rush-road"><div class="rush-car" role="img"></div></div><div class="count">0 / ${NEED} delivered</div><div class="rush-shops"></div></div>`);
  const car = wrap.querySelector('.rush-car'), bar = wrap.querySelector('.bar i'), count = wrap.querySelector('.count'), shops = wrap.querySelector('.rush-shops');
  SH.forEach((s, i) => {
    const b = c.el('button', 'shop'); b.style.setProperty('--s', s.c); b.style.color = s.ink;
    b.innerHTML = `<span aria-hidden="true">${s.g}</span><small>${isTouch ? s.n : `${i + 1} · ${s.n}`}</small>`;
    b.setAttribute('aria-label', `${s.n} shop`); b.onclick = () => send(i); shops.append(b);
  });
  let cur = -1, done = 0, left = LIMIT, running = true;
  const t0 = performance.now();
  const nextCar = () => {
    let n; do n = rnd(0, 2); while (n === cur && Math.random() < 0.5);
    cur = n; car.style.background = SH[n].c; car.style.color = SH[n].ink;
    car.innerHTML = `🚗<b>${SH[n].g}</b>`; car.setAttribute('aria-label', `${SH[n].n} car`);
    car.classList.remove('in'); void car.offsetWidth; car.classList.add('in');
  };
  function send(i) {
    if (!running) return;
    if (i !== cur) { left -= 1.5; shake(car); c.fail(`Wrong shop, that car is ${SH[cur].n}. −1.5 s`); return; }
    done++; count.textContent = `${done} / ${NEED} delivered`; sfx.tone(640 + done * 30, 0.06, 'square', 0.035);
    if (done < NEED) { nextCar(); return; }
    running = false;
    const s = (performance.now() - t0) / 1000;
    c.win(`All ${NEED} cars delivered in ${s.toFixed(1)} s!`, s);
  }
  c.key(e => { const n = +e.key; if (n >= 1 && n <= 3) send(n - 1); });
  c.loop(dt => {
    if (!running) return false;
    left -= dt; bar.style.width = Math.max(0, left / LIMIT * 100) + '%';
    if (left <= 0) { running = false; c.fail(`Gridlock! ${done} of ${NEED} delivered. Press Restart to go again.`); return false; }
  });
  nextCar(); c.msg('Match each car to its shop by colour or shape.');
}
function gSpin(c) {
  const R = 4, C = 4, N = 1, E = 2, S = 4, W = 8;
  const rot = (m, k) => { for (let i = 0; i < (k & 3); i++) m = ((m << 1) | (m >> 3)) & 15; return m; };
  const DIRS = [[N, -1, 0], [E, 0, 1], [S, 1, 0], [W, 0, -1]];
  const r0 = rnd(0, R - 1), r1 = rnd(0, R - 1);
  // Random depth-first walk from the house (left of r0) to the shop (right of r1).
  const cells = [], seen = new Set();
  (function dfs(r, col) {
    seen.add(r * C + col); cells.push([r, col]);
    if (r === r1 && col === C - 1) return true;
    for (const [, dr, dc] of shuffle(DIRS.slice())) {
      const nr = r + dr, nc = col + dc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && !seen.has(nr * C + nc) && dfs(nr, nc)) return true;
    }
    cells.pop(); return false;
  })(r0, 0);
  const base = new Array(R * C).fill(0);
  cells.forEach(([r, col], k) => {
    const prev = k ? cells[k - 1] : [r, col - 1], next = k < cells.length - 1 ? cells[k + 1] : [r, col + 1];
    const dirTo = ([rr, cc]) => rr < r ? N : rr > r ? S : cc > col ? E : W;
    base[r * C + col] = dirTo(prev) | dirTo(next);
  });
  base.forEach((m, i) => { if (!m) base[i] = Math.random() < 0.5 ? (N | S) : (N | E); });
  const spins = base.map(() => rnd(0, 3));
  const mask = i => rot(base[i], spins[i]);
  // Follows the road from the house; returns the connected tiles and whether it reaches the shop.
  const trace = () => {
    const lit = new Set(); let r = r0, col = 0, from = W;
    while (r >= 0 && r < R && col >= 0 && col < C && !lit.has(r * C + col)) {
      const m = mask(r * C + col);
      if (!(m & from)) break;
      lit.add(r * C + col);
      const out = m & ~from;
      if (r === r1 && col === C - 1 && out === E) return { lit, ok: true };
      const d = DIRS.find(([b]) => b === out); if (!d) break;
      r += d[1]; col += d[2]; from = rot(out, 2);
    }
    return { lit, ok: false };
  };
  while (trace().ok) spins.forEach((_, i) => (spins[i] = rnd(0, 3)));
  const grid = c.el('div', 'spin'); c.body.append(grid);
  const svgFor = m => `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="${[[N, 'M20 20V0'], [E, 'M20 20H40'], [S, 'M20 20V40'], [W, 'M20 20H0']].filter(([b]) => m & b).map(([, d]) => d).join('')}"/></svg>`;
  const tiles = [];
  for (let r = 0; r < R; r++) {
    grid.append(c.el('span', 'mark', r === r0 ? '🏠' : ''));
    for (let col = 0; col < C; col++) {
      const i = r * C + col, b = c.el('button', 'tile');
      b.innerHTML = svgFor(base[i]); b.setAttribute('aria-label', `Tile row ${r + 1}, column ${col + 1}. Tap to rotate`);
      b.onclick = () => spin(i); grid.append(b); tiles[i] = b;
    }
    grid.append(c.el('span', 'mark', r === r1 ? '🏪' : ''));
  }
  let taps = 0;
  const paint = () => {
    const { lit, ok } = trace();
    tiles.forEach((b, i) => { b.firstChild.style.transform = `rotate(${spins[i] * 90}deg)`; b.classList.toggle('lit', lit.has(i)); });
    return ok;
  };
  function spin(i) {
    if (c.won) return;
    spins[i]++; taps++; sfx.play('tick');
    if (paint()) c.win(`Connected in ${taps} taps. Traffic is flowing!`, taps);
  }
  paint(); c.msg('Tap a tile to turn it. Coloured tiles are connected to the house.');
}

/* --- Landmark (local +Z faces the island centre) --- */
function landmark(g, c, { M, mat, tick }) {
  const C = hexNum(c);
  M(new THREE.BoxGeometry(14, 0.6, 14), mat(0xeef2f4), 0, 0.3, 0, g);
  [-3.5, 3.5].forEach(k => {
    M(new THREE.BoxGeometry(14, 0.06, 1.5), mat(0x4a505c), 0, 0.63, k, g, true);
    M(new THREE.BoxGeometry(1.5, 0.061, 14), mat(0x4a505c), k, 0.63, 0, g, true);
  });
  M(new THREE.BoxGeometry(14, 0.07, 2.2), mat(0x3aa7ff, { roughness: 0.3 }), 0, 0.64, 6.0, g, true);
  M(new THREE.BoxGeometry(1.6, 0.35, 2.6), mat(0xc9a36b), 3.5, 0.8, 6.0, g);
  const cols = [0xff5a5f, 0x3aa7ff, 0xffc53d];
  const cells = [-5.6, 0, 5.6];
  const shops = { '0,-5.6': 0, '5.6,0': 1, '-5.6,0': 2 };
  cells.forEach(x => cells.forEach(z => {
    if (z === 5.6 || (x === 0 && z === 0)) return;
    const key = `${x},${z}`;
    if (key in shops) {
      M(new THREE.BoxGeometry(2.6, 1.7, 2.6), mat(cols[shops[key]]), x, 1.45, z, g);
      M(new THREE.BoxGeometry(2.7, 0.3, 2.7), mat(0xffffff), x, 2.4, z, g);
    } else {
      for (let k = 0; k < 2; k++) {
        const ci = (Math.abs(x * 3 + z) + k) % 3 | 0;
        const hx = x + (k ? 0.8 : -0.8), hz = z + (k ? -0.6 : 0.6);
        M(new THREE.BoxGeometry(1.2, 0.9, 1.2), mat(0xfaf7f2), hx, 1.05, hz, g);
        const r = M(new THREE.ConeGeometry(1.0, 0.8, 4), mat(cols[ci]), hx, 1.9, hz, g); r.rotation.y = Math.PI / 4;
      }
    }
  }));
  M(new THREE.CylinderGeometry(1.1, 1.1, 0.4, 20), mat(C), 0, 0.8, 0, g);
  const corners = [[-3.5, -3.5], [3.5, -3.5], [3.5, 3.5], [-3.5, 3.5]];
  const loop = s => { s = ((s % 4) + 4) % 4; const i = Math.floor(s), f = s - i, a = corners[i], b = corners[(i + 1) % 4]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; };
  const cars = [];
  for (let i = 0; i < 7; i++) { const m = M(new THREE.BoxGeometry(0.7, 0.5, 1.1), mat(cols[i % 3]), 0, 0.9, 0, g); cars.push({ m, o: i * 4 / 7 }); }
  tick(t => cars.forEach(cr => {
    const s = t * 0.22 + cr.o, [x, z] = loop(s), [nx, nz] = loop(s + 0.02);
    cr.m.position.set(x, 0.9, z); cr.m.rotation.y = Math.atan2(nx - x, nz - z);
  }));
  return { solidR: 10, sign: 8 };
}
