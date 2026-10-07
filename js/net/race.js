import { $, esc, clamp, isTouch, buzz, fmtTime, ordinal } from '../core/util.js';
import { store } from '../core/store.js';
import { sfx } from '../core/sfx.js';
import { toast, confetti } from '../core/effects.js';
import { world } from '../world/world.js';
import { enterDrive } from '../ui/shell.js';
import { NET_COLORS, NET_MAX, me, net, selfKey, peerName, peerColor, within, r2, gamePeers } from './net.js';
import { battleBusy } from './battle.js';
import { renderNet } from './panel.js';

export const RACE_LAPS = 2;

// No shared clock: an invite says "starts in N ms", and every racer times itself from its own GO.
export const race = { phase: 'idle', id: null, host: null, goAt: 0, racers: new Set(), fin: new Map(), gate: 1, lap: 0, firstFin: 0, doneAt: 0, hudAt: 0, shown: null };
const raceIn = () => race.racers.has(selfKey());
export const raceLocked = () => raceIn() && (race.phase === 'count' || (race.phase === 'lobby' && performance.now() >= race.goAt - 3000));
export const raceBusy = () => ['lobby', 'count', 'run'].includes(race.phase);

function setupRace(id, host, lead) {
  Object.assign(race, { phase: 'lobby', id, host, goAt: performance.now() + lead, gate: 1, lap: 0, firstFin: 0, doneAt: 0, shown: null });
  race.racers = new Set([host]); race.fin = new Map();
  world.setGate(-1);
}
export function startRace() {
  if (!world.ok || raceBusy() || battleBusy()) return;
  const lead = gamePeers() ? 12000 : 3200;
  const id = `${selfKey()}:${Date.now().toString(36)}`;
  setupRace(id, selfKey(), lead);
  net.send.race?.({ id, in: lead, r: [selfKey()] });
  enterDrive(); sfx.play('stamp');
  renderRace(true); renderNet();
}
export function joinRace() {
  if (race.phase !== 'lobby' || raceIn()) return;
  race.racers.add(selfKey());
  net.send.join?.({ id: race.id });
  enterDrive(); sfx.play('coin');
  renderRace(true); renderNet();
}
export function raceKey() {
  if (race.phase === 'lobby') joinRace();
  else if (race.phase === 'idle' || race.phase === 'done') startRace();
}
export function onRaceInvite(d, p) {
  if (!d || typeof d.id !== 'string' || d.id.length > 64 || !within(d.in, 0, 20000)) return;
  if (battleBusy()) return;
  if (race.phase === 'count' || race.phase === 'run' || race.id === d.id) return;
  // Two invites at once: the one whose host id sorts first wins, so every browser picks the same race.
  if (race.phase === 'lobby' && race.host < p.id) return;
  const wasIn = race.phase === 'lobby' && raceIn();
  setupRace(d.id, p.id, d.in);
  (Array.isArray(d.r) ? d.r.slice(0, NET_MAX) : []).forEach(id => { if (typeof id === 'string' && id.length <= 40 && id !== selfKey()) race.racers.add(id); });
  if (wasIn) { race.racers.add(selfKey()); net.send.join?.({ id: race.id }); }
  else { toast(`🏁 <b>${esc(p.name)}</b> started a race!<small>${isTouch ? 'Tap Join to race' : 'Press R to join'}</small>`, NET_COLORS[p.color]); sfx.play('stamp'); buzz([20, 40, 20]); }
  renderRace(true); renderNet();
}
// Checkpoints passed plus the fraction of the way to the next one; 99 once finished, −1 when not racing.
export function raceProgress() {
  if (!raceIn() || race.phase !== 'run') return -1;
  if (race.fin.has(selfKey())) return 99;
  const G = world.track.gates, N = G.length, g = G[race.gate], s = world.me();
  const passed = race.lap * N + (race.gate - 1 + N) % N;
  return passed + clamp(1 - Math.hypot(s.x - g.x, s.z - g.z) / world.track.seg, 0, 0.99);
}
function standings() {
  const rows = [...race.racers].map(id => {
    const self = id === selfKey(), p = net.peers.get(id);
    const prog = self ? raceProgress() : (p && p.st && p.st.prog >= 0 ? p.st.prog : 0);
    return { id, self, name: peerName(id), color: peerColor(id), t: race.fin.get(id), prog };
  });
  return rows.sort((a, b) => (a.t != null) !== (b.t != null) ? (a.t != null ? -1 : 1) : a.t != null ? a.t - b.t : b.prog - a.prog);
}
export function endRace(silent) {
  world.setGate(-1);
  $('#race-count').hidden = true;
  if (silent || race.phase === 'idle' || race.phase === 'lobby' || race.phase === 'count') {
    Object.assign(race, { phase: 'idle', id: null }); race.racers.clear();
    $('#race-hud').hidden = true; renderNet(); return;
  }
  race.phase = 'done'; race.doneAt = performance.now();
  renderRace(true); renderNet();
}
function showCount(v) {
  if (race.shown === v) return;
  race.shown = v;
  const el = $('#race-count');
  if (v == null) { el.hidden = true; return; }
  el.textContent = v; el.hidden = false; el.classList.toggle('go', v === 'GO');
  el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
  if (v === 'GO') { sfx.tone(1047, 0.35, 'square', 0.06); buzz(60); } else { sfx.tone(523, 0.15, 'square', 0.05); buzz(20); }
}
function passGate() {
  const G = world.track.gates, N = G.length;
  if (race.gate === 0) {
    race.lap++;
    if (race.lap >= RACE_LAPS) { finishRace(); return; }
    toast(race.lap === RACE_LAPS - 1 ? '🏁 Final lap!' : `🏁 Lap ${race.lap + 1} of ${RACE_LAPS}`); sfx.play('stamp');
  } else sfx.play('coin');
  race.gate = (race.gate + 1) % N;
  world.setGate(race.gate);
}
function finishRace() {
  const t = (performance.now() - race.goAt) / 1000;
  race.fin.set(selfKey(), t);
  if (!race.firstFin) race.firstFin = performance.now();
  net.send.fin?.({ id: race.id, t: r2(t) });
  world.setGate(-1);
  const place = [...race.fin.values()].filter(v => v < t).length + 1, field = race.racers.size;
  const best = Number(store.get('island-race-best')) || 0, pb = !best || t < best;
  if (pb) store.set('island-race-best', String(t));
  sfx.play('win'); buzz([40, 60, 120]);
  if (place === 1 || pb) confetti(field > 1 ? standings().map(r => r.color) : [NET_COLORS[me.color], '#ffffff', '#ffc53d'], 140);
  toast(field > 1 ? `🏆 You finished ${ordinal(place)} of ${field} · ${fmtTime(t)}${pb ? '<small>New personal best!</small>' : ''}` : `⏱ ${fmtTime(t)}${pb ? '<small>New personal best!</small>' : best ? `<small>Best ${fmtTime(best)}</small>` : ''}`, NET_COLORS[me.color]);
}

