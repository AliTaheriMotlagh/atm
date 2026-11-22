import { clamp, rnd, shuffle, shake, buzz, isTouch, hexNum } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { secs } from '../games/kit.js';
import { GH } from './links.js';

const project = {
  id: 'khabar', name: 'Khabar', color: '#2f4fd8', lang: 'TypeScript · Astro + Python',
  tagline: 'Future Focus: a Persian AI and tech news site that builds itself from a Telegram channel every 20 minutes.',
  chips: ['Astro', 'Telegram → web', 'Updated 25 Oct 2026'], live: true,
  repos: [{ url: GH + 'khabar' }], site: 'https://blog.remixt.app',
  // The site sends X-Frame-Options: SAMEORIGIN, so the dossier links out instead of embedding it.
  embed: false,
  shots: ['images/khabar-home.jpg', 'images/khabar-story.jpg', 'images/khabar-today.jpg'],
  pitch: {
    line: 'فیوچر فوکوس: every post on the @dlmehr channel becomes a Persian news story, with images, video and the original source.',
    rows: [
      ['Problem', 'Good AI and tech news in Persian lives inside a Telegram channel: hard to search, hard to share, and gone once it scrolls away.'],
      ['Solution', 'A crawler turns every channel post into a story page. The Persian text is Gholam\'s translation (the first comment under each post), and the site rebuilds itself whenever news arrives.'],
      ['Who it\'s for', 'Persian readers following AI, chips, robotics and science, and the channel owner, Mehrzad Samadi, who gets a full website for free.'],
      ['Why it stands out', 'Zero editorial work, free hosting, and the reading features of a real news app: a daily 24-hour brief, listen aloud, offline reading, streaks, badges and a live chat.'],
      ['Status', 'Live at khabar-ai.vercel.app, with a GitHub Pages mirror. Crawls every 20 minutes.']
    ]
  },
  design: [
    { h: 'Reading', items: [
      'A visual timeline grouped by day, a lead section, and a short headline-list view. The daily "24-hour summary" links each line to its story.',
      'Reading tools on every story: listen aloud, text size and line spacing, focus mode, time left, "continue where you left off" and quote sharing.',
      'Long-press any story link to preview it. `/today/` plays the day\'s stories as an auto-playing vertical video.'
    ] },
    { h: 'Community without signup', items: [
      'Guest reactions, comments, a live chat, "online now" and visit counters.',
      'Points, levels, badges, daily streaks and a weekly leaderboard. New stories since your last visit are marked until you read them.'
    ] },
    { h: 'Everywhere', items: [
      'Installable as an app, offline reading through a service worker, light and dark themes.',
      'Canonical URLs, Open Graph cards, NewsArticle structured data, a Google News sitemap, RSS and Pagefind search.'
    ] }
  ],
  tech: {
    stack: [
      ['Site', 'Astro 7 static build, one stylesheet with light/dark tokens, Vazirmatn font'],
      ['Crawler', 'Python (httpx + BeautifulSoup) reads `t.me/s/dlmehr` and Gholam\'s comment from each discussion'],
      ['Sources', 'Linked tweets through api.fxtwitter.com and linked pages. Media is never downloaded: stories keep the original URLs'],
      ['API', 'Vercel Functions in plain ESM JavaScript: comments, reactions, live presence, chat, leaders, TTS and sync'],
      ['Storage', 'Upstash Redis over REST, batched into one pipeline per page to stay on the free tier'],
      ['Voice', 'Device Persian voice, else Azure AI Speech (`fa-IR-DilaraNeural`), cached per paragraph on the CDN'],
      ['Search', 'Pagefind, built after Astro'],
      ['Automation', 'GitHub Actions: crawl → commit `data/` → build → deploy, every 20 minutes']
    ],
    arch: [
      { h: 'How a post becomes a story', ordered: true, items: [
        'The workflow crawls the channel and writes `data/posts/<id>.json`.',
        '`lib/posts.ts` shapes each post into a story, a digest or a brief, and tags it from keyword topics.',
        'A commit to `main` redeploys Vercel; GitHub Pages gets a mirror. A crawl with nothing new stops before the build.',
        'Open pages poll a static `build.json` and offer "news arrived" when a newer build is live.'
      ] },
      { h: 'Tests', items: ['Node tests for the API, Tehran dates and the built site against `data/`.', 'Pytest for the crawler.'] }
    ],
    numbers: [['20 min', 'crawl cadence'], ['0', 'editors'], ['9', 'API functions'], ['$0', 'hosting']]
  },
  docs: {
    steps: [
      { t: 'Crawl the channel', code: 'git clone https://github.com/AliTaheriMotlagh/khabar.git\ncd khabar\npython3 -m venv .venv && .venv/bin/pip install -r pipeline/requirements.txt pytest\n.venv/bin/python -m pipeline.run       # PAGES=10 to backfill' },
      { t: 'Run the site', code: 'npm ci\nnpm run dev                            # site only, http://localhost:4321\nnpm run build && npm run serve         # site + API (in-memory), http://localhost:4322' },
      { t: 'Test', code: 'npm test\n.venv/bin/python -m pytest -q pipeline/tests' }
    ],
    tree: 'khabar/\n├─ pipeline/   Python crawler: telegram, enrich, shape\n├─ data/posts/ one JSON file per post\n├─ src/\n│  ├─ lib/       posts, Tehran time\n│  ├─ components/\n│  ├─ pages/     timeline, stories, today, tags, search\n│  └─ scripts/   reader, player, game, social, speech\n├─ api/        Vercel Functions\n└─ .github/workflows/site.yml',
    extra: [{ h: 'Deploy', items: [
      'Vercel (framework: Astro), then connect Upstash Redis for comments, reactions, chat and counters.',
      'Optional: `AZURE_SPEECH_KEY` for Persian voice on iPhone, `GITHUB_DISPATCH_TOKEN` for the "update from the channel" button.'
    ] }]
  },
  glyph: '📰',
  games: [
    { key: 'tagger', icon: '🏷️', title: 'Topic Tagger', desc: 'Tag 8 headlines with the right topic in 30 seconds. One mistake allowed.', run: gTagger, record: { lower: true, fmt: secs } },
    { key: 'catch', icon: '📥', title: 'Channel Catch', desc: 'Catch 15 Persian stories as they drop from the channel. Catching an English digest costs a life.', run: gCatch, record: { lower: true, fmt: secs } },
    { key: 'streak', icon: '🔥', title: 'Keep the Streak', desc: 'Seven days in a row: tap the story marked new before it scrolls away.', run: gStreak, record: { lower: true, fmt: v => `${Math.round(v)} ms` } }
  ],
  landmark
};
export default project;

