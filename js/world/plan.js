import { TAU } from '../core/util.js';
import { TOUR } from '../projects/index.js';
import {
  PLAZA_R, ROAD_R, ROAD_W, LM_R, CIN_R, OUTER_R, OUTER_W, ISLAND, angleOf, CIN_GAP, START_GAP,
  byDistrict, midAngle, inSector, grassR, edgeR, deg
} from './layout.js';

/* The city plan, as plain data: every road, building lot and pier on the island. It is built once, from a fixed
   seed, so every visitor gets the same city. Meshes (terrain.js, city.js), the radar and the big map, the GPS and
   the traffic all read from it. */

let seed = 1337;
const rand = () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pol = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];

// kind → how the road looks (terrain.js) and drives (lane offset for traffic).
export const ROAD_KINDS = {
  ring: { color: 0x3b404c, y: 0.04, lane: 2.3 },
  highway: { color: 0x34383f, y: 0.05, lane: 3.3 },
  connector: { color: 0x3b404c, y: 0.045, lane: 1.8 },
  spoke: { color: 0x3b404c, y: 0.035, lane: 1.2 },
  street: { color: 0x3a3e46, y: 0.06, lane: 2.2, walk: 5 },
  avenue: { color: 0x3a3e46, y: 0.055, lane: 2.4, walk: 4 },
  lane: { color: 0x44464c, y: 0.06, lane: 1.6, walk: 3 },
  pier: { color: 0x9a7b58, y: 0.12, lane: 2 }
};

export const roads = [];       // { pts: [[x, z], ...], w, kind, closed, traffic }
export const buildings = [];   // { x, z, w, d, h, rot, style, tint }
export const houses = [];      // { x, z, w, d, h, rot, wall, roof }
export const domes = [];       // { x, z, y, r, color }
export const lakes = [];       // { x, z, rx, rz, rot }
export const parks = [];       // { x, z, w, d }
export const patches = [];     // ground the districts pave: { id, a0, a1, r0, r1(a) }
export const piers = [];       // drivable decks over the lake, from (x, z) along angle a: { x, z, a, r0, r1, hw }
export const spots = {};       // named points: Azadi, Milad, Tabiat Bridge, Tajrish, the mosque, the Ferris wheel

function road(pts, w, kind, o = {}) { roads.push({ pts, w, kind, closed: !!o.closed, traffic: !!o.traffic }); }
const circle = (r, n) => Array.from({ length: n }, (_, i) => pol(i / n * TAU, r));
const radial = (a, r0, r1) => [pol(a, r0), pol(a, r1)];

/* --- the middle: the old island --- */
road(circle(ROAD_R, 160), ROAD_W, 'ring', { closed: true });
road(circle(OUTER_R, 220), OUTER_W, 'highway', { closed: true, traffic: true });
TOUR.forEach((p, i) => {
  const a = angleOf(i);
  road(radial(a, PLAZA_R - 2, ROAD_R), 4.4, 'spoke');
  road(radial(a, ROAD_R, LM_R - 7.5), 5, 'spoke');
});
// Connectors between the two rings, in the gaps between spokes. The race starts in one gap; the drive-in has another.
TOUR.forEach((_, i) => {
  const gap = i + 0.5, a = angleOf(gap);
  if (gap === START_GAP) return;
  if (gap === CIN_GAP) { road(radial(a, ROAD_R, CIN_R - 9.5), 6, 'connector', { traffic: false }); road(radial(a, CIN_R + 9.5, OUTER_R), 6, 'connector'); return; }
  road(radial(a, ROAD_R, OUTER_R), 7, 'connector');
});

/* --- districts --- */
// Is (x, z) inside district d, between the highway and the city edge, with some margin?
function inside(d, x, z, rPad, aPad, edgePad, lot) {
  const r = Math.hypot(x, z), a = Math.atan2(z, x);
  return r >= OUTER_R + rPad && r <= grassR(a) - edgePad && inSector(a, d.a0, d.a1, aPad / Math.max(r, 1)) && !inLake(x, z, 8) && !reserved.some(q => (lot || !q.lotOnly) && Math.hypot(q.x - x, q.z - z) < q.r);
}
/* A street grid over district d: lines every B units, clipped to the district. Streets start on the highway, so they
   join it. fill(cell) builds whatever stands in each whole block. */
