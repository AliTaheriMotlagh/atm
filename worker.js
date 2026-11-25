/* Cloudflare Worker entry point (what `wrangler deploy` builds; config in wrangler.jsonc).

   Static files come from the ASSETS binding; /api/* is handled here.

   Visit counter: a single SQLite-backed Durable Object ("VisitCounter"). Durable Objects run one
   instance per id worldwide and process requests one at a time, so every increment is atomic and
   every visitor sees the same number. This works on the Workers Free plan. The previous version kept
   the count in Worker memory, which is per-isolate: each data centre / recycled isolate had its own
   number, so visitors saw different, resetting counts.

   functions/api/visits.js stays for Cloudflare Pages, and api/*.js for Vercel. */

import { DurableObject } from 'cloudflare:workers';
import { onRequest as visitsFallback } from './functions/api/visits.js';

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json; charset=utf-8',
      ...extra
    }
  });

/* One global counter. Storage persists across deploys and restarts. */
export class VisitCounter extends DurableObject {
  async get() {
    return (await this.ctx.storage.get('count')) || 0;
  }
  async increment() {
    // The input gate keeps other requests out between this get and put, so no increment is lost.
    const next = ((await this.ctx.storage.get('count')) || 0) + 1;
    await this.ctx.storage.put('count', next);
    return next;
  }
}

// Crawlers, link previewers and headless browsers that run JS should not count as visitors.
const BOT = /bot|crawl|spider|slurp|preview|fetch|monitor|lighthouse|headless|pagespeed|gtmetrix|curl|wget|python|axios|node-fetch|go-http|java\//i;

async function visits(request, env) {
  if (!env.VISIT_COUNTER) return visitsFallback({ request, env }); // e.g. binding not deployed yet

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store'
      }
    });
  }

  const counter = env.VISIT_COUNTER.get(env.VISIT_COUNTER.idFromName('global'));
  try {
    if (request.method === 'GET') return json({ visits: await counter.get() });
    if (request.method === 'POST') {
      const ua = request.headers.get('User-Agent') || '';
      const isBot = !ua || BOT.test(ua);
      return json({ visits: isBot ? await counter.get() : await counter.increment() });
    }
  } catch (e) {
    return json({ error: 'counter unavailable' }, 503);
  }
  return json({ error: 'Method Not Allowed' }, 405, { Allow: 'GET, POST, OPTIONS' });
}

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

    if (pathname === '/api/visits' || pathname === '/api/visits/') return visits(request, env);
    if (pathname === '/api/turn' || pathname === '/api/turn/') return turn(env);
    if (pathname.startsWith('/api/')) return json({ error: 'Not Found' }, 404);

    return env.ASSETS.fetch(request);
  }
};