/* --- Challenges --- */
const TOPICS = [
  { k: 'ai', label: '🤖 AI models' },
  { k: 'chips', label: '🔌 Chips' },
  { k: 'robots', label: '🦾 Robotics' },
  { k: 'space', label: '🚀 Space' },
  { k: 'apps', label: '📱 Apps' }
];
const HEADLINES = [
  ['A new open-weights model tops the coding benchmark', 'ai'],
  ['Chatbot learns to reason step by step before it answers', 'ai'],
  ['Lab trains a language model on a tenth of the usual compute', 'ai'],
  ['Image model now makes one-minute videos from a prompt', 'ai'],
  ['Foundry starts mass production of 2 nm wafers', 'chips'],
  ['New GPU doubles memory bandwidth for data centres', 'chips'],
  ['Export rules tighten on high-end AI accelerators', 'chips'],
  ['Phone chip packs a neural engine twice as fast', 'chips'],
  ['Humanoid robot folds laundry in a real home', 'robots'],
  ['Robot dog learns to climb stairs in simulation first', 'robots'],
  ['Warehouse arms now pick items they have never seen', 'robots'],
  ['Surgeons test a robot that stitches on its own', 'robots'],
  ['Booster lands back on the launch tower', 'space'],
  ['Telescope spots water vapour on a distant planet', 'space'],
  ['Moon lander sends its first photos home', 'space'],
  ['Satellite internet reaches phones with no dish', 'space'],
  ['Messaging app adds live translation to voice notes', 'apps'],
  ['Browser ships a built-in assistant that reads pages', 'apps'],
  ['Maps app now routes you around traffic before it forms', 'apps'],
  ['Photo app removes strangers from your pictures in one tap', 'apps']
];