function grid(d, B, SW, kind, off, fill, edgePad = 10) {
  const L = ISLAND + 10;
  for (let k = Math.floor(-L / B); k <= L / B; k++) {
    for (const vertical of [true, false]) {
      let run = null;
      const flush = () => { if (run && Math.hypot(run[1][0] - run[0][0], run[1][1] - run[0][1]) >= 14) road(run, SW, kind, { traffic: true }); run = null; };
      for (let t = -L; t <= L; t += 1) {
        const x = vertical ? k * B + off[0] : t, z = vertical ? t : k * B + off[1];
        if (inside(d, x, z, 0, 2, edgePad)) { if (!run) run = [[x, z], [x, z]]; else run[1] = [x, z]; }
        else flush();
      }
      flush();
    }
  }
  const walk = (ROAD_KINDS[kind].walk || 0) / 2, half = SW / 2 + walk + 0.5;
  for (let i = Math.floor(-L / B); i < L / B; i++) for (let j = Math.floor(-L / B); j < L / B; j++) {
    const x0 = i * B + off[0] + half, x1 = (i + 1) * B + off[0] - half, z0 = j * B + off[1] + half, z1 = (j + 1) * B + off[1] - half;
    const corners = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]];
    if (corners.every(([x, z]) => inside(d, x, z, OUTER_W / 2 + 4, 3, edgePad + 2, true))) fill({ x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 });
  }
}
const paved = (id, a0, a1) => patches.push({ id, a0, a1, r0: OUTER_R + OUTER_W / 2, r1: a => grassR(a) });
// Split a block into one, two or four lots and hand each to make(x, z, w, d).
function lots(c, make, gap = 0.8) {
  const W = c.x1 - c.x0, D = c.z1 - c.z0, split = rand();
  const list = split < 0.35 ? [[c.cx, c.cz, W, D]]
    : split < 0.7 ? [[c.x0 + W / 4, c.cz, W / 2 - gap, D], [c.x1 - W / 4, c.cz, W / 2 - gap, D]]
    : [[c.x0 + W / 4, c.z0 + D / 4], [c.x1 - W / 4, c.z0 + D / 4], [c.x0 + W / 4, c.z1 - D / 4], [c.x1 - W / 4, c.z1 - D / 4]].map(([x, z]) => [x, z, W / 2 - gap, D / 2 - gap]);
  list.forEach(([x, z, w, d]) => make(x, z, w, d));
}

// Places that need open ground, kept clear of the grids: lakes, squares, the tower park.
const reserved = [];
function inLake(x, z, pad = 0) {
  return lakes.some(l => {
    const dx = x - l.x, dz = z - l.z, u = dx * Math.cos(l.rot) + dz * Math.sin(l.rot), v = -dx * Math.sin(l.rot) + dz * Math.cos(l.rot);
    return (u / (l.rx + pad)) ** 2 + (v / (l.rz + pad)) ** 2 < 1;
  });
}
const ellipse = (l, grow, n) => Array.from({ length: n }, (_, i) => {
  const t = i / n * TAU, u = Math.cos(t) * (l.rx + grow), v = Math.sin(t) * (l.rz + grow);
  return [l.x + u * Math.cos(l.rot) - v * Math.sin(l.rot), l.z + u * Math.sin(l.rot) + v * Math.cos(l.rot)];
});

// Chitgar · Azadi (west): Azadi Square on its roundabout, and Chitgar Lake with a promenade, a pier and a Ferris wheel.
{
  const d = byDistrict.chitgar;
  const [ax, az] = pol(Math.PI, OUTER_R + 34);
  spots.azadi = { x: ax, z: az };
  reserved.push({ x: ax, z: az, r: 30 });
  road(circle(15, 40).map(([x, z]) => [ax + x, az + z]), 9, 'avenue', { closed: true, traffic: true });
  road([pol(Math.PI, OUTER_R), [ax + 15, az]], 10, 'avenue', { traffic: true });
  road([[ax - 15, az], pol(Math.PI, edgeR(Math.PI) - 3)], 10, 'avenue', { traffic: true });
  const la = deg(158), [lx, lz] = pol(la, 194), lake = { x: lx, z: lz, rx: 34, rz: 21, rot: la + Math.PI / 2 };
  lakes.push(lake); reserved.push({ x: lx, z: lz, r: 46 });
  road(ellipse(lake, 8, 64), 8, 'avenue', { closed: true, traffic: true });
  road([pol(la, OUTER_R), pol(la, 194 - lake.rz - 8)], 8, 'avenue', { traffic: true });
  // The pier runs from the inland shore toward the middle of the lake.
  const pa = la + Math.PI, pier = { x: lx, z: lz, a: pa, r0: 4, r1: lake.rz + 6, hw: 5 };
  piers.push(pier);
  road([[lx + Math.cos(pa) * pier.r1, lz + Math.sin(pa) * pier.r1], [lx + Math.cos(pa) * pier.r0, lz + Math.sin(pa) * pier.r0]], 9, 'pier');
  spots.wheel = { x: lx + Math.cos(lake.rot) * (lake.rx + 24), z: lz + Math.sin(lake.rot) * (lake.rx + 24) };
  reserved.push({ x: spots.wheel.x, z: spots.wheel.z, r: 15 });
  grid(d, 28, 8, 'street', [9, -5], c => lots(c, (x, z, w, dd) => buildings.push({ x, z, w: w - 1, d: dd - 1, h: 9 + rand() * 12, rot: 0, style: rand() < 0.5 ? 'apartment' : 'brick', tint: 0.85 + rand() * 0.15 })));
}

