// Hephaestion – Startpunkt der Web-App. Verbindet HUD, Orb, Sounds und Chat.
import './styles.css';
import { createOrb } from './orb.js';
import { initAudio, sfx, isMuted, setMuted } from './sound.js';
import { buildTicks, startClock, startWeather, loadHealth, setModelInfo, setLatency, setFps } from './hud.js';
import { loadHistory, saveHistory, renderMessage, renderEmpty, sendChat, format } from './chat.js';

const $ = (id) => document.getElementById(id);
const app = $('app');
const log = $('log');
const input = $('input');
const sendBtn = $('sendBtn');
const turboBtn = $('turboBtn');
const muteBtn = $('muteBtn');

const STATE_TEXT = {
  idle: ['BEREIT', 'WIE KANN ICH HELFEN, BOSS?'],
  thinking: ['ANALYSIERE', 'EINEN MOMENT, BOSS …'],
  speaking: ['ANTWORTE', 'ÜBERTRAGUNG LÄUFT'],
  listening: ['HÖRE ZU', 'ICH BIN GANZ OHR'],
  error: ['STÖRUNG', 'DA HAKT ETWAS'],
};

const orb = createOrb($('orb'), { onFps: setFps });
let history = loadHistory();
let busy = false;
let turbo = false;
let controller = null;

function setState(s) {
  app.dataset.state = s;
  orb.setState(s);
  const [a, b] = STATE_TEXT[s] || STATE_TEXT.idle;
  $('coreState').textContent = a;
  $('coreSub').textContent = b;
}

function renderHistory() {
  log.innerHTML = '';
  if (!history.length) return renderEmpty(log);
  for (const m of history) renderMessage(log, m);
}

// ---------- Boot ----------
let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  initAudio();
  sfx.boot();
  $('boot').classList.add('gone');
  app.classList.add('ready');
  // Panel-Sounds passend zur Einblend-Animation
  document.querySelectorAll('.panel').forEach((p) => {
    const d = Number(getComputedStyle(p).getPropertyValue('--d')) || 1;
    setTimeout(() => sfx.panel(), d * 160 + 350);
  });
  orb.pulse(0.8);
  setTimeout(() => input.focus({ preventScroll: true }), 900);
}
$('bootBtn').addEventListener('click', boot);
window.addEventListener('keydown', (e) => { if (!booted && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); boot(); } });

// ---------- Eingabe ----------
function autosize() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 160) + 'px';
}
input.addEventListener('input', autosize);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('form').requestSubmit(); }
  if (e.key === 'Escape' && controller) controller.abort();
});

turboBtn.addEventListener('click', () => {
  turbo = !turbo;
  turboBtn.setAttribute('aria-pressed', String(turbo));
  turbo ? sfx.activate() : sfx.deactivate();
  orb.pulse(0.4);
});

function syncMute() { muteBtn.classList.toggle('muted', isMuted()); }
muteBtn.addEventListener('click', () => { setMuted(!isMuted()); syncMute(); if (!isMuted()) sfx.panel(); });
syncMute();

$('clearBtn').addEventListener('click', () => {
  if (busy) controller?.abort();
  history = [];
  saveHistory(history);
  renderHistory();
  sfx.panel();
  orb.pulse(0.3);
});

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || busy) return;
  if (!booted) boot();

  busy = true;
  sendBtn.disabled = true;
  input.value = ''; autosize();
  sfx.send();

  history.push({ role: 'user', content: text });
  renderMessage(log, { role: 'user', content: text });
  saveHistory(history);
  setState('thinking');

  const bubble = renderMessage(log, { role: 'assistant', content: '' });
  bubble.classList.add('streaming');
  const textEl = bubble.querySelector('.text');
  const whoEl = bubble.querySelector('.who');

  let reply = '';
  let started = false;
  let raf = 0;
  let lastTick = 0;
  const t0 = performance.now();
  const paint = () => { raf = 0; textEl.innerHTML = format(reply); log.scrollTop = log.scrollHeight; };

  controller = new AbortController();
  await sendChat({
    messages: history,
    turbo,
    signal: controller.signal,
    onMeta: ({ model, tier }) => {
      setModelInfo(model, tier);
      whoEl.insertAdjacentHTML('beforeend', `<em>${tier === 'smart' ? 'TIEF' : 'SCHNELL'}</em>`);
    },
    onDelta: (chunk) => {
      if (!started) { started = true; setState('speaking'); sfx.reply(); setLatency(performance.now() - t0); }
      reply += chunk;
      orb.pulse(Math.min(0.35, 0.08 + chunk.length * 0.02));
      const now = performance.now();
      if (now - lastTick > 70) { sfx.tick(); lastTick = now; }
      if (!raf) raf = requestAnimationFrame(paint);
    },
    onDone: () => {
      paint();
      history.push({ role: 'assistant', content: reply });
      saveHistory(history);
      setState('idle');
    },
    onError: (msg) => {
      if (reply) history.push({ role: 'assistant', content: reply });
      else history.pop(); // fehlgeschlagene Frage nicht speichern, damit man sie neu senden kann
      saveHistory(history);
      reply += (reply ? '\n\n' : '') + '⚠ ' + msg;
      paint();
      bubble.classList.add('err');
      sfx.error();
      setState('error');
      setTimeout(() => app.dataset.state === 'error' && setState('idle'), 3500);
    },
  });

  if (controller.signal.aborted && app.dataset.state !== 'idle') {
    if (reply) { history.push({ role: 'assistant', content: reply }); saveHistory(history); }
    setState('idle');
  }
  bubble.classList.remove('streaming');
  controller = null;
  busy = false;
  sendBtn.disabled = false;
  input.focus({ preventScroll: true });
});

// ---------- Start ----------
if (matchMedia('(max-width: 720px)').matches) input.placeholder = 'Nachricht …';
buildTicks();
startClock();
renderHistory();
setState('idle');
loadHealth();
startWeather();

// Für spätere Phasen (Sprache, Gesten) und zum Ausprobieren in der Browser-Konsole
window.hephaestion = { orb, sfx, setState };
