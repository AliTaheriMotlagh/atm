/* Vercel serverless function: the island's visit counter.

   GET  /api/visits → { visits }
   POST /api/visits → { visits }   (increments the counter)

   The twin at functions/api/visits.js does the same job on Cloudflare Pages. The running total
   lives in the serverless instance's memory; a single warm instance per region keeps it simple.
   When the free tier is not enough, swap the in-memory variable for Vercel KV / Upstash / a database —
   the response shape stays `{ visits }`.

   Run locally: `npx vercel dev` (or `vercel dev`) from the project root. */
let visits = 0;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method === 'GET') { res.status(200).json({ visits }); return; }
  if (req.method === 'POST') { visits += 1; res.status(200).json({ visits }); return; }
  res.setHeader('Allow', 'GET, POST, OPTIONS');
  res.status(405).json({ error: 'Method Not Allowed' });
};