// Gisha (north-west): Milad Tower in its park, and Tabiat Bridge carrying the park over an avenue.
{
  const d = byDistrict.milad, ma = deg(218), [mx, mz] = pol(ma, 192);
  spots.milad = { x: mx, z: mz };
  reserved.push({ x: mx, z: mz, r: 26 });
  parks.push({ x: mx, z: mz, w: 40, d: 40, round: true });
  road([pol(ma, OUTER_R), pol(ma, 192 - 15)], 8, 'avenue', { traffic: true });
  const ba = deg(203);
  road([pol(ba, OUTER_R), pol(ba, edgeR(ba) - 3)], 10, 'avenue', { traffic: true });
  const [tx, tz] = pol(ba, OUTER_R + 44);
  spots.tabiat = { a: ba, x: tx, z: tz };
  reserved.push({ x: tx, z: tz, r: 22 });
  grid(d, 28, 8, 'street', [1, 7], c => lots(c, (x, z, w, dd) => buildings.push({ x, z, w: w - 1, d: dd - 1, h: 12 + rand() * 16, rot: 0, style: rand() < 0.6 ? 'apartment' : 'office', tint: 0.85 + rand() * 0.15 })));
}

// Valiasr Street: the long avenue of plane trees from the middle of the city north to Tajrish Square.
{
  const x = 18, zTop = -Math.sqrt(grassR(deg(274)) ** 2 - x * x) + 26;
  const z0 = -Math.sqrt(OUTER_R ** 2 - x * x);
  road([[x, z0], [x, zTop]], 10, 'avenue', { traffic: true });
  spots.valiasr = { x, z0, z1: zTop };
  spots.tajrish = { x, z: zTop - 12 };
  reserved.push({ x, z: zTop - 12, r: 20 });
  road(circle(11, 32).map(([a, b]) => [x + a, zTop - 12 + b]), 8, 'avenue', { closed: true, traffic: true });
  // Keep the grids off Valiasr: towers and villas stand back from the trees.
  for (let z = z0; z > zTop; z -= 8) reserved.push({ x, z, r: 12, lotOnly: true });
}

// Tajrish (north): villas with yards on the foothills.
{
  const d = byDistrict.tajrish;
  const walls = [0xf4efe6, 0xe8d9c4, 0xdfe8ef, 0xf1e1d8, 0xe2ecd9, 0xf6e7b8], roofs = [0xb44a3a, 0x8a5a3b, 0x5b6270, 0x2f5a7a, 0x9a4d33];
  grid(d, 26, 6, 'lane', [3, 5], c => {
    const W = c.x1 - c.x0, D = c.z1 - c.z0;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      if (rand() < 0.15) return;
      const x = c.cx + sx * W / 4, z = c.cz + sz * D / 4, big = rand() < 0.35;
      const rot = rand() < 0.5 ? (sz < 0 ? Math.PI : 0) : (sx < 0 ? -Math.PI / 2 : Math.PI / 2);
      houses.push({ x, z, w: big ? 6.4 : 5.2, d: big ? 7.2 : 5.8, h: big ? 4.4 : 3.4, rot, wall: walls[rand() * walls.length | 0], roof: roofs[rand() * roofs.length | 0] });
    });
  }, 6);
}

