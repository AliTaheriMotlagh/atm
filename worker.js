/* Cloudflare Worker entry point.

   The site stays deployable to Cloudflare Pages (functions/api/visits.js) and Vercel
   (api/visits.js, api/turn.js). This file gives the same API on a plain Worker, which is what
   `wrangler deploy` builds: static files come from the ASSETS binding, /api/* is handled here.
   Configuration lives in wrangler.jsonc. */

import { onRequest as visits } from './functions/api/visits.js';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json; charset=utf-8'
    }
  });

/* Same behaviour as api/turn.js, rewritten against the Workers fetch API. */
async function turn(env) {
  try {
    if (env.CLOUDFLARE_TURN_KEY_ID && env.CLOUDFLARE_TURN_API_TOKEN) {
      const r = await fetch(
        `https://rtc.live.cloudflare.com/v1/turn/keys/${env.CLOUDFLARE_TURN_KEY_ID}/credentials/generate-ice-servers`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.CLOUDFLARE_TURN_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ttl: 86400 })
        }
      );
      if (!r.ok) throw new Error(`Cloudflare TURN ${r.status}`);
      const { iceServers = [] } = await r.json();
      // Browsers block port 53, and a URL there only stalls ICE gathering.
      const clean = iceServers
        .map((s) => ({ ...s, urls: [].concat(s.urls).filter((u) => !/:53(\?|$)/.test(u)) }))
        .filter((s) => s.urls.length && s.username);
      return json({ provider: 'cloudflare', iceServers: clean });
    }

    if (env.TURN_URLS && env.TURN_USERNAME && env.TURN_CREDENTIAL) {
      const urls = env.TURN_URLS.split(',').map((u) => u.trim()).filter(Boolean);
      return json({
        provider: 'static',
        iceServers: [{ urls, username: env.TURN_USERNAME, credential: env.TURN_CREDENTIAL }]
      });
    }

    return json({ provider: null, iceServers: [] });
  } catch (e) {
    return json({ provider: null, iceServers: [], error: String(e.message || e) });
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/visits' || pathname === '/api/visits/') {
      return visits({ request, env });
    }
    if (pathname === '/api/turn' || pathname === '/api/turn/') {
      return turn(env);
    }
    if (pathname.startsWith('/api/')) {
      return json({ error: 'Not Found' }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
