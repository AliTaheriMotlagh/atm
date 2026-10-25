import { TAU } from '../core/util.js';
import { OUTER_R, OUTER_W, edgeR, alborz, deg } from './layout.js';
import { roads, buildings, houses, domes, lakes, piers, spots, ROAD_KINDS, isJunction, isSolid, inBounds } from './plan.js';
import { roundRect } from './screens.js';

/* Tehran, built from the plan: towers, apartments, villas and the bazaar; Milad Tower, Azadi Tower, Tabiat Bridge
   and the mosque; Chitgar Lake's pier and Ferris wheel; Valiasr's plane trees; street lamps; and the Alborz with
   Damavand behind. Buildings are merged into a few meshes, one per facade, so the whole city is a handful of
   draw calls. Everything solid goes into w.colliders: circles { x, z, r } or boxes { x, z, hx, hz, rot, r }. */

/* --- merged geometry --- */
export function builder(withUV) {
  const pos = [], nor = [], col = [], uv = [];
  const c3 = new THREE.Color();
  function quad(p, n, color, uvs) {
    const e1 = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]], e2 = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]];
    const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const order = cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0 ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3];
    c3.set(color);
    for (const i of order) { pos.push(...p[i]); nor.push(...n); col.push(c3.r, c3.g, c3.b); if (withUV) uv.push(...(uvs ? uvs[i] : [0, 0])); }
  }
  function tri(p, color) {
    const e1 = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]], e2 = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]];
    let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    if (n[1] < 0) { p = [p[0], p[2], p[1]]; n = n.map(v => -v); }
    const l = Math.hypot(...n) || 1; n = n.map(v => v / l);
    c3.set(color);
    p.forEach(q => { pos.push(...q); nor.push(...n); col.push(c3.r, c3.g, c3.b); if (withUV) uv.push(0, 0); });
  }
  // A box standing on y0, turned by rot around its centre. faces: 'sides', 'top', or both.
  function box(cx, y0, cz, w, h, d, rot, color, o = {}) {
    const c = Math.cos(rot), s = Math.sin(rot);
    const P = (lx, y, lz) => [cx + lx * c + lz * s, y0 + y, cz - lx * s + lz * c];
    const N = (lx, lz) => [lx * c + lz * s, 0, -lx * s + lz * c];
    const W = w / 2, D = d / 2, U = o.uv || [8, 7];
    if (o.sides !== false) {
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([nx, nz]) => {
        const span = nx ? d : w, a = nx ? P(nx * W, 0, -D) : P(-W, 0, nz * D), b = nx ? P(nx * W, 0, D) : P(W, 0, nz * D);
        const a2 = [a[0], a[1] + h, a[2]], b2 = [b[0], b[1] + h, b[2]];
        quad([a, b, b2, a2], N(nx, nz), color, [[0, 0], [span / U[0], 0], [span / U[0], h / U[1]], [0, h / U[1]]]);
      });
    }
    if (o.top !== false) quad([P(-W, h, -D), P(W, h, -D), P(W, h, D), P(-W, h, D)], [0, 1, 0], o.topColor ?? color);
  }
  function geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    if (withUV) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return g;
  }
  return { quad, tri, box, geo, get empty() { return !pos.length; } };
}

