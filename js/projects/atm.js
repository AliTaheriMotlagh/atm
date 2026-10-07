import { rnd, shuffle, shake, clamp, buzz, isTouch, hexNum } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { secs } from '../games/kit.js';
import { GH } from './links.js';

const project = {
  id: 'atm', name: 'Project Island', color: '#d946ef', lang: 'JavaScript · Three.js',
  tagline: 'This portfolio: a drivable 3D island where every landmark is a project, with mini-games and multiplayer races.',
  chips: ['Three.js', 'WebRTC', 'Static site', 'Updated 7 Oct 2026'], live: true,
  repos: [{ url: GH + 'atm' }], site: 'https://alitaherimotlagh.vercel.app/',
  extraLinks: [{ k: 'CV', url: 'https://atm-cv.vercel.app' }],
  // You're already in it: embedding the island in itself would also add a ghost driver online.
  embed: false,
  pitch: {
    line: 'You are standing in it. A portfolio you drive through instead of scrolling past.',
    rows: [
      ['Problem', 'Portfolios are lists of cards. Visitors skim three screenshots and leave without seeing how anything works.'],
      ['Solution', 'Each project is a landmark on an island. Drive up to one to open a dossier with a live preview, notes from the README, recent commits and three mini-games themed on the project.'],
      ['Who it\'s for', 'Recruiters, engineers and friends who would rather play for two minutes than read for ten.'],
      ['Why it stands out', 'No build step and no server: plain ES modules and Three.js on a static host. Multiplayer runs browser to browser over WebRTC, and public Nostr relays are only used for matchmaking.'],
      ['Status', 'Live at alitaherimotlagh.vercel.app. You\'re already here, so this dossier shows a picture instead of a live preview.']
    ]
  },
  design: [
    { h: 'The island', items: [
      'A ring road with a landmark per project, coins to collect, billboards and a drive-in cinema for the short films.',
      'Keyboard, touch joystick and boost. The camera eases between driving and dossier views.',
      'Each landmark is photographed from the 3D scene and the picture is reused as its project image.'
    ] },
    { h: 'Games', items: [
      'Three challenges per landmark, playable from the dossier or the arcade, with personal bests saved on the device.',
      'A tour goal: every stamp, 8 coins, 3 dossiers and one challenge cleared at every project.',
      'Everyone online sees each other drive. Races are 2 laps through 8 checkpoint gates.'
    ] },
    { h: 'Accessibility', items: [
      'Focus stays inside open dialogs and returns when they close. Dossier tabs follow the WAI-ARIA tabs pattern.',
      'With reduced motion on, there is no confetti, camera sway or animated tower.',
      'Colour is never the only signal: shops, cars and wires also carry a glyph or a label.'
    ] }
  ],
  tech: {
    stack: [
      ['Runtime', 'Plain JavaScript ES modules, no build step'],
      ['3D', 'Three.js r128 on WebGL, canvas textures for signs and billboards'],
      ['Multiplayer', 'Trystero over WebRTC, Nostr relays for signalling only, 10 position updates a second'],
      ['Data', 'GitHub REST API for recent commits, localStorage for bests and preferences'],
      ['Audio', 'Web Audio API: every sound is synthesised, no audio files'],
      ['Hosting', 'Any static host (Vercel)']
    ],
    arch: [{ h: 'Code layout', items: [
      '`js/projects/`: one module per landmark with its dossier, three challenges and 3D model.',
      '`js/games/`: the challenge runner, the arcade and shared game helpers.',
      '`js/world/`: the Three.js scene, split into terrain, screens, landmarks, scenery, cars, track and minimap.',
      '`js/net/`: peer-to-peer presence and races.',
      '`js/ui/`: shell, dossier, previews, cinema, social and modals.'
    ] }],
    numbers: [['0', 'build steps'], ['0', 'servers'], ['30', 'mini-games'], ['24', 'drivers per room']]
  },
  docs: {
    note: 'The code is ES modules, so open it through a local server rather than as a file.',
    steps: [
      { t: 'Run locally', code: 'git clone https://github.com/AliTaheriMotlagh/atm.git\ncd atm\npython3 -m http.server 8000\n# open http://localhost:8000' },
      { t: 'Add a project', code: '// 1. js/projects/myproject.js\n//    export default { id, name, color, ..., games, landmark }\n// 2. add it to the list in js/projects/index.js\n// 3. optional: css/projects/myproject.css for its challenges' }
    ],
    tree: 'index.html        markup only\ncss/              base, hud, dossier, modals, net, games, projects/\njs/\n├─ main.js       boot\n├─ core/         util, store, sfx, effects, events, app state\n├─ projects/     one module per landmark\n├─ games/        runner, arcade, kit\n├─ ui/           shell, dossier, preview, cinema, social\n├─ net/          multiplayer and races\n└─ world/        the Three.js island'
  },
  glyph: '🏝️',
  games: [
    { key: 'coinrun', icon: '🪙', title: 'Coin Run', desc: 'Switch lanes to grab 12 coins. Three crashes into the cones ends the run.', run: gCoinRun, record: { lower: true, fmt: secs } },
    { key: 'mesh', icon: '🕸️', title: 'Full Mesh', desc: 'Link six drivers so everyone talks to everyone, the way the island\'s WebRTC rooms work.', run: gMesh, record: { lower: true, fmt: secs } },
    { key: 'quiz', icon: '🗺️', title: 'Landmark Quiz', desc: 'Which landmark is this? Name the project from its description. Get 7 of 8 right.', run: gQuiz }
  ],
  landmark
};
export default project;

