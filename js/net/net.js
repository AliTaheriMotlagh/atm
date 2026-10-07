import { esc, isTouch, TAU } from '../core/util.js';
import { store } from '../core/store.js';
import { sfx } from '../core/sfx.js';
import { toast } from '../core/effects.js';
import { world } from '../world/world.js';
import { RACE_ACTIONS, raceOnPeerJoin, raceOnPeerLeave, endRace, raceProgress } from './race.js';
import { BATTLE_ACTIONS, battleOnPeerJoin, battleOnPeerLeave, endBattle } from './battle.js';
import { renderNet } from './panel.js';
import { netServer } from './config.js';
import { socketLib } from './socket.js';

/* Visitors find each other through public Nostr relays (Trystero), then talk directly over WebRTC.
   Each browser simulates only its own car and broadcasts it; other cars are drawn from their messages.

   Two layers:
   - presence: every visitor joins the public island room, so everyone always sees every car, name and horn;
   - games: races and gem battles run in the "game room". That is the public room too, unless you opened a
     private invite link (?room=code), in which case only the friends in that room are invited to your games.
     You still drive among everyone else, and everyone still sees you. */
export const NET_COLORS = ['#ffc53d', '#ff4f8b', '#36c2ff', '#2fdc8a', '#9b7bff', '#ff7a1a', '#f2f5fa', '#ff3b30'];
const NET_APP = 'ali-project-island-v1';
const NET_LIB = 'https://cdn.jsdelivr.net/npm/trystero@0.25.4/+esm';
export const NET_MAX = 24; // WebRTC is a full mesh, so keep rooms small enough for phones.
export const cleanName = s => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
export const within = (v, lo, hi) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi;
export const r2 = v => Math.round(v * 100) / 100;
const roomFromUrl = () => { const r = new URLSearchParams(location.search).get('room'); return r && /^[a-z0-9-]{3,24}$/.test(r) ? r : null; };

export const me = (() => {
  const A = ['Swift', 'Turbo', 'Lucky', 'Sunny', 'Brave', 'Zippy', 'Cosmic', 'Neon', 'Rapid', 'Mellow'];
  const N = ['Otter', 'Falcon', 'Gecko', 'Panda', 'Comet', 'Koala', 'Lynx', 'Pixel', 'Rocket', 'Walrus'];
  const pick = a => a[Math.random() * a.length | 0];
  const saved = store.get('island-color');
  let name = cleanName(store.get('island-name')), color = saved == null ? NaN : Number(saved);
  if (!name) { name = `${pick(A)} ${pick(N)}`; store.set('island-name', name); }
  if (!(Number.isInteger(color) && color >= 0 && color < NET_COLORS.length)) { color = Math.random() * NET_COLORS.length | 0; store.set('island-color', String(color)); }
  return { name, color };
})();

const LOBBY = 'lobby';
export const net = {
  room: null,     // public presence room
  priv: null,     // private game room, when ?room= is set
  relay: null,    // TURN provider name from /api/turn, or null when only direct connections are possible
  self: null, lib: null, status: 'off', roomId: roomFromUrl() || LOBBY,
  peers: new Map(),     // everyone on the island: peerId → { id, name, color, hi, st: { x, z, h, v, s, prog, at }, hop }
  mates: new Set(),     // peers in your private room
  send: {}              // presence senders (hi, st, honk) plus the active game room's senders
};
export const selfKey = () => net.self || 'me';
export const peerColor = id => NET_COLORS[id === selfKey() ? me.color : (net.peers.get(id)?.color || 0)];
export const peerName = id => id === selfKey() ? me.name : (net.peers.get(id)?.name || 'Driver');
// How many other drivers your games can include.
export const gamePeers = () => net.priv ? net.mates.size : net.peers.size;

