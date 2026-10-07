import { rnd, clamp, shake, buzz, isTouch, hexNum } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { secs } from '../games/kit.js';
import { GH } from './links.js';

const project = {
  id: 'nexus', name: 'Nexus SCADA', color: '#06b6d4', lang: 'TypeScript · React + Node',
  tagline: 'A full-stack HMI/SCADA and home-automation platform in TypeScript: live tags, alarms, trends, 2D and 3D graphics, and scripting.',
  chips: ['React', 'SignalR', 'Three.js', 'Updated 5 Oct 2026'], live: true,
  repos: [{ url: GH + 'nexus-scada' }], site: 'https://nexus-scada.onrender.com/',
  pitch: {
    line: 'One Node process serves the web HMI, the REST API and a SignalR hub, and runs the tag engine, drivers, alarms, historian, scripts and scheduler.',
    rows: [
      ['Problem', 'Industrial HMI/SCADA suites are expensive, tied to Windows, and configured through editors whose changes you can\'t diff or review.'],
      ['Solution', 'A browser HMI with a graphics designer, alarms, trends, recipes, maps and 3D scenes. It is configured as code in YAML, hot-reloads, and is scripted in TypeScript on both the server and the page.'],
      ['Who it\'s for', 'Automation engineers, system integrators, and home-automation tinkerers with Zigbee, Tasmota, Shelly or Home Assistant.'],
      ['Why it stands out', 'It speaks the real ASP.NET Core SignalR protocol, so the stock `@microsoft/signalr` client connects. One TypeScript script API runs on the server and in the page, with Monaco autocomplete for every tag path.'],
      ['Status', 'Public demo at nexus-scada.onrender.com: operate the plant freely, saving is disabled. The free host sleeps, so the first load can take a minute. Demo logins: admin/admin, engineer/engineer, operator/operator.']
    ]
  },
  design: [
    { h: 'Operator HMI', items: [
      'Graphic displays with tanks, pumps, valves, motors, conveyors and flowing pipes, all bound to live tags.',
      'An alarm bar with horn and silence, an alarm viewer (active, shelved, history) and map sites coloured by their worst alarm.',
      'Trends with live and historical modes, drag to zoom, up to 10 pens and CSV export.',
      'Faceplates that open as draggable windows, and recipes you can download, capture and compare.'
    ] },
    { h: 'Alarms, ISA-18.2 style', items: [
      'HiHi, Hi, Lo and LoLo limits, plus on/off, equals and bad-quality alarms.',
      'Deadband, on-delay, priorities, acknowledge with a comment, and shelving with expiry.',
      'Notifications to ntfy, Telegram, Slack, Discord or a webhook.'
    ] },
    { h: 'Engineering', items: [
      'Graphics designer: drag, resize, rotate, snap, align, group, layers, undo and redo, live preview.',
      'Bind any property to a tag, a TypeScript expression or value-map rules (`>80 → red`, `10..20`, `default`).',
      '3D scenes with React Three Fiber, move/rotate/scale gizmos and clickable faceplates.',
      'Automatic configuration revisions with diff and restore. Edit the YAML in Git or any editor.'
    ] }
  ],
  tech: {
    stack: [
      ['Client', 'React, Vite, uPlot trends, Leaflet map, React Three Fiber, Monaco editor'],
      ['Server', 'Node 22+, one process: HTTP, REST API and a SignalR hub implemented from the protocol'],
      ['Drivers', 'Simulation, memory, Modbus TCP, MQTT, REST (Home Assistant, Hue) and SQL'],
      ['Historian', 'Built-in `node:sqlite`: store on change with deadband, min/avg/max buckets, retention'],
      ['Scripting', 'TypeScript compiled with sucrase, run in sandboxed `vm` contexts with persistent state'],
      ['Security', 'scrypt hashes, HMAC-signed tokens, roles from viewer to admin, and an audit trail'],
      ['Ops', 'Docker image, health endpoint, PWA manifest, no native modules']
    ],
    arch: [{ h: 'Design patterns', items: [
      'Composition root: `Runtime` builds every service once.',
      'Observer: a typed `EventBus` decouples tags, alarms, historian, scripts and the hub.',
      'Strategy and factory registry for drivers and graphic elements: adding one is one module and one `register` call.',
      'State machine for the alarm lifecycle, and the Command pattern for designer undo and redo.',
      'Adapter: the SignalR protocol layer is separate from the hub logic.'
    ] }],
    numbers: [['6', 'driver types'], ['100 ms', 'push batches'], ['4', 'user roles'], ['1', 'process']]
  },
  docs: {
    steps: [
      { t: 'Local (Node 24+)', code: 'npm install\nnpm run dev        # server :8080 + Vite :5173 with hot reload\n# production:\nnpm run build && npm start      # http://localhost:8080' },
      { t: 'Docker', code: 'docker compose up -d                  # http://localhost:8080\ndocker compose --profile iot up -d    # + Mosquitto MQTT broker' },
      { t: 'Checks', code: 'npm test           # server unit and protocol tests\nnpm run typecheck' },
      { t: 'A server script (project/scripts/Thermostat.ts)', code: "const temp: number = tags.get('Home/Sensors/LivingRoomTemp');\nconst target = tags.get('Home/Devices/ThermostatSetpoint');\nif (temp < target - 0.4) await tags.write('Home/Devices/Heating', true);\nelse if (temp > target + 0.4) await tags.write('Home/Devices/Heating', false);" }
    ],
    tree: 'shared/        types, script API, compiler (one source of truth)\nserver/src/\n├─ Runtime.ts   composition root\n├─ tags/        TagEngine\n├─ drivers/     Simulation, Modbus, MQTT, REST, SQL\n├─ alarms/      AlarmEngine, Notifier\n├─ historian/   SQLite historian\n├─ scripting/   ScriptEngine (vm sandbox)\n└─ realtime/    SignalRServer, RuntimeHub\nclient/src/    pages, graphics, scene3d, editor\nproject/       project.yaml, displays, scenes, scripts'
  },
  glyph: '🏭',
  games: [
    { key: 'tank', icon: '🛢️', title: 'Tank Level', desc: 'Run pump P-101 to keep the tank between Lo and Hi for 15 seconds. HiHi or LoLo trips the plant.', run: gTank, record: { lower: true, fmt: v => `${v} alarm${v === 1 ? '' : 's'}` } },
    { key: 'alarms', icon: '🚨', title: 'Alarm Triage', desc: 'Acknowledge 10 alarms, always the highest priority first. Don\'t let the list flood.', run: gAlarms, record: { lower: true, fmt: secs } },
    { key: 'valuemap', icon: '🎛️', title: 'Value Map', desc: 'Read the live tag value and pick the state its value-map rules give. 10 right to clear.', run: gValueMap, record: { lower: true, fmt: secs } }
  ],
  landmark
};
export default project;

