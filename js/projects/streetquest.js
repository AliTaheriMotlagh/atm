import { rnd, shuffle, shake, buzz, isTouch, hexNum } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { GH } from './links.js';

const project = {
  id: 'streetquest', name: 'StreetQuest', color: '#84cc16', lang: 'TypeScript · Next.js',
  tagline: 'A real-world GPS war game. Plant a base where you stand, march an army down real streets and breach rival bases in first person.',
  chips: ['Next.js', 'Three.js', 'PWA', 'Updated 7 Oct 2026'], live: true,
  repos: [{ url: GH + 'streetquest' }], site: 'https://streetquest-free.vercel.app',
  // The site sends X-Frame-Options: SAMEORIGIN, so it can't run inside the dossier.
  embed: false,
  shots: ['images/streetquest-map.jpg', 'images/streetquest-beacon.jpg', 'images/streetquest-goals.jpg'],
  pitch: {
    line: 'Strategy, life sim, RPG, tower defense and a first-person shooter, stacked on one real-world map.',
    rows: [
      ['Problem', 'Location games stop at collecting. There is no base to build, no army to march and no reason to walk into a rival\'s street.'],
      ['Solution', 'Plant a base where you stand, build on real timers, train an army, capture outposts and siege rivals. Walk within 200 m of an enemy base and you can breach it in a live first-person match.'],
      ['Who it\'s for', 'Players who like Generals, Clash of Clans and Counter-Strike, and want a reason to go outside.'],
      ['Why it stands out', 'Every layer feeds the others: hero bonuses change battle maths, mood scales XP, loot funds research and territory funds the army. Spawns, bosses and outposts are generated per map cell, so the whole world needs almost no storage.'],
      ['Status', 'Live at streetquest-free.vercel.app. Installable as an app, with a no-GPS test mode for trying it from a desk.']
    ]
  },
  design: [
    { h: 'Game layers', items: [
      'Strategy: factions, power, supply, barracks, factory, airfield and turrets on real timers. Battles auto-resolve.',
      'Life sim: Hunger, Energy, Social and Fun drain in real time, and mood scales XP and combat HP.',
      'FPS: breach an enemy base in first person, capture the zone or wipe the defenders. World bosses roam with shared HP.',
      'RPG: five hero classes, STR/AGI/INT/CHA, looted gear with rarities and affixes, and a 13-chapter campaign.',
      'Tower defense: MG nests, snipers, cannons, SAMs and Tesla coils shoot rival commanders who walk into range.'
    ] },
    { h: 'Multiplayer mini-games', items: [
      '🎯 Shooting Range: hostiles in windows, spare the civilians, reload, combos.',
      '💣 Bomb Defuse: memorise the wire sequence.',
      '🧭 Treasure Hunt (hot or cold), 🏃 Street Sprint and 🏁 Checkpoint Rally on real streets.',
      'Everyone nearby plays the same seeded round, and the winner takes the pot.'
    ] },
    { h: 'Social and live ops', items: [
      'Squads, crew pings, chat, friends, bounties and king-of-the-hill flags.',
      'Weekly world and faction goals that everyone contributes to.',
      'An admin panel where every tunable and unit stat changes live, with no redeploy.'
    ] }
  ],
  tech: {
    stack: [
      ['Framework', 'Next.js 15 (App Router), React 19, TypeScript'],
      ['Map', 'Leaflet and react-leaflet on OpenStreetMap tiles'],
      ['3D', 'Three.js for the first-person matches'],
      ['Data', 'PostgreSQL with Prisma (Neon on Vercel, Docker locally)'],
      ['Auth', 'Guest commanders kept in a signed cookie (jose); bcrypt for accounts'],
      ['Live layer', 'HTTP polling: position through `/api/loc`, notifications through `/api/sync`, matches at about 7 requests a second'],
      ['Payments', 'Stripe Checkout over REST, credited by webhook'],
      ['Platform', 'PWA with a service worker, offline map tiles and Web Push']
    ],
    arch: [{ h: 'Design decisions', items: [
      'Spawns, bosses and outposts are deterministic per map cell and time window, so everyone sees the same world with almost nothing stored.',
      'Needs decay is computed from a stored snapshot and a timestamp, so there are no background jobs.',
      'Claims use the server\'s trusted position, and GPS jumps faster than 250 km/h are rejected.',
      'Hidden treasure spots never leave the server. The client only hears hot or cold.'
    ] }],
    numbers: [['50', 'API routes'], ['5', 'hero classes'], ['13', 'campaign chapters'], ['250 km/h', 'GPS jump limit']]
  },
  docs: {
    steps: [
      { t: 'Run locally', code: 'npm install\ndocker compose up -d        # local Postgres\ncp .env.example .env\nnpx prisma db push\nnpm run db:seed\nnpm run dev                 # http://localhost:3000' },
      { t: 'Faster timers for testing', code: 'GAME_SPEED=600 npm run dev' },
      { t: 'End-to-end tests (with the dev server running)', code: 'npm run test:smoke\nnpm run test:features\nnpm run test:mp' },
      { t: 'Play on a phone (GPS needs https)', code: 'npm run tunnel   # prints a https://….trycloudflare.com link' }
    ],
    tree: 'src/\n├─ app/          pages and 50 API routes\n├─ components/   game UI, fps/, admin\n├─ lib/          pure rules shared by client and server:\n│                rts, hero, gear, td, spawns, bosses, story…\n└─ server/       match, lobby, td, warfare, goals, store'
  },
  glyph: '🪖',
  games: [
    { key: 'defuse', icon: '💣', title: 'Bomb Defuse', desc: 'Memorise the wire sequence, then cut the wires in that order before the fuse runs out.', run: gDefuse },
    { key: 'range', icon: '🎯', title: 'Shooting Range', desc: 'Hit 10 hostiles in 25 seconds. Spare the civilians, and reload when the magazine is empty.', run: gRange, record: { lower: false, fmt: v => `${v.toFixed(1)} s to spare` } },
    { key: 'hunt', icon: '🧭', title: 'Treasure Hunt', desc: 'Scan the streets for the hidden cache. Each scan only says hot or cold.', run: gHunt, record: { lower: true, fmt: v => `${v} scans` } }
  ],
  landmark
};
export default project;

