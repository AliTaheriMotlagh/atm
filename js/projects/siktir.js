import { rnd, buzz, hexNum } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { GH } from './links.js';

const project = {
  id: 'siktir', name: 'Siktir', color: '#ff3b30', lang: 'TypeScript · Angular + NestJS',
  tagline: 'Make a "Dokme Siktir" button for any URL and share it.',
  chips: ['Angular', 'NestJS', 'Updated 16 Jul 2024'], live: true,
  repos: [{ label: 'Frontend', url: GH + 'siktir-frontend' }, { label: 'Backend', url: GH + 'siktir-backend' }],
  site: 'https://siktir-backend.onrender.com',
  inferred: 'Both READMEs are short, so this summary comes from the repository description and the files in each repo.',
  pitch: {
    line: 'دکمه سیکتیر: a big red button, for any link you like.',
    rows: [
      ['Idea', 'Paste any URL and get a shareable DokmeSiktir page for it. It\'s a playful micro-tool made for sharing in Persian-speaking group chats.'],
      ['Who it\'s for', 'Anyone who wants to send a link with some attitude.'],
      ['Why it stands out', 'A full product stack behind a joke: Angular frontend, NestJS API, a database, and Puppeteer to render pages on the server.'],
      ['Status', 'Live at siktir-backend.onrender.com. Open to collaborators.']
    ]
  },
  design: [
    { h: 'Product', items: [
      'One input: the URL. One result: a shareable page with the button.',
      'Branded logo and one-click generation keep the flow short.',
      'The backend also serves the built frontend (`frontend-dist/`), so one deploy can run the whole site.'
    ] }
  ],
  tech: {
    stack: [
      ['Frontend', 'Angular + TypeScript, Karma tests, Yarn, Netlify config (91 commits)'],
      ['Backend', 'NestJS + TypeScript'],
      ['Data', 'Prisma ORM, Docker Compose for local services'],
      ['Rendering', 'Puppeteer, for server-side page rendering and screenshots'],
      ['Deploy', 'Vercel config and a Procfile for Heroku-style hosts'],
      ['Quality', 'ESLint and Prettier']
    ],
    arch: [{ h: 'Two repositories', items: ['`siktir-frontend`: the Angular app.', '`siktir-backend`: NestJS API, Prisma schema, tests, plus the built frontend in `frontend-dist/`.'] }]
  },
  docs: {
    note: 'These are the standard Angular and NestJS commands. Check each package.json for the exact script names.',
    steps: [
      { t: 'Frontend', code: 'git clone https://github.com/AliTaheriMotlagh/siktir-frontend.git\ncd siktir-frontend\nyarn install\nyarn start          # Angular dev server' },
      { t: 'Backend', code: 'git clone https://github.com/AliTaheriMotlagh/siktir-backend.git\ncd siktir-backend\nyarn install\ndocker compose up -d\nnpx prisma migrate dev\nyarn start:dev      # NestJS watch mode' }
    ],
    tree: 'siktir-backend/\n├─ src/            NestJS modules\n├─ prisma/         schema\n├─ test/\n├─ frontend-dist/  built Angular app\n├─ docker-compose.yml\n├─ vercel.json\n└─ Procfile'
  },
  glyph: '🔘',
  // Three challenges. `run(c)` builds the game into c.body (see games/runner.js);
  // `record` keeps a personal best on this device, where `lower` means a smaller score is better.
  games: [
    { key: 'reflex', icon: '🎯', title: 'Dokme Reflex', desc: 'Hit the moving red button five times, less than 1.8 s apart.', run: gReflex, record: { lower: true, fmt: v => `${v.toFixed(2)} s` } },
    { key: 'whack', icon: '🔨', title: 'Whack-a-Link', desc: 'Smack 12 red buttons in 20 seconds. Leave the green safe links alone.', run: gWhack, record: { lower: false, fmt: v => `${v.toFixed(1)} s to spare` } },
    { key: 'react', icon: '⚡', title: 'Quick Draw', desc: 'Tap the moment the button turns red. Average under 450 ms over three tries.', run: gReact, record: { lower: true, fmt: v => `${Math.round(v)} ms` } }
  ],
  landmark
};
export default project;

