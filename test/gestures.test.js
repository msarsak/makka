import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeHand, toScreen, createGestureEngine, recognizeShape } from '../src/gestures.js';
import { makeHand } from './hand-fixtures.js';

test('Handhaltungen werden erkannt', () => {
  assert.equal(analyzeHand(makeHand({ pose: 'pinch' })).pinching, true);
  assert.equal(analyzeHand(makeHand({ pose: 'point' })).pinching, false);
  assert.equal(analyzeHand(makeHand({ pose: 'point' })).open, false);
  assert.equal(analyzeHand(makeHand({ pose: 'open' })).open, true);
  assert.equal(analyzeHand(makeHand({ pose: 'fist' })).open, false);
});

test('Kamera ist gespiegelt: Hand rechts im Bild = Cursor links', () => {
  const p = toScreen({ x: 0.8, y: 0.5 }, 1000, 800);
  assert.ok(p.x < 300);
  assert.equal(Math.round(p.y), 400);
  assert.deepEqual(toScreen({ x: 1, y: 0 }, 100, 100), { x: 0, y: 0 }); // Rand wird abgeschnitten
});

function run(frames, opts = {}) {
  const ev = [];
  const e = createGestureEngine({
    onPinchStart: (id) => ev.push(['start', id]),
    onPinchMove: (id, pos, d) => ev.push(['move', id, Math.round(d.x)]),
    onPinchEnd: (id, pos, info) => ev.push(['end', id, info.tap ? 'tap' : info.cancelled ? 'cancel' : 'drag']),
    onZoom: (f) => ev.push(['zoom', Math.round(f * 100) / 100]),
    onPalmHold: (id) => ev.push(['palm', id]),
  }, { getSize: () => ({ w: 1000, h: 1000 }), smoothing: 0, ...opts });
  frames.forEach(([hands, t]) => e.feed({ hands }, t));
  return ev;
}

test('kurzes Greifen = Tippen', () => {
  const ev = run([
    [[{ id: 'R', landmarks: makeHand({ pose: 'point' }) }], 0],
    [[{ id: 'R', landmarks: makeHand({ pose: 'pinch' }) }], 30],
    [[{ id: 'R', landmarks: makeHand({ pose: 'point' }) }], 200],
  ]);
  assert.deepEqual(ev, [['start', 'R'], ['end', 'R', 'tap']]);
});

test('Greifen und Ziehen = Verschieben', () => {
  const ev = run([
    [[{ id: 'R', landmarks: makeHand({ cx: 0.5, pose: 'pinch' }) }], 0],
    [[{ id: 'R', landmarks: makeHand({ cx: 0.45, pose: 'pinch' }) }], 100],
    [[{ id: 'R', landmarks: makeHand({ cx: 0.4, pose: 'pinch' }) }], 200],
    [[{ id: 'R', landmarks: makeHand({ cx: 0.4, pose: 'point' }) }], 600],
  ]);
  assert.equal(ev[0][0], 'start');
  assert.ok(ev.filter((e) => e[0] === 'move').every((e) => e[2] > 0), 'Hand nach links im Bild = Cursor nach rechts');
  assert.deepEqual(ev.at(-1), ['end', 'R', 'drag']);
});

test('Hand verschwindet beim Greifen = abbrechen', () => {
  const ev = run([[[{ id: 'R', landmarks: makeHand({ pose: 'pinch' }) }], 0], [[], 50]]);
  assert.deepEqual(ev.at(-1), ['end', 'R', 'cancel']);
});

test('zwei Hände auseinanderziehen = reinzoomen', () => {
  const two = (d) => [{ id: 'L', landmarks: makeHand({ cx: 0.5 - d, pose: 'pinch' }) }, { id: 'R', landmarks: makeHand({ cx: 0.5 + d, pose: 'pinch' }) }];
  const ev = run([[two(0.1), 0], [two(0.15), 50], [two(0.2), 100]]);
  const zooms = ev.filter((e) => e[0] === 'zoom');
  assert.equal(zooms.length, 2);
  assert.ok(zooms.every((z) => z[1] > 1));
  assert.equal(ev.filter((e) => e[0] === 'move').length, 0, 'beim Zoomen wird nichts verschoben');
});

test('offene Hand 1,2 s halten löst einmal aus', () => {
  const open = [{ id: 'R', landmarks: makeHand({ pose: 'open' }) }];
  const ev = run([[open, 0], [open, 600], [open, 1300], [open, 2000]]);
  assert.deepEqual(ev.filter((e) => e[0] === 'palm'), [['palm', 'R']]);
});

// Formen
const circle = (cx, cy, r, n = 40) => Array.from({ length: n + 1 }, (_, i) => ({ x: cx + r * Math.cos((i / n) * 2 * Math.PI), y: cy + r * Math.sin((i / n) * 2 * Math.PI) }));
const rect = (x, y, w, h) => {
  const pts = [];
  const edge = (ax, ay, bx, by) => { for (let i = 0; i < 10; i++) pts.push({ x: ax + (bx - ax) * i / 10 + (Math.random() - 0.5) * 4, y: ay + (by - ay) * i / 10 + (Math.random() - 0.5) * 4 }); };
  edge(x, y, x + w, y); edge(x + w, y, x + w, y + h); edge(x + w, y + h, x, y + h); edge(x, y + h, x, y);
  pts.push({ x: x + 5, y: y + 3 });
  return pts;
};

test('Formen werden erkannt', () => {
  assert.equal(recognizeShape(rect(100, 100, 300, 180)).type, 'rect');
  assert.equal(recognizeShape(circle(400, 300, 120)).type, 'circle');
  const line = Array.from({ length: 20 }, (_, i) => ({ x: 100 + i * 20, y: 200 + i * 5 + (i % 2) * 3 }));
  assert.equal(recognizeShape(line).type, 'line');
  const tri = [{ x: 0, y: 200 }, { x: 100, y: 0 }, { x: 200, y: 200 }, { x: 0, y: 200 }].flatMap((p, i, a) => i < 3 ? Array.from({ length: 8 }, (_, k) => ({ x: p.x + (a[i + 1].x - p.x) * k / 8, y: p.y + (a[i + 1].y - p.y) * k / 8 })) : [p]);
  assert.equal(recognizeShape(tri).type, 'path');
  assert.equal(recognizeShape([{ x: 0, y: 0 }, { x: 2, y: 2 }, { x: 3, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 0 }, { x: 0, y: 1 }]), null);
});
