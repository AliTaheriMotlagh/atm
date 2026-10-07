import { $, esc, fmt, inkFor, prettyUrl } from '../core/util.js';
import { app, setMode } from '../core/app.js';
import { ALL, TOUR, byId } from '../projects/index.js';
import { gameDossier } from '../progress.js';
import { closeGame } from '../games/runner.js';
import { refreshChallenges } from '../games/arcade.js';
import { world } from '../world/world.js';
import { loadCommits } from './commits.js';
import { showPreview, unloadSite } from './preview.js';

/* The project dossier: header, links, challenges, commits, and the Pitch / Design / Tech / Docs tabs. */
const dEl = $('#dossier');
export const dossierOpen = () => !dEl.hidden;

function linkRow(k, url, label) {
  if (!url) return `<div class="lrow"><span class="lk">${esc(k)}</span><span class="lv none">${esc(label)}</span><span></span></div>`;
  return `<div class="lrow"><span class="lk">${esc(k)}</span><a class="lv" href="${esc(url)}" target="_blank" rel="noopener">${esc(prettyUrl(url))}</a><button class="copy" type="button" data-copy="${esc(url)}">Copy</button></div>`;
}
const list = items => items.map(i => `<li>${fmt(i)}</li>`).join('');

export function renderTab(p, tab) {
  const b = [];
  if (tab === 'pitch') {
    b.push(`<p class="oneliner">${fmt(p.pitch.line)}</p>`);
    b.push(`<dl class="pitch">${p.pitch.rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${fmt(v)}</dd></div>`).join('')}</dl>`);
  } else if (tab === 'design') {
    p.design.forEach(s => b.push(`<section><h3>${esc(s.h)}</h3><ul>${list(s.items)}</ul></section>`));
  } else if (tab === 'tech') {
    const t = p.tech;
    if (t.numbers) b.push(`<div class="stats">${t.numbers.map(([v, l]) => `<div class="stat"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>`);
    b.push(`<section><h3>Stack</h3><div class="tbl-wrap"><table>${t.stack.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${fmt(v)}</td></tr>`).join('')}</table></div></section>`);
    (t.arch || []).forEach(s => {
      const tag = s.ordered ? 'ol' : 'ul';
      b.push(`<section><h3>${esc(s.h)}</h3><${tag}>${list(s.items)}</${tag}></section>`);
    });
  } else if (tab === 'docs') {
    const d = p.docs;
    if (d.note) b.push(`<div class="callout">${fmt(d.note)}</div>`);
    d.steps.forEach(s => b.push(`<div><div class="code-t">${esc(s.t)}</div><div class="code"><pre>${esc(s.code)}</pre><button class="copy" type="button" data-copy="${esc(s.code)}">Copy</button></div></div>`));
    if (d.tree) b.push(`<section><h3>Structure</h3><div class="code"><pre>${esc(d.tree)}</pre></div></section>`);
    (d.extra || []).forEach(s => b.push(`<section><h3>${esc(s.h)}</h3><ul>${list(s.items)}</ul></section>`));
  }
  $('#d-body').innerHTML = b.join('');
  document.querySelectorAll('#d-tabs button').forEach(el => {
    const on = el.dataset.tab === tab;
    el.setAttribute('aria-selected', String(on)); el.tabIndex = on ? 0 : -1;
  });
  $('#d-body').setAttribute('aria-labelledby', `tab-${tab}`);
}

// GitHub social cards; each removes itself if the host blocks remote images.
function renderCards(p) {
  const gh = $('#d-gh'); gh.innerHTML = '';
  p.repos.filter(r => r.url.split('/').length === 5).forEach(r => {
    const repo = r.url.split('/').pop();
    const a = document.createElement('a'); a.href = r.url; a.target = '_blank'; a.rel = 'noopener';
    const im = document.createElement('img'); im.alt = `GitHub card for ${repo}`; im.loading = 'lazy';
    im.onerror = () => a.remove();
    im.src = `https://opengraph.githubassets.com/1/AliTaheriMotlagh/${repo}`;
    a.appendChild(im); gh.appendChild(a);
  });
}

export function openDossier(id, opts = {}) {
  const p = byId[id]; if (!p) return;
  app.current = p;
  gameDossier(id);
  loadCommits(p);
  refreshChallenges();
  dEl.style.setProperty('--pc', p.color);
  dEl.style.setProperty('--pc-ink', inkFor(p.color));
  const idx = TOUR.indexOf(p);
  $('#d-kicker').textContent = p.home ? 'Home base · the house in the middle' : `Stop ${idx + 1} of ${TOUR.length} · ${p.lang}`;
  $('#d-title').textContent = p.name;
  $('#d-tag').textContent = p.tagline;
  $('#d-chips').innerHTML = (p.live ? `<span class="live">● Live</span>` : '') + p.chips.map(c => `<span>${esc(c)}</span>`).join('');
  const rows = [];
  p.repos.forEach(r => rows.push(linkRow(r.label || 'Repository', r.url)));
  if (!p.home) rows.push(linkRow('Website', p.site, 'No website, code only'));
  (p.extraLinks || []).forEach(l => rows.push(linkRow(l.k, l.url)));
  $('#d-links').innerHTML = rows.join('');
  const co = $('#d-callout'); co.hidden = !p.inferred; co.textContent = p.inferred || '';
  const tabs = p.tabs || { pitch: 'Pitch', design: 'Design', tech: 'Tech', docs: 'Docs' };
  $('#d-tabs').innerHTML = Object.entries(tabs).map(([k, v]) => `<button type="button" role="tab" id="tab-${k}" aria-controls="d-body" data-tab="${k}">${esc(v)}</button>`).join('');
  renderTab(p, 'pitch');
  showPreview(p);
  renderCards(p);

  dEl.hidden = false; dEl.scrollTop = 0;
  $('#intro').hidden = true; $('#drawer').hidden = true; $('#prompt').hidden = true;
  try { history.replaceState(null, '', '#' + p.id); } catch (e) {}
  world.focus(p.id, opts.teleport !== false);
  setMode('dossier');
  $('#d-x').focus({ preventScroll: true });
}

export function closeDossier() {
  closeGame();
  unloadSite();
  dEl.hidden = true; app.current = null;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  setMode(world.ok ? 'drive' : 'intro');
  if (!world.ok) $('#intro').hidden = false;
}

function step(dir) {
  if (!app.current) return;
  const i = ALL.indexOf(app.current);
  openDossier(ALL[(i + dir + ALL.length) % ALL.length].id);
}

export function initDossier() {
  $('#d-x').onclick = closeDossier;
  $('#d-prev').onclick = () => step(-1);
  $('#d-next').onclick = () => step(1);
  // Arrow keys, Home and End move between dossier tabs (WAI-ARIA tabs pattern).
  $('#d-tabs').addEventListener('keydown', e => {
    const tabs = [...e.currentTarget.querySelectorAll('[role=tab]')], i = tabs.indexOf(document.activeElement);
    if (i < 0 || !app.current) return;
    const j = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
    if (j === undefined) return;
    e.preventDefault(); tabs[j].focus(); renderTab(app.current, tabs[j].dataset.tab);
  });
}
