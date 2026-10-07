import { clamp, hexNum, TAU } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { NET_COLORS, me, net } from '../net/net.js';
import { roundRect } from './screens.js';

/* Your car, one car per online driver (drawn from their broadcasts), and dust behind your wheels.
   Fills w.S (your car's state), w.car, w.wheels, w.fronts, w.peerCars, w.peerGroup and w.puff. */
export function buildCars(w, world) {
  const { scene, M, mat, tick } = w;
  const CARG = {
    body: new THREE.BoxGeometry(2.3, 0.9, 4.2), cab: new THREE.BoxGeometry(1.95, 0.85, 2.1), roof: new THREE.BoxGeometry(2.0, 0.12, 2.15),
    bumper: new THREE.BoxGeometry(2.4, 0.35, 0.3), head: new THREE.BoxGeometry(0.45, 0.25, 0.1), tail: new THREE.BoxGeometry(0.45, 0.2, 0.1),
    wheel: new THREE.CylinderGeometry(0.55, 0.55, 0.45, 14).rotateZ(Math.PI / 2), hub: new THREE.BoxGeometry(0.47, 0.18, 0.18)
  };
  function buildCar(color) {
    const g = new THREE.Group();
    // Paint is per car so a colour change doesn't repaint everyone sharing the cached material.
    const paint = new THREE.MeshStandardMaterial({ color: hexNum(color), flatShading: true, roughness: 0.5, metalness: 0 });
    M(CARG.body, paint, 0, 0.9, 0, g);
    M(CARG.cab, mat(0x24324d, { roughness: 0.3 }), 0, 1.75, -0.35, g);
    M(CARG.roof, paint, 0, 2.22, -0.35, g);
    M(CARG.bumper, mat(0x2a2d35), 0, 0.6, 2.15, g);
    M(CARG.bumper, mat(0x2a2d35), 0, 0.6, -2.15, g);
    [-0.72, 0.72].forEach(x => {
      M(CARG.head, mat(0xffffff, { emissive: 0xfff2c0, emissiveIntensity: 0.8 }), x, 1.0, 2.12, g, true);
      M(CARG.tail, mat(0xff3b30, { emissive: 0xff3b30, emissiveIntensity: 0.6 }), x, 1.0, -2.12, g, true);
    });
    const wheels = [], fronts = [];
    [[-1.2, 1.35], [1.2, 1.35], [-1.2, -1.35], [1.2, -1.35]].forEach(([x, z], i) => {
      const yaw = new THREE.Group(); yaw.position.set(x, 0.55, z); g.add(yaw);
      const w = M(CARG.wheel, mat(0x1d2027), 0, 0, 0, yaw);
      M(CARG.hub, mat(0xcfd5de), 0, 0, 0, w, true);
      wheels.push(w); if (i < 2) fronts.push(yaw);
    });
    return { g, paint, wheels, fronts };
  }
  const mine = buildCar(NET_COLORS[me.color]);
  const car = mine.g, wheels = mine.wheels, fronts = mine.fronts; scene.add(car);
  world.paintMe = () => mine.paint.color.set(NET_COLORS[me.color]);

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
      c.wheels.forEach(w => { w.rotation.x += st.v * dt / 0.55; });
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

  Object.assign(w, { S, car, wheels, fronts, peerCars, peerGroup, puff });
}