// TURN relays from /api/turn (see api/turn.js), so phones on mobile data can reach desktops behind home routers.
// Without them only direct WebRTC paths work, which carrier networks often block.
let turnConfig = [];
async function loadRelays() {
  try {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 3500);
    const r = await fetch('/api/turn', { signal: ctl.signal, cache: 'no-store' });
    clearTimeout(timer);
    if (!r.ok) return;
    const d = await r.json();
    turnConfig = (Array.isArray(d.iceServers) ? d.iceServers : []).filter(s => s && s.urls && s.username && s.credential);
    net.relay = turnConfig.length ? (d.provider || 'custom') : null;
  } catch (e) {}
}
const roomConfig = () => ({ appId: NET_APP, ...(turnConfig.length ? { turnConfig } : {}) });

function ensurePeer(id) {
  let p = net.peers.get(id);
  if (!p && net.peers.size < NET_MAX) { p = { id, name: 'Driver', color: 0, hi: false, st: null, hop: 0 }; net.peers.set(id, p); }
  return p || null;
}
// Wraps a Trystero action: incoming data goes to fn(data, peer) while active() holds; the returned function sends (optionally to one peer).
function netAction(room, name, fn, active = () => true) {
  const a = room.makeAction(name);
  a.onMessage = (data, meta) => { if (!active()) return; const p = ensurePeer(meta.peerId); if (p) try { fn(data, p); } catch (e) { console.warn('net', name, e); } };
  return (data, target) => { a.send(data, target ? { target } : undefined).catch(() => {}); };
}
// The game actions (races, battles) for one room. They only act while that room is the game room.
function gameActions(room) {
  const active = () => (net.priv || net.room) === room, out = {};
  Object.entries({ ...RACE_ACTIONS, ...BATTLE_ACTIONS }).forEach(([name, fn]) => { out[name] = netAction(room, name, fn, active); });
  return out;
}
const useGameRoom = () => { net.send = { ...net.room.presence, ...(net.priv || net.room).game }; };
const onGamePeerJoin = id => { raceOnPeerJoin(id); battleOnPeerJoin(id); };
const onGamePeerLeave = id => { raceOnPeerLeave(id); battleOnPeerLeave(id); };

function joinPrivate(id) {
  const room = net.lib.joinRoom(roomConfig(), id);
  room.game = gameActions(room);
  room.onPeerJoin = pid => { if (!ensurePeer(pid)) return; net.mates.add(pid); onGamePeerJoin(pid); renderNet(); };
  room.onPeerLeave = pid => { if (net.mates.delete(pid)) { onGamePeerLeave(pid); renderNet(); } };
  net.priv = room; net.mates.clear();
  useGameRoom();
}
function leavePrivate() {
  if (!net.priv) return;
  try { net.priv.leave(); } catch (e) {}
  net.priv = null; net.mates.clear();
  if (net.room) useGameRoom();
}

