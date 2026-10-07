/* Vercel serverless function: GET /api/turn → { iceServers: [...] } for the island's multiplayer.

   Phones on mobile data usually can't reach a desktop browser directly (carrier NAT), so WebRTC needs a
   TURN relay for those pairs. Credentials are made here so no secret ships to the browser.
   Set ONE of these in Vercel → Project → Settings → Environment Variables:

   Cloudflare (free tier: 1,000 GB/month), from Cloudflare dashboard → Realtime → TURN → Create key:
     CLOUDFLARE_TURN_KEY_ID, CLOUDFLARE_TURN_API_TOKEN
   Any TURN server with a fixed login (Metered, coturn, …):
     TURN_URLS (comma-separated, e.g. "turn:a.relay.metered.ca:80,turns:a.relay.metered.ca:443?transport=tcp"),
     TURN_USERNAME, TURN_CREDENTIAL

   With neither set it answers { iceServers: [] } and players still connect wherever a direct path exists. */
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const env = process.env;
  try {
    if (env.CLOUDFLARE_TURN_KEY_ID && env.CLOUDFLARE_TURN_API_TOKEN) {
      const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${env.CLOUDFLARE_TURN_KEY_ID}/credentials/generate-ice-servers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.CLOUDFLARE_TURN_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl: 86400 })
      });
      if (!r.ok) throw new Error(`Cloudflare TURN ${r.status}`);
      const { iceServers = [] } = await r.json();
      // Browsers block port 53, and a URL there only stalls ICE gathering.
      const clean = iceServers
        .map(s => ({ ...s, urls: [].concat(s.urls).filter(u => !/:53(\?|$)/.test(u)) }))
        .filter(s => s.urls.length && s.username);
      res.status(200).json({ provider: 'cloudflare', iceServers: clean });
      return;
    }
    if (env.TURN_URLS && env.TURN_USERNAME && env.TURN_CREDENTIAL) {
      const urls = env.TURN_URLS.split(',').map(u => u.trim()).filter(Boolean);
      res.status(200).json({ provider: 'static', iceServers: [{ urls, username: env.TURN_USERNAME, credential: env.TURN_CREDENTIAL }] });
      return;
    }
    res.status(200).json({ provider: null, iceServers: [] });
  } catch (e) {
    res.status(200).json({ provider: null, iceServers: [], error: String(e.message || e) });
  }
};
