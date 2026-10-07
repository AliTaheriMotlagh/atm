import { TOUR } from '../projects/index.js';

/* Island geometry, in world units. Landmarks stand on spokes off the ring road, clockwise from the front (+Z). */
export const ISLAND = 94, LIMIT = 91, ROAD_R = 34.5, ROAD_W = 7, LM_R = 60, CIN_R = 78;
export const angleOf = i => Math.PI / 2 - i * (Math.PI * 2 / TOUR.length);
// The drive-in sits further out, in the gap after VasatYab.
export const CIN_GAP = TOUR.findIndex(p => p.id === 'vasatyab') + 0.5;
