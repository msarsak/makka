// Wetter über Open-Meteo (kostenlos, kein Key nötig)
const cache = new Map();
const CODES = {
  0: 'Klar', 1: 'Überwiegend klar', 2: 'Teils bewölkt', 3: 'Bedeckt', 45: 'Nebel', 48: 'Raureifnebel',
  51: 'Leichter Niesel', 53: 'Niesel', 55: 'Starker Niesel', 61: 'Leichter Regen', 63: 'Regen', 65: 'Starker Regen',
  66: 'Gefrierender Regen', 67: 'Gefrierender Regen', 71: 'Leichter Schnee', 73: 'Schnee', 75: 'Starker Schnee',
  77: 'Schneegriesel', 80: 'Regenschauer', 81: 'Regenschauer', 82: 'Heftige Schauer', 85: 'Schneeschauer',
  86: 'Schneeschauer', 95: 'Gewitter', 96: 'Gewitter mit Hagel', 99: 'Gewitter mit Hagel',
};

async function getJson(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

export async function getWeather({ lat, lon, city }) {
  let place = city;
  let la = Number(lat), lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) {
    const geo = await getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de`);
    const hit = geo.results?.[0];
    if (!hit) throw new Error(`Stadt "${city}" nicht gefunden`);
    la = hit.latitude; lo = hit.longitude; place = hit.name;
  } else {
    place = null;
  }
  const key = `${la.toFixed(2)},${lo.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.data;

  const w = await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}` +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code' +
    '&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto');
  const c = w.current;
  const data = {
    place: place || w.timezone?.split('/').pop()?.replace(/_/g, ' ') || 'Standort',
    temp: Math.round(c.temperature_2m),
    feels: Math.round(c.apparent_temperature),
    humidity: c.relative_humidity_2m,
    wind: Math.round(c.wind_speed_10m),
    code: c.weather_code,
    text: CODES[c.weather_code] ?? 'Unbekannt',
    max: Math.round(w.daily.temperature_2m_max[0]),
    min: Math.round(w.daily.temperature_2m_min[0]),
  };
  cache.set(key, { at: Date.now(), data });
  return data;
}
