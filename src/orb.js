// Der Energie-Kern: ein leuchtender Orb, gezeichnet mit Canvas, 60 FPS.
// setState('idle' | 'listening' | 'thinking' | 'speaking' | 'error')
// setLevel(0..1)  – Lautstärke (ab Phase 2 vom Mikrofon / der Stimme)
// pulse(stärke)  – kurzer Energiestoß (z. B. pro eintreffendem Wort)

const STATE_ENERGY = { idle: 0.12, listening: 0.35, thinking: 0.45, speaking: 0.3, error: 0.25 };

function cssColor(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export function createOrb(canvas, { onFps } = {}) {
  const ctx = canvas.getContext('2d', { alpha: true });
  let W = 0, H = 0, dpr = 1;
  let state = 'idle';
  let level = 0;        // geglättete Energie
  let external = 0;     // Lautstärke von außen
  let burst = 0;        // kurze Impulse
  let t = 0;
  let last = performance.now();
  let running = true;

  const colors = {};
  function readColors() {
    colors.blue = hexToRgb(cssColor('--blue', '#1f6fff'));
    colors.bright = hexToRgb(cssColor('--blue-bright', '#5cc2ff'));
    colors.red = hexToRgb(cssColor('--red', '#ff2a45'));
    colors.gold = hexToRgb(cssColor('--gold', '#ffc94d'));
  }
  readColors();

  // Partikel, die um den Kern kreisen
  const particles = Array.from({ length: 170 }, (_, i) => ({
    a: Math.random() * Math.PI * 2,
    r: 0.38 + Math.random() * 0.5,
    s: (0.08 + Math.random() * 0.35) * (Math.random() < 0.5 ? -1 : 1),
    z: Math.random(),
    c: i % 7 === 0 ? 'red' : i % 5 === 0 ? 'gold' : 'bright',
  }));

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(rect.width * dpr));
    H = Math.max(1, Math.round(rect.height * dpr));
    canvas.width = W; canvas.height = H;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  function ring(cx, cy, R, base, amp, k, speed, phase, color, width, alpha) {
    ctx.beginPath();
    const N = 140;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const wob = Math.sin(a * k + t * speed + phase) * 0.6
        + Math.sin(a * (k + 3) - t * speed * 1.7 + phase * 2) * 0.4;
      const r = R * (base + wob * amp);
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.lineWidth = width * 4 * dpr; ctx.strokeStyle = rgba(color, alpha * 0.18); ctx.stroke();
    ctx.lineWidth = width * dpr; ctx.strokeStyle = rgba(color, alpha); ctx.stroke();
  }

  let frames = 0, fpsT = last;
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now; t += dt;
    frames++;
    if (now - fpsT >= 1000) { onFps?.(Math.round((frames * 1000) / (now - fpsT))); frames = 0; fpsT = now; }

    burst *= Math.pow(0.04, dt); // schnelles Abklingen
    const target = Math.min(1, STATE_ENERGY[state] + external * 0.9 + burst);
    level += (target - level) * Math.min(1, dt * 8);
    const e = level;
    const breath = state === 'idle' ? Math.sin(t * 1.4) * 0.03 : 0;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2;

    // äußerer Schein
    let g = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * (0.95 + e * 0.15));
    g.addColorStop(0, rgba(colors.blue, 0.30 + e * 0.25));
    g.addColorStop(0.45, rgba(colors.blue, 0.12 + e * 0.12));
    g.addColorStop(1, rgba(colors.blue, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // roter Energiemantel (als Ring, damit sich Rot und Blau nicht zu Pink mischen)
    const mantle = R * (0.46 + e * 0.12 + breath);
    g = ctx.createRadialGradient(cx, cy, mantle * 0.45, cx, cy, mantle);
    g.addColorStop(0, rgba(colors.red, 0));
    g.addColorStop(0.55, rgba(colors.red, 0.22 + e * 0.25));
    g.addColorStop(1, rgba(colors.red, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, mantle, 0, Math.PI * 2); ctx.fill();

    // wabernde Energieringe
    const amp = 0.012 + e * 0.07;
    const spd = state === 'thinking' ? 3.2 : 1.2 + e * 2;
    ring(cx, cy, R, 0.34 + breath, amp, 5, spd, 0, colors.bright, 1.4, 0.75);
    ring(cx, cy, R, 0.40 + breath, amp * 1.2, 7, -spd * 0.8, 1.3, colors.red, 1.1, 0.6);
    ring(cx, cy, R, 0.29 + breath, amp * 0.8, 4, spd * 1.3, 2.1, colors.gold, 1.2, 0.7);

    // Denk-Bögen
    if (state === 'thinking' || e > 0.5) {
      ctx.lineWidth = 2.2 * dpr; ctx.strokeStyle = rgba(colors.gold, 0.65);
      for (let i = 0; i < 3; i++) {
        const a0 = t * 2.6 + (i * Math.PI * 2) / 3;
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.5, a0, a0 + 0.55); ctx.stroke();
      }
    }

    // Partikel
    for (const p of particles) {
      p.a += p.s * dt * (1 + e * 3);
      const pr = R * p.r * (1 + Math.sin(t * 2 + p.z * 6) * 0.02 * (1 + e * 4));
      const x = cx + Math.cos(p.a) * pr;
      const y = cy + Math.sin(p.a) * pr * (0.86 + p.z * 0.14);
      const size = (0.8 + p.z * 1.8) * dpr * (1 + e);
      ctx.fillStyle = rgba(colors[p.c], 0.25 + p.z * 0.55);
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }

    // heller Kern
    const core = R * (0.16 + e * 0.1 + breath * 0.5);
    g = ctx.createRadialGradient(cx, cy, 0, cx, cy, core);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.3, rgba(colors.gold, 0.8));
    g.addColorStop(0.7, rgba(colors.gold, 0.18));
    g.addColorStop(1, rgba(colors.gold, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, core, 0, Math.PI * 2); ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Spart Akku, wenn der Tab nicht sichtbar ist
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) running = false;
    else if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
  });

  return {
    setState(s) { state = STATE_ENERGY[s] !== undefined ? s : 'idle'; },
    setLevel(v) { external = Math.max(0, Math.min(1, v)); },
    pulse(v = 0.3) { burst = Math.min(0.8, burst + v); },
    refreshColors: readColors,
  };
}
