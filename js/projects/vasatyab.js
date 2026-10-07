import { rnd, hexNum } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { GH } from './links.js';

const project = {
  id: 'vasatyab', name: 'VasatYab', color: '#7c5cff', lang: 'TypeScript',
  tagline: 'Find the perfect meeting spot. Enter two addresses and get the exact midpoint.',
  chips: ['Next.js', 'Prisma', 'Updated 30 May 2025'], live: true,
  repos: [{ url: GH + 'vasat-yab' }], site: 'https://vasatyab.vercel.app',
  inferred: 'The README is short, so the tech and setup notes below come from the files in the repository (docker-compose, Prisma, Playwright and config files).',
  pitch: {
    line: 'Vasat-yab (وسط‌یاب) is Persian for "midpoint finder". Never fight over location again.',
    rows: [
      ['Problem', 'Two friends on opposite sides of a big city like Tehran can spend longer choosing where to meet than getting there.'],
      ['Solution', 'Enter two addresses. VasatYab finds the exact geographic midpoint and shows places to meet around it.'],
      ['Who it\'s for', 'Friends, couples and small teams deciding where to meet.'],
      ['Why it stands out', 'It answers one question, fast, and it is fair to both people by design.'],
      ['Status', 'Live at vasatyab.vercel.app. Sign in to use it. Open to collaborators.']
    ]
  },
  design: [
    { h: 'Landing page', items: [
      'Headline: "Find the perfect meeting spot". Tagline: "Never fight over location again!"',
      'Popular destinations as cards: Tajrish (Iran), Malibu, London, Chicago, Seattle, Rome.',
      'One call to action, "Start using", which leads to sign-in.'
    ] },
    { h: 'How a geographic midpoint works', items: [
      'Convert each latitude/longitude to a point on a unit sphere (x, y, z).',
      'Average the two points, then convert the result back to latitude/longitude.',
      'This gives the true halfway point along the Earth\'s surface. Averaging raw lat/lng numbers drifts over long distances.'
    ] }
  ],
  tech: {
    stack: [
      ['Framework', 'Next.js with TypeScript'],
      ['Styling', 'Tailwind CSS'],
      ['Data', 'Prisma ORM, database run with Docker Compose'],
      ['Testing', 'Playwright end-to-end tests'],
      ['Code quality', 'ESLint and Prettier'],
      ['Hosting', 'Vercel']
    ],
    arch: [{ h: 'Repository layout', items: ['`src/`: application code', '`public/`: logo and banner images', '`tests/`: Playwright specs', '`prisma/`: database schema'] }]
  },
  docs: {
    note: 'These steps follow the tools in the repository. Check package.json for the exact script names.',
    steps: [
      { t: 'Clone', code: 'git clone https://github.com/AliTaheriMotlagh/vasat-yab.git\ncd vasat-yab' },
      { t: 'Start the database and app', code: 'docker compose up -d\nnpm install\nnpx prisma migrate dev\nnpm run dev' },
      { t: 'End-to-end tests', code: 'npx playwright test' }
    ]
  },
  glyph: '📍',
  // Three challenges. `run(c)` builds the game into c.body (see games/runner.js);
  // `record` keeps a personal best on this device, where `lower` means a smaller score is better.
  games: [
    { key: 'midpoint', icon: '📍', title: 'Find the Midpoint', desc: 'Slide the marker exactly halfway between A and B. Three rounds.', run: gMidpoint },
    { key: 'map', icon: '🗺️', title: 'Meet in the Middle', desc: 'Tap the map where the midpoint between two friends is.', run: gMapMid, record: { lower: true, fmt: v => `${v.toFixed(1)}% avg miss` } },
    { key: 'fair', icon: '☕', title: 'Fair Café', desc: 'Pick the café that is equally far from both friends.', run: gFair }
  ],
  landmark
};
export default project;

