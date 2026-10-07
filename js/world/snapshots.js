import { snapshots, refreshImage } from '../ui/preview.js';

/* Photographs each landmark once the scene has settled; the pictures become the dossier images. */
export function captureSnapshots({ renderer, scene, car, peerGroup, LANDMARKS }) {
  const W = 1280, H = 720;
  const rt = new THREE.WebGLRenderTarget(W, H);
  const cam = new THREE.PerspectiveCamera(42, W / H, 0.5, 900);
  const px = new Uint8Array(W * H * 4);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const cx = cv.getContext('2d'); const id = cx.createImageData(W, H);
  const out = document.createElement('canvas'); out.width = 960; out.height = 540;
  const ox = out.getContext('2d');
  car.visible = false; peerGroup.visible = false;
  LANDMARKS.forEach(l => {
    const d = l.p.home ? 20 : l.snap;
    cam.position.copy(l.pos).addScaledVector(l.hero, d); cam.position.y = l.p.home ? 9 : 12;
    cam.lookAt(l.pos.x, l.p.home ? 3.5 : 4.5, l.pos.z);
    l.ring.visible = false;
    renderer.setRenderTarget(rt); renderer.render(scene, cam);
    renderer.readRenderTargetPixels(rt, 0, 0, W, H, px);
    l.ring.visible = true;
    for (let y = 0; y < H; y++) id.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
    cx.putImageData(id, 0, 0);
    ox.drawImage(cv, 0, 0, out.width, out.height);
    snapshots[l.p.id] = out.toDataURL('image/jpeg', 0.86);
  });
  renderer.setRenderTarget(null);
  car.visible = true; peerGroup.visible = true;
  rt.dispose();
  refreshImage();
}
