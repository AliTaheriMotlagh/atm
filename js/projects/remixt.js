import { rnd, hexNum } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { secs } from '../games/kit.js';
import { GH } from './links.js';

const project = {
  id: 'remixt', name: 'Remixt', color: '#ff4f8b', lang: 'TypeScript · Python',
  tagline: 'Remix any song in your browser. AI splits vocals from the beat, and you pair any vocal with any beat.',
  chips: ['Next.js', 'WebGPU', 'Updated 30 Sep 2026'], live: true,
  repos: [{ url: GH + 'remixt' }], site: 'https://remixt-free.vercel.app',
  pitch: {
    line: 'A browser DAW where uploading a song gives you its vocal and beat stems in seconds, without the song leaving your device.',
    rows: [
      ['Problem', 'Making a remix usually means hunting for stems, paying for a separation tool and learning a desktop DAW.'],
      ['Solution', 'Upload a track. Remixt splits it into vocals and instrumental in the browser, then its Studio lets you put any vocal over any beat, match tempo and pitch, mix, and publish under your artist name.'],
      ['Who it\'s for', 'Bedroom producers, fans who want to hear a mash-up, and creators who don\'t own a DAW.'],
      ['Why it stands out', 'Separation runs locally with Demucs on WebGPU or WebAssembly, so the original file stays private. On top sits a social layer with follows, comments, XP, badges and leaderboards.'],
      ['Status', 'Live at remixt-free.vercel.app.']
    ]
  },
  design: [
    { h: 'Studio', items: [
      'Per-lane editing: split, trim, drag and duplicate clips.',
      'Mixing: volume, EQ, filters, saturation, fades, stereo width and a master limiter.',
      'Effects: reverb and tempo-locked delay, with presets for vocals and for beats.',
      'AI matching arranges vocal phrases to fit the beat without changing pitch. It detects timing and silence.'
    ] },
    { h: 'Privacy and limits', items: [
      'The original song never leaves the device. Only the separated stems are uploaded.',
      'Songs up to 15 minutes, in mp3, wav, m4a, flac, ogg or aac.',
      'The model downloads once and is cached in the browser for later visits.'
    ] },
    { h: 'Community', items: ['Artist profiles you can follow, comments, XP and levels, badges, leaderboards.', 'Export to WAV with effect tails, or export each lane separately.'] }
  ],
  tech: {
    stack: [
      ['Frontend', 'Next.js (TypeScript), Web Audio API, SoundTouch for pitch and tempo, Cache Storage'],
      ['AI model', 'Demucs exported to ONNX, run with ONNX Runtime Web on WebGPU or WASM inside a Worker'],
      ['Backend', 'Next.js API routes on Node.js'],
      ['Database', 'PostgreSQL (Neon in production, Docker locally)'],
      ['Storage', 'Vercel Blob, Cloudflare R2 or local disk'],
      ['Auth', 'Signed JWT sessions in HTTP-only cookies'],
      ['Isolation', 'COOP and COEP headers so WebAssembly can use threads']
    ],
    arch: [{ h: 'Upload pipeline', ordered: true, items: [
      'Browser decodes and resamples the audio.',
      'A Worker runs Demucs to produce vocal and instrumental stems.',
      'Stems are encoded to MP3 (192 kbps by default).',
      'Stems upload to storage and the song is marked complete.'
    ] }, { h: 'Notes', items: [
      'Pitch and BPM matching use offline rendering rather than live audio worklets.',
      'Settings are stored as JSON columns so they can grow without migrations.'
    ] }],
    numbers: [['~172 MB', 'Demucs model, cached'], ['~28 MB', 'ONNX runtime'], ['15 min', 'max song length'], ['6', 'audio formats']]
  },
  docs: {
    steps: [
      { t: 'Requirements: Docker and Node 20+', code: 'git clone https://github.com/AliTaheriMotlagh/remixt.git\ncd remixt\n./start-dev.sh' },
      { t: 'What start-dev.sh runs', code: '# PostgreSQL on :5433\n# Next.js on :3000\n# schema is applied automatically on first run' },
      { t: 'web/.env.local', code: 'DATABASE_URL=...\nSESSION_SECRET=...\nSTORAGE_DIR=...\n# optional\nBLOB_READ_WRITE_TOKEN=...   # Vercel Blob\nR2_...                      # Cloudflare R2\nNEXT_PUBLIC_STEM_BITRATE=192' }
    ],
    tree: 'remixt/\n├─ web/                  Next.js app: auth, library, Studio,\n│                        gallery, profiles, in-browser splitter\n└─ separation-service/   legacy Python + Demucs service (reference only)'
  },
  glyph: '🎧',
  // Three challenges. `run(c)` builds the game into c.body (see games/runner.js);
  // `record` keeps a personal best on this device, where `lower` means a smaller score is better.
  games: [
    { key: 'rhythm', icon: '🎤', title: 'Stem Sync', desc: 'Watch the pads, then repeat the pattern. Three rounds, each one longer.', run: gRhythm },
    { key: 'tempo', icon: '🥁', title: 'Keep the Tempo', desc: 'Hear four clicks at 100 BPM, then keep tapping the beat on your own.', run: gTempo, record: { lower: true, fmt: v => `${Math.round(v)} ms drift` } },
    { key: 'mixer', icon: '🎚️', title: 'Mixdown', desc: 'Set the vocal, beat and bass faders inside their green zones.', run: gMixer, record: { lower: true, fmt: secs } }
  ],
  landmark
};
export default project;

