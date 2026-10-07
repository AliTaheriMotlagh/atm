import { $, reduceMotion } from './util.js';

let toastTimer = 0;
export function toast(html, color) {
  const el = $('#toast');
  el.innerHTML = html; el.style.setProperty('--pc', color || 'var(--accent)');
  el.hidden = false; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.hidden = true), 2800);
}

// Confetti burst on a full-screen canvas that only exists while pieces are falling.
const fx = { cv: $('#fx'), parts: [], raf: 0 };
export function confetti(colors, n = 110) {
  if (reduceMotion) return;
  const cv = fx.cv, dpr = Math.min(devicePixelRatio || 1, 2), x = cv.getContext('2d');
  if (!fx.raf) { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); cv.hidden = false; }
  for (let i = 0; i < n; i++) fx.parts.push({
    x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.4, y: innerHeight * 0.38,
    vx: (Math.random() - 0.5) * 11, vy: -4 - Math.random() * 11, r: Math.random() * 6.3, vr: (Math.random() - 0.5) * 0.35,
    w: 6 + Math.random() * 6, h: 4 + Math.random() * 4, c: colors[i % colors.length], life: 1
  });
  const step = () => {
    x.clearRect(0, 0, innerWidth, innerHeight);
    fx.parts = fx.parts.filter(p => {
      p.vy += 0.3; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.007;
      if (p.life <= 0 || p.y > innerHeight + 20) return false;
      x.save(); x.globalAlpha = Math.min(1, p.life * 2); x.translate(p.x, p.y); x.rotate(p.r);
      x.fillStyle = p.c; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); x.restore();
      return true;
    });
    if (fx.parts.length) fx.raf = requestAnimationFrame(step);
    else { fx.raf = 0; cv.hidden = true; }
  };
  if (!fx.raf) fx.raf = requestAnimationFrame(step);
}
