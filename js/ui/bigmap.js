import { $, esc, clamp, inkFor } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { app, setMode } from '../core/app.js';
import { world } from '../world/world.js';
import { DISTRICTS, midAngle, OUTER_R, ROAD_R } from '../world/layout.js';
import { inBounds } from '../world/plan.js';
import { MAP, EXTENT } from '../world/mapimage.js';
import { blips, drawBlip, drawArrow, drawWaypoint } from '../world/minimap.js';
import { gps, setWaypoint } from '../world/gps.js';
import { NET_COLORS, me, net } from '../net/net.js';
import { openLandmark } from './shell.js';

/* The big map (M), like a GTA pause map: the whole city north-up, with every landmark and sight. Drag to move,
   scroll or pinch to zoom; click a blip for its card (waypoint, dossier, drive there) or anywhere else to drop a
   waypoint. The legend lists every place. */
const el = $('#bigmap'), cv = $('#map-cv'), x = cv.getContext('2d'), card = $('#map-card');
let list = [], view = { x: 0, z: 0, s: 1 }, sel = null, raf = 0, dpr = 1, ret = null;
const W = () => cv.clientWidth, H = () => cv.clientHeight;
const toScr = (wx, wz) => [(wx - view.x) * view.s + W() / 2, (wz - view.z) * view.s + H() / 2];
const toWorld = (px, py) => [(px - W() / 2) / view.s + view.x, (py - H() / 2) / view.s + view.z];
const minS = () => Math.min(W(), H()) / (EXTENT * 2.1), maxS = () => 9;
function zoomAt(f, px = W() / 2, py = H() / 2) {
  const [wx, wz] = toWorld(px, py);
  view.s = clamp(view.s * f, minS(), maxS());
  view.x = wx - (px - W() / 2) / view.s; view.z = wz - (py - H() / 2) / view.s;
  clampView();
}
const clampView = () => { view.x = clamp(view.x, -EXTENT, EXTENT); view.z = clamp(view.z, -EXTENT, EXTENT); };