/* --- Challenges --- */
function gReflex(c) {
  const arena = c.html('<div class="target-arena"><button class="siktir-target" type="button">SIKTIR</button><div class="arena-count">0 / 5</div></div>');
  const target = arena.querySelector('button'), cnt = arena.querySelector('.arena-count');
  let hits = 0, start = 0, timer = 0;
  const move = () => {
    target.style.left = Math.random() * Math.max(0, arena.clientWidth - target.offsetWidth) + 'px';
    target.style.top = Math.random() * Math.max(0, arena.clientHeight - target.offsetHeight) + 'px';
  };
  target.onclick = () => {
    if (c.won) return;
    if (!start) start = performance.now();
    hits++; cnt.textContent = `${hits} / 5`; sfx.tone(300 + hits * 90, 0.07, 'square', 0.05); buzz(15);
    c.cancel(timer);
    if (hits >= 5) { const s = (performance.now() - start) / 1000; target.disabled = true; c.win(`5 hits in ${s.toFixed(2)} s. Reflexes cleared!`, s); return; }
    move();
    timer = c.after(1800, () => { hits = 0; start = 0; cnt.textContent = '0 / 5'; c.fail('Too slow! Counter reset.'); move(); });
  };
  move(); c.msg('Hit the button 5 times, less than 1.8 s apart.');
}
function gWhack(c) {
  const NEED = 12, LIMIT = 20;
  const wrap = c.html(`<div class="w-game"><div class="bar" aria-hidden="true"><i></i></div><div class="whack"></div><div class="count">0 / ${NEED}</div></div>`);
  const grid = wrap.querySelector('.whack'), bar = wrap.querySelector('.bar i'), cnt = wrap.querySelector('.count');
  const state = new Array(9).fill(null), token = new Array(9).fill(0);
  const holes = state.map((_, i) => { const b = c.el('button', 'hole'); b.onclick = () => whack(i); grid.append(b); return b; });
  const set = (i, s) => {
    state[i] = s; token[i]++;
    holes[i].className = 'hole' + (s ? ` up ${s}` : '');
    holes[i].textContent = s === 'red' ? 'SIKTIR' : s === 'safe' ? '🔗' : '';
    holes[i].setAttribute('aria-label', s === 'red' ? 'Red button, hit it' : s === 'safe' ? 'Safe link, leave it' : `Empty hole ${i + 1}`);
  };
  state.forEach((_, i) => set(i, null));
  let score = 0, left = LIMIT, running = true, spawnIn = 0.4;
  function spawn() {
    const free = state.map((s, i) => (s ? -1 : i)).filter(i => i >= 0); if (!free.length) return;
    const i = free[rnd(0, free.length - 1)], kind = Math.random() < 0.22 ? 'safe' : 'red';
    set(i, kind);
    const tk = token[i];
    c.after(Math.max(650, 1200 - score * 40), () => { if (token[i] === tk) set(i, null); });
  }
  const clearAll = () => state.forEach((_, k) => set(k, null));
  function whack(i) {
    if (!running || !state[i]) return;
    if (state[i] === 'safe') { left = Math.max(0, left - 2); set(i, null); c.fail('That was a safe link! −2 s'); return; }
    score++; cnt.textContent = `${score} / ${NEED}`; sfx.tone(260 + score * 40, 0.06, 'square', 0.05); buzz(12); set(i, null);
    if (score >= NEED) { running = false; clearAll(); c.win(`${NEED} buttons smashed with ${left.toFixed(1)} s to spare!`, left); }
  }
  c.loop(dt => {
    if (!running) return false;
    left -= dt; bar.style.width = Math.max(0, left / LIMIT * 100) + '%';
    spawnIn -= dt; if (spawnIn <= 0) { spawn(); spawnIn = Math.max(0.35, 0.75 - score * 0.03); }
    if (left <= 0) { running = false; clearAll(); c.fail(`Time! ${score} of ${NEED}. Press Restart to go again.`); return false; }
  });
  c.msg(`Smack ${NEED} red buttons. Green links are safe, leave them.`);
}
function gReact(c) {
  const btn = c.el('button', 'react', 'Tap to start'), dots = c.el('div', 'dots');
  dots.innerHTML = '<i></i><i></i><i></i>'; c.body.append(btn, dots);
  let state = 'idle', t0 = 0, wait = 0;
  const times = [];
  const arm = () => {
    state = 'wait'; btn.className = 'react wait'; btn.textContent = 'Wait for red…';
    wait = c.after(rnd(1200, 3200), () => { state = 'go'; btn.className = 'react go'; btn.textContent = 'SIKTIR!'; t0 = performance.now(); });
  };
  function press() {
    if (state === 'idle' || state === 'next') { arm(); return; }
    if (state === 'wait') { c.cancel(wait); state = 'next'; btn.className = 'react early'; btn.textContent = 'Too soon! Tap to retry'; c.fail('False start: wait for red.'); return; }
    if (state !== 'go') return;
    const ms = performance.now() - t0; times.push(ms);
    dots.children[times.length - 1].classList.add('on'); sfx.tone(880, 0.08, 'square', 0.05); buzz(15);
    if (times.length < 3) { state = 'next'; btn.className = 'react'; btn.textContent = `${Math.round(ms)} ms · tap for the next one`; c.msg(`Try ${times.length} of 3: ${Math.round(ms)} ms`); return; }
    state = 'done';
    const avg = times.reduce((s, v) => s + v, 0) / times.length;
    btn.className = 'react'; btn.textContent = `${Math.round(avg)} ms average`;
    if (avg <= 450) c.win(`Average ${Math.round(avg)} ms (${times.map(Math.round).join(' · ')}). Lightning fingers!`, avg);
    else c.fail(`Average ${Math.round(avg)} ms. Under 450 ms clears it. Press Restart.`);
  }
  // pointerdown (not click) so the measured time doesn't include the finger lifting.
  c.on(btn, 'pointerdown', e => { if (e.button > 0) return; e.preventDefault(); press(); });
  c.key(e => { if ((e.code === 'Space' || e.key === 'Enter') && (e.target === btn || e.target.tagName !== 'BUTTON')) { e.preventDefault(); press(); } });
  btn.dataset.autofocus = '';
  c.msg('Tap to start, then tap again the instant the button turns red.');
}