function gTagger(c) {
  const N = 8, LIMIT = 30;
  const qs = shuffle(HEADLINES.slice()).slice(0, N);
  const wrap = c.html(`<div class="w-game kh-tag"><div class="bar" aria-hidden="true"><i></i></div><article class="kh-card"><span class="kh-src">@dlmehr · <span>1</span>/${N}</span><p></p></article><div class="kh-topics"></div><div class="count">0 tagged · 0 mistakes</div></div>`);
  const bar = wrap.querySelector('.bar i'), card = wrap.querySelector('.kh-card'), title = card.querySelector('p'), num = card.querySelector('.kh-src span');
  const opts = wrap.querySelector('.kh-topics'), cnt = wrap.querySelector('.count');
  let q = 0, bad = 0, t = 0, running = true;
  const btns = TOPICS.map(tp => {
    const b = c.el('button', 'opt', tp.label);
    b.onclick = () => pick(tp.k, b); opts.append(b); return b;
  });
  function show() {
    title.textContent = qs[q][0]; num.textContent = q + 1;
    card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');
  }
  function pick(k, b) {
    if (!running) return;
    if (k !== qs[q][1]) {
      bad++; shake(b); cnt.textContent = `${q} tagged · ${bad} mistake${bad === 1 ? '' : 's'}`;
      if (bad > 1) { running = false; c.fail(`Second mistake: that one was ${TOPICS.find(tp => tp.k === qs[q][1]).label}. Press Restart.`); return; }
      c.fail('Wrong tag. One more mistake ends the round.'); return;
    }
    sfx.tone(520 + q * 40, 0.07); buzz(10);
    q++; cnt.textContent = `${q} tagged · ${bad} mistake${bad === 1 ? '' : 's'}`;
    if (q >= N) { running = false; c.win(`${N} headlines tagged in ${t.toFixed(1)} s. The topic scorer would be proud.`, t); return; }
    show(); c.msg(`${N - q} to go.`, 'good');
  }
  c.loop(dt => {
    if (!running) return false;
    t += dt; bar.style.width = Math.max(0, 100 - t / LIMIT * 100) + '%';
    if (t >= LIMIT) { running = false; btns.forEach(b => (b.disabled = true)); c.fail(`Time! ${q} of ${N} tagged. Press Restart.`); return false; }
  });
  show(); btns[0].dataset.autofocus = '';
  c.msg('Pick the topic each headline belongs to.');
}

