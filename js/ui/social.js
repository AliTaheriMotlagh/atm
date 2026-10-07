import { $, esc } from '../core/util.js';
import { store } from '../core/store.js';
import { byId } from '../projects/index.js';
import { modal } from './modal.js';

/* X and LinkedIn posts. */
// Neither network offers a public "latest posts" feed for signed-out visitors, so posts are pinned here.
// x.posts: status IDs or post URLs. linkedin.posts: post URLs or the urn:li:… from LinkedIn's "Embed this post".
const SOCIAL = {
  x: { handle: 'Atmbanksepah', posts: [] },
  linkedin: { url: 'https://www.linkedin.com/in/alitaherimotlagh/', posts: [] },
};
const socEl = $('#social');
let socNet = store.get('island-social') === 'linkedin' ? 'linkedin' : 'x', socRun = 0, twttrP = null;
const xId = v => String(v).match(/(\d{10,})/)?.[1];
const liUrn = v => { const s = String(v), a = s.match(/activity-(\d+)/); return s.match(/urn:li:(?:share|ugcPost|activity):\d+/)?.[0] || (a ? `urn:li:activity:${a[1]}` : null); };
function loadX() {
  return twttrP || (twttrP = new Promise((res, rej) => {
    if (window.twttr?.widgets) return res(window.twttr);
    const sc = document.createElement('script'); sc.src = 'https://platform.twitter.com/widgets.js'; sc.async = true;
    sc.onload = () => (window.twttr ? window.twttr.ready(res) : rej());
    sc.onerror = () => { twttrP = null; rej(); };
    document.head.append(sc);
  }));
}
function renderSocial() {
  const run = ++socRun, panel = $('#soc-panel');
  socEl.querySelector('.game-box').style.setProperty('--pc', socNet === 'x' ? '#1d9bf0' : '#0a66c2');
  socEl.querySelectorAll('[data-net]').forEach(b => { const on = b.dataset.net === socNet; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  panel.setAttribute('aria-labelledby', `soc-tab-${socNet}`);
  if (socNet === 'x') {
    const { handle, posts } = SOCIAL.x, url = `https://x.com/${handle}`, ids = posts.map(xId).filter(Boolean);
    panel.innerHTML = `<div class="soc-card"><span class="soc-ico" aria-hidden="true">𝕏</span><b>@${esc(handle)}</b><small>Ali Taheri Motlagh on X</small>
      <div class="row"><a class="btn" href="${url}" target="_blank" rel="noopener">Follow on X ↗</a><a class="btn ghost" href="${url}" target="_blank" rel="noopener">See latest posts ↗</a></div></div>
      ${ids.length ? `<div class="soc-posts" id="soc-posts"><p class="soc-note">Loading posts…</p></div>` : ''}`;
    if (!ids.length) return;
    loadX().then(tw => {
      if (run !== socRun) return;
      const box = $('#soc-posts'); box.innerHTML = '';
      return Promise.all(ids.map(id => { const d = document.createElement('div'); box.append(d); return tw.widgets.createTweet(id, d, { theme: 'dark', dnt: true, align: 'center' }); }));
    }).catch(() => { if (run === socRun) $('#soc-posts').innerHTML = `<p class="soc-note">X didn't load here. <a href="${url}" target="_blank" rel="noopener">Read the posts on X ↗</a></p>`; });
  } else {
    const { url, posts } = SOCIAL.linkedin, me = byId.about, urns = posts.map(liUrn).filter(Boolean);
    panel.innerHTML = `<div class="soc-card"><span class="soc-ico" aria-hidden="true">in</span><b>${esc(me.name)}</b><small>${esc(me.tagline)}</small>
      <div class="row"><a class="btn" href="${url}" target="_blank" rel="noopener">Connect on LinkedIn ↗</a><a class="btn ghost" href="${url}recent-activity/all/" target="_blank" rel="noopener">Recent posts ↗</a></div></div>
      ${urns.length ? `<div class="soc-posts">${urns.map(u => `<iframe src="https://www.linkedin.com/embed/feed/update/${u}" height="560" loading="lazy" allowfullscreen title="LinkedIn post"></iframe>`).join('')}</div>` : ''}`;
  }
}

export const social = modal(socEl, {
  closeBtn: $('#soc-x'),
  onOpen(net) { if (net) socNet = net; renderSocial(); return socEl.querySelector('[aria-selected="true"]'); },
  onClose() { socRun++; }
});

export function initSocial() {
  socEl.addEventListener('click', e => {
    const t = e.target.closest('[data-net]');
    if (t && t.dataset.net !== socNet) { socNet = t.dataset.net; store.set('island-social', socNet); renderSocial(); }
  });
  socEl.querySelector('.soc-tabs').addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault(); socNet = socNet === 'x' ? 'linkedin' : 'x'; store.set('island-social', socNet);
    renderSocial(); socEl.querySelector('[aria-selected="true"]').focus();
  });
}