/* --- Challenges --- */
function gTank(c) {
  const LL = 6, LO = 20, HI = 80, HH = 94, NEED = 15;
  const wrap = c.html(`<div class="hmi">
    <div class="tank" aria-hidden="true"><i class="lvl"></i>
      <b class="lim hh" style="bottom:${HH}%">HiHi</b><b class="lim hi" style="bottom:${HI}%">Hi</b><b class="lim lo" style="bottom:${LO}%">Lo</b><b class="lim ll" style="bottom:${LL}%">LoLo</b>
      <span class="pv">50.0 %</span></div>
    <div class="hmi-side">
      <button class="pump" type="button" aria-pressed="false"><span>P-101</span><small>STOPPED</small></button>
      <dl class="hmi-tags"><div><dt>Level</dt><dd class="t-lvl">50.0 %</dd></div><div><dt>Demand</dt><dd class="t-dem">0.0 %/s</dd></div><div><dt>In band</dt><dd class="t-band">0.0 s</dd></div><div><dt>Alarms</dt><dd class="t-alm">0</dd></div></dl>
      <canvas class="trend" aria-hidden="true"></canvas>
    </div></div>`);
  const lvl = wrap.querySelector('.lvl'), pv = wrap.querySelector('.pv'), pump = wrap.querySelector('.pump'), tank = wrap.querySelector('.tank');
  const tL = wrap.querySelector('.t-lvl'), tD = wrap.querySelector('.t-dem'), tB = wrap.querySelector('.t-band'), tA = wrap.querySelector('.t-alm');
  const cv = wrap.querySelector('canvas'), x = cv.getContext('2d'), hist = [];
  let L = 50, on = false, demand = 7, inBand = 0, alarms = 0, zone = 'ok', running = true, tripped = false, sample = 0;
  const setPump = v => { on = v; pump.classList.toggle('on', on); pump.setAttribute('aria-pressed', String(on)); pump.querySelector('small').textContent = on ? 'RUNNING' : 'STOPPED'; sfx.play('tick'); };
  pump.onclick = () => { if (running) setPump(!on); };
  c.key(e => { if (e.code === 'Space' && e.target.tagName !== 'BUTTON') { e.preventDefault(); if (running) setPump(!on); } });
  function drawTrend() {
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    if (!W) return;
    if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    x.fillStyle = 'rgba(116,255,155,.12)'; x.fillRect(0, H * (1 - HI / 100), W, H * (HI - LO) / 100);
    x.strokeStyle = '#22d3ee'; x.lineWidth = 2; x.beginPath();
    hist.forEach((v, i) => x.lineTo(W - (hist.length - 1 - i) * (W / 60), H * (1 - v / 100)));
    x.stroke();
  }
  function trip(text) {
    running = false; tripped = true; tank.classList.add('trip'); shake(tank); c.fail(`${text} Plant tripped. Restarting…`);
    c.after(1700, () => { L = 50; inBand = 0; hist.length = 0; zone = 'ok'; setPump(false); tank.classList.remove('trip'); running = true; tripped = false; c.msg('Plant restarted. Keep the level between Lo and Hi.'); });
  }
  c.loop(dt => {
    if (running) {
      demand = clamp(demand + (Math.random() - 0.5) * 9 * dt, 3, 12);
      L += ((on ? 15 : 0) - demand) * dt;
      const z = L >= HH ? 'hh' : L <= LL ? 'll' : L > HI ? 'hi' : L < LO ? 'lo' : 'ok';
      if (z !== zone) {
        if ((z === 'hi' || z === 'lo') && zone === 'ok') { alarms++; sfx.play('fail'); buzz(30); c.msg(`${z === 'hi' ? 'Hi' : 'Lo'} alarm on Tank1/Level! Bring it back into the band.`, 'bad'); }
        if (z === 'ok') c.msg('Back in band.', 'good');
        zone = z;
      }
      if (z === 'hh') trip('HiHi: the tank overflowed.');
      else if (z === 'll') trip('LoLo: the pump ran dry.');
      else if (z === 'ok') inBand += dt;
      if ((sample += dt) > 0.25) { sample = 0; hist.push(L); if (hist.length > 61) hist.shift(); }
      if (inBand >= NEED && !tripped) { running = false; c.win(`Stable for ${NEED} s with ${alarms} alarm${alarms === 1 ? '' : 's'}.`, alarms); }
    }
    const v = clamp(L, 0, 100);
    lvl.style.height = v + '%'; lvl.className = 'lvl ' + zone;
    pv.textContent = tL.textContent = `${v.toFixed(1)} %`;
    tD.textContent = `${demand.toFixed(1)} %/s`; tB.textContent = `${Math.min(inBand, NEED).toFixed(1)} s`; tA.textContent = alarms;
    drawTrend();
  });
  pump.dataset.autofocus = '';
  c.msg(`Demand keeps changing. Switch the pump to hold the level in band for ${NEED} s${isTouch ? '' : ' (Space toggles it)'}.`);
}

