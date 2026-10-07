import { $ } from '../core/util.js';
import { NET_COLORS, me, net } from '../net/net.js';
import { ISLAND, ROAD_R, ROAD_W } from './layout.js';

/* The round map in the corner: island, road, landmarks, the next race gate, other drivers and you. */
export function createMinimap(w) {
  const mm = $('#minimap'), mx = mm.getContext('2d');
  const { LANDMARKS, peerCars, S } = w;
  function drawMinimap() {
    const W = mm.width, c = W / 2, k = (W / 2 - 6) / (ISLAND + 8);
    mx.clearRect(0, 0, W, W);
    mx.fillStyle = '#2a86d6'; mx.beginPath(); mx.arc(c, c, W / 2, 0, 7); mx.fill();
    mx.fillStyle = '#86c46d'; mx.beginPath(); mx.arc(c, c, ISLAND * k, 0, 7); mx.fill();
    mx.strokeStyle = '#3b404c'; mx.lineWidth = ROAD_W * k; mx.beginPath(); mx.arc(c, c, ROAD_R * k, 0, 7); mx.stroke();
    LANDMARKS.forEach(l => {
      mx.fillStyle = l.p.color; mx.strokeStyle = '#fff'; mx.lineWidth = 3;
      mx.beginPath(); mx.arc(c + l.pos.x * k, c + l.pos.z * k, l.p.home ? 9 : 12, 0, 7); mx.fill(); mx.stroke();
    });
    if (w.archGate >= 0) {
      const g = w.gates[w.archGate];
      mx.strokeStyle = '#ffc53d'; mx.lineWidth = 4; mx.beginPath(); mx.arc(c + g.x * k, c + g.z * k, 9, 0, 7); mx.stroke();
    }
    w.gems.forEach(g => {
      if (!g.visible) return;
      const gx = c + g.position.x * k, gz = c + g.position.z * k;
      mx.fillStyle = '#36c2ff'; mx.strokeStyle = '#fff'; mx.lineWidth = 2;
      mx.beginPath(); mx.moveTo(gx, gz - 7); mx.lineTo(gx + 5, gz); mx.lineTo(gx, gz + 7); mx.lineTo(gx - 5, gz); mx.closePath(); mx.fill(); mx.stroke();
    });
    peerCars.forEach((pc, id) => {
      if (!pc.g.visible) return;
      mx.fillStyle = NET_COLORS[net.peers.get(id)?.color || 0]; mx.strokeStyle = '#0d1628'; mx.lineWidth = 3;
      mx.beginPath(); mx.arc(c + pc.x * k, c + pc.z * k, 8, 0, 7); mx.fill(); mx.stroke();
    });
    mx.save(); mx.translate(c + S.x * k, c + S.z * k); mx.rotate(-S.h + Math.PI);
    mx.fillStyle = '#0d1628'; mx.strokeStyle = NET_COLORS[me.color]; mx.lineWidth = 4;
    mx.beginPath(); mx.moveTo(0, -14); mx.lineTo(10, 10); mx.lineTo(0, 5); mx.lineTo(-10, 10); mx.closePath(); mx.fill(); mx.stroke();
    mx.restore();
  }
  return drawMinimap;
}
