/* A WebSocket transport with the same shape as the parts of Trystero the island uses
   (selfId, joinRoom → makeAction / onPeerJoin / onPeerLeave / leave), so net.js works with either.
   Messages go through the relay in server/index.js. Sockets reconnect on their own with back-off,
   and wake() reconnects at once (used when a phone comes back from the lock screen). */
export function socketLib(url, onStatus) {
  const selfId = Array.from(crypto.getRandomValues(new Uint8Array(15)), b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
  const rooms = new Set();
  const report = () => onStatus?.([...rooms].some(r => r.open) ? 'online' : 'connecting');

  function joinRoom(config, roomId) {
    const actions = new Map(), peers = new Set();
    let ws = null, closed = false, retry = 0, timer = 0;
    const room = { open: false, onPeerJoin: null, onPeerLeave: null };
    const add = id => { if (id === selfId || peers.has(id)) return; peers.add(id); room.onPeerJoin?.(id); };
    const drop = id => { if (peers.delete(id)) room.onPeerLeave?.(id); };

    function connect() {
      clearTimeout(timer);
      const s = ws = new WebSocket(`${url}?app=${encodeURIComponent(config.appId)}&room=${encodeURIComponent(roomId)}&id=${selfId}`);
      s.onopen = () => { if (s !== ws) return; retry = 0; room.open = true; report(); };
      s.onmessage = e => {
        if (s !== ws) return;
        let m; try { m = JSON.parse(e.data); } catch (err) { return; }
        if (m.k === 'peers' && Array.isArray(m.ids)) {
          // After a reconnect, anyone who left meanwhile is gone; everyone listed is (still) here.
          [...peers].filter(id => !m.ids.includes(id)).forEach(drop);
          m.ids.forEach(add);
        } else if (m.k === 'join') add(m.id);
        else if (m.k === 'leave') drop(m.id);
        else if (m.k === 'msg') { add(m.from); actions.get(m.a)?.onMessage?.(m.d, { peerId: m.from }); }
      };
      s.onclose = () => {
        if (s !== ws) return;
        room.open = false; report();
        if (!closed) timer = setTimeout(connect, Math.min(15000, 800 * 2 ** retry++));
      };
    }
    room.makeAction = name => {
      const a = {
        onMessage: null,
        send(data, opt) {
          if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ k: 'msg', a: name, d: data, to: opt?.target }));
          return Promise.resolve();
        }
      };
      actions.set(name, a);
      return a;
    };
    room.wake = () => { if (closed) return; const s = ws; ws = null; try { s?.close(); } catch (e) {} room.open = false; retry = 0; connect(); };
    room.leave = () => { closed = true; clearTimeout(timer); rooms.delete(room); try { ws?.close(); } catch (e) {} peers.forEach(drop); report(); };
    rooms.add(room);
    connect(); report();
    return room;
  }
  return { selfId, joinRoom, wake: () => rooms.forEach(r => r.wake()) };
}
