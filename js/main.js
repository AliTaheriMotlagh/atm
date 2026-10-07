import { $ } from './core/util.js';
import { app } from './core/app.js';
import { byId } from './projects/index.js';
import { renderGameHud } from './progress.js';
import { initRunner } from './games/runner.js';
import { initArcade } from './games/arcade.js';
import { initPreview } from './ui/preview.js';
import { initDossier, openDossier } from './ui/dossier.js';
import { initCinema } from './ui/cinema.js';
import { initSocial } from './ui/social.js';
import { initShell } from './ui/shell.js';
import { initNet, netStart } from './net/net.js';
import { initNetPanel, renderNet } from './net/panel.js';
import { initRace } from './net/race.js';
import { initBattle } from './net/battle.js';
import { world, startWorld } from './world/world.js';

/* Entry point: wire up every panel, then build the island once the display font is ready
   (the signs and billboards are drawn with it). */
initShell();
initRunner();
initArcade();
initPreview();
initDossier();
initCinema();
initSocial();
initNet();
initNetPanel();
initRace();
initBattle();
renderGameHud();

function boot() {
  world.ok = startWorld();
  if (!world.ok) {
    document.body.classList.add('no3d');
    $('#note3d').hidden = false; $('#controls-hint').hidden = true; $('#btn-start').hidden = true;
    $('#minimap').hidden = true; $('#btn-online').hidden = true;
    document.querySelectorAll('[data-drive]').forEach(b => b.remove());
  }
  renderNet();
  netStart();
  const h = location.hash.slice(1);
  if (byId[h]) openDossier(h);
  // Deep links such as #gridways also work when the hash changes without a reload.
  addEventListener('hashchange', () => { const id = location.hash.slice(1); if (byId[id] && app.current !== byId[id]) openDossier(id); });
}
const fontsReady = document.fonts && document.fonts.load ? Promise.race([document.fonts.load('60px Bungee'), new Promise(r => setTimeout(r, 1800))]) : Promise.resolve();
fontsReady.then(boot, boot);
