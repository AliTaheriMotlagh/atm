import { shuffle, shake } from '../core/util.js';
import { sfx } from '../core/sfx.js';

/* Building blocks shared by several challenges. Each challenge is `run(c)`, where c is the context from runner.js. */

export const secs = v => `${v.toFixed(1)} s`;

// Keeps keyboard focus on a still-enabled control after the focused one gets disabled.
export function keepFocus(btn, scope) {
  if (document.activeElement === btn) scope.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
}
// Ordered-tap game shared by Pre-flight Flow and Career Timeline. items are in the correct order.
export function orderGame(c, items, o) {
  const wrap = c.el('div', 'seq-game'), slots = c.el('ol', 'seq-slots'), opts = c.el('div', 'seq-opts');
  slots.innerHTML = items.map((_, i) => `<li>${i + 1}. …</li>`).join('');
  wrap.append(slots, opts); c.body.append(wrap);
  let pos = 0;
  shuffle(items.map((it, i) => ({ ...it, i }))).forEach(it => {
    const b = c.el('button', 'opt', it.label); opts.append(b);
    b.onclick = () => {
      if (c.won) return;
      if (it.i !== pos) { shake(b); c.fail(o.bad(it)); return; }
      b.classList.add('used'); b.disabled = true; keepFocus(b, opts);
      const li = slots.children[pos]; li.classList.add('on'); li.textContent = `${pos + 1}. ${it.label}${it.note ? ` · ${it.note}` : ''}`;
      pos++; sfx.tone(420 + pos * 70, 0.1);
      if (pos === items.length) c.win(o.win); else c.msg(`Correct, ${items.length - pos} to go.`, 'good');
    };
  });
  c.msg(o.intro);
}
