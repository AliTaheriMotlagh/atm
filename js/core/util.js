/* Small DOM, maths and formatting helpers shared by every module. */
export const $ = s => document.querySelector(s);
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmt = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const shake = el => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };
export const hexNum = h => parseInt(h.slice(1), 16);
export function inkFor(hex) {
  const n = hexNum(hex), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#1d1500' : '#ffffff';
}
export const prettyUrl = u => u.replace(/^https?:\/\//, '').replace(/\/$/, '');
export const TAU = Math.PI * 2;
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = matchMedia('(pointer: coarse)').matches;
// Short vibration on phones for hits, coins and wins. Silently ignored where unsupported (e.g. iOS Safari).
export const buzz = p => { if (isTouch && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };

export function fmtTime(sec) {
  sec = Math.max(0, sec); const m = Math.floor(sec / 60), s = sec - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}
export const ordinal = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

export function copyText(btn, text) {
  const done = () => { const o = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => (btn.textContent = o), 1400); };
  const fallback = () => {
    const el = btn.parentElement.querySelector('.lv, pre');
    if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = 'Selected'; setTimeout(() => (btn.textContent = 'Copy'), 1400); }
  };
  try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
}
