// Chat-Verbindung zum Server (Live-Stream der Antwort) + Anzeige im HUD.
const STORE = 'heph.history.v1';
const MAX_STORE = 60;

export function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch { return []; }
}
export function saveHistory(h) {
  try { localStorage.setItem(STORE, JSON.stringify(h.slice(-MAX_STORE))); } catch { /* egal */ }
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// Ganz einfache Formatierung: **fett**, `code`, Zeilenumbrüche
export function format(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

export function renderMessage(log, { role, content, meta, error }) {
  const el = document.createElement('div');
  el.className = `msg ${role === 'user' ? 'user' : 'bot'}${error ? ' err' : ''}`;
  el.innerHTML = `<span class="who">${role === 'user' ? 'BOSS' : 'HEPHAESTION'}${meta ? `<em>${escapeHtml(meta)}</em>` : ''}</span><span class="text"></span>`;
  el.querySelector('.text').innerHTML = format(content || '');
  log.querySelector('.empty')?.remove();
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
  return el;
}

export function renderEmpty(log) {
  log.innerHTML = `<div class="empty">KANAL OFFEN<br>Schreiben Sie mir, <b>Boss</b>.<br>Tipp: <b>TURBO</b> für schwere Aufgaben.</div>`;
}

/** Sendet die Unterhaltung und ruft Callbacks während des Streams auf. */
export async function sendChat({ messages, turbo, hud, signal, onMeta, onDelta, onTool, onSaved, onAction, onDone, onError }) {
  let res;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, turbo, hud, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      signal,
    });
  } catch (e) {
    onError?.('Server nicht erreichbar, Boss. Läuft Hephaestion noch im Hintergrund?');
    return;
  }
  if (!res.ok || !res.body) { onError?.(`Server-Fehler (${res.status}).`); return; }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let finished = false;
  while (true) {
    const { value, done } = await reader.read().catch(() => ({ done: true }));
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      const chunk = buf.slice(0, idx); buf = buf.slice(idx + 2);
      const ev = /^event: (.+)$/m.exec(chunk)?.[1];
      const dataLine = /^data: (.*)$/m.exec(chunk)?.[1];
      if (!ev || dataLine == null) continue;
      const data = JSON.parse(dataLine);
      if (ev === 'meta') onMeta?.(data);
      else if (ev === 'delta') onDelta?.(data.text);
      else if (ev === 'tool') onTool?.(data);
      else if (ev === 'saved') onSaved?.(data);
      else if (ev === 'action') onAction?.(data);
      else if (ev === 'done') { finished = true; onDone?.(data); }
      else if (ev === 'error') { finished = true; onError?.(data.message); }
    }
  }
  if (!finished && !signal?.aborted) onError?.('Verbindung unterbrochen.');
}

/** Kleine Gedächtnis-Meldung im Chat ("Gemerkt: …") */
export function renderMemoryNote(log, text) {
  const el = document.createElement('div');
  el.className = 'memnote';
  el.innerHTML = `<span>🧠 GEMERKT</span> ${escapeHtml(text)}`;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}

/** Nach einer Antwort im Hintergrund dazulernen lassen */
export async function learn(messages) {
  try {
    const r = await fetch('/api/memory/learn', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages.slice(-6) }),
    });
    return (await r.json()).saved || [];
  } catch { return []; }
}
