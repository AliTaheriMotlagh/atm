import { hexNum } from './core/util.js';

/* Ali's short films (AlanFilm on YouTube). To add one, append { id, title, fa } to FILMS. */
export const FILMS = [
  { id: 'Kb0F_Y6gJpk', title: 'Hamshahri', fa: 'فیلم کوتاه همشهری' },
  { id: 'EAyJJ59wsDE', title: 'A Little Thing', fa: 'فیلم کوتاه یک چیز کوچیک' },
];
export const ytThumb = f => `https://i.ytimg.com/vi/${f.id}/hqdefault.jpg`;
export const ytWatch = f => `https://www.youtube.com/watch?v=${f.id}`;

// The drive-in on the island. It isn't a project: driving up to it opens the films instead of a dossier.
export const CINEMA = { id: 'cinema', name: 'Cinema', color: '#e5484d', landmark };

/* A drive-in: the screen faces the road and cycles through the films. */
function landmark(g, c, { M, mat, tick, makeScreen }) {
  const C = hexNum(c), SW = 13, SH = SW * 9 / 16, SY = 3.4 + SH / 2;
  M(new THREE.CylinderGeometry(8.6, 9, 0.24, 40), mat(0x3b404c), 0, 0.12, 0, g).castShadow = false;
  for (let i = -2; i <= 2; i++) M(new THREE.BoxGeometry(0.22, 0.05, 3.2), mat(0xfff4d6), i * 2.6, 0.26, 1.2, g, true);
  [-5.2, 5.2].forEach(x => M(new THREE.BoxGeometry(0.6, SY + SH / 2, 0.6), mat(0x2b2f3a), x, (SY + SH / 2) / 2, -4.8, g));
  M(new THREE.BoxGeometry(SW + 0.9, SH + 0.9, 0.5), mat(0x15171c), 0, SY, -4.5, g);
  const film = FILMS.map(f => ({ kind: 'film', f })).concat({ kind: 'films' });
  M(new THREE.PlaneGeometry(SW, SH), makeScreen(film, 0, 6), 0, SY, -4.22, g, true);
  // Marquee bulbs that chase along the top of the frame.
  const on = new THREE.MeshBasicMaterial({ color: 0xffe9a8 }), off = new THREE.MeshBasicMaterial({ color: 0x6b5a3a });
  const bulbs = [];
  for (let i = 0; i < 16; i++) bulbs.push(M(new THREE.SphereGeometry(0.2, 8, 6), on, -SW / 2 + 0.1 + i * (SW - 0.2) / 15, SY + SH / 2 + 0.75, -4.2, g, true));
  // Projector booth and a flickering beam.
  M(new THREE.BoxGeometry(2.4, 2.2, 2), mat(0xf2f5fa), 0, 1.1, 5.2, g);
  M(new THREE.BoxGeometry(2.7, 0.3, 2.3), mat(C), 0, 2.35, 5.2, g);
  const lens = M(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 14), mat(0x22252c), 0, 1.5, 4.0, g); lens.rotation.x = Math.PI / 2;
  const from = new THREE.Vector3(0, 1.5, 3.8), to = new THREE.Vector3(0, SY, -4.2), dir = to.clone().sub(from), L = dir.length();
  const bg = new THREE.CylinderGeometry(SH / 2, 0.25, L, 24, 1, true); bg.translate(0, L / 2, 0);
  const beam = M(bg, new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }), from.x, from.y, from.z, g, true);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  // Popcorn bucket.
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 8;
  const sx = cv.getContext('2d'); for (let i = 0; i < 8; i++) { sx.fillStyle = i % 2 ? '#ffffff' : '#e5484d'; sx.fillRect(i * 8, 0, 8, 8); }
  const stripes = new THREE.CanvasTexture(cv); stripes.magFilter = THREE.NearestFilter;
  M(new THREE.CylinderGeometry(1.35, 1, 2.8, 16), new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.7 }), -6.6, 1.4, 2.2, g);
  for (let i = 0; i < 9; i++) M(new THREE.IcosahedronGeometry(0.42, 0), mat(0xfff1c1), -6.6 + Math.cos(i * 2.4) * 0.8 * (i % 3) / 2, 2.95 + (i % 3) * 0.22, 2.2 + Math.sin(i * 2.4) * 0.8 * (i % 3) / 2, g);
  tick(t => {
    bulbs.forEach((b, i) => { b.material = (i + Math.floor(t * 6)) % 3 ? on : off; });
    beam.material.opacity = 0.09 + 0.03 * Math.sin(t * 23) * Math.sin(t * 7);
  });
  return { solidR: 8.6, sign: 12.5 };
}