/* --- Challenges --- */
function gRhythm(c) {
  const pads = [['🎤', 'Vocal', 262], ['🥁', 'Drums', 330], ['🎹', 'Keys', 392], ['🎚️', 'Mixer', 523]];
  const grid = c.el('div', 'rhythm-grid'), dots = c.el('div', 'dots');
  dots.innerHTML = '<i></i>'.repeat(3); c.body.append(grid, dots);
  const btns = pads.map(([ic, name], i) => { const b = c.el('button', 'rhythm-pad', ic); b.setAttribute('aria-label', name); b.onclick = () => tap(i); grid.append(b); return b; });
  let round = 0, seq = [], pos = 0, ready = false;
  const flash = i => { btns[i].classList.add('flash'); sfx.tone(pads[i][2], 0.2); c.after(200, () => btns[i].classList.remove('flash')); };
  const play = () => {
    ready = false; pos = 0; c.msg(`Round ${round + 1} of 3 · watch and listen…`);
    seq.forEach((n, i) => c.after(600 + i * 450, () => flash(n)));
    c.after(600 + seq.length * 450, () => { ready = true; c.msg(`Round ${round + 1} of 3 · your turn: ${seq.length} notes`); });
  };
  const next = () => { seq = Array.from({ length: 4 + round }, () => rnd(0, 3)); play(); };
  function tap(i) {
    if (!ready) return;
    flash(i);
    if (i !== seq[pos]) { ready = false; c.fail('Off beat! Here it is again…'); c.after(1100, play); return; }
    if (++pos < seq.length) return;
    ready = false; dots.children[round].classList.add('on'); round++;
    if (round === 3) c.win('Perfect sync: vocal and beat locked!');
    else { c.msg('Nice! The next pattern is longer…', 'good'); c.after(900, next); }
  }
  next();
}
function gTempo(c) {
  const BEAT = 600, NEED = 8;
  const pad = c.el('button', 'big-tap', 'TAP'), dots = c.el('div', 'dots');
  pad.setAttribute('aria-label', 'Tap the beat'); dots.innerHTML = '<i></i>'.repeat(NEED);
  c.body.append(pad, dots);
  let phase = 'count', taps = [], idle = 0;
  const pulse = () => { pad.classList.remove('pulse'); void pad.offsetWidth; pad.classList.add('pulse'); };
  const paint = () => [...dots.children].forEach((d, i) => d.classList.toggle('on', i < taps.length));
  function countIn() {
    phase = 'count'; taps = []; paint(); c.msg('Count-in: 1… 2… 3… 4…');
    for (let i = 0; i < 4; i++) c.after(500 + i * BEAT, () => { pulse(); sfx.tone(i ? 880 : 1320, 0.06, 'square', 0.05); });
    c.after(500 + 4 * BEAT - 150, () => { phase = 'tap'; c.msg(`Keep the beat going: ${NEED} taps on your own.`); });
  }
  function tap() {
    if (phase !== 'tap') { if (phase === 'count') c.msg('Listen to the count-in first…'); return; }
    taps.push(performance.now()); pulse(); sfx.tone(660, 0.05, 'square', 0.04); paint();
    c.cancel(idle);
    if (taps.length < NEED) {
      idle = c.after(2000, () => { phase = 'wait'; c.fail('You lost the beat. Counting in again…'); c.after(900, countIn); });
      return;
    }
    phase = 'done';
    const gaps = taps.slice(1).map((t, i) => t - taps[i]);
    const drift = gaps.reduce((s, v) => s + Math.abs(v - BEAT), 0) / gaps.length;
    const bpm = Math.round(60000 / (gaps.reduce((s, v) => s + v, 0) / gaps.length));
    if (drift <= 75) c.win(`In the pocket: ${bpm} BPM with ${Math.round(drift)} ms average drift.`, drift);
    else { c.fail(`${bpm} BPM, ${Math.round(drift)} ms drift. Under 75 ms clears it. Again…`); c.after(1800, countIn); }
  }
  c.on(pad, 'pointerdown', e => { if (e.button > 0) return; e.preventDefault(); tap(); });
  c.key(e => { if ((e.code === 'Space' || e.key === 'Enter') && (e.target === pad || e.target.tagName !== 'BUTTON')) { e.preventDefault(); tap(); } });
  countIn();
}
function gMixer(c) {
  const t0 = performance.now();
  const chans = ['🎤 Vocal', '🥁 Beat', '🔊 Bass'].map(name => {
    let target; do target = rnd(12, 88); while (Math.abs(target - 50) <= 10);
    return { name, target, v: 50 };
  });
  const wrap = c.el('div', 'mixer'); c.body.append(wrap);
  chans.forEach((ch, i) => {
    const row = c.el('div', 'fader');
    row.innerHTML = `<label for="fader-${i}"><span>${ch.name}</span><output>50</output></label><div class="track" aria-hidden="true"><i class="fill"></i><i class="zone" style="left:${ch.target - 6}%;width:12%"></i></div><input id="fader-${i}" type="range" min="0" max="100" value="50">`;
    const inp = row.querySelector('input'), out = row.querySelector('output'), fill = row.querySelector('.fill');
    const upd = () => { ch.v = +inp.value; out.textContent = ch.v; fill.style.width = ch.v + '%'; row.classList.toggle('ok', Math.abs(ch.v - ch.target) <= 6); };
    inp.oninput = upd; upd(); wrap.append(row);
  });
  const go = c.el('button', 'btn', 'Mixdown'); wrap.append(go);
  go.onclick = () => {
    if (c.won) return;
    const off = chans.filter(ch => Math.abs(ch.v - ch.target) > 6).map(ch => ch.name.split(' ')[1]);
    if (!off.length) c.win('Clean mix, no clipping. Ready to publish!', (performance.now() - t0) / 1000);
    else c.fail(`${off.join(' and ')} ${off.length > 1 ? 'are' : 'is'} off. Match the green zones.`);
  };
  c.msg('Drag each fader into its green zone, then press Mixdown.');
}

