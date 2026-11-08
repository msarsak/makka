// Liefert die Handerkennung (MediaPipe) aus – alles läuft lokal im Browser.
import express from 'express';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const WASM_DIR = path.join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const MODEL_DIR = path.join(root, 'models');
const MODEL_FILE = path.join(MODEL_DIR, 'hand_landmarker.task');
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

let downloading = null;
export async function ensureHandModel() {
  if (fs.existsSync(MODEL_FILE) && fs.statSync(MODEL_FILE).size > 1_000_000) return MODEL_FILE;
  downloading ||= (async () => {
    await fsp.mkdir(MODEL_DIR, { recursive: true });
    console.log('  [kamera] Lade Handmodell (einmalig, ca. 8 MB) …');
    const r = await fetch(MODEL_URL, { signal: AbortSignal.timeout(120_000) });
    if (!r.ok) throw new Error('Download fehlgeschlagen: HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    await fsp.writeFile(MODEL_FILE + '.part', buf);
    await fsp.rename(MODEL_FILE + '.part', MODEL_FILE);
    console.log('  [kamera] Handmodell bereit.');
    return MODEL_FILE;
  })().finally(() => { downloading = null; });
  return downloading;
}

export function visionRoutes(app) {
  app.use('/mediapipe/wasm', express.static(WASM_DIR, { maxAge: '7d' }));
  app.get('/mediapipe/hand_landmarker.task', async (_req, res) => {
    try {
      res.sendFile(await ensureHandModel(), { maxAge: '30d' });
    } catch (err) {
      res.status(502).json({ error: 'Handmodell konnte nicht geladen werden: ' + err.message });
    }
  });
}
