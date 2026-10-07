import { $, esc, isTouch, buzz, fmtTime } from '../core/util.js';
import { store } from '../core/store.js';
import { sfx } from '../core/sfx.js';
import { toast, confetti } from '../core/effects.js';
import { world } from '../world/world.js';
import { enterDrive } from '../ui/shell.js';
import { NET_COLORS, NET_MAX, me, net, selfKey, peerName, peerColor, within, gamePeers } from './net.js';
import { raceBusy } from './race.js';
import { renderNet } from './panel.js';

/* Gem Battle: everyone in the game room drives around the island for 60 seconds grabbing gems.
   Gem spots come from a shared seed, so every browser draws them in the same places. The host's browser
   decides who got each gem (first grab it hears wins) and broadcasts the scores, so a gem never counts twice. */
const GEMS = 10, DURATION = 60000;

export const battle = {
  phase: 'idle', id: null, host: null, seed: 0, goAt: 0, doneAt: 0,
  players: new Set(), scores: new Map(),
  active: new Map(),   // gem slot (0..GEMS-1) → spot index in the seeded sequence
  next: GEMS, hudAt: 0, shown: null
};
const inBattle = () => battle.players.has(selfKey());
const isHost = () => battle.host === selfKey();
export const battleBusy = () => ['lobby', 'count', 'run'].includes(battle.phase);
export const battleLocked = () => inBattle() && (battle.phase === 'count' || (battle.phase === 'lobby' && performance.now() >= battle.goAt - 3000));

