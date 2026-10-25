import { $, esc } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { toast } from '../core/effects.js';
import { nearestNode, route, roadGraph } from './plan.js';

/* The GPS: a waypoint (a landmark or any spot on the map), the route to it along the roads, a light beacon over
   it in the 3D city, and a chip under the radar with the distance. The radar and the big map draw gps.path. */
export const gps = { target: null, path: [], dist: 0 };
let beacon = null, acc = 0, lastFrom = -1;

// target: { x, z, label, color?, id? }, or null to clear.
export function setWaypoint(target) {
  gps.target = target; gps.path = []; lastFrom = -1; acc = 1;
  if (beacon) { beacon.visible = !!target; if (target) { beacon.position.set(target.x, 0, target.z); beacon.children.forEach(m => m.material.color.set(target.color || '#c07bff')); } }
  renderChip();
  if (target) sfx.tone(880, 0.06, 'sine', 0.04);
}

function renderChip() {
  const el = $('#gps'); if (!el) return;
  el.hidden = !gps.target;
  if (!gps.target) return;
  el.style.setProperty('--c', gps.target.color || '#c07bff');
  const d = gps.dist;
  el.innerHTML = `<i aria-hidden="true">📍</i><b>${esc(gps.target.label)}</b><span>${d >= 1000 ? (d / 1000).toFixed(1) + ' km' : Math.round(d / 5) * 5 + ' m'}</span><button type="button" aria-label="Clear waypoint" data-gps-clear>×</button>`;
}

export function buildGps(w) {
  const { scene } = w;
  roadGraph();
  beacon = new THREE.Group(); beacon.visible = false; scene.add(beacon);
  const col = new THREE.MeshBasicMaterial({ color: 0xc07bff, transparent: true, opacity: 0.28, depthWrite: false, fog: false });
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 120, 16, 1, true), col); pillar.position.y = 60; beacon.add(pillar);
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.2, 4, 32), new THREE.MeshBasicMaterial({ color: 0xc07bff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, fog: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.2; beacon.add(ring);
  w.tick(t => { if (beacon.visible) { ring.scale.setScalar(1 + (t % 1.2) * 0.4); ring.material.opacity = 0.7 * (1 - (t % 1.2) / 1.2); } });
  document.addEventListener('click', e => { if (e.target.closest('[data-gps-clear]')) setWaypoint(null); });
}

// Called every frame with the player's state: re-routes a few times a second and notices arrival.
export function updateGps(S, dt) {
  if (!gps.target) return;
  const straight = Math.hypot(gps.target.x - S.x, gps.target.z - S.z);
  if (straight < (gps.target.arrive || 12)) {
    toast(`Arrived: ${gps.target.label}`); sfx.play('coin');
    setWaypoint(null); return;
  }
  acc += dt;
  if (acc < 0.4) return;
  acc = 0;
  const { nodes } = roadGraph();
  const from = nearestNode(S.x, S.z), to = gps.target.node ?? (gps.target.node = nearestNode(gps.target.x, gps.target.z));
  if (from !== lastFrom) {
    lastFrom = from;
    const ids = route(from, to);
    gps.path = [[S.x, S.z], ...ids.map(i => [nodes[i].x, nodes[i].z]), [gps.target.x, gps.target.z]];
  } else if (gps.path.length) gps.path[0] = [S.x, S.z];
  let d = 0; for (let i = 1; i < gps.path.length; i++) d += Math.hypot(gps.path[i][0] - gps.path[i - 1][0], gps.path[i][1] - gps.path[i - 1][1]);
  gps.dist = d || straight;
  renderChip();
}