/* --- facades: one canvas tile is two window columns by two floors (8 × 7 units) --- */
function facade(style) {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
  const x = cv.getContext('2d');
  const win = (l, t, w, h, lit) => { x.fillStyle = lit ? '#ffe7a6' : '#2b3a52'; x.fillRect(l, t, w, h); };
  const lit = () => Math.random() < 0.12;
  if (style === 'glass' || style === 'dark') {
    const g = x.createLinearGradient(0, 0, 128, 128);
    g.addColorStop(0, style === 'glass' ? '#6fa3d9' : '#33414f'); g.addColorStop(1, style === 'glass' ? '#3c6fa8' : '#1e2833');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    x.fillStyle = style === 'glass' ? 'rgba(220,235,255,.55)' : 'rgba(150,170,190,.4)';
    for (let i = 0; i < 4; i++) x.fillRect(i * 32, 0, 2, 128);
    for (let j = 0; j < 2; j++) x.fillRect(0, j * 64 + 60, 128, 4);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) if (Math.random() < 0.18) { x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(i * 32 + 2, j * 64, 30, 60); }
  } else if (style === 'office') {
    x.fillStyle = '#d9d2c3'; x.fillRect(0, 0, 128, 128);
    for (let j = 0; j < 2; j++) { x.fillStyle = '#34465e'; x.fillRect(0, j * 64 + 14, 128, 30); x.fillStyle = '#c9c1b0'; for (let i = 0; i < 4; i++) x.fillRect(i * 32, j * 64 + 14, 3, 30); }
  } else if (style === 'apartment') {
    // Tehran's light stone apartment fronts, with little balconies.
    x.fillStyle = '#eae2d2'; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const l = i * 64 + 12, t = j * 64 + 10;
      win(l, t, 40, 34, lit());
      x.fillStyle = '#9aa1ab'; x.fillRect(l - 4, t + 34, 48, 5);
      x.fillStyle = '#5b6270'; for (let k = 0; k < 6; k++) x.fillRect(l - 3 + k * 9, t + 24, 2, 10);
      x.fillRect(l - 4, t + 23, 48, 2);
    }
  } else if (style === 'brick' || style === 'bazaar') {
    // Yellow-brown brick (ajor), with plain windows or, at the bazaar, pointed arches.
    x.fillStyle = style === 'bazaar' ? '#c9a46b' : '#c99a6b'; x.fillRect(0, 0, 128, 128);
    x.fillStyle = 'rgba(90,60,30,.18)';
    for (let r = 0; r < 32; r++) for (let k = 0; k < 9; k++) x.fillRect(k * 16 + (r % 2) * 8, r * 4, 1, 4);
    for (let r = 0; r < 32; r++) x.fillRect(0, r * 4, 128, 1);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const l = i * 64 + 16, t = j * 64 + 12;
      if (style === 'bazaar') {
        x.fillStyle = j ? '#6b4a2b' : '#3b2a1c';
        x.beginPath(); x.moveTo(l, t + 46); x.lineTo(l, t + 18); x.quadraticCurveTo(l, t, l + 16, t - 4); x.quadraticCurveTo(l + 32, t, l + 32, t + 18); x.lineTo(l + 32, t + 46); x.fill();
        x.strokeStyle = '#2fb5b0'; x.lineWidth = 3; x.stroke();
      } else { x.fillStyle = '#f2ece0'; x.fillRect(l - 3, t - 3, 38, 42); win(l, t, 32, 36, lit()); }
    }
  }
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
  return tex;
}

