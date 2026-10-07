import { $, esc } from '../core/util.js';
import { setMode } from '../core/app.js';
import { FILMS, CINEMA, ytThumb, ytWatch } from '../films.js';
import { world } from '../world/world.js';
import { modal } from './modal.js';
import { closeDossier, dossierOpen } from './dossier.js';

/* The films panel. The player iframe is only created on play, so the island doesn't load YouTube until asked. */
const cinEl = $('#cinema');
let film = FILMS[0];

function renderCinema(play = false) {
  const scr = $('#cin-screen');
  if (play) {
    scr.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${film.id}?autoplay=1&rel=0&playsinline=1" title="${esc(film.title)} short film"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  } else {
    scr.innerHTML = `<button class="poster" type="button" data-play style="background-image:url('${ytThumb(film)}')" aria-label="Play ${esc(film.title)}"><span class="play" aria-hidden="true">▶</span></button>`;
  }
  $('#cin-now').innerHTML = `<div><b>${esc(film.title)}</b><bdi dir="rtl" lang="fa">${esc(film.fa)}</bdi></div>
    <div class="cin-links">${world.ok && world.near !== CINEMA.id ? '<button type="button" data-drive-cinema>🚗 Drive to the island cinema</button>' : ''}<a href="${ytWatch(film)}" target="_blank" rel="noopener">Watch on YouTube ↗</a></div>`;
  $('#cin-reel').innerHTML = FILMS.map(f => `<button class="reel-item" type="button" role="listitem" data-film="${f.id}" aria-current="${f === film}">
    <img src="${ytThumb(f)}" alt="" loading="lazy"><span><b>${esc(f.title)}</b><small>Short film</small></span></button>`).join('');
}

export const cinema = modal(cinEl, {
  closeBtn: $('#cin-x'),
  onOpen() { renderCinema(); return $('#cin-screen [data-play]'); },
  onClose() { $('#cin-screen').innerHTML = ''; } // removing the iframe stops playback
});

export function initCinema() {
  cinEl.addEventListener('click', e => {
    if (e.target.closest('[data-play]')) { renderCinema(true); $('#cin-screen iframe').focus(); return; }
    if (e.target.closest('[data-drive-cinema]')) {
      cinema.close(); $('#intro').hidden = true; if (dossierOpen()) closeDossier();
      world.teleport(CINEMA.id); setMode('drive'); $('#stage canvas')?.focus(); return;
    }
    const pick = e.target.closest('[data-film]');
    if (pick) {
      film = FILMS.find(f => f.id === pick.dataset.film); renderCinema(true);
      cinEl.querySelector('.game-box').scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}
