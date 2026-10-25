import { rnd, shuffle, buzz, hexNum } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { GH } from './links.js';

const project = {
  id: 'walki', name: 'walki', color: '#ff5a1f', lang: 'JavaScript · Node',
  tagline: 'Push-to-talk walkie-talkie for every phone and desktop. Hold to talk, let go to listen.',
  chips: ['PWA', 'Zero dependencies', 'Updated 22 Oct 2026'], live: true,
  repos: [{ url: GH + 'walki' }], site: 'https://walki-free.vercel.app',
  shots: ['images/walki-join.jpg', 'images/walki-channel.jpg', 'images/walki-light.jpg'],
  pitch: {
    line: 'Join a channel, hold the big button to talk, let go to listen. It works on networks that block WebRTC and WebSockets.',
    rows: [
      ['Problem', 'Voice apps need accounts and installs, and real-time voice usually depends on WebRTC or WebSockets, which many office, school and mobile networks block.'],
      ['Solution', 'A walkie-talkie that only needs plain HTTPS. Holding the button records a clip on your device; letting go uploads it, and everyone else in the channel plays it.'],
      ['Who it\'s for', 'Small teams, families and event crews who want instant voice without a signup. Share a link and you are in the channel.'],
      ['Why it stands out', 'One talker at a time, like a real radio: anyone else who presses gets a busy signal. Clips are 8 kHz mu-law, about 8 KB per second of speech.'],
      ['Status', 'Live at walki-free.vercel.app. Installable on iPhone, iPad and Android.']
    ]
  },
  design: [
    { h: 'Radio rules', items: [
      'The floor: one talker per channel. Pressing while someone else talks plays a busy signal.',
      'Voice goes out when you let go, like a voice message, and plays for everyone about 1 to 2 seconds later.',
      'Up to 16 members per channel and 60 seconds per transmission (both configurable).'
    ] },
    { h: 'Phones first', items: [
      'Holding the button is tuned for iPhone and Android, including fast repeated taps that used to confuse the recorder.',
      'Keeps the screen awake while a channel is open, because browsers pause audio in the background.',
      'Share opens a link straight into the channel. Add it to the home screen to use it as an app.'
    ] },
    { h: 'Look and feel', items: ['Brand tokens with light and dark themes. Every animation uses GPU-only transforms and opacity.'] }
  ],
  tech: {
    stack: [
      ['Client', 'Vanilla JavaScript PWA with a service worker, no framework and no build step'],
      ['Audio', 'An AudioWorklet (`recorder.js`) records the mic and encodes 8 kHz mu-law'],
      ['Transport', 'Plain HTTPS polling every 1.5 s, slower when the channel is quiet, paused after 10 minutes of silence'],
      ['API', 'One Vercel function, `api/[action].js`: poll, talk, release, leave, clip'],
      ['State', 'Upstash Redis. Each request is a single atomic Lua script'],
      ['Local dev', '`server.js` serves the same API and files with an in-memory store, and HTTPS when certificates are present']
    ],
    arch: [
      { h: 'One transmission', ordered: true, items: [
        'Press: `/api/talk` takes the floor atomically, or returns who already has it.',
        'Hold: the worklet records and encodes the clip on the device.',
        'Release: the clip uploads to `/api/clip`, which stores it, pushes it on the channel list and frees the floor.',
        'Everyone else sees the new clip on their next poll and plays it.'
      ] },
      { h: 'Limits', items: ['True locked-screen listening needs a native wrapper (iOS PushToTalk framework or an Android foreground service); the code is ready to wrap with Capacitor.'] }
    ],
    numbers: [['~8 KB', 'per second of speech'], ['1.5 s', 'poll interval'], ['16', 'members per channel'], ['0', 'dependencies']]
  },
  docs: {
    note: 'Phones need HTTPS for the microphone. `npm run tunnel` gives you a public https link for testing on real devices.',
    steps: [
      { t: 'Run locally', code: 'git clone https://github.com/AliTaheriMotlagh/walki.git\ncd walki\nnpm install\nnpm start            # http://localhost:3000' },
      { t: 'Test on phones', code: 'npm run tunnel       # prints a https://….trycloudflare.com link' },
      { t: 'Deploy', code: '# Vercel → Storage → Upstash for Redis (sets KV_REST_API_URL / KV_REST_API_TOKEN)\nvercel deploy --prod' }
    ],
    tree: 'walki/\n├─ public/\n│  ├─ app.js        polling, push-to-talk, playback\n│  ├─ recorder.js   AudioWorklet, mu-law encoder\n│  ├─ styles.css    tokens, themes, animation\n│  └─ sw.js         offline shell\n├─ lib/walki.js     channel logic, Redis Lua scripts\n├─ api/[action].js  the Vercel function\n└─ server.js        local dev server'
  },
  glyph: '📻',
  games: [
    { key: 'hold', icon: '🎙️', title: 'Hold to Talk', desc: 'Hold the button for exactly as long as asked. Three transmissions, each within 0.3 s.', run: gHold, record: { lower: true, fmt: v => `${v.toFixed(2)} s off` } },
    { key: 'floor', icon: '🚦', title: 'Grab the Floor', desc: 'When the channel goes quiet, press before the others do. Win 5 of 8. Pressing while busy gets you a busy signal.', run: gFloor, record: { lower: true, fmt: v => `${Math.round(v)} ms` } },
    { key: 'queue', icon: '📻', title: 'Clip Queue', desc: 'Clips play in order. Tap the speakers back in the same order, up to six clips long.', run: gQueue }
  ],
  landmark
};
export default project;