// Vanak · Valiasr (north-east): the skyline, rising toward the middle of the district.
{
  const d = byDistrict.vanak, core = pol(midAngle(d), OUTER_R + 70);
  paved('vanak', d.a0, d.a1);
  grid(d, 31, 8, 'street', [-11, 11], c => {
    if (rand() < 0.08) { parks.push({ x: c.cx, z: c.cz, w: c.x1 - c.x0, d: c.z1 - c.z0 }); return; }
    lots(c, (x, z, w, dd) => {
      const near = Math.exp(-((x - core[0]) ** 2 + (z - core[1]) ** 2) / (2 * 50 * 50));
      const h = 12 + rand() * 10 + near * (35 + rand() * 45) * (w * dd > 150 ? 1 : 0.6);
      const style = h > 40 ? (rand() < 0.6 ? 'glass' : 'dark') : h > 24 ? (rand() < 0.5 ? 'office' : 'glass') : (rand() < 0.6 ? 'apartment' : 'office');
      buildings.push({ x, z, w: w - 1, d: dd - 1, h, rot: 0, style, tint: 0.85 + rand() * 0.15 });
    });
  });
  let top = null; buildings.forEach(b => { if (b.style !== 'hotel' && Math.hypot(b.x - core[0], b.z - core[1]) < 120 && (!top || b.h > top.h)) top = b; });
  if (top) { top.h = Math.max(top.h, 86); top.style = 'glass'; spots.tower = top; }
}

// Tehranpars (east): apartment blocks.
{
  const d = byDistrict.tehranpars;
  grid(d, 28, 8, 'street', [5, 3], c => {
    if (rand() < 0.1) { parks.push({ x: c.cx, z: c.cz, w: c.x1 - c.x0, d: c.z1 - c.z0 }); return; }
    lots(c, (x, z, w, dd) => buildings.push({ x, z, w: w - 1, d: dd - 1, h: 10 + rand() * 16, rot: 0, style: rand() < 0.7 ? 'apartment' : 'brick', tint: 0.85 + rand() * 0.15 }));
  });
}

// Grand Bazaar (south): low brick roofs and domes on narrow lanes, and a mosque with a turquoise dome.
{
  const d = byDistrict.bazaar, mid = midAngle(d), [qx, qz] = pol(mid, OUTER_R + 46);
  spots.mosque = { x: qx, z: qz };
  reserved.push({ x: qx, z: qz, r: 22 });
  road([pol(mid, OUTER_R), pol(mid, OUTER_R + 46 - 20)], 8, 'avenue', { traffic: true });
  paved('bazaar', d.a0, d.a1);
  grid(d, 21, 6, 'lane', [2, 9], c => lots(c, (x, z, w, dd) => {
    const h = 4.5 + rand() * 4;
    buildings.push({ x, z, w: w - 0.6, d: dd - 0.6, h, rot: 0, style: 'bazaar', tint: 0.85 + rand() * 0.15 });
    if (rand() < 0.45) domes.push({ x, z, y: h, r: Math.min(w, dd) * (0.28 + rand() * 0.12), color: rand() < 0.2 ? 0x2fb5b0 : 0xc9a46b });
  }, 0.3), 8);
}

/* --- masks: what covers each 2-unit cell --- */
const CELL = 2, HALF = ISLAND + 40, N = Math.ceil(HALF * 2 / CELL);
const roadCore = new Uint8Array(N * N), roadNear = new Uint8Array(N * N), solid = new Uint8Array(N * N), lastRoad = new Int32Array(N * N).fill(-1);
const ci = (x, z) => { const i = Math.floor((x + HALF) / CELL), j = Math.floor((z + HALF) / CELL); return i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i; };
function stamp(x, z, r, fn) {
  for (let dx = -r; dx <= r; dx += CELL) for (let dz = -r; dz <= r; dz += CELL) {
    if (dx * dx + dz * dz > r * r + 1) continue;
    const k = ci(x + dx, z + dz); if (k >= 0) fn(k);
  }
}
const segs = r => { const s = []; for (let i = 0; i < r.pts.length - (r.closed ? 0 : 1); i++) s.push([r.pts[i], r.pts[(i + 1) % r.pts.length]]); return s; };
roads.forEach((r, ri) => segs(r).forEach(([p, q]) => {
  const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
  for (let s = 0; s <= L; s += 1) {
    const x = p[0] + (q[0] - p[0]) * s / L, z = p[1] + (q[1] - p[1]) * s / L;
    stamp(x, z, r.w / 2, k => { if (lastRoad[k] !== ri) { lastRoad[k] = ri; roadCore[k]++; } });
    stamp(x, z, r.w / 2 + 2 + (ROAD_KINDS[r.kind].walk || 0) / 2, k => { roadNear[k] = 1; });
  }
}));
export function markSolid(x, z, hw, hd, rot = 0) {
  const c = Math.cos(rot), s = Math.sin(rot);
  for (let u = -hw; u <= hw; u += 1) for (let v = -hd; v <= hd; v += 1) { const k = ci(x + u * c + v * s, z - u * s + v * c); if (k >= 0) solid[k] = 1; }
}
buildings.forEach(b => markSolid(b.x, b.z, b.w / 2 + 1, b.d / 2 + 1, b.rot));
houses.forEach(h => markSolid(h.x, h.z, h.w / 2 + 1, h.d / 2 + 1, h.rot));

