// Phase 6: Panels auf Befehl, Quellen der Recherche, n8n-Freigaben und Werkzeug-Verwaltung.
import { createHudWindow } from './windows.js';
import { sfx } from './sound.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = (u) => (/^https?:\/\//i.test(u) ? u : '#');

/** Einfaches, sicheres Markdown → HTML (Überschriften, Listen, fett, kursiv, Links, Code). */
export function md(src) {
  const inline = (t) => esc(t)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, txt, url) => `<a href="${safeUrl(url)}" target="_blank" rel="noopener">${txt}</a>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
  const out = [];
  let list = null;
  const flush = () => { if (list) { out.push(`<${list.tag}>${list.items.map((i) => `<li>${i}</li>`).join('')}</${list.tag}>`); list = null; } };
  for (const raw of String(src || '').split(/\r?\n/)) {
    const line = raw.trimEnd();
    let m;
    if ((m = /^(#{1,4})\s+(.*)$/.exec(line))) { flush(); const n = Math.min(4, m[1].length + 1); out.push(`<h${n}>${inline(m[2])}</h${n}>`); }
    else if ((m = /^\s*[-*•]\s+(.*)$/.exec(line))) { if (list?.tag !== 'ul') { flush(); list = { tag: 'ul', items: [] }; } list.items.push(inline(m[1])); }
    else if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(line))) { if (list?.tag !== 'ol') { flush(); list = { tag: 'ol', items: [] }; } list.items.push(inline(m[1])); }
    else if (!line.trim()) flush();
    else { flush(); out.push(`<p>${inline(line)}</p>`); }
  }
  flush();
  return out.join('');
}

export function createPanels({ note } = {}) {
  let count = 0;
  const open = [];

  function showPanel({ title, content }) {
    // max. 3 Inhaltsfenster gleichzeitig – das älteste schließt sich
    if (open.length >= 3) open.shift().close();
    const w = createHudWindow({ id: `winPanel${++count}`, title: esc(String(title).toUpperCase()), className: 'win-panel', destroyOnClose: true, onClose: () => { const i = open.indexOf(w); if (i >= 0) open.splice(i, 1); } });
    w.body.innerHTML = `<article class="panel-doc">${md(content)}</article>`;
    w.moveTo((open.length % 3) * 26, (open.length % 3) * 22);
    open.push(w);
    w.open();
    return w;
  }

  let sourcesWin = null;
  function showSources({ title, items }) {
    if (!items?.length) return;
    sourcesWin ||= createHudWindow({ id: 'winSources', title: 'QUELLEN', className: 'win-sources' });
    sourcesWin.tools.textContent = String(title || '').toUpperCase();
    sourcesWin.body.innerHTML = `<ol class="sources">${items.map((it) => `
      <li><a href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener">${esc(it.title || it.url)}</a><span>${esc(it.meta || '')}</span></li>`).join('')}</ol>`;
    sourcesWin.open();
  }

  // ---------- n8n-Freigabe ----------
  function confirm({ id, workflow, description, data }) {
    const w = createHudWindow({ id: `winConfirm${++count}`, title: 'FREIGABE', className: 'win-confirm', destroyOnClose: true });
    const dataStr = data && Object.keys(data).length ? `<pre>${esc(JSON.stringify(data, null, 2))}</pre>` : '';
    w.body.innerHTML = `
      <div class="confirm-box">
        <p>Hephaestion möchte den Workflow starten:</p>
        <h3>${esc(workflow)}</h3>
        ${description ? `<p class="muted">${esc(description)}</p>` : ''}
        ${dataStr}
        <div class="confirm-actions">
          <button type="button" class="confirm-yes">AUSFÜHREN</button>
          <button type="button" class="confirm-no">ABBRECHEN</button>
        </div>
      </div>`;
    const decide = async (approve) => {
      w.body.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      try {
        const r = await fetch(`/api/n8n/confirm/${encodeURIComponent(id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approve }) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status);
        if (j.cancelled) note?.(`⛔ Workflow „${workflow}“ abgebrochen.`);
        else { note?.(`⚙ Workflow „${workflow}“ ausgeführt. ${String(j.result).slice(0, 160)}`); sfx.activate(); }
      } catch (e) {
        note?.(`⚠ Workflow „${workflow}“: ${e.message}`); sfx.error();
      }
      w.close();
    };
    w.body.querySelector('.confirm-yes').addEventListener('click', () => decide(true));
    w.body.querySelector('.confirm-no').addEventListener('click', () => decide(false));
    w.open();
    sfx.activate();
  }

  // ---------- Werkzeug-Verwaltung (n8n-Webhooks eintragen) ----------
  let toolsWin = null;
  async function renderTools() {
    const list = await (await fetch('/api/n8n')).json().catch(() => []);
    toolsWin.body.innerHTML = `
      <div class="tools">
        <p class="muted">Trag hier deine n8n-Workflows ein. In n8n: Workflow mit <b>Webhook</b>-Knoten (Methode POST) → <b>Production URL</b> kopieren und den Workflow <b>aktivieren</b>.</p>
        <ul class="wf-list">${list.length ? list.map((w) => `
          <li data-id="${esc(w.id)}">
            <div><b>${esc(w.name)}</b> ${w.confirm ? '<span class="tag">FREIGABE</span>' : '<span class="tag free">DIREKT</span>'}<br><span class="muted">${esc(w.description || w.url)}</span></div>
            <button type="button" class="mini-btn" data-act="test">TEST</button>
            <button type="button" class="mini-btn danger" data-act="del">✕</button>
          </li>`).join('') : '<li class="muted">Noch keine Workflows.</li>'}</ul>
        <form class="wf-form">
          <input name="name" placeholder="Name, z. B. Rechnung erstellen" required maxlength="60">
          <input name="url" placeholder="Webhook-URL (https://…)" required>
          <input name="description" placeholder="Was macht er? (hilft Hephaestion)" maxlength="300">
          <label><input type="checkbox" name="confirm" checked> Vor dem Start um Freigabe bitten (empfohlen bei Mails, Posts, Löschen, Geld)</label>
          <button type="submit" class="toggle">HINZUFÜGEN</button>
          <p class="wf-msg muted"></p>
        </form>
      </div>`;
    const msg = toolsWin.body.querySelector('.wf-msg');
    toolsWin.body.querySelector('.wf-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const r = await fetch('/api/n8n', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: f.get('name'), url: f.get('url'), description: f.get('description'), confirm: f.get('confirm') === 'on' }) });
      const j = await r.json();
      if (!r.ok) { msg.textContent = '⚠ ' + j.error; sfx.error(); return; }
      sfx.activate(); renderTools();
    });
    toolsWin.body.querySelectorAll('.wf-list [data-act]').forEach((b) => b.addEventListener('click', async () => {
      const id = b.closest('li').dataset.id;
      if (b.dataset.act === 'del') { await fetch(`/api/n8n/${encodeURIComponent(id)}`, { method: 'DELETE' }); sfx.deactivate(); renderTools(); return; }
      msg.textContent = 'Teste …';
      const r = await fetch(`/api/n8n/test/${encodeURIComponent(id)}`, { method: 'POST' });
      const j = await r.json();
      msg.textContent = r.ok ? '✓ Erreicht: ' + String(j.result).slice(0, 120) : '⚠ ' + j.error;
    }));
  }
  async function showTools() {
    toolsWin ||= createHudWindow({ id: 'winTools', title: 'WERKZEUGE · N8N', className: 'win-tools' });
    toolsWin.open();
    await renderTools();
  }

  return { showPanel, showSources, confirm, showTools };
}

// ---------- Augen: Schnappschuss von der Kamera ----------
export const LOOK_RE = /(was siehst du|was kannst du sehen|siehst du (das|mich|hier)|schau (mal|dir|her)|guck (mal|dir|her)|sieh (mal|dir|her)|was halte ich|was ist das hier|wie sehe ich aus|kannst du .{0,20}sehen)/i;

/** Macht ein Foto (nutzt die laufende Gesten-Kamera oder schaltet kurz eine ein). */
export async function captureFrame(existingVideo) {
  let video = existingVideo, stream = null;
  if (!video || video.readyState < 2) {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false });
    video = document.createElement('video');
    video.muted = true; video.playsInline = true; video.srcObject = stream;
    await video.play();
    await new Promise((r) => setTimeout(r, 600)); // Belichtung einpendeln lassen
  }
  const w = Math.min(1024, video.videoWidth || 640);
  const h = Math.round(w * ((video.videoHeight || 480) / (video.videoWidth || 640)));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').drawImage(video, 0, 0, w, h);
  stream?.getTracks().forEach((t) => t.stop());
  return c.toDataURL('image/jpeg', 0.82);
}
