// Webcam + Handerkennung (MediaPipe). Läuft komplett lokal – das Kamerabild verlässt den Laptop nie.
let landmarker = null;
let HAND_CONNECTIONS = [];

async function loadLandmarker() {
  if (landmarker) return landmarker;
  const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
  HAND_CONNECTIONS = HandLandmarker.HAND_CONNECTIONS;
  const files = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
  const opts = (delegate) => ({
    baseOptions: { modelAssetPath: '/mediapipe/hand_landmarker.task', delegate },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.5,
  });
  try { landmarker = await HandLandmarker.createFromOptions(files, opts('GPU')); }
  catch { landmarker = await HandLandmarker.createFromOptions(files, opts('CPU')); } // Fallback ohne Grafikkarte
  return landmarker;
}

/**
 * Startet Kamera und Erkennung. onFrame({ hands: [{ id, landmarks }] }, t) wird pro Kamerabild aufgerufen.
 * Liefert { video, stop(), connections }.
 */
export async function startHands({ onFrame, onStatus }) {
  onStatus?.('KAMERA WIRD GESTARTET …');
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user', frameRate: { ideal: 30 } },
    audio: false,
  });
  const video = document.createElement('video');
  video.muted = true; video.playsInline = true; video.autoplay = true;
  video.srcObject = stream;
  await video.play();

  onStatus?.('LADE HANDERKENNUNG …');
  let lm;
  try { lm = await loadLandmarker(); }
  catch (err) { stream.getTracks().forEach((t) => t.stop()); throw err; }
  onStatus?.('BEREIT');

  let running = true;
  let lastTime = -1;
  let raf = 0;
  const loop = () => {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (video.readyState < 2 || video.currentTime === lastTime) return; // nur neue Kamerabilder
    lastTime = video.currentTime;
    const now = performance.now();
    let res;
    try { res = lm.detectForVideo(video, now); } catch { return; }
    const hands = (res.landmarks || []).map((landmarks, i) => ({
      id: res.handedness?.[i]?.[0]?.categoryName || `H${i}`,
      landmarks,
    }));
    onFrame({ hands }, now);
  };
  loop();

  return {
    video,
    connections: HAND_CONNECTIONS,
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    },
  };
}
