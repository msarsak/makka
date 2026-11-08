// Hephaestion – Startpunkt der Web-App. Verbindet HUD, Orb, Sounds, Chat und Sprache.
import './styles.css';
import { createOrb } from './orb.js';
import { initAudio, sfx, isMuted, setMuted } from './sound.js';
import { buildTicks, startClock, startWeather, loadHealth, loadMemory, setModelInfo, setLatency, setFps } from './hud.js';
import { loadHistory, saveHistory, renderMessage, renderEmpty, sendChat, format, renderMemoryNote, learn } from './chat.js';
import { createVoice } from './voice.js';
import { SentenceBuffer } from './voice-utils.js';
import { createHudWindow } from './windows.js';
import { getHome } from './hud.js';

const $ = (id) => document.getElementById(id);
const app = $('app');
const log = $('log');
const input = $('input');
const sendBtn = $('sendBtn');
const turboBtn = $('turboBtn');
const muteBtn = $('muteBtn');
const micBtn = $('micBtn');

const STATE_TEXT = {
  idle: ['BEREIT', 'WIE KANN ICH HELFEN, BOSS?'],
  thinking: ['ANALYSIERE', 'EINEN MOMENT, BOSS …'],
  speaking: ['ANTWORTE', 'ÜBERTRAGUNG LÄUFT'],
  listening: ['HÖRE ZU', 'ICH BIN GANZ OHR, BOSS'],
  error: ['STÖRUNG', 'DA HAKT ETWAS'],
};

const load = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const store = (k, v) => { try { localStorage.setItem(k, v); } catch { /* egal */ } };

const orb = createOrb($('orb'), { onFps: setFps });
let history = loadHistory();
let busy = false;
let turbo = false;
let controller = null;
let speakMode = load('heph.speakMode', 'voice'); // voice | always | off

function setState(s, sub) {
  app.dataset.state = s;
  orb.setState(s);
  const [a, b] = STATE_TEXT[s] || STATE_TEXT.idle;
  $('coreState').textContent = a;
  const subEl = $('coreSub');
  subEl.textContent = sub || b;
  subEl.classList.toggle('interim', Boolean(sub));
}
function idleOrListening() { if (!busy && !voice.speaking) setState('idle'); }

function renderHistory() {
  log.innerHTML = '';
  if (!history.length) return renderEmpty(log);
  for (const m of history) renderMessage(log, m);
}

// ---------- Sprache ----------
const VC_STATUS = {
  unsupported: ['NICHT VERFÜGBAR', ''],
  off: ['AUS', ''],
  wake: ['HÖRT MIT', 'live'],
  command: ['HÖRT ZU', 'listen'],
  paused: ['SPRICHT', 'live'],
};
let wordPulse = 0;
const voice = createVoice({
  onStatus(s) {
    const [t, cls] = VC_STATUS[s] || VC_STATUS.off;
    const el = $('vcStatus');
    el.textContent = t; el.className = cls;
  },
  onListening(on, timedOut) {
    micBtn.classList.toggle('active', on);
    if (on) { sfx.activate(); setState('listening'); }
    else { orb.setLevel(0); if (timedOut) sfx.deactivate(); if (app.dataset.state === 'listening') idleOrListening(); }
  },
  onInterim(text) { if (app.dataset.state === 'listening') setState('listening', '» ' + text); },
  onLevel(v) { orb.setLevel(v); },
  onCommand(text) { ask(text, { viaVoice: true }); },
  onSpeakStart() { micBtn.classList.add('speaking'); setState('speaking'); },
  onSpeakEnd() { micBtn.classList.remove('speaking'); orb.setLevel(0); idleOrListening(); },
  onWord() {
    // Die Browser-Stimme liefert keinen Pegel – wir lassen den Kern pro Wort pulsieren
    orb.pulse(0.22);
    orb.setLevel(0.35);
    clearTimeout(wordPulse);
    wordPulse = setTimeout(() => orb.setLevel(0.08), 180);
  },
  onVoices(list, current) {
    const sel = $('voiceSelect');
    if (!list.length) { sel.innerHTML = '<option>Keine deutsche Stimme gefunden</option>'; return; }
    sel.innerHTML = list.map((v) => `<option value="${v.name.replace(/"/g, '&quot;')}">${v.name.replace(/^Microsoft /, '').replace(/ - German.*$/, '').replace(/</g, '')}</option>`).join('');
    if (current) sel.value = current.name;
  },
  onError(msg) {
    sfx.error();
    renderMessage(log, { role: 'assistant', content: '⚠ ' + msg, error: true });
    setWakeUi(voice.wakeEnabled);
  },
});

function setWakeUi(on) {
  const b = $('wakeBtn');
  b.setAttribute('aria-pressed', String(on));
  b.textContent = on ? 'AN' : 'AUS';
}
$('wakeBtn').addEventListener('click', () => {
  const on = !voice.wakeEnabled;
  voice.setWake(on);
  store('heph.wake', on ? '1' : '0');
  setWakeUi(voice.wakeEnabled);
  on ? sfx.activate() : sfx.deactivate();
});

