/* WebSocket relay for the island's multiplayer.

   Every browser opens one socket per room: ws(s)://host/ws?app=<app>&room=<room>&id=<peer id>
   The server only forwards messages; the game logic stays in the browsers (see js/net/).

   Client → server  { k: 'msg', a: action, d: data, to?: peerId }
   Server → client  { k: 'peers', ids }          on connect: who is already in the room
                    { k: 'join', id } / { k: 'leave', id }
                    { k: 'msg', a, d, from }

   Run locally: npm install && npm start   (PORT defaults to 8787) */
const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT) || 8787;
const MAX_ROOM = 60;          // drivers per room
const MAX_MSG = 16 * 1024;    // bytes per message
const RATE = 80;              // messages per second per socket (cars send 10)
const ID = /^[A-Za-z0-9_-]{4,40}$/, NAME = /^[A-Za-z0-9_.:-]{1,64}$/;

const rooms = new Map(); // "app/room" → Map(id → socket)

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    let drivers = 0; rooms.forEach(r => (drivers += r.size));
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size, drivers }));
    return;
  }
  res.writeHead(404); res.end();
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: MAX_MSG });

const send = (ws, obj) => { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj)); };

wss.on('connection', (ws, req) => {
  const q = new URL(req.url, 'http://x').searchParams;
  const app = q.get('app'), room = q.get('room'), id = q.get('id');
  if (!NAME.test(app || '') || !NAME.test(room || '') || !ID.test(id || '')) { ws.close(1008, 'bad params'); return; }
  const key = `${app}/${room}`;
  let peers = rooms.get(key);
  if (!peers) rooms.set(key, (peers = new Map()));
  // The same driver reconnecting (a phone back from the lock screen) replaces its old socket.
  const old = peers.get(id);
  if (old) { old.replaced = true; old.terminate(); }
  else if (peers.size >= MAX_ROOM) { ws.close(1013, 'room full'); return; }

  send(ws, { k: 'peers', ids: [...peers.keys()] });
  if (!old) peers.forEach(p => send(p, { k: 'join', id }));
  peers.set(id, ws);

  ws.alive = true;
  ws.on('pong', () => { ws.alive = true; });
  let windowStart = Date.now(), count = 0;
  ws.on('message', raw => {
    const now = Date.now();
    if (now - windowStart > 1000) { windowStart = now; count = 0; }
    if (++count > RATE) return;
    let m;
    try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || m.k !== 'msg' || typeof m.a !== 'string' || m.a.length > 16) return;
    const out = JSON.stringify({ k: 'msg', a: m.a, d: m.d, from: id });
    if (typeof m.to === 'string') { const t = peers.get(m.to); if (t && t.readyState === t.OPEN) t.send(out); return; }
    peers.forEach((p, pid) => { if (pid !== id && p.readyState === p.OPEN) p.send(out); });
  });
  ws.on('close', () => {
    if (ws.replaced || peers.get(id) !== ws) return;
    peers.delete(id);
    peers.forEach(p => send(p, { k: 'leave', id }));
    if (!peers.size) rooms.delete(key);
  });
});

// Drop sockets that stopped answering (phones that lost signal); also keeps idle proxies from closing them.
setInterval(() => wss.clients.forEach(ws => {
  if (!ws.alive) { ws.terminate(); return; }
  ws.alive = false; ws.ping();
}), 25000);

server.listen(PORT, () => console.log(`island relay on :${PORT}`));
