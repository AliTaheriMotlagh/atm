import { $, esc, inkFor, isTouch, buzz, copyText } from '../core/util.js';
import { store } from '../core/store.js';
import { sfx } from '../core/sfx.js';
import { toast } from '../core/effects.js';
import { app, setMode } from '../core/app.js';
import { ALL, TOUR, GAME_LIST } from '../projects/index.js';
import { CINEMA } from '../films.js';
import { resetProgress } from '../progress.js';
import { openGame, closeGame, gameOpen } from '../games/runner.js';
import { arcade } from '../games/arcade.js';
import { world } from '../world/world.js';
import { net } from '../net/net.js';
import { netPanel, openNet } from '../net/panel.js';
import { raceKey } from '../net/race.js';
import { battleKey } from '../net/battle.js';
import { openDossier, closeDossier, dossierOpen, renderTab } from './dossier.js';
import { setView, setFull, isFull } from './preview.js';
import { cinema } from './cinema.js';
import { social } from './social.js';
import { keys, initInput } from './input.js';

/* The frame around the island: intro card, HUD buttons, project drawer, keyboard and focus handling. */

// Landmarks open their dossier, except the drive-in, which opens the films.
export function openLandmark(id, opts = {}) {
  if (id !== CINEMA.id) { openDossier(id, opts); return; }
  if (opts.teleport !== false) world.teleport(id);
  cinema.open();
}

export function toggleDrawer(force) {
  const d = $('#drawer'); d.hidden = force === undefined ? !d.hidden : !force;
  if (!d.hidden) d.querySelector('button').focus();
}

// Close everything and put the player behind the wheel (races call this at the countdown).
export function enterDrive() {
  if (!world.ok) return;
  $('#win').hidden = true; closeGame(); arcade.close(); netPanel.close(); toggleDrawer(false);
  if (dossierOpen()) closeDossier();
  $('#intro').hidden = true; setMode('drive');
  if (!document.activeElement || document.activeElement === document.body) $('#stage canvas')?.focus({ preventScroll: true });
}

function honk() { sfx.play('horn'); buzz(30); world.honk(); net.send.honk?.(1); }

function resetGame() {
  resetProgress(app.mode === 'drive');
  world.resetCoins();
  toast('Tour restarted');
}

function afterWin() {
  $('#win').hidden = true;
  closeGame(); arcade.close(); cinema.close(); social.close();
  if (dossierOpen()) closeDossier(); else setMode(world.ok ? 'drive' : 'intro');
}

// Collapsed by default on small screens so the island stays visible; the choice is remembered.
function setGoalOpen(open) {
  $('#goal').classList.toggle('collapsed', !open);
  $('#goal-toggle').setAttribute('aria-expanded', String(open));
}

function renderSound() {
  $('#sound-ico').textContent = sfx.muted ? '🔇' : '🔊';
  $('#btn-sound').setAttribute('aria-pressed', String(!sfx.muted));
}

// Copy that mentions how many landmarks and challenges there are.
function renderCounts() {
  const n = TOUR.length, g = GAME_LIST.length;
  $('#brand-sub').textContent = `project island · ${n} landmarks`;
  $('#goal-note').innerHTML = `🏁 <b>Goal:</b> visit all ${n} project landmarks, collect 8 gold coins, open 3 dossiers, and beat at least one challenge at every project. There are ${g} challenges on the island, three per landmark. Your best tour time and personal records are saved on this device.`;
}

function renderLists() {
  $('#intro-chips').innerHTML = ALL.map(p => `
    <button class="chip" type="button" data-open="${p.id}" style="--c:${p.color}">
      <i class="dot"></i><span><b>${esc(p.name)}</b><small>${esc(p.home ? 'Who I am, skills, contact' : p.tagline)}</small></span>
    </button>`).join('');
  $('#plist').innerHTML = ALL.map(p => `
    <li class="pitem" style="--c:${p.color};--ci:${inkFor(p.color)}">
      <div class="top"><i class="dot"></i><b>${esc(p.name)}</b><span class="lang">${esc(p.home ? 'home' : p.lang.split(' ')[0])}</span></div>
      <p>${esc(p.tagline)}</p>
      <div class="row">
        <button class="go" type="button" data-open="${p.id}">Open dossier</button>
        <button class="drive" type="button" data-drive="${p.id}">Drive there</button>
        ${p.site ? `<a class="drive site-link" href="${p.site}" target="_blank" rel="noopener">Website ↗</a>` : ''}
      </div>
    </li>`).join('');
}

/* Keyboard */
const pgEl = $('#project-game'), netEl = $('#net');
// The top-most modal layer, which keeps Tab focus inside it.
const modalLayer = () => [$('#win'), pgEl, arcade.el, cinema.el, social.el, netEl].find(el => !el.hidden) || null;
// Some overlay covers the island, so driving input is ignored.
export const overlayOpen = () => !!modalLayer();

