// Orte finden (OpenStreetMap / Open-Meteo, kostenlos) und Street View vorbereiten (Google, Key in .env).
const cache = new Map();
const UA = 'Hephaestion-Assistant/0.4 (personal assistant)';

async function getJson(url, headers = {}) {
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

// Wie weit die Kamera rauszoomt – je nach Größe des Ortes
export function altitudeFor(bbox) {
  if (!bbox) return 0.6;
  const [s, n, w, e] = bbox.map(Number);
  const span = Math.max(Math.abs(n - s), Math.abs(e - w));
  if (span > 20) return 1.6;   // Kontinent / großes Land
  if (span > 5) return 1.0;    // Land
  if (span > 1) return 0.55;   // Region
  return 0.4;                  // Stadt, Gebäude
}

/** Sucht einen Ort. Fallback: Koordinaten, die Claude selbst kennt. */
export async function geocode(place, fallback = {}) {
  const q = String(place || '').trim();
  if (!q) throw new Error('Kein Ort angegeben');
  const key = q.toLowerCase();
  if (cache.has(key)) return cache.get(key);
  let result = null;
  try {
    const hits = await getJson(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=1&accept-language=de`, { 'User-Agent': UA });
    const h = hits[0];
    if (h) result = { name: h.name || h.display_name.split(',')[0], full: h.display_name, lat: +h.lat, lng: +h.lon, altitude: altitudeFor(h.boundingbox) };
  } catch { /* weiter mit Fallback */ }
  if (!result) {
    try {
      const g = await getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=de`);
      const h = g.results?.[0];
      if (h) result = { name: h.name, full: [h.name, h.admin1, h.country].filter(Boolean).join(', '), lat: h.latitude, lng: h.longitude, altitude: 0.32 };
    } catch { /* weiter */ }
  }
  if (!result && Number.isFinite(fallback.lat) && Number.isFinite(fallback.lng)) {
    result = { name: q, full: q, lat: fallback.lat, lng: fallback.lng, altitude: 0.4 };
  }
  if (!result) throw new Error(`Ort "${q}" nicht gefunden`);
  cache.set(key, result);
  return result;
}

/** Street View für einen Punkt: mit Key eingebettet, ohne Key als Google-Maps-Link. */
export async function streetView({ lat, lng, name }, env = process.env) {
  const key = (env.GOOGLE_MAPS_API_KEY || '').trim();
  const external = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  if (!key) return { ok: true, mode: 'link', name, lat, lng, external, note: 'Kein Google-Maps-Key in der .env – nur als Link verfügbar.' };

  let pano = null, at = { lat, lng };
  try {
    const m = await getJson(`https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=3000&source=outdoor&key=${encodeURIComponent(key)}`);
    if (m.status === 'OK') { pano = m.pano_id; at = { lat: m.location.lat, lng: m.location.lng }; }
    else if (m.status === 'ZERO_RESULTS') return { ok: false, name, lat, lng, external, note: 'Hier gibt es kein Street View in der Nähe.' };
    // REQUEST_DENIED o. ä.: Metadaten-API nicht freigeschaltet – trotzdem direkt einbetten
  } catch { /* egal, direkt einbetten */ }
  const loc = pano ? `pano=${encodeURIComponent(pano)}` : `location=${lat},${lng}`;
  const url = `https://www.google.com/maps/embed/v1/streetview?key=${encodeURIComponent(key)}&${loc}&heading=0&pitch=5&fov=90&language=de`;
  return { ok: true, mode: 'embed', name, ...at, url, external };
}
