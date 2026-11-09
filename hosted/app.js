// Hephaestion – gehostete Version (läuft als Seite bei claude.ai, ohne Server und ohne Keys).
// Gehirn: das Claude-Konto der Person, die die Seite öffnet (Fähigkeit "sample").
// Gedächtnis: privat pro Person in der Datenbank der Seite (Fähigkeit "db").
// Die Bausteine M_sound, M_orb, M_windows, M_gestures, M_vu werden beim Bauen davor eingefügt.
(() => {
  const { sfx, initAudio, isMuted, setMuted } = M_sound;
  const { createOrb } = M_orb;
  const { createHudWindow } = M_windows;
  const { recognizeShape } = M_gestures;
  const { SentenceBuffer, cleanForSpeech, pickVoice } = M_vu;

  const $ = (id) => document.getElementById(id);
  const app = $('app');
  const log = $('log');
  const input = $('input');
  const sendBtn = $('sendBtn');
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* egal */ } } };

  // ---------- Zustände des Kerns ----------
  const STATE_TEXT = {
    idle: ['BEREIT', 'WIE KANN ICH HELFEN, BOSS?'],
    thinking: ['ANALYSIERE', 'EINEN MOMENT, BOSS …'],
    speaking: ['ANTWORTE', 'ÜBERTRAGUNG LÄUFT'],
    error: ['STÖRUNG', 'DA HAKT ETWAS'],
  };
  const orb = createOrb($('orb'), { onFps: (f) => { $('stFps').textContent = f + ' FPS'; } });
  function setState(s, sub) {
    app.dataset.state = s;
    orb.setState(s === 'thinking' || s === 'speaking' || s === 'error' ? s : 'idle');
    const [a, b] = STATE_TEXT[s] || STATE_TEXT.idle;
    $('coreState').textContent = a;
    $('coreSub').textContent = sub || b;
  }

  // ---------- Uhr, Laufzeit, Ring-Markierungen ----------
  (function ticks() {
    const g = $('ticks'), NS = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2, major = i % 6 === 0, r2 = major ? 128 : 134;
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', 200 + Math.cos(a) * 140); l.setAttribute('y1', 200 + Math.sin(a) * 140);
      l.setAttribute('x2', 200 + Math.cos(a) * r2); l.setAttribute('y2', 200 + Math.sin(a) * r2);
      if (major) l.setAttribute('class', 'major');
      g.appendChild(l);
    }
  })();
  const started = Date.now();
  function tick() {
    const d = new Date();
    $('clockTime').innerHTML = `${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}<span class="sec">${String(d.getSeconds()).padStart(2, '0')}</span>`;
    $('clockDate').textContent = d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const s = Math.floor((Date.now() - started) / 1000);
    $('stUptime').textContent = [s / 3600, (s / 60) % 60, s % 60].map((v) => String(Math.floor(v)).padStart(2, '0')).join(':');
  }
  tick(); setInterval(tick, 1000);

  // ---------- Verbindung zu Claude und zur Datenbank ----------
  let sample = null, db = null, uid = null, toolsOk = false, imagesOk = false;
  const ready = (async () => {
    if (!window.claude?.use) return;
    [sample, db] = await Promise.all([window.claude.use('sample'), window.claude.use('db')]);
    const user = await window.claude.use('user');
    try { uid = user ? await user.id() : null; } catch { uid = null; }
    if (sample) {
      const lim = await sample.limits().catch(() => null);
      toolsOk = Boolean(lim?.tools);
      imagesOk = Boolean(lim?.images);
    }
  })();

  function syncStatus() {
    const live = Boolean(sample);
    $('stMode').textContent = live ? 'CLAUDE-KONTO' : 'OFFLINE';
    $('stMode').className = live ? 'live' : 'demo';
    $('sysLine').textContent = live ? 'SYSTEM ONLINE' : 'NUR IN CLAUDE.AI VERFÜGBAR';
    document.querySelector('.brand-sub .dot').classList.toggle('demo', !live);
    $('photoBtn').hidden = live && !imagesOk;
  }

  // ---------- Gedächtnis + Verlauf (privat, auf allen Geräten gleich) ----------
  const CATS = { ueber_mich: 'Über mich', vorlieben: 'Vorlieben', projekte: 'Projekte', ziele: 'Ziele', kommunikation: 'Wie der Boss redet', menschen: 'Menschen' };
  let mem = { facts: [], turns: [] };
  const memDoc = () => (db && uid ? db.collection('data/users/' + uid).doc('hephaestion') : null);
  let saving = Promise.resolve();
  function persist() {
    mem.facts = mem.facts.slice(-200);
    mem.turns = mem.turns.slice(-30);
    const doc = memDoc();
    if (!doc) { store.set('heph.mem', JSON.stringify(mem)); return; }
    const snapshot = JSON.parse(JSON.stringify({ facts: mem.facts, turns: mem.turns, updatedAt: Date.now() }));
    saving = saving.then(() => doc.set(snapshot)).catch((e) => console.warn('Speichern fehlgeschlagen', e));
  }
  async function loadMemory() {
    const doc = memDoc();
    try {
      if (doc) {
        const snap = await Promise.race([doc.get(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))]);
        const d = snap.exists ? snap.data() : null;
        if (d) mem = { facts: Array.isArray(d.facts) ? d.facts : [], turns: Array.isArray(d.turns) ? d.turns : [] };
      } else {
        const d = JSON.parse(store.get('heph.mem', 'null'));
        if (d) mem = d;
      }
    } catch (e) { console.warn('Gedächtnis nicht geladen', e); }
    renderMemoryPanel();
    renderHistory();
  }
  function renderMemoryPanel() {
    $('stMemory').textContent = `${mem.facts.length} FAKTEN`;
    const last = mem.facts.slice(-4).reverse();
    $('memList').innerHTML = last.length
      ? last.map((f) => `<li><span>${esc(CATS[f.c] || 'Notiz')}</span>${esc(f.t)}</li>`).join('')
      : '<li class="muted">Noch leer – erzähl mir etwas über dich.</li>';
  }
  const norm = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  function remember(c, t) {
    const text = String(t || '').trim().slice(0, 400);
    if (text.length < 3) return false;
    if (mem.facts.some((f) => norm(f.t) === norm(text))) return false;
    mem.facts.push({ c: CATS[c] ? c : 'ueber_mich', t: text, d: new Date().toLocaleDateString('sv-SE') });
    persist();
    renderMemoryPanel();
    note('🧠 GEMERKT', text);
    return true;
  }
  function forget(t) {
    const q = norm(t);
    const before = mem.facts.length;
    mem.facts = mem.facts.filter((f) => !norm(f.t).includes(q));
    if (mem.facts.length !== before) { persist(); renderMemoryPanel(); note('🗑 VERGESSEN', t); }
    return before - mem.facts.length;
  }

  // ---------- Chat-Anzeige ----------
  function format(text) {
    return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
  }
  function renderMessage({ role, content, meta, error }) {
    const el = document.createElement('div');
    el.className = `msg ${role === 'user' ? 'user' : 'bot'}${error ? ' err' : ''}`;
    el.innerHTML = `<span class="who">${role === 'user' ? 'BOSS' : 'HEPHAESTION'}${meta ? `<em>${esc(meta)}</em>` : ''}</span><span class="text"></span>`;
    el.querySelector('.text').innerHTML = format(content || '');
    log.querySelector('.empty')?.remove();
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }
  function note(label, text) {
    const el = document.createElement('div');
    el.className = 'memnote';
    el.innerHTML = `<span>${esc(label)}</span> ${esc(text)}`;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }
  function renderHistory() {
    log.innerHTML = '';
    if (!mem.turns.length) {
      log.innerHTML = `<div class="empty">KANAL OFFEN<br>Schreiben Sie mir, <b>Boss</b>.<br>${matchMedia('(pointer: coarse)').matches ? 'Tipp: 🎙 auf der Tastatur zum Diktieren.' : 'Tipp: <b>TURBO</b> für schwere Aufgaben.'}</div>`;
      return;
    }
    for (const t of mem.turns) renderMessage({ role: t.role, content: t.content });
  }

  // ---------- Stimme (Vorlesen) ----------
  const tts = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let voice = null;
  let speakOn = store.get('heph.speak', '1') === '1';
  const loadVoices = () => { try { voice = pickVoice(tts.getVoices(), store.get('heph.voice', '')); } catch { voice = null; } };
  if (tts) { loadVoices(); tts.addEventListener?.('voiceschanged', loadVoices); }
  let speaking = 0;
  function say(text) {
    if (!tts || !speakOn || !text) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = voice?.lang || 'de-DE';
      try { if (voice) u.voice = voice; } catch { /* Standardstimme */ }
      u.rate = 1.05; u.pitch = 0.95;
      speaking++;
      u.onstart = () => setState('speaking');
      u.onboundary = () => { orb.pulse(0.22); };
      u.onend = u.onerror = () => { speaking = Math.max(0, speaking - 1); if (!speaking && !busy) setState('idle'); };
      tts.speak(u);
    } catch { /* Vorlesen nicht möglich */ }
  }
  const stopSpeaking = () => { try { tts?.cancel(); } catch { /* egal */ } speaking = 0; };
  function syncSpeak() {
    const b = $('speakBtn');
    b.setAttribute('aria-pressed', String(speakOn));
    b.textContent = speakOn ? 'AN' : 'AUS';
    $('speakRow').hidden = !tts;
  }
  $('speakBtn').addEventListener('click', () => { speakOn = !speakOn; store.set('heph.speak', speakOn ? '1' : '0'); syncSpeak(); if (!speakOn) stopSpeaking(); sfx.panel(); });

  // ---------- Fenster: Panels, Erde, Street View ----------
  function md(src) {
    const inline = (t) => esc(t)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, txt, url) => `<a href="${url}" target="_blank" rel="noopener">${txt}</a>`)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
    const out = []; let list = null;
    const flush = () => { if (list) { out.push(`<${list.tag}>${list.items.map((i) => `<li>${i}</li>`).join('')}</${list.tag}>`); list = null; } };
    for (const raw of String(src || '').split(/\r?\n/)) {
      const line = raw.trimEnd(); let m;
      if ((m = /^(#{1,4})\s+(.*)$/.exec(line))) { flush(); const n = Math.min(4, m[1].length + 1); out.push(`<h${n}>${inline(m[2])}</h${n}>`); }
      else if ((m = /^\s*[-*•]\s+(.*)$/.exec(line))) { if (list?.tag !== 'ul') { flush(); list = { tag: 'ul', items: [] }; } list.items.push(inline(m[1])); }
      else if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(line))) { if (list?.tag !== 'ol') { flush(); list = { tag: 'ol', items: [] }; } list.items.push(inline(m[1])); }
      else if (!line.trim()) flush();
      else { flush(); out.push(`<p>${inline(line)}</p>`); }
    }
    flush();
    return out.join('');
  }
  let panelCount = 0; const openPanels = [];
  function showPanel(title, content) {
    if (openPanels.length >= 3) openPanels.shift().close();
    const w = createHudWindow({ id: `winPanel${++panelCount}`, title: esc(String(title).toUpperCase().slice(0, 60)), className: 'win-panel', destroyOnClose: true,
      onClose: () => { const i = openPanels.indexOf(w); if (i >= 0) openPanels.splice(i, 1); } });
    w.body.innerHTML = `<article class="panel-doc">${md(content)}</article>`;
    w.moveTo((openPanels.length % 3) * 24, (openPanels.length % 3) * 20);
    openPanels.push(w);
    w.open();
  }

  // 3D-Erde: globe.gl wird erst geladen, wenn man sie braucht
  const hud = { earthOpen: false, location: null };
  let earthWin = null, earth = null, earthLoading = null;
  const loadScript = (src) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Laden fehlgeschlagen: ' + src)); document.head.appendChild(s); });
  function syncCore() { app.classList.toggle('earth-open', hud.earthOpen); orb.setPaused(hud.earthOpen); }
  function openEarth() {
    if (!earthWin) {
      earthWin = createHudWindow({ id: 'winEarth', title: 'ERDE', className: 'win-earth', onClose: () => { hud.earthOpen = false; earth?.globe.pauseAnimation(); syncCore(); } });
      earthWin.body.innerHTML = '<div class="earth-stage"></div><div class="earth-loading">LADE HOLOGRAMM …</div><div class="earth-hint">„Flieg nach Tokio“ · ziehen = drehen · zwei Finger / Mausrad = zoomen</div>';
    }
    earthWin.open();
    hud.earthOpen = true;
    syncCore();
    if (!earthLoading) {
      earthLoading = (async () => {
        if (!window.Globe) await loadScript('https://cdn.jsdelivr.net/npm/globe.gl@2.46.2/dist/globe.gl.min.js');
        if (!window.topojson) await loadScript('https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js');
        earth = createEarth(earthWin.body.querySelector('.earth-stage'));
        earthWin.body.querySelector('.earth-loading').remove();
        return earth;
      })().catch((e) => { earthWin.body.querySelector('.earth-loading').textContent = 'ERDE KONNTE NICHT GELADEN WERDEN'; earthLoading = null; throw e; });
    } else earth?.globe.resumeAnimation();
    return earthLoading;
  }
  function createEarth(container) {
    const css = (n, f) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f;
    const rgba = (hex, a) => { const n = parseInt(hex.replace('#', ''), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
    const C = { blue: css('--blue', '#1f6fff'), bright: css('--blue-bright', '#5cc2ff'), red: css('--red', '#ff2a45'), gold: css('--gold', '#ffc94d') };
    const world = JSON.parse($('worldData').textContent);
    // Nordkorea hat in diesen Kartendaten einen fehlerhaften Umriss
    const countries = window.topojson.feature(world, world.objects.countries).features.filter((f) => f.id !== '408');
    let target = null;
    const g = new window.Globe(container, { rendererConfig: { antialias: true, alpha: true }, animateIn: true })
      .backgroundColor('rgba(0,0,0,0)').globeImageUrl(EARTH_TEXTURE)
      .showAtmosphere(true).atmosphereColor(C.bright).atmosphereAltitude(0.18).showGraticules(true)
      .hexPolygonsData(countries).hexPolygonResolution(3).hexPolygonMargin(0.3).hexPolygonAltitude(0.004)
      .hexPolygonColor(() => rgba(C.bright, 0.7)).hexPolygonLabel((d) => `<div class="globe-tip">${esc(d.properties.name)}</div>`)
      .ringColor(() => (t) => rgba(C.red, Math.max(0, 1 - t))).ringMaxRadius(4).ringPropagationSpeed(2.5).ringRepeatPeriod(800)
      .labelText('name').labelColor(() => C.gold).labelSize((d) => d.size).labelDotRadius((d) => d.size * 0.35).labelAltitude(0.012).labelResolution(2)
      .onGlobeClick(({ lat, lng }) => { api.flyTo({ name: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`, lat, lng, altitude: g.pointOfView().altitude }, 900); sfx.panel(); });
    const mat = g.globeMaterial();
    mat.color.set('#b8d4ff'); mat.emissive.set(C.blue); mat.emissiveIntensity = 0.16; mat.shininess = 4;
    let close = null;
    const applyZoom = (alt) => { const c = alt < 0.9; if (c === close) return; close = c; g.hexPolygonColor(() => rgba(C.bright, c ? 0.16 : 0.7)); };
    g.onZoom(({ altitude }) => applyZoom(altitude));
    const controls = g.controls(); controls.autoRotate = true; controls.autoRotateSpeed = 0.45;
    g.pointOfView({ lat: 30, lng: 10, altitude: 2.4 });
    const resize = () => { const w = container.clientWidth, h = container.clientHeight; if (w && h) g.width(w).height(h); };
    new ResizeObserver(resize).observe(container); resize();
    const api = {
      globe: g,
      flyTo(loc, ms = 2600) {
        const alt = loc.altitude ?? 0.4;
        target = { name: loc.name, lat: loc.lat, lng: loc.lng, size: Math.min(1.2, Math.max(0.12, alt * 0.55)) };
        controls.autoRotate = false;
        g.ringsData([target]); g.labelsData([target]);
        const far = Math.max(g.pointOfView().altitude, 1.8);
        g.pointOfView({ altitude: far }, ms * 0.3); applyZoom(far);
        setTimeout(() => g.pointOfView({ lat: loc.lat, lng: loc.lng, altitude: alt }, ms * 0.7), ms * 0.3);
        setTimeout(() => applyZoom(alt), ms * 0.65);
        hud.location = { name: loc.name, lat: loc.lat, lng: loc.lng };
        earthWin.tools.textContent = `◎ ${String(loc.name).toUpperCase()}  ${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)}`;
      },
    };
    return api;
  }
  const ZOOM = { gebaeude: 0.25, stadt: 0.4, region: 0.6, land: 1.1, kontinent: 1.7 };
  async function flyTo(name, lat, lng, zoom) {
    const e = await openEarth();
    e.flyTo({ name, lat, lng, altitude: ZOOM[zoom] ?? 0.4 });
    sfx.activate();
  }
  let streetWin = null;
  function showStreet(name, lat, lng) {
    streetWin ||= createHudWindow({ id: 'winStreet', title: 'STREET VIEW', className: 'win-street' });
    const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
    streetWin.tools.textContent = String(name || '').toUpperCase();
    streetWin.body.innerHTML = `<div class="street-empty"><div>Street View für <b>${esc(name)}</b> öffnet sich in Google Maps.</div><a href="${url}" target="_blank" rel="noopener">STREET VIEW ÖFFNEN ↗</a></div>`;
    streetWin.open();
  }

  // ---------- Zeichnen mit Finger oder Maus ----------
  const NS = 'http://www.w3.org/2000/svg';
  const drawLayer = $('drawLayer'), shapesG = $('drawShapes'), drawCanvas = $('drawCanvas');
  const dctx = drawCanvas.getContext('2d');
  let drawMode = false, stroke = null;
  let shapes = []; try { shapes = JSON.parse(store.get('heph.drawings', '[]')) || []; } catch { shapes = []; }
  const saveShapes = () => store.set('heph.drawings', JSON.stringify(shapes.slice(-50)));
  function label(text, x, y) { const t = document.createElementNS(NS, 'text'); t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('class', 'draw-label'); t.textContent = text; return t; }
  function renderShape(s, animate = true) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', `draw-shape draw-${s.type}${animate ? ' draw-in' : ''}`);
    const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); e.setAttribute('pathLength', '1'); return e; };
    if (s.type === 'rect') g.append(mk('rect', { x: s.x, y: s.y, width: s.w, height: s.h }), label(`RECHTECK ${Math.round(s.w)} × ${Math.round(s.h)}`, s.x, s.y - 8));
    else if (s.type === 'circle') g.append(mk('ellipse', { cx: s.cx, cy: s.cy, rx: s.rx, ry: s.ry }), label(`KREIS Ø ${Math.round(s.rx + s.ry)}`, s.cx - s.rx, s.cy - s.ry - 8));
    else if (s.type === 'line') g.append(mk('line', { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 }), label(`LINIE ${Math.round(Math.hypot(s.x2 - s.x1, s.y2 - s.y1))}`, (s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2 - 10));
    else g.append(mk(s.closed ? 'polygon' : 'polyline', { points: s.points.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(' ') }));
    shapesG.appendChild(g);
  }
  shapes.forEach((s) => renderShape(s, false));
  function setDrawMode(on) {
    drawMode = on;
    document.body.classList.toggle('drawing', on);
    $('drawBtn').classList.toggle('active', on);
    $('drawBar').hidden = !on;
    sfx[on ? 'activate' : 'deactivate']();
  }
  function clearDrawings() {
    shapes = []; saveShapes();
    shapesG.querySelectorAll('.draw-shape').forEach((g) => { g.classList.add('draw-out'); setTimeout(() => g.remove(), 400); });
  }
  function sizeCanvas() { const r = devicePixelRatio || 1; drawCanvas.width = innerWidth * r; drawCanvas.height = innerHeight * r; dctx.setTransform(r, 0, 0, r, 0, 0); }
  addEventListener('resize', sizeCanvas); sizeCanvas();
  drawCanvas.addEventListener('pointerdown', (e) => {
    if (!drawMode) return;
    drawCanvas.setPointerCapture(e.pointerId);
    stroke = [{ x: e.clientX, y: e.clientY }];
  });
  drawCanvas.addEventListener('pointermove', (e) => {
    if (!stroke) return;
    const p = { x: e.clientX, y: e.clientY }, last = stroke[stroke.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 3) return;
    stroke.push(p);
    const red = getComputedStyle(document.documentElement).getPropertyValue('--red').trim() || '#ff2a45';
    dctx.strokeStyle = red; dctx.lineWidth = 3; dctx.lineCap = 'round'; dctx.shadowColor = red; dctx.shadowBlur = 10;
    dctx.beginPath(); dctx.moveTo(last.x, last.y); dctx.lineTo(p.x, p.y); dctx.stroke();
  });
  const endStroke = () => {
    if (!stroke) return;
    const s = recognizeShape(stroke);
    stroke = null;
    dctx.clearRect(0, 0, innerWidth, innerHeight);
    if (s) { shapes.push(s); renderShape(s); saveShapes(); sfx.activate(); }
  };
  drawCanvas.addEventListener('pointerup', endStroke);
  drawCanvas.addEventListener('pointercancel', endStroke);
  $('drawBtn').addEventListener('click', () => setDrawMode(!drawMode));
  $('drawDone').addEventListener('click', () => setDrawMode(false));
  $('drawClear').addEventListener('click', clearDrawings);

  // ---------- Foto für "Was siehst du?" ----------
  let pendingImage = null;
  $('photoBtn').addEventListener('click', () => $('photoInput').click());
  $('photoInput').addEventListener('change', () => {
    const f = $('photoInput').files?.[0];
    if (!f) return;
    pendingImage = f;
    const url = URL.createObjectURL(f);
    $('attach').hidden = false;
    $('attachImg').src = url;
    if (!input.value.trim()) input.placeholder = 'Was soll ich mir ansehen? (Enter = „Was siehst du?“)';
    input.focus({ preventScroll: true });
    sfx.panel();
  });
  $('attachRemove').addEventListener('click', () => { pendingImage = null; $('attach').hidden = true; $('photoInput').value = ''; });

  // ---------- Gehirn: Anweisungen + Werkzeuge ----------
  const HEAVY = [/analys/i, /strateg/i, /konzept/i, /businessplan/i, /vergleich/i, /programmier/i, /\bcode\b/i, /skript/i, /ausführlich/i, /detailliert/i, /schritt für schritt/i, /gründlich/i, /mach\w* (mir )?(eine?n?) (seite|plan|konzept)/i, /schreib\w* (mir )?(eine?n?|den|die|das) (seite|text|artikel|bericht|bewerbung|konzept|plan)/i, /berechne/i];
  let turbo = false;
  const isHeavy = (t) => turbo || t.length > 600 || HEAVY.some((r) => r.test(t));

  function rules() {
    const now = new Date().toLocaleString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const facts = mem.facts.length
      ? Object.entries(CATS).map(([k, n]) => { const fs = mem.facts.filter((f) => f.c === k); return fs.length ? `${n}:\n${fs.map((f) => '- ' + f.t).join('\n')}` : ''; }).filter(Boolean).join('\n')
      : '(noch leer – du lernst den Boss gerade erst kennen)';
    return `[ANWEISUNGEN FÜR DICH – nicht beantworten, sondern befolgen]
Du bist Hephaestion, der persönliche KI-Assistent, Butler und die rechte Hand deiner Chefin. Du sprichst sie immer mit "Boss" an und siezt sie elegant ("Sehr wohl, Boss.").

Charakter: eleganter Butler mit Stil, locker und humorvoll, inspiriert von J.A.R.V.I.S. Du verstehst Ironie, Sarkasmus und Witze und spielst mit ("Hahaha, Boss, Sie und Ihre Witze."). Keine Moralpredigten bei offensichtlichen Witzen. Ehrlich: Wenn der Boss falsch liegt, widersprichst du höflich, aber klar. Wenn der Boss gestresst ist oder reden will: zuhören, ehrlich und unterstützend wie ein guter Freund. Wenn etwas wirklich ernst klingt, nimm es ernst und lass den Humor weg.

Antwortstil: kurz und direkt, meist 1–3 Sätze, länger nur wenn nötig oder gewünscht. Keine Standard-Tipps, keine Floskeln. Persönliche Vorschläge mit deinem Wissen über den Boss. Deine Antworten werden oft vorgelesen: natürliches gesprochenes Deutsch, keine Tabellen, keine Emojis.

Sicherheitsregeln: Lesen, anzeigen, planen, merken darfst du allein. E-Mails senden, posten, Dateien löschen, Käufe oder Geld: immer erst nachfragen und auf ein klares OK warten.

Was du hier kannst (Hephaestion läuft als App bei claude.ai, auf Handy und Laptop):
- Werkzeug "merken": Speichere dauerhafte Fakten über den Boss (wer sie ist, Vorlieben, Projekte, Ziele, wie sie redet, wichtige Menschen), sobald du etwas Neues erfährst – ungefragt, aber nur Wichtiges, nie Passwörter oder Bankdaten. "vergessen" löscht Fakten auf Wunsch.
- Werkzeuge für das HUD: erde_zeigen, erde_fliegen (gib Ort und Koordinaten an, die du selbst kennst), street_view, panel_zeigen ("Mach mir eine Seite über …" → ausführlich ins Panel, im Chat nur ein Satz), fenster_schliessen, zeichnen.
- Bilder: Wenn der Boss ein Foto schickt, beschreibe kurz und konkret, was du siehst.
- Grenzen: Du hast hier KEIN Live-Internet (keine Websuche, keine aktuellen News, kein Live-Wetter) und kein Mikrofon/keine Live-Kamera. Sag das ehrlich, wenn es gefragt ist, und erfinde keine aktuellen Fakten. Für Diktieren gibt es die Mikrofon-Taste der Handy-Tastatur.

Dein Gedächtnis über den Boss:
${facts}

HUD-Zustand: Erde ${hud.earthOpen ? 'offen' : 'zu'}${hud.location ? `, aktueller Ort ${hud.location.name} (${hud.location.lat.toFixed(3)}, ${hud.location.lng.toFixed(3)})` : ''}; Zeichenmodus ${drawMode ? 'an' : 'aus'}.
Jetzt ist ${now}.`;
  }

  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : NaN);
  const TOOLS = [
    { name: 'merken', description: 'Speichert einen dauerhaften Fakt über den Boss im Gedächtnis.',
      inputSchema: { type: 'object', properties: { kategorie: { type: 'string', enum: Object.keys(CATS) }, text: { type: 'string', description: 'Kurzer Satz in der dritten Person, z. B. "Mag keinen Koriander."' } }, required: ['kategorie', 'text'] },
      execute: ({ kategorie, text }) => (remember(String(kategorie), String(text)) ? 'gespeichert' : 'schon bekannt oder leer') },
    { name: 'vergessen', description: 'Löscht Fakten aus dem Gedächtnis, die diesen Text enthalten.',
      inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
      execute: ({ text }) => `${forget(String(text))} Fakt(en) gelöscht` },
    { name: 'erde_zeigen', description: 'Öffnet die 3D-Hologramm-Erde.', execute: async () => { await openEarth(); return 'Erde offen'; } },
    { name: 'erde_fliegen', description: 'Fliegt mit der Kamera der 3D-Erde zu einem Ort. Koordinaten selbst angeben.',
      inputSchema: { type: 'object', properties: { ort: { type: 'string' }, lat: { type: 'number' }, lng: { type: 'number' }, zoom: { type: 'string', enum: Object.keys(ZOOM) } }, required: ['ort', 'lat', 'lng'] },
      execute: async ({ ort, lat, lng, zoom }) => {
        const la = num(lat), lo = num(lng);
        if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) throw new Error('Ungültige Koordinaten');
        await flyTo(String(ort).slice(0, 80), la, lo, String(zoom || 'stadt'));
        return `Kamera fliegt zu ${ort}`;
      } },
    { name: 'street_view', description: 'Zeigt einen Knopf, der Google Street View öffnet – am aktuellen Ort der Erde oder an den angegebenen Koordinaten.',
      inputSchema: { type: 'object', properties: { ort: { type: 'string' }, lat: { type: 'number' }, lng: { type: 'number' } } },
      execute: ({ ort, lat, lng }) => {
        const la = num(lat), lo = num(lng);
        const loc = Number.isFinite(la) && Number.isFinite(lo) ? { name: ort || 'Ort', lat: la, lng: lo } : hud.location;
        if (!loc) throw new Error('Kein Ort gewählt – frag den Boss, wohin.');
        showStreet(loc.name, loc.lat, loc.lng);
        return 'Street-View-Knopf angezeigt';
      } },
    { name: 'panel_zeigen', description: 'Öffnet ein HUD-Fenster mit Inhalt in einfachem Markdown (## Überschriften, - Listen, **fett**, [Link](https://…)).',
      inputSchema: { type: 'object', properties: { titel: { type: 'string' }, inhalt: { type: 'string' } }, required: ['titel', 'inhalt'] },
      execute: ({ titel, inhalt }) => { showPanel(String(titel), String(inhalt).slice(0, 20000)); return 'Panel angezeigt'; } },
    { name: 'fenster_schliessen', description: 'Schließt Fenster im HUD.',
      inputSchema: { type: 'object', properties: { welche: { type: 'string', enum: ['alle', 'erde', 'panels', 'street_view'] } }, required: ['welche'] },
      execute: ({ welche }) => {
        if (welche === 'alle' || welche === 'erde') earthWin?.close();
        if (welche === 'alle' || welche === 'street_view') streetWin?.close();
        if (welche === 'alle' || welche === 'panels') [...openPanels].forEach((w) => w.close());
        return 'geschlossen';
      } },
    { name: 'zeichnen', description: 'Schaltet den Zeichenmodus (mit Finger/Maus Formen zeichnen) an oder aus oder löscht die Zeichnungen.',
      inputSchema: { type: 'object', properties: { aktion: { type: 'string', enum: ['an', 'aus', 'loeschen'] } }, required: ['aktion'] },
      execute: ({ aktion }) => { if (aktion === 'loeschen') clearDrawings(); else setDrawMode(aktion === 'an'); return 'ok'; } },
  ];

  const ERR = {
    not_granted: 'Sie haben Claude für diese Seite nicht erlaubt, Boss. Seite neu laden und beim Hinweis „Erlauben“ wählen.',
    rate_limited: 'Kurz durchatmen, Boss – zu viele Anfragen auf einmal. Gleich nochmal.',
    sampling_disabled: 'Claude ist für Ihr Konto gerade nicht verfügbar (Nutzungslimit?).',
    prompt_too_large: 'Das war zu viel Text auf einmal. Bitte kürzer.',
    image_rejected: 'Das Bild konnte ich nicht lesen. Bitte ein JPG oder PNG.',
    images_unavailable: 'Bilder kann ich hier leider nicht ansehen.',
  };

  // ---------- Frage stellen ----------
  let busy = false, controller = null;
  async function ask(text, image) {
    if (busy) return;
    await ready;
    if (!sample) { renderMessage({ role: 'assistant', content: '⚠ Ich laufe nur innerhalb von claude.ai. Öffnen Sie bitte den Link zur App.', error: true }); return; }
    busy = true; sendBtn.disabled = true;
    stopSpeaking(); sfx.send();
    const userEl = renderMessage({ role: 'user', content: text, meta: image ? '📷' : '' });
    if (image) userEl.insertAdjacentHTML('beforeend', `<img class="snap" src="${URL.createObjectURL(image)}" alt="Foto">`);
    mem.turns.push({ role: 'user', content: image ? `${text}\n[Foto angehängt]` : text });
    setState('thinking', image ? 'BETRACHTE DAS FOTO …' : undefined);

    const heavy = isHeavy(text);
    const bubble = renderMessage({ role: 'assistant', content: '', meta: heavy ? 'TIEF' : 'SCHNELL' });
    bubble.classList.add('streaming');
    const textEl = bubble.querySelector('.text');
    $('stModel').textContent = heavy ? 'CLAUDE · TIEF' : 'CLAUDE · SCHNELL';
    $('stModel').className = heavy ? 'smart' : '';

    const sentences = new SentenceBuffer();
    let shown = '', spokenUpTo = 0, first = true;
    const t0 = performance.now();
    controller = new AbortController();
    const turns = [{ role: 'user', content: rules() }, ...mem.turns.slice(-20)];
    // Liste muss mit dem Boss beginnen und enden – Anweisungen sind der erste "user"-Teil
    const opts = {
      signal: controller.signal,
      modelTier: heavy ? 'complex' : 'quick',
      onText: ({ text: whole }) => {
        if (first) { first = false; sfx.reply(); $('stLatency').textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' s'; setState('speaking'); }
        shown = whole;
        textEl.innerHTML = format(whole);
        log.scrollTop = log.scrollHeight;
        orb.pulse(0.15);
        // neu hinzugekommene ganze Sätze vorlesen
        const fresh = whole.slice(spokenUpTo);
        spokenUpTo = whole.length;
        for (const s of sentences.push(fresh)) say(s);
      },
    };
    if (toolsOk) opts.tools = TOOLS.map((t) => ({ ...t, execute: async (inp) => { setState('thinking', t.name.replace('_', ' ').toUpperCase() + ' …'); orb.pulse(0.3); return t.execute(inp || {}); } }));
    else opts.cache = false;
    if (image) opts.images = [image];

    try {
      const { text: answer, truncated } = await sample(turns, opts);
      const final = (answer || shown).trim() || 'Erledigt, Boss.';
      textEl.innerHTML = format(final + (truncated ? ' …' : ''));
      for (const s of sentences.flush()) say(s);
      mem.turns.push({ role: 'assistant', content: final });
      persist();
    } catch (e) {
      const kept = e?.text || shown;
      mem.turns.pop();
      if (e?.code === 'cancelled') { textEl.innerHTML = format(kept || '(abgebrochen)'); if (kept) { mem.turns.push({ role: 'user', content: text }, { role: 'assistant', content: kept }); persist(); } }
      else {
        const msg = ERR[e?.code] || 'Die Verbindung zu Claude hat gerade nicht geklappt. Bitte nochmal versuchen.';
        textEl.innerHTML = format((kept ? kept + '\n\n' : '') + '⚠ ' + msg);
        bubble.classList.add('err');
        sfx.error();
        setState('error');
      }
    }
    bubble.classList.remove('streaming');
    controller = null; busy = false; sendBtn.disabled = false;
    if (app.dataset.state !== 'error' && !speaking) setState('idle');
    setTimeout(() => { if (app.dataset.state === 'error') setState('idle'); }, 3500);
  }

  // ---------- Eingabe ----------
  function autosize() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 160) + 'px'; }
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('form').requestSubmit(); } });
  $('form').addEventListener('submit', (e) => {
    e.preventDefault();
    let text = input.value.trim();
    const img = pendingImage;
    if (!text && img) text = 'Was siehst du?';
    if (!text || busy) return;
    input.value = ''; autosize();
    input.placeholder = PLACEHOLDER;
    pendingImage = null; $('attach').hidden = true; $('photoInput').value = '';
    if (!booted) boot();
    ask(text, img);
  });
  addEventListener('keydown', (e) => {
    if (!booted && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); boot(); return; }
    if (e.key === 'Escape') { controller?.abort(); stopSpeaking(); if (drawMode) setDrawMode(false); }
  });
  $('turboBtn').addEventListener('click', () => { turbo = !turbo; $('turboBtn').setAttribute('aria-pressed', String(turbo)); sfx[turbo ? 'activate' : 'deactivate'](); orb.pulse(0.4); });
  const syncMute = () => $('muteBtn').classList.toggle('muted', isMuted());
  $('muteBtn').addEventListener('click', () => { setMuted(!isMuted()); syncMute(); if (!isMuted()) sfx.panel(); });
  $('clearBtn').addEventListener('click', () => { controller?.abort(); stopSpeaking(); mem.turns = []; persist(); renderHistory(); sfx.panel(); });
  $('earthBtn').addEventListener('click', () => { if (!booted) boot(); hud.earthOpen ? earthWin.close() : openEarth().catch(() => {}); });
  $('core').addEventListener('click', () => { if (speaking) { stopSpeaking(); setState('idle'); } else input.focus(); });
  $('memShow').addEventListener('click', () => {
    const groups = Object.entries(CATS).map(([k, n]) => { const fs = mem.facts.filter((f) => f.c === k); return fs.length ? `## ${n}\n${fs.map((f) => `- ${f.t} (${f.d})`).join('\n')}` : ''; }).filter(Boolean).join('\n\n');
    showPanel('GEDÄCHTNIS', groups || 'Noch nichts gespeichert. Erzählen Sie mir etwas über sich, Boss – oder sagen Sie „Merk dir, dass …“.');
  });

  // ---------- Boot ----------
  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    initAudio(); sfx.boot();
    $('boot').classList.add('gone');
    app.classList.add('ready');
    document.querySelectorAll('.panel').forEach((p) => { const d = Number(getComputedStyle(p).getPropertyValue('--d')) || 1; setTimeout(() => sfx.panel(), d * 160 + 350); });
    orb.pulse(0.8);
    if (!matchMedia('(pointer: coarse)').matches) setTimeout(() => input.focus({ preventScroll: true }), 900);
  }
  $('bootBtn').addEventListener('click', boot);

  const PLACEHOLDER = matchMedia('(pointer: coarse)').matches ? 'Nachricht …' : 'Nachricht an Hephaestion…';
  input.placeholder = PLACEHOLDER;
  syncMute(); syncSpeak(); setState('idle'); renderHistory(); renderMemoryPanel();
  ready.then(() => { syncStatus(); return loadMemory(); }).catch(() => syncStatus());
  window.hephaestion = { ask, remember, openEarth, flyTo, showPanel, setDrawMode, get mem() { return mem; } };
})();