function trapFocus(e) {
  const layer = modalLayer(); if (!layer) return;
  const f = [...layer.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), iframe, [tabindex="0"]')].filter(el => el.getClientRects().length);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1], a = document.activeElement;
  if (!layer.contains(a)) { e.preventDefault(); first.focus(); }
  else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
}

function onKeyDown(e) {
  const k = e.key.toLowerCase();
  // Escape closes the top-most layer first.
  if (k === 'escape') {
    if (!$('#win').hidden) afterWin();
    else if (gameOpen()) closeGame();
    else if (arcade.isOpen) arcade.close();
    else if (cinema.isOpen) cinema.close();
    else if (social.isOpen) social.close();
    else if (netPanel.isOpen) netPanel.close();
    else if (isFull()) setFull(false);
    else if (dossierOpen()) closeDossier();
    else if (!$('#drawer').hidden) toggleDrawer(false);
    return;
  }
  if (k === 'tab') { trapFocus(e); return; }
  if (e.target.matches && e.target.matches('input, textarea, select')) return;
  if (overlayOpen() || dossierOpen()) return;
  if (k === 'm') { toggleDrawer(); return; }
  if (k === 'g') { arcade.open(); return; }
  if (k === 'v') { cinema.open(); return; }
  if (k === 'p') { social.open(); return; }
  if (k === 'h') { if (!e.repeat && app.mode === 'drive') honk(); return; }
  if (k === 'n') { openNet(); return; }
  if (k === 'r') { if (!e.repeat && world.ok) raceKey(); return; }
  if (k === 'b') { if (!e.repeat && world.ok) battleKey(); return; }
  if ((k === 'e' || k === 'enter') && app.mode === 'drive' && world.near && document.activeElement.tagName !== 'BUTTON') { openLandmark(world.near, { teleport: false }); e.preventDefault(); return; }
  if (app.mode === 'intro' && ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k) && $('#drawer').hidden) { $('#intro').hidden = true; setMode('drive'); }
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k) && app.mode === 'drive') e.preventDefault();
  keys[k] = true;
}

export function initShell() {
  if (isTouch) {
    document.body.classList.add('touch');
    $('#controls-hint').innerHTML = '<span>Drag the stick (bottom left) to drive</span><span>Hold Boost to go faster</span><span>📯 honks</span><span>Tap a landmark to open it</span>';
  }
  renderCounts();
  renderLists();

  // One listener for every data-* action rendered anywhere on the page.
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-open],[data-drive],[data-copy],[data-tab],[data-view],[data-game]');
    if (!t) return;
    if (t.dataset.game) openGame(t.dataset.game);
    else if (t.dataset.view) setView(t.dataset.view);
    else if (t.dataset.open) openDossier(t.dataset.open);
    else if (t.dataset.drive) { $('#drawer').hidden = true; $('#intro').hidden = true; world.teleport(t.dataset.drive); setMode('drive'); }
    else if (t.dataset.copy) copyText(t, t.dataset.copy);
    else if (t.dataset.tab && app.current) renderTab(app.current, t.dataset.tab);
  });

  $('#btn-list').onclick = () => toggleDrawer();
  $('#btn-intro-list').onclick = () => toggleDrawer(true);
  $('#minimap').onclick = () => toggleDrawer();
  $('#drawer-x').onclick = () => toggleDrawer(false);
  $('#btn-about').onclick = () => openDossier('about');
  $('#btn-start').onclick = () => { $('#intro').hidden = true; setMode('drive'); $('#stage canvas')?.focus(); };
  $('#btn-arcade').onclick = $('#btn-intro-arcade').onclick = () => arcade.open();
  $('#btn-films').onclick = $('#btn-intro-films').onclick = () => cinema.open();
  $('#btn-social').onclick = () => social.open();
  $('#btn-sound').onclick = () => { sfx.muted = !sfx.muted; store.set('island-muted', sfx.muted ? '1' : '0'); renderSound(); if (!sfx.muted) sfx.play('coin'); };
  renderSound();
  $('#goal-reset').onclick = resetGame;
  $('#goal-toggle').onclick = () => { const open = $('#goal').classList.contains('collapsed'); setGoalOpen(open); store.set('island-goal-open', open ? '1' : '0'); };
  { const saved = store.get('island-goal-open'); setGoalOpen(saved ? saved === '1' : innerWidth > 700 && innerHeight > 620); }
  $('#btn-again').onclick = () => { afterWin(); resetGame(); };
  $('#btn-keep').onclick = afterWin;
  $('#prompt').onclick = () => { if (world.near) openLandmark(world.near, { teleport: false }); };

  addEventListener('keydown', onKeyDown);
  initInput(honk);
}
