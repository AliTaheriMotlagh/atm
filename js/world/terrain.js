import { TAU } from '../core/util.js';
import { ROAD_R, OUTER_R, PLAZA_R, grassR, edgeR } from './layout.js';
import { roads, patches, parks, lakes, ROAD_KINDS, isJunction } from './plan.js';

/* The ground: desert, the city's verge and grass, paved districts, parks, Chitgar Lake, every road with its
   sidewalks and markings, the central plaza, and the coins. */

// Flat things lie in layers a few millimetres apart; polygon offset keeps the layers from flickering far away.
function layerMat(color, layer, o = {}) {
  return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.95, metalness: 0, polygonOffset: true, polygonOffsetFactor: -layer, polygonOffsetUnits: -layer * 4 }, o));
}
// A flat polygon at height y, from [x, z] points.
export function flatShape(pts, y) {
  const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
  return g;
}

/* Collects flat triangles and turns them into one geometry. Each triangle is wound to face up. */
function flatBuilder() {
  const pos = [];
  return {
    tri(a, b, c, y) {
      const cross = (b[1] - a[1]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[1] - a[1]);
      if (cross < 0) [b, c] = [c, b];
      pos.push(a[0], y, a[1], b[0], y, b[1], c[0], y, c[1]);
    },
    quad(a, b, c, d, y) { this.tri(a, b, c, y); this.tri(a, c, d, y); },
    geo() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const n = new Float32Array(pos.length); for (let i = 1; i < n.length; i += 3) n[i] = 1;
      g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
      return g;
    },
    get empty() { return !pos.length; }
  };
}
// A strip of width w along a polyline, offset sideways by off (left is positive). Mitred at the joints.
export function ribbon(b, pts, w, closed, y, off = 0) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], prev = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], next = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    let tx = next[0] - prev[0], tz = next[1] - prev[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    // Mitre: widen at a bend so the strip keeps its width.
    let k = 1;
    if (i > 0 && i < n - 1 || closed) {
      const ax = p[0] - prev[0], az = p[1] - prev[1], al = Math.hypot(ax, az) || 1;
      k = 1 / Math.max(0.5, (ax / al) * tx + (az / al) * tz);
    }
    const nx = -tz, nz = tx;
    L.push([p[0] + nx * (off + w / 2) * k, p[1] + nz * (off + w / 2) * k]);
    R.push([p[0] + nx * (off - w / 2) * k, p[1] + nz * (off - w / 2) * k]);
  }
  for (let i = 0; i < n - (closed ? 0 : 1); i++) { const j = (i + 1) % n; b.quad(L[i], L[j], R[j], R[i], y); }
}
// Dashes along a polyline, offset sideways, skipping junctions.
function dashes(b, pts, closed, y, off, len, gap, w) {
  const n = pts.length;
  for (let i = 0; i < n - (closed ? 0 : 1); i++) {
    const p = pts[i], q = pts[(i + 1) % n], dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz);
    if (L < 0.01) continue;
    const ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
    for (let s = gap / 2; s + len <= L; s += len + gap) {
      const cx = p[0] + ux * (s + len / 2) + nx * off, cz = p[1] + uz * (s + len / 2) + nz * off;
      if (isJunction(cx, cz)) continue;
      const a = [cx - ux * len / 2 + nx * w / 2, cz - uz * len / 2 + nz * w / 2], bb = [cx + ux * len / 2 + nx * w / 2, cz + uz * len / 2 + nz * w / 2];
      const c = [cx + ux * len / 2 - nx * w / 2, cz + uz * len / 2 - nz * w / 2], d = [cx - ux * len / 2 - nx * w / 2, cz - uz * len / 2 - nz * w / 2];
      b.quad(a, bb, c, d, y);
    }
  }
}
// A long straight road would only be two points, so split it up for the dashes to find each junction.
function dense(pts, closed, step) {
  const out = [], n = pts.length;
  for (let i = 0; i < n - (closed ? 0 : 1); i++) {
    const p = pts[i], q = pts[(i + 1) % n], L = Math.hypot(q[0] - p[0], q[1] - p[1]), k = Math.max(1, Math.ceil(L / step));
    for (let j = 0; j < k; j++) out.push([p[0] + (q[0] - p[0]) * j / k, p[1] + (q[1] - p[1]) * j / k]);
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}

export function buildTerrain({ scene, M, mat, tick, COINS }) {
  const ring = (fn, n = 360) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU, r = fn(a); return [Math.cos(a) * r, Math.sin(a) * r]; });
  const lay = (geo, material) => { const m = new THREE.Mesh(geo, material); m.receiveShadow = true; scene.add(m); return m; };

  // Desert out to the horizon, then the dusty verge and the city's grass.
  const desert = new THREE.Mesh(new THREE.CircleGeometry(1400, 64), new THREE.MeshStandardMaterial({ color: 0xd9c497, roughness: 1 }));
  desert.rotation.x = -Math.PI / 2; desert.position.y = -0.06; desert.receiveShadow = true; scene.add(desert);
  lay(flatShape(ring(edgeR), 0), layerMat(0xbfa77a, 1));
  lay(flatShape(ring(grassR), 0), layerMat(0x7f9f58, 2));

  // Paved districts.
  const paveCol = { vanak: 0x8e939a, bazaar: 0xb09a72 };
  patches.forEach(p => {
    const n = 48, pts = [];
    for (let i = 0; i <= n; i++) { const a = p.a0 + (p.a1 - p.a0) * i / n; pts.push([Math.cos(a) * p.r0, Math.sin(a) * p.r0]); }
    for (let i = n; i >= 0; i--) { const a = p.a0 + (p.a1 - p.a0) * i / n, r = p.r1(a) - 1; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    lay(flatShape(pts, 0), layerMat(paveCol[p.id] || 0x8e939a, 3));
  });
  // Parks: greener grass.
  const parkB = flatBuilder();
  parks.forEach(p => {
    if (p.round) { const n = 32, pts = Array.from({ length: n }, (_, i) => [p.x + Math.cos(i / n * TAU) * p.w / 2, p.z + Math.sin(i / n * TAU) * p.w / 2]); for (let i = 0; i < n; i++) parkB.tri([p.x, p.z], pts[i], pts[(i + 1) % n], 0); return; }
    parkB.quad([p.x - p.w / 2, p.z - p.d / 2], [p.x + p.w / 2, p.z - p.d / 2], [p.x + p.w / 2, p.z + p.d / 2], [p.x - p.w / 2, p.z + p.d / 2], 0);
  });
  if (!parkB.empty) lay(parkB.geo(), layerMat(0x5e9a4a, 4));
  // Chitgar Lake: a stone rim and the water.
  lakes.forEach(l => {
    const pts = grow => Array.from({ length: 64 }, (_, i) => {
      const t = i / 64 * TAU, u = Math.cos(t) * (l.rx + grow), v = Math.sin(t) * (l.rz + grow);
      return [l.x + u * Math.cos(l.rot) - v * Math.sin(l.rot), l.z + u * Math.sin(l.rot) + v * Math.cos(l.rot)];
    });
    lay(flatShape(pts(2.2), 0), layerMat(0xd8d2c4, 5));
    const water = lay(flatShape(pts(0), 0), layerMat(0x3a8fd6, 6, { roughness: 0.2, metalness: 0.25, emissive: 0x0b2c4a, emissiveIntensity: 0.25 }));
    tick(t => { water.material.emissiveIntensity = 0.22 + Math.sin(t * 1.3) * 0.05; });
  });

  // Roads: sidewalks under the city streets, the asphalt in one mesh per colour, then the markings.
  const walkB = flatBuilder(), asphalt = new Map(), white = flatBuilder(), yellow = flatBuilder();
  roads.forEach(r => {
    const K = ROAD_KINDS[r.kind];
    if (K.walk) ribbon(walkB, r.pts, r.w + K.walk, r.closed, 0);
    if (!asphalt.has(K.color)) asphalt.set(K.color, flatBuilder());
    ribbon(asphalt.get(K.color), r.pts, r.w, r.closed, 0);
    const pts = dense(r.pts, r.closed, 4);
    if (r.kind === 'highway') {
      ribbon(yellow, r.pts, 0.22, true, 0, 0.3); ribbon(yellow, r.pts, 0.22, true, 0, -0.3);
      [-3.3, 3.3].forEach(o => dashes(white, pts, true, 0, o, 3, 4, 0.25));
      [-r.w / 2 + 0.5, r.w / 2 - 0.5].forEach(o => ribbon(white, r.pts, 0.22, true, 0, o));
    } else if (r.kind === 'ring') dashes(white, pts, true, 0, 0, 1.8, 2.4, 0.35);
    else if (r.kind === 'street' || r.kind === 'avenue' || r.kind === 'connector') dashes(white, pts, r.closed, 0, 0, 2.2, 3, 0.25);
  });
  lay(walkB.geo(), layerMat(0xa9adb3, 7));
  asphalt.forEach((b, color) => lay(b.geo(), layerMat(color, 8, { roughness: 0.9 })));
  lay(white.geo(), layerMat(0xfff4d6, 10, { roughness: 0.6 }));
  lay(yellow.geo(), layerMat(0xffc53d, 10, { roughness: 0.6 }));

  // Plaza in the middle, around home.
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(PLAZA_R - 3, 48), layerMat(0xdfe2e6, 11));
  plaza.rotation.x = -Math.PI / 2; plaza.receiveShadow = true; scene.add(plaza);
  const tiles = new THREE.Mesh(new THREE.RingGeometry(PLAZA_R - 3, PLAZA_R - 2.2, 48), layerMat(0x2fb5b0, 12));
  tiles.rotation.x = -Math.PI / 2; scene.add(tiles);

  // Coins along both rings.
  const coinMat = mat(0xffc53d, { emissive: 0x8c5c00, emissiveIntensity: 0.45, metalness: 0.35, roughness: 0.35 }), coinGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.16, 18);
  const spots = [];
  for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + 0.12, r = ROAD_R + (i % 2 ? 1 : -1); spots.push([Math.cos(a) * r, Math.sin(a) * r]); }
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + 0.2, r = OUTER_R + (i % 2 ? 3.3 : -3.3); spots.push([Math.cos(a) * r, Math.sin(a) * r]); }
  spots.forEach(([x, z], i) => {
    const coin = M(coinGeo, coinMat, x, 1.15, z, scene, true);
    coin.rotation.z = Math.PI / 2; coin.userData.collected = false; COINS.push(coin);
    tick((t, dt) => {
      if (!coin.userData.collected) { coin.rotation.y = t * 3 + i; coin.position.y = 1.15 + Math.sin(t * 3 + i) * 0.18; return; }
      if (!coin.visible) return;
      // Collected: spin up and shrink away.
      const k = (coin.userData.pop += dt) / 0.35;
      if (k >= 1) { coin.visible = false; return; }
      coin.position.y = 1.15 + k * 2.6; coin.scale.setScalar(1 - k * 0.8); coin.rotation.y += dt * 24;
    });
  });
}