const SPEAK_LABEL = { voice: 'BEI SPRACHE', always: 'IMMER', off: 'AUS' };
function syncSpeakMode() { const b = $('speakModeBtn'); b.dataset.mode = speakMode; b.textContent = SPEAK_LABEL[speakMode]; }
$('speakModeBtn').addEventListener('click', () => {
  speakMode = { voice: 'always', always: 'off', off: 'voice' }[speakMode];
  store('heph.speakMode', speakMode);
  syncSpeakMode();
  sfx.panel();
  if (speakMode === 'off') voice.stopSpeaking();
});
$('voiceSelect').addEventListener('change', (e) => voice.setVoice(e.target.value));
$('voiceTest').addEventListener('click', () => {
  voice.stopSpeaking();
  voice.beginReply();
  voice.say('Zu Ihren Diensten, Boss. So klinge ich.');
  voice.endReply();
});

function toggleTalk() {
  if (!booted) boot();
  if (voice.speaking) { voice.stopSpeaking(); return; }
  if (micBtn.classList.contains('active')) { voice.cancelListening(); return; }
  if (!voice.supported.stt) {
    renderMessage(log, { role: 'assistant', content: '⚠ Spracherkennung gibt es in diesem Browser nicht. Bitte Edge oder Chrome verwenden.', error: true });
    return;
  }
  voice.listenOnce();
}
micBtn.addEventListener('click', toggleTalk);
$('core').addEventListener('click', toggleTalk);
$('core').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTalk(); } });

// ---------- 3D-Erde & Street View ----------
const hud = { earthOpen: false, streetOpen: false, location: null };
let earthWin = null, earth = null, earthLoading = null;
let streetWin = null;

function syncCore() {
  const open = hud.earthOpen;
  app.classList.toggle('earth-open', open);
  orb.setPaused(open); // Kern pausiert, solange die Erde offen ist – spart Leistung
}

function openEarth() {
  if (!earthWin) {
    earthWin = createHudWindow({
      id: 'winEarth', title: 'ERDE', className: 'win-earth',
      onClose: () => { hud.earthOpen = false; earth?.pause(); syncCore(); },
    });
    earthWin.body.innerHTML = '<div class="earth-stage"></div><div class="earth-loading">LADE HOLOGRAMM …</div><div class="earth-hint">Sag <b>„Geh nach Tokio“</b> · klick auf einen Ort · ziehen zum Drehen</div>';
  }
  earthWin.open();
  hud.earthOpen = true;
  syncCore();
  if (!earthLoading) {
    earthLoading = import('./earth.js')
      .then(({ createEarth }) => createEarth(earthWin.body.querySelector('.earth-stage'), {
        onPick: (loc) => { setLocation(loc); sfx.panel(); },
      }))
      .then((e) => {
        earth = e;
        earthWin.body.querySelector('.earth-loading').remove();
        const h = getHome();
        if (h) earth.setHome(h.lat, h.lng);
        return e;
      })
      .catch((err) => {
        earthWin.body.querySelector('.earth-loading').textContent = 'ERDE KONNTE NICHT GELADEN WERDEN (WebGL?)';
        console.error(err);
        earthLoading = null;
        throw err;
      });
  } else earth?.resume();
  return earthLoading;
}

function setLocation(loc) {
  hud.location = { name: loc.name, lat: loc.lat, lng: loc.lng };
  if (earthWin) earthWin.tools.textContent = `◎ ${String(loc.name).toUpperCase()}  ${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)}`;
}

async function flyTo(loc) {
  setLocation(loc);
  try { (await openEarth()).flyTo(loc); } catch { /* Meldung steht im Fenster */ }
  sfx.activate();
}

function openStreet(sv) {
  if (!streetWin) {
    streetWin = createHudWindow({
      id: 'winStreet', title: 'STREET VIEW', className: 'win-street',
      onClose: () => { hud.streetOpen = false; streetWin.body.innerHTML = ''; },
    });
  }
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  streetWin.tools.innerHTML = `${esc(String(sv.name || '').toUpperCase())} &nbsp;<a href="${esc(sv.external)}" target="_blank" rel="noopener">GOOGLE MAPS ↗</a>`;
  streetWin.body.innerHTML = sv.mode === 'embed'
    ? `<iframe class="street-frame" src="${esc(sv.url)}" allowfullscreen loading="eager" referrerpolicy="no-referrer-when-downgrade" title="Street View"></iframe><div class="street-overlay"></div>`
    : `<div class="street-empty"><div>${esc(sv.note || 'Street View nicht verfügbar.')}</div><a href="${esc(sv.external)}" target="_blank" rel="noopener">IN GOOGLE MAPS ÖFFNEN ↗</a></div>`;
  streetWin.open();
  hud.streetOpen = true;
}