// Two or more roads on one cell: a junction, where lane markings stop.
export const isJunction = (x, z) => { const k = ci(x, z); return k >= 0 && roadCore[k] > 1; };
export const onRoad = (x, z) => { const k = ci(x, z); return k >= 0 && roadNear[k] > 0; };
export const isSolid = (x, z) => { const k = ci(x, z); return k >= 0 && solid[k] > 0; };
// Somewhere a tree, a lamp or a prop may stand: on grass, off roads and lots.
export function isFree(x, z, clear = 1.5) {
  const a = Math.atan2(z, x), r = Math.hypot(x, z);
  if (r > grassR(a) - clear || inLake(x, z, clear + 1)) return false;
  for (const [dx, dz] of [[0, 0], [clear, 0], [-clear, 0], [0, clear], [0, -clear]]) if (onRoad(x + dx, z + dz) || isSolid(x + dx, z + dz)) return false;
  return true;
}
export const inPatch = (x, z) => {
  const r = Math.hypot(x, z), a = Math.atan2(z, x);
  return patches.some(p => inSector(a, p.a0, p.a1) && r >= p.r0 && r <= p.r1(a));
};
export { inLake };
// Where a car may drive: anywhere inside the city limits except the lake, plus along the pier.
export function inBounds(x, z) {
  const r = Math.hypot(x, z), a = Math.atan2(z, x);
  if (r > edgeR(a) - 2.5) return false;
  if (!inLake(x, z, -1)) return true;
  return piers.some(p => {
    const dx = x - p.x, dz = z - p.z, u = dx * Math.cos(p.a) + dz * Math.sin(p.a), v = -dx * Math.sin(p.a) + dz * Math.cos(p.a);
    return u > p.r0 && u < p.r1 + 4 && Math.abs(v) < p.hw - 1.2;
  });
}