/* --- Challenges --- */
function gCoinRun(c) {
  const NEED = 12, LIVES = 3;
  const wrap = c.html(`<div class="cv-game"><canvas tabindex="0" aria-label="Coin run. Use the left and right arrows, or tap the left or right side, to change lanes."></canvas><div class="count">🪙 0 / ${NEED} · ❤️❤️❤️</div></div>`);
  const cv = wrap.querySelector('canvas'), cnt = wrap.querySelector('.count'), x = cv.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  const size = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); c.on(window, 'resize', size);
  let lane = 1, carX = 1, coins = 0, hurt = 0, t = 0, speed = 0.55, spawnIn = 0.4, items = [], started = false, over = false, flash = 0;
  const laneX = l => W * (0.22 + l * 0.28);
  const move = d => { if (over) return; if (!started) { started = true; c.msg('Grab the coins, dodge the cones.'); } lane = clamp(lane + d, 0, 2); sfx.play('tick'); };
  c.key(e => {
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') { e.preventDefault(); move(-1); }
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') { e.preventDefault(); move(1); }
  });
  c.on(cv, 'pointerdown', e => { e.preventDefault(); cv.focus({ preventScroll: true }); const r = cv.getBoundingClientRect(); move(e.clientX - r.left < r.width / 2 ? -1 : 1); });
  function draw() {
    x.fillStyle = '#86c46d'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#3b404c'; x.fillRect(W * 0.08, 0, W * 0.84, H);
    x.fillStyle = 'rgba(255,244,214,.7)';
    const off = (t * speed * H * 1.2) % 40;
    [1, 2].forEach(k => { for (let y = -40 + off; y < H; y += 40) x.fillRect(W * (0.08 + k * 0.28) - 2, y, 4, 20); });
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `${Math.round(H * 0.11)}px system-ui, sans-serif`;
    items.forEach(it => x.fillText(it.kind === 'coin' ? '🪙' : '🚧', laneX(it.lane), it.y * H));
    const cy = H * 0.84, cx = laneX(0) + (laneX(1) - laneX(0)) * carX;
    x.save(); x.translate(cx, cy); x.globalAlpha = flash > 0 && Math.sin(flash * 40) > 0 ? 0.35 : 1;
    x.fillStyle = '#d946ef'; x.beginPath(); x.roundRect ? x.roundRect(-16, -26, 32, 52, 8) : x.rect(-16, -26, 32, 52); x.fill();
    x.fillStyle = '#24324d'; x.fillRect(-12, -12, 24, 16);
    x.fillStyle = '#fff2c0'; x.fillRect(-12, -26, 6, 4); x.fillRect(6, -26, 6, 4);
    x.restore();
    if (!started) {
      x.fillStyle = 'rgba(13,22,40,.7)'; x.fillRect(0, H / 2 - 22, W, 44);
      x.fillStyle = '#fff'; x.font = '700 15px "Atkinson Hyperlegible", system-ui, sans-serif';
      x.fillText(isTouch ? 'Tap left or right to start' : 'Press ← or → to start', W / 2, H / 2);
    }
  }
  c.loop(dt => {
    carX += (lane - carX) * Math.min(1, dt * 14);
    if (started && !over) {
      t += dt; speed = 0.55 + coins * 0.03; flash = Math.max(0, flash - dt);
      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawnIn = Math.max(0.42, 0.85 - coins * 0.03);
        const l = rnd(0, 2);
        items.push({ lane: l, y: -0.08, kind: Math.random() < 0.55 ? 'coin' : 'cone' });
        if (Math.random() < 0.3) items.push({ lane: (l + rnd(1, 2)) % 3, y: -0.08, kind: 'cone' });
      }
      items.forEach(it => { it.y += speed * dt; });
      items = items.filter(it => {
        if (it.y > 0.76 && it.y < 0.92 && it.lane === lane) {
          if (it.kind === 'coin') { coins++; sfx.play('coin'); buzz(10); }
          else if (flash <= 0) { hurt++; flash = 0.8; sfx.play('fail'); buzz(40); }
          else return true;
          cnt.textContent = `🪙 ${coins} / ${NEED} · ${'❤️'.repeat(LIVES - hurt)}${'🖤'.repeat(hurt)}`;
          return false;
        }
        return it.y < 1.1;
      });
      if (coins >= NEED) { over = true; draw(); c.win(`${NEED} coins in ${t.toFixed(1)} s. Nice driving!`, t); return false; }
      if (hurt >= LIVES) { over = true; draw(); c.fail(`Three crashes. ${coins} of ${NEED} coins. Press Restart.`); return false; }
    }
    draw();
  });
  c.msg(`Collect ${NEED} coins. Cones cost a life, and you have three.`);
}