// A low-poly mountain: a jagged cone, coloured from scrub at the foot to snow on top.
function mountain(R, H, segs, rand, snow = 0.72) {
  const g = new THREE.ConeGeometry(R, H, segs, 5);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) + H / 2, k = y / H;
    if (k > 0.98 || k < 0.02) continue;
    const j = 1 + (rand() - 0.5) * 0.35;
    p.setX(i, p.getX(i) * j); p.setZ(i, p.getZ(i) * j); p.setY(i, p.getY(i) + (rand() - 0.5) * H * 0.08);
  }
  g.translate(0, H / 2, 0);
  const geo = g.toNonIndexed(), q = geo.attributes.position, cols = new Float32Array(q.count * 3), c = new THREE.Color();
  for (let i = 0; i < q.count; i += 3) {
    const y = (q.getY(i) + q.getY(i + 1) + q.getY(i + 2)) / 3 / H;
    c.set(y > snow ? 0xf4f6fa : y > snow - 0.22 ? 0x8a8278 : y > 0.18 ? 0xa08a68 : 0x9a9a62);
    for (let k = 0; k < 3; k++) cols.set([c.r, c.g, c.b], (i + k) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  return geo;
}
function mergeGeos(list) {
  const out = { position: [], normal: [], color: [] };
  list.forEach(({ geo, x, y, z, ry }) => {
    const m = new THREE.Matrix4().makeRotationY(ry || 0).setPosition(x, y || 0, z);
    const g = geo.clone().applyMatrix4(m);
    for (const k in out) out[k].push(...g.attributes[k].array);
  });
  const g = new THREE.BufferGeometry();
  for (const k in out) g.setAttribute(k, new THREE.Float32BufferAttribute(out[k], 3));
  return g;
}

export function buildCity(w) {
  const { scene, M, mat, rand, tick, colliders } = w;
  const vmat = (o = {}) => new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, flatShading: true, roughness: 0.85 }, o));
  const add = (geo, material, shadow = true) => { const m = new THREE.Mesh(geo, material); m.castShadow = shadow; m.receiveShadow = true; scene.add(m); return m; };
  const boxCollider = (x, z, w2, d2, rot) => colliders.push({ x, z, hx: w2 / 2, hz: d2 / 2, rot, r: Math.hypot(w2, d2) / 2 });
  const pol = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];

  /* --- buildings --- */
  const styles = ['glass', 'dark', 'office', 'apartment', 'brick', 'bazaar'];
  const fronts = Object.fromEntries(styles.map(s => [s, builder(true)]));
  const roofs = builder(false), tanks = [];
  const tint = new THREE.Color();
  buildings.forEach(b => {
    tint.setScalar(b.tint || 1);
    fronts[b.style].box(b.x, 0, b.z, b.w, b.h, b.d, b.rot, tint.getHex(), { top: false });
    // Flat roof with a parapet, and rooftop clutter: lift huts, AC units, and Tehran's water tanks.
    roofs.box(b.x, b.h - 0.01, b.z, b.w + 0.3, 0.5, b.d + 0.3, b.rot, b.style === 'bazaar' ? 0xb8925c : 0x9aa0a8);
    if (b.h > 30) roofs.box(b.x, b.h + 0.5, b.z, b.w * 0.45, 2.6, b.d * 0.45, b.rot, 0x7a8089);
    else if (b.style !== 'bazaar' && b.w * b.d > 40) {
      roofs.box(b.x + b.w * 0.2, b.h + 0.5, b.z - b.d * 0.2, 2.2, 2.4, 2.2, b.rot, 0xd8d2c4);
      for (let k = 0; k < 2; k++) if (rand() < 0.7) tanks.push([b.x - b.w * 0.25 + k * 1.6, b.h + 0.5, b.z + b.d * 0.22]);
    }
    boxCollider(b.x, b.z, b.w, b.d, b.rot);
  });
  styles.forEach(s => { if (!fronts[s].empty) add(fronts[s].geo(), vmat({ map: facade(s), flatShading: false, roughness: s === 'glass' || s === 'dark' ? 0.35 : 0.85, metalness: s === 'glass' ? 0.25 : 0 })); });
  // The tallest Vanak tower gets a spire.
  if (spots.tower) {
    const t = spots.tower;
    M(new THREE.CylinderGeometry(0.25, 0.6, 18, 8), mat(0xdfe4ea, { metalness: 0.5, roughness: 0.3 }), t.x, t.h + 3 + 9, t.z, scene);
    w.blink.push(M(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3b30 }), t.x, t.h + 21.5, t.z, scene, true));
  }

  /* --- villas --- */
  houses.forEach(h => {
    roofs.box(h.x, 0, h.z, h.w, h.h, h.d, h.rot, h.wall, { top: false });
    const c = Math.cos(h.rot), s = Math.sin(h.rot), P = (lx, y, lz) => [h.x + lx * c + lz * s, y, h.z - lx * s + lz * c];
    const W = h.w / 2 + 0.4, D = h.d / 2 + 0.4, top = P(0, h.h + 2.2, 0);
    [[P(-W, h.h, -D), P(W, h.h, -D)], [P(W, h.h, -D), P(W, h.h, D)], [P(W, h.h, D), P(-W, h.h, D)], [P(-W, h.h, D), P(-W, h.h, -D)]].forEach(([a, b]) => roofs.tri([a, b, top], h.roof));
    roofs.box(h.x + h.d / 2 * s, 0, h.z + h.d / 2 * c, 1.1, 2, 0.15, h.rot, 0x5a3b2a, { top: false });
    boxCollider(h.x, h.z, h.w, h.d, h.rot);
  });
  add(roofs.geo(), vmat());
  // Water tanks on the roofs.
  if (tanks.length) {
    const tm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.6, 0.6, 1.4, 10), mat(0xe8edf5, { roughness: 0.5 }), tanks.length), o = new THREE.Object3D();
    tanks.forEach(([x, y, z], i) => { o.position.set(x, y + 0.7, z); o.updateMatrix(); tm.setMatrixAt(i, o.matrix); tm.setColorAt(i, new THREE.Color(i % 3 ? 0xe8edf5 : 0x4f8fd6)); });
    tm.castShadow = true; scene.add(tm);
  }
  // Bazaar domes.
  if (domes.length) {
    const dm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2), mat(0xffffff, { roughness: 0.6 }), domes.length), o = new THREE.Object3D();
    domes.forEach((d, i) => { o.position.set(d.x, d.y, d.z); o.scale.set(d.r, d.r * 0.9, d.r); o.updateMatrix(); dm.setMatrixAt(i, o.matrix); dm.setColorAt(i, new THREE.Color(d.color)); });
    dm.castShadow = true; scene.add(dm);
  }

  /* --- the mosque in the bazaar: turquoise dome, two minarets, a tiled gate --- */
  if (spots.mosque) {
    const { x, z } = spots.mosque, g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(-x, -z); scene.add(g);
    const tile = mat(0x2fb5b0, { roughness: 0.4 }), sand = mat(0xd9c39a), deep = mat(0x1f6fa8, { roughness: 0.4 });
    M(new THREE.BoxGeometry(20, 7, 20), sand, 0, 3.5, 0, g);
    M(new THREE.CylinderGeometry(6.4, 6.8, 5, 16), tile, 0, 9.5, 0, g);
    const dome = M(new THREE.SphereGeometry(6.6, 20, 12, 0, TAU, 0, Math.PI / 2), tile, 0, 12, 0, g); dome.scale.y = 1.35;
    M(new THREE.ConeGeometry(0.5, 2.6, 8), mat(0xffc53d, { metalness: 0.6, roughness: 0.3 }), 0, 22, 0, g);
    // The iwan: a tall tiled gateway facing the road.
    M(new THREE.BoxGeometry(10, 12, 2.4), deep, 0, 6, 10.6, g);
    M(new THREE.BoxGeometry(5, 8, 0.4), mat(0x123a5c), 0, 4, 11.9, g);
    [-6.5, 6.5].forEach(mx => {
      M(new THREE.CylinderGeometry(0.9, 1.1, 20, 12), tile, mx, 10, 10.6, g);
      M(new THREE.CylinderGeometry(1.5, 1.5, 0.6, 12), sand, mx, 16.5, 10.6, g);
      M(new THREE.SphereGeometry(1, 10, 6), deep, mx, 20.5, 10.6, g);
    });
    colliders.push({ x, z, r: 14 });
  }

  /* --- Milad Tower: concrete shaft, the octagonal pod, and the mast --- */
  if (spots.milad) {
    const { x, z } = spots.milad, concrete = mat(0xcfd3d8, { roughness: 0.6 }), glass = mat(0x4f7fb8, { roughness: 0.25, metalness: 0.4 });
    M(new THREE.CylinderGeometry(6, 13, 12, 8), concrete, x, 6, z, scene);
    M(new THREE.CylinderGeometry(2.2, 4.4, 86, 12), concrete, x, 12 + 43, z, scene);
    [[98, 8.6, 9.6, 2.2, concrete], [100.6, 10.4, 8.6, 3, glass], [103.6, 11, 10.4, 2.4, concrete], [106, 9, 11, 2.6, glass], [108.6, 6.5, 9, 1.8, concrete]]
      .forEach(([y, rt, rb, h, m]) => M(new THREE.CylinderGeometry(rt, rb, h, 8), m, x, y, z, scene));
    M(new THREE.CylinderGeometry(1.2, 1.8, 10, 8), concrete, x, 114, z, scene);
    M(new THREE.CylinderGeometry(0.35, 0.8, 36, 8), mat(0xe8ecf2, { metalness: 0.4 }), x, 137, z, scene);
    w.blink.push(M(new THREE.SphereGeometry(0.9, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3b30 }), x, 155.5, z, scene, true));
    colliders.push({ x, z, r: 12 });
  }

  /* --- Azadi Tower on its square --- */
  if (spots.azadi) {
    const { x, z } = spots.azadi, g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI / 2; scene.add(g);
    const lawn = new THREE.Mesh(new THREE.CircleGeometry(10, 32), mat(0x6fb35a)); lawn.rotation.x = -Math.PI / 2; lawn.position.y = 0.07; lawn.receiveShadow = true; g.add(lawn);
    // The profile: a wide foot sweeping up to a narrow top, with the pointed arch cut through it.
    const s = new THREE.Shape();
    s.moveTo(-6, 0); s.quadraticCurveTo(-2.6, 5, -2.2, 13); s.lineTo(-1.9, 16); s.lineTo(1.9, 16); s.lineTo(2.2, 13); s.quadraticCurveTo(2.6, 5, 6, 0); s.lineTo(-6, 0);
    const hole = new THREE.Path(); hole.moveTo(-2.4, 0); hole.lineTo(-1.9, 5); hole.quadraticCurveTo(-1.2, 8.6, 0, 9.4); hole.quadraticCurveTo(1.2, 8.6, 1.9, 5); hole.lineTo(2.4, 0); hole.lineTo(-2.4, 0);
    s.holes.push(hole);
    const marble = mat(0xece4d0, { roughness: 0.55 });
    const geo = new THREE.ExtrudeGeometry(s, { depth: 6, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.15, bevelSegments: 1, curveSegments: 10 }); geo.translate(0, 0, -3);
    M(geo, marble, 0, 0.1, 0, g);
    // The side arches (a narrower cut the other way) and the cap.
    M(new THREE.BoxGeometry(4.2, 2.4, 5.4), marble, 0, 17.3, 0, g);
    M(new THREE.BoxGeometry(3.4, 0.6, 4.4), mat(0x2fb5b0), 0, 18.8, 0, g);
    colliders.push({ x, z, r: 7 });
  }

  /* --- Tabiat Bridge: a two-level park bridge on tree-like steel legs, over the avenue --- */
  if (spots.tabiat) {
    const { x, z, a } = spots.tabiat, g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -a; scene.add(g);
    // Local +X runs along the avenue; the bridge spans local Z.
    const steel = mat(0x8a8f99, { metalness: 0.4, roughness: 0.5 }), deck = mat(0xb08a5a);
    M(new THREE.BoxGeometry(6, 0.6, 44), deck, 0, 7.6, 0, g);
    M(new THREE.BoxGeometry(4, 0.5, 30), deck, 0, 11.6, 0, g);
    M(new THREE.BoxGeometry(5, 0.3, 36), mat(0x5b6270, { metalness: 0.3 }), 0, 15, 0, g);
    [-19, -9, 9, 19].forEach(lz => {
      M(new THREE.CylinderGeometry(0.5, 0.8, 7.6, 8), steel, 0, 3.8, lz, g);
      [-1, 1].forEach(sx => {
        const br = M(new THREE.CylinderGeometry(0.25, 0.35, 5, 6), steel, sx * 1.4, 9.6, lz, g); br.rotation.z = sx * 0.5;
        const b2 = M(new THREE.CylinderGeometry(0.2, 0.3, 4.4, 6), steel, 0, 9.6, lz + sx * 1.4, g); b2.rotation.x = -sx * 0.5;
      });
      const v = new THREE.Vector3(0, 0, lz).applyAxisAngle(new THREE.Vector3(0, 1, 0), -a);
      colliders.push({ x: x + v.x, z: z + v.z, r: 1.2 });
    });
    [-1, 1].forEach(sx => M(new THREE.BoxGeometry(0.15, 1, 44), steel, sx * 2.9, 8.4, 0, g));
    for (let k = -2; k <= 2; k++) M(new THREE.IcosahedronGeometry(1.4, 0), mat(0x4f9a4f), 0, 12.9, k * 5.5, g);
  }

  /* --- Tajrish Square fountain --- */
  if (spots.tajrish) {
    const { x, z } = spots.tajrish;
    const lawn = new THREE.Mesh(new THREE.CircleGeometry(6.5, 28), mat(0x6fb35a)); lawn.rotation.x = -Math.PI / 2; lawn.position.set(x, 0.07, z); scene.add(lawn);
    M(new THREE.CylinderGeometry(3.4, 3.6, 0.8, 20), mat(0xd8d2c4), x, 0.4, z, scene);
    const jet = M(new THREE.ConeGeometry(0.9, 4, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xcfeaff, transparent: true, opacity: 0.6 }), x, 2.6, z, scene, true);
    tick(t => { jet.scale.y = 1 + Math.sin(t * 4) * 0.08; });
    colliders.push({ x, z, r: 4 });
  }

  /* --- Chitgar Lake: pier railings, a fountain, and the Ferris wheel --- */
  lakes.forEach(l => {
    const jet = M(new THREE.ConeGeometry(1.4, 9, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xe8f6ff, transparent: true, opacity: 0.55, depthWrite: false }), l.x, 4.5, l.z, scene, true);
    tick(t => { jet.scale.set(1, 0.85 + Math.sin(t * 2.2) * 0.15, 1); });
  });
  piers.forEach(p => {
    const len = p.r1 - p.r0, mid = (p.r0 + p.r1) / 2, g = new THREE.Group();
    g.position.set(p.x + Math.cos(p.a) * mid, 0, p.z + Math.sin(p.a) * mid); g.rotation.y = -p.a; scene.add(g);
    [-1, 1].forEach(s => { M(new THREE.BoxGeometry(len, 0.12, 0.12), mat(0xf2f5fa), 0, 1.1, s * (p.hw - 0.4), g); for (let k = 0; k <= len; k += 3) M(new THREE.BoxGeometry(0.12, 1.1, 0.12), mat(0xf2f5fa), -len / 2 + k, 0.55, s * (p.hw - 0.4), g, true); });
  });
  if (spots.wheel) {
    const { x, z } = spots.wheel, l = lakes[0], g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = l ? -l.rot : 0; scene.add(g);
    const R = 11, C = 13.5, white = mat(0xf2f5fa, { metalness: 0.3, roughness: 0.4 });
    [-1.6, 1.6].forEach(lz => [-1, 1].forEach(sx => { const leg = M(new THREE.CylinderGeometry(0.3, 0.4, C + 1, 8), white, sx * 3.4, C / 2, lz, g); leg.rotation.z = sx * 0.26; }));
    const wheel = new THREE.Group(); wheel.position.y = C; g.add(wheel);
    [-1.2, 1.2].forEach(lz => { const rim = M(new THREE.TorusGeometry(R, 0.22, 6, 48), white, 0, 0, lz, wheel); rim.castShadow = true; });
    const cols = [0xff4f8b, 0xffc53d, 0x36c2ff, 0x2fdc8a, 0x9b7bff, 0xff7a1a];
    const cabins = [];
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      const sp = M(new THREE.BoxGeometry(0.15, R, 0.15), white, Math.cos(a) * R / 2, Math.sin(a) * R / 2, 0, wheel, true); sp.rotation.z = a - Math.PI / 2;
      const cab = M(new THREE.BoxGeometry(1.6, 1.4, 1.8), mat(cols[i % cols.length]), Math.cos(a) * R, Math.sin(a) * R - 0.9, 0, wheel);
      cabins.push(cab);
    }
    M(new THREE.CylinderGeometry(0.7, 0.7, 3.6, 12), white, 0, 0, 0, wheel).rotation.x = Math.PI / 2;
    tick((t, dt) => { wheel.rotation.z += dt * 0.12; cabins.forEach(c => { c.rotation.z = -wheel.rotation.z; }); });
    colliders.push({ x, z, r: 5.5 });
  }

  /* --- Valiasr's plane trees (chenar), in two long rows --- */
  if (spots.valiasr) {
    const v = spots.valiasr, list = [];
    for (let z = v.z0 - 6; z > v.z1 + 4; z -= 7) [-8, 8].forEach(dx => { if (!isJunction(v.x + dx * 0.6, z)) list.push([v.x + dx, z]); });
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.32, 0.45, 6, 6), mat(0x9c8a72), list.length);
    const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(3.4, 0), mat(0x4f9a4f), list.length), o = new THREE.Object3D();
    list.forEach(([x, z], i) => {
      o.position.set(x, 3, z); o.rotation.set(0, i, 0); o.scale.setScalar(1); o.updateMatrix(); trunk.setMatrixAt(i, o.matrix);
      o.position.set(x, 7.6, z); o.scale.set(1, 0.85 + (i % 3) * 0.08, 1); o.updateMatrix(); crown.setMatrixAt(i, o.matrix);
      crown.setColorAt(i, new THREE.Color(i % 4 ? 0x4f9a4f : 0x5fae55));
      colliders.push({ x, z, r: 0.5 });
    });
    [trunk, crown].forEach(m => { m.castShadow = true; m.receiveShadow = true; scene.add(m); });
  }

  /* --- street lamps --- */
  {
    const spotsL = [];
    const along = (pts, closed, off, step) => {
      const n = pts.length;
      for (let i = 0; i < n - (closed ? 0 : 1); i++) {
        const p = pts[i], q = pts[(i + 1) % n], L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < 0.01) continue;
        const ux = (q[0] - p[0]) / L, uz = (q[1] - p[1]) / L;
        for (let s = step / 2; s < L; s += step) {
          const x = p[0] + ux * s - uz * off, z = p[1] + uz * s + ux * off;
          if (isJunction(p[0] + ux * s, p[1] + uz * s) || isSolid(x, z) || !inBounds(x, z)) continue;
          spotsL.push([x, z, Math.atan2(uz, -ux) + (off > 0 ? Math.PI : 0)]);
        }
      }
    };
    roads.forEach(r => {
      if (r.kind === 'highway') { along(r.pts, true, OUTER_W / 2 + 1.3, 26); along(r.pts, true, -OUTER_W / 2 - 1.3, 26); }
      else if (r.kind === 'street' || r.kind === 'avenue') along(r.pts, r.closed, r.w / 2 + (ROAD_KINDS[r.kind].walk || 2) / 2, 24);
      else if (r.kind === 'ring') along(r.pts, true, r.w / 2 + 1.2, 30);
    });
    const N = spotsL.length, o = new THREE.Object3D();
    const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.18, 6, 6), mat(0x4a505c), N);
    const arm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.12, 1.8), mat(0x4a505c), N);
    const head = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.2, 0.8), mat(0xfff3d0, { emissive: 0xffe8a8, emissiveIntensity: 0.6 }), N);
    spotsL.forEach(([x, z, h], i) => {
      o.rotation.set(0, h, 0);
      o.position.set(x, 3, z); o.updateMatrix(); pole.setMatrixAt(i, o.matrix);
      const fx = Math.sin(h) * 0.8, fz = Math.cos(h) * 0.8;
      o.position.set(x + fx, 5.9, z + fz); o.updateMatrix(); arm.setMatrixAt(i, o.matrix);
      o.position.set(x + fx * 2, 5.8, z + fz * 2); o.updateMatrix(); head.setMatrixAt(i, o.matrix);
      colliders.push({ x, z, r: 0.3 });
    });
    pole.castShadow = true; scene.add(pole, arm, head);
  }

  /* --- beyond the city: the Alborz to the north with Damavand behind, low desert hills elsewhere --- */
  {
    const list = [];
    for (let a = deg(185); a < deg(355); a += deg(4.5)) {
      const k = alborz(a); if (k < 0.08) continue;
      const near = edgeR(a) + 22 + rand() * 16, R = (24 + rand() * 18) * (0.6 + k * 0.5), H = (26 + rand() * 30) * (0.5 + k * 0.7);
      list.push({ geo: mountain(R, H, 9, rand, 0.9), x: Math.cos(a) * near, z: Math.sin(a) * near, ry: rand() * TAU });
      if (a % deg(9) < deg(4.5)) {
        const far = edgeR(a) + 95 + rand() * 50, R2 = (60 + rand() * 40) * (0.5 + k * 0.6), H2 = (70 + rand() * 60) * (0.4 + k * 0.8);
        list.push({ geo: mountain(R2, H2, 10, rand, 0.68), x: Math.cos(a) * far, z: Math.sin(a) * far, ry: rand() * TAU });
      }
    }
    // Damavand: the lone snow cone to the north-east.
    const da = deg(298);
    list.push({ geo: mountain(170, 240, 14, rand, 0.55), x: Math.cos(da) * 640, z: Math.sin(da) * 640, ry: 0.3 });
    add(mergeGeos(list), vmat({ roughness: 0.95 }), false);
    const dunes = [];
    for (let a = 0; a < TAU; a += deg(7)) {
      if (alborz(a) > 0.05) continue;
      const r = edgeR(a) + 40 + rand() * 140, R = 30 + rand() * 40, H = 5 + rand() * 12;
      const g = new THREE.ConeGeometry(R, H, 8, 1); g.translate(0, H / 2 - 0.5, 0);
      const ng = g.toNonIndexed(), cols = new Float32Array(ng.attributes.position.count * 3).fill(0);
      for (let i = 0; i < cols.length; i += 3) cols.set([0.84, 0.75, 0.56], i);
      ng.setAttribute('color', new THREE.BufferAttribute(cols, 3)); ng.computeVertexNormals();
      dunes.push({ geo: ng, x: Math.cos(a) * r, z: Math.sin(a) * r, ry: rand() * TAU });
    }
    add(mergeGeos(dunes), vmat({ roughness: 1 }), false);
  }

  // A sign over the ring highway: "Tehran" in Persian and English.
  {
    const a = deg(270) + 0.05, [x, z] = pol(a, OUTER_R), g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -a + Math.PI / 2; scene.add(g);
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
    const c = cv.getContext('2d'); c.fillStyle = '#1f6f4a'; roundRect(c, 4, 4, 504, 120, 14); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 4; roundRect(c, 12, 12, 488, 104, 10); c.stroke();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '700 44px Vazirmatn, Tahoma, sans-serif'; c.fillText('تهران', 256, 44);
    c.font = '700 30px "Atkinson Hyperlegible", sans-serif'; c.fillText('TEHRAN · Vanak ↗  Tajrish ↑', 256, 92);
    const S = OUTER_W + 4;
    [-S / 2, S / 2].forEach(lx => {
      M(new THREE.BoxGeometry(0.4, 7.6, 0.4), mat(0x8a8f99), lx, 3.8, 0, g);
      const v = new THREE.Vector3(lx, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y);
      colliders.push({ x: x + v.x, z: z + v.z, r: 0.4 });
    });
    M(new THREE.BoxGeometry(S, 0.3, 0.3), mat(0x8a8f99), 0, 7.4, 0, g);
    const sign = M(new THREE.PlaneGeometry(10, 2.5), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(cv), side: THREE.DoubleSide }), 0, 6, 0.1, g, true);
    sign.rotation.y = 0;
  }

  tick(t => w.blink.forEach(b => { b.visible = Math.sin(t * 3) > -0.2; }));
}
