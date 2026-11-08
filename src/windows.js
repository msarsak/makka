// Schwebende HUD-Fenster: animiert öffnen/schließen, verschiebbar, schließbar.
import { sfx } from './sound.js';

let z = 10;
const registry = new Map(); // Element → Fenster (für Handgesten)
export const windowFor = (el) => registry.get(el?.closest?.('.hudwin'));
const layer = () => document.getElementById('windows');

export function createHudWindow({ id, title, className = '', onClose }) {
  const el = document.createElement('section');
  el.className = `hudwin ${className}`;
  el.id = id;
  el.hidden = true;
  el.innerHTML = `
    <header class="hudwin-bar">
      <span class="hudwin-title">${title}</span>
      <span class="hudwin-tools"></span>
      <button class="hudwin-close" type="button" aria-label="Schließen">✕</button>
    </header>
    <div class="hudwin-body"></div>`;
  layer().appendChild(el);
  const body = el.querySelector('.hudwin-body');
  const tools = el.querySelector('.hudwin-tools');
  let open = false;

  const front = () => { el.style.zIndex = String(++z); };
  el.addEventListener('pointerdown', front);

  // Verschieben an der Titelleiste
  const bar = el.querySelector('.hudwin-bar');
  bar.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a')) return;
    const startX = e.clientX, startY = e.clientY;
    const ox = parseFloat(el.dataset.dx || 0), oy = parseFloat(el.dataset.dy || 0);
    bar.setPointerCapture(e.pointerId);
    const move = (ev) => api.moveTo(ox + ev.clientX - startX, oy + ev.clientY - startY);
    const up = () => { bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', up);
  });
  el.querySelector('.hudwin-close').addEventListener('click', () => api.close());

  const api = {
    el, body, tools,
    get isOpen() { return open; },
    open() {
      front();
      if (open) return api;
      open = true;
      el.hidden = false;
      el.classList.remove('closing');
      void el.offsetWidth; // Animation neu starten
      el.classList.add('opening');
      sfx.panel();
      return api;
    },
    close() {
      if (!open) return;
      open = false;
      el.classList.remove('opening');
      el.classList.add('closing');
      sfx.deactivate();
      setTimeout(() => { if (!open) el.hidden = true; }, 380);
      onClose?.();
    },
    moveTo(dx, dy) {
      el.dataset.dx = dx; el.dataset.dy = dy;
      el.style.translate = `${dx}px ${dy}px`;
    },
    moveBy(dx, dy) { api.moveTo(parseFloat(el.dataset.dx || 0) + dx, parseFloat(el.dataset.dy || 0) + dy); },
    front,
  };
  registry.set(el, api);
  return api;
}
