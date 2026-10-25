import { TAU } from '../core/util.js';
import { ISLAND, OUTER_R, grassR, edgeR, alborz } from './layout.js';
import { isFree, inPatch, parks } from './plan.js';

/* Trees (kept off roads, lots, landmarks and billboards: thicker in the northern foothills and the parks, none on
   paved districts), rocks along the verge, and drifting clouds. w.trees keeps their spots for the maps. */
export function buildScenery(w) {
  const { scene, M, mat, rand, tick, colliders, LANDMARKS, BOARDS } = w;
  // The same count on every device: gem battles place gems around these trees, and every player must agree.
  const trees = [], want = 560;
  const near = (x, z, d) => trees.some(t => Math.abs(t.x - x) < d && Math.abs(t.z - z) < d && Math.hypot(t.x - x, t.z - z) < d);
  // Building boxes are already in the plan's solid mask; check only the big round things (towers, landmarks).
  const big = colliders.filter(c => !c.hx && c.r >= 1.5);
  const ok = (x, z) => isFree(x, z, 1.8) && !inPatch(x, z)
    && !LANDMARKS.some(l => Math.hypot(l.pos.x - x, l.pos.z - z) < l.triggerR + 3)
    && !BOARDS.some(b => Math.hypot(b.x - x, b.z - z) < 9)
    && !big.some(c => Math.abs(c.x - x) < c.r + 2.5 && Math.abs(c.z - z) < c.r + 2.5 && Math.hypot(c.x - x, c.z - z) < c.r + 2.2);
  // Parks first, so they come out full.
  parks.forEach(p => {
    for (let k = 0; k < (p.w * p.d) / 40; k++) {
      const x = p.x + (rand() - 0.5) * (p.w - 4), z = p.z + (rand() - 0.5) * (p.d - 4);
      if ((!p.round || Math.hypot(x - p.x, z - p.z) < p.w / 2 - 2) && ok(x, z) && !near(x, z, 3.4)) trees.push({ x, z, s: 0.8 + rand() * 0.6 });
    }
  });
  for (let tries = 0; trees.length < want && tries < 16000; tries++) {
    const a = rand() * TAU, R = grassR(a), r = 16 + Math.sqrt(rand()) * (R - 18), x = Math.cos(a) * r, z = Math.sin(a) * r;
    // The foothills are wooded; elsewhere outside the highway most spots stay open.
    if (r > OUTER_R + 10 && rand() > 0.35 + alborz(a) * 0.6) continue;
    if (!ok(x, z) || near(x, z, 3.2)) continue;
    trees.push({ x, z, s: 0.75 + rand() * 0.7, pine: alborz(a) > 0.4 && r > OUTER_R + 20 });
  }
  w.trees = trees;
  const N = trees.length;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.42, 1.8, 6), mat(0x8a5a3b), N);
  const can1 = new THREE.InstancedMesh(new THREE.ConeGeometry(1.9, 3.4, 7), mat(0xffffff), N);
  const can2 = new THREE.InstancedMesh(new THREE.ConeGeometry(1.35, 2.6, 7), mat(0xffffff), N);
  const greens = [0x3f9a5a, 0x57b25f, 0x2f8a4e, 0x6cbf5c].map(h => new THREE.Color(h)), pines = [0x2f6e4a, 0x356f45].map(h => new THREE.Color(h));
  const o = new THREE.Object3D();
  trees.forEach((t, i) => {
    o.rotation.set(0, rand() * 6, 0); o.scale.setScalar(t.s);
    o.position.set(t.x, 0.9 * t.s, t.z); o.updateMatrix(); trunk.setMatrixAt(i, o.matrix);
    o.position.set(t.x, 3.2 * t.s, t.z); o.updateMatrix(); can1.setMatrixAt(i, o.matrix);
    o.position.set(t.x, 4.9 * t.s, t.z); o.updateMatrix(); can2.setMatrixAt(i, o.matrix);
    const gc = (t.pine ? pines : greens)[i % (t.pine ? 2 : 4)]; can1.setColorAt(i, gc); can2.setColorAt(i, gc.clone().offsetHSL(0, 0, 0.06));
    colliders.push({ x: t.x, z: t.z, r: 0.9 * t.s });
  });
  [trunk, can1, can2].forEach(m => { m.castShadow = true; m.receiveShadow = true; scene.add(m); });

  // Rocks and scrub along the verge, where the city meets the desert.
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 70; i++) {
    const a = rand() * TAU, r = edgeR(a) + 1 + rand() * 10;
    const rock = M(rockGeo, mat(rand() < 0.5 ? 0xb4a487 : 0x9a8f7c), Math.cos(a) * r, -0.2, Math.sin(a) * r, scene);
    rock.scale.setScalar(0.6 + rand() * 1.8); rock.rotation.set(rand() * 3, rand() * 3, 0);
  }
  const clouds = [];
  for (let i = 0; i < 18; i++) {
    const c = new THREE.Group();
    const n = 3 + (rand() * 3 | 0);
    for (let k = 0; k < n; k++) M(new THREE.IcosahedronGeometry(5 + rand() * 5, 0), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.15 }), k * 7 - n * 3.5, rand() * 3, rand() * 5, c, true);
    c.position.set((rand() - 0.5) * ISLAND * 3, 95 + rand() * 40, (rand() - 0.5) * ISLAND * 3);
    scene.add(c); clouds.push(c);
  }
  const span = ISLAND * 1.6;
  tick((t, dt) => clouds.forEach(c => { c.position.x += dt * 3; if (c.position.x > span) c.position.x = -span; }));
}
