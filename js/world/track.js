import { TAU } from '../core/util.js';
import { TOUR } from '../projects/index.js';
import { ROAD_R, ROAD_W } from './layout.js';

/* The race track: a start gantry on the ring road and a checkpoint arch that moves gate to gate.
   Sets world.track, world.setGate and world.toGrid; the minimap reads w.gates and w.archGate. */
export function buildTrack(w, world) {
  const { scene, M, mat, tick, colliders, S, car } = w;
  const START_A = Math.PI / 2 + Math.PI / TOUR.length; // halfway between two spokes
  const GATES = 8, gates = [];
  for (let i = 0; i < GATES; i++) { const a = START_A + i * TAU / GATES; gates.push({ a, x: Math.cos(a) * ROAD_R, z: Math.sin(a) * ROAD_R }); }
  world.track = { gates, seg: ROAD_R * TAU / GATES, gateR: ROAD_W / 2 + 4 };
  {
    const cv = document.createElement('canvas'); cv.width = 200; cv.height = 40;
    const x = cv.getContext('2d');
    for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#1d2027' : '#f2f5fa'; x.fillRect(i * 20, j * 20, 20, 20); }
    const tex = new THREE.CanvasTexture(cv); tex.magFilter = THREE.NearestFilter;
    const chk = new THREE.MeshStandardMaterial({ map: tex, flatShading: true, roughness: 0.8 });
    const g = new THREE.Group(); g.position.set(gates[0].x, 0, gates[0].z); g.rotation.y = -START_A; scene.add(g);
    M(new THREE.BoxGeometry(ROAD_W, 0.05, 1.4), chk, 0, 0.07, 0, g).castShadow = false;
    const PX = ROAD_W / 2 + 1.7;
    [-PX, PX].forEach(px => {
      M(new THREE.CylinderGeometry(0.3, 0.35, 6.4, 10), mat(0xe8edf5), px, 3.2, 0, g);
      const v = new THREE.Vector3(px, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y);
      colliders.push({ x: g.position.x + v.x, z: g.position.z + v.z, r: 0.4 });
    });
    M(new THREE.BoxGeometry(PX * 2 + 0.6, 1.1, 0.3), chk, 0, 6.2, 0, g);
  }
  const arch = new THREE.Group(); arch.visible = false; scene.add(arch);
  {
    const glow = new THREE.MeshBasicMaterial({ color: 0xffc53d, transparent: true, opacity: 0.85, fog: false });
    const AX = ROAD_W / 2 + 0.9;
    [-AX, AX].forEach(px => M(new THREE.BoxGeometry(0.45, 5, 0.45), glow, px, 2.5, 0, arch, true));
    M(new THREE.BoxGeometry(AX * 2 + 0.45, 0.45, 0.45), glow, 0, 5, 0, arch, true);
    M(new THREE.BoxGeometry(AX * 2, 0.04, 0.8), new THREE.MeshBasicMaterial({ color: 0xffc53d, transparent: true, opacity: 0.35 }), 0, 0.09, 0, arch, true);
  }
  w.gates = gates; w.archGate = -1;
  world.setGate = i => {
    w.archGate = i; arch.visible = i >= 0;
    if (i >= 0) { arch.position.set(gates[i].x, 0, gates[i].z); arch.rotation.y = -gates[i].a; }
  };
  tick(t => { if (arch.visible) arch.scale.y = 1 + Math.sin(t * 6) * 0.06; });
  // Two lanes, rows 6 m apart, behind the start line and facing the racing direction.
  world.toGrid = slot => {
    const row = Math.floor(slot / 2) + 1, a = START_A - row * 6 / ROAD_R, r = ROAD_R + (slot % 2 ? 2 : -2);
    S.x = Math.cos(a) * r; S.z = Math.sin(a) * r; S.h = -a; S.v = 0; S.steer = 0;
    car.position.set(S.x, 0, S.z); car.rotation.y = S.h;
  };
}
