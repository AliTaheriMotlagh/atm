import { store } from './store.js';

// Tiny synth for game feedback; the context is created on first use, which is always after a key press or tap.
export const sfx = {
  ac: null, muted: store.get('island-muted') === '1',
  SONGS: {
    coin: { type: 'square', vol: 0.04, notes: [[988, 0, 0.08], [1319, 0.06, 0.16]] },
    stamp: { type: 'triangle', vol: 0.1, notes: [[523, 0, 0.12], [659, 0.08, 0.12], [784, 0.16, 0.12], [1047, 0.24, 0.3]] },
    win: { type: 'triangle', vol: 0.1, notes: [[523, 0, 0.15], [659, 0.15, 0.15], [784, 0.3, 0.15], [1047, 0.45, 0.22], [784, 0.68, 0.12], [1047, 0.82, 0.6]] },
    fail: { type: 'sawtooth', vol: 0.04, notes: [[220, 0, 0.14], [160, 0.12, 0.24]] },
    tick: { type: 'square', vol: 0.025, notes: [[1500, 0, 0.035]] },
    horn: { type: 'square', vol: 0.045, notes: [[392, 0, 0.18], [494, 0, 0.18], [392, 0.22, 0.34], [494, 0.22, 0.34]] }
  },
  ctx() { return this.ac || (this.ac = new (window.AudioContext || window.webkitAudioContext)()); },
  // Called from a click so Safari lets the context start before timed sounds (count-ins) need it.
  unlock() { if (this.muted) return; try { const ac = this.ctx(); if (ac.state === 'suspended') ac.resume(); } catch (e) {} },
  tone(f, dur = 0.15, type = 'triangle', vol = 0.07) { this.play({ type, vol, notes: [[f, 0, dur]] }); },
  play(name) {
    if (this.muted) return;
    try {
      const ac = this.ctx();
      if (ac.state === 'suspended') ac.resume();
      const s = typeof name === 'string' ? this.SONGS[name] : name;
      s.notes.forEach(([f, at, dur]) => {
        const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + at;
        o.type = s.type; o.frequency.setValueAtTime(f, t0);
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(s.vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + dur + 0.02);
      });
    } catch (e) {}
  }
};