function gMesh(c) {
  const N = 6, NEED = N * (N - 1) / 2;
  const names = shuffle(['Otter', 'Falcon', 'Gecko', 'Panda', 'Comet', 'Koala', 'Lynx', 'Pixel', 'Rocket', 'Walrus']).slice(0, N);
  const cols = ['#ffc53d', '#ff4f8b', '#36c2ff', '#2fdc8a', '#9b7bff', '#ff7a1a'];
  const pts = names.map((_, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / N; return [50 + Math.cos(a) * 36, 50 + Math.sin(a) * 36]; });
  const wrap = c.html(`<div class="w-game"><div class="mesh"><svg viewBox="0 0 100 100" aria-hidden="true"></svg></div><div class="count">Links: 0</div></div>`);
  const box = wrap.querySelector('.mesh'), svg = box.querySelector('svg'), cnt = wrap.querySelector('.count');
  const links = new Set(), key = (a, b) => a < b ? `${a}-${b}` : `${b}-${a}`;
  let sel = -1, t0 = 0;
  const nodes = names.map((n, i) => {
    const b = c.el('button', 'node'); b.style.left = pts[i][0] + '%'; b.style.top = pts[i][1] + '%'; b.style.setProperty('--c', cols[i]);
    b.innerHTML = `<i>🚗</i><small>${n}</small>`; b.onclick = () => pick(i); box.append(b); return b;
  });
  const degree = i => [...links].filter(k => k.split('-').map(Number).includes(i)).length;
  function paint() {
    svg.innerHTML = [...links].map(k => { const [a, b] = k.split('-').map(Number); return `<line x1="${pts[a][0]}" y1="${pts[a][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}"/>`; }).join('');
    nodes.forEach((b, i) => {
      const d = degree(i); b.classList.toggle('sel', i === sel); b.classList.toggle('full', d === N - 1);
      b.setAttribute('aria-label', `${names[i]}, ${d} of ${N - 1} links${i === sel ? ', selected' : ''}`);
    });
    cnt.textContent = `Links: ${links.size}`;
  }
  function pick(i) {
    if (c.won) return;
    if (!t0) t0 = performance.now();
    if (sel < 0) { sel = i; sfx.play('tick'); paint(); return; }
    if (sel === i) { sel = -1; paint(); return; }
    const k = key(sel, i);
    if (links.has(k)) { links.delete(k); sfx.tone(300, 0.06); }
    else { links.add(k); sfx.tone(520 + links.size * 25, 0.06, 'square', 0.03); }
    sel = -1; paint();
    if (links.size === NEED) { const s = (performance.now() - t0) / 1000; c.win(`Full mesh: ${NEED} links for ${N} drivers, n(n−1)/2. Done in ${s.toFixed(1)} s.`, s); }
    else c.msg(`${links.size} links. Glowing drivers are connected to everyone.`);
  }
  paint(); c.msg('Tap one driver, then another, to link them. Tap a link\'s ends again to remove it.');
}