/* --- Challenges --- */
// The big round button used by the first two challenges. Pointer and Space both work, and a second
// finger or a repeated key can't start a second press.
function ptt(c, el, down, up) {
  let held = false;
  const press = e => { if (held) return; held = true; el.classList.add('on'); down(e); };
  const release = e => { if (!held) return; held = false; el.classList.remove('on'); up?.(e); };
  c.on(el, 'pointerdown', e => { if (e.button > 0) return; e.preventDefault(); el.setPointerCapture?.(e.pointerId); press(e); });
  c.on(el, 'pointerup', release); c.on(el, 'pointercancel', release); c.on(el, 'lostpointercapture', release);
  c.on(el, 'contextmenu', e => e.preventDefault());
  c.key(e => { if (e.code === 'Space') { e.preventDefault(); press(e); } });
  c.on(window, 'keyup', e => { if (e.code === 'Space') release(e); });
}

function gHold(c) {
  const ROUNDS = 3, TOL = 0.3;
  const wrap = c.html(`<div class="w-game wk"><div class="wk-target">Hold for <b>–</b></div><button class="wk-ptt" type="button" aria-label="Push to talk"><span>🎙️</span><small>Hold to talk</small></button><div class="wk-wave" aria-hidden="true">${'<i></i>'.repeat(9)}</div><div class="dots"><i></i><i></i><i></i></div></div>`);
  const btn = wrap.querySelector('.wk-ptt'), label = btn.querySelector('small'), goal = wrap.querySelector('.wk-target b');
  const wave = wrap.querySelector('.wk-wave'), dots = wrap.querySelectorAll('.dots i');
  let round = 0, target = 0, t0 = 0, err = 0, done = false;
  const next = () => { target = rnd(10, 32) / 10; goal.textContent = `${target.toFixed(1)} s`; label.textContent = 'Hold to talk'; };
  ptt(c, btn, () => {
    if (done) return;
    t0 = performance.now(); label.textContent = 'Talking…'; wave.classList.add('on');
    sfx.tone(1200, 0.05, 'sine', 0.04); buzz(15);
  }, () => {
    if (done || !t0) return;
    const held = (performance.now() - t0) / 1000, off = Math.abs(held - target); t0 = 0;
    wave.classList.remove('on'); sfx.tone(700, 0.05, 'sine', 0.04);
    if (off > TOL) { c.fail(`Held ${held.toFixed(2)} s for a ${target.toFixed(1)} s message: ${off.toFixed(2)} s off. Try this one again.`); next(); return; }
    err += off; dots[round].classList.add('on'); round++;
    if (round >= ROUNDS) { done = true; label.textContent = 'Over and out'; c.win(`Three clean transmissions, ${err.toFixed(2)} s off in total. Over and out.`, err); return; }
    c.msg(`${held.toFixed(2)} s, ${off.toFixed(2)} s off. Copy that. ${ROUNDS - round} to go.`, 'good'); next();
  });
  next(); btn.dataset.autofocus = '';
  c.msg('Hold the button (or Space) and let go when you think the time is up. No clock while you talk!');
}

