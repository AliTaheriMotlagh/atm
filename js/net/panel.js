import { $, esc, isTouch } from '../core/util.js';
import { store } from '../core/store.js';
import { sfx } from '../core/sfx.js';
import { toast } from '../core/effects.js';
import { world } from '../world/world.js';
import { modal } from '../ui/modal.js';
import { NET_COLORS, me, net, selfKey, cleanName, sayHi, switchRoom, gamePeers } from './net.js';
import { race, raceKey, raceBusy } from './race.js';
import { battle, battleKey, battleBusy } from './battle.js';

/* The "Drive together" panel and the Online button. */
const netEl = $('#net');
export const netPanel = modal(netEl, {
  closeBtn: $('#net-x'),
  onOpen() { renderNet(); },
  onClose: commitName
});
export const openNet = () => { if (world.ok) netPanel.open(); };

function commitName() {
  const inp = $('#net-name'), n = cleanName(inp.value);
  if (!n) { inp.value = me.name; return; }
  if (n === me.name) return;
  me.name = n; inp.value = n; store.set('island-name', n); sayHi(); renderNet();
}

export function renderNet() {
  const others = net.peers.size, n = others + 1;
  const b = $('#btn-online');
  $('#online-n').textContent = n;
  b.classList.toggle('on', net.status === 'online');
  b.setAttribute('aria-label', `${n} driver${n === 1 ? '' : 's'} online`);
  $('#intro-net').hidden = !(net.status === 'online' && others);
  $('#intro-net-text').textContent = `${others} other driver${others === 1 ? ' is' : 's are'} on the island right now. Press Start to drive with them.`;
  if (netEl.hidden) return;
  $('#net-status').textContent = ({
    off: 'Multiplayer off', connecting: 'Connecting…', offline: 'Offline · solo only',
    online: others ? `● Live · ${n} drivers` : '● Live · waiting for other drivers'
  })[net.status];
  const inp = $('#net-name'); if (document.activeElement !== inp) inp.value = me.name;
  $('#net-colors').querySelectorAll('[data-color]').forEach(el => el.setAttribute('aria-checked', String(Number(el.dataset.color) === me.color)));
  const status = id => race.racers.has(id) && race.phase !== 'idle' ? '🏁 racing' : battle.players.has(id) && battle.phase !== 'idle' ? '💎 battling' : '';
  const mate = id => net.mates.has(id) ? '🔒 ' : '';
  const rows = [`<li class="me" style="--c:${NET_COLORS[me.color]}"><i></i><b>${esc(me.name)} (you)</b><small>${status(selfKey())}</small></li>`];
  net.peers.forEach(p => {
    const d = world.peerDist(p.id);
    rows.push(`<li style="--c:${NET_COLORS[p.color]}"><i></i><b>${esc(p.hi ? p.name : 'Connecting…')}</b><small>${mate(p.id)}${status(p.id) || (d == null ? '' : `${Math.round(d)} m away`)}</small></li>`);
  });
  if (!others) rows.push(`<li class="net-empty">${net.status === 'offline' ? 'Couldn’t reach the matchmaking relays, so you’re driving solo. You can still run a time trial.' : 'No one else is here yet. Send a friend the invite link, or run a solo time trial.'}</li>`);
  $('#net-list').innerHTML = rows.join('');
  $('#net-count').textContent = `${n} online`;
  const mates = gamePeers();
  const rb = $('#net-race'), inRace = race.racers.has(selfKey());
  rb.disabled = battleBusy() || race.phase === 'count' || race.phase === 'run' || (race.phase === 'lobby' && inRace);
  rb.textContent = race.phase === 'lobby' ? (inRace ? '✓ You’re in the race' : '🏁 Join the race') : rb.disabled ? (battleBusy() ? '🏁 Start a race' : 'Race in progress…') : mates ? '🏁 Start a race' : '⏱ Solo time trial';
  const bb = $('#net-battle'), inBattle = battle.players.has(selfKey());
  bb.disabled = raceBusy() || battle.phase === 'count' || battle.phase === 'run' || (battle.phase === 'lobby' && inBattle);
  bb.textContent = battle.phase === 'lobby' ? (inBattle ? '✓ You’re in the battle' : '💎 Join the battle') : bb.disabled ? (raceBusy() ? '💎 Gem battle' : 'Battle in progress…') : mates ? '💎 Gem battle' : '💎 Solo gem run';
  $('#net-room').textContent = net.roomId === 'lobby' ? '🔒 Make a private room' : '🌍 Open my games to everyone';
  $('#net-where').textContent = net.roomId === 'lobby' ? 'Games: open to everyone' : `Private room ${net.roomId} · ${net.mates.size} friend${net.mates.size === 1 ? '' : 's'} in it`;
}

export function initNetPanel() {
  $('#net-colors').innerHTML = NET_COLORS.map((c, i) => `<button type="button" role="radio" data-color="${i}" style="--c:${c}" aria-label="Colour ${i + 1}"></button>`).join('');
  $('#net-colors').addEventListener('click', e => {
    const b = e.target.closest('[data-color]'); if (!b) return;
    me.color = Number(b.dataset.color); store.set('island-color', String(me.color));
    world.paintMe(); sayHi(); renderNet(); sfx.play('tick');
  });
  $('#net-name').addEventListener('change', commitName);
  $('#net-name').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
  $('#btn-online').onclick = openNet;
  $('#net-race').onclick = raceKey;
  $('#net-battle').onclick = battleKey;
  $('#net-room').onclick = () => switchRoom(net.roomId === 'lobby' ? Array.from(crypto.getRandomValues(new Uint8Array(4)), b => (b % 36).toString(36)).join('') + '-' + (Date.now() % 1296).toString(36) : 'lobby');
  $('#net-invite').onclick = async () => {
    const url = location.origin + location.pathname + (net.roomId === 'lobby' ? '' : '?room=' + net.roomId);
    if (isTouch && navigator.share) { try { await navigator.share({ title: 'Drive with me on Ali’s Project Island', url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(url); toast('🔗 Invite link copied<small>Anyone who opens it drives on the same island</small>'); }
    catch (e) { toast(`🔗 Share this link<small>${esc(url)}</small>`); }
  };
  setInterval(() => { if (!netEl.hidden) renderNet(); }, 1000);
}