/* --- Landmark (local +Z faces the island centre) --- */
function landmark(g, c, { M, mat, tick }) {
  const C = hexNum(c);
  M(new THREE.CylinderGeometry(7.5, 8, 1.2, 8), mat(0x2a2d35), 0, 0.6, 0, g);
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 32;
  const x = cv.getContext('2d'); x.fillStyle = '#ffc53d'; x.fillRect(0, 0, 512, 32); x.fillStyle = '#1b1d22';
  for (let i = -1; i < 24; i++) { x.beginPath(); x.moveTo(i * 24, 32); x.lineTo(i * 24 + 12, 32); x.lineTo(i * 24 + 24, 0); x.lineTo(i * 24 + 12, 0); x.fill(); }
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(3, 1);
  M(new THREE.CylinderGeometry(6.2, 6.2, 0.5, 48, 1, true), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }), 0, 1.45, 0, g);
  M(new THREE.CylinderGeometry(6.2, 6.2, 0.1, 48), mat(0x1b1d22), 0, 1.7, 0, g);
  M(new THREE.CylinderGeometry(5, 5.3, 1.6, 40), mat(0x3b3f4a, { metalness: 0.3, roughness: 0.5 }), 0, 2.5, 0, g);
  const cap = new THREE.Group(); cap.position.y = 3.3; g.add(cap);
  M(new THREE.CylinderGeometry(4, 4, 1.6, 40), mat(C, { roughness: 0.35, emissive: C, emissiveIntensity: 0.15 }), 0, 0.8, 0, cap);
  M(new THREE.CylinderGeometry(3.6, 4, 0.45, 40), mat(C, { roughness: 0.3, emissive: C, emissiveIntensity: 0.2 }), 0, 1.8, 0, cap);
  M(new THREE.SphereGeometry(0.9, 12, 8), mat(0xffffff, { roughness: 0.2 }), 1.6, 2, 1.2, cap).scale.set(1, 0.25, 1);
  tick(t => {
    const p = t % 3.2; const press = p > 2.5 && p < 2.95 ? Math.sin((p - 2.5) / 0.45 * Math.PI) : 0;
    cap.position.y = 3.3 - press * 0.9;
  });
  return { solidR: 8.2, sign: 10 };
}
