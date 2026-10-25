import { $, TAU, clamp, isTouch } from '../core/util.js';
import { NET_COLORS, me, net } from '../net/net.js';
import { spots } from './plan.js';
import { drawCityMap, MAP, EXTENT, MAP_COLORS } from './mapimage.js';
import { gps } from './gps.js';

/* The radar, GTA style: centred on you, turning with your car so straight ahead is always up, and zooming out as
   you speed up. It shows the city, the GPS route, landmark blips, the next race gate, gems, other drivers, a north
   marker and your speed. blips() and drawBlip() are shared with the big map. */

// Every blip on the maps: the project landmarks, the drive-in, and Tehran's sights.
export function blips(w) {
  const out = w.LANDMARKS.map(l => ({ id: l.p.id, x: l.pos.x, z: l.pos.z, color: l.p.color, glyph: l.p.glyph || '🎬', name: l.p.home ? 'About Ali' : l.p.name, sub: l.p.home ? 'Home · who I am' : l.p.tagline || 'Short films at the drive-in', project: true }));
  const sight = (s, glyph, name, sub, color = '#ece4d0') => s && out.push({ id: 'poi:' + name, x: s.x, z: s.z, color, glyph, name, sub });
  sight(spots.milad, '🗼', 'Milad Tower', 'Gisha · the tallest tower in Iran', '#cfd3d8');
  sight(spots.azadi, '🏛️', 'Azadi Tower', 'The gate of Tehran, on Azadi Square');
  sight(spots.tabiat && { x: spots.tabiat.x, z: spots.tabiat.z }, '🌉', 'Tabiat Bridge', 'Two-level park bridge over the avenue', '#b08a5a');
  sight(spots.mosque, '🕌', 'Grand Bazaar', 'Domes, lanes and the turquoise mosque', '#2fb5b0');
  sight(spots.wheel, '🎡', 'Chitgar Lake', 'Lakeside promenade, pier and Ferris wheel', '#4f9ad8');
  sight(spots.tajrish, '⛲', 'Tajrish Square', 'The top of Valiasr Street', '#6fb35a');
  sight(spots.tower, '🏙️', 'Vanak Tower', 'The skyline at Vanak', '#6fa3d9');
  return out;
}

