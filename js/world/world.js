import { $, clamp, inkFor, isTouch, reduceMotion, buzz } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { app } from '../core/app.js';
import { gameStamp, gameCoin, updateGame } from '../progress.js';
import { raceLocked } from '../net/race.js';
import { battleLocked } from '../net/battle.js';
import { keys, input } from '../ui/input.js';
import { openLandmark, overlayOpen } from '../ui/shell.js';
import { TOUR } from '../projects/index.js';
import { LIMIT, angleOf } from './layout.js';
import { buildTerrain } from './terrain.js';
import { createScreens } from './screens.js';
import { buildLandmarks } from './landmarks.js';
import { buildScenery } from './scenery.js';
import { buildCars } from './cars.js';
import { buildTrack } from './track.js';
import { buildGems } from './gems.js';
import { createMinimap } from './minimap.js';
import { captureSnapshots } from './snapshots.js';

/* The 3D island. `world` is what the rest of the app talks to; until startWorld() succeeds (no WebGL,
   or Three.js failed to load) every method is a harmless no-op. */
export const world = {
  ok: false, near: null, track: null, focus() {}, teleport() {}, resetCoins() {}, honk() {},
  me: () => ({ x: 0, z: 0, h: 0, v: 0, steer: 0 }), paintMe() {}, peerHonk() {}, dropPeer() {}, peerDist: () => null, toGrid() {}, setGate() {}, gemSpot: () => ({ x: 0, z: 0 }), showGems() {}
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
  const FOG = 0xcfeeff;
  scene.fog = new THREE.Fog(FOG, 140, 360);
  scene.background = new THREE.Color(FOG);
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.5, 900);

  // Sky dome
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 24, 12), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x5fb4ff) }, bottom: { value: new THREE.Color(FOG) } },
    vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying float h; void main(){ gl_FragColor = vec4(mix(bottom, top, smoothstep(0.0, 0.55, h)), 1.0); }'
  }));
  scene.add(sky);

  scene.add(new THREE.HemisphereLight(0xcfeaff, 0x6d8f52, 0.78));
  const sun = new THREE.DirectionalLight(0xfff3dc, 0.92);
  sun.position.set(70, 110, 45);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isTouch ? 1024 : 2048, isTouch ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 10, far: 320 });
  sun.shadow.bias = -0.0006;
  scene.add(sun);

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
  const w = { scene, renderer, camera, M, mat, rand, tick: f => tickers.push(f), colliders: [], LANDMARKS: [], COINS: [] };
  buildTerrain(w);
  w.makeScreen = createScreens(w.tick);
  buildLandmarks(w);
  buildScenery(w);
  buildCars(w, world);
  buildTrack(w, world);
  buildGems(w, world);
  const { colliders, LANDMARKS, lmById, COINS, S, car, wheels, fronts, peerCars, puff } = w;
  const drawMinimap = createMinimap(w);
  let dustAcc = 0;

  const camPos = new THREE.Vector3(110, 60, 0), camLook = new THREE.Vector3(0, 4, 0);
  let focusId = null;

  function teleport(id) {
    const l = lmById[id]; if (!l) return;
    const d = l.p.home ? l.triggerR - 1.5 : l.triggerR - 2;
    S.x = l.pos.x + l.front.x * d; S.z = l.pos.z + l.front.z * d;
    S.h = Math.atan2(-l.front.x, -l.front.z); S.v = 0;
    car.position.set(S.x, 0, S.z); car.rotation.y = S.h;
  }
  world.teleport = teleport;
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
    const a = angleOf(Math.random() * TOUR.length | 0) + (Math.random() - 0.5) * 0.12, r = 15 + Math.random() * 3;
    S.x = Math.cos(a) * r; S.z = Math.sin(a) * r; S.h = Math.atan2(Math.cos(a), Math.sin(a));
    car.position.set(S.x, 0, S.z); car.rotation.y = S.h;
  }
  const clock = new THREE.Clock();
  let t = 0, frame = 0, snapped = false, lastBump = 0;
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
    const maxF = boost ? 34 : 21, maxR = 9;
    if (thr > 0.05) S.v += thr * (S.v < 0 ? 42 : (boost ? 34 : 24)) * dt;
    else if (thr < -0.05) S.v += thr * (S.v > 0 ? 42 : 16) * dt;
    else S.v *= Math.exp(-1.8 * dt);
    if (S.v > maxF) S.v += (maxF - S.v) * Math.min(1, dt * 3);
    S.v = clamp(S.v, -maxR, 40);
    S.steer += (steer - S.steer) * Math.min(1, dt * 10);
    S.h += S.steer * 1.9 * dt * clamp(S.v / 6, -1, 1);
    let nx = S.x + Math.sin(S.h) * S.v * dt, nz = S.z + Math.cos(S.h) * S.v * dt;
    for (const c of colliders) {
      const dx = nx - c.x, dz = nz - c.z, d = Math.hypot(dx, dz), min = c.r + 1.5;
      if (d < min && d > 0.0001) { nx = c.x + dx / d * min; nz = c.z + dz / d * min; S.v *= 0.86; }
    }
    for (const pc of peerCars.values()) {
      if (!pc.g.visible) continue;
      const dx = nx - pc.x, dz = nz - pc.z, d = Math.hypot(dx, dz), min = 3.4;
      if (d < min && d > 0.0001) {
        nx = pc.x + dx / d * min; nz = pc.z + dz / d * min;
        if (Math.abs(S.v) > 6 && t - lastBump > 0.4) { lastBump = t; sfx.tone(130, 0.12, 'square', 0.05); buzz(15); }
        S.v *= 0.9;
      }
    }
    const r = Math.hypot(nx, nz);
    if (r > LIMIT) { nx *= LIMIT / r; nz *= LIMIT / r; S.v *= 0.7; }
    S.x = nx; S.z = nz;
    car.position.set(S.x, Math.abs(S.v) > 1 ? Math.sin(t * 22) * 0.03 : 0, S.z);
    car.rotation.y = S.h;
    car.rotation.z = -S.steer * clamp(S.v / 30, -1, 1) * 0.08;
    wheels.forEach(w => { w.rotation.x += S.v * dt / 0.55; });
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

    // camera
    const k = 1 - Math.exp(-(app.mode === 'drive' ? 4 : 2.2) * dt);
    if (app.mode === 'intro') {
      const a = (reduceMotion ? 0.6 : t * 0.05) + 0.6;
      tmp.set(Math.cos(a) * 128, 68, Math.sin(a) * 128); tmp2.set(0, 2, 0);
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
      const back = 13 + Math.max(0, S.v) * 0.12;
      tmp.set(S.x - Math.sin(S.h) * back, 6.5 + Math.max(0, S.v) * 0.03, S.z - Math.cos(S.h) * back);
      tmp2.set(S.x + Math.sin(S.h) * 5, 1.6, S.z + Math.cos(S.h) * 5);
    }
    camPos.lerp(tmp, k); camLook.lerp(tmp2, k);
    camera.position.copy(camPos); camera.lookAt(camLook);
    // Widen the view a little at speed.
    const fov = 55 + (!reduceMotion && app.mode === 'drive' ? clamp((S.v - 20) / 14, 0, 1) * 8 : 0);
    if (Math.abs(fov - camera.fov) > 0.01) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix(); }
  }

  // Skip rendering while something opaque covers the island (a phone-width dossier or a modal), after a couple
  // of frames so the backdrop blur has a picture to blur.
  const dossierEl = $('#dossier'), pgEl = $('#project-game'), arcEl = $('#arcade');
  let coveredFrames = 0;
  const covered = () => !pgEl.hidden || !arcEl.hidden || (!dossierEl.hidden && innerWidth <= 620);

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