export function renderRace(force) {
  const now = performance.now();
  if (!force && now - race.hudAt < 150) return;
  race.hudAt = now;
  const hud = $('#race-hud');
  if (race.phase === 'idle') { hud.hidden = true; return; }
  const inRace = raceIn(), rows = standings(), N = world.track ? world.track.gates.length : 8;
  const board = (list, full) => `<ol class="race-board">${list.map((r, i) => `<li class="${r.self ? 'me' : ''}" style="--c:${r.color}"><span class="n">${i + 1}</span><i></i><span>${esc(r.name)}${r.self ? ' (you)' : ''}</span><small>${r.t != null ? fmtTime(r.t) : full ? 'DNF' : race.phase === 'run' ? `lap ${Math.min(RACE_LAPS, Math.floor(r.prog / N) + 1)}` : ''}</small></li>`).join('')}</ol>`;
  let html = '';
  if (race.phase === 'lobby' || race.phase === 'count') {
    const secs = Math.max(0, Math.ceil((race.goAt - now) / 1000));
    const n = race.racers.size;
    html = `<div class="race-top"><b>🏁 ${race.phase === 'count' ? 'Get ready' : `Race in ${secs}s`}</b><span>${RACE_LAPS} laps · ${n} racer${n === 1 ? '' : 's'}</span>${!inRace && race.phase === 'lobby' ? `<button class="btn" type="button" data-race="join">Join${isTouch ? '' : ' (R)'}</button>` : ''}</div>`;
    if (n > 1 || !inRace) html += board(rows, false);
  } else if (race.phase === 'run') {
    const mine = race.fin.get(selfKey());
    if (inRace && mine == null) {
      const pos = rows.findIndex(r => r.self) + 1;
      html = `<div class="race-stats">${race.racers.size > 1 ? `<span><b class="pos">P${pos}</b>/${race.racers.size}</span>` : ''}<span>Lap <em>${Math.min(race.lap + 1, RACE_LAPS)}/${RACE_LAPS}</em></span><span>Gate <em>${(race.gate - 1 + N) % N + 1}/${N}</em></span><span><em>${fmtTime((now - race.goAt) / 1000)}</em></span></div>`;
      if (race.racers.size > 1) html += board(rows.slice(0, 5), false);
    } else {
      html = `<div class="race-top"><b>🏁 ${mine != null ? `Finished · ${fmtTime(mine)}` : 'Race on'}</b><span>${mine != null ? 'waiting for the others…' : `${race.racers.size} racing`}</span></div>` + board(rows, false);
    }
  } else if (race.phase === 'done') {
    const best = Number(store.get('island-race-best')) || 0;
    html = `<div class="race-top"><b>🏆 Results</b>${best ? `<span>Your best ${fmtTime(best)}</span>` : ''}</div>${board(rows, true)}<div class="race-top"><button class="btn" type="button" data-race="again">Race again${isTouch ? '' : ' (R)'}</button><button class="btn ghost" type="button" data-race="close">Close</button></div>`;
  }
  if (hud.innerHTML !== html) hud.innerHTML = html;
  hud.hidden = false;
}

