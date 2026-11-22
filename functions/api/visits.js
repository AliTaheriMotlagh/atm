/* Cloudflare Pages Function for the island's visit counter.

   Cloudflare Pages does NOT run Vercel-style Node functions from /api — it routes /api/* to
   files in /functions. This file is the Cloudflare twin of api/visits.js (which stays for Vercel,
   where the /api folder is used instead).

   GET  /api/visits → { visits }
   POST /api/visits → { visits }   (increments the counter)

   For a count that survives worker restarts, bind a KV namespace in the Cloudflare dashboard
   (Workers & Pages → this project → Settings → Functions → KV namespace bindings) with the
   variable name VISITS, then the number is stored under the key "count". With no binding it
   falls back to a per-isolate in-memory value, so the number resets when that isolate is
   recycled — bind KV for a real, durable global count. The browser response is always { visits }. */

const KEY = 'count';
let memory = 0; // fallback only, used when no KV binding is configured

const headers = {
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json; charset=utf-8'
};

const send = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers });

async function readCount(env) {
  if (env && env.VISITS && typeof env.VISITS.get === 'function') {
    try {
      const v = await env.VISITS.get(KEY, 'text');
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0) return Math.floor(n);
    } catch (e) { /* KV read failed — fall through to memory */ }
  }
  return memory;
}

async function writeCount(env, n) {
  memory = n;
  if (env && env.VISITS && typeof env.VISITS.put === 'function') {
    try { await env.VISITS.put(KEY, String(n)); } catch (e) { /* memory still updated */ }
  }
}

export async function onRequest({ request, env }) {
  // CORS preflight (browsers send this for JSON POSTs from another origin).
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

  if (request.method === 'GET') {
    return send({ visits: await readCount(env) });
  }

  if (request.method === 'POST') {
    const next = await readCount(env) + 1;
    await writeCount(env, next);
    return send({ visits: next });
  }

  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: { ...headers, Allow: 'GET, POST, OPTIONS' }
  });
}