function gAlarms(c) {
  const NEED = 10, FLOOD = 8;
  const PRI = [['Urgent', 'p1'], ['High', 'p2'], ['Medium', 'p3'], ['Low', 'p4']];
  const TAGS = ['Plant/Area1/Tank1/Level HiHi', 'Plant/Boiler/Pressure Hi', 'Sites/PumpStation/P2 Fault', 'Plant/Line1/Conveyor Jam', 'Sites/ColdStore/Temp Hi',
    'Home/Sensors/Smoke', 'Sites/Solar/Inverter Trip', 'Plant/AHU1/Filter dP Hi', 'Sites/Greenhouse/Humidity Lo', 'Plant/Area1/Pump1 Overload', 'Home/Door/Front Open', 'Sites/EnergyMeter/Comms Lost'];
  const wrap = c.html(`<div class="w-game"><div class="alarm-head"><span>Priority</span><span>Alarm</span><span>Time</span></div><ol class="alarm-list" aria-live="polite"></ol><div class="count">0 / ${NEED} acknowledged</div></div>`);
  const list = wrap.querySelector('.alarm-list'), cnt = wrap.querySelector('.count');
  const t0 = performance.now();
  let active = [], seq = 0, acked = 0, running = true, spawnIn = 0;
  const stamp = () => { const d = new Date(); return d.toTimeString().slice(0, 8); };
  // The one to acknowledge: most urgent first, then the oldest.
  const due = () => active.reduce((a, b) => (b.p < a.p || (b.p === a.p && b.n < a.n) ? b : a), active[0]);
  function add() {
    let tag; do tag = TAGS[rnd(0, TAGS.length - 1)]; while (active.some(a => a.tag === tag));
    const r = Math.random(), p = r < 0.18 ? 0 : r < 0.45 ? 1 : r < 0.75 ? 2 : 3;
    active.push({ n: seq++, p, tag, at: stamp() }); sfx.tone([988, 784, 660, 523][p], 0.08, 'square', 0.03);
    render();
    if (active.length >= FLOOD) { running = false; c.fail(`Alarm flood: ${active.length} unacknowledged. Press Restart.`); }
  }
  // Re-renders the list, keeping keyboard focus on the same alarm.
  function render() {
    const had = document.activeElement?.dataset?.n;
    list.innerHTML = '';
    active.forEach(a => {
      const li = document.createElement('li'), b = c.el('button', `alarm ${PRI[a.p][1]}`);
      b.dataset.n = a.n;
      b.innerHTML = `<b>${PRI[a.p][0]}</b><span>${a.tag}</span><small>${a.at}</small>`;
      b.setAttribute('aria-label', `${PRI[a.p][0]} priority: ${a.tag}. Acknowledge`);
      b.onclick = () => ack(a, b); li.append(b); list.append(li);
    });
    if (had != null) list.querySelector(`[data-n="${had}"]`)?.focus({ preventScroll: true });
  }
  function ack(a, b) {
    if (!running || c.won) return;
    const want = due();
    if (a !== want) { shake(b); c.fail(`Not yet: the ${PRI[want.p][0].toLowerCase()} "${want.tag}" comes first.`); return; }
    active = active.filter(x => x !== a); acked++; cnt.textContent = `${acked} / ${NEED} acknowledged`; sfx.tone(660 + acked * 30, 0.06); buzz(10);
    render();
    if (acked >= NEED) { running = false; const s = (performance.now() - t0) / 1000; c.win(`${NEED} alarms handled in ${s.toFixed(1)} s. The control room is calm.`, s); return; }
    list.querySelector('button')?.focus({ preventScroll: true });
    c.msg(active.length ? 'Acknowledged. Next: highest priority, then oldest.' : 'All clear… for now.', 'good');
  }
  for (let i = 0; i < 3; i++) add();
  c.loop(dt => {
    if (!running) return false;
    spawnIn -= dt; if (spawnIn <= 0) { add(); spawnIn = Math.max(0.9, 1.8 - acked * 0.08); }
  });
  c.msg('Acknowledge the highest priority first. If two match, the older one.');
}