function draw() {
  const w = world.w; if (!w || !MAP.canvas) return;
  dpr = Math.min(devicePixelRatio || 1, 2);
  if (cv.width !== Math.round(W() * dpr) || cv.height !== Math.round(H() * dpr)) { cv.width = Math.round(W() * dpr); cv.height = Math.round(H() * dpr); }
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.fillStyle = '#d6c39a'; x.fillRect(0, 0, W(), H());
  x.save();
  const [ox, oy] = toScr(-EXTENT, -EXTENT);
  x.imageSmoothingQuality = 'high';
  x.drawImage(MAP.canvas, ox, oy, EXTENT * 2 * view.s, EXTENT * 2 * view.s);
  x.restore();
  // District names, GTA style.
  x.textAlign = 'center'; x.textBaseline = 'middle';
  const label = (text, wx, wz, size) => {
    const [px, py] = toScr(wx, wz);
    x.font = `${size}px Bungee, "Arial Black", sans-serif`; x.lineWidth = 4; x.strokeStyle = 'rgba(255,255,255,.75)'; x.strokeText(text, px, py);
    x.fillStyle = 'rgba(29,34,48,.85)'; x.fillText(text, px, py);
  };
  const ls = clamp(view.s * 7, 11, 22);
  // Between the highway and the sights, nudged so they never sit on a blip.
  DISTRICTS.forEach(d => { const a = midAngle(d) + (d.id === 'milad' ? 0.12 : d.id === 'chitgar' ? -0.1 : 0), r = OUTER_R + 96; label(d.name.toUpperCase(), Math.cos(a) * r, Math.sin(a) * r, ls); });
  label('PROJECT RING', 0, -ROAD_R - 14, ls * 0.8);
  if (view.s > 1.6) label('VALIASR ST', 18, -OUTER_R - 30, ls * 0.6);
  // GPS route.
  if (gps.target && gps.path.length > 1) {
    x.strokeStyle = gps.target.color || '#c07bff'; x.lineWidth = clamp(view.s * 3, 3, 8); x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); gps.path.forEach(([wx, wz], i) => { const [px, py] = toScr(wx, wz); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke();
  }
  // Blips, with names once zoomed in enough.
  const r = clamp(view.s * 5, 9, 16);
  list.forEach(b => {
    const [px, py] = toScr(b.x, b.z);
    drawBlip(x, px, py, b, b.project ? r : r * 0.85, { sel: b === sel });
    if (view.s > 1.1 || b === sel) {
      x.font = `700 ${clamp(view.s * 4, 11, 14)}px "Atkinson Hyperlegible", system-ui, sans-serif`;
      x.lineWidth = 3; x.strokeStyle = 'rgba(13,22,40,.9)'; x.strokeText(b.name, px, py + r + 10); x.fillStyle = '#fff'; x.fillText(b.name, px, py + r + 10);
    }
  });
  w.gems.forEach(g => { if (!g.visible) return; const [gx, gy] = toScr(g.position.x, g.position.z); x.fillStyle = '#36c2ff'; x.beginPath(); x.moveTo(gx, gy - 7); x.lineTo(gx + 5, gy); x.lineTo(gx, gy + 7); x.lineTo(gx - 5, gy); x.fill(); });
  w.peerCars.forEach((pc, id) => {
    if (!pc.g.visible) return;
    const p = net.peers.get(id), [px, py] = toScr(pc.x, pc.z);
    drawArrow(x, px, py, Math.PI - pc.h, 8, NET_COLORS[p?.color || 0]);
    if (p?.name) { x.font = '700 11px "Atkinson Hyperlegible", sans-serif'; x.fillStyle = '#0d1628'; x.fillText(p.name, px, py - 14); }
  });
  if (gps.target) { const [px, py] = toScr(gps.target.x, gps.target.z); drawWaypoint(x, px, py, 9, gps.target.color || '#c07bff'); }
  const S = world.me(), [mx, my] = toScr(S.x, S.z);
  drawArrow(x, mx, my, Math.PI - S.h, 11, NET_COLORS[me.color]);
  $('#map-clear').hidden = !gps.target;
}
function loop() { draw(); raf = requestAnimationFrame(loop); }

function showCard(b) {
  sel = b;
  if (!b) { card.hidden = true; return; }
  card.style.setProperty('--c', b.color); card.style.setProperty('--ci', inkFor(b.color));
  card.innerHTML = `<div class="mc-top"><span class="mc-ico">${b.glyph}</span><div><b>${esc(b.name)}</b><small>${esc(b.sub || '')}</small></div><button class="x" type="button" data-mc="close" aria-label="Close">×</button></div>
    <div class="row"><button class="btn" type="button" data-mc="gps">📍 Set waypoint</button>
    ${b.project ? `<button class="btn ghost" type="button" data-mc="open">${b.id === 'cinema' ? 'Watch films' : 'Open dossier'}</button>` : ''}
    <button class="btn ghost" type="button" data-mc="drive">Drive there</button></div>`;
  card.hidden = false;
  card.querySelector('[data-mc="gps"]').focus({ preventScroll: true });
}
const waypointFor = b => ({ x: b.x, z: b.z, label: b.name, color: b.color, arrive: b.project ? 16 : 22 });

function pick(px, py) {
  let best = null, bd = 22;
  list.forEach(b => { const [bx, by] = toScr(b.x, b.z), d = Math.hypot(bx - px, by - py); if (d < bd) { bd = d; best = b; } });
  if (best) { showCard(best); sfx.play('tick'); return; }
  const [wx, wz] = toWorld(px, py);
  showCard(null);
  if (inBounds(wx, wz)) setWaypoint({ x: wx, z: wz, label: 'Waypoint' });
}

export const bigmap = {
  el,
  get isOpen() { return !el.hidden; },
  open(focusId) {
    if (!world.ok) return;
    if (!world.w || !MAP.canvas) return;
    ret = document.activeElement;
    list = blips(world.w);
    renderLegend();
    el.hidden = false;
    const S = world.me();
    view = { x: S.x, z: S.z, s: Math.max(minS() * 2.2, 1.1) };
    if (focusId) { const b = list.find(q => q.id === focusId); if (b) { view.x = b.x; view.z = b.z; showCard(b); } } else showCard(null);
    clampView();
    cancelAnimationFrame(raf); loop();
    if (!focusId) $('#map-x').focus({ preventScroll: true });
  },
  close() {
    if (el.hidden) return;
    el.hidden = true; cancelAnimationFrame(raf); showCard(null);
    if (ret?.isConnected && ret !== document.body) ret.focus({ preventScroll: true });
    else $('#stage canvas')?.focus({ preventScroll: true });
  },
  toggle() { this.isOpen ? this.close() : this.open(); }
};

function renderLegend() {
  const item = b => `<li><button type="button" data-blip="${esc(b.id)}" style="--c:${b.color}"><i>${b.glyph}</i><span><b>${esc(b.name)}</b><small>${esc(b.sub || '')}</small></span></button></li>`;
  $('#map-legend').innerHTML = `<h3>Projects</h3><ul>${list.filter(b => b.project).map(item).join('')}</ul><h3>Tehran</h3><ul>${list.filter(b => !b.project).map(item).join('')}</ul>`;
}

export function initBigmap() {
  $('#map-x').onclick = () => bigmap.close();
  $('#map-zin').onclick = () => zoomAt(1.5);
  $('#map-zout').onclick = () => zoomAt(1 / 1.5);
  $('#map-me').onclick = () => { const S = world.me(); view.x = S.x; view.z = S.z; };
  $('#map-clear').onclick = () => setWaypoint(null);
  $('#map-legend').addEventListener('click', e => {
    const t = e.target.closest('[data-blip]'); if (!t) return;
    const b = list.find(q => q.id === t.dataset.blip); if (!b) return;
    view.x = b.x; view.z = b.z; view.s = Math.max(view.s, 1.6); showCard(b);
  });
  card.addEventListener('click', e => {
    const a = e.target.closest('[data-mc]')?.dataset.mc; if (!a || !sel) return;
    const b = sel;
    if (a === 'close') showCard(null);
    else if (a === 'gps') { setWaypoint(waypointFor(b)); showCard(null); }
    else if (a === 'open') { bigmap.close(); openLandmark(b.id, { teleport: false }); }
    else if (a === 'drive') {
      bigmap.close();
      if (b.project) world.teleport(b.id); else world.warp(b.x, b.z);
      $('#intro').hidden = true; if (app.mode !== 'drive') setMode('drive');
    }
  });
  // Drag to pan, wheel or pinch to zoom, tap to pick.
  const pts = new Map(); let moved = 0, pinch = 0;
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  cv.addEventListener('pointermove', e => {
    const p = pts.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p[0], dy = e.clientY - p[1];
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) { view.x -= dx / view.s; view.z -= dy / view.s; clampView(); moved += Math.abs(dx) + Math.abs(dy); }
    else if (pts.size === 2) {
      const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), r = cv.getBoundingClientRect();
      if (pinch) zoomAt(d / pinch, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top);
      pinch = d; moved = 99;
    }
  });
  const up = e => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId); pinch = 0;
    if (e.type === 'pointerup' && moved < 6 && !pts.size) { const r = cv.getBoundingClientRect(); pick(e.clientX - r.left, e.clientY - r.top); }
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  el.addEventListener('keydown', e => {
    if (e.target.closest('button') && (e.key === 'Enter' || e.key === ' ')) return;
    const step = 60 / view.s, k = e.key;
    if (k === 'ArrowLeft') view.x -= step; else if (k === 'ArrowRight') view.x += step;
    else if (k === 'ArrowUp') view.z -= step; else if (k === 'ArrowDown') view.z += step;
    else if (k === '+' || k === '=') zoomAt(1.4); else if (k === '-' || k === '_') zoomAt(1 / 1.4);
    else return;
    e.preventDefault(); clampView();
  });
}
