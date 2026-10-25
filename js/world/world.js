import { $, clamp, inkFor, isTouch, reduceMotion, buzz } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { app } from '../core/app.js';
import { gameStamp, gameCoin, updateGame } from '../progress.js';
import { raceLocked } from '../net/race.js';
import { battleLocked } from '../net/battle.js';
import { keys, input } from '../ui/input.js';
import { openLandmark, overlayOpen } from '../ui/shell.js';
import { TOUR } from '../projects/index.js';
import { angleOf, districtAt } from './layout.js';
import { inBounds, nearestNode, roadGraph } from './plan.js';
import { buildTerrain } from './terrain.js';
import { buildCity } from './city.js';
import { buildTraffic } from './traffic.js';
import { buildGps, updateGps } from './gps.js';
import { createScreens } from './screens.js';
import { buildLandmarks } from './landmarks.js';
import { buildScenery } from './scenery.js';
import { buildCars } from './cars.js';
import { buildTrack } from './track.js';
import { buildGems } from './gems.js';
import { createMinimap } from './minimap.js';
import { captureSnapshots } from './snapshots.js';

/* The 3D city. `world` is what the rest of the app talks to; until startWorld() succeeds (no WebGL,
   or Three.js failed to load) every method is a harmless no-op. */
export const world = {
  ok: false, near: null, track: null, w: null, focus() {}, teleport() {}, warp() {}, resetCoins() {}, honk() {},
  me: () => ({ x: 0, z: 0, h: 0, v: 0, steer: 0 }), peerHonk() {}, dropPeer() {}, peerDist: () => null, toGrid() {}, setGate() {}, gemSpot: () => ({ x: 0, z: 0 }), showGems() {}
};