export function drawBlip(x, px, py, b, r, o = {}) {
  x.save();
  if (o.dim) x.globalAlpha = 0.85;
  x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.arc(px + 1, py + 2, r, 0, TAU); x.fill();
  x.fillStyle = b.color; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
  x.lineWidth = Math.max(2, r * 0.18); x.strokeStyle = o.sel ? '#ffc53d' : '#fff'; x.stroke();
  x.font = `${Math.round(r * 1.1)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(b.glyph, px, py + r * 0.06);
  x.restore();
}
export function drawArrow(x, px, py, ang, size, color) {
  x.save(); x.translate(px, py); x.rotate(ang);
  x.fillStyle = '#fff'; x.strokeStyle = color; x.lineWidth = size * 0.22; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(0, -size); x.lineTo(size * 0.72, size * 0.75); x.lineTo(0, size * 0.38); x.lineTo(-size * 0.72, size * 0.75); x.closePath();
  x.fill(); x.stroke(); x.restore();
}
export function drawWaypoint(x, px, py, r, color) {
  x.save(); x.fillStyle = color; x.strokeStyle = '#fff'; x.lineWidth = Math.max(2, r * 0.2);
  x.beginPath(); x.moveTo(px, py + r * 1.3); x.bezierCurveTo(px - r * 1.4, py - r * 0.2, px - r * 0.8, py - r * 1.5, px, py - r * 1.5);
  x.bezierCurveTo(px + r * 0.8, py - r * 1.5, px + r * 1.4, py - r * 0.2, px, py + r * 1.3); x.fill(); x.stroke();
  x.fillStyle = '#fff'; x.beginPath(); x.arc(px, py - r * 0.45, r * 0.38, 0, TAU); x.fill(); x.restore();
}

export function createMinimap(w) {
  const mm = $('#minimap'), x = mm.getContext('2d');
  const { peerCars, S } = w;
  drawCityMap(w, isTouch ? 1536 : 2048);
  const list = blips(w);
  let W = 0, H = 0, dpr = 1, round = false;
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const cw = mm.clientWidth || 132, ch = mm.clientHeight || 132;
    round = Math.abs(cw - ch) < 2;
    if (mm.width !== Math.round(cw * dpr) || mm.height !== Math.round(ch * dpr)) { mm.width = Math.round(cw * dpr); mm.height = Math.round(ch * dpr); }
    W = mm.width; H = mm.height;
  };
  size(); addEventListener('resize', size);
  let zoomR = 80;

  function drawMinimap() {
    if (!mm.clientWidth) return;
    if (Math.round(mm.clientWidth * dpr) !== W) size();
    const cx = W / 2, cy = round ? H / 2 : H * 0.6, R = Math.min(W, H) / 2;
    // World units from the centre to the edge: wider at speed.
    zoomR += ((70 + clamp(Math.abs(S.v) / 40, 0, 1) * 60) - zoomR) * 0.08;
    const s = (round ? R : H * 0.6) / zoomR;
    const rot = Math.PI + S.h, c = Math.cos(rot), sn = Math.sin(rot);
    const scr = (wx, wz) => { const dx = (wx - S.x) * s, dz = (wz - S.z) * s; return [cx + dx * c - dz * sn, cy + dx * sn + dz * c]; };
    const pad = 12 * dpr;
    // Pull a point onto the edge of the radar when it is outside.
    const edge = ([px, py]) => {
      if (round) { const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy), m = R - pad; return d > m ? [cx + dx / d * m, cy + dy / d * m, true] : [px, py, false]; }
      const qx = clamp(px, pad, W - pad), qy = clamp(py, pad, H - pad); return [qx, qy, qx !== px || qy !== py];
    };

    x.save();
    x.clearRect(0, 0, W, H);
    x.beginPath(); if (round) x.arc(cx, cy, R, 0, TAU); else x.roundRect ? x.roundRect(0, 0, W, H, 14 * dpr) : x.rect(0, 0, W, H);
    x.clip();
    x.fillStyle = MAP_COLORS.desert; x.fillRect(0, 0, W, H);
    x.save();
    x.translate(cx, cy); x.rotate(rot); x.scale(s / MAP.k, s / MAP.k); x.translate(-(S.x + EXTENT) * MAP.k, -(S.z + EXTENT) * MAP.k);
    x.drawImage(MAP.canvas, 0, 0);
    x.restore();

    // GPS route.
    if (gps.target && gps.path.length > 1) {
      x.strokeStyle = gps.target.color || '#c07bff'; x.lineWidth = 5 * dpr; x.lineCap = 'round'; x.lineJoin = 'round'; x.globalAlpha = 0.9;
      x.beginPath(); gps.path.forEach(([wx, wz], i) => { const [px, py] = scr(wx, wz); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke();
      x.globalAlpha = 1;
    }
    // Landmarks and sights in range.
    list.forEach(b => {
      const [px, py] = scr(b.x, b.z);
      if (px < -20 || py < -20 || px > W + 20 || py > H + 20 || (round && Math.hypot(px - cx, py - cy) > R)) return;
      drawBlip(x, px, py, b, (b.project ? 9 : 7.5) * dpr);
    });
    if (w.archGate >= 0) {
      const g = w.gates[w.archGate], [px, py, out] = edge(scr(g.x, g.z));
      x.strokeStyle = '#ffc53d'; x.lineWidth = 4 * dpr; x.beginPath(); x.arc(px, py, (out ? 6 : 9) * dpr, 0, TAU); x.stroke();
    }
    w.gems.forEach(g => {
      if (!g.visible) return;
      const [gx, gz] = scr(g.position.x, g.position.z), r = 6 * dpr;
      x.fillStyle = '#36c2ff'; x.strokeStyle = '#fff'; x.lineWidth = 2 * dpr;
      x.beginPath(); x.moveTo(gx, gz - r); x.lineTo(gx + r * 0.7, gz); x.lineTo(gx, gz + r); x.lineTo(gx - r * 0.7, gz); x.closePath(); x.fill(); x.stroke();
    });
    peerCars.forEach((pc, id) => {
      if (!pc.g.visible) return;
      const [px, py] = scr(pc.x, pc.z);
      x.fillStyle = NET_COLORS[net.peers.get(id)?.color || 0]; x.strokeStyle = '#0d1628'; x.lineWidth = 2.5 * dpr;
      x.beginPath(); x.arc(px, py, 6 * dpr, 0, TAU); x.fill(); x.stroke();
    });
    if (gps.target) { const [px, py] = edge(scr(gps.target.x, gps.target.z)); drawWaypoint(x, px, py, 7 * dpr, gps.target.color || '#c07bff'); }
    // You, always pointing up.
    drawArrow(x, cx, cy, 0, 10 * dpr, NET_COLORS[me.color]);
    // North marker on the rim.
    {
      const [nx, ny] = scr(S.x, S.z - 100000), dx = nx - cx, dy = ny - cy, d = Math.hypot(dx, dy) || 1;
      let px, py;
      if (round) { px = cx + dx / d * (R - 11 * dpr); py = cy + dy / d * (R - 11 * dpr); }
      else { const t = Math.min((W / 2 - 11 * dpr) / Math.abs(dx / d || 1e-6), (H / 2 - 11 * dpr) / Math.abs(dy / d || 1e-6)); px = W / 2 + dx / d * t; py = H / 2 + dy / d * t; }
      x.fillStyle = 'rgba(13,22,40,.85)'; x.beginPath(); x.arc(px, py, 9 * dpr, 0, TAU); x.fill();
      x.fillStyle = '#fff'; x.font = `700 ${11 * dpr}px "Atkinson Hyperlegible", system-ui, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('N', px, py + 0.5 * dpr);
    }
    // Speed, bottom left.
    if (!round) {
      const kmh = Math.round(Math.abs(S.v) * 3.6);
      x.fillStyle = 'rgba(13,22,40,.78)'; x.beginPath(); x.roundRect ? x.roundRect(8 * dpr, H - 30 * dpr, 78 * dpr, 22 * dpr, 6 * dpr) : x.rect(8 * dpr, H - 30 * dpr, 78 * dpr, 22 * dpr); x.fill();
      x.fillStyle = '#fff'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.font = `700 ${13 * dpr}px "JetBrains Mono", monospace`;
      x.fillText(`${kmh}`, 14 * dpr, H - 19 * dpr); x.fillStyle = '#9fb0c8'; x.font = `600 ${10 * dpr}px "JetBrains Mono", monospace`; x.fillText('km/h', 48 * dpr, H - 19 * dpr);
    }
    x.restore();
  }
  return drawMinimap;
}
