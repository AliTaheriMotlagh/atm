import { clamp, hexNum, TAU } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { NET_COLORS, net } from '../net/net.js';
import { roundRect } from './screens.js';

/* Your car, one car per online driver (drawn from their broadcasts), and dust behind your wheels.
   Fills w.S (your car's state), w.car, w.wheels, w.fronts, w.peerCars, w.peerGroup and w.puff. */
export function buildCars(w, world) {
  const { scene, M, mat, tick } = w;
  /* Every car is Ali's BAIC Sabrina (Senova D20) hatchback, built from side profiles (z forward, y up)
     extruded across the car's width. Yours is champagne beige; other drivers are painted in their colour. */
  const BEIGE = '#bba88e', WHEEL_R = 0.48, AXLE = 1.38;
  const lines = (s, pts) => { pts.forEach(([z, y]) => s.lineTo(z, y)); return s; };
  const outline = ([[z, y], ...pts]) => { const s = new THREE.Shape(); s.moveTo(z, y); return lines(s, pts); };
  const prism = (shape, width, bevel) => new THREE.ExtrudeGeometry(shape, {
    depth: width, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, curveSegments: 9
  }).rotateY(-Math.PI / 2).translate(width / 2, 0, 0);
  // The lower body, with an arch notched over each wheel as the outline runs along the sills.
  // Short low hood, so the long windshield starts just behind the front wheels.
  const body = outline([[-2.16, 0.42], [-2.08, 0.28]]);
  [-AXLE, AXLE].forEach(z => { body.lineTo(z - 0.56, 0.28); body.absarc(z, WHEEL_R, 0.56, Math.PI, 0, true); body.lineTo(z + 0.56, 0.28); });
  lines(body, [[2.12, 0.32], [2.24, 0.56], [2.23, 0.84], [2.06, 1.04], [1.38, 1.24], [-1.8, 1.38], [-2.12, 1.36], [-2.22, 0.95]]);
  const CARG = {
    body: prism(body, 2.1, 0.07),
    glass: prism(outline([[1.42, 1.2], [-2.12, 1.32], [-2.02, 1.8], [-1.62, 2.0], [0.0, 2.01]]), 1.84, 0.04),
    roof: prism(outline([[0.03, 2.0], [-1.6, 2.0], [-2.0, 1.8], [-2.08, 1.84], [-1.68, 2.1], [-0.08, 2.09]]), 1.92, 0.03),
    // The side glass reads as one dark band: thin painted A-pillar, black B and C trims, thick painted D-pillar.
    pillarA: prism(outline([[1.24, 1.24], [1.44, 1.22], [0.04, 2.03], [-0.12, 2.03]]), 0.1, 0),
    pillarB: prism(outline([[-0.38, 1.3], [-0.24, 1.3], [-0.28, 2.02], [-0.42, 2.02]]), 0.1, 0),
    pillarC: prism(outline([[-1.44, 1.34], [-1.34, 1.34], [-1.4, 2.01], [-1.5, 2.01]]), 0.1, 0),
    pillarD: prism(outline([[-2.14, 1.33], [-1.8, 1.35], [-1.86, 1.93], [-2.04, 1.82]]), 0.1, 0),
    head: new THREE.BoxGeometry(0.5, 0.15, 0.55), grille: new THREE.BoxGeometry(0.8, 0.22, 0.1), slat: new THREE.BoxGeometry(0.84, 0.035, 0.12),
    intake: new THREE.BoxGeometry(1.2, 0.2, 0.1), badge: new THREE.CylinderGeometry(0.07, 0.07, 0.06, 12).rotateX(Math.PI / 2),
    fogBay: new THREE.BoxGeometry(0.28, 0.14, 0.1), fog: new THREE.CylinderGeometry(0.05, 0.05, 0.06, 10).rotateX(Math.PI / 2),
    tail: new THREE.BoxGeometry(0.42, 0.24, 0.1), tailSide: new THREE.BoxGeometry(0.08, 0.22, 0.4),
    plate: new THREE.BoxGeometry(0.62, 0.17, 0.04), plateBand: new THREE.BoxGeometry(0.1, 0.17, 0.05),
    bumper: new THREE.BoxGeometry(1.9, 0.12, 0.1), mirror: new THREE.BoxGeometry(0.2, 0.15, 0.26), handle: new THREE.BoxGeometry(0.05, 0.05, 0.2),
    crease: new THREE.BoxGeometry(0.04, 0.05, 2.75),
    wheel: new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.4, 16).rotateZ(Math.PI / 2), rim: new THREE.CylinderGeometry(0.33, 0.33, 0.42, 14).rotateZ(Math.PI / 2),
    spoke: new THREE.BoxGeometry(0.44, 0.3, 0.07).translate(0, 0.15, 0)
  };
  function buildCar(color) {
    const g = new THREE.Group();
    // Paint is per car so a colour change doesn't repaint everyone sharing the cached material.
    const paint = new THREE.MeshStandardMaterial({ color: hexNum(color), flatShading: true, roughness: 0.45, metalness: 0.08 });
    const dark = mat(0x2a2d35), trim = mat(0x14171c, { roughness: 0.3 }), chrome = mat(0xdfe4ea, { roughness: 0.25, metalness: 0.6 });
    M(CARG.body, paint, 0, 0, 0, g);
    M(CARG.glass, mat(0x1c2738, { roughness: 0.15, metalness: 0.4 }), 0, 0, 0, g);
    M(CARG.roof, paint, 0, 0, 0, g);
    [-0.96, 0.96].forEach(x => {
      M(CARG.pillarA, paint, x, 0, 0, g); M(CARG.pillarD, paint, x, 0, 0, g);
      M(CARG.pillarB, trim, x, 0, 0, g, true); M(CARG.pillarC, trim, x, 0, 0, g, true);
      const s = Math.sign(x);
      // Swept-back headlights that run up the fenders, and taillights that wrap the rear corners.
      M(CARG.head, mat(0xffffff, { emissive: 0xfff2c0, emissiveIntensity: 0.8 }), s * 0.7, 1.03, 2.0, g, true).rotation.set(-0.42, s * 0.25, 0);
      M(CARG.tail, mat(0xff3b30, { emissive: 0xff3b30, emissiveIntensity: 0.6 }), s * 0.8, 1.18, -2.23, g, true);
      M(CARG.tailSide, mat(0xff3b30, { emissive: 0xff3b30, emissiveIntensity: 0.6 }), s * 1.11, 1.2, -2.0, g, true);
      M(CARG.fogBay, trim, s * 0.8, 0.45, 2.24, g, true);
      M(CARG.fog, mat(0xfff8e0, { emissive: 0xfff2c0, emissiveIntensity: 0.4 }), s * 0.8, 0.45, 2.29, g, true);
      M(CARG.mirror, paint, s * 1.2, 1.36, 1.12, g);
      [0.35, -0.95].forEach(z => M(CARG.handle, paint, s * 1.13, 1.14, z, g, true));
      // The character line that rises from the front door to the taillights.
      M(CARG.crease, paint, s * 1.12, 1.01, -0.6, g, true).rotation.x = 0.125;
    });
    M(CARG.grille, dark, 0, 0.86, 2.28, g, true);
    [0.8, 0.88, 0.96].forEach(y => M(CARG.slat, chrome, 0, y, 2.29, g, true));
    M(CARG.badge, chrome, 0, 0.88, 2.35, g, true);
    M(CARG.intake, dark, 0, 0.45, 2.26, g, true);
    M(CARG.bumper, dark, 0, 0.45, -2.25, g, true);
    // Iranian-style plates: white with the blue band on the left.
    [[0.62, 2.34, 1], [0.86, -2.3, -1]].forEach(([y, z, d]) => {
      M(CARG.plate, mat(0xf4f6f8), 0, y, z, g, true);
      M(CARG.plateBand, mat(0x1f4fbf), -d * 0.27, y, z + d * 0.005, g, true);
    });
    // Silver five-spoke alloys.
    const wheels = [], fronts = [];
    [[-1.0, AXLE], [1.0, AXLE], [-1.0, -AXLE], [1.0, -AXLE]].forEach(([x, z], i) => {
      const yaw = new THREE.Group(); yaw.position.set(x, WHEEL_R, z); g.add(yaw);
      const w = M(CARG.wheel, mat(0x1d2027), 0, 0, 0, yaw);
      M(CARG.rim, mat(0x3a3f48), 0, 0, 0, w, true);
      for (let k = 0; k < 5; k++) M(CARG.spoke, mat(0xd5dae2, { roughness: 0.4 }), 0, 0, 0, w, true).rotation.x = k * TAU / 5;
      wheels.push(w); if (i < 2) fronts.push(yaw);
    });
    return { g, paint, wheels, fronts };
  }
  const mine = buildCar(BEIGE);
  const car = mine.g, wheels = mine.wheels, fronts = mine.fronts; scene.add(car);

  const S = { x: 0, z: 14, h: 0, v: 0, steer: 0 };
  world.me = () => S;

  /* --- other drivers, drawn from their broadcasts --- */
  const peerGroup = new THREE.Group(); scene.add(peerGroup);
  const peerCars = new Map();
  function nameTag(name, color) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
    const x = cv.getContext('2d');
    x.font = '700 50px "Atkinson Hyperlegible", system-ui, sans-serif';
    const w = Math.min(500, x.measureText(name).width + 96), left = 256 - w / 2;
    x.fillStyle = 'rgba(13,22,40,.82)'; roundRect(x, left, 20, w, 84, 42); x.fill();
    x.fillStyle = color; x.beginPath(); x.arc(left + 40, 62, 16, 0, 7); x.fill();
    x.fillStyle = '#f2f5fa'; x.textBaseline = 'middle'; x.fillText(name, left + 68, 64, w - 88);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthWrite: false, fog: false }));
    s.scale.set(5.2, 1.3, 1); s.position.y = 4.1;
    return s;
  }
  function peerCar(p) {
    let c = peerCars.get(p.id);
    if (!c) {
      c = Object.assign(buildCar(NET_COLORS[p.color]), { x: p.st.x, z: p.st.z, h: p.st.h, tag: null, key: '' });
      peerGroup.add(c.g); peerCars.set(p.id, c);
    }
    const key = p.name + '|' + p.color;
    if (c.key !== key) {
      c.key = key; c.paint.color.set(NET_COLORS[p.color]);
      if (c.tag) { c.g.remove(c.tag); c.tag.material.map.dispose(); c.tag.material.dispose(); }
      c.tag = nameTag(p.name, NET_COLORS[p.color]); c.g.add(c.tag);
    }
    return c;
  }
  world.dropPeer = id => {
    const c = peerCars.get(id); if (!c) return;
    peerGroup.remove(c.g); c.paint.dispose();
    if (c.tag) { c.tag.material.map.dispose(); c.tag.material.dispose(); }
    peerCars.delete(id);
  };
  world.peerDist = id => { const c = peerCars.get(id); return c && c.g.visible ? Math.hypot(c.x - S.x, c.z - S.z) : null; };
  world.peerHonk = p => {
    const c = peerCars.get(p.id); if (!c) return;
    p.hop = 0.3;
    const d = Math.hypot(c.x - S.x, c.z - S.z);
    if (d < 80) sfx.play(Object.assign({}, sfx.SONGS.horn, { vol: 0.005 + 0.04 * (1 - d / 80) }));
  };
  const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  // Extrapolate from the last message by its speed, then ease the drawn car toward that point.
  tick((t, dt) => {
    const now = performance.now(), k = 1 - Math.exp(-10 * dt);
    net.peers.forEach(p => {
      if (!p.st) return;
      const c = peerCar(p), st = p.st;
      c.g.visible = now - st.at < 15000;
      if (!c.g.visible) return;
      const age = Math.min(0.3, (now - st.at) / 1000);
      const px = st.x + Math.sin(st.h) * st.v * age, pz = st.z + Math.cos(st.h) * st.v * age;
      if (Math.hypot(px - c.x, pz - c.z) > 15) { c.x = px; c.z = pz; c.h = st.h; }
      else { c.x += (px - c.x) * k; c.z += (pz - c.z) * k; c.h += angDiff(c.h, st.h) * k; }
      c.g.position.set(c.x, 0, c.z); c.g.rotation.y = c.h;
      c.g.rotation.z = -st.s * clamp(st.v / 30, -1, 1) * 0.08;
      c.wheels.forEach(w => { w.rotation.x += st.v * dt / WHEEL_R; });
      c.fronts.forEach(f => { f.rotation.y = st.s * 0.45; });
      if (p.hop > 0) { p.hop = Math.max(0, p.hop - dt); c.g.position.y = Math.sin(p.hop / 0.3 * Math.PI) * 0.45; }
    });
  });

  /* --- dust puffs behind the rear wheels when boosting or drifting --- */
  const dust = [], dustGeo = new THREE.IcosahedronGeometry(0.35, 0);
  for (let i = 0; i < 28; i++) {
    const m = new THREE.Mesh(dustGeo, new THREE.MeshBasicMaterial({ color: 0xf3ead5, transparent: true, opacity: 0, depthWrite: false }));
    m.visible = false; scene.add(m); dust.push({ m, life: 0, vy: 0 });
  }
  let dustI = 0;
  function puff() {
    const d = dust[dustI++ % dust.length], side = dustI % 2 ? 1.1 : -1.1;
    const bx = S.x - Math.sin(S.h) * 1.8 + Math.cos(S.h) * side, bz = S.z - Math.cos(S.h) * 1.8 - Math.sin(S.h) * side;
    d.life = 1; d.vy = 0.8 + Math.random() * 0.8; d.m.visible = true;
    d.m.position.set(bx + (Math.random() - 0.5) * 0.5, 0.35, bz + (Math.random() - 0.5) * 0.5);
  }
  tick((t, dt) => dust.forEach(d => {
    if (d.life <= 0) return;
    d.life -= dt * 1.7;
    if (d.life <= 0) { d.m.visible = false; return; }
    d.m.position.y += d.vy * dt; d.m.scale.setScalar(0.6 + (1 - d.life) * 1.8); d.m.material.opacity = d.life * 0.55;
  }));

  Object.assign(w, { S, car, wheels, wheelR: WHEEL_R, fronts, peerCars, peerGroup, puff });
}
