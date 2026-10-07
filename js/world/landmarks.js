import { hexNum } from '../core/util.js';
import { ALL, TOUR } from '../projects/index.js';
import { FILMS, CINEMA } from '../films.js';
import { ROAD_R, ROAD_W, LM_R, CIN_R, angleOf, CIN_GAP } from './layout.js';
import { makeSign } from './screens.js';
import { strip } from './terrain.js';

/* Puts every landmark on the island (home in the middle, projects on the spokes, the drive-in further out)
   and the billboards between the spokes. Fills w.LANDMARKS, w.lmById, w.BOARDS and w.colliders. */
export function buildLandmarks(w) {
  const { scene, M, mat, colliders, LANDMARKS } = w;
  const kit = { M, mat, tick: w.tick, rand: w.rand, makeScreen: w.makeScreen };

  function addLandmark(p, x, z, a) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    g.rotation.y = p.home ? 0 : Math.atan2(-Math.cos(a), -Math.sin(a));
    scene.add(g);
    const info = p.landmark(g, p.color, kit);
    const triggerR = info.solidR + 5.5;
    const ringM = M(new THREE.RingGeometry(triggerR - 0.5, triggerR, 72), new THREE.MeshBasicMaterial({ color: hexNum(p.color), transparent: true, opacity: 0.35 }), x, 0.08, z, scene, true);
    ringM.rotation.x = -Math.PI / 2;
    const sign = makeSign(p.name.toUpperCase(), p.color); sign.position.set(x, info.sign + 2, z); scene.add(sign);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(info.solidR + 1, info.solidR + 1, 14, 12), new THREE.MeshBasicMaterial());
    hit.position.set(x, 7, z); hit.visible = false; hit.userData.id = p.id; scene.add(hit);
    const front = p.home ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(-Math.cos(a), 0, -Math.sin(a));
    const hero = front.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.45);
    const lm = { p, pos: new THREE.Vector3(x, 0, z), front, hero, solidR: info.solidR, triggerR, ring: ringM, hit, sign, snap: info.snap || 26 };
    LANDMARKS.push(lm);
    colliders.push({ x, z, r: info.solidR });
    (info.extra || []).forEach(([lx, lz, r]) => {
      const v = new THREE.Vector3(lx, 0, lz).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y);
      colliders.push({ x: x + v.x, z: z + v.z, r });
    });
    return lm;
  }

  const [home, ...rest] = ALL;
  addLandmark(home, 0, 0, 0);
  rest.forEach((p, i) => {
    const a = angleOf(i);
    const lm = addLandmark(p, Math.cos(a) * LM_R, Math.sin(a) * LM_R, a);
    strip(w, a, ROAD_R + ROAD_W / 2, LM_R - lm.solidR + 0.5, 5, 0x3b404c, 0.03);
    strip(w, a, 11, ROAD_R - ROAD_W / 2, 4.2, 0x3b404c, 0.03);
  });
  {
    const a = angleOf(CIN_GAP), lm = addLandmark(CINEMA, Math.cos(a) * CIN_R, Math.sin(a) * CIN_R, a);
    strip(w, a, ROAD_R + ROAD_W / 2, CIN_R - lm.solidR + 0.5, 5, 0x3b404c, 0.03);
  }
  w.lmById = Object.fromEntries(LANDMARKS.map(l => [l.p.id, l]));

  // Billboards just outside the ring road, facing it, in the gaps between spokes (except the drive-in's).
  // Your logo, then the apps with a film poster after every second one.
  const media = [...FILMS.map(f => ({ kind: 'film', f, label: 'NOW ON YOUTUBE' })), { kind: 'films' }];
  const BOARD_SLIDES = [{ kind: 'me' }];
  TOUR.forEach((p, i) => { BOARD_SLIDES.push({ kind: 'app', p }); if (i % 2 && media.length) BOARD_SLIDES.push(media.shift()); });
  BOARD_SLIDES.push(...media);
  w.BOARDS = [];
  TOUR.map((_, i) => i + 0.5).filter(gap => gap !== CIN_GAP).forEach((gap, n) => {
    const a = angleOf(gap), r = ROAD_R + ROAD_W / 2 + 8, W = 11, H = W * 9 / 16, base = 2.8;
    const g = new THREE.Group(); g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    g.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)); scene.add(g);
    [-W / 2 + 1.2, W / 2 - 1.2].forEach(lx => {
      M(new THREE.BoxGeometry(0.45, base + H, 0.45), mat(0x5b6270), lx, (base + H) / 2, -0.45, g);
      const v = new THREE.Vector3(lx, 0, -0.45).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y);
      colliders.push({ x: g.position.x + v.x, z: g.position.z + v.z, r: 0.5 });
    });
    M(new THREE.BoxGeometry(W + 0.6, H + 0.6, 0.35), mat(0x23272f), 0, base + H / 2, -0.25, g);
    M(new THREE.PlaneGeometry(W, H), w.makeScreen(BOARD_SLIDES, n * 2, 7), 0, base + H / 2, -0.06, g, true);
    M(new THREE.BoxGeometry(W, 0.12, 0.9), mat(0x5b6270), 0, base - 0.15, 0.3, g);
    w.BOARDS.push({ x: g.position.x, z: g.position.z });
  });
}
