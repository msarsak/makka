// Hephaestion-Server: hält die Geheimnisse, spricht mit Claude, liefert die Web-App aus.
import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { streamReply, hasKey, friendlyError } from './claude.js';
import { chooseModel } from './router.js';
import { getWeather } from './weather.js';
import { memoryStats, ensureVault, vaultRoot } from './memory.js';
import { learnFromConversation } from './learn.js';
import { visionRoutes } from './vision.js';
import { listWorkflows, saveWorkflow, deleteWorkflow, takeConfirmation, runWebhook } from './n8n.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, '..', 'dist');
const PORT = Number(process.env.PORT) || 3000;
// Nur auf diesem Laptop erreichbar. Das Handy kommt sicher über Tailscale (handy.bat).
const HOST = process.env.HOST || '127.0.0.1';
const startedAt = Date.now();

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '4mb' })); // Kamerabilder

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    name: 'Hephaestion',
    phase: 6,
    mode: hasKey() ? 'live' : 'demo',
    models: { fast: process.env.MODEL_FAST || 'claude-haiku-5-5', smart: process.env.MODEL_SMART || 'claude-opus-5-5' },
    uptimeSec: Math.round((Date.now() - startedAt) / 1000),
  });
});

visionRoutes(app);

// ---------- n8n-Workflows ----------
app.get('/api/n8n', async (_req, res) => res.json(await listWorkflows()));
app.post('/api/n8n', async (req, res) => {
  try { res.json(await saveWorkflow(req.body || {})); } catch (e) { res.status(400).json({ error: e.message }); }
});
app.delete('/api/n8n/:id', async (req, res) => { await deleteWorkflow(req.params.id); res.json({ ok: true }); });
app.post('/api/n8n/test/:id', async (req, res) => {
  const wf = (await listWorkflows()).find((w) => w.id === req.params.id);
  if (!wf) return res.status(404).json({ error: 'Nicht gefunden' });
  try { res.json({ ok: true, result: await runWebhook(wf, { test: true }) }); } catch (e) { res.status(502).json({ error: e.message }); }
});
// Freigabe durch den Boss (Klick auf AUSFÜHREN im HUD)
app.post('/api/n8n/confirm/:id', async (req, res) => {
  const p = takeConfirmation(req.params.id);
  if (!p) return res.status(410).json({ error: 'Freigabe abgelaufen – bitte nochmal fragen.' });
  if (req.body?.approve !== true) return res.json({ ok: true, cancelled: true });
  try { res.json({ ok: true, result: await runWebhook(p.wf, p.data) }); } catch (e) { res.status(502).json({ error: e.message }); }
});

app.get('/api/memory', async (_req, res) => res.json(await memoryStats()));

// Nach jeder Antwort: still dazulernen
let learning = Promise.resolve();
app.post('/api/memory/learn', (req, res) => {
  const run = learning.then(() => learnFromConversation(req.body?.messages));
  learning = run.catch(() => {});
  run.then((r) => res.json(r)).catch((err) => {
    console.error('[lernen]', err?.status ?? '', err?.message);
    res.status(500).json({ saved: [], error: friendlyError(err) });
  });
});

app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    res.json(await getWeather({ lat, lon, city: process.env.WEATHER_CITY || 'Berlin' }));
  } catch (err) {
    res.status(502).json({ error: 'Wetterdaten nicht erreichbar: ' + err.message });
  }
});

function parseImage(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m || m[2].length > 3_000_000) return null;
  return { mediaType: m[1], data: m[2] };
}

function sanitizeHud(h) {
  const loc = h?.location;
  return {
    earthOpen: Boolean(h?.earthOpen),
    streetOpen: Boolean(h?.streetOpen),
    location: loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)
      ? { name: String(loc.name || 'Ort').slice(0, 120), lat: loc.lat, lng: loc.lng } : null,
  };
}

// Chat als Live-Stream (Server-Sent Events)
app.post('/api/chat', async (req, res) => {
  const { messages, turbo, timeZone, hud } = req.body || {};
  const image = parseImage(req.body?.image);
  const lastUser = [...(messages || [])].reverse().find((m) => m?.role === 'user');
  const route = chooseModel(lastUser?.content, { turbo: Boolean(turbo) });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const abort = new AbortController();
  res.on('close', () => { if (!res.writableEnded) abort.abort(); });

  const t0 = Date.now();
  send('meta', { tier: route.tier, model: hasKey() ? route.model : 'demo', reason: route.reason });
  try {
    const result = await streamReply({
      messages,
      route,
      timeZone: typeof timeZone === 'string' && timeZone.length < 64 ? timeZone : 'Europe/Berlin',
      signal: abort.signal,
      onText: (text) => send('delta', { text }),
      onTool: (t) => send('tool', t),
      onSaved: (f) => send('saved', f),
      onAction: (a) => send('action', a),
      hud: sanitizeHud(hud),
      image,
    });
    send('done', { ...result, ms: Date.now() - t0 });
  } catch (err) {
    if (!abort.signal.aborted) {
      console.error('[chat]', err?.status ?? '', err?.message);
      send('error', { message: friendlyError(err) });
    }
  }
  res.end();
});

// Fertig gebaute Web-App ausliefern (npm start)
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/(api|mediapipe)\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

ensureVault().catch((e) => console.error('[gedächtnis] Vault nicht nutzbar:', e.message));

app.listen(PORT, HOST, () => {
  console.log(`\n  ⚡ HEPHAESTION online  →  http://localhost:${PORT}`);
  console.log(`  Modus: ${hasKey() ? 'LIVE (Claude API)' : 'DEMO (kein API-Key in .env)'}`);
  console.log(`  Gedächtnis: ${vaultRoot()}\n`);
});