/* --- Challenges --- */
function gMidpoint(c) {
  const wrap = c.html('<div class="midpoint-game"><div class="mid-track" aria-hidden="true"><i class="mid-a"></i><i class="mid-b"></i><i class="mid-m"></i></div><input type="range" min="0" max="100" value="50" aria-label="Marker position"><div class="mid-value" aria-hidden="true">50</div><div class="dots"><i></i><i></i><i></i></div><button class="btn" type="button">Check</button></div>');
  const [ia, ib, im] = wrap.querySelectorAll('.mid-track i'), r = wrap.querySelector('input'), val = wrap.querySelector('.mid-value'), dots = wrap.querySelectorAll('.dots i'), go = wrap.querySelector('.btn');
  let round = 0, a, b, busy = false;
  const upd = () => { val.textContent = r.value; im.style.left = r.value + '%'; };
  const setup = () => {
    do { a = rnd(2, 60); b = rnd(a + 16, 98); } while ((a + b) % 2);
    ia.style.left = a + '%'; ia.dataset.l = `A · ${a}`; ib.style.left = b + '%'; ib.dataset.l = `B · ${b}`;
    r.value = Math.random() < 0.5 ? a : b; upd(); busy = false;
    c.msg(`Round ${round + 1} of 3: what is halfway between ${a} and ${b}?`);
  };
  r.oninput = upd;
  go.onclick = () => {
    if (busy || c.won) return;
    const n = +r.value, m = (a + b) / 2;
    if (n !== m) { c.fail(`${n} is ${Math.abs(n - m)} off. ${n < m ? 'Go right.' : 'Go left.'}`); return; }
    dots[round].classList.add('on'); round++; sfx.play('coin');
    if (round === 3) { c.win('Three fair midpoints. Nobody travels further!'); return; }
    busy = true; c.msg(`Exactly ${m}! Next round…`, 'good'); c.after(900, setup);
  };
  setup();
}
const mapDist = (p, q) => Math.hypot((p[0] - q[0]) * 1.6, p[1] - q[1]); // map is 16:10, coordinates in %
function mapPin(c, map, p, cls, text) {
  const e = c.el('div', 'pin ' + cls, text); e.style.left = p[0] + '%'; e.style.top = p[1] + '%'; map.append(e); return e;
}
function gMapMid(c) {
  const wrap = c.html('<div class="map-game"><div class="map" aria-label="City map. Tap where the midpoint is."><svg class="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg></div><div class="dots"><i></i><i></i><i></i></div></div>');
  const map = wrap.querySelector('.map'), svg = map.querySelector('svg'), dots = wrap.querySelectorAll('.dots i');
  let A, B, round = 0, locked = false;
  const errs = [];
  function setup() {
    map.querySelectorAll('.pin').forEach(e => e.remove()); svg.innerHTML = ''; locked = false;
    do { A = [rnd(8, 92), rnd(12, 88)]; B = [rnd(8, 92), rnd(12, 88)]; } while (mapDist(A, B) < 60);
    mapPin(c, map, A, 'pa', 'A'); mapPin(c, map, B, 'pb', 'B');
    c.msg(`Round ${round + 1} of 3: tap the midpoint between A and B.`);
  }
  c.on(map, 'click', e => {
    if (locked || c.won) return;
    const rc = map.getBoundingClientRect();
    const g = [(e.clientX - rc.left) / rc.width * 100, (e.clientY - rc.top) / rc.height * 100];
    const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    const err = mapDist(g, M) / 1.6; // as % of the map width
    locked = true;
    svg.innerHTML = `<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}"/>`;
    mapPin(c, map, M, 'pm', '★'); mapPin(c, map, g, 'pg', '');
    if (err > 4) { c.fail(`Off by ${err.toFixed(1)}% of the map. Within 4% counts. New pair…`); c.after(1600, setup); return; }
    errs.push(err); dots[round].classList.add('on'); round++; sfx.play('coin');
    if (round === 3) { const avg = errs.reduce((s, v) => s + v, 0) / errs.length; c.win(`Three fair meet-ups, ${avg.toFixed(1)}% average miss.`, avg); return; }
    c.msg(`Off by only ${err.toFixed(1)}%. Next pair of friends…`, 'good'); c.after(1300, setup);
  });
  setup();
}
function gFair(c) {
  const wrap = c.html('<div class="map-game"><div class="map fair"><svg class="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg></div><div class="dots"><i></i><i></i><i></i></div></div>');
  const map = wrap.querySelector('.map'), svg = map.querySelector('svg'), dots = wrap.querySelectorAll('.dots i');
  let round = 0;
  function setup() {
    map.querySelectorAll('.pin, .cafe').forEach(e => e.remove()); map.classList.remove('reveal'); svg.innerHTML = '';
    // Place friends and cafés so there is one clearly fair café.
    let A, B, cafes, score;
    for (let tries = 0; tries < 500; tries++) {
      A = [rnd(8, 30), rnd(15, 85)]; B = [rnd(70, 92), rnd(15, 85)];
      cafes = Array.from({ length: 4 }, () => [rnd(12, 88), rnd(12, 88)]);
      score = cafes.map(q => Math.abs(mapDist(q, A) - mapDist(q, B)));
      const s = score.slice().sort((x, y) => x - y);
      const spread = cafes.every((q, i) => mapDist(q, A) > 16 && mapDist(q, B) > 16 && cafes.every((q2, j) => i === j || mapDist(q, q2) > 20));
      if (s[0] < 6 && s[1] - s[0] > 14 && spread) break;
    }
    mapPin(c, map, A, 'pa', 'A'); mapPin(c, map, B, 'pb', 'B');
    const best = score.indexOf(Math.min(...score));
    let locked = false;
    const btns = cafes.map((q, i) => {
      const b = c.el('button', 'cafe', '☕'); b.style.left = q[0] + '%'; b.style.top = q[1] + '%';
      b.setAttribute('aria-label', `Café ${i + 1}`); b.dataset.d = `A ${Math.round(mapDist(q, A))} · B ${Math.round(mapDist(q, B))}`;
      b.onclick = () => pick(i); map.append(b); return b;
    });
    function pick(i) {
      if (locked || c.won) return;
      locked = true; map.classList.add('reveal'); btns[best].classList.add('right');
      svg.innerHTML = `<line class="la" x1="${A[0]}" y1="${A[1]}" x2="${cafes[i][0]}" y2="${cafes[i][1]}"/><line class="lb" x1="${B[0]}" y1="${B[1]}" x2="${cafes[i][0]}" y2="${cafes[i][1]}"/>`;
      if (i !== best) { btns[i].classList.add('wrong'); c.fail('One friend walks further there. The green café is the fair one.'); c.after(2000, setup); return; }
      dots[round].classList.add('on'); round++; sfx.play('coin');
      if (round === 3) { c.win('Three fair cafés. Everybody arrives at the same time!'); return; }
      c.msg('Fair and square! Next meet-up…', 'good'); c.after(1500, setup);
    }
    c.msg(`Round ${round + 1} of 3: which café is equally far from A and B?`);
  }
  setup();
}

