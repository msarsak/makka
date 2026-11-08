// Gesten-Logik (ohne Browser/Kamera, daher testbar).
// Eingabe: Hand-Landmarks von MediaPipe (21 Punkte pro Hand, x/y normiert 0..1).
// Ausgabe: Cursor, Pinch (greifen), Tippen, Zwei-Hand-Zoom, offene Hand halten.

const L = { WRIST: 0, THUMB_TIP: 4, INDEX_MCP: 5, INDEX_PIP: 6, INDEX_TIP: 8, MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_TIP: 12, RING_PIP: 14, RING_TIP: 16, PINKY_PIP: 18, PINKY_TIP: 20 };

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export const PINCH_ON = 0.32;   // Daumen–Zeigefinger-Abstand relativ zur Handgröße
export const PINCH_OFF = 0.45;  // Hysterese: erst loslassen, wenn deutlich offen
export const MARGIN = 0.12;     // Rand des Kamerabilds, der nicht gebraucht wird
export const TAP_MS = 350;
export const TAP_MOVE = 28;
export const PALM_HOLD_MS = 1200;

/** Kamerakoordinate → Bildschirmpunkt (gespiegelt wie ein Spiegel, Rand ausgeblendet). */
export function toScreen(p, w, h, margin = MARGIN) {
  const nx = ((1 - p.x) - margin) / (1 - 2 * margin);
  const ny = (p.y - margin) / (1 - 2 * margin);
  return { x: Math.min(1, Math.max(0, nx)) * w, y: Math.min(1, Math.max(0, ny)) * h };
}

function extended(lm, tip, pip) {
  return dist(lm[tip], lm[L.WRIST]) > dist(lm[pip], lm[L.WRIST]) * 1.12;
}

/** Wertet eine Hand aus. wasPinching sorgt für die Hysterese. */
export function analyzeHand(lm, wasPinching = false) {
  const size = dist(lm[L.WRIST], lm[L.MIDDLE_MCP]) || 1e-6;
  const ratio = dist(lm[L.THUMB_TIP], lm[L.INDEX_TIP]) / size;
  const pinching = wasPinching ? ratio < PINCH_OFF : ratio < PINCH_ON;
  const fingers = [
    extended(lm, L.INDEX_TIP, L.INDEX_PIP),
    extended(lm, L.MIDDLE_TIP, L.MIDDLE_PIP),
    extended(lm, L.RING_TIP, L.RING_PIP),
    extended(lm, L.PINKY_TIP, L.PINKY_PIP),
  ];
  const thumbOut = dist(lm[L.THUMB_TIP], lm[L.INDEX_MCP]) / size > 0.55;
  const open = !pinching && fingers.every(Boolean) && thumbOut;
  const point = pinching ? mid(lm[L.THUMB_TIP], lm[L.INDEX_TIP]) : lm[L.INDEX_TIP];
  return { pinching, open, point, ratio };
}

/**
 * Gesten-Maschine. Bekommt pro Kamerabild feed({ hands: [{ id, landmarks }] }, zeitInMs).
 * Callbacks: onCursors, onPinchStart, onPinchMove, onPinchEnd, onZoom, onPalmProgress, onPalmHold
 */
export function createGestureEngine(cb = {}, { getSize = () => ({ w: 1, h: 1 }), smoothing = 0.45 } = {}) {
  const state = new Map(); // id → { pos, pinching, start, startPos, moved, openSince, palmFired }
  let zoomDist = null;

  function feed(frame, t) {
    const { w, h } = getSize();
    const seen = new Set();
    const cursors = [];

    for (const hand of frame.hands || []) {
      const id = hand.id ?? 'hand';
      seen.add(id);
      let s = state.get(id);
      const a = analyzeHand(hand.landmarks, s?.pinching);
      const target = toScreen(a.point, w, h);
      if (!s) { s = { pos: target, pinching: false, openSince: 0, palmFired: false }; state.set(id, s); }
      // Glätten gegen Zittern
      const prev = s.pos;
      s.pos = { x: prev.x + (target.x - prev.x) * (1 - smoothing), y: prev.y + (target.y - prev.y) * (1 - smoothing) };

      if (a.pinching && !s.pinching) {
        s.pinching = true; s.start = t; s.startPos = { ...s.pos }; s.moved = 0;
        cb.onPinchStart?.(id, s.pos);
      } else if (a.pinching && s.pinching) {
        const d = { x: s.pos.x - prev.x, y: s.pos.y - prev.y };
        s.moved = Math.max(s.moved, dist(s.pos, s.startPos));
        if (!zoomDist) cb.onPinchMove?.(id, s.pos, d);
      } else if (!a.pinching && s.pinching) {
        s.pinching = false;
        cb.onPinchEnd?.(id, s.pos, { tap: t - s.start < TAP_MS && s.moved < TAP_MOVE, cancelled: false });
      }

      // Offene Hand halten (z. B. Zeichnungen löschen)
      if (a.open) {
        if (!s.openSince) s.openSince = t;
        const p = Math.min(1, (t - s.openSince) / PALM_HOLD_MS);
        cb.onPalmProgress?.(id, p);
        if (p >= 1 && !s.palmFired) { s.palmFired = true; cb.onPalmHold?.(id, s.pos); }
      } else if (s.openSince) {
        s.openSince = 0; s.palmFired = false; cb.onPalmProgress?.(id, 0);
      }
      cursors.push({ id, x: s.pos.x, y: s.pos.y, pinching: s.pinching, open: a.open });
    }

    // Hände, die verschwunden sind
    for (const [id, s] of state) {
      if (seen.has(id)) continue;
      if (s.pinching) cb.onPinchEnd?.(id, s.pos, { tap: false, cancelled: true });
      if (s.openSince) cb.onPalmProgress?.(id, 0);
      state.delete(id);
    }

    // Zwei Hände greifen gleichzeitig → Zoom
    const pinchers = [...state.values()].filter((s) => s.pinching);
    if (pinchers.length >= 2) {
      const d = dist(pinchers[0].pos, pinchers[1].pos);
      if (zoomDist && d > 1) cb.onZoom?.(d / zoomDist, mid(pinchers[0].pos, pinchers[1].pos));
      zoomDist = d;
    } else zoomDist = null;

    cb.onCursors?.(cursors);
    return cursors;
  }

  return { feed, reset() { state.clear(); zoomDist = null; } };
}

// ---------- Formerkennung für Luft-Zeichnungen ----------
function area(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

/** Erkennt aus einer gezeichneten Linie: Rechteck, Kreis, Linie oder freie Form. */
export function recognizeShape(points) {
  if (!points || points.length < 6) return null;
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  const w = Math.max(...xs) - x, h = Math.max(...ys) - y;
  const diag = Math.hypot(w, h);
  if (diag < 30) return null; // zu klein – war wohl nur ein Tippen
  let len = 0;
  for (let i = 1; i < points.length; i++) len += dist(points[i], points[i - 1]);
  const first = points[0], last = points[points.length - 1];
  const closed = dist(first, last) < diag * 0.28 && len > diag * 1.6;

  if (!closed) {
    if (dist(first, last) / len > 0.88) return { type: 'line', x1: first.x, y1: first.y, x2: last.x, y2: last.y };
    return { type: 'path', points };
  }
  const fill = area(points) / Math.max(1, w * h);
  if (fill > 0.86) return { type: 'rect', x, y, w, h };
  if (fill > 0.62) return { type: 'circle', cx: x + w / 2, cy: y + h / 2, rx: w / 2, ry: h / 2 };
  return { type: 'path', points, closed: true };
}
