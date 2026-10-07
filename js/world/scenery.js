import { TOUR } from '../projects/index.js';
import { ISLAND, ROAD_R, ROAD_W, LM_R, CIN_R, angleOf, CIN_GAP } from './layout.js';

/* Trees (kept off roads, landmarks and billboards), rocks along the beach, and drifting clouds. */
export function buildScenery({ scene, M, mat, rand, tick, colliders, LANDMARKS, BOARDS }) {
  const CIN_A = angleOf(CIN_GAP);
  const trees = [];
  for (let tries = 0; trees.length < 150 && tries < 5000; tries++) {
    const r = 13 + rand() * (ISLAND - 16), a = rand() * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.abs(r - ROAD_R) < ROAD_W / 2 + 2.5) continue;
    if (LANDMARKS.some(l => Math.hypot(l.pos.x - x, l.pos.z - z) < l.triggerR + 3)) continue;
    if (BOARDS.some(b => Math.hypot(b.x - x, b.z - z) < 9)) continue;
    { const along = x * Math.cos(CIN_A) + z * Math.sin(CIN_A), perp = Math.abs(-x * Math.sin(CIN_A) + z * Math.cos(CIN_A)); if (along > ROAD_R && along < CIN_R && perp < 4.5) continue; }
    if (TOUR.some((_, i) => { const b = angleOf(i); const along = x * Math.cos(b) + z * Math.sin(b); const perp = Math.abs(-x * Math.sin(b) + z * Math.cos(b)); return along > 0 && along < LM_R && perp < 4.5; })) continue;
    if (trees.some(t => Math.hypot(t.x - x, t.z - z) < 3.2)) continue;
    trees.push({ x, z, s: 0.75 + rand() * 0.7 });
  }
  const N = trees.length;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.42, 1.8, 6), mat(0x8a5a3b), N);
  const can1 = new THREE.InstancedMesh(new THREE.ConeGeometry(1.9, 3.4, 7), mat(0xffffff), N);
  const can2 = new THREE.InstancedMesh(new THREE.ConeGeometry(1.35, 2.6, 7), mat(0xffffff), N);
  const greens = [0x3f9a5a, 0x57b25f, 0x2f8a4e, 0x6cbf5c].map(h => new THREE.Color(h));
  const o = new THREE.Object3D();
  trees.forEach((t, i) => {
    o.rotation.set(0, rand() * 6, 0); o.scale.setScalar(t.s);
    o.position.set(t.x, 0.9 * t.s, t.z); o.updateMatrix(); trunk.setMatrixAt(i, o.matrix);
    o.position.set(t.x, 3.2 * t.s, t.z); o.updateMatrix(); can1.setMatrixAt(i, o.matrix);
    o.position.set(t.x, 4.9 * t.s, t.z); o.updateMatrix(); can2.setMatrixAt(i, o.matrix);
    const gc = greens[i % greens.length]; can1.setColorAt(i, gc); can2.setColorAt(i, gc.clone().offsetHSL(0, 0, 0.06));
    colliders.push({ x: t.x, z: t.z, r: 0.9 * t.s });
  });
  [trunk, can1, can2].forEach(m => { m.castShadow = true; m.receiveShadow = true; scene.add(m); });
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2, r = ISLAND + 2 + rand() * 7;
    const rock = M(new THREE.DodecahedronGeometry(0.6 + rand() * 1.4, 0), mat(0x9aa1ab), Math.cos(a) * r, -0.3, Math.sin(a) * r, scene);
    rock.rotation.set(rand() * 3, rand() * 3, 0);
  }
  const clouds = [];
  for (let i = 0; i < 12; i++) {
    const c = new THREE.Group();
    const n = 3 + (rand() * 3 | 0);
    for (let k = 0; k < n; k++) M(new THREE.IcosahedronGeometry(3 + rand() * 3, 0), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.15 }), k * 4 - n * 2, rand() * 2, rand() * 3, c, true);
    c.position.set((rand() - 0.5) * 360, 48 + rand() * 20, (rand() - 0.5) * 360);
    scene.add(c); clouds.push(c);
  }
  tick((t, dt) => clouds.forEach(c => { c.position.x += dt * 2.2; if (c.position.x > 200) c.position.x = -200; }));
}