function setup(id, host, seed, lead) {
  Object.assign(battle, { phase: 'lobby', id, host, seed, goAt: performance.now() + lead, doneAt: 0, next: GEMS, shown: null });
  battle.players = new Set([host]); battle.scores = new Map(); battle.active = new Map();
  world.showGems(null);
}
export function startBattle() {
  if (!world.ok || battleBusy() || raceBusy()) return;
  const lead = gamePeers() ? 10000 : 3200;
  const id = `${selfKey()}:${Date.now().toString(36)}`, seed = Math.random() * 1e9 | 0;
  setup(id, selfKey(), seed, lead);
  net.send.battle?.({ id, seed, in: lead, r: [selfKey()] });
  enterDrive(); sfx.play('stamp');
  renderBattle(true); renderNet();
}
export function joinBattle() {
  if (battle.phase !== 'lobby' || inBattle()) return;
  battle.players.add(selfKey());
  if (!isHost()) net.send.bjoin?.({ id: battle.id });
  enterDrive(); sfx.play('coin');
  renderBattle(true); renderNet();
}
export function battleKey() {
  if (battle.phase === 'lobby') joinBattle();
  else if (battle.phase === 'idle' || battle.phase === 'done') startBattle();
}
export function endBattle(silent) {
  world.showGems(null);
  if (silent || battle.phase !== 'run') {
    Object.assign(battle, { phase: 'idle', id: null }); battle.players.clear();
    $('#battle-hud').hidden = true; if (battle.shown) $('#race-count').hidden = true;
    renderNet(); return;
  }
  battle.phase = 'done'; battle.doneAt = performance.now();
  const rows = standings(), mine = battle.scores.get(selfKey()) || 0;
  if (inBattle()) {
    const place = rows.findIndex(r => r.self) + 1, best = Number(store.get('island-gem-best')) || 0, pb = mine > best;
    if (pb) store.set('island-gem-best', String(mine));
    sfx.play('win'); buzz([40, 60, 120]);
    if (place === 1 && mine > 0) confetti(rows.map(r => r.color).concat('#36c2ff'), 140);
    toast(rows.length > 1 ? `💎 You finished ${place === 1 ? '1st' : `#${place}`} with ${mine} gem${mine === 1 ? '' : 's'}${pb ? '<small>New personal best!</small>' : ''}` : `💎 ${mine} gems in 60 s${pb ? '<small>New personal best!</small>' : best ? `<small>Best ${best}</small>` : ''}`, NET_COLORS[me.color]);
  }
  renderBattle(true); renderNet();
}

// Gems on the island for the current slots.
function paintGems() {
  if (battle.phase !== 'run' || !inBattle()) { world.showGems(null); return; }
  world.showGems(Array.from({ length: GEMS }, (_, k) => battle.active.has(k) ? world.gemSpot(battle.seed, battle.active.get(k)) : null));
}
// Host only: the first grab of a live gem scores, and the slot moves to the next spot.
function award(by, k, spot) {
  if (!isHost() || battle.phase !== 'run' || !battle.players.has(by) || battle.active.get(k) !== spot) return;
  battle.scores.set(by, (battle.scores.get(by) || 0) + 1);
  battle.active.set(k, battle.next++);
  const msg = { id: battle.id, k, s: battle.active.get(k), by, sc: [...battle.scores] };
  net.send.bgem?.(msg);
  applyGem(msg);
}
function applyGem(m) {
  battle.active.set(m.k, m.s);
  battle.scores = new Map(m.sc);
  if (m.by === selfKey()) { sfx.play('coin'); buzz(12); }
  paintGems(); renderBattle(true);
}
// The world calls this when your car touches gem slot k.
function grab(k) {
  if (battle.phase !== 'run' || !inBattle() || !battle.active.has(k)) return;
  const spot = battle.active.get(k);
  if (isHost()) award(selfKey(), k, spot);
  else net.send.bgrab?.({ id: battle.id, k, s: spot }, battle.host);
}

function standings() {
  return [...battle.players].map(id => ({ id, self: id === selfKey(), name: peerName(id), color: peerColor(id), n: battle.scores.get(id) || 0 }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
}
function showCount(v) {
  if (battle.shown === v) return;
  battle.shown = v;
  const el = $('#race-count');
  if (v == null) { el.hidden = true; return; }
  el.textContent = v; el.hidden = false; el.classList.toggle('go', v === 'GO');
  el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
  if (v === 'GO') { sfx.tone(1047, 0.35, 'square', 0.06); buzz(60); } else { sfx.tone(523, 0.15, 'square', 0.05); buzz(20); }
}

export function renderBattle(force) {
  const now = performance.now();
  if (!force && now - battle.hudAt < 150) return;
  battle.hudAt = now;
  const hud = $('#battle-hud');
  if (battle.phase === 'idle') { hud.hidden = true; return; }
  const rows = standings(), n = battle.players.size;
  const board = list => `<ol class="race-board">${list.map((r, i) => `<li class="${r.self ? 'me' : ''}" style="--c:${r.color}"><span class="n">${i + 1}</span><i></i><span>${esc(r.name)}${r.self ? ' (you)' : ''}</span><small>💎 ${r.n}</small></li>`).join('')}</ol>`;
  let html = '';
  if (battle.phase === 'lobby' || battle.phase === 'count') {
    const secs = Math.max(0, Math.ceil((battle.goAt - now) / 1000));
    html = `<div class="race-top"><b>💎 ${battle.phase === 'count' ? 'Get ready' : `Gem battle in ${secs}s`}</b><span>60 s · ${n} driver${n === 1 ? '' : 's'}</span>${!inBattle() && battle.phase === 'lobby' ? `<button class="btn" type="button" data-battle="join">Join${isTouch ? '' : ' (B)'}</button>` : ''}</div>`;
    if (n > 1 || !inBattle()) html += board(rows);
  } else if (battle.phase === 'run') {
    const left = Math.max(0, (battle.goAt + DURATION - now) / 1000);
    html = `<div class="race-stats"><span>💎 <em>${battle.scores.get(selfKey()) || 0}</em></span><span>⏱ <em>${fmtTime(left)}</em></span>${inBattle() ? '' : '<span>watching</span>'}</div>` + board(rows.slice(0, 6));
  } else if (battle.phase === 'done') {
    const best = Number(store.get('island-gem-best')) || 0;
    html = `<div class="race-top"><b>🏆 Gem battle results</b>${best ? `<span>Your best ${best} 💎</span>` : ''}</div>${board(rows)}<div class="race-top"><button class="btn" type="button" data-battle="again">Battle again${isTouch ? '' : ' (B)'}</button><button class="btn ghost" type="button" data-battle="close">Close</button></div>`;
  }
  if (hud.innerHTML !== html) hud.innerHTML = html;
  hud.hidden = false;
}

// Messages on the game room (see net.js).
export const BATTLE_ACTIONS = {
  battle(d, p) {
    if (!d || typeof d.id !== 'string' || d.id.length > 64 || !within(d.in, 0, 20000) || !Number.isInteger(d.seed)) return;
    if (raceBusy() || battle.phase === 'count' || battle.phase === 'run' || battle.id === d.id) return;
    // Two invites at once: the host id that sorts first wins, so every browser picks the same battle.
    if (battle.phase === 'lobby' && battle.host < p.id) return;
    const wasIn = battle.phase === 'lobby' && inBattle();
    setup(d.id, p.id, d.seed, d.in);
    (Array.isArray(d.r) ? d.r.slice(0, NET_MAX) : []).forEach(id => { if (typeof id === 'string' && id.length <= 40 && id !== selfKey()) battle.players.add(id); });
    if (wasIn) { battle.players.add(selfKey()); net.send.bjoin?.({ id: battle.id }); }
    else { toast(`💎 <b>${esc(p.name)}</b> started a gem battle!<small>${isTouch ? 'Tap Join to play' : 'Press B to join'}</small>`, NET_COLORS[p.color]); sfx.play('stamp'); buzz([20, 40, 20]); }
    renderBattle(true); renderNet();
  },
  bjoin(d, p) {
    if (!d || d.id !== battle.id || battle.phase !== 'lobby' || battle.players.size >= NET_MAX) return;
    battle.players.add(p.id); renderBattle(true);
    // Late joiners hear about everyone already in.
    if (isHost()) net.send.broster?.({ id: battle.id, r: [...battle.players] });
  },
  broster(d, p) {
    if (!d || d.id !== battle.id || p.id !== battle.host || !Array.isArray(d.r)) return;
    d.r.slice(0, NET_MAX).forEach(id => { if (typeof id === 'string' && id.length <= 40) battle.players.add(id); });
    renderBattle(true);
  },
  bgrab(d, p) {
    if (!d || d.id !== battle.id || !Number.isInteger(d.k) || !Number.isInteger(d.s)) return;
    award(p.id, d.k, d.s);
  },
  bgem(d, p) {
    if (!d || d.id !== battle.id || p.id !== battle.host || !Number.isInteger(d.k) || d.k < 0 || d.k >= GEMS || !Number.isInteger(d.s) || !Array.isArray(d.sc)) return;
    applyGem({ k: d.k, s: d.s, by: d.by, sc: d.sc.filter(e => Array.isArray(e) && typeof e[0] === 'string' && within(e[1], 0, 9999)).slice(0, NET_MAX) });
  }
};
export function battleOnPeerJoin(id) {
  if (battle.phase === 'lobby' && isHost()) net.send.battle?.({ id: battle.id, seed: battle.seed, in: Math.round(battle.goAt - performance.now()), r: [...battle.players] }, id);
}
export function battleOnPeerLeave(id) {
  if (!battle.players.delete(id)) return;
  // Without its host nobody can score, so the battle ends where it stands.
  if (id === battle.host && battle.phase === 'run') { toast('💎 The battle host left, so the battle ended.'); endBattle(); return; }
  if (id === battle.host) { endBattle(true); return; }
  renderBattle(true);
}

export function initBattle() {
  world.onGem = grab;
  setInterval(() => {
    if (battle.phase === 'idle') return;
    const now = performance.now();
    if (battle.phase === 'lobby' && now >= battle.goAt - 3000) {
      battle.phase = 'count';
      if (inBattle()) enterDrive();
    }
    if (battle.phase === 'count') {
      if (inBattle()) showCount(String(Math.max(1, Math.ceil((battle.goAt - now) / 1000))));
      if (now >= battle.goAt) {
        battle.phase = 'run';
        for (let k = 0; k < GEMS; k++) battle.active.set(k, k);
        if (inBattle()) showCount('GO');
        paintGems();
      }
    }
    if (battle.phase === 'run') {
      if (battle.shown === 'GO' && now - battle.goAt > 900) showCount(null);
      if (now >= battle.goAt + DURATION || !battle.players.size) endBattle();
    }
    if (battle.phase === 'done' && now - battle.doneAt > 25000) { endBattle(true); return; }
    renderBattle();
  }, 50);
  $('#battle-hud').addEventListener('click', e => {
    const b = e.target.closest('[data-battle]'); if (!b) return;
    if (b.dataset.battle === 'join') joinBattle();
    else if (b.dataset.battle === 'again') { endBattle(true); startBattle(); }
    else if (b.dataset.battle === 'close') endBattle(true);
  });
}
