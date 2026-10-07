import { ISLAND, ROAD_R, ROAD_W } from './layout.js';

/* Grass, beach, waves, the ring road, the central plaza and the coins on the road. */
export function buildTerrain({ scene, M, mat, tick, COINS }) {
  const grass = M(new THREE.CylinderGeometry(ISLAND, ISLAND + 4, 3, 64), mat(0x86c46d), 0, -1.5, 0, scene);
  grass.castShadow = false;
  M(new THREE.CylinderGeometry(ISLAND + 7, ISLAND + 12, 2.4, 64), mat(0xf0d08c), 0, -1.7, 0, scene).castShadow = false;
  const seaGeo = new THREE.PlaneGeometry(900, 900, 72, 72); seaGeo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(seaGeo, mat(0x2a86d6, { roughness: 0.35, metalness: 0.05 }));
  sea.position.y = -1.3; sea.receiveShadow = true; scene.add(sea);
  const seaPos = seaGeo.attributes.position;
  const seaBase = Float32Array.from(seaPos.array);
  tick(t => {
    for (let i = 0; i < seaPos.count; i++) {
      const x = seaBase[i * 3], z = seaBase[i * 3 + 2];
      seaPos.array[i * 3 + 1] = Math.sin(x * 0.045 + t * 0.9) * 0.45 + Math.cos(z * 0.06 + t * 0.7) * 0.4;
    }
    seaPos.needsUpdate = true;
  });

  // Road ring, dashes, plaza, spokes, driveways
  const road = M(new THREE.RingGeometry(ROAD_R - ROAD_W / 2, ROAD_R + ROAD_W / 2, 120), mat(0x3b404c), 0, 0.03, 0, scene);
  road.rotation.x = -Math.PI / 2; road.castShadow = false;
  const dashN = 64;
  const dashes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.35, 0.05, 1.8), mat(0xfff4d6), dashN);
  const dm = new THREE.Object3D();
  for (let i = 0; i < dashN; i++) {
    const a = i / dashN * Math.PI * 2;
    dm.position.set(Math.cos(a) * ROAD_R, 0.06, Math.sin(a) * ROAD_R); dm.rotation.set(0, -a, 0); dm.updateMatrix();
    dashes.setMatrixAt(i, dm.matrix);
  }
  scene.add(dashes);
  const plaza = M(new THREE.CircleGeometry(11, 40), mat(0xdfe2e6), 0, 0.04, 0, scene); plaza.rotation.x = -Math.PI / 2; plaza.castShadow = false;

  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2 + 0.12;
    const r = ROAD_R + (i % 2 ? 0.8 : -0.8);
    const coin = M(new THREE.CylinderGeometry(0.65, 0.65, 0.16, 18), mat(0xffc53d, { emissive:0x8c5c00, emissiveIntensity:.45, metalness:.35, roughness:.35 }), Math.cos(a)*r, 1.15, Math.sin(a)*r, scene, true);
    coin.rotation.z = Math.PI / 2; coin.userData.collected = false; COINS.push(coin);
    tick((t, dt) => {
      if (!coin.userData.collected) { coin.rotation.y = t * 3 + i; coin.position.y = 1.15 + Math.sin(t*3 + i)*0.18; return; }
      if (!coin.visible) return;
      // Collected: spin up and shrink away.
      const k = (coin.userData.pop += dt) / 0.35;
      if (k >= 1) { coin.visible = false; return; }
      coin.position.y = 1.15 + k * 2.6; coin.scale.setScalar(1 - k * 0.8); coin.rotation.y += dt * 24;
    });
  }
}

// A flat strip along angle a from radius r0 to r1: the spokes and driveways.
export function strip({ scene, M, mat }, a, r0, r1, w, color, y) {
  const len = r1 - r0, rc = (r0 + r1) / 2;
  const m = M(new THREE.BoxGeometry(w, 0.06, len), mat(color), Math.cos(a) * rc, y, Math.sin(a) * rc, scene);
  m.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)); m.castShadow = false;
}