function gFloor(c) {
  const NEED = 5, ROUNDS = 8, STRIKES = 2;
  const bots = shuffle(['Mina', 'Reza', 'Sara', 'Omid', 'Lily', 'Arash']).slice(0, 3);
  const wrap = c.html(`<div class="w-game wk"><div class="wk-members">${bots.map(n => `<span data-n="${n}"><i>${n[0]}</i><small>${n}</small></span>`).join('')}<span class="me"><i>You</i><small>you</small></span></div><div class="wk-status">Channel #island</div><button class="wk-ptt" type="button" aria-label="Push to talk"><span>🎙️</span><small>Hold to talk</small></button><div class="count">Floor 0 / ${NEED} · round 0 / ${ROUNDS}</div></div>`);
  const btn = wrap.querySelector('.wk-ptt'), status = wrap.querySelector('.wk-status'), cnt = wrap.querySelector('.count');
  const mem = n => wrap.querySelector(`[data-n="${n}"]`), meEl = wrap.querySelector('.me');
  let round = 0, wins = 0, strikes = 0, state = 'idle', freeAt = 0, timer = 0;
  const times = [];
  const setTalker = (n, on) => (n === 'me' ? meEl : mem(n)).classList.toggle('talk', on);
  const paint = () => { cnt.textContent = `Floor ${wins} / ${NEED} · round ${round} / ${ROUNDS}${strikes ? ` · ${'⚠️'.repeat(strikes)}` : ''}`; };
  function start() {
    if (round >= ROUNDS) return;
    round++; paint();
    const talker = bots[rnd(0, bots.length - 1)];
    state = 'busy'; btn.className = 'wk-ptt busy'; status.textContent = `${talker} is talking…`; setTalker(talker, true);
    timer = c.after(rnd(1400, 3400), () => {
      setTalker(talker, false);
      state = 'free'; freeAt = performance.now(); btn.className = 'wk-ptt free'; status.textContent = 'Channel quiet. Grab the floor!';
      sfx.tone(980, 0.04, 'sine', 0.03);
      const rival = bots[rnd(0, bots.length - 1)], react = rnd(330, 620) - round * 15;
      timer = c.after(react, () => {
        state = 'lost'; btn.className = 'wk-ptt busy'; setTalker(rival, true); status.textContent = `${rival} got the floor first.`;
        c.fail(`${rival} beat you to it.`); timer = c.after(1200, () => { setTalker(rival, false); end(); });
      });
    });
  }
  function end() {
    if (wins >= NEED) return;
    if (ROUNDS - round < NEED - wins) { state = 'over'; btn.className = 'wk-ptt'; status.textContent = 'Channel closed'; c.fail(`Only ${wins} of ${NEED} floors in ${ROUNDS} rounds. Press Restart.`); return; }
    start();
  }
  ptt(c, btn, () => {
    if (state === 'idle') { c.msg('Wait for the channel to go quiet, then press.'); start(); return; }
    if (state === 'busy' || state === 'lost') {
      strikes++; paint();
      sfx.tone(420, 0.12, 'square', 0.05); setTimeout(() => sfx.tone(420, 0.12, 'square', 0.05), 180); buzz([40, 40, 40]);
      if (strikes >= STRIKES) { c.cancel(timer); state = 'over'; btn.className = 'wk-ptt'; status.textContent = 'Kicked for talking over people'; c.fail('Second busy signal. Press Restart.'); return; }
      c.fail('Busy signal! Someone is talking. One more and you are out.'); return;
    }
    if (state !== 'free') return;
    c.cancel(timer);
    const ms = performance.now() - freeAt; times.push(ms); wins++; paint();
    state = 'mine'; btn.className = 'wk-ptt on'; setTalker('me', true); status.textContent = `You have the floor (${Math.round(ms)} ms)`;
    sfx.tone(1200, 0.06, 'sine', 0.04); buzz(15);
    if (wins >= NEED) {
      const avg = times.reduce((s, v) => s + v, 0) / times.length;
      state = 'over'; c.win(`${NEED} floors grabbed, ${Math.round(avg)} ms on average. Loud and clear.`, avg); return;
    }
    c.msg(`Got it in ${Math.round(ms)} ms.`, 'good');
    timer = c.after(1000, () => { setTalker('me', false); end(); });
  });
  btn.dataset.autofocus = '';
  c.msg('Press the button (or Space) to join the channel.');
}

