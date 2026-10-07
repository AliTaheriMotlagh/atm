import { inkFor, TAU } from '../core/util.js';
import { FILMS, ytThumb } from '../films.js';

/* Canvas textures: landmark signs, and the screens on the billboards and the drive-in, which cycle through
   Ali's logo, each app's card and the film posters. */
export function roundRect(x, l, t, w, h, r) {
  x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r);
  x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath();
}

export function makeSign(text, color) {
  const cv = document.createElement('canvas'); cv.width = 640; cv.height = 200;
  const x = cv.getContext('2d');
  x.font = '60px Bungee, "Arial Black", sans-serif';
  const w = Math.min(620, x.measureText(text).width + 70), left = 320 - w / 2;
  x.fillStyle = 'rgba(0,0,0,.25)'; roundRect(x, left + 4, 28, w, 112, 28); x.fill();
  x.fillStyle = color; roundRect(x, left, 20, w, 112, 28); x.fill();
  x.beginPath(); x.moveTo(300, 130); x.lineTo(340, 130); x.lineTo(320, 170); x.closePath(); x.fill();
  x.fillStyle = inkFor(color); x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 320, 80);
  const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, fog: false }));
  s.scale.set(13, 13 * 200 / 640, 1);
  return s;
}

// Remote images must come with CORS headers, or a canvas that draws them can't become a texture.
const webImgs = {};
function webImg(url, onload) {
  let e = webImgs[url];
  if (!e) {
    e = webImgs[url] = { img: new Image(), ok: false, waiting: [] };
    e.img.crossOrigin = 'anonymous';
    e.img.onload = () => { e.ok = true; e.waiting.forEach(f => f()); e.waiting = []; };
    e.img.src = url;
  }
  if (!e.ok && onload) e.waiting.push(onload);
  return e.ok ? e.img : null;
}
const AVATAR = 'https://avatars.githubusercontent.com/u/19836582?s=256&v=4';
const DISPLAY = 'Bungee, "Arial Black", sans-serif', BODY = '"Atkinson Hyperlegible", system-ui, sans-serif';
function wrapText(x, text, left, top, maxW, lineH, maxLines) {
  const words = text.split(' '); let line = '', n = 0;
  for (let i = 0; i < words.length && n < maxLines; i++) {
    const next = line ? line + ' ' + words[i] : words[i];
    if (x.measureText(next).width > maxW && line) { x.fillText(n === maxLines - 1 ? line + '…' : line, left, top + n * lineH); n++; line = words[i]; }
    else line = next;
  }
  if (n < maxLines && line) x.fillText(line, left, top + n * lineH);
}
// YouTube's hqdefault is 4:3 with letterbox bars; crop to the 16:9 picture.
const drawThumb = (x, img, l, t, w, h) => x.drawImage(img, 0, 45, 480, 270, l, t, w, h);
function fitText(x, text, font, size, maxW) { do { x.font = `${size}px ${font}`; } while (x.measureText(text).width > maxW && (size -= 4) > 20); }
function drawSlide(x, W, H, sl, redraw) {
  x.save(); x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  if (sl.kind === 'me') {
    const gr = x.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#0d1628'); gr.addColorStop(1, '#1d2f55');
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    const R = 150, cx = 230, cy = H / 2, img = webImg(AVATAR, redraw);
    x.fillStyle = '#ffc53d'; x.beginPath(); x.arc(cx, cy, R + 12, 0, TAU); x.fill();
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.clip();
    if (img) x.drawImage(img, cx - R, cy - R, R * 2, R * 2);
    else { x.fillStyle = '#16213a'; x.fillRect(cx - R, cy - R, R * 2, R * 2); x.fillStyle = '#ffc53d'; x.font = `120px ${DISPLAY}`; x.textAlign = 'center'; x.fillText('AT', cx, cy + 44); x.textAlign = 'left'; }
    x.restore();
    x.fillStyle = '#ffc53d'; x.font = `64px ${DISPLAY}`; x.fillText('ALI TAHERI', 430, 230); x.fillText('MOTLAGH', 430, 305);
    x.fillStyle = '#f2f5fa'; x.font = `34px ${BODY}`; x.fillText('Software Engineer', 432, 370); x.fillText('Senior Frontend Developer', 432, 414);
    x.fillStyle = '#9fb0cc'; x.font = `26px ${BODY}`; x.fillText('github.com/AliTaheriMotlagh', 432, 470);
  } else if (sl.kind === 'films') {
    x.fillStyle = '#0b0b0f'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#e5484d'; x.fillRect(0, 0, W, 14); x.fillRect(0, H - 14, W, 14);
    x.fillStyle = '#fff'; x.font = `86px ${DISPLAY}`; x.textAlign = 'center'; x.fillText('ALANFILM', W / 2, 140);
    x.fillStyle = '#e5484d'; x.font = `32px ${BODY}`; x.fillText('Short films by Ali · on YouTube', W / 2, 192);
    const n = FILMS.length, gap = 30, tw = Math.min(420, (W - 80 - gap * (n - 1)) / n), th = tw * 9 / 16;
    FILMS.forEach((f, i) => {
      const l = (W - (tw * n + gap * (n - 1))) / 2 + i * (tw + gap), t = 240, img = webImg(ytThumb(f), redraw);
      x.fillStyle = '#222'; x.fillRect(l, t, tw, th);
      if (img) drawThumb(x, img, l, t, tw, th);
      x.fillStyle = '#fff'; x.font = `30px ${BODY}`; x.fillText(f.title, l + tw / 2, t + th + 46);
    });
  } else if (sl.kind === 'film') {
    const img = webImg(ytThumb(sl.f), redraw);
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
    if (img) drawThumb(x, img, 0, 0, W, H);
    const gr = x.createLinearGradient(0, H * 0.45, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.85)');
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    x.fillStyle = '#e5484d'; x.font = `28px ${DISPLAY}`; x.fillText(sl.label || 'NOW SHOWING', 48, H - 120);
    x.fillStyle = '#fff'; fitText(x, sl.f.title.toUpperCase(), DISPLAY, 70, W - 96); x.fillText(sl.f.title.toUpperCase(), 48, H - 46);
  } else {
    const p = sl.p, gr = x.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, '#101726'); gr.addColorStop(1, '#1b2436');
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    x.fillStyle = p.color; x.fillRect(0, 0, 18, H);
    const S = 250, l = 80, t = (H - S) / 2;
    x.fillStyle = p.color; x.beginPath(); x.moveTo(l + 50, t); x.arcTo(l + S, t, l + S, t + S, 50); x.arcTo(l + S, t + S, l, t + S, 50); x.arcTo(l, t + S, l, t, 50); x.arcTo(l, t, l + S, t, 50); x.fill();
    x.fillStyle = '#fff'; x.font = `150px ${BODY}`; x.textAlign = 'center'; x.fillText(p.glyph || p.name[0], l + S / 2, t + S / 2 + 52); x.textAlign = 'left';
    const tl = l + S + 50, tw = W - tl - 50;
    x.fillStyle = '#fff'; fitText(x, p.name.toUpperCase(), DISPLAY, 70, tw); x.fillText(p.name.toUpperCase(), tl, 210);
    x.fillStyle = '#c9d3e6'; x.font = `30px ${BODY}`; wrapText(x, p.tagline, tl, 268, tw, 40, 3);
    x.fillStyle = p.color; x.font = `26px ${BODY}`;
    x.fillText(p.site ? p.site.replace(/^https?:\/\//, '') : 'github.com/AliTaheriMotlagh', tl, 430);
  }
  x.restore();
}

// A screen is a canvas texture that cycles through slides. Returns makeScreen(slides, start, every) → material.
export function createScreens(tick) {
  const SCREENS = [];
  function makeScreen(slides, start, every) {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 576;
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
    const sc = { cv, x: cv.getContext('2d'), tex, slides, start, every, k: -1 };
    sc.draw = () => { drawSlide(sc.x, cv.width, cv.height, slides[(start + Math.max(0, sc.k)) % slides.length], sc.draw); tex.needsUpdate = true; };
    sc.draw(); SCREENS.push(sc);
    return new THREE.MeshBasicMaterial({ map: tex });
  }
  tick(t => SCREENS.forEach(sc => {
    const k = Math.floor(t / sc.every + sc.start * 0.37);
    if (k !== sc.k) { sc.k = k; sc.draw(); }
  }));
  document.fonts?.ready.then(() => SCREENS.forEach(sc => sc.draw()));
  return makeScreen;
}