/* --- Challenges --- */
function gDefuse(c) {
  const WIRES = [['red', '#ff4d4d'], ['blue', '#3aa7ff'], ['yellow', '#ffc53d'], ['green', '#2fbf71'], ['white', '#f2f5fa'], ['purple', '#a77bff']];
  const FUSE = 12;
  const wrap = c.html('<div class="defuse"><div class="bomb"><span class="fuse">--.-</span><div class="seq" aria-live="polite"></div></div><div class="wires"></div><div class="dots"><i></i><i></i><i></i></div></div>');
  const fuseEl = wrap.querySelector('.fuse'), seqEl = wrap.querySelector('.seq'), box = wrap.querySelector('.wires'), dots = wrap.querySelectorAll('.dots i');
  let round = 0, order = [], pos = 0, armed = false, left = FUSE, btns = [];
  function setup() {
    armed = false; pos = 0; left = FUSE; fuseEl.textContent = FUSE.toFixed(1);
    const wires = shuffle(WIRES.slice()).slice(0, 5);
    order = shuffle(wires.slice()).slice(0, 3 + round);
    box.innerHTML = '';
    btns = wires.map(w => {
      const b = c.el('button', 'wire'); b.style.setProperty('--w', w[1]);
      b.innerHTML = `<i aria-hidden="true"></i><span>${w[0]}</span>`; b.setAttribute('aria-label', `Cut the ${w[0]} wire`);
      b.disabled = true; b.onclick = () => cut(w, b); box.append(b); return b;
    });
    seqEl.innerHTML = order.map((w, i) => `<b style="--w:${w[1]}">${i + 1}. ${w[0]}</b>`).join('');
    c.msg(`Round ${round + 1} of 3: memorise the ${order.length} wires…`);
    c.after(1600 + order.length * 550, () => {
      seqEl.innerHTML = '<em>Cut them in order!</em>'; armed = true;
      btns.forEach(b => (b.disabled = false)); btns[0].focus({ preventScroll: true });
      c.msg('The fuse is lit. Cut in the order you saw.');
    });
  }
  function boom(text) {
    armed = false; btns.forEach(b => (b.disabled = true)); shake(wrap.querySelector('.bomb'));
    c.fail(`💥 ${text} New bomb…`); c.after(1500, setup);
  }
  function cut(w, b) {
    if (!armed || c.won) return;
    if (w !== order[pos]) { boom(`That was the ${w[0]} wire.`); return; }
    b.classList.add('cut'); b.disabled = true; pos++; sfx.tone(500 + pos * 120, 0.06, 'square', 0.04); buzz(12);
    if (pos < order.length) return;
    armed = false; dots[round].classList.add('on'); round++;
    if (round === 3) { c.win(`Three bombs defused with ${left.toFixed(1)} s on the last fuse!`); return; }
    c.msg(`Defused with ${left.toFixed(1)} s left. The next one has more wires…`, 'good'); c.after(1100, setup);
  }
  c.loop(dt => {
    if (!armed) return;
    left -= dt; fuseEl.textContent = Math.max(0, left).toFixed(1);
    if (left <= 0) boom('The fuse ran out.');
  });
  setup();
}

