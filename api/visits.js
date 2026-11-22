/* Vercel serverless function: the island's visit counter.

   GET  /api/visits → { visits }
   POST /api/visits → { visits }   (increments the counter)

   The running total lives in the serverless instance's memory; a single warm instance per region keeps it simple.
   When the free tier is not enough, swap the in-memory variable for Vercel KV / Upstash / a database —
   the response shape stays `{ visits }`.

   Run locally: `npx vercel dev` (or `vercel dev`) from the project root. */
let visits = 0;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'GET') { res.status(200).json({ visits }); return; }
  if (req.method === 'POST') { visits += 1; res.status(200).json({ visits }); return; }
  res.setHeader('Allow', 'GET, POST');
  res.status(405).end();
};