function gQueue(c) {
  const GOAL = 6;
  const people = [['Mina', '#ff5a1f', 392], ['Reza', '#12b76a', 494], ['Sara', '#36c2ff', 587], ['Omid', '#f5a524', 659]];
  const wrap = c.html(`<div class="w-game"><div class="wk-pads"></div><div class="count">Queue length 1 of ${GOAL}</div></div>`);
  const pads = wrap.querySelector('.wk-pads'), cnt = wrap.querySelector('.count');
  const btns = people.map(([n, col], i) => {
    const b = c.el('button', 'wk-pad'); b.style.setProperty('--c', col);
    b.innerHTML = `<i>${n[0]}</i><small>${n}</small>`; b.setAttribute('aria-label', n);
    b.onclick = () => tap(i); pads.append(b); return b;
  });
  const seq = [];
  let pos = 0, busy = true;
  const flash = (i, ms = 380) => { btns[i].classList.add('lit'); sfx.tone(people[i][2], ms / 1000 * 0.8, 'triangle', 0.06); c.after(ms, () => btns[i].classList.remove('lit')); };
  function play() {
    busy = true; pos = 0; cnt.textContent = `Queue length ${seq.length} of ${GOAL}`; c.msg('Listen…');
    const gap = Math.max(420, 640 - seq.length * 30);
    seq.forEach((k, j) => c.after(500 + j * gap, () => flash(k, gap - 120)));
    c.after(500 + seq.length * gap, () => { busy = false; c.msg('Your turn: tap them back in order.'); });
  }
  function tap(i) {
    if (busy || c.won) return;
    flash(i, 220);
    if (i !== seq[pos]) { busy = true; c.fail(`That was ${people[i][0]}; ${people[seq[pos]][0]} spoke next. Press Restart.`); return; }
    pos++;
    if (pos < seq.length) return;
    if (seq.length >= GOAL) { busy = true; c.win(`All ${GOAL} clips in order. Every message delivered.`); return; }
    seq.push(rnd(0, 3)); c.after(400, play);
  }
  seq.push(rnd(0, 3));
  c.after(300, play);
}