function gCatch(c) {
  const NEED = 15, LIVES = 3;
  const wrap = c.html(`<div class="cv-game kh-catch"><canvas tabindex="0" aria-label="Channel catch. Move the feed with the arrow keys, or drag on the canvas."></canvas><div class="count">📰 0 / ${NEED} · ❤️❤️❤️</div></div>`);
  const cv = wrap.querySelector('canvas'), cnt = wrap.querySelector('.count'), x = cv.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  const size = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); c.on(window, 'resize', size);
  let px = 0.5, dir = 0, caught = 0, hurt = 0, t = 0, spawnIn = 0.3, items = [], started = false, over = false, flash = 0;
  const start = () => { if (!started) { started = true; c.msg('Catch the blue Persian stories. Let the grey EN digests fall.'); } };
  c.key(e => {
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') { e.preventDefault(); start(); dir = -1; }
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') { e.preventDefault(); start(); dir = 1; }
  });
  c.on(window, 'keyup', e => { if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(e.key)) dir = 0; });
  const follow = e => { const r = cv.getBoundingClientRect(); px = clamp((e.clientX - r.left) / r.width, 0.08, 0.92); };
  c.on(cv, 'pointerdown', e => { e.preventDefault(); cv.focus({ preventScroll: true }); start(); follow(e); });
  c.on(cv, 'pointermove', e => { if (started && (e.pointerType === 'mouse' || e.buttons)) follow(e); });
  function card(cx, cy, w, h, fill, label, ink) {
    x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.roundRect ? x.roundRect(cx - w / 2 + 2, cy - h / 2 + 3, w, h, 8) : x.rect(cx - w / 2 + 2, cy - h / 2 + 3, w, h); x.fill();
    x.fillStyle = fill; x.beginPath(); x.roundRect ? x.roundRect(cx - w / 2, cy - h / 2, w, h, 8) : x.rect(cx - w / 2, cy - h / 2, w, h); x.fill();
    x.fillStyle = ink; x.fillText(label, cx, cy + 1);
  }
  function draw() {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#16224a'); g.addColorStop(1, '#0d1628');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,.05)';
    for (let i = 0; i < 6; i++) x.fillRect(0, (i * 60 + t * 30) % H, W, 1);
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `700 ${Math.round(H * 0.06)}px Vazirmatn, Tahoma, system-ui, sans-serif`;
    const cw = Math.min(64, W * 0.15), ch = cw * 0.62;
    items.forEach(it => it.fa ? card(it.x * W, it.y * H, cw, ch, '#2f4fd8', 'فا', '#ffffff') : card(it.x * W, it.y * H, cw, ch, '#8b93a3', 'EN', '#1d2230'));
    const bx = px * W, by = H * 0.88, bw = Math.min(110, W * 0.26);
    x.save(); x.globalAlpha = flash > 0 && Math.sin(flash * 40) > 0 ? 0.35 : 1;
    x.fillStyle = '#f2f5fa'; x.beginPath(); x.roundRect ? x.roundRect(bx - bw / 2, by - 14, bw, 28, 10) : x.rect(bx - bw / 2, by - 14, bw, 28); x.fill();
    x.fillStyle = '#2f4fd8'; x.font = `700 13px "Atkinson Hyperlegible", system-ui, sans-serif`; x.fillText('KHABAR FEED', bx, by + 1);
    x.restore();
    if (!started) {
      x.fillStyle = 'rgba(13,22,40,.7)'; x.fillRect(0, H / 2 - 22, W, 44);
      x.fillStyle = '#fff'; x.font = '700 15px "Atkinson Hyperlegible", system-ui, sans-serif';
      x.fillText(isTouch ? 'Drag to move the feed' : 'Press ← or → (or use the mouse) to start', W / 2, H / 2);
    }
  }
  c.loop(dt => {
    if (started && !over) {
      t += dt; flash = Math.max(0, flash - dt);
      px = clamp(px + dir * dt * 0.9, 0.08, 0.92);
      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawnIn = Math.max(0.38, 0.8 - caught * 0.025);
        items.push({ x: 0.1 + Math.random() * 0.8, y: -0.06, fa: Math.random() < 0.62, v: 0.34 + Math.random() * 0.12 + caught * 0.012 });
      }
      items.forEach(it => { it.y += it.v * dt; });
      const bw = Math.min(110, W * 0.26) / W;
      items = items.filter(it => {
        if (it.y > 0.84 && it.y < 0.93 && Math.abs(it.x - px) < bw / 2 + 0.03) {
          if (it.fa) { caught++; sfx.play('coin'); buzz(10); }
          else if (flash <= 0) { hurt++; flash = 0.8; sfx.play('fail'); buzz(40); }
          cnt.textContent = `📰 ${caught} / ${NEED} · ${'❤️'.repeat(LIVES - hurt)}${'🖤'.repeat(hurt)}`;
          return false;
        }
        return it.y < 1.08;
      });
      if (caught >= NEED) { over = true; draw(); c.win(`${NEED} stories in your feed in ${t.toFixed(1)} s. English digests stay hidden, like on the site.`, t); return false; }
      if (hurt >= LIVES) { over = true; draw(); c.fail(`Three digests slipped into the feed. ${caught} of ${NEED} stories. Press Restart.`); return false; }
    }
    draw();
  });
  c.msg(`Catch ${NEED} blue Persian stories. A grey English digest costs a life, and you have three.`);
}

