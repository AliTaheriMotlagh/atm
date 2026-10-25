import { TAU } from '../core/util.js';
import { TOUR } from '../projects/index.js';

/* City geometry, in world units. The world is a small Tehran: north is -Z (the top of the map), where the Alborz
   mountains rise. In the middle is the project plaza: home, the race track (the inner "Project Ring") and a landmark
   on a spoke per project, clockwise from the front (+Z). Around it runs the ring highway, and beyond that the
   districts reach out to the edge of the city, where the desert begins. */
export const PLAZA_R = 14, ROAD_R = 56, ROAD_W = 9, LM_R = 92, CIN_R = 114, OUTER_R = 142, OUTER_W = 13;
export const angleOf = i => Math.PI / 2 - i * (TAU / TOUR.length);
// The drive-in sits further out, in the gap after VasatYab. The race starts in the gap before the first spoke.
export const CIN_GAP = TOUR.findIndex(p => p.id === 'vasatyab') + 0.5;
export const START_GAP = TOUR.length - 0.5;

export const deg = d => d * Math.PI / 180;
// Smooth bump: 1 at angle c, falling to 0 at c ± half.
export function bump(a, c, half) {
  let d = Math.abs(((a - c) % TAU + TAU) % TAU); if (d > Math.PI) d = TAU - d;
  return d >= half ? 0 : 0.5 + 0.5 * Math.cos(d / half * Math.PI);
}

/* Districts are angular sectors (atan2(z, x)) outside the highway. East is 0°, south 90°, west 180°, north 270°. */
export const DISTRICTS = [
  { id: 'tehranpars', name: 'Tehranpars', a0: deg(15), a1: deg(72) },
  { id: 'bazaar', name: 'Grand Bazaar', a0: deg(72), a1: deg(132) },
  { id: 'chitgar', name: 'Chitgar · Azadi', a0: deg(132), a1: deg(196) },
  { id: 'milad', name: 'Gisha · Milad Tower', a0: deg(196), a1: deg(246) },
  { id: 'tajrish', name: 'Tajrish', a0: deg(246), a1: deg(300) },
  { id: 'vanak', name: 'Vanak · Valiasr', a0: deg(300), a1: deg(375) }
];
export const byDistrict = Object.fromEntries(DISTRICTS.map(d => [d.id, d]));
export const midAngle = d => (d.a0 + d.a1) / 2;
export const inSector = (a, a0, a1, pad = 0) => {
  const span = a1 - a0, k = ((a - a0 - pad) % TAU + TAU) % TAU;
  return k <= span - pad * 2;
};
// The Alborz: the mountain wall along the northern edge of the city.
export const NORTH = deg(270), alborz = a => bump(a, NORTH, deg(75));

/* City limits: grassR is where the built-up ground ends, edgeR where you can drive up to (a dusty verge between).
   Past the edge: desert to the south, foothills and then the mountains to the north. */
export const grassR = a => 285 + 14 * Math.sin(3 * a + 0.7) + 8 * Math.sin(5 * a + 2.1) + 4 * Math.sin(11 * a + 0.3) - 16 * alborz(a);
export const sandW = a => 9 + 4 * Math.sin(7 * a + 1.3);
export const edgeR = a => grassR(a) + sandW(a);
// Bounding radius of the drivable city, for maps.
export const ISLAND = (() => { let m = 0; for (let i = 0; i < 720; i++) m = Math.max(m, edgeR(i / 720 * TAU)); return Math.ceil(m); })();

export function districtAt(x, z) {
  const r = Math.hypot(x, z);
  if (r < PLAZA_R + 2) return 'Ali\'s Plaza';
  if (r < OUTER_R - OUTER_W / 2 - 1) return 'Project Ring';
  if (r < OUTER_R + OUTER_W / 2 + 3) return 'Tehran Ring Highway';
  const a = Math.atan2(z, x);
  if (r > grassR(a) + 1) return alborz(a) > 0.3 ? 'Alborz Foothills' : 'City Limits';
  return (DISTRICTS.find(d => inSector(a, d.a0, d.a1)) || DISTRICTS[0]).name;
}
