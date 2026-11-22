/* Island visit counter: asks /api/visits for the running total, then shows it.

   Works on both hosts: Vercel serves api/visits.js, Cloudflare Pages serves functions/api/visits.js.
   The response is always { visits }, and we never let a 404/HTML response render a bare "0". */
let done = false;
const SESSION = 'island-visit-counted';
const LAST = 'island-visits-last';
const fmt = n => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

export async function initVisits() {
  if (done) return; done = true;
  const el = document.getElementById('visit-n'); if (!el) return;

  // Show the last known number immediately (no flash of 0 while the request is in flight).
  let last = 0;
  try { last = Number(localStorage.getItem(LAST)) || 0; } catch (e) {}
  if (last > 0) el.textContent = fmt(last);

  // Count one visit per browsing session: reloading/returning in the same tab should not inflate it.
  let counted = false;
  try { counted = sessionStorage.getItem(SESSION) === '1'; } catch (e) {}
  const init = counted
    ? { cache: 'no-store' }
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' };

  try {
    const r = await fetch('/api/visits', init);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const n = Number(j && j.visits);
    if (!Number.isFinite(n) || n < 0) throw new Error('bad payload');
    if (!counted) { try { sessionStorage.setItem(SESSION, '1'); } catch (e) {} }
    try { localStorage.setItem(LAST, String(n)); } catch (e) {}
    el.textContent = fmt(n);
  } catch (e) {
    // Endpoint unavailable (offline, wrong host, misconfigured function): keep the last known
    // number, or at least count this visitor, instead of the misleading "0".
    el.textContent = fmt(Math.max(last, 1));
  }
}
