import { $, esc } from '../core/util.js';
import { app } from '../core/app.js';

/* Recent commit messages for a dossier, straight from the GitHub API (cached per session). */
const commitCache = new Map();
function repoSlug(url) {
  try {
    const u = new URL(url); const bits = u.pathname.replace(/^\/+|\/+$/g, '').split('/');
    return u.hostname === 'github.com' && bits.length === 2 ? bits.join('/') : null;
  } catch (e) { return null; }
}
function shortDate(iso) {
  try { return new Intl.DateTimeFormat(undefined, { year:'numeric', month:'short', day:'numeric' }).format(new Date(iso)); }
  catch (e) { return iso || ''; }
}
export async function loadCommits(p) {
  const box = $('#d-commits'), sec = $('#d-commits-sec');
  const repos = p.repos.map(r => ({...r, slug:repoSlug(r.url)})).filter(r => r.slug);
  sec.hidden = repos.length === 0;
  if (!repos.length) return;
  box.innerHTML = '<div class="commit-loading">Loading latest GitHub commits…</div>';
  const all = [];
  await Promise.all(repos.map(async r => {
    try {
      let data = commitCache.get(r.slug);
      if (!data) {
        const res = await fetch(`https://api.github.com/repos/${r.slug}/commits?per_page=5`, { headers: { Accept:'application/vnd.github+json' } });
        if (!res.ok) throw new Error(`GitHub ${res.status}`);
        data = await res.json(); commitCache.set(r.slug, data);
      }
      data.slice(0,5).forEach(c => all.push({ repo:r.label || r.slug.split('/')[1], slug:r.slug, sha:c.sha, html:c.html_url, message:(c.commit?.message || '').split('\n')[0], author:c.commit?.author?.name || c.author?.login || 'Unknown', date:c.commit?.author?.date }));
    } catch (e) { all.push({ repo:r.label || r.slug.split('/')[1], error:true, message:'Commit history unavailable (GitHub rate limit or network/CORS issue).' }); }
  }));
  if (app.current !== p) return;
  all.sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')));
  box.innerHTML = all.map(c => c.error
    ? `<div class="commit-card"><span class="commit-repo">${esc(c.repo)}</span><span class="commit-loading">${esc(c.message)}</span></div>`
    : `<div class="commit-card"><a href="${esc(c.html)}" target="_blank" rel="noopener">${esc(c.message || '(no commit message)')}</a><div class="commit-meta"><span class="commit-repo">${esc(c.repo)}</span><span>${esc(c.author)}</span><span>${esc(shortDate(c.date))}</span><span>${esc(c.sha.slice(0,7))}</span></div></div>`).join('');
}