function gValueMap(c) {
  const NEED = 10, LIVES = 3;
  const STATES = [['🔵', 'Lo', 'lo'], ['🟢', 'Normal', 'ok'], ['🟠', 'Hi', 'hi'], ['🔴', 'HiHi', 'hh']];
  const a = rnd(15, 30), b = rnd(45, 60), d = rnd(72, 88);
  const wrap = c.html(`<div class="quiz vmap"><pre class="rules">${`value &lt; ${a}  → 🔵 Lo\n${a}..${b}      → 🟢 Normal\n${b}..${d}      → 🟠 Hi\nvalue &gt; ${d}  → 🔴 HiHi`}</pre><div class="eyebrow">Tank1/Level</div><div class="quiz-term vm-val"></div><div class="seq-opts"></div><div class="count"></div></div>`);
  const val = wrap.querySelector('.vm-val'), opts = wrap.querySelector('.seq-opts'), cnt = wrap.querySelector('.count');
  let v = 0, right = 0, miss = 0, busy = false;
  const t0 = performance.now();
  const stateOf = n => n < a ? 0 : n <= b ? 1 : n <= d ? 2 : 3;
  STATES.forEach(([ic, name], i) => { const btn = c.el('button', 'opt', `${ic} ${isTouch ? name : `${i + 1} · ${name}`}`); btn.onclick = () => answer(i); opts.append(btn); });
  function next() {
    // Values near a threshold are the interesting ones.
    const edge = [a, b, d][rnd(0, 2)];
    do v = Math.random() < 0.6 ? edge + rnd(-4, 4) : rnd(2, 98); while (v === a || v === b || v === d);
    val.textContent = `${v.toFixed(0)} %`; val.classList.remove('in'); void val.offsetWidth; val.classList.add('in');
    cnt.textContent = `${right} / ${NEED} · ${'❤️'.repeat(LIVES - miss)}${'🖤'.repeat(miss)}`;
  }
  function answer(i) {
    if (busy || c.won || miss >= LIVES) return;
    const s = stateOf(v);
    if (i === s) {
      right++; sfx.tone(600 + right * 40, 0.06);
      if (right >= NEED) { cnt.textContent = `${right} / ${NEED}`; const t = (performance.now() - t0) / 1000; c.win(`Every binding right in ${t.toFixed(1)} s. Your HMI animates correctly!`, t); return; }
      c.msg(`${v} → ${STATES[s][1]}. Correct.`, 'good'); next(); return;
    }
    miss++; shake(val);
    if (miss >= LIVES) { cnt.textContent = `${right} / ${NEED} · 🖤🖤🖤`; c.fail(`${v} maps to ${STATES[s][1]}. Out of lives. Press Restart for new rules.`); return; }
    c.fail(`${v} maps to ${STATES[s][1]}, not ${STATES[i][1]}.`);
    busy = true; c.after(900, () => { busy = false; next(); });
  }
  c.key(e => { const n = +e.key; if (n >= 1 && n <= 4) answer(n - 1); });
  next(); c.msg('Ranges include both ends. Pick the state for the value shown.');
}