/* --- road graph, for the GPS and the traffic --- */
let graph = null;
export function roadGraph() {
  if (graph) return graph;
  // 1. Each road as a chain of points no more than 7 units apart.
  const lines = roads.map((r, ri) => {
    const pts = [];
    segs(r).forEach(([p, q], si) => {
      const L = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(1, Math.ceil(L / 7));
      for (let k = 0; k < n; k++) pts.push({ x: p[0] + (q[0] - p[0]) * k / n, z: p[1] + (q[1] - p[1]) * k / n, s: si + k / n });
    });
    if (!r.closed) { const q = r.pts[r.pts.length - 1]; pts.push({ x: q[0], z: q[1], s: r.pts.length - 1 }); }
    return { r, ri, pts, extra: [] };
  });
  // 2. Crossings between roads, found through a coarse spatial hash of segments.
  const H = 24, hash = new Map(), segList = [];
  lines.forEach((ln, li) => segs(ln.r).forEach(([p, q], si) => {
    const id = segList.push({ li, si, p, q }) - 1;
    for (let i = Math.floor(Math.min(p[0], q[0]) / H); i <= Math.floor(Math.max(p[0], q[0]) / H); i++)
      for (let j = Math.floor(Math.min(p[1], q[1]) / H); j <= Math.floor(Math.max(p[1], q[1]) / H); j++) {
        const k = i + ',' + j; if (!hash.has(k)) hash.set(k, []); hash.get(k).push(id);
      }
  }));
  const links = [], seen = new Set();
  hash.forEach(ids => {
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
      const A = segList[ids[a]], B = segList[ids[b]];
      if (A.li === B.li) continue;
      const key = ids[a] < ids[b] ? ids[a] + ':' + ids[b] : ids[b] + ':' + ids[a];
      if (seen.has(key)) continue; seen.add(key);
      const rx = A.q[0] - A.p[0], rz = A.q[1] - A.p[1], sx = B.q[0] - B.p[0], sz = B.q[1] - B.p[1], den = rx * sz - rz * sx;
      if (Math.abs(den) < 1e-9) continue;
      const qx = B.p[0] - A.p[0], qz = B.p[1] - A.p[1], t = (qx * sz - qz * sx) / den, u = (qx * rz - qz * rx) / den;
      if (t < 0 || t > 1 || u < 0 || u > 1) continue;
      const x = A.p[0] + rx * t, z = A.p[1] + rz * t;
      lines[A.li].extra.push({ x, z, s: A.si + t }); lines[B.li].extra.push({ x, z, s: B.si + u });
    }
  });
  // 3. Roads that end against another road without crossing it (driveways, T-junctions) get a short link.
  lines.forEach((ln, li) => {
    if (ln.r.closed) return;
    [ln.pts[0], ln.pts[ln.pts.length - 1]].forEach(end => {
      let best = null;
      segList.forEach(S => {
        if (S.li === li) return;
        const dx = S.q[0] - S.p[0], dz = S.q[1] - S.p[1], L2 = dx * dx + dz * dz || 1;
        const t = Math.max(0, Math.min(1, ((end.x - S.p[0]) * dx + (end.z - S.p[1]) * dz) / L2));
        const x = S.p[0] + dx * t, z = S.p[1] + dz * t, d = Math.hypot(x - end.x, z - end.z);
        if (d > 0.01 && d < lines[S.li].r.w / 2 + 3 && (!best || d < best.d)) best = { d, x, z, li: S.li, s: S.si + t };
      });
      if (best) { lines[best.li].extra.push({ x: best.x, z: best.z, s: best.s }); links.push([end, best, ln.r.traffic && lines[best.li].r.traffic]); }
    });
  });
  // 4. Nodes (points closer than 0.6 merge), and edges along each road.
  const nodes = [], nh = new Map();
  const nodeAt = (x, z) => {
    const i = Math.round(x / 2), j = Math.round(z / 2);
    for (let a = i - 1; a <= i + 1; a++) for (let b = j - 1; b <= j + 1; b++) for (const id of nh.get(a + ',' + b) || []) if (Math.hypot(nodes[id].x - x, nodes[id].z - z) < 0.6) return id;
    const id = nodes.push({ x, z, adj: [] }) - 1, k = i + ',' + j;
    if (!nh.has(k)) nh.set(k, []); nh.get(k).push(id);
    return id;
  };
  const edge = (a, b, traffic, lane) => {
    if (a === b || nodes[a].adj.some(e => e.to === b)) return;
    const len = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].z - nodes[b].z);
    nodes[a].adj.push({ to: b, len, traffic, lane }); nodes[b].adj.push({ to: a, len, traffic, lane });
  };
  lines.forEach(ln => {
    const all = ln.pts.concat(ln.extra).sort((p, q) => p.s - q.s), lane = ROAD_KINDS[ln.r.kind].lane;
    const ids = all.map(p => nodeAt(p.x, p.z));
    for (let i = 1; i < ids.length; i++) edge(ids[i - 1], ids[i], ln.r.traffic, lane);
    if (ln.r.closed) edge(ids[ids.length - 1], ids[0], ln.r.traffic, lane);
  });
  links.forEach(([p, q, traffic]) => edge(nodeAt(p.x, p.z), nodeAt(q.x, q.z), traffic, 2));
  graph = { nodes };
  return graph;
}

export function nearestNode(x, z, trafficOnly) {
  const { nodes } = roadGraph();
  let best = -1, bd = Infinity;
  nodes.forEach((n, i) => {
    if (trafficOnly && !n.adj.some(e => e.traffic)) return;
    const d = (n.x - x) ** 2 + (n.z - z) ** 2; if (d < bd) { bd = d; best = i; }
  });
  return best;
}

// Shortest path along the roads, as a list of node ids (Dijkstra with a small binary heap).
export function route(from, to) {
  const { nodes } = roadGraph();
  if (from < 0 || to < 0) return [];
  const dist = new Float64Array(nodes.length).fill(Infinity), prev = new Int32Array(nodes.length).fill(-1), heap = [];
  const push = (d, i) => { heap.push([d, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => {
    const top = heap[0], last = heap.pop();
    if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } }
    return top;
  };
  dist[from] = 0; push(0, from);
  while (heap.length) {
    const [d, i] = pop();
    if (i === to) break;
    if (d > dist[i]) continue;
    for (const e of nodes[i].adj) { const nd = d + e.len; if (nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = i; push(nd, e.to); } }
  }
  if (!isFinite(dist[to])) return [];
  const path = []; for (let i = to; i >= 0; i = prev[i]) path.push(i);
  return path.reverse();
}
