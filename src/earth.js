// Die 3D-Hologramm-Erde (globe.gl). Wird erst geladen, wenn man sie braucht.

function cssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export async function createEarth(container, { onPick } = {}) {
  const [{ default: Globe }, { default: world }, { feature }, { polygonToCells }] = await Promise.all([
    import('globe.gl'),
    import('world-atlas/countries-110m.json'),
    import('topojson-client'),
    import('h3-js'),
  ]);
  // Länder mit fehlerhaften Umrissen aussortieren (sonst stolpert die Waben-Berechnung)
  const countries = feature(world, world.objects.countries).features.filter((f) => {
    const g = f.geometry;
    const polys = g?.type === 'Polygon' ? [g.coordinates] : g?.type === 'MultiPolygon' ? g.coordinates : [];
    try { polys.forEach((c) => polygonToCells(c, 3, true)); return polys.length > 0; } catch { return false; }
  });
  const C = {
    blue: cssVar('--blue', '#1f6fff'), bright: cssVar('--blue-bright', '#5cc2ff'),
    red: cssVar('--red', '#ff2a45'), gold: cssVar('--gold', '#ffc94d'),
  };

  let home = null;
  let target = null;

  const g = new Globe(container, { rendererConfig: { antialias: true, alpha: true }, animateIn: true })
    .backgroundColor('rgba(0,0,0,0)')
    .globeImageUrl('/textures/earth-night.jpg') // Stadtlichter bei Nacht (NASA)
    .showAtmosphere(true)
    .atmosphereColor(C.bright)
    .atmosphereAltitude(0.18)
    .showGraticules(true)
    // Länder als leuchtende Waben
    .hexPolygonsData(countries)
    .hexPolygonResolution(3)
    .hexPolygonMargin(0.3)
    .hexPolygonAltitude(0.004)
    .hexPolygonColor(() => hexToRgba(C.bright, 0.7))
    .hexPolygonLabel((d) => `<div class="globe-tip">${d.properties.name}</div>`)
    // Ziel: pulsierende Ringe
    .ringColor(() => (t) => hexToRgba(C.red, Math.max(0, 1 - t)))
    .ringMaxRadius(4)
    .ringPropagationSpeed(2.5)
    .ringRepeatPeriod(800)
    // Flugbogen
    .arcColor(() => [C.gold, C.red])
    .arcStroke((d) => d.stroke)
    .arcDashLength(0.45)
    .arcDashGap(0.15)
    .arcDashAnimateTime(1600)
    .arcAltitudeAutoScale(0.45)
    // Ortsbeschriftung
    .labelText('name')
    .labelColor(() => C.gold)
    .labelSize((d) => d.size)
    .labelDotRadius((d) => d.size * 0.35)
    .labelAltitude(0.012)
    .labelResolution(2)
    .labelsTransitionDuration(600)
    // Heimatpunkt
    .pointColor(() => C.bright)
    .pointAltitude(0.02)
    .pointRadius(0.35)
    .onGlobeClick(({ lat, lng }) => {
      const loc = { name: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`, lat, lng, altitude: g.pointOfView().altitude };
      api.flyTo(loc, 900);
      onPick?.(loc);
    });

  // Hologramm-Material: blau getönte Nachtansicht mit goldenen Stadtlichtern
  const mat = g.globeMaterial();
  mat.color.set('#b8d4ff');
  mat.emissive.set(C.blue);
  mat.emissiveIntensity = 0.16;
  mat.shininess = 4;

  // Beim Heranzoomen werden die Waben dezenter, damit man die Lichter sieht
  let close = null;
  const applyZoom = (altitude) => {
    const isClose = altitude < 0.9;
    if (isClose === close) return;
    close = isClose;
    g.hexPolygonColor(() => hexToRgba(C.bright, isClose ? 0.16 : 0.7));
  };
  g.onZoom(({ altitude }) => applyZoom(altitude));

  const controls = g.controls();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.45;
  controls.enableDamping = true;
  g.pointOfView({ lat: 30, lng: 10, altitude: 2.4 });

  // clientWidth statt getBoundingClientRect: unabhängig von der Öffnungs-Animation (scale)
  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    if (w && h) g.width(w).height(h);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  function refreshLayers() {
    g.pointsData(home ? [home] : []);
    g.ringsData(target ? [target] : []);
    g.labelsData(target ? [target] : []);
    g.arcsData(home && target && (Math.abs(home.lat - target.lat) + Math.abs(home.lng - target.lng) > 0.5)
      ? [{ startLat: home.lat, startLng: home.lng, endLat: target.lat, endLng: target.lng, stroke: Math.min(0.5, Math.max(0.06, target.size * 0.35)) }] : []);
  }

  const api = {
    flyTo(loc, ms = 2600) {
      const alt = loc.altitude ?? 0.4;
      target = { name: loc.name, lat: loc.lat, lng: loc.lng, size: Math.min(1.2, Math.max(0.12, alt * 0.55)) };
      controls.autoRotate = false;
      refreshLayers();
      // erst etwas rauszoomen, dann zum Ziel – wirkt wie ein Flug
      const cur = g.pointOfView();
      const far = Math.max(cur.altitude, 1.8);
      g.pointOfView({ altitude: far }, ms * 0.3);
      applyZoom(far);
      setTimeout(() => g.pointOfView({ lat: loc.lat, lng: loc.lng, altitude: alt }, ms * 0.7), ms * 0.3);
      setTimeout(() => applyZoom(alt), ms * 0.65);
    },
    setHome(lat, lng) { home = { lat, lng }; refreshLayers(); },
    get location() { return target; },
    pause() { g.pauseAnimation(); },
    resume() { g.resumeAnimation(); resize(); },
    globe: g,
  };
  return api;
}
