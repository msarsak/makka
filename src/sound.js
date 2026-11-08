// Sci-Fi-Soundeffekte, komplett synthetisch erzeugt (Web Audio API) – keine Audiodateien nötig.

let ctx = null, master = null, fx = null;
let muted = false;
try { muted = localStorage.getItem('heph.muted') === '1'; } catch { /* egal */ }

export function initAudio() {
  if (ctx) { ctx.resume?.(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.55;
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp).connect(ctx.destination);

  // kleiner "Raum"-Hall per Echo
  fx = ctx.createGain(); fx.gain.value = 0.22;
  const delay = ctx.createDelay(1); delay.delayTime.value = 0.17;
  const fb = ctx.createGain(); fb.gain.value = 0.32;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
  fx.connect(delay); delay.connect(lp).connect(fb).connect(delay); lp.connect(master);
}

export function isMuted() { return muted; }
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('heph.muted', m ? '1' : '0'); } catch { /* egal */ }
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.55, ctx.currentTime, 0.05);
}

function tone({ type = 'sine', f0, f1 = f0, start = 0, dur = 0.2, vol = 0.2, attack = 0.005, wet = true, filter }) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o;
  if (filter) { const b = ctx.createBiquadFilter(); b.type = filter.type || 'lowpass'; b.frequency.value = filter.f; b.Q.value = filter.q || 1; node.connect(b); node = b; }
  node.connect(g); g.connect(master); if (wet) g.connect(fx);
  o.start(t); o.stop(t + dur + 0.05);
}

function noise({ start = 0, dur = 0.5, vol = 0.1, f0 = 400, f1 = 4000, q = 4 }) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + start;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
  bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(g); g.connect(master); g.connect(fx);
  src.start(t); src.stop(t + dur);
}

export const sfx = {
  // Hochfahren des Systems
  boot() {
    tone({ type: 'sawtooth', f0: 45, f1: 180, dur: 1.4, vol: 0.12, attack: 0.3, filter: { f: 600 } });
    tone({ type: 'sine', f0: 90, f1: 360, dur: 1.4, vol: 0.18, attack: 0.25 });
    noise({ dur: 1.3, vol: 0.08, f0: 200, f1: 6000, q: 3 });
    [880, 1175, 1480, 1760].forEach((f, i) => tone({ type: 'triangle', f0: f, start: 1.05 + i * 0.08, dur: 0.5, vol: 0.07 }));
    tone({ type: 'sine', f0: 2637, start: 1.45, dur: 0.9, vol: 0.05 });
  },
  // Panel / Fenster öffnet sich
  panel() {
    tone({ type: 'sine', f0: 1400, f1: 2600, dur: 0.09, vol: 0.06 });
    tone({ type: 'square', f0: 3200, dur: 0.025, vol: 0.02, start: 0.07, wet: false, filter: { f: 5000 } });
  },
  // Nachricht senden
  send() {
    tone({ type: 'triangle', f0: 620, f1: 1240, dur: 0.12, vol: 0.09 });
    tone({ type: 'sine', f0: 1860, start: 0.06, dur: 0.12, vol: 0.05 });
  },
  // Hephaestion beginnt zu antworten
  reply() {
    tone({ type: 'sine', f0: 660, dur: 0.35, vol: 0.07, attack: 0.02 });
    tone({ type: 'sine', f0: 990, start: 0.08, dur: 0.45, vol: 0.06, attack: 0.02 });
    tone({ type: 'triangle', f0: 1320, start: 0.16, dur: 0.5, vol: 0.035, attack: 0.02 });
  },
  // leises Daten-Ticken während des Streamings
  tick() { tone({ type: 'square', f0: 2400 + Math.random() * 1600, dur: 0.018, vol: 0.012, wet: false, filter: { f: 6000 } }); },
  // Aktivierung (z. B. Wake-Word, Turbo)
  activate() {
    tone({ type: 'sawtooth', f0: 220, f1: 880, dur: 0.22, vol: 0.06, filter: { f: 2400 } });
    tone({ type: 'sine', f0: 1320, start: 0.18, dur: 0.3, vol: 0.06 });
  },
  deactivate() { tone({ type: 'sine', f0: 900, f1: 300, dur: 0.22, vol: 0.06 }); },
  error() {
    tone({ type: 'sawtooth', f0: 160, f1: 110, dur: 0.35, vol: 0.09, filter: { f: 900 } });
    tone({ type: 'square', f0: 140, start: 0.18, dur: 0.25, vol: 0.05, filter: { f: 700 } });
  },
};
