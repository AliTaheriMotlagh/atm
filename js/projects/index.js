import about from './about.js';
import remixt from './remixt.js';
import khalabani from './khalabani.js';
import gridways from './gridways.js';
import vasatyab from './vasatyab.js';
import siktir from './siktir.js';
import algorithms from './algorithms.js';
import streetquest from './streetquest.js';
import nexus from './nexus.js';
import atm from './atm.js';

/* Every landmark on the island. The first one is home (the house in the middle); the rest stand
   clockwise around the ring road in this order. To add a project, write its module and list it here. */
export const ALL = [about, remixt, khalabani, gridways, vasatyab, siktir, algorithms, streetquest, nexus, atm];
export const TOUR = ALL.filter(p => !p.home);
export const byId = Object.fromEntries(ALL.map(p => [p.id, p]));

export const GAMES = Object.fromEntries(ALL.map(p => [p.id, p.games]));
export const GAME_LIST = ALL.flatMap(p => p.games.map(g => Object.assign(g, { pid: p.id, id: `${p.id}:${g.key}` })));
export const gameById = Object.fromEntries(GAME_LIST.map(g => [g.id, g]));
