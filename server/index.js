// Hephaestion-Server: hält die Geheimnisse, spricht mit Claude, liefert die Web-App aus.
import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { streamReply, hasKey, friendlyError } from './claude.js';
import { chooseModel } from './router.js';
import { getWeather } from './weather.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, '..', 'dist');
const PORT = Number(process.env.PORT) || 3000;
const startedAt = Date.now();

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    name: 'Hephaestion',
    phase: 2,
    mode: hasKey() ? 'live' : 'demo',
    models: { fast: process.env.MODEL_FAST || 'claude-haiku-5-5', smart: process.env.MODEL_SMART || 'claude-opus-5-5' },
    uptimeSec: Math.round((Date.now() - startedAt) / 1000),
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

// Chat als Live-Stream (Server-Sent Events)
app.post('/api/chat', async (req, res) => {
  const { messages, turbo, timeZone } = req.body || {};
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
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`\n  ⚡ HEPHAESTION online  →  http://localhost:${PORT}`);
  console.log(`  Modus: ${hasKey() ? 'LIVE (Claude API)' : 'DEMO (kein API-Key in .env)'}\n`);
});
