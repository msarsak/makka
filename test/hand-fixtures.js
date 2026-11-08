// Künstliche Hände für Tests (MediaPipe-Format, 21 Punkte, normiert 0..1)
export function makeHand({ cx = 0.5, cy = 0.5, s = 0.1, pose = 'point' } = {}) {
  const lm = Array.from({ length: 21 }, () => ({ x: cx, y: cy + s, z: 0 }));
  const P = (i, dx, dy) => { lm[i] = { x: cx + dx * s, y: cy + dy * s, z: 0 }; };
  P(0, 0, 1);                       // Handgelenk
  P(9, 0, 0);                       // Mittelfinger-Grundgelenk (Handgröße = s)
  P(5, -0.2, 0); P(6, -0.2, -0.4);  // Zeigefinger
  P(10, 0, -0.4); P(14, 0.2, -0.35); P(18, 0.4, -0.3);
  const ext = pose === 'open' || pose === 'point' || pose === 'pinch';
  P(8, -0.2, ext ? -0.9 : 0.1);
  const others = pose === 'open';
  P(12, 0, others ? -0.95 : 0.1); P(16, 0.2, others ? -0.85 : 0.15); P(20, 0.4, others ? -0.7 : 0.2);
  if (pose === 'pinch') P(4, -0.25, -0.85);
  else if (pose === 'open') P(4, -0.8, 0.3);
  else P(4, -0.4, 0.2);
  return lm;
}
