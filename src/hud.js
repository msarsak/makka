// Datenanzeigen am Rand: Uhr, Datum, Wetter, Systemstatus, Ring-Markierungen.
const $ = (id) => document.getElementById(id);

export function buildTicks() {
  const g = $('ticks');
  const NS = 'http://www.w3.org/2000/svg';
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const major = i % 6 === 0;
    const r1 = 140, r2 = major ? 128 : 134;
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', 200 + Math.cos(a) * r1); l.setAttribute('y1', 200 + Math.sin(a) * r1);
    l.setAttribute('x2', 200 + Math.cos(a) * r2); l.setAttribute('y2', 200 + Math.sin(a) * r2);
    if (major) l.setAttribute('class', 'major');
    g.appendChild(l);
  }
}

export function startClock() {
  const time = $('clockTime'), date = $('clockDate');
  const tick = () => {
    const d = new Date();
    const hm = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const s = String(d.getSeconds()).padStart(2, '0');
    time.innerHTML = `${hm}<span class="sec">${s}</span>`;
    date.textContent = d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };
  tick();
  setInterval(tick, 1000);
}

async function fetchWeather(coords) {
  const q = coords ? `?lat=${coords.latitude.toFixed(3)}&lon=${coords.longitude.toFixed(3)}` : '';
  const r = await fetch('/api/weather' + q);
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'HTTP ' + r.status);
  return r.json();
}
function showWeather(w) {
  $('wxPlace').textContent = w.place.toUpperCase();
  $('wxTemp').textContent = w.temp;
  $('wxText').textContent = w.text;
  $('wxMinMax').textContent = `${w.min}° / ${w.max}°`;
  $('wxFeels').textContent = `${w.feels}°`;
  $('wxWind').textContent = `${w.wind} km/h`;
  $('wxHum').textContent = `${w.humidity} %`;
}
export function startWeather() {
  const load = async () => {
    let coords = null;
    if (navigator.geolocation && window.isSecureContext) {
      coords = await new Promise((res) => navigator.geolocation.getCurrentPosition(
        (p) => res(p.coords), () => res(null), { timeout: 6000, maximumAge: 30 * 60 * 1000 }));
    }
    try { showWeather(await fetchWeather(coords)); }
    catch (e) {
      $('wxText').textContent = 'Wetter offline';
      console.warn(e);
      setTimeout(load, 5000); // Server evtl. noch nicht bereit – gleich nochmal
    }
  };
  load();
  setInterval(load, 15 * 60 * 1000);
}

export async function loadHealth(attempt = 0) {
  try {
    const r = await fetch('/api/health');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const h = await r.json();
    const demo = h.mode !== 'live';
    const mode = $('stMode');
    mode.textContent = demo ? 'DEMO' : 'LIVE';
    mode.className = demo ? 'demo' : 'live';
    $('sysLine').textContent = demo ? 'DEMO-MODUS · KEIN API-KEY' : 'SYSTEM ONLINE';
    document.querySelector('.brand-sub .dot').classList.toggle('demo', demo);
    $('stModel').textContent = shortModel(h.models.fast);
    const started = Date.now() - h.uptimeSec * 1000;
    const up = () => {
      const s = Math.floor((Date.now() - started) / 1000);
      $('stUptime').textContent = `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };
    up(); setInterval(up, 1000);
    return h;
  } catch {
    $('stMode').textContent = attempt < 5 ? 'VERBINDE…' : 'OFFLINE';
    $('sysLine').textContent = attempt < 5 ? 'VERBINDE MIT SERVER …' : 'SERVER NICHT ERREICHBAR';
    // Beim Start ist der Server manchmal ein paar Sekunden langsamer als der Browser
    await new Promise((res) => setTimeout(res, attempt < 5 ? 1500 : 5000));
    return loadHealth(attempt + 1);
  }
}

export function shortModel(id = '') {
  if (id === 'demo') return 'DEMO';
  const m = id.match(/claude-(\w+)-(\d+)(?:-(\d+))?/);
  return m ? `${m[1].toUpperCase()} ${m[2]}${m[3] ? '.' + m[3] : ''}` : id.toUpperCase();
}

export function setModelInfo(model, tier) {
  const el = $('stModel');
  el.textContent = shortModel(model) + (tier === 'smart' ? ' · TIEF' : ' · SCHNELL');
  el.className = tier === 'smart' ? 'smart' : '';
}
export function setLatency(ms) { $('stLatency').textContent = ms != null ? `${(ms / 1000).toFixed(1)} s` : '--'; }
export function setFps(fps) { $('stFps').textContent = `${fps} FPS`; }