export function startWorld() {
  if (!window.THREE) return false;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) return false;
  } catch (e) { return false; }

  const stage = $('#stage');
  // Phones and tablets get a lower pixel ratio and shadow map: the difference is hard to see, the battery saving isn't.
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isTouch ? 1.5 : 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', 'Island view');
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  // Tehran's warm afternoon haze.
  const FOG = 0xe6e4dc;
  scene.fog = new THREE.Fog(FOG, 220, 900);
  scene.background = new THREE.Color(FOG);
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.5, 1700);

  // Sky dome
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1300, 24, 12), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x6aaee8) }, bottom: { value: new THREE.Color(FOG) } },
    vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying float h; void main(){ gl_FragColor = vec4(mix(bottom, top, smoothstep(0.0, 0.55, h)), 1.0); }'
  }));
  scene.add(sky);

  scene.add(new THREE.HemisphereLight(0xd6e6f5, 0x7a7452, 0.62));
  // The sun's shadow box follows whatever the camera looks at, so shadows stay sharp in a big city.
  const sun = new THREE.DirectionalLight(0xfff0d6, 0.9), SUN = new THREE.Vector3(70, 130, 45);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isTouch ? 1024 : 2048, isTouch ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -100, right: 100, top: 100, bottom: -100, near: 10, far: 400 });
  sun.shadow.bias = -0.0006;
  scene.add(sun, sun.target);
  const aimSun = (x, z) => {
    // Snap to whole texels so the shadows don't shimmer while driving.
    const step = 200 / sun.shadow.mapSize.x * 4; x = Math.round(x / step) * step; z = Math.round(z / step) * step;
    sun.position.set(x + SUN.x, SUN.y, z + SUN.z); sun.target.position.set(x, 0, z); sun.target.updateMatrixWorld();
  };

  const matCache = {};
  const mat = (c, o) => {
    const key = c + JSON.stringify(o || {});
    return matCache[key] || (matCache[key] = new THREE.MeshStandardMaterial(Object.assign({ color: c, flatShading: true, roughness: 0.85, metalness: 0 }, o || {})));
  };
  function M(geo, material, x, y, z, parent, noShadow) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x || 0, y || 0, z || 0);
    if (!noShadow) { m.castShadow = true; m.receiveShadow = true; }
    if (parent) parent.add(m);
    return m;
  }
  const tickers = [];
  let seed = 7;
  const rand = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // Shared by the builders in this folder: they read what they need from it and add what they make.
  const w = { scene, renderer, camera, M, mat, rand, tick: f => tickers.push(f), colliders: [], LANDMARKS: [], COINS: [], blink: [], aimSun };
  world.w = w;
  buildTerrain(w);
  w.makeScreen = createScreens(w.tick);
  buildLandmarks(w);
  buildCity(w);
  buildScenery(w);
  buildCars(w, world);
  buildTrack(w, world);
  buildGems(w, world);
  buildTraffic(w);
  buildGps(w);
  const { colliders, LANDMARKS, lmById, COINS, S, car, wheels, wheelR, fronts, peerCars, puff } = w;
  const drawMinimap = createMinimap(w);
  let dustAcc = 0;

  const camPos = new THREE.Vector3(260, 140, 0), camLook = new THREE.Vector3(0, 4, 0);
  let focusId = null;

  function teleport(id) {
    const l = lmById[id]; if (!l) return;
    const d = l.p.home ? l.triggerR - 1.5 : l.triggerR - 2;
    S.x = l.pos.x + l.front.x * d; S.z = l.pos.z + l.front.z * d;
    S.h = Math.atan2(-l.front.x, -l.front.z); S.v = 0;
    car.position.set(S.x, 0, S.z); car.rotation.y = S.h;
  }
  world.teleport = teleport;
  // Drop the car on the road nearest to (x, z), facing it: "drive there" for spots that aren't landmarks.
  world.warp = (x, z) => {
    const { nodes } = roadGraph(), n = nodes[nearestNode(x, z)]; if (!n) return;
    S.x = n.x; S.z = n.z; S.h = Math.atan2(x - n.x, z - n.z); S.v = 0;
    car.position.set(S.x, 0, S.z); car.rotation.y = S.h;
  };
  world.focus = (id, tp) => { focusId = id; if (tp) teleport(id); };
  world.resetCoins = () => COINS.forEach(c => { c.userData.collected = false; c.visible = true; c.scale.setScalar(1); });
  let hop = 0;
  world.honk = () => { hop = 0.3; };

  /* --- picking --- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let downAt = null;
  renderer.domElement.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', e => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 8) return;
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(LANDMARKS.map(l => l.hit))[0];
    if (hit) openLandmark(hit.object.userData.id);
  });

  /* --- loop --- */
  // Spawn on a random spoke so drivers who arrive together don't stack on one spot.
  {
    const a = angleOf(Math.random() * TOUR.length | 0) + (Math.random() - 0.5) * 0.08, r = 17 + Math.random() * 3;
    S.x = Math.cos(a) * r; S.z = Math.sin(a) * r; S.h = Math.atan2(Math.cos(a), Math.sin(a));
    car.position.set(S.x, 0, S.z); car.rotation.y = S.h;
  }
  const clock = new THREE.Clock();
  let t = 0, frame = 0, snapped = false, lastBump = 0, areaAcc = 0, area = '';
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();

  function update(dt) {
    const driving = app.mode === 'drive' && !overlayOpen();
    let thr = 0, steer = 0, boost = false;
    if (driving) {
      thr = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0) - input.jy;
      steer = (keys.a || keys.arrowleft ? 1 : 0) - (keys.d || keys.arrowright ? 1 : 0) - input.jx;
      boost = keys.shift || input.boost;
      thr = clamp(thr, -1, 1); steer = clamp(steer, -1, 1);
    }
    // Held on the grid during the race countdown.
    if (raceLocked() || battleLocked()) { thr = 0; steer = 0; boost = false; S.v = 0; }
    const maxF = boost ? 42 : 26, maxR = 10;
    if (thr > 0.05) S.v += thr * (S.v < 0 ? 46 : (boost ? 40 : 27)) * dt;
    else if (thr < -0.05) S.v += thr * (S.v > 0 ? 42 : 16) * dt;
    else S.v *= Math.exp(-1.8 * dt);
    if (S.v > maxF) S.v += (maxF - S.v) * Math.min(1, dt * 3);
    S.v = clamp(S.v, -maxR, 48);
    S.steer += (steer - S.steer) * Math.min(1, dt * 10);
    S.h += S.steer * 1.9 * dt * clamp(S.v / 6, -1, 1);
    let nx = S.x + Math.sin(S.h) * S.v * dt, nz = S.z + Math.cos(S.h) * S.v * dt;
    for (const c of colliders) {
      const dx = nx - c.x, dz = nz - c.z;
      if (Math.abs(dx) > c.r + 2 || Math.abs(dz) > c.r + 2) continue;
      if (c.hx) {
        // A building: push out of the box along the shallower side, in the box's own frame.
        const cs = Math.cos(c.rot), sn = Math.sin(c.rot), lx = dx * cs - dz * sn, lz = dx * sn + dz * cs;
        const px = c.hx + 1.4 - Math.abs(lx), pz = c.hz + 1.4 - Math.abs(lz);
        if (px <= 0 || pz <= 0) continue;
        const ox = px < pz ? Math.sign(lx) * px : 0, oz = px < pz ? 0 : Math.sign(lz) * pz;
        nx += ox * cs + oz * sn; nz += -ox * sn + oz * cs;
        if (Math.abs(S.v) > 12 && t - lastBump > 0.4) { lastBump = t; sfx.tone(110, 0.14, 'square', 0.05); buzz(25); }
        S.v *= 0.8; continue;
      }
      const d = Math.hypot(dx, dz), min = c.r + 1.5;
      if (d < min && d > 0.0001) { nx = c.x + dx / d * min; nz = c.z + dz / d * min; S.v *= 0.86; }
    }
    // Other drivers' cars and the traffic.
    const bump = (ox, oz, onHit) => {
      const dx = nx - ox, dz = nz - oz, d = Math.hypot(dx, dz), min = 3.4;
      if (d >= min || d < 0.0001) return;
      nx = ox + dx / d * min; nz = oz + dz / d * min;
      if (Math.abs(S.v) > 6 && t - lastBump > 0.4) { lastBump = t; sfx.tone(130, 0.12, 'square', 0.05); buzz(15); onHit?.(); }
      S.v *= 0.9;
    };
    for (const pc of peerCars.values()) if (pc.g.visible) bump(pc.x, pc.z);
    for (const tc of w.traffic) if (tc.mesh.visible) bump(tc.x, tc.z, () => { tc.stun = 2; });
    // City limits and the lake: slide along the edge instead of stopping dead.
    if (!inBounds(nx, nz)) {
      if (inBounds(nx, S.z)) nz = S.z; else if (inBounds(S.x, nz)) nx = S.x; else { nx = S.x; nz = S.z; }
      S.v *= 0.7;
    }
    S.x = nx; S.z = nz;
    car.position.set(S.x, Math.abs(S.v) > 1 ? Math.sin(t * 22) * 0.03 : 0, S.z);
    car.rotation.y = S.h;
    car.rotation.z = -S.steer * clamp(S.v / 30, -1, 1) * 0.08;
    wheels.forEach(w => { w.rotation.x += S.v * dt / wheelR; });
    fronts.forEach(f => { f.rotation.y = S.steer * 0.45; });
    if (hop > 0) { hop = Math.max(0, hop - dt); car.position.y += Math.sin(hop / 0.3 * Math.PI) * 0.45; }
    if (!reduceMotion && driving && (Math.abs(S.v) > 26 || (Math.abs(S.v) > 12 && Math.abs(S.steer) > 0.7))) {
      for (dustAcc += dt; dustAcc > 0.035; dustAcc -= 0.035) puff();
    } else dustAcc = 0;

    // proximity
    let near = null, nd = Infinity;
    LANDMARKS.forEach(l => {
      const d = Math.hypot(l.pos.x - S.x, l.pos.z - S.z);
      const inside = d < l.triggerR + 1.5;
      l.ring.material.opacity = inside ? 0.6 + 0.3 * Math.sin(t * 6) : 0.3;
      if (inside && d < nd) { nd = d; near = l.p.id; }
    });
    if (near !== world.near) {
      world.near = near;
      const pr = $('#prompt');
      if (near) { const p = lmById[near].p; pr.style.setProperty('--pc', p.color); pr.style.setProperty('--pc-ink', inkFor(p.color)); $('#prompt-name').textContent = p.home ? 'About Ali' : p.name; }
    }
    $('#prompt').hidden = !(driving && world.near);
    if (driving && near) gameStamp(near);
    if (driving) {
      w.touchGems(S.x, S.z);
      COINS.forEach(c => {
        if (!c.userData.collected && Math.hypot(c.position.x - S.x, c.position.z - S.z) < 2.2) {
          c.userData.collected = true; c.userData.pop = 0; gameCoin();
        }
      });
    }
    updateGame(dt, driving);
    updateGps(S, dt);
    // GTA-style district name, bottom right, whenever you drive into a new one.
    if ((areaAcc += dt) > 0.5) {
      areaAcc = 0;
      const name = districtAt(S.x, S.z);
      if (name !== area) {
        const first = !area; area = name;
        const el = $('#area');
        if (el && !first && driving) { el.textContent = name; el.hidden = false; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
      }
    }

    // camera
    const k = 1 - Math.exp(-(app.mode === 'drive' ? 4 : 2.2) * dt);
    if (app.mode === 'intro') {
      const a = (reduceMotion ? 0.6 : t * 0.04) + 0.6;
      tmp.set(Math.cos(a) * 250, 120, Math.sin(a) * 250); tmp2.set(0, 10, 0);
    } else if (app.mode === 'dossier' && focusId && lmById[focusId]) {
      const l = lmById[focusId];
      const sway = reduceMotion ? 0 : Math.sin(t * 0.25) * 0.25;
      const dir = l.hero.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), sway);
      const dist = (l.p.home ? 22 : l.snap + 2);
      tmp.copy(l.pos).addScaledVector(dir, dist); tmp.y = l.p.home ? 10 : 13;
      tmp2.set(l.pos.x, 4, l.pos.z);
      if (innerWidth > 900) {
        const right = new THREE.Vector3().subVectors(tmp2, tmp).cross(new THREE.Vector3(0, 1, 0)).normalize();
        tmp2.addScaledVector(right, dist * 0.32);
      }
    } else {
      const back = 13.5 + Math.max(0, S.v) * 0.12;
      tmp.set(S.x - Math.sin(S.h) * back, 6.8 + Math.max(0, S.v) * 0.03, S.z - Math.cos(S.h) * back);
      tmp2.set(S.x + Math.sin(S.h) * 5, 1.6, S.z + Math.cos(S.h) * 5);
    }
    camPos.lerp(tmp, k); camLook.lerp(tmp2, k);
    camera.position.copy(camPos); camera.lookAt(camLook);
    aimSun(camLook.x, camLook.z);
    // Widen the view a little at speed.
    const fov = 55 + (!reduceMotion && app.mode === 'drive' ? clamp((S.v - 20) / 14, 0, 1) * 8 : 0);
    if (Math.abs(fov - camera.fov) > 0.01) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix(); }
  }

  // Skip rendering while something opaque covers the island (a phone-width dossier or a modal), after a couple
  // of frames so the backdrop blur has a picture to blur.
  const dossierEl = $('#dossier'), pgEl = $('#project-game'), arcEl = $('#arcade'), mapEl = $('#bigmap');
  let coveredFrames = 0;
  const covered = () => !pgEl.hidden || !arcEl.hidden || !mapEl.hidden || (!dossierEl.hidden && innerWidth <= 620);

  function loop() {
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt; frame++;
    if (!document.hidden) {
      coveredFrames = covered() ? coveredFrames + 1 : 0;
      if (coveredFrames < 3) {
        update(dt);
        tickers.forEach(f => f(t, dt));
        renderer.render(scene, camera);
        if (frame % 3 === 0) drawMinimap();
      }
      if (!snapped && frame >= 40) { snapped = true; try { captureSnapshots(w); } catch (e) { console.warn('snapshot failed', e); } }
    }
    requestAnimationFrame(loop);
  }
  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  });
  camera.position.copy(camPos); camera.lookAt(camLook);
  loop();
  return true;
}