/* --- Landmark (local +Z faces the island centre) --- */
function landmark(g, c, { M, mat, tick, rand }) {
  const C = hexNum(c);
  M(new THREE.CylinderGeometry(9, 9.4, 0.5, 40), mat(0xf4f6fb), 0, 0.25, 0, g);
  for (let i = 0; i < 9; i++) {
    const s = M(new THREE.BoxGeometry(0.25, 0.04, 6 + rand() * 8), mat(0xd3d9e6), (rand() - 0.5) * 10, 0.52, (rand() - 0.5) * 10, g, true);
    s.rotation.y = rand() * Math.PI;
  }
  function pin(x, color, big) {
    const p = new THREE.Group(); p.position.set(x, 0.5, 0); g.add(p);
    const k = big ? 1.4 : 1;
    const cone = M(new THREE.ConeGeometry(0.9 * k, 3 * k, 16), mat(color), 0, 1.5 * k, 0, p); cone.rotation.x = Math.PI;
    M(new THREE.SphereGeometry(1.1 * k, 18, 12), mat(color), 0, 3.3 * k, 0, p);
    M(new THREE.SphereGeometry(0.45 * k, 12, 8), mat(0xffffff), 0, 3.3 * k, 0.85 * k, p);
    return p;
  }
  pin(-6.5, 0xff5a5f); pin(6.5, 0x3aa7ff); pin(0, C, true);
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-6.5, 4.8, 0), new THREE.Vector3(0, 15, 0), new THREE.Vector3(6.5, 4.8, 0));
  M(new THREE.TubeGeometry(curve, 48, 0.12, 8, false), mat(0xffffff, { emissive: 0x777777 }), 0, 0, 0, g);
  const star = M(new THREE.OctahedronGeometry(0.8), mat(0xffc53d, { emissive: 0xffa500, emissiveIntensity: 0.5 }), 0, 7.8, 0, g);
  const ring = M(new THREE.RingGeometry(1, 1.35, 40), new THREE.MeshBasicMaterial({ color: C, transparent: true, side: THREE.DoubleSide }), 0, 0.54, 0, g, true);
  ring.rotation.x = -Math.PI / 2;
  const dots = [0, 1].map(i => M(new THREE.SphereGeometry(0.4, 10, 8), mat(i ? 0x3aa7ff : 0xff5a5f, { emissive: i ? 0x3aa7ff : 0xff5a5f, emissiveIntensity: 0.5 }), 0, 0, 0, g));
  const v = new THREE.Vector3();
  tick(t => {
    star.rotation.y = t * 1.6; star.position.y = 7.8 + Math.sin(t * 2) * 0.25;
    const k = (t * 0.5) % 1; ring.scale.setScalar(1 + k * 6); ring.material.opacity = 1 - k;
    const f = ((t * 0.35) % 1) * 0.5;
    curve.getPoint(f, v); dots[0].position.copy(v);
    curve.getPoint(1 - f, v); dots[1].position.copy(v);
  });
  return { solidR: 9.4, sign: 13 };
}
