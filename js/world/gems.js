import { TAU } from '../core/util.js';
import { ISLAND } from './layout.js';

/* Gems for the online gem battle (net/battle.js). Spots come from a shared seed and avoid everything
   solid, so every browser places them identically. Sets world.gemSpot and world.showGems; the drive
   loop calls w.touchGems() and reports grabs through world.onGem(slot). */
export function buildGems(w, world) {
  const { scene, M, tick, colliders } = w;
  const gemMat = new THREE.MeshStandardMaterial({ color: 0x36c2ff, emissive: 0x1a7fd6, emissiveIntensity: 0.6, flatShading: true, roughness: 0.3, metalness: 0.2 });
  const pool = Array.from({ length: 10 }, () => {
    const m = M(new THREE.OctahedronGeometry(0.85), gemMat, 0, 1.4, 0, scene, true);
    m.scale.set(1, 1.35, 1); m.visible = false; m.userData = { key: '', taken: 0 };
    return m;
  });

  world.gemSpot = (seed, i) => {
    let s = (seed ^ Math.imul(i + 1, 0x9E3779B1)) | 0;
    const r = () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    for (let tries = 0; tries < 60; tries++) {
      const a = r() * TAU, rad = 14 + r() * (ISLAND - 22), x = Math.cos(a) * rad, z = Math.sin(a) * rad;
      if (!colliders.some(c => Math.hypot(c.x - x, c.z - z) < c.r + 2.6)) return { x, z };
    }
    const a = r() * TAU; return { x: Math.cos(a) * 34.5, z: Math.sin(a) * 34.5 }; // on the ring road, always clear
  };
  // list[k] is a spot or null; a slot keeps its "just grabbed" state until it moves.
  world.showGems = list => pool.forEach((m, k) => {
    const sp = list && list[k];
    if (!sp) { m.visible = false; m.userData.key = ''; return; }
    const key = `${sp.x.toFixed(2)},${sp.z.toFixed(2)}`;
    if (key === m.userData.key) return;
    m.userData.key = key; m.userData.taken = 0; m.position.set(sp.x, 1.4, sp.z); m.visible = true;
  });
  w.gems = pool;
  w.touchGems = (x, z) => pool.forEach((m, k) => {
    if (!m.visible || m.userData.taken || Math.hypot(m.position.x - x, m.position.z - z) > 2.6) return;
    m.userData.taken = performance.now(); m.visible = false; world.onGem?.(k);
  });
  tick(t => pool.forEach((m, k) => {
    // A grab the host never confirmed (lost message, or someone was faster): show the gem again.
    if (m.userData.taken && !m.visible && m.userData.key && performance.now() - m.userData.taken > 1500) { m.userData.taken = 0; m.visible = true; }
    if (m.visible) { m.rotation.y = t * 2.4 + k; m.position.y = 1.4 + Math.sin(t * 3 + k) * 0.25; }
  }));
}
