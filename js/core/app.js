import { $ } from './util.js';

/* Shared UI state: which screen the island is in and which dossier is open. */
export const app = { mode: 'intro', current: null };

export function setMode(m) {
  app.mode = m;
  document.body.classList.toggle('driving', m === 'drive');
  if (m !== 'drive') $('#prompt').hidden = true;
}