function gRange(c) {
  const NEED = 10, LIMIT = 25, MAG = 6;
  const wrap = c.html(`<div class="w-game"><div class="bar" aria-hidden="true"><i></i></div><div class="range"></div><div class="range-foot"><span class="ammo" aria-label="Ammo"></span><span class="count">0 / ${NEED}</span><button class="btn ghost" type="button">Reload${isTouch ? '' : ' (R)'}</button></div></div>`);
  const grid = wrap.querySelector('.range'), bar = wrap.querySelector('.bar i'), cnt = wrap.querySelector('.count'), ammoEl = wrap.querySelector('.ammo'), reloadBtn = wrap.querySelector('.btn');
  const state = new Array(8).fill(null), token = new Array(8).fill(0);
  const wins = state.map((_, i) => { const b = c.el('button', 'pane'); b.onclick = () => shoot(i); grid.append(b); return b; });
  const set = (i, s) => {
    state[i] = s; token[i]++;
    wins[i].className = 'pane' + (s ? ` up ${s}` : '');
    wins[i].textContent = s === 'foe' ? '🥷' : s === 'civ' ? '🧑‍🌾' : '';
    wins[i].setAttribute('aria-label', s === 'foe' ? 'Hostile, shoot' : s === 'civ' ? 'Civilian, hold fire' : `Empty window ${i + 1}`);
  };
  state.forEach((_, i) => set(i, null));
  let hits = 0, left = LIMIT, running = true, ammo = MAG, reloading = false, spawnIn = 0.5;
  const paintAmmo = () => { ammoEl.textContent = reloading ? 'Reloading…' : '▮'.repeat(ammo) + '▯'.repeat(MAG - ammo); };
  function reload() {
    if (!running || reloading || ammo === MAG) return;
    reloading = true; paintAmmo(); sfx.play('tick');
    c.after(800, () => { reloading = false; ammo = MAG; paintAmmo(); sfx.tone(700, 0.05, 'square', 0.04); });
  }
  function spawn() {
    const free = state.map((s, i) => (s ? -1 : i)).filter(i => i >= 0); if (!free.length) return;
    const i = free[rnd(0, free.length - 1)];
    set(i, Math.random() < 0.27 ? 'civ' : 'foe');
    const tk = token[i];
    c.after(Math.max(700, 1300 - hits * 45), () => { if (token[i] === tk) set(i, null); });
  }
  function shoot(i) {
    if (!running) return;
    if (reloading) { c.msg('Still reloading…'); return; }
    if (!ammo) { shake(ammoEl); c.fail('Click! Empty magazine. Reload.'); return; }
    ammo--; paintAmmo(); sfx.tone(180, 0.05, 'sawtooth', 0.05);
    if (state[i] === 'civ') { left = Math.max(0, left - 3); set(i, null); c.fail('Civilian! Hold your fire. −3 s'); return; }
    if (state[i] !== 'foe') { c.msg(ammo ? 'Miss.' : 'Miss. Magazine empty, reload!'); return; }
    hits++; cnt.textContent = `${hits} / ${NEED}`; buzz(12); set(i, null); sfx.tone(320 + hits * 40, 0.06, 'square', 0.05);
    if (hits >= NEED) { running = false; state.forEach((_, k) => set(k, null)); c.win(`Range cleared with ${left.toFixed(1)} s to spare!`, left); }
    else if (!ammo) c.msg('Magazine empty. Reload!');
  }
  reloadBtn.onclick = reload;
  c.key(e => { if (e.key.toLowerCase() === 'r') reload(); });
  c.loop(dt => {
    if (!running) return false;
    left -= dt; bar.style.width = Math.max(0, left / LIMIT * 100) + '%';
    spawnIn -= dt; if (spawnIn <= 0) { spawn(); spawnIn = Math.max(0.4, 0.85 - hits * 0.04); }
    if (left <= 0) { running = false; state.forEach((_, k) => set(k, null)); c.fail(`Time! ${hits} of ${NEED} hostiles. Press Restart to go again.`); return false; }
  });
  paintAmmo(); c.msg(`Hit ${NEED} hostiles 🥷. Civilians 🧑‍🌾 cost 3 seconds.`);
}

