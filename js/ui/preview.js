import { $, prettyUrl } from '../core/util.js';
import { app } from '../core/app.js';

/* The dossier's picture: a live iframe of the project's site, or the best image we can find for it. */
const imageCache = {};
// Landmark renders from the 3D scene, filled in by world/snapshots.js.
export const snapshots = {};

function tryLoad(src) {
  return new Promise(res => {
    const img = new Image(); let settled = false;
    const end = ok => { if (!settled) { settled = true; res(ok); } };
    img.onload = () => end(img.naturalWidth > 0); img.onerror = () => end(false);
    setTimeout(() => end(false), 3500);
    img.src = src;
  });
}
export async function resolveImage(p) {
  if (imageCache[p.id]) return imageCache[p.id];
  if (p.shots) { const src = await composeShots(p); if (src) return (imageCache[p.id] = { src, cap: `${p.name} screenshots` }); }
  for (const ext of ['png', 'jpg', 'webp']) {
    const src = `images/${p.id}.${ext}`;
    if (await tryLoad(src)) return (imageCache[p.id] = { src, cap: 'Screenshot' });
  }
  if (p.site) {
    const remoteShot = `https://image.thum.io/get/width/1200/crop/675/noanimate/${p.site}`;
    if (await tryLoad(remoteShot)) return (imageCache[p.id] = { src: remoteShot, cap: `Live website screenshot · ${prettyUrl(p.site)}` });
  }
  if (snapshots[p.id]) return (imageCache[p.id] = { src: snapshots[p.id], cap: `Rendered from the ${p.name} landmark on this island` });
  return { src: poster(p), cap: `${p.name} poster` };
}
export function poster(p) {
  const c = document.createElement('canvas'); c.width = 800; c.height = 450;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 800, 450); g.addColorStop(0, p.color); g.addColorStop(1, '#0d1628');
  x.fillStyle = g; x.fillRect(0, 0, 800, 450);
  x.fillStyle = 'rgba(255,255,255,.08)';
  for (let i = 0; i < 12; i++) x.fillRect(0, i * 40, 800, 1);
  x.fillStyle = '#fff'; x.font = '72px Bungee, "Arial Black", sans-serif'; x.fillText(p.name.toUpperCase(), 40, 250);
  x.font = '22px "JetBrains Mono", monospace'; x.fillStyle = 'rgba(255,255,255,.8)'; x.fillText(p.lang, 44, 295);
  return c.toDataURL('image/png');
}
// Phone screenshots (portrait) laid side by side on a 16:9 card in the project colour.
async function composeShots(p) {
  const imgs = (await Promise.all(p.shots.map(src => new Promise(res => {
    const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null); img.src = src;
  })))).filter(Boolean);
  if (!imgs.length) return null;
  const W = 1600, H = 900, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, p.color); g.addColorStop(1, '#0d1628');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const h = H - 120, gap = 50;
  const ws = imgs.map(im => h * im.naturalWidth / im.naturalHeight), total = ws.reduce((s, w) => s + w, 0) + gap * (imgs.length - 1);
  let left = (W - total) / 2;
  imgs.forEach((im, i) => {
    x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 30; x.shadowOffsetY = 12;
    x.fillStyle = '#000'; x.fillRect(left, 60, ws[i], h); x.restore();
    x.drawImage(im, left, 60, ws[i], h); left += ws[i] + gap;
  });
  return c.toDataURL('image/jpeg', 0.88);
}

/* Live website preview: an iframe of the real site, scaled down from desktop width, with an Expand mode that covers the screen. */
const canEmbed = p => !!p.site && p.embed !== false;
const site = $('#d-site'), siteWait = $('#d-wait'), shot = $('#d-shot');
let siteView = 'live', imgCap = '', waitTimer = 0;

function fitSite() {
  const w = shot.querySelector('.frame').clientWidth; if (!w) return;
  const vw = w < 480 ? 768 : 1280;
  site.style.width = vw + 'px'; site.style.height = vw * 9 / 16 + 'px';
  site.style.transform = `scale(${w / vw})`;
}
if (window.ResizeObserver) new ResizeObserver(fitSite).observe(shot.querySelector('.frame'));
else addEventListener('resize', fitSite);

export function setCaption() {
  const live = app.current && canEmbed(app.current) && !site.hidden;
  $('#d-cap').textContent = live ? `Live: ${prettyUrl(app.current.site)}, running inside this page. Expand it to use it full screen, or open a new tab if sign-in doesn't work here.` : imgCap;
}
export function showImage(p) {
  resolveImage(p).then(r => { if (app.current === p) { $('#d-img').src = r.src; imgCap = r.cap; setCaption(); } });
}
export function setView(v) {
  const p = app.current; if (!p) return;
  const live = v === 'live' && canEmbed(p);
  if (canEmbed(p)) siteView = v;
  document.querySelectorAll('#d-view button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === (live ? 'live' : 'image'))));
  $('#d-img').hidden = live; site.hidden = !live; $('#d-full').hidden = !live;
  if (live && site.dataset.src !== p.site) {
    clearTimeout(waitTimer);
    site.dataset.src = p.site; site.title = `${p.name} live website`;
    siteWait.hidden = false; siteWait.textContent = `Loading ${prettyUrl(p.site)}…`;
    site.src = p.site;
    waitTimer = setTimeout(() => { siteWait.textContent = `${prettyUrl(p.site)} is taking a while. If it stays blank, open it in a new tab.`; }, 10000);
  } else if (!live) unloadSite();
  fitSite(); setCaption();
}
export function unloadSite() {
  setFull(false);
  clearTimeout(waitTimer); siteWait.hidden = true;
  if (site.dataset.src) { site.dataset.src = ''; site.src = 'about:blank'; }
}
export function setFull(on) {
  shot.classList.toggle('full', on);
  document.body.classList.toggle('site-full', on);
  $('#d-full').textContent = on ? 'Close ✕' : 'Expand ⤢';
  if (on) $('#d-full').focus({ preventScroll: true });
}
site.addEventListener('load', () => { if (site.dataset.src) { clearTimeout(waitTimer); siteWait.hidden = true; } });

export const isFull = () => shot.classList.contains('full');
// Called when a dossier opens: a quick placeholder first, then the live site or the best image found.
export function showPreview(p) {
  const img = $('#d-img');
  img.alt = `${p.name} preview`;
  img.src = snapshots[p.id] || poster(p);
  imgCap = '';
  $('#d-shot-name').textContent = p.name;
  $('#d-view').hidden = !canEmbed(p);
  $('#d-newtab').hidden = !p.site;
  if (p.site) $('#d-newtab').href = p.site;
  setView(canEmbed(p) ? siteView : 'image');
  showImage(p);
}
// Snapshots arrive a moment after boot; upgrade the open dossier if it is still on a placeholder.
export function refreshImage() {
  const p = app.current;
  if (p && !imageCache[p.id]) showImage(p);
}
export function initPreview() {
  $('#d-full').onclick = () => setFull(!isFull());
}