function gQuiz(c) {
  const pool = shuffle(c.all.filter(p => !p.home && p.id !== c.p.id));
  const qs = Array.from({ length: 8 }, (_, i) => pool[i % pool.length]);
  shuffle(qs);
  const wrap = c.html('<div class="quiz"><div class="eyebrow">Question <span>1</span> of 8</div><p class="quiz-desc"></p><div class="seq-opts"></div></div>');
  const desc = wrap.querySelector('.quiz-desc'), num = wrap.querySelector('.eyebrow span'), opts = wrap.querySelector('.seq-opts');
  let q = 0, right = 0, busy = false;
  function show() {
    const p = qs[q];
    num.textContent = q + 1;
    desc.textContent = p.tagline; desc.classList.remove('in'); void desc.offsetWidth; desc.classList.add('in');
    const choices = shuffle([p, ...shuffle(pool.filter(o => o !== p)).slice(0, 3)]);
    opts.innerHTML = '';
    choices.forEach(o => { const b = c.el('button', 'opt', `${o.glyph} ${o.name}`); b.onclick = () => answer(o, b); opts.append(b); });
    opts.firstChild.focus({ preventScroll: true });
  }
  function answer(o, b) {
    if (busy || c.won || q >= qs.length) return;
    const p = qs[q], ok = o === p;
    if (ok) { right++; sfx.tone(720, 0.08); c.msg(`Yes, that's ${p.name}.`, 'good'); }
    else { shake(b); c.fail(`That's ${p.name}.`); }
    q++;
    if (q === qs.length) {
      if (right >= 7) c.win(`${right} of 8. You know the island!`);
      else c.fail(`${right} of 8. You need 7 to clear it. Open a few dossiers, then press Restart.`);
      return;
    }
    busy = true; c.after(ok ? 500 : 1300, () => { busy = false; show(); });
  }
  show(); c.msg('Read the description and pick the landmark.');
}

/* --- Landmark (local +Z faces the island centre): a tiny copy of this island --- */
function landmark(g, c, { M, mat, tick }) {
  const C = hexNum(c);
  M(new THREE.CylinderGeometry(7.6, 8.2, 1.2, 40), mat(0x2a86d6, { roughness: 0.35 }), 0, 0.6, 0, g);
  M(new THREE.CylinderGeometry(6.2, 6.7, 0.5, 40), mat(0xf0d08c), 0, 1.35, 0, g);
  M(new THREE.CylinderGeometry(5.6, 5.8, 0.5, 40), mat(0x86c46d), 0, 1.6, 0, g);
  const road = M(new THREE.RingGeometry(2.9, 3.7, 48), mat(0x3b404c), 0, 1.87, 0, g, true); road.rotation.x = -Math.PI / 2;
  // The house in the middle and a ring of tiny landmarks.
  M(new THREE.BoxGeometry(1.2, 0.9, 1.2), mat(0xf5f6f8), 0, 2.3, 0, g);
  M(new THREE.ConeGeometry(1.05, 0.7, 4), mat(0xe0533d), 0, 3.1, 0, g).rotation.y = Math.PI / 4;
  const cols = [0xff4f8b, 0xff9f1c, 0x19b39a, 0x7c5cff, 0xff3b30, 0x3178c6, 0x84cc16, 0x06b6d4, C];
  cols.forEach((col, i) => {
    const a = i / cols.length * Math.PI * 2;
    M(new THREE.BoxGeometry(0.6, 0.5 + (i % 3) * 0.35, 0.6), mat(col), Math.cos(a) * 4.7, 2.1 + (i % 3) * 0.17, Math.sin(a) * 4.7, g);
  });
  // A tiny car driving the ring road.
  const car = new THREE.Group(); g.add(car);
  M(new THREE.BoxGeometry(0.5, 0.3, 0.9), mat(C), 0, 0, 0, car);
  M(new THREE.BoxGeometry(0.42, 0.22, 0.45), mat(0x24324d), 0, 0.24, -0.08, car);
  // "You are here" marker.
  const pin = M(new THREE.OctahedronGeometry(0.9), mat(C, { emissive: C, emissiveIntensity: 0.45 }), 0, 6.4, 0, g);
  pin.scale.set(0.8, 1.3, 0.8);
  tick(t => {
    const a = t * 0.9;
    car.position.set(Math.cos(a) * 3.3, 2.05, Math.sin(a) * 3.3);
    car.rotation.y = -a;
    pin.rotation.y = t * 1.5; pin.position.y = 6.4 + Math.sin(t * 2) * 0.35;
  });
  return { solidR: 8.2, sign: 9.5 };
}
