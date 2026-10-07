import { $, esc, inkFor } from '../core/util.js';
import { app } from '../core/app.js';
import { on } from '../core/events.js';
import { ALL, GAMES, GAME_LIST, byId } from '../projects/index.js';
import { game, records } from '../progress.js';
import { modal } from '../ui/modal.js';

/* Challenge lists: three per landmark in each dossier, and all of them in the arcade. */
function challengeItem(g) {
  const p = byId[g.pid], done = game.cleared.has(g.id);
  const rec = g.record && records[g.id] != null ? `Best: ${g.record.fmt(records[g.id])}` : '';
  return `<button class="ch-item${done ? ' done' : ''}" type="button" data-game="${g.id}" style="--c:${p.color};--ci:${inkFor(p.color)}">
    <span class="ch-ico" aria-hidden="true">${g.icon}</span>
    <span class="ch-txt"><b>${esc(g.title)}</b><small>${esc(g.desc)}</small>${rec ? `<em>${esc(rec)}</em>` : ''}</span>
    <span class="ch-state">${done ? '✓ Cleared' : 'Play ▶'}</span></button>`;
}

export function refreshChallenges() {
  const p = app.current, sec = $('#d-challenges');
  if (!p || !GAMES[p.id]) { sec.hidden = true; return; }
  const list = GAMES[p.id], n = list.filter(g => game.cleared.has(g.id)).length;
  sec.hidden = false;
  $('#d-ch-count').textContent = `${n}/${list.length} cleared · +1 coin each${p.home ? ' · bonus' : ''}`;
  $('#d-ch-list').innerHTML = list.map(challengeItem).join('');
}

function renderArcade() {
  const n = game.cleared.size, total = GAME_LIST.length;
  $('#arc-title').textContent = `${total} challenges`;
  $('#arc-count').textContent = `${n}/${total} cleared`;
  $('#arc-bar').style.width = (n / total * 100) + '%';
  $('#arc-groups').innerHTML = ALL.map(p => {
    const list = GAMES[p.id], k = list.filter(g => game.cleared.has(g.id)).length;
    return `<section class="arc-group" style="--c:${p.color}"><h3><i></i>${esc(p.home ? 'About Ali · bonus' : p.name)}<small>${k}/${list.length}</small></h3><div class="ch-list">${list.map(challengeItem).join('')}</div></section>`;
  }).join('');
}

const arcEl = $('#arcade');
export const arcade = modal(arcEl, {
  closeBtn: $('#arc-x'),
  onOpen() { renderArcade(); return arcEl.querySelector('.ch-item:not(.done)'); }
});

export function initArcade() {
  on('progress', () => { refreshChallenges(); if (arcade.isOpen) renderArcade(); });
}
