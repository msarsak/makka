// Sprache rein (Web Speech API) und raus (Browser-Stimme), plus Mikrofon-Pegel für den Orb.
import { findWake, pickVoice } from './voice-utils.js';
import { getAudioContext } from './sound.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const COMMAND_TIMEOUT = 8000; // so lange wartet er nach "Hey Heph" auf den Befehl

export function createVoice(h) {
  // h = { onCommand, onListening, onInterim, onStatus, onLevel, onSpeakStart, onSpeakEnd, onWord, onError }
  const supported = { stt: Boolean(SR), tts: 'speechSynthesis' in window };
  let rec = null;
  let mode = 'off';          // off | wake | command
  let wakeEnabled = false;
  let paused = false;        // während er selbst spricht
  let running = false;
  let cmdTimer = 0;
  let restartTimer = 0;

  // ---------- Erkennung ----------
  function status() {
    if (!supported.stt) return h.onStatus?.('unsupported');
    if (paused) return h.onStatus?.('paused');
    h.onStatus?.(mode === 'command' ? 'command' : wakeEnabled ? 'wake' : 'off');
  }

  function ensureRec() {
    if (rec || !SR) return rec;
    rec = new SR();
    rec.lang = 'de-DE';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.onstart = () => { running = true; };
    rec.onresult = onResult;
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        wakeEnabled = false; mode = 'off';
        h.onError?.('Mikrofon blockiert. Bitte oben in der Adressleiste das Mikrofon erlauben.');
        status();
      } else if (e.error === 'network') {
        h.onError?.('Spracherkennung braucht Internet – Verbindung prüfen.');
      } else if (e.error === 'audio-capture') {
        h.onError?.('Kein Mikrofon gefunden.');
      } // no-speech / aborted: normal
    };
    rec.onend = () => {
      running = false;
      // Der Browser beendet die Erkennung regelmäßig – wir starten sie still neu.
      if (!paused && mode !== 'off') { clearTimeout(restartTimer); restartTimer = setTimeout(startRec, 250); }
    };
    return rec;
  }

  function startRec() {
    if (!ensureRec() || running || paused || mode === 'off') return;
    try { rec.start(); } catch { /* läuft schon */ }
  }
  function stopRec() { clearTimeout(restartTimer); try { rec?.abort(); } catch { /* egal */ } running = false; }

  function enterCommand() {
    mode = 'command';
    h.onListening?.(true);
    startMeter();
    clearTimeout(cmdTimer);
    cmdTimer = setTimeout(() => { if (mode === 'command') leaveCommand(true); }, COMMAND_TIMEOUT);
    status();
    startRec();
  }
  function leaveCommand(timedOut = false) {
    clearTimeout(cmdTimer);
    mode = wakeEnabled ? 'wake' : 'off';
    h.onListening?.(false, timedOut);
    h.onLevel?.(0);
    if (mode === 'off') stopRec();
    status();
  }

  function onResult(e) {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      const alts = Array.from(r).map((a) => a.transcript);
      const text = alts[0] || '';
      if (mode === 'wake') {
        const hit = alts.map(findWake).find((w) => w.found);
        if (!hit) continue;
        if (r.isFinal && hit.command.length > 1) { h.onCommand?.(hit.command); continue; }
        enterCommand();
        if (hit.command) h.onInterim?.(hit.command);
      } else if (mode === 'command') {
        clearTimeout(cmdTimer);
        cmdTimer = setTimeout(() => { if (mode === 'command') leaveCommand(true); }, COMMAND_TIMEOUT);
        const w = findWake(text);
        const command = (w.found ? w.command : text).trim();
        if (!r.isFinal) { if (command) h.onInterim?.(command); continue; }
        if (command.length > 1) { leaveCommand(); h.onCommand?.(command); }
      }
    }
  }

  // ---------- Mikrofon-Pegel für den Orb ----------
  let meterStream = null, analyser = null, meterRaf = 0;
  async function startMeter() {
    if (!analyser) {
      try {
        meterStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        const ctx = getAudioContext();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(meterStream).connect(analyser);
      } catch { return; }
    }
    const data = new Uint8Array(analyser.fftSize);
    cancelAnimationFrame(meterRaf);
    const loop = () => {
      if (mode !== 'command') { h.onLevel?.(0); return; }
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
      h.onLevel?.(Math.min(1, Math.sqrt(sum / data.length) * 5));
      meterRaf = requestAnimationFrame(loop);
    };
    loop();
  }

  // ---------- Sprachausgabe ----------
  let voices = [];
  let voice = null;
  let savedVoice = '';
  try { savedVoice = localStorage.getItem('heph.voice') || ''; } catch { /* egal */ }
  let pending = 0;
  let speaking = false;
  let utterId = 0;

  function loadVoices() {
    if (!supported.tts) return;
    voices = speechSynthesis.getVoices();
    voice = pickVoice(voices, savedVoice);
    h.onVoices?.(voices.filter((v) => /^de/i.test(v.lang)), voice);
  }
  if (supported.tts) {
    loadVoices();
    speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
  }

  function say(text) {
    if (!supported.tts || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang || 'de-DE';
    try { if (voice) u.voice = voice; } catch { /* Stimme nicht verfügbar – Standardstimme */ }
    u.rate = 1.05;
    u.pitch = 0.95;
    const id = utterId;
    pending++;
    u.onstart = () => {
      if (id !== utterId) return;
      if (!speaking) { speaking = true; pause(); h.onSpeakStart?.(); }
    };
    u.onboundary = (ev) => { if (id === utterId && ev.name !== 'sentence') h.onWord?.(); };
    const done = () => {
      if (id !== utterId) return;
      pending = Math.max(0, pending - 1);
      if (pending === 0 && !moreComing) finishSpeaking();
    };
    u.onend = done;
    u.onerror = done;
    try { speechSynthesis.speak(u); } catch { done(); }
  }
  let moreComing = false;
  function finishSpeaking() {
    if (!speaking) { resume(); return; }
    speaking = false;
    h.onSpeakEnd?.();
    resume();
  }
  function stopSpeaking() {
    utterId++;
    pending = 0;
    moreComing = false;
    if (supported.tts) speechSynthesis.cancel();
    if (speaking) { speaking = false; h.onSpeakEnd?.(); }
    resume();
  }

  // Während er spricht, hört er nicht zu (sonst hört er sich selbst)
  function pause() { if (!paused) { paused = true; stopRec(); status(); } }
  function resume() { if (paused) { paused = false; status(); startRec(); } }

  return {
    supported,
    get wakeEnabled() { return wakeEnabled; },
    get speaking() { return speaking; },
    setWake(on) {
      if (!supported.stt) return status();
      wakeEnabled = on;
      if (on && mode === 'off') mode = 'wake';
      if (!on && mode === 'wake') { mode = 'off'; stopRec(); }
      status();
      startRec();
    },
    listenOnce() { if (!supported.stt) return status(); stopSpeaking(); enterCommand(); },
    cancelListening() { if (mode === 'command') leaveCommand(); },
    say,
    beginReply() { utterId++; pending = 0; moreComing = true; },
    endReply() { moreComing = false; if (pending === 0) finishSpeaking(); },
    stopSpeaking,
    setVoice(name) {
      savedVoice = name;
      try { localStorage.setItem('heph.voice', name); } catch { /* egal */ }
      loadVoices();
    },
  };
}