function gStreak(c) {
  const DAYS = 7, CARDS = 6;
  const icons = ['🤖', '🔌', '🦾', '🚀', '📱', '🧬', '🛰️', '💡', '🎧', '🧠'];
  const wrap = c.html(`<div class="w-game"><div class="kh-days" aria-hidden="true">${'<i></i>'.repeat(DAYS)}</div><div class="kh-grid"></div><div class="count">Day 1 of ${DAYS}</div></div>`);
  const days = wrap.querySelectorAll('.kh-days i'), grid = wrap.querySelector('.kh-grid'), cnt = wrap.querySelector('.count');
  const cards = Array.from({ length: CARDS }, (_, i) => {
    const b = c.el('button', 'kh-story'); b.onclick = () => tap(i); grid.append(b); return b;
  });
  let day = 0, hot = -1, shownAt = 0, timer = 0, state = 'idle';
  const times = [];
  function deal() {
    const pick = shuffle(icons.slice());
    cards.forEach((b, i) => { b.className = 'kh-story'; b.innerHTML = `<span>${pick[i]}</span><small>story</small>`; b.setAttribute('aria-label', `Story ${i + 1}`); });
  }
  function round() {
    state = 'wait'; deal(); hot = -1;
    cnt.textContent = `Day ${day + 1} of ${DAYS} · wait for the new badge…`;
    timer = c.after(rnd(600, 1700), () => {
      hot = rnd(0, CARDS - 1); state = 'go'; shownAt = performance.now();
      const b = cards[hot]; b.classList.add('new'); b.querySelector('small').textContent = 'تازه · new'; b.setAttribute('aria-label', `Story ${hot + 1}, new`);
      sfx.tone(880, 0.05, 'triangle', 0.04);
      timer = c.after(Math.max(650, 1300 - day * 90), () => { state = 'done'; b.classList.add('gone'); c.fail(`It scrolled away. Streak broken on day ${day + 1}. Press Restart.`); });
    });
  }
  function tap(i) {
    if (state === 'idle') { state = 'wait'; c.msg('Tap the story marked new, fast.'); round(); return; }
    if (state === 'done') return;
    if (state === 'wait' || i !== hot) {
      const early = state === 'wait';
      c.cancel(timer); state = 'done'; shake(cards[i]);
      c.fail(early ? 'Too soon: that was an old story. Streak broken. Press Restart.' : 'Not that one. Streak broken. Press Restart.'); return;
    }
    c.cancel(timer);
    const ms = performance.now() - shownAt; times.push(ms);
    days[day].classList.add('on'); sfx.tone(520 + day * 60, 0.08); buzz(12);
    cards[hot].classList.add('read'); day++;
    if (day >= DAYS) {
      state = 'done';
      const avg = times.reduce((s, v) => s + v, 0) / times.length;
      cnt.textContent = `🔥 ${DAYS}-day streak`;
      c.win(`${DAYS}-day streak! Average ${Math.round(avg)} ms to spot the new story.`, avg); return;
    }
    state = 'wait'; c.msg(`🔥 ${day}-day streak · ${Math.round(ms)} ms`, 'good');
    timer = c.after(450, round);
  }
  deal();
  cards.forEach(b => { b.querySelector('small').textContent = 'tap to start'; });
  c.msg('Tap any story to start day 1, then tap the one that gets the new badge.');
}

