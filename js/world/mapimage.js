import { TAU } from '../core/util.js';
import { ISLAND, grassR, edgeR, alborz } from './layout.js';
import { roads, buildings, houses, domes, parks, patches, lakes, piers } from './plan.js';

/* The city drawn once, top-down, onto a canvas: the radar and the big map both crop and scale this picture.
   It covers ±EXTENT world units; mapPx(x, z) turns world units into pixels on it. North (-Z) is up. */
export const EXTENT = ISLAND + 60;
export const MAP = { canvas: null, size: 0, k: 1 };
export const mapPx = (x, z) => [(x + EXTENT) * MAP.k, (z + EXTENT) * MAP.k];

export const MAP_COLORS = { desert: '#d6c39a', verge: '#c8b083', land: '#9cb879', paved: '#a9adb3', bazaar: '#c8b48f', park: '#74b260', water: '#4f9ad8', road: '#f4f1ea', highway: '#ffd36b', building: '#6d7480', house: '#e8dcc8', mountain: '#a8957a' };

export function drawCityMap(w, size = 2048) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const x = cv.getContext('2d'), k = size / (EXTENT * 2);
  Object.assign(MAP, { canvas: cv, size, k });
  const P = (wx, wz) => [(wx + EXTENT) * k, (wz + EXTENT) * k];
  const poly = (fn, n = 360) => { x.beginPath(); for (let i = 0; i <= n; i++) { const a = i / n * TAU, r = fn(a), [px, py] = P(Math.cos(a) * r, Math.sin(a) * r); i ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); };
  x.fillStyle = MAP_COLORS.desert; x.fillRect(0, 0, size, size);
  // The mountains to the north, as shaded bands past the edge.
  for (let i = 0; i < 360; i += 2) {
    const a = i / 360 * TAU, m = alborz(a); if (m < 0.08) continue;
    const r0 = edgeR(a) + 10, [px, py] = P(Math.cos(a) * (r0 + 60), Math.sin(a) * (r0 + 60));
    const g = x.createRadialGradient(px, py, 0, px, py, 70 * k * (0.6 + m));
    g.addColorStop(0, 'rgba(120,104,84,.55)'); g.addColorStop(1, 'rgba(120,104,84,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px, py, 70 * k * (0.6 + m), 0, TAU); x.fill();
  }
  poly(edgeR); x.fillStyle = MAP_COLORS.verge; x.fill();
  poly(grassR); x.fillStyle = MAP_COLORS.land; x.fill();
  patches.forEach(p => {
    x.beginPath();
    const n = 48;
    for (let i = 0; i <= n; i++) { const a = p.a0 + (p.a1 - p.a0) * i / n, [px, py] = P(Math.cos(a) * p.r0, Math.sin(a) * p.r0); i ? x.lineTo(px, py) : x.moveTo(px, py); }
    for (let i = n; i >= 0; i--) { const a = p.a0 + (p.a1 - p.a0) * i / n, r = p.r1(a), [px, py] = P(Math.cos(a) * r, Math.sin(a) * r); x.lineTo(px, py); }
    x.closePath(); x.fillStyle = p.id === 'bazaar' ? MAP_COLORS.bazaar : MAP_COLORS.paved; x.fill();
  });
  x.fillStyle = MAP_COLORS.park;
  parks.forEach(p => { const [px, py] = P(p.x, p.z); x.beginPath(); p.round ? x.arc(px, py, p.w / 2 * k, 0, TAU) : x.rect(px - p.w / 2 * k, py - p.d / 2 * k, p.w * k, p.d * k); x.fill(); });
  lakes.forEach(l => {
    const [px, py] = P(l.x, l.z);
    x.save(); x.translate(px, py); x.rotate(l.rot);
    x.fillStyle = '#e4ddcc'; x.beginPath(); x.ellipse(0, 0, (l.rx + 2) * k, (l.rz + 2) * k, 0, 0, TAU); x.fill();
    x.fillStyle = MAP_COLORS.water; x.beginPath(); x.ellipse(0, 0, l.rx * k, l.rz * k, 0, 0, TAU); x.fill();
    x.restore();
  });
  // Trees as dots.
  x.fillStyle = 'rgba(47,110,60,.55)';
  (w.trees || []).forEach(t => { const [px, py] = P(t.x, t.z); x.beginPath(); x.arc(px, py, 1.4 * k * t.s, 0, TAU); x.fill(); });
  // Roads: a dark casing first, then the fill, widest kinds last so they sit on top.
  const order = ['pier', 'lane', 'spoke', 'street', 'avenue', 'connector', 'ring', 'highway'];
  const path = r => { x.beginPath(); r.pts.forEach(([wx, wz], i) => { const [px, py] = P(wx, wz); i ? x.lineTo(px, py) : x.moveTo(px, py); }); if (r.closed) x.closePath(); };
  x.lineCap = 'round'; x.lineJoin = 'round';
  order.forEach(kind => roads.filter(r => r.kind === kind).forEach(r => { path(r); x.strokeStyle = 'rgba(60,64,72,.55)'; x.lineWidth = (r.w + 1.6) * k; x.stroke(); }));
  order.forEach(kind => roads.filter(r => r.kind === kind).forEach(r => {
    path(r); x.strokeStyle = kind === 'highway' ? MAP_COLORS.highway : kind === 'pier' ? '#b08a5a' : MAP_COLORS.road; x.lineWidth = r.w * k; x.stroke();
  }));
  // Buildings and houses.
  const rect = (b, fill) => {
    const [px, py] = P(b.x, b.z); x.save(); x.translate(px, py); x.rotate(-(b.rot || 0));
    x.fillStyle = fill; x.fillRect(-b.w / 2 * k, -b.d / 2 * k, b.w * k, b.d * k); x.restore();
  };
  buildings.forEach(b => rect(b, b.style === 'bazaar' ? '#a8865a' : b.h > 40 ? '#4f5661' : MAP_COLORS.building));
  houses.forEach(h => rect(h, '#c98a6a'));
  domes.forEach(d => { const [px, py] = P(d.x, d.z); x.fillStyle = d.color === 0x2fb5b0 ? '#2fb5b0' : '#b8925c'; x.beginPath(); x.arc(px, py, d.r * k, 0, TAU); x.fill(); });
  piers.forEach(p => {
    const len = p.r1 - p.r0, mid = (p.r0 + p.r1) / 2, [px, py] = P(p.x + Math.cos(p.a) * mid, p.z + Math.sin(p.a) * mid);
    x.save(); x.translate(px, py); x.rotate(p.a); x.fillStyle = '#b08a5a'; x.fillRect(-len / 2 * k, -p.hw * k, len * k, p.hw * 2 * k); x.restore();
  });
  // Landmark pads.
  (w.LANDMARKS || []).forEach(l => { const [px, py] = P(l.pos.x, l.pos.z); x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.arc(px, py, (l.solidR + 1) * k, 0, TAU); x.fill(); });
  return cv;
}