/* --- Landmark (local +Z faces the island centre) --- */
// A giant walkie-talkie with a glowing push-to-talk button and radio rings rising from its antenna.
function landmark(g, c, { M, mat, tick }) {
  const C = hexNum(c);
  M(new THREE.CylinderGeometry(7.4, 7.9, 1, 8), mat(0x2a2d35), 0, 0.5, 0, g);
  M(new THREE.CylinderGeometry(5.2, 5.6, 0.6, 32), mat(0x1c1a18), 0, 1.3, 0, g);
  // Rounded body.
  const W = 4.6, H = 8.6, r = 0.9, s = new THREE.Shape();
  s.moveTo(-W / 2 + r, 0); s.lineTo(W / 2 - r, 0); s.quadraticCurveTo(W / 2, 0, W / 2, r); s.lineTo(W / 2, H - r); s.quadraticCurveTo(W / 2, H, W / 2 - r, H);
  s.lineTo(-W / 2 + r, H); s.quadraticCurveTo(-W / 2, H, -W / 2, H - r); s.lineTo(-W / 2, r); s.quadraticCurveTo(-W / 2, 0, -W / 2 + r, 0);
  const bodyGeo = new THREE.ExtrudeGeometry(s, { depth: 2.4, bevelEnabled: true, bevelSize: 0.2, bevelThickness: 0.2, bevelSegments: 2, curveSegments: 8 });
  bodyGeo.translate(0, 0, -1.2);
  M(bodyGeo, mat(C, { roughness: 0.45 }), 0, 1.6, 0, g);
  // Speaker grille, screen and the big button, all on the side facing the road (+Z).
  for (let row = 0; row < 6; row++) for (let k = 0; k < 5; k++) M(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 8), mat(0x1c1a18), -1.3 + k * 0.65, 3.0 + row * 0.55, 1.43, g, true).rotation.x = Math.PI / 2;
  M(new THREE.BoxGeometry(3.2, 1.3, 0.12), mat(0x0e1a12), 0, 7.6, 1.42, g, true);
  const screen = M(new THREE.BoxGeometry(2.9, 1.0, 0.06), new THREE.MeshStandardMaterial({ color: 0x12b76a, emissive: 0x12b76a, emissiveIntensity: 0.7, flatShading: true }), 0, 7.6, 1.5, g, true);
  const btn = M(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 24), mat(0xffffff, { emissive: C, emissiveIntensity: 0.3 }), 0, 9.2, 1.0, g);
  btn.rotation.x = Math.PI / 2;
  // Side push-to-talk bar and the top knob.
  M(new THREE.BoxGeometry(0.4, 2.2, 1), mat(0x1c1a18), -W / 2 - 0.3, 6.4, 0, g);
  M(new THREE.CylinderGeometry(0.5, 0.5, 0.8, 16), mat(0x1c1a18), 1.2, 10.6, 0, g);
  // Antenna.
  M(new THREE.CylinderGeometry(0.3, 0.38, 5.4, 10), mat(0x1c1a18), -1.2, 12.9, 0, g);
  const tip = M(new THREE.SphereGeometry(0.45, 12, 8), new THREE.MeshStandardMaterial({ color: C, emissive: C, emissiveIntensity: 0.8 }), -1.2, 15.8, 0, g, true);
  // Radio rings that rise and fade from the antenna.
  const rings = [0, 1, 2].map(() => {
    const m = M(new THREE.TorusGeometry(1, 0.08, 6, 40), new THREE.MeshBasicMaterial({ color: C, transparent: true, opacity: 0.8, depthWrite: false }), -1.2, 15.8, 0, g, true);
    m.rotation.x = Math.PI / 2; return m;
  });
  tick(t => {
    rings.forEach((m, i) => {
      const k = (t * 0.5 + i / 3) % 1;
      m.scale.setScalar(0.6 + k * 5.5); m.position.y = 15.8 + k * 2.4; m.material.opacity = 0.75 * (1 - k);
    });
    const talk = (t % 4) < 1.6;
    btn.position.z = talk ? 0.85 : 1.0;
    screen.material.emissive.setHex(talk ? C : 0x12b76a);
    tip.material.emissiveIntensity = talk ? 0.6 + 0.4 * Math.sin(t * 20) : 0.5;
  });
  return { solidR: 7.9, sign: 18, snap: 30 };
}