export function initRace() {
  setInterval(() => {
    if (race.phase === 'idle') return;
    const now = performance.now(), inRace = raceIn();
    if (race.phase === 'lobby' && now >= race.goAt - 3000) {
      if (!race.racers.size) { endRace(true); return; }
      race.phase = 'count';
      if (inRace) { enterDrive(); world.toGrid([...race.racers].sort().indexOf(selfKey())); }
    }
    if (race.phase === 'count') {
      if (inRace) showCount(String(Math.max(1, Math.ceil((race.goAt - now) / 1000))));
      if (now >= race.goAt) {
        race.phase = 'run';
        if (inRace) { showCount('GO'); world.setGate(race.gate); }
      }
    }
    if (race.phase === 'run') {
      if (race.shown === 'GO' && now - race.goAt > 900) showCount(null);
      if (inRace && !race.fin.has(selfKey())) {
        const g = world.track.gates[race.gate], s = world.me();
        if (Math.hypot(s.x - g.x, s.z - g.z) < world.track.gateR) passGate();
      }
      const all = race.racers.size && [...race.racers].every(id => race.fin.has(id));
      if (all || !race.racers.size || (race.firstFin && now - race.firstFin > 45000) || now - race.goAt > 300000) endRace();
    }
    if (race.phase === 'done' && now - race.doneAt > 25000) { endRace(true); return; }
    renderRace();
  }, 50);
  $('#race-hud').addEventListener('click', e => {
    const b = e.target.closest('[data-race]'); if (!b) return;
    if (b.dataset.race === 'join') joinRace();
    else if (b.dataset.race === 'again') { endRace(true); startRace(); }
    else if (b.dataset.race === 'close') endRace(true);
  });
}

// Messages on the game room (see net.js), and what happens when someone arrives or leaves it.
export const RACE_ACTIONS = {
  race: onRaceInvite,
  join(d, p) { if (d && d.id === race.id && race.phase === 'lobby') { race.racers.add(p.id); renderRace(true); } },
  fin(d, p) {
    if (!d || d.id !== race.id || !race.racers.has(p.id) || race.fin.has(p.id) || !within(d.t, 1, 3600)) return;
    race.fin.set(p.id, d.t);
    if (!race.firstFin) race.firstFin = performance.now();
    toast(`🏁 <b>${esc(p.name)}</b> finished · ${fmtTime(d.t)}`, NET_COLORS[p.color]);
    renderRace(true);
  }
};
// Someone arriving during a race lobby gets the invite too.
export function raceOnPeerJoin(id) {
  if (race.phase === 'lobby' && race.host === selfKey()) net.send.race?.({ id: race.id, in: Math.round(race.goAt - performance.now()), r: [...race.racers] }, id);
}
export function raceOnPeerLeave(id) { if (race.racers.delete(id)) renderRace(true); }
