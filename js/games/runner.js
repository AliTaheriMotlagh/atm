import { $, inkFor, buzz } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { confetti } from '../core/effects.js';
import { ALL, GAMES, GAME_LIST, byId, gameById } from '../projects/index.js';
import { game, records, completeChallenge } from '../progress.js';
import { sheetSwipe } from '../ui/modal.js';

/* The challenge dialog: opens one game, gives it a context, and tears it down on restart or close. */
const pgEl = $('#project-game');
let run = null, activeGame = null, gameReturn = null;

export const gameOpen = () => !pgEl.hidden;

function miniMessage(text, kind = '') {
  const el = $('#pg-msg'); el.textContent = text; el.className = 'game-msg' + (kind ? ' ' + kind : '');
}
function renderBest(g) {
  const bits = [];
  if (game.cleared.has(g.id)) bits.push('✓ Cleared this tour');
  if (g.record && records[g.id] != null) bits.push(`Personal best: ${g.record.fmt(records[g.id])}`);
  $('#pg-best').textContent = bits.join(' · ');
}
// The next challenge to suggest: an uncleared one at the same landmark, then anywhere, then simply the next one.
function nextGame(g) {
  const same = GAMES[g.pid], i = same.indexOf(g);
  for (let k = 1; k < same.length; k++) { const n = same[(i + k) % same.length]; if (!game.cleared.has(n.id)) return n; }
  const j = GAME_LIST.indexOf(g);
  for (let k = 1; k < GAME_LIST.length; k++) { const n = GAME_LIST[(j + k) % GAME_LIST.length]; if (!game.cleared.has(n.id)) return n; }
  return same[(i + 1) % same.length];
}

/* Every game gets a context whose timers, frames and listeners are torn down on restart or close.
   c.p is the game's project and c.all every landmark, for games that quiz across the island. */
function makeCtx(g, body) {
  const timers = new Set(), stops = [];
  const c = {
    g, p: byId[g.pid], all: ALL, body, alive: true, won: false,
    el(tag, cls, text) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      if (tag === 'button') e.type = 'button';
      return e;
    },
    html(s) { body.innerHTML = s; return body.firstElementChild; },
    after(ms, fn) { const t = setTimeout(() => { timers.delete(t); if (c.alive) fn(); }, ms); timers.add(t); return t; },
    cancel(t) { clearTimeout(t); timers.delete(t); },
    // fn(dt) runs every frame until it returns false.
    loop(fn) {
      let id = 0, last = performance.now();
      const step = now => { if (!c.alive) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; if (fn(dt) === false) return; id = requestAnimationFrame(step); };
      id = requestAnimationFrame(step);
      stops.push(() => cancelAnimationFrame(id));
    },
    on(el, ev, fn, opt) { el.addEventListener(ev, fn, opt); stops.push(() => el.removeEventListener(ev, fn, opt)); },
    key(fn) { c.on(window, 'keydown', e => { if (e.repeat || e.target.closest?.('input, textarea')) return; fn(e); }); },
    msg: miniMessage,
    fail(text) { miniMessage(text, 'bad'); sfx.play('fail'); buzz(60); },
    win(text, score) {
      if (c.won) return; c.won = true;
      const res = completeChallenge(g, score);
      miniMessage(text + (res.pb === 'best' ? ' New personal best!' : '') + (res.first ? ' +1 coin' : ''), 'good');
      sfx.play('stamp'); buzz([30, 40, 30]);
      confetti([c.p.color, '#ffc53d', '#ffffff']);
      renderBest(g);
      const nx = nextGame(g), nb = $('#pg-next');
      nb.hidden = false; nb.textContent = `Next: ${nx.title} →`; nb.dataset.next = nx.id;
    },
    stop() { c.alive = false; timers.forEach(clearTimeout); timers.clear(); stops.forEach(f => f()); stops.length = 0; }
  };
  return c;
}

export function openGame(id) {
  const g = gameById[id]; if (!g) return;
  sfx.unlock();
  if (pgEl.hidden) gameReturn = { el: document.activeElement, id };
  const p = byId[g.pid];
  activeGame = g;
  pgEl.style.setProperty('--pc', p.color);
  pgEl.style.setProperty('--pc-ink', inkFor(p.color));
  $('#pg-kicker').textContent = `${p.home ? 'About Ali' : p.name} · challenge ${GAMES[g.pid].indexOf(g) + 1} of ${GAMES[g.pid].length}`;
  $('#pg-title').textContent = `${g.icon} ${g.title}`;
  $('#pg-desc').textContent = g.desc;
  pgEl.hidden = false;
  pgEl.querySelector('.game-box').scrollTop = 0;
  startGame();
}
function startGame() {
  if (run) run.stop();
  const g = activeGame, body = $('#pg-body');
  body.innerHTML = ''; miniMessage(''); $('#pg-next').hidden = true; renderBest(g);
  run = makeCtx(g, body);
  try { g.run(run); } catch (e) { console.error(e); miniMessage('This challenge could not start. Try Restart.', 'bad'); }
  const first = body.querySelector('[data-autofocus], button:not(:disabled), input, [tabindex="0"]');
  (first || $('#pg-x')).focus({ preventScroll: true });
}
export function closeGame() {
  if (run) { run.stop(); run = null; }
  if (pgEl.hidden) return;
  pgEl.hidden = true; activeGame = null;
  // The list that opened the game may have re-rendered, so fall back to the matching row.
  const r = gameReturn; gameReturn = null;
  const back = r && (r.el?.isConnected ? r.el : document.querySelector(`${$('#arcade').hidden ? '#dossier' : '#arcade'} [data-game="${r.id}"]`));
  if (back) back.focus({ preventScroll: true });
}

export function initRunner() {
  $('#pg-x').onclick = closeGame;
  $('#pg-retry').onclick = () => { if (activeGame) startGame(); };
  $('#pg-next').onclick = e => openGame(e.currentTarget.dataset.next);
  pgEl.addEventListener('click', e => { if (e.target === pgEl) closeGame(); });
  sheetSwipe(pgEl, closeGame);
}
