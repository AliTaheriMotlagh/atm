/* Visit counter: asks /api/visits for the running total, then shows it.

   The Worker keeps one global count in a Durable Object (see worker.js). A browser tab counts once
   per session (reloads don't inflate it); the server ignores bots. If the endpoint is unreachable we
   show the last number this browser saw, or a dash — never an invented value. */
let done = false;
const SESSION = 'island-visit-counted';
const LAST = 'island-visits-last';
const fmt = n => n >= 100000
  ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
  : new Intl.NumberFormat('en-US').format(n);

// Count up from the previous value so the number feels alive.
function show(el, to, from = 0) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !(to > from) || to - from > 5000) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), dur = Math.min(1200, 300 + (to - from) * 8);
  const tick = now => {
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(Math.round(from + (to - from) * e));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export async function initVisits() {
  if (done) return; done = true;
  const el = document.getElementById('visit-n'); if (!el) return;

  let last = 0;
  try { last = Number(localStorage.getItem(LAST)) || 0; } catch (e) {}
  if (last > 0) el.textContent = fmt(last);

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
    show(el, n, last);
    el.closest('[data-visits]')?.classList.add('ok');
  } catch (e) {
    el.textContent = last > 0 ? fmt(last) : '—';
  }
}
