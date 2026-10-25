import { isTouch, TAU } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { roadGraph } from './plan.js';
import { builder } from './city.js';

/* Tehran traffic: Prides, Peykans and yellow and green taxis driving the highway and the district streets. Each car
   follows the road graph in the right-hand lane, picks a random turn at every junction, and brakes for you and for
   the car in front. Traffic is local to each visitor. Fills w.traffic with { x, z, h, v } for collisions. */
const PAINTS = [0xf4f6f8, 0xf4f6f8, 0xf4f6f8, 0xdfe3ea, 0xc0c6cf, 0x2a2d35, 0x8a1c1c, 0x1f4fbf];

function carGeo(kind) {
  const b = builder(false), body = 0xffffff, glass = 0x1c2738, dark = 0x1d2027, light = 0xfff2c0, tail = 0xff3b30;
  const sedan = kind === 'peykan';
  const L = sedan ? 4.4 : 3.9, W = 1.75;
  b.box(0, 0.35, 0, W, 0.75, L, 0, body);
  // Cabin: set back on the sedan, longer on the hatchback.
  b.box(0, 1.1, sedan ? -0.2 : -0.35, W - 0.2, 0.7, sedan ? 2.1 : 2.4, 0, glass, { top: false });
  b.box(0, 1.79, sedan ? -0.2 : -0.35, W - 0.24, 0.08, sedan ? 2.0 : 2.3, 0, body);
  [-0.62, 0.62].forEach(x => {
    b.box(x, 0.68, L / 2 - 0.02, 0.36, 0.16, 0.06, 0, light);
    b.box(x, 0.72, -L / 2 + 0.02, 0.32, 0.18, 0.06, 0, tail);
    [L / 2 - 0.85, -L / 2 + 0.85].forEach(z => b.box(x * 1.36, 0, z, 0.26, 0.62, 0.62, 0, dark));
  });
  if (kind === 'taxi') b.box(0, 1.87, -0.3, 0.7, 0.24, 0.32, 0, 0xffffff);
  return b.geo();
}

export function buildTraffic(w) {
  const { scene, tick, S } = w;
  const { nodes } = roadGraph();
  const starts = []; nodes.forEach((n, i) => n.adj.forEach(e => { if (e.traffic) starts.push([i, e]); }));
  w.traffic = [];
  if (!starts.length) return;
  const geos = { pride: carGeo('pride'), peykan: carGeo('peykan'), taxi: carGeo('taxi') };
  const COUNT = isTouch ? 14 : 26;
  const cars = [];
  const place = c => {
    // Somewhere out of sight of the player, so cars never pop in under their nose.
    for (let k = 0; k < 40; k++) {
      const [a, e] = starts[Math.random() * starts.length | 0];
      if (Math.hypot(nodes[a].x - S.x, nodes[a].z - S.z) < 60 && k < 39) continue;
      Object.assign(c, { a, b: e.to, len: e.len, lane: e.lane, s: Math.random() * e.len });
      return;
    }
  };
  for (let i = 0; i < COUNT; i++) {
    const r = Math.random(), kind = r < 0.25 ? 'taxi' : r < 0.6 ? 'peykan' : 'pride';
    const paint = kind === 'taxi' ? (Math.random() < 0.65 ? 0xf2c230 : 0x3fae5a) : PAINTS[Math.random() * PAINTS.length | 0];
    const mesh = new THREE.Mesh(geos[kind], new THREE.MeshStandardMaterial({ color: paint, vertexColors: true, flatShading: true, roughness: 0.5, metalness: 0.1 }));
    mesh.castShadow = true; scene.add(mesh);
    const c = { mesh, x: 0, z: 0, h: 0, v: 0, max: 9 + Math.random() * 5, stun: 0, honkAt: 0, fresh: true };
    place(c); cars.push(c); w.traffic.push(c);
  }
  // The point on the current edge, pushed into the right-hand lane.
  const target = c => {
    const A = nodes[c.a], B = nodes[c.b], k = Math.min(1, c.s / c.len), dx = (B.x - A.x) / c.len, dz = (B.z - A.z) / c.len;
    return { x: A.x + (B.x - A.x) * k - dz * c.lane, z: A.z + (B.z - A.z) * k + dx * c.lane, fx: dx, fz: dz };
  };
  const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  tick((t, dt) => {
    cars.forEach(c => {
      const p = target(c);
      // Brake for whatever is in front: you, or another car.
      let want = c.max;
      const ahead = (ox, oz, reach, wide) => { const dx = ox - c.x, dz = oz - c.z, along = dx * p.fx + dz * p.fz, lat = Math.abs(-dx * p.fz + dz * p.fx); return along > 0 && along < reach && lat < wide ? along : null; };
      const me = ahead(S.x, S.z, 13, 2.8);
      if (me != null) { want = me < 6 ? 0 : Math.min(want, Math.abs(S.v) * 0.8); if (me < 7 && t - c.honkAt > 4 && Math.hypot(S.x - c.x, S.z - c.z) < 30) { c.honkAt = t; sfx.tone(370, 0.18, 'square', 0.025); } }
      for (const o of cars) { if (o === c) continue; const d = ahead(o.x, o.z, 9, 2); if (d != null) want = Math.min(want, d < 5 ? 0 : o.v * 0.9); }
      if (c.stun > 0) { c.stun -= dt; want = 0; }
      c.v += (want > c.v ? 5 : 14) * dt * Math.sign(want - c.v); if (Math.abs(want - c.v) < 0.2) c.v = want;
      c.v = Math.max(0, c.v);
      c.s += c.v * dt;
      while (c.s >= c.len) {
        c.s -= c.len;
        const opts = nodes[c.b].adj.filter(e => e.traffic && e.to !== c.a);
        const e = opts.length ? opts[Math.random() * opts.length | 0] : nodes[c.b].adj.find(e => e.to === c.a);
        c.a = c.b; c.b = e.to; c.len = e.len; c.lane = e.lane;
      }
      const q = target(c);
      if (c.fresh) { c.x = q.x; c.z = q.z; c.h = Math.atan2(q.fx, q.fz); c.fresh = false; }
      // Ease toward the lane point, so the switch between edges at a junction is a curve, not a jump.
      const k = 1 - Math.exp(-6 * dt);
      c.x += (q.x - c.x) * k; c.z += (q.z - c.z) * k;
      c.h += angDiff(c.h, Math.atan2(q.fx, q.fz)) * Math.min(1, dt * 5);
      c.mesh.position.set(c.x, 0, c.z); c.mesh.rotation.y = c.h;
      c.mesh.visible = Math.abs(c.x - S.x) < 320 && Math.abs(c.z - S.z) < 320;
    });
  });
}