function gHunt(c) {
  const N = 8, MAX = 10;
  const cache = rnd(0, N * N - 1), cx = cache % N, cy = Math.floor(cache / N);
  const wrap = c.html('<div class="w-game"><div class="hunt" aria-label="Street map. Tap a block to scan it."></div><div class="hunt-key"><span class="hot">hot</span><span class="warm">warm</span><span class="cool">cool</span><span class="cold">cold</span></div><div class="dots"></div></div>');
  const grid = wrap.querySelector('.hunt'), dots = wrap.querySelector('.dots');
  dots.innerHTML = '<i></i>'.repeat(MAX);
  let scans = 0, over = false;
  const heat = d => d <= 1.5 ? 'hot' : d <= 3 ? 'warm' : d <= 5 ? 'cool' : 'cold';
  const cells = Array.from({ length: N * N }, (_, i) => {
    const b = c.el('button', 'blk'); b.setAttribute('aria-label', `Block ${Math.floor(i / N) + 1}, ${i % N + 1}`);
    b.onclick = () => scan(i, b); grid.append(b); return b;
  });
  function scan(i, b) {
    if (over || c.won || b.classList.contains('scanned')) return;
    scans++; dots.children[scans - 1].classList.add('on');
    const d = Math.hypot(i % N - cx, Math.floor(i / N) - cy);
    if (d === 0) { over = true; b.classList.add('scanned', 'found'); b.textContent = '💰'; c.win(`Cache found in ${scans} ${scans === 1 ? 'scan' : 'scans'}!`, scans); return; }
    const h = heat(d); b.classList.add('scanned', h); b.textContent = h === 'hot' ? '🔥' : ''; b.setAttribute('aria-label', `${b.getAttribute('aria-label')}: ${h}`);
    sfx.tone({ hot: 900, warm: 650, cool: 450, cold: 280 }[h], 0.08);
    if (scans >= MAX) {
      over = true; cells[cache].classList.add('found'); cells[cache].textContent = '💰';
      c.fail('Out of scans. The cache is marked. Press Restart for a new map.'); return;
    }
    c.msg(`${h === 'hot' ? 'Hot! It\'s right next to this block.' : h === 'warm' ? 'Warm, getting close.' : h === 'cool' ? 'Cool. Not far, not close.' : 'Cold. Try somewhere else.'} ${MAX - scans} scans left.`);
  }
  c.msg(`A supply cache is hidden in one block. You have ${MAX} scans.`);
}

