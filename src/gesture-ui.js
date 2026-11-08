// Handgesten im HUD: Cursor, Greifen (Fenster verschieben, Erde drehen), Tippen,
// Zwei-Hand-Zoom und Formen in die Luft zeichnen.
import { createGestureEngine, recognizeShape } from './gestures.js';
import { createHudWindow, windowFor } from './windows.js';
import { sfx } from './sound.js';

const STORE = 'heph.drawings.v1';
const NS = 'http://www.w3.org/2000/svg';
const CLICKABLE = 'button, a, select, [role="button"], .mini-btn, .toggle';

function cssVar(name, fb) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb; }

export function createGestureUI({ getEarth, onModeChange, onActiveChange, onLook } = {}) {
  // ---------- Ebenen ----------
  const canvas = document.createElement('canvas');
  canvas.id = 'gestureLayer';
  canvas.className = 'gesture-layer';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const svg = document.createElementNS(NS, 'svg');
  svg.id = 'drawLayer';
  svg.setAttribute('class', 'draw-layer');
  svg.innerHTML = `<defs><filter id="drawGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g id="drawShapes"></g>`;
  document.body.appendChild(svg);
  const shapesG = svg.querySelector('#drawShapes');

  let dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  };
  addEventListener('resize', resize);
  resize();

  // ---------- Zustand ----------
  let mode = 'navigate';           // navigate | draw
  let active = false;
  let session = null;              // { video, stop, connections }
  let lastHands = [];
  let cursors = [];
  const grabs = new Map();         // id → { kind, win?, stroke? }
  const palm = new Map();          // id → Fortschritt 0..1
  let hovered = new Set();
  let shapes = [];
  try { shapes = JSON.parse(localStorage.getItem(STORE)) || []; } catch { shapes = []; }

  // ---------- Kamera-Fenster ----------
  const win = createHudWindow({ id: 'winCam', title: 'KAMERA', className: 'win-cam', onClose: () => api.stop() });
  win.body.innerHTML = `
    <div class="cam-stage"><div class="cam-mirror"><canvas class="cam-skeleton"></canvas></div><div class="cam-status">AUS</div></div>
    <div class="cam-tools">
      <button type="button" class="toggle" data-mode="navigate">NAVIGIEREN</button>
      <button type="button" class="toggle" data-mode="draw">ZEICHNEN</button>
      <button type="button" class="mini-btn" data-act="clear">LÖSCHEN</button>
      <button type="button" class="mini-btn" data-act="look" title="Hephaestion schaut durch die Kamera">👁</button>
    </div>
    <p class="cam-help"></p>`;
  const stage = win.body.querySelector('.cam-mirror');
  const skel = win.body.querySelector('.cam-skeleton');
  const skelCtx = skel.getContext('2d');
  const statusEl = win.body.querySelector('.cam-status');
  const helpEl = win.body.querySelector('.cam-help');
  win.body.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => api.setMode(b.dataset.mode)));
  win.body.querySelector('[data-act="clear"]').addEventListener('click', () => api.clear());
  win.body.querySelector('[data-act="look"]').addEventListener('click', () => onLook?.());

  const HELP = {
    navigate: '☝ Zeigefinger = Cursor · 🤏 kurz greifen = Klick · greifen + ziehen = Fenster verschieben / Erde drehen · 🤏🤏 zwei Hände = Zoom',
    draw: '🤏 greifen + malen = zeichnen (Rechteck, Kreis, Linie werden erkannt) · ✋ offene Hand halten = alles löschen',
  };
  function syncModeUi() {
    win.body.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    helpEl.textContent = HELP[mode];
    document.body.classList.toggle('gesture-draw', active && mode === 'draw');
  }
  syncModeUi();

  // ---------- Formen ----------
  function label(text, x, y) {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', x); t.setAttribute('y', y);
    t.setAttribute('class', 'draw-label');
    t.textContent = text;
    return t;
  }
  function renderShape(s, animate = true) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', `draw-shape draw-${s.type}${animate ? ' draw-in' : ''}`);
    let el;
    if (s.type === 'rect') {
      el = document.createElementNS(NS, 'rect');
      Object.entries({ x: s.x, y: s.y, width: s.w, height: s.h }).forEach(([k, v]) => el.setAttribute(k, v));
      g.append(el, label(`RECHTECK ${Math.round(s.w)} × ${Math.round(s.h)}`, s.x, s.y - 8));
    } else if (s.type === 'circle') {
      el = document.createElementNS(NS, 'ellipse');
      Object.entries({ cx: s.cx, cy: s.cy, rx: s.rx, ry: s.ry }).forEach(([k, v]) => el.setAttribute(k, v));
      g.append(el, label(`KREIS Ø ${Math.round(s.rx + s.ry)}`, s.cx - s.rx, s.cy - s.ry - 8));
    } else if (s.type === 'line') {
      el = document.createElementNS(NS, 'line');
      Object.entries({ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 }).forEach(([k, v]) => el.setAttribute(k, v));
      const len = Math.round(Math.hypot(s.x2 - s.x1, s.y2 - s.y1));
      g.append(el, label(`LINIE ${len}`, (s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2 - 10));
    } else {
      el = document.createElementNS(NS, s.closed ? 'polygon' : 'polyline');
      el.setAttribute('points', s.points.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(' '));
      g.append(el);
    }
    el.setAttribute('filter', 'url(#drawGlow)');
    el.setAttribute('pathLength', '1');
    shapesG.appendChild(g);
  }
  shapes.forEach((s) => renderShape(s, false));
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(shapes.slice(-50))); } catch { /* egal */ } };

  // ---------- Was liegt unter dem Finger? ----------
  const under = (p) => document.elementFromPoint(p.x, p.y);
  function setHover(list) {
    const now = new Set();
    for (const c of list) {
      const el = under(c)?.closest?.(CLICKABLE);
      if (el) now.add(el);
    }
    hovered.forEach((el) => { if (!now.has(el)) el.classList.remove('g-hover'); });
    now.forEach((el) => el.classList.add('g-hover'));
    hovered = now;
  }
  function tap(p) {
    const el = under(p);
    const target = el?.closest?.(CLICKABLE) || el?.closest?.('#core');
    if (target) { target.click(); sfx.panel(); return true; }
    return false;
  }

  // ---------- Gesten → Aktionen ----------
  const engine = createGestureEngine({
    onCursors(list) { cursors = list; setHover(list); },
    onPinchStart(id, p) {
      if (mode === 'draw' && !under(p)?.closest?.('.win-cam')) {
        grabs.set(id, { kind: 'stroke', points: [p] });
        return;
      }
      const el = under(p);
      const earth = getEarth?.();
      if (earth && el?.closest?.('.earth-stage')) { grabs.set(id, { kind: 'earth' }); return; }
      const w = windowFor(el);
      if (w && !el.closest(CLICKABLE)) { w.front(); grabs.set(id, { kind: 'window', win: w }); return; }
      grabs.set(id, { kind: 'none' });
    },
    onPinchMove(id, p, d) {
      const g = grabs.get(id);
      if (!g) return;
      if (g.kind === 'earth') getEarth?.()?.rotateBy(d.x, d.y);
      else if (g.kind === 'window') g.win.moveBy(d.x, d.y);
      else if (g.kind === 'stroke') {
        const last = g.points[g.points.length - 1];
        if (Math.hypot(p.x - last.x, p.y - last.y) > 3) g.points.push(p);
      }
    },
    onPinchEnd(id, p, info) {
      const g = grabs.get(id);
      grabs.delete(id);
      if (info.cancelled) return;
      if (g?.kind === 'stroke') {
        const shape = recognizeShape(g.points);
        if (shape) { shapes.push(shape); renderShape(shape); save(); sfx.activate(); return; }
      }
      if (info.tap) tap(p);
    },
    onZoom(f) { getEarth?.()?.zoomBy(f); },
    onPalmProgress(id, v) { if (v) palm.set(id, v); else palm.delete(id); },
    onPalmHold() { if (mode === 'draw' && shapes.length) api.clear(); },
  }, { getSize: () => ({ w: innerWidth, h: innerHeight }) });

  // ---------- Zeichnen der Cursor (eigene Animationsschleife, nur wenn aktiv) ----------
  let raf = 0;
  function paint() {
    raf = active ? requestAnimationFrame(paint) : 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const gold = cssVar('--gold', '#ffc94d'), blue = cssVar('--blue-bright', '#5cc2ff'), red = cssVar('--red', '#ff2a45');
    // Live-Striche
    for (const g of grabs.values()) {
      if (g.kind !== 'stroke' || g.points.length < 2) continue;
      ctx.beginPath();
      g.points.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
      ctx.strokeStyle = red; ctx.lineWidth = 3; ctx.shadowColor = red; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0;
    }
    for (const c of cursors) {
      const col = mode === 'draw' ? red : blue;
      ctx.beginPath(); ctx.arc(c.x, c.y, c.pinching ? 9 : 15, 0, Math.PI * 2);
      ctx.lineWidth = 2; ctx.strokeStyle = c.pinching ? gold : col; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 14; ctx.stroke();
      if (c.pinching) { ctx.fillStyle = gold; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1; }
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(c.x, c.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      const v = palm.get(c.id);
      if (v && mode === 'draw' && shapes.length) {
        ctx.beginPath(); ctx.arc(c.x, c.y, 26, -Math.PI / 2, -Math.PI / 2 + v * Math.PI * 2);
        ctx.strokeStyle = red; ctx.lineWidth = 4; ctx.stroke();
      }
    }
    // Skelett im Kamerafenster
    if (session && win.isOpen) {
      const w = skel.clientWidth, h = skel.clientHeight;
      if (skel.width !== w * dpr) { skel.width = w * dpr; skel.height = h * dpr; }
      skelCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      skelCtx.clearRect(0, 0, w, h);
      skelCtx.strokeStyle = blue; skelCtx.fillStyle = gold; skelCtx.lineWidth = 2;
      for (const hand of lastHands) {
        for (const { start, end } of session.connections) {
          const a = hand.landmarks[start], b = hand.landmarks[end];
          skelCtx.beginPath(); skelCtx.moveTo(a.x * w, a.y * h); skelCtx.lineTo(b.x * w, b.y * h); skelCtx.stroke();
        }
        for (const pt of hand.landmarks) { skelCtx.beginPath(); skelCtx.arc(pt.x * w, pt.y * h, 2.5, 0, Math.PI * 2); skelCtx.fill(); }
      }
    }
  }

  function feed(frame, t) {
    lastHands = frame.hands || [];
    engine.feed(frame, t);
  }
  // Kamerabilder kurz ignorieren, wenn von außen (Test/Simulation) Hände eingespeist werden
  let simulatedUntil = 0;
  const cameraFeed = (frame, t) => { if (performance.now() > simulatedUntil) feed(frame, t); };

  const api = {
    get active() { return active; },
    get mode() { return mode; },
    get shapes() { return shapes; },
    get video() { return session?.video || null; },
    feed(frame, t) { simulatedUntil = performance.now() + 1500; feed(frame, t); }, // zum Testen ohne echte Hände
    async start() {
      if (active) { win.open(); return; }
      win.open();
      statusEl.textContent = 'STARTE …';
      active = true;
      document.body.classList.add('gesture-on');
      syncModeUi();
      onActiveChange?.(true);
      if (!raf) paint();
      try {
        const { startHands } = await import('./hands.js');
        if (!active) return;
        session = await startHands({ onFrame: cameraFeed, onStatus: (s) => { statusEl.textContent = s; } });
        if (!active) { session.stop(); session = null; return; }
        stage.prepend(session.video);
        statusEl.textContent = 'HÄNDE ZEIGEN';
        sfx.activate();
      } catch (err) {
        console.error(err);
        statusEl.textContent = /Permission|NotAllowed/i.test(err?.name + err?.message) ? 'KAMERA BLOCKIERT – OBEN IN DER ADRESSLEISTE ERLAUBEN'
          : /NotFound|DevicesNotFound/i.test(err?.name) ? 'KEINE KAMERA GEFUNDEN' : 'FEHLER: ' + (err?.message || err);
        sfx.error();
      }
    },
    stop() {
      if (!active) return;
      active = false;
      session?.stop(); session?.video.remove(); session = null;
      engine.reset(); grabs.clear(); palm.clear(); cursors = []; lastHands = [];
      setHover([]);
      document.body.classList.remove('gesture-on', 'gesture-draw');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      statusEl.textContent = 'AUS';
      if (win.isOpen) win.close();
      onActiveChange?.(false);
    },
    setMode(m) {
      if (m !== 'draw' && m !== 'navigate') return;
      mode = m;
      syncModeUi();
      sfx.panel();
      onModeChange?.(m);
    },
    clear() {
      shapes = []; save();
      shapesG.querySelectorAll('.draw-shape').forEach((g) => { g.classList.add('draw-out'); setTimeout(() => g.remove(), 400); });
      sfx.deactivate();
    },
  };
  return api;
}
