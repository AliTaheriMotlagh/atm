/* Where multiplayer traffic goes.

   NET_SERVER: the WebSocket relay from server/ (e.g. 'wss://island-server.onrender.com/ws').
   Every phone and desktop connects to it, so they play together on any network. Leave it empty to fall back
   to browser-to-browser WebRTC (Trystero), which needs no server but often fails between a phone on mobile
   data and a desktop (see api/turn.js for the relay that helps there).

   For local testing, ?server=ws://localhost:8787/ws overrides it when the page itself runs on localhost. */
export const NET_SERVER = 'wss://island-server-qg2n.onrender.com';

export function netServer() {
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  const q = new URLSearchParams(location.search).get('server');
  if (local && q && /^wss?:\/\/[\w.:-]+\/[\w/-]*$/.test(q)) return q;
  return NET_SERVER;
}
