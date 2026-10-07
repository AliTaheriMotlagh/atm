import { clamp, isTouch, buzz, hexNum } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { orderGame, secs } from '../games/kit.js';
import { GH } from './links.js';

const project = {
  id: 'khalabani', name: 'Khalabani', color: '#ff9f1c', lang: 'JavaScript',
  tagline: 'A flight simulator in the browser. Fly the Airbus A320 or the Cessna 172 with real systems and real procedures.',
  chips: ['WebGL', 'Mobile touch', 'Updated 27 Sep 2026'], live: true,
  repos: [{ url: GH + 'khalabani' }], site: 'https://khalabani.vercel.app',
  pitch: {
    line: 'Open a URL and fly an A320 out of Tehran Mehrabad with fly-by-wire, ECAM, a working MCDU and autoland.',
    rows: [
      ['Problem', 'Serious flight sims need expensive desktop software, powerful hardware and a long install.'],
      ['Solution', 'A browser simulator focused on realistic flight dynamics, systems and instrument flying. It runs on desktop and on phones.'],
      ['Who it\'s for', 'Aviation fans, student pilots practising IFR, and sim players who want depth without the setup.'],
      ['Why it stands out', 'The A320 flies around Tehran Mehrabad (OIII) using real Iranian AIP data, with FMGS, TCAS II and CAT 3 autoland. The Cessna 172S is a steam-gauge IFR trainer.'],
      ['Status', 'Live at khalabani.vercel.app, with automated test suites for both aircraft.']
    ]
  },
  design: [
    { h: 'Two aircraft', items: [
      'Airbus A320-200: fly-by-wire control laws, every ECAM page, MCDU/FMGS, autopilot with autoland, TCAS II. Based at OIII.',
      'Cessna 172S: steam gauges for IFR training, on the fictional Avalon Island.'
    ] },
    { h: 'Phones and tablets', items: ['Detected automatically. Touch controls for pitch/roll, rudder, thrust, flaps, gear and autopilot.'] },
    { h: 'Known simplifications', items: ['Approximate aerodynamics, a reduced FMS database, condensed ECAM procedures and no live ATC traffic.'] }
  ],
  tech: {
    stack: [
      ['Runtime', 'Plain JavaScript and WebGL, no build step'],
      ['Flight model', '`js/a320/fdm.js`: load-factor demand law with auto-trim; alpha protection, pitch and bank limits'],
      ['Engines', 'CFM56 FADEC simulation with thrust ratings and spool dynamics'],
      ['Hydraulics', 'Green, blue and yellow systems modelled separately'],
      ['Systems + ECAM', '`systems.js`, `displays.js`: electrical, APU, bleed, pressurisation, air conditioning, fuel, hydraulics; Flight Warning Computer; all SD pages'],
      ['FMGS / MCDU', '`fmgs.js`, `mcdu.js`: INIT, F-PLN, DEPARTURE/ARRIVAL, PERF; lateral and vertical nav; autoland CAT 3 DUAL'],
      ['TCAS II', '`tcas.js`: traffic and resolution advisories, voice alerts, vertical speed bands on the PFD']
    ],
    arch: [{ h: 'Tests', items: ['C172 performance validation.', 'Advanced aerodynamic scenarios.', 'A320 systems and autoland verification.'] }],
    numbers: [['2', 'aircraft'], ['OIII', 'Tehran Mehrabad'], ['CAT 3', 'autoland'], ['3', 'hydraulic systems']]
  },
  docs: {
    steps: [
      { t: 'Quick start', code: '# open index.html in Chrome, Edge or Firefox (WebGL required)' },
      { t: 'If the browser blocks local files', code: 'python3 -m http.server 8000\n# then open http://localhost:8000' },
      { t: 'Fly from a phone on the same Wi-Fi', code: 'python3 -m http.server 8000 --bind 0.0.0.0\n# open http://<your-computer-ip>:8000 on the phone' }
    ],
    tree: 'khalabani/\n├─ index.html\n└─ js/\n   ├─ a320/fdm.js     flight dynamics\n   ├─ systems.js      aircraft systems\n   ├─ displays.js     ECAM / SD pages\n   ├─ fmgs.js         flight management\n   ├─ mcdu.js         MCDU pages\n   └─ tcas.js         TCAS II'
  },
  glyph: '✈️',
  // Three challenges. `run(c)` builds the game into c.body (see games/runner.js);
  // `record` keeps a personal best on this device, where `lower` means a smaller score is better.
  games: [
    { key: 'landing', icon: '🛬', title: 'Perfect Touchdown', desc: 'Hit LAND over the green zone. Three landings, each approach faster.', run: gLanding },
    { key: 'glide', icon: '✈️', title: 'Glide Slope', desc: 'Hold to climb, let go to sink. Stay in the green approach corridor.', run: gGlide, record: { lower: true, fmt: secs } },
    { key: 'flow', icon: '📋', title: 'Pre-flight Flow', desc: 'Run the A320 start-up flow in the right order.', run: gFlow }
  ],
  landmark
};
export default project;