export async function netStart() {
  // Stay offline when the island is embedded in another page, so a preview never shows up as a ghost driver.
  if (!world.ok || net.room || window.top !== window) return;
  net.status = 'connecting'; renderNet();
  // A relay server (js/net/config.js) when there is one, otherwise browser-to-browser WebRTC.
  const server = netServer();
  net.transport = server ? 'server' : 'p2p';
  if (server) net.lib = net.lib || socketLib(server, s => { if (net.room) { net.status = s; renderNet(); } });
  else try { [net.lib] = await Promise.all([net.lib || import(NET_LIB), loadRelays()]); } catch (e) { net.status = 'offline'; renderNet(); return; }
  if (net.room) return;
  let room;
  try { room = net.lib.joinRoom(roomConfig(), LOBBY); } catch (e) { net.status = 'offline'; renderNet(); return; }
  net.room = room; net.self = net.lib.selfId; net.status = server && !room.open ? 'connecting' : 'online';

  room.presence = {
    hi: netAction(room, 'hi', (d, p) => {
      if (!d || typeof d !== 'object') return;
      const first = !p.hi;
      p.name = cleanName(d.n) || 'Driver';
      p.color = Number.isInteger(d.c) && d.c >= 0 && d.c < NET_COLORS.length ? d.c : 0;
      p.hi = true;
      if (first) { toast(`🚗 <b>${esc(p.name)}</b> joined the island<small>${isTouch ? 'Tap Online to race them' : 'Press R to race, B for a gem battle'}</small>`, NET_COLORS[p.color]); sfx.play('tick'); }
      renderNet();
    }),
    st: netAction(room, 'st', (d, p) => {
      if (!Array.isArray(d) || d.length < 6) return;
      const [x, z, h, v, s, prog] = d;
      if (!within(x, -120, 120) || !within(z, -120, 120) || !within(h, -TAU, TAU * 2) || !within(v, -60, 60) || !within(s, -2, 2) || !within(prog, -1, 100)) return;
      p.st = { x, z, h, v, s, prog, at: performance.now() };
    }),
    honk: netAction(room, 'honk', (d, p) => world.peerHonk(p))
  };
  room.game = gameActions(room);
  useGameRoom();

  room.onPeerJoin = id => {
    if (!ensurePeer(id)) return;
    net.send.hi({ n: me.name, c: me.color }, id);
    if (!net.priv) onGamePeerJoin(id);
    renderNet();
  };
  room.onPeerLeave = id => {
    const p = net.peers.get(id); if (!p) return;
    net.peers.delete(id); world.dropPeer(id);
    if (!net.priv) onGamePeerLeave(id);
    if (p.hi) toast(`👋 <b>${esc(p.name)}</b> left the island`, NET_COLORS[p.color]);
    renderNet();
  };
  if (net.roomId !== LOBBY) joinPrivate(net.roomId);
  renderNet();
}
export function netLeave() {
  leavePrivate();
  if (net.room) { try { net.room.leave(); } catch (e) {} }
  net.room = null; net.send = {};
  net.peers.forEach(p => world.dropPeer(p.id)); net.peers.clear();
}
// Switching rooms only changes who your games include; the presence room (and every car) stays.
export function switchRoom(id) {
  if (id === net.roomId) return;
  endRace(true); endBattle(true);
  leavePrivate();
  net.roomId = id;
  const u = new URL(location.href);
  if (id === LOBBY) u.searchParams.delete('room'); else u.searchParams.set('room', id);
  try { history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) {}
  toast(id === LOBBY ? '🌍 Your games are open to everyone again' : '🔒 Private room created<small>Copy the invite link: races and battles will only include friends who open it. Everyone still sees your car.</small>');
  if (net.room && id !== LOBBY) joinPrivate(id);
  renderNet();
}
export function sayHi() { net.send.hi?.({ n: me.name, c: me.color }); }

export function initNet() {
  // Car state goes out 10 times a second. Background tabs slow this to once a second, which still keeps the car on the map.
  setInterval(() => {
    if (!net.room || !net.peers.size || !world.ok) return;
    const s = world.me();
    net.send.st([r2(s.x), r2(s.z), r2(((s.h % TAU) + TAU) % TAU), r2(s.v), r2(s.steer), r2(raceProgress())]);
  }, 100);
  // Names and colours go out again every 10 s, so anyone who missed them (a dropped connection) catches up.
  setInterval(sayHi, 10000);
  addEventListener('pagehide', netLeave);
  // Phones suspend background pages (screen lock, app switch) and their connections die quietly.
  // Coming back, the socket transport reconnects at once; the same driver id lets the server swap sockets,
  // so other players just see the car carry on. A race or battle missed while away is dropped.
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = performance.now(); return; }
    const away = hiddenAt ? performance.now() - hiddenAt : 0;
    hiddenAt = 0;
    if (!net.room || away < 5000) return;
    if (away > 20000) { endRace(true); endBattle(true); }
    net.lib?.wake?.();
    setTimeout(sayHi, 1500);
  });
}