/* --- Landmark (local +Z faces the island centre) --- */
// A newsroom tower with a scrolling ticker, a satellite dish, and a Telegram paper plane circling the roof.
function landmark(g, c, { M, mat, tick }) {
  const C = hexNum(c);
  M(new THREE.CylinderGeometry(7.6, 8, 1, 8), mat(0x2a2f3c), 0, 0.5, 0, g);
  M(new THREE.BoxGeometry(6.4, 0.3, 6.4), mat(0xdfe3ea), 0, 1.15, 0, g);
  // Glass tower with blue window bands.
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256;
  const wx = cv.getContext('2d'); wx.fillStyle = '#1b2a5c'; wx.fillRect(0, 0, 128, 256);
  for (let r = 0; r < 16; r++) for (let k = 0; k < 4; k++) { wx.fillStyle = Math.random() < 0.3 ? '#ffe9a8' : '#3c5bd6'; wx.fillRect(6 + k * 31, 6 + r * 16, 24, 10); }
  const tex = new THREE.CanvasTexture(cv);
  M(new THREE.BoxGeometry(5.4, 11, 5.4), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3, metalness: 0.3, emissive: 0x0b1530, emissiveIntensity: 0.4 }), 0, 6.8, 0, g);
  M(new THREE.BoxGeometry(5.9, 0.4, 5.9), mat(0xdfe3ea), 0, 12.5, 0, g);
  // Ticker band that scrolls around the tower.
  const tc = document.createElement('canvas'); tc.width = 1024; tc.height = 64;
  const tx = tc.getContext('2d'); tx.fillStyle = '#e5484d'; tx.fillRect(0, 0, 1024, 64);
  tx.fillStyle = '#ffffff'; tx.font = '700 38px Vazirmatn, Tahoma, "Atkinson Hyperlegible", sans-serif'; tx.textBaseline = 'middle';
  tx.fillText('خبر فوری  •  AI NEWS  •  فیوچر فوکوس  •  KHABAR  •  ', 12, 34);
  const ticker = new THREE.CanvasTexture(tc); ticker.wrapS = THREE.RepeatWrapping; ticker.repeat.set(1.6, 1);
  M(new THREE.CylinderGeometry(4.1, 4.1, 1.3, 40, 1, true), new THREE.MeshStandardMaterial({ map: ticker, roughness: 0.6, emissive: 0x401010, emissiveIntensity: 0.3, side: THREE.DoubleSide }), 0, 9.6, 0, g, true);
  // Satellite dish and mast.
  M(new THREE.CylinderGeometry(0.15, 0.15, 2.6, 8), mat(0xdfe3ea), 1.6, 14, -1.2, g);
  const dish = M(new THREE.SphereGeometry(1.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3.2), mat(0xf2f5fa, { side: THREE.DoubleSide }), -1.2, 13.4, 0.8, g);
  dish.rotation.set(-0.9, 0, 0.4);
  const tip = M(new THREE.SphereGeometry(0.3, 10, 8), new THREE.MeshStandardMaterial({ color: C, emissive: C, emissiveIntensity: 0.8 }), 1.6, 15.4, -1.2, g, true);
  // A stack of today's papers by the door.
  [0, 1, 2].forEach(i => M(new THREE.BoxGeometry(2.4, 0.35, 1.7), mat(i % 2 ? 0xeceef2 : 0xf8f9fb), 3.6, 1.48 + i * 0.36, 3.2, g).rotation.y = i * 0.12);
  // Telegram-blue paper plane circling the roof.
  const plane = new THREE.Group(); g.add(plane);
  const shape = new THREE.Shape(); shape.moveTo(0, 1.4); shape.lineTo(0.9, -0.9); shape.lineTo(0, -0.4); shape.lineTo(-0.9, -0.9); shape.closePath();
  const wing = M(new THREE.ShapeGeometry(shape), mat(0x2aabee, { side: THREE.DoubleSide, emissive: 0x2aabee, emissiveIntensity: 0.2 }), 0, 0, 0, plane);
  wing.rotation.x = -Math.PI / 2;
  M(new THREE.ConeGeometry(0.22, 1.6, 3), mat(0xffffff), 0, 0.12, 0, plane).rotation.x = -Math.PI / 2;
  tick(t => {
    ticker.offset.x = (t * 0.05) % 1;
    const a = t * 0.8;
    plane.position.set(Math.cos(a) * 6.5, 15 + Math.sin(t * 1.6) * 0.6, Math.sin(a) * 6.5);
    plane.rotation.set(0, -a + Math.PI, Math.sin(t * 1.6) * 0.2 - 0.25);
    tip.material.emissiveIntensity = 0.5 + 0.5 * Math.sin(t * 5);
  });
  return { solidR: 8.2, sign: 17, snap: 30 };
}
