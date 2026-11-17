// Tiny WebAudio synth: bell ticks, chimes and thuds, no assets.

let ctx = null;
function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip(freq, dur, type = 'sine', vol = 0.08, slide = 0) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), c.currentTime + dur);
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g); g.connect(c.destination);
  o.start(); o.stop(c.currentTime + dur);
}

export const sfx = {
  jump() { blip(320, 0.12, 'square', 0.04, 260); },
  wallJump() { blip(420, 0.1, 'square', 0.04, 200); },
  land() { blip(140, 0.06, 'triangle', 0.05, -60); },
  tick() { blip(1180, 0.07, 'sine', 0.06, 240); },
  checkpoint() { blip(880, 0.16, 'sine', 0.09); setTimeout(() => blip(1318, 0.22, 'sine', 0.09), 70); },
  death() { blip(300, 0.35, 'sawtooth', 0.07, -240); },
  draft() { blip(660, 0.14, 'triangle', 0.08, 220); },
  charm() { blip(990, 0.2, 'sine', 0.09, 330); },
  banner() { blip(523, 0.18, 'triangle', 0.07); setTimeout(() => blip(784, 0.2, 'triangle', 0.07), 90); },
  bell() { blip(392, 0.9, 'sine', 0.12, -30); setTimeout(() => blip(587, 0.7, 'sine', 0.08), 60); },
  aegis() { blip(200, 0.25, 'square', 0.08, -80); },
};