/* --- Landmark (local +Z faces the island centre): tanks, a pump, pipes and a control room --- */
function landmark(g, c, { M, mat, tick }) {
  const C = hexNum(c);
  M(new THREE.BoxGeometry(16, 0.4, 10), mat(0xc9ced8), 0, 0.2, 0, g);
  const tanks = [-5, -0.6].map((x, i) => {
    M(new THREE.CylinderGeometry(1.9, 1.9, 6, 20), mat(0xe8edf5, { metalness: 0.3, roughness: 0.4 }), x, 3.4, -1.5, g);
    M(new THREE.ConeGeometry(1.95, 0.8, 20), mat(0xdfe3ea), x, 6.8, -1.5, g);
    M(new THREE.BoxGeometry(0.5, 5.4, 0.12), mat(0x1b2436), x, 3.4, 0.42, g, true);
    const lv = M(new THREE.BoxGeometry(0.36, 1, 0.14), mat(C, { emissive: C, emissiveIntensity: 0.6 }), x, 0.7, 0.45, g, true);
    lv.geometry.translate(0, 0.5, 0);
    return { lv, ph: i * Math.PI };
  });
  // Pipe between the tanks with a pump in the middle, and a pipe to the control room.
  const pipe = mat(0x9aa3b2, { metalness: 0.4, roughness: 0.4 });
  const p1 = M(new THREE.CylinderGeometry(0.28, 0.28, 4.4, 10), pipe, -2.8, 1.1, -1.5, g); p1.rotation.z = Math.PI / 2;
  const pump = new THREE.Group(); pump.position.set(-2.8, 1.1, 0.2); g.add(pump);
  M(new THREE.CylinderGeometry(0.75, 0.75, 1.1, 14), mat(C), 0, 0, 0, pump).rotation.x = Math.PI / 2;
  const impeller = M(new THREE.BoxGeometry(1.1, 0.16, 0.16), mat(0xffffff), 0, 0, 0.6, pump, true);
  M(new THREE.CylinderGeometry(0.28, 0.28, 1.8, 10), pipe, -2.8, 1.1, -0.9, g).rotation.x = Math.PI / 2;
  const p2 = M(new THREE.CylinderGeometry(0.28, 0.28, 4.6, 10), pipe, 2.1, 1.1, -1.5, g); p2.rotation.z = Math.PI / 2;
  // Control room with a live trend on its screen and an alarm beacon.
  M(new THREE.BoxGeometry(4.6, 3.4, 4), mat(0xf2f5fa), 5.4, 2.1, -1, g);
  M(new THREE.BoxGeometry(5, 0.3, 4.4), mat(C), 5.4, 3.95, -1, g);
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
  const x = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv);
  M(new THREE.PlaneGeometry(3.4, 1.7), new THREE.MeshBasicMaterial({ map: tex }), 5.4, 2.4, 1.02, g, true);
  const beacon = M(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff9f1c }), 6.8, 4.4, -1, g, true);
  let lastDraw = -1;
  tick(t => {
    tanks.forEach(tk => { tk.lv.scale.y = 1.2 + 3.6 * (0.5 + 0.5 * Math.sin(t * 0.6 + tk.ph)); });
    impeller.rotation.z = t * 8;
    beacon.visible = Math.sin(t * 6) > 0.2;
    if (t - lastDraw < 0.25) return;
    lastDraw = t;
    x.fillStyle = '#0b1220'; x.fillRect(0, 0, 256, 128);
    x.fillStyle = 'rgba(116,255,155,.15)'; x.fillRect(0, 30, 256, 60);
    x.strokeStyle = '#22d3ee'; x.lineWidth = 4; x.beginPath();
    for (let i = 0; i <= 32; i++) x.lineTo(i * 8, 64 - 34 * Math.sin((t - (32 - i) * 0.12) * 0.6));
    x.stroke();
    x.fillStyle = '#f2f5fa'; x.font = 'bold 18px monospace'; x.fillText(`LT-101 ${(50 + 50 * Math.sin(t * 0.6)).toFixed(1)}%`, 10, 22);
    tex.needsUpdate = true;
  });
  return { solidR: 9.2, sign: 11 };
}