/* --- Landmark (local +Z faces the island centre): a forward base with a turret, radar and range ring --- */
function landmark(g, c, { M, mat, tick }) {
  const C = hexNum(c);
  M(new THREE.CylinderGeometry(8.2, 8.6, 0.5, 8), mat(0x5f6a42), 0, 0.25, 0, g);
  // Sandbag wall around the edge, open toward the road.
  for (let i = 0; i < 22; i++) {
    const a = i / 22 * Math.PI * 2;
    if (Math.abs(Math.sin(a)) < 0.3 && Math.cos(a) > 0) continue;
    const b = M(new THREE.BoxGeometry(1.5, 0.7, 0.8), mat(0xc2b07a), Math.sin(a) * 7.2, 0.85, Math.cos(a) * 7.2, g);
    b.rotation.y = a;
  }
  // HQ bunker with a spinning radar on the roof.
  M(new THREE.BoxGeometry(6, 2.8, 4.2), mat(0x6b7350), 0, 1.9, -2.6, g);
  M(new THREE.BoxGeometry(6.6, 0.35, 4.8), mat(0x4b5238), 0, 3.45, -2.6, g);
  M(new THREE.BoxGeometry(1.6, 1.9, 0.12), mat(0x2a2d35), 0, 1.45, -0.45, g);
  const radar = new THREE.Group(); radar.position.set(-1.8, 3.6, -2.6); g.add(radar);
  M(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 6), mat(0xdfe3ea), 0, 0.7, 0, radar);
  const dish = M(new THREE.SphereGeometry(1.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3), mat(0xe8edf5, { side: THREE.DoubleSide }), 0, 1.4, 0, radar);
  dish.rotation.x = Math.PI / 2.4;
  // Faction flag.
  M(new THREE.CylinderGeometry(0.08, 0.1, 6, 8), mat(0xdfe3ea), 2.4, 6.4, -2.6, g);
  const flag = M(new THREE.BoxGeometry(0.06, 1.2, 2), mat(C), 2.4, 8.7, -1.6, g);
  // Tower-defense turret that sweeps and fires.
  const turret = new THREE.Group(); turret.position.set(3.4, 0.5, 2.6); g.add(turret);
  M(new THREE.CylinderGeometry(1.1, 1.3, 1.2, 10), mat(0x3b404c), 0, 0.6, 0, turret);
  const head = new THREE.Group(); head.position.y = 1.5; turret.add(head);
  M(new THREE.BoxGeometry(1.4, 0.8, 1.4), mat(C), 0, 0, 0, head);
  const barrel = M(new THREE.CylinderGeometry(0.14, 0.14, 2, 8), mat(0x22252c), 0, 0.1, 1.4, head); barrel.rotation.x = Math.PI / 2;
  const flash = M(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd36b }), 0, 0.1, 2.5, head, true);
  // Range ring, like the towers' rings on the real map.
  const ring = M(new THREE.RingGeometry(1, 1.3, 48), new THREE.MeshBasicMaterial({ color: C, transparent: true, side: THREE.DoubleSide }), 3.4, 0.55, 2.6, g, true);
  ring.rotation.x = -Math.PI / 2;
  tick(t => {
    radar.rotation.y = t * 1.4;
    head.rotation.y = Math.sin(t * 0.7) * 1.1;
    flash.visible = (t % 1.6) < 0.08;
    flag.rotation.y = Math.sin(t * 2.4) * 0.25;
    const k = (t * 0.45) % 1; ring.scale.setScalar(1 + k * 4); ring.material.opacity = 0.8 * (1 - k);
  });
  return { solidR: 8.4, sign: 10 };
}