/* --- Landmark (local +Z faces the island centre) --- */
function landmark(g, c, { M, mat, tick }) {
  const C = hexNum(c);
  M(new THREE.BoxGeometry(12, 1.4, 8), mat(0x2b2f3a), 0, 0.7, 1, g);
  M(new THREE.CylinderGeometry(3.3, 3.3, 0.4, 40), mat(0xc9ced8, { metalness: 0.4, roughness: 0.4 }), -1.5, 1.6, 1, g);
  const vinyl = new THREE.Group(); vinyl.position.set(-1.5, 1.86, 1); g.add(vinyl);
  M(new THREE.CylinderGeometry(3.1, 3.1, 0.12, 40), mat(0x121419, { roughness: 0.3 }), 0, 0, 0, vinyl);
  M(new THREE.CylinderGeometry(1.1, 1.1, 0.14, 24), mat(C), 0, 0.01, 0, vinyl);
  M(new THREE.BoxGeometry(0.2, 0.15, 1.2), mat(0xffffff), 0, 0.02, 1.7, vinyl);
  tick((t, dt) => { vinyl.rotation.y -= dt * 3.2; });
  const arm = new THREE.Group(); arm.position.set(3.4, 1.4, -1.6); arm.rotation.y = -0.5; g.add(arm);
  M(new THREE.CylinderGeometry(0.45, 0.55, 0.9, 12), mat(0x9aa3b2), 0, 0.45, 0, arm);
  M(new THREE.BoxGeometry(0.22, 0.22, 4.2), mat(0xdfe3ea, { metalness: 0.5, roughness: 0.4 }), 0, 0.95, 2.0, arm);
  for (let i = 0; i < 3; i++) M(new THREE.CylinderGeometry(0.35, 0.35, 0.4, 12), mat(C), 4.3, 1.6, 1.8 + i * 1.1, g);
  const barGeo = new THREE.BoxGeometry(0.8, 1, 0.8); barGeo.translate(0, 0.5, 0);
  const bars = [];
  for (let i = 0; i < 12; i++) {
    const b = M(barGeo, mat(i % 3 === 0 ? 0xffffff : C, { emissive: C, emissiveIntensity: 0.25 }), -5.5 + i, 0, -5, g);
    bars.push(b);
  }
  const cones = [];
  [-7.8, 7.8].forEach(x => {
    M(new THREE.BoxGeometry(2.8, 6.4, 2.8), mat(0x1f232c), x, 3.2, -1, g);
    [[2, 0.95], [4.7, 0.55]].forEach(([y, r]) => {
      const cone = M(new THREE.CylinderGeometry(r, r * 0.8, 0.3, 20), mat(0x3a3f4b), x, y, 0.45, g);
      cone.rotation.x = Math.PI / 2; cones.push(cone);
    });
  });
  tick(t => {
    bars.forEach((b, i) => { b.scale.y = 0.6 + 6 * Math.abs(Math.sin(t * 3.1 + i * 0.7) * Math.sin(t * 1.3 + i * 0.35)); });
    const beat = 1 + 0.12 * Math.max(0, Math.sin(t * 8.4));
    cones.forEach(cn => cn.scale.set(beat, 1, beat));
  });
  return { solidR: 9.5, sign: 12 };
}
