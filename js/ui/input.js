import { $, buzz } from '../core/util.js';

/* Driving input: held keys (filled in by shell.js) and the touch joystick and boost. */
export const keys = {};
export const input = { jx: 0, jy: 0, boost: false };

export function initInput(honk) {
  addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  const el = $('#stick'), knob = el.querySelector('i'); let id = null;
  const move = e => {
    const r = el.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy; const m = Math.hypot(dx, dy), R = r.width / 2 - 14;
    if (m > R) { dx *= R / m; dy *= R / m; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    // Small dead zone so a resting thumb doesn't creep the car forward.
    const dead = v => (Math.abs(v) < 0.12 ? 0 : v);
    input.jx = dead(dx / R); input.jy = dead(dy / R);
  };
  el.addEventListener('pointerdown', e => { id = e.pointerId; try { el.setPointerCapture(id); } catch (err) {} move(e); buzz(8); });
  el.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
  const end = e => { if (e.pointerId !== id) return; id = null; input.jx = input.jy = 0; knob.style.transform = ''; };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  const b = $('#boost');
  b.addEventListener('pointerdown', () => { input.boost = true; b.classList.add('on'); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => { input.boost = false; b.classList.remove('on'); }));
  $('#horn').addEventListener('pointerdown', e => { e.preventDefault(); honk(); });
}
