/* Island visit counter: asks the serverless endpoint how many visits the site has had, then shows it. */
let done = false;

export async function initVisits() {
  if (done) return; done = true;
  const el = document.getElementById('visit-n'); if (!el) return;
  try {
    const r = await fetch('/api/visits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const j = await r.json().catch(() => ({}));
    const n = Number(j.visits) || 0;
    el.textContent = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  } catch (e) { el.textContent = '0'; }
}
