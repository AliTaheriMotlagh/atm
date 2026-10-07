import { $, esc, buzz, fmtTime } from './core/util.js';
import { store } from './core/store.js';
import { sfx } from './core/sfx.js';
import { toast, confetti } from './core/effects.js';
import { emit } from './core/events.js';
import { TOUR, GAMES, GAME_LIST, byId } from './projects/index.js';

/* The island tour: stamps, coins, dossiers and cleared challenges. Progress lasts for the session;
   the best tour time and per-challenge personal bests are kept on this device.
   Emits 'progress' whenever something changes, so lists showing it can re-render. */
export const game = {
  stamps: new Set(), dossiers: new Set(), cleared: new Set(), coins: 0, elapsed: 0, running: false, won: false,
  coinGoal: 8, dossierGoal: 3, combo: 0, lastCoin: 0,
  best: Number(store.get('island-best') || 0) || 0
};

export let records = {};
try { records = JSON.parse(store.get('island-records') || '{}') || {}; } catch (e) {}

// Tour projects with at least one cleared challenge.
const projectsBeaten = () => TOUR.filter(p => GAMES[p.id].some(g => game.cleared.has(g.id))).length;

// Returns 'first' for a first score, 'best' for a beaten record, or false.
function saveRecord(g, v) {
  if (!g.record || typeof v !== 'number' || !isFinite(v)) return false;
  const old = records[g.id];
  if (old != null && (g.record.lower ? v >= old : v <= old)) return false;
  records[g.id] = v; store.set('island-records', JSON.stringify(records));
  return old == null ? 'first' : 'best';
}

export function renderGameHud() {
  $('#goal-time').textContent = fmtTime(game.elapsed);
  $('#goal-time').classList.toggle('done', game.won);
  $('#goal-n').textContent = `${game.stamps.size}/${TOUR.length}`;
  $('#goal-c').textContent = $('#goal-c2').textContent = game.coins;
  $('#goal-g').textContent = `${projectsBeaten()}/${TOUR.length}`;
  $('#goal-s').textContent = $('#goal-s2').textContent = `${game.cleared.size}/${GAME_LIST.length}`;
  $('#goal-d').textContent = game.dossiers.size;
  $('#goal-best').textContent = game.best ? `Best ${fmtTime(game.best)}` : 'No best time yet';
  $('#goal-stamps').innerHTML = TOUR.map(p => `<i class="${game.stamps.has(p.id) ? 'on' : ''}" style="--c:${p.color}" title="${esc(p.name)}"></i>`).join('');
  const done = { stamps: game.stamps.size === TOUR.length, coins: game.coins >= game.coinGoal, dossiers: game.dossiers.size >= game.dossierGoal, games: projectsBeaten() === TOUR.length };
  Object.entries(done).forEach(([k, v]) => document.querySelector(`[data-mission="${k}"]`)?.classList.toggle('done', v));
}

function checkWin() {
  if (game.won || game.stamps.size < TOUR.length || game.coins < game.coinGoal || game.dossiers.size < game.dossierGoal || projectsBeaten() < TOUR.length) return;
  game.won = true; game.running = false; sfx.play('win'); buzz([40, 60, 40, 60, 120]);
  const newBest = !game.best || game.elapsed < game.best;
  if (newBest) { game.best = game.elapsed; store.set('island-best', String(game.best)); }
  renderGameHud();
  $('#win-title').textContent = `All ${TOUR.length} stamps!`;
  $('#win-stats').innerHTML = `<div class="stat"><b>${fmtTime(game.elapsed)}</b><span>${newBest ? 'new best time!' : 'tour time'}</span></div><div class="stat"><b>${game.coins}</b><span>coins</span></div><div class="stat"><b>${game.cleared.size}/${GAME_LIST.length}</b><span>challenges</span></div><div class="stat"><b>${game.dossiers.size}</b><span>dossiers opened</span></div>`;
  const left = GAME_LIST.length - game.cleared.size;
  $('#win-msg').textContent = `You visited every landmark, beat a challenge at every project, collected the coins and read the dossiers.${left ? ` ${left} more challenges are waiting in the arcade.` : ' You also cleared every challenge on the island!'}`;
  $('#win').hidden = false;
  confetti(TOUR.map(p => p.color), 180);
  $('#btn-again').focus({ preventScroll: true });
}

export function gameStamp(id) {
  const p = byId[id];
  if (!p || p.home || game.stamps.has(id)) return;
  game.stamps.add(id); sfx.play('stamp'); toast(`🏁 ${esc(p.name)} stamp collected`, p.color); renderGameHud(); checkWin();
}
export function gameCoin() {
  const now = performance.now();
  game.combo = now - game.lastCoin < 2500 ? game.combo + 1 : 1; game.lastCoin = now;
  game.coins++; sfx.play('coin'); buzz(12);
  if (game.combo >= 3) toast(`🪙 Coin combo ×${game.combo}!`);
  renderGameHud(); checkWin();
}
export function gameDossier(id) {
  if (byId[id]?.home) return;
  game.dossiers.add(id); renderGameHud(); checkWin();
}
export function completeChallenge(g, score) {
  const first = !game.cleared.has(g.id);
  if (first) { game.cleared.add(g.id); game.coins++; }
  const pb = saveRecord(g, score);
  renderGameHud(); emit('progress');
  if (first && game.cleared.size === GAME_LIST.length) setTimeout(() => toast('🏆 Every challenge on the island cleared!'), 1600);
  setTimeout(checkWin, 1400); // let the challenge's own success message land first
  return { first, pb };
}
export function resetProgress(running) {
  game.stamps.clear(); game.dossiers.clear(); game.cleared.clear();
  game.coins = 0; game.combo = 0; game.elapsed = 0; game.running = running; game.won = false;
  $('#win').hidden = true; renderGameHud(); emit('progress');
}
export function updateGame(dt, driving) {
  if (!driving || game.won) return;
  game.running = true; game.elapsed += dt;
  if ((Math.floor(game.elapsed * 10) % 2) === 0) renderGameHud();
}
