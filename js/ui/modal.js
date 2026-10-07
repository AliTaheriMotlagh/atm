import { $ } from '../core/util.js';
import { sfx } from '../core/sfx.js';

// On phones the modals are bottom sheets: drag the header down to dismiss.
export function sheetSwipe(modal, close) {
  const box = modal.querySelector('.game-box'); let y0 = null, dy = 0;
  box.addEventListener('touchstart', e => {
    if (innerWidth > 640 || box.scrollTop > 0 || e.touches.length > 1 || !e.target.closest('.game-head, .sheet-grip')) return;
    y0 = e.touches[0].clientY; dy = 0;
  }, { passive: true });
  box.addEventListener('touchmove', e => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); box.style.transform = `translateY(${dy}px)`; }, { passive: true });
  const end = () => { if (y0 == null) return; y0 = null; box.style.transform = ''; if (dy > 90) close(); };
  box.addEventListener('touchend', end); box.addEventListener('touchcancel', end);
}

/* A dialog layer (arcade, cinema, social, online): opens over the island, closes from its × button, the
   backdrop, Escape (see shell.js) or a swipe down on phones, and gives focus back to whatever opened it.
   onOpen runs after the layer is shown and may return the element to focus. */
export function modal(el, { closeBtn, onOpen, onClose }) {
  let ret = null;
  const m = {
    el,
    get isOpen() { return !el.hidden; },
    open(...args) {
      sfx.unlock();
      if (el.hidden) ret = document.activeElement;
      el.hidden = false; $('#drawer').hidden = true;
      el.querySelector('.game-box').scrollTop = 0;
      const f = onOpen?.(...args);
      (f || closeBtn).focus({ preventScroll: true });
    },
    close() {
      if (el.hidden) return;
      onClose?.();
      el.hidden = true;
      if (ret && ret.isConnected) ret.focus({ preventScroll: true });
    }
  };
  closeBtn.onclick = m.close;
  el.addEventListener('click', e => { if (e.target === el) m.close(); });
  sheetSwipe(el, m.close);
  return m;
}