function handleAction(a) {
  if (a.type === 'earth') openEarth().catch(() => {});
  else if (a.type === 'fly') flyTo(a);
  else if (a.type === 'streetview') openStreet(a);
  else if (a.type === 'close') {
    if (a.panel !== 'earth') streetWin?.close();
    if (a.panel !== 'streetview') earthWin?.close();
  }
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
  document.querySelectorAll('.panel').forEach((p) => {
    const d = Number(getComputedStyle(p).getPropertyValue('--d')) || 1;
    setTimeout(() => sfx.panel(), d * 160 + 350);
  });
  orb.pulse(0.8);
  // Wake-Word startet automatisch, wenn es beim letzten Mal an war (Standard: an)
  if (voice.supported.stt && load('heph.wake', '1') === '1') setTimeout(() => { voice.setWake(true); setWakeUi(voice.wakeEnabled); }, 1600);
  setTimeout(() => input.focus({ preventScroll: true }), 900);
}
$('bootBtn').addEventListener('click', boot);
window.addEventListener('keydown', (e) => {
  if (!booted && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); boot(); return; }
  if (e.key === 'Escape') { controller?.abort(); voice.stopSpeaking(); voice.cancelListening(); }
});

// ---------- Eingabe ----------
function autosize() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 160) + 'px';
}
input.addEventListener('input', autosize);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('form').requestSubmit(); }
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
  voice.stopSpeaking();
  history = [];
  saveHistory(history);
  renderHistory();
  sfx.panel();
  orb.pulse(0.3);
});

$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || busy) return;
  input.value = ''; autosize();
  ask(text, { viaVoice: false });
});

// ---------- Frage an Hephaestion ----------
async function ask(text, { viaVoice }) {
  if (busy) return;
  if (!booted) boot();
  voice.stopSpeaking();

  busy = true;
  sendBtn.disabled = true;
  sfx.send();

  history.push({ role: 'user', content: text });
  renderMessage(log, { role: 'user', content: text, meta: viaVoice ? '🎙' : '' });
  saveHistory(history);
  setState('thinking');

  const speak = voice.supported.tts && (speakMode === 'always' || (speakMode === 'voice' && viaVoice));
  const sentences = new SentenceBuffer();
  if (speak) voice.beginReply();

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
    hud,
    signal: controller.signal,
    onAction: handleAction,
    onMeta: ({ model, tier }) => {
      setModelInfo(model, tier);
      whoEl.insertAdjacentHTML('beforeend', `<em>${tier === 'smart' ? 'TIEF' : 'SCHNELL'}</em>`);
    },
    onTool: ({ label }) => {
      setState('thinking', label + ' …');
      orb.pulse(0.3);
      sfx.panel();
    },
    onSaved: (f) => { renderMemoryNote(log, f.text); loadMemory(); },
    onDelta: (chunk) => {
      if (!started || app.dataset.state === 'thinking') {
        if (!started) { sfx.reply(); setLatency(performance.now() - t0); }
        started = true; setState('speaking');
      }
      reply += chunk;
      if (speak) for (const s of sentences.push(chunk)) voice.say(s);
      else {
        orb.pulse(Math.min(0.35, 0.08 + chunk.length * 0.02));
        const now = performance.now();
        if (now - lastTick > 70) { sfx.tick(); lastTick = now; }
      }
      if (!raf) raf = requestAnimationFrame(paint);
    },
    onDone: () => {
      paint();
      history.push({ role: 'assistant', content: reply });
      saveHistory(history);
      // Im Hintergrund dazulernen – ohne die Unterhaltung aufzuhalten
      learn(history).then((saved) => {
        if (!saved.length) return;
        saved.forEach((f) => renderMemoryNote(log, f.text));
        loadMemory();
      });
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
      if (speak) voice.say(msg);
      setTimeout(() => app.dataset.state === 'error' && idleOrListening(), 3500);
    },
  });

  const aborted = controller.signal.aborted;
  if (aborted && reply) { history.push({ role: 'assistant', content: reply }); saveHistory(history); }
  if (speak) {
    if (aborted) voice.stopSpeaking();
    else { for (const s of sentences.flush()) voice.say(s); voice.endReply(); }
  }
  bubble.classList.remove('streaming');
  controller = null;
  busy = false;
  sendBtn.disabled = false;
  if (app.dataset.state !== 'error') idleOrListening();
  if (!viaVoice) input.focus({ preventScroll: true });
}

// ---------- Start ----------
if (matchMedia('(max-width: 720px)').matches) input.placeholder = 'Nachricht …';
buildTicks();
startClock();
renderHistory();
syncSpeakMode();
voice.setWake(false); // zeigt den Status an, startet aber noch nichts
setWakeUi(false);
setState('idle');
loadHealth().then(() => loadMemory());
startWeather();

// Für spätere Phasen (Gesten) und zum Ausprobieren in der Browser-Konsole
window.hephaestion = { orb, sfx, setState, voice, ask, handleAction, hud };