/* --- Challenges --- */
function gLanding(c) {
  const wrap = c.html('<div class="landing-wrap"><div class="runway" aria-hidden="true"><div class="target"></div><div class="plane">✈️</div></div><div class="dots"><i></i><i></i><i></i></div><button class="btn" type="button">LAND</button></div>');
  const plane = wrap.querySelector('.plane'), btn = wrap.querySelector('button'), dots = wrap.querySelectorAll('.dots i');
  let x = 0, dir = 1, n = 0, speed = 0.55, frozen = false;
  c.loop(dt => {
    if (frozen) return;
    x += dir * dt * speed;
    if (x >= 1) { x = 1; dir = -1; }
    if (x <= 0) { x = 0; dir = 1; }
    plane.style.left = (x * 100) + '%';
    plane.style.transform = `translateX(-50%) scaleX(${dir})`;
  });
  btn.onclick = () => {
    if (frozen || c.won) return;
    if (x >= 0.44 && x <= 0.56) {
      dots[n].classList.add('on'); n++; sfx.play('coin'); buzz(20); frozen = true;
      if (n === 3) { c.win('Three smooth landings in a row. Captain material!'); return; }
      c.msg(`Touchdown ${n} of 3! The next approach is faster…`, 'good');
      c.after(800, () => { frozen = false; speed += 0.18; x = 0; dir = 1; });
    } else c.fail((x < 0.44) === (dir > 0) ? 'Too early, go around!' : 'Too late, go around!');
  };
  c.msg('Tap LAND when the plane is over the green zone.');
}
function gGlide(c) {
  const wrap = c.html('<div class="cv-game"><div class="bar" aria-hidden="true"><i></i></div><canvas tabindex="0" aria-label="Glide slope. Hold the pointer, Space or the up arrow to climb."></canvas></div>');
  const cv = wrap.querySelector('canvas'), bar = wrap.querySelector('.bar i'), x = cv.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2), HALF = 0.12, NEED = 8, LIMIT = 30, PX = 0.22;
  let W = 0, H = 0;
  const size = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); c.on(window, 'resize', size);
  let hold = false, started = false, y = 0.5, vy = 0, t = 0, inside = 0;
  const center = s => 0.5 + 0.26 * Math.sin(s * 0.8) + 0.08 * Math.sin(s * 2.3 + 1);
  const press = () => { hold = true; if (!started) { started = true; c.msg('Stay inside the green corridor.'); } };
  c.on(cv, 'pointerdown', e => { e.preventDefault(); cv.setPointerCapture?.(e.pointerId); cv.focus({ preventScroll: true }); press(); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => c.on(cv, ev, () => { hold = false; }));
  c.key(e => { if ((e.code === 'Space' || e.key === 'ArrowUp') && e.target.tagName !== 'BUTTON') { e.preventDefault(); press(); } });
  c.on(window, 'keyup', e => { if (e.code === 'Space' || e.key === 'ArrowUp') hold = false; });
  function draw() {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2b6aa8'); g.addColorStop(1, '#a8d8ff');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.beginPath();
    for (let sx = 0; sx <= W + 6; sx += 6) x.lineTo(sx, (center(t + (sx / W - PX) * 4) - HALF) * H);
    for (let sx = W + 6; sx >= 0; sx -= 6) x.lineTo(sx, (center(t + (sx / W - PX) * 4) + HALF) * H);
    x.closePath(); x.fillStyle = 'rgba(116,255,155,.28)'; x.fill(); x.strokeStyle = 'rgba(116,255,155,.9)'; x.lineWidth = 2; x.stroke();
    x.fillStyle = '#3d6b3a'; x.fillRect(0, H - 8, W, 8);
    const ok = Math.abs(y - center(t)) < HALF;
    x.save(); x.translate(W * PX, y * H); x.rotate(clamp(vy * 1.2, -0.5, 0.5));
    x.fillStyle = ok ? '#ffffff' : '#ffb4ad';
    x.beginPath(); x.ellipse(0, 0, 22, 6, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ff9f1c';
    x.beginPath(); x.moveTo(-4, 0); x.lineTo(-12, 14); x.lineTo(-5, 14); x.lineTo(7, 0); x.fill();
    x.beginPath(); x.moveTo(-17, -2); x.lineTo(-24, -14); x.lineTo(-18, -14); x.lineTo(-11, -2); x.fill();
    x.restore();
    if (!started) {
      x.fillStyle = 'rgba(13,22,40,.65)'; x.fillRect(0, H / 2 - 22, W, 44);
      x.fillStyle = '#fff'; x.font = '700 15px "Atkinson Hyperlegible", system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(isTouch ? 'Press and hold to climb' : 'Hold Space or the mouse to climb', W / 2, H / 2);
    }
  }
  c.loop(dt => {
    if (started) {
      t += dt;
      vy = clamp(vy + (hold ? -1.5 : 1.0) * dt, -0.55, 0.55);
      y += vy * dt;
      if (y < 0.03 || y > 0.97) { y = clamp(y, 0.03, 0.97); vy = 0; }
      if (Math.abs(y - center(t)) < HALF) inside += dt;
      bar.style.width = Math.min(100, inside / NEED * 100) + '%';
      if (inside >= NEED) { draw(); c.win(`Stable approach in ${t.toFixed(1)} s. Cleared to land!`, t); return false; }
      if (t > LIMIT) { c.fail('Unstable approach, go around. Press to try again.'); started = false; hold = false; y = 0.5; vy = 0; t = 0; inside = 0; bar.style.width = '0'; }
    }
    draw();
  });
  c.msg(`Keep the plane in the corridor for ${NEED} seconds in total.`);
}
function gFlow(c) {
  orderGame(c, [
    { label: '🔋 Battery on' }, { label: '⚙️ APU start' }, { label: '🔴 Beacon light on' },
    { label: '🌀 Engines start' }, { label: '🛫 Flaps 1+F' }, { label: '🚀 Takeoff thrust' }
  ], {
    intro: 'Power first, lights before engines, configure before thrust.',
    bad: it => `ECAM: "${it.label.slice(3)}" is out of sequence.`,
    win: 'Flow complete. Khalabani, cleared for takeoff!'
  });
}

/* --- Landmark (local +Z faces the island centre) --- */
function landmark(g, c, { M, mat, tick }) {
  const C = hexNum(c);
  M(new THREE.BoxGeometry(30, 0.14, 6), mat(0x4a505c), 0, 0.07, -3, g).castShadow = false;
  for (let x = -10.5; x <= 10.5; x += 3) M(new THREE.BoxGeometry(1.6, 0.16, 0.3), mat(0xffffff), x, 0.1, -3, g, true);
  [-13.8, 13.8].forEach(x => { for (let k = -2; k <= 2; k++) M(new THREE.BoxGeometry(1.4, 0.16, 0.4), mat(0xffffff), x, 0.1, -3 + k * 1.05, g, true); });
  M(new THREE.CylinderGeometry(1.1, 1.3, 8, 10), mat(0xeef0f3), -10, 4, 4, g);
  M(new THREE.CylinderGeometry(2.3, 1.8, 1.9, 8), mat(0x8fe3ff, { emissive: 0x2a6f8a, emissiveIntensity: 0.4, roughness: 0.2 }), -10, 8.9, 4, g);
  M(new THREE.CylinderGeometry(2.6, 2.6, 0.35, 8), mat(0x3b404c), -10, 10, 4, g);
  const beacon = M(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3b30 }), -10, 10.9, 4, g, true);
  // windsock
  M(new THREE.CylinderGeometry(0.06, 0.06, 4, 6), mat(0xdfe3ea), 11, 2, 3, g);
  const sock = M(new THREE.ConeGeometry(0.45, 2, 10, 1, true), mat(C, { side: THREE.DoubleSide }), 12, 3.8, 3, g); sock.rotation.z = Math.PI / 2;
  // A320-ish plane
  const plane = new THREE.Group(); plane.rotation.order = 'YXZ'; g.add(plane);
  const fus = M(new THREE.CylinderGeometry(0.62, 0.5, 5.6, 12), mat(0xf7f8fa), 0, 0, 0, plane); fus.rotation.z = Math.PI / 2;
  M(new THREE.SphereGeometry(0.62, 12, 8), mat(0xf7f8fa), 2.8, 0, 0, plane);
  M(new THREE.BoxGeometry(1.5, 0.14, 7.6), mat(0xe6e9ee), 0.3, -0.15, 0, plane);
  M(new THREE.BoxGeometry(1.2, 1.5, 0.14), mat(C), -2.5, 0.8, 0, plane);
  M(new THREE.BoxGeometry(0.9, 0.12, 2.8), mat(0xe6e9ee), -2.5, 0.15, 0, plane);
  [-1.6, 1.6].forEach(z => { const e = M(new THREE.CylinderGeometry(0.28, 0.28, 1, 10), mat(0xa9b0bc), 0.6, -0.5, z, plane); e.rotation.z = Math.PI / 2; });
  tick(t => {
    const th = t * 0.42, R = 13;
    plane.position.set(Math.cos(th) * R, 14 + Math.sin(t * 0.8) * 0.8, Math.sin(th) * R - 3);
    plane.rotation.y = Math.atan2(-Math.cos(th), -Math.sin(th));
    plane.rotation.x = -0.32;
    beacon.visible = Math.sin(t * 5) > 0;
  });
  return { solidR: 8, sign: 11, snap: 34, extra: [[-10, 4, 1.8], [11, 3, 0.4]] };
}
