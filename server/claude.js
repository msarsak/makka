// Verbindung zur Claude API (Anthropic). Der Key kommt NUR aus der .env.
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from './persona.js';
import { CATEGORIES, loadCoreMemory, searchVault, readNote, saveFact } from './memory.js';
import { geocode, streetView } from './geo.js';

const MAX_HISTORY = 30; // so viele Nachrichten schickt er maximal mit (spart Kosten)
// Modelle, die den serverseitigen Fallback bei Ablehnungen kennen
const FALLBACK_MODELS = new Set(['claude-opus-5-5', 'claude-opus-5', 'claude-fable-5-1', 'claude-sonnet-5-5']);

let client = null;
export function hasKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim());
}
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY.trim() });
  return client;
}

// Nur saubere Text-Nachrichten im richtigen Wechsel user/assistant durchlassen
export function sanitizeHistory(messages) {
  const clean = [];
  for (const m of Array.isArray(messages) ? messages : []) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    const text = typeof m.content === 'string' ? m.content.trim() : '';
    if (!text) continue;
    const last = clean[clean.length - 1];
    if (last && last.role === m.role) last.content += '\n\n' + text;
    else clean.push({ role: m.role, content: text.slice(0, 20000) });
  }
  while (clean.length && clean[0].role !== 'user') clean.shift();
  const trimmed = clean.slice(-MAX_HISTORY);
  while (trimmed.length && trimmed[0].role !== 'user') trimmed.shift();
  return trimmed;
}

export function friendlyError(err) {
  if (err instanceof Anthropic.AuthenticationError) return 'Mein API-Schlüssel wird abgelehnt, Boss. Bitte prüfen Sie den Key in der .env (npm run check-key).';
  if (err instanceof Anthropic.PermissionDeniedError) return 'Zugriff verweigert – dieser API-Key darf das gewählte Modell nicht nutzen.';
  if (err instanceof Anthropic.NotFoundError) return 'Dieses Modell kenne ich nicht, Boss. Bitte MODEL_FAST / MODEL_SMART in der .env prüfen.';
  if (err instanceof Anthropic.RateLimitError) return 'Kurz durchatmen, Boss – zu viele Anfragen auf einmal. Gleich nochmal versuchen.';
  if (err instanceof Anthropic.InternalServerError) return 'Die Claude-Server sind gerade überlastet. Ich versuche es gleich wieder.';
  if (err instanceof Anthropic.APIConnectionError) return 'Keine Verbindung zur Claude API. Ist das Internet an?';
  if (err instanceof Anthropic.APIError) {
    if (err.status === 402 || /credit|billing/i.test(err.message)) return 'Das API-Guthaben ist leer, Boss. Auf console.anthropic.com unter "Billing" aufladen.';
    return `Die Claude API meldet einen Fehler (${err.status ?? '?'}): ${err.message}`;
  }
  return 'Ein unerwarteter Fehler in meinen Schaltkreisen: ' + (err?.message || String(err));
}

// ---------- Werkzeuge: Gedächtnis ----------
export const TOOLS = [
  {
    name: 'memory_search',
    description: 'Durchsucht den Obsidian-Vault (das Gedächtnis) des Boss nach Stichwörtern. Nutze das, wenn der Boss nach etwas fragt, das in seinen Notizen stehen könnte (Projekte, Pläne, Personen, frühere Ideen), und es nicht schon in deinem Gedächtnis-Kontext steht. Liefert Pfade und kurze Ausschnitte.',
    input_schema: { type: 'object', properties: { query: { type: 'string', description: 'Suchbegriffe, z. B. "Urlaub Italien"' } }, required: ['query'] },
  },
  {
    name: 'memory_read',
    description: 'Liest eine Notiz aus dem Vault komplett. Pfad so angeben, wie memory_search ihn liefert.',
    input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
  },
  {
    name: 'memory_save',
    description: 'Speichert sofort einen Fakt über den Boss im Gedächtnis. Nutze das, wenn der Boss ausdrücklich sagt, dass du dir etwas merken sollst. (Alles andere lernst du nach dem Gespräch automatisch.) Speichere niemals Passwörter, PINs, Bankdaten oder API-Keys.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: Object.keys(CATEGORIES) },
        text: { type: 'string', description: 'Ein kurzer, eigenständiger Fakt in der dritten Person, z. B. "Mag keinen Koriander."' },
        project: { type: 'string', description: 'Nur bei category=projekte: Name des Projekts' },
      },
      required: ['category', 'text'],
    },
  },
];
// ---------- Werkzeuge: HUD / Erde ----------
TOOLS.push(
  {
    name: 'earth_show',
    description: 'Öffnet die 3D-Hologramm-Erde im HUD (z. B. "Zeig mir die Erde").',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'earth_fly_to',
    description: 'Lässt die Kamera der 3D-Erde animiert zu einem Ort fliegen (Stadt, Land, Adresse, Sehenswürdigkeit). Öffnet die Erde automatisch. Gib zusätzlich deine beste Schätzung der Koordinaten an.',
    input_schema: {
      type: 'object',
      properties: {
        place: { type: 'string', description: 'Ort möglichst eindeutig, z. B. "New York City, USA" oder "Eiffelturm, Paris"' },
        lat: { type: 'number' },
        lng: { type: 'number' },
      },
      required: ['place'],
    },
  },
  {
    name: 'street_view',
    description: 'Öffnet Google Street View. Ohne "place" am aktuellen Ort der Erde (siehe HUD-Zustand), sonst am genannten Ort.',
    input_schema: { type: 'object', properties: { place: { type: 'string' } } },
  },
  {
    name: 'camera_control',
    description: 'Steuert Kamera und Handgesten im HUD. on = Kamera an (Navigieren mit den Händen), draw = Zeichenmodus (Formen in die Luft zeichnen), navigate = zurück zum Navigieren, clear = Zeichnungen löschen, off = Kamera aus.',
    input_schema: { type: 'object', properties: { action: { type: 'string', enum: ['on', 'off', 'draw', 'navigate', 'clear'] } }, required: ['action'] },
  },
  {
    name: 'panel_close',
    description: 'Schließt Fenster im HUD.',
    input_schema: { type: 'object', properties: { panel: { type: 'string', enum: ['earth', 'streetview', 'all'] } }, required: ['panel'] },
  },
);
const TOOL_LABEL = {
  memory_search: 'DURCHSUCHE GEDÄCHTNIS', memory_read: 'LESE NOTIZ', memory_save: 'SPEICHERE ERINNERUNG',
  earth_show: 'ÖFFNE ERDE', earth_fly_to: 'BERECHNE FLUGROUTE', street_view: 'LADE STREET VIEW', panel_close: 'SCHLIESSE FENSTER', camera_control: 'STEUERE KAMERA',
};

async function runTool(block, onSaved, hud = {}, onAction) {
  const inp = block.input && typeof block.input === 'object' ? block.input : {};
  try {
    if (block.name === 'earth_show') {
      onAction?.({ type: 'earth', open: true });
      hud.earthOpen = true;
      return 'Erde ist geöffnet.';
    }
    if (block.name === 'earth_fly_to') {
      if (typeof inp.place !== 'string') throw new Error('place fehlt');
      const g = await geocode(inp.place, { lat: Number(inp.lat), lng: Number(inp.lng) });
      onAction?.({ type: 'fly', ...g });
      hud.earthOpen = true;
      hud.location = g;
      return `Kamera fliegt zu ${g.full} (${g.lat.toFixed(4)}, ${g.lng.toFixed(4)}).`;
    }
    if (block.name === 'street_view') {
      let loc = hud.location;
      if (typeof inp.place === 'string' && inp.place.trim()) loc = await geocode(inp.place);
      if (!loc) return { error: true, text: 'Kein Ort gewählt. Frag den Boss, wo er hin will.' };
      const sv = await streetView(loc);
      if (sv.ok) onAction?.({ type: 'streetview', ...sv });
      return sv.ok
        ? (sv.mode === 'embed' ? `Street View geöffnet bei ${loc.name}.` : `Kein Google-Maps-Key eingerichtet – es gibt nur einen Link zu Google Maps im HUD. ${sv.note}`)
        : sv.note;
    }
    if (block.name === 'camera_control') {
      const action = ['on', 'off', 'draw', 'navigate', 'clear'].includes(inp.action) ? inp.action : 'on';
      onAction?.({ type: 'camera', action });
      return { on: 'Kamera und Handgesten sind an.', off: 'Kamera ist aus.', draw: 'Zeichenmodus ist an.', navigate: 'Navigationsmodus ist an.', clear: 'Zeichnungen gelöscht.' }[action];
    }
    if (block.name === 'panel_close') {
      onAction?.({ type: 'close', panel: ['earth', 'streetview', 'all'].includes(inp.panel) ? inp.panel : 'all' });
      return 'Geschlossen.';
    }
    if (block.name === 'memory_search') {
      if (typeof inp.query !== 'string') throw new Error('query fehlt');
      const hits = await searchVault(inp.query);
      return hits.length ? JSON.stringify(hits) : 'Keine Treffer im Vault.';
    }
    if (block.name === 'memory_read') {
      if (typeof inp.path !== 'string') throw new Error('path fehlt');
      return await readNote(inp.path);
    }
    if (block.name === 'memory_save') {
      if (typeof inp.text !== 'string' || typeof inp.category !== 'string') throw new Error('category/text fehlt');
      const saved = await saveFact({ category: inp.category, text: inp.text, project: typeof inp.project === 'string' ? inp.project : '' });
      if (saved) onSaved?.(saved);
      return saved ? `Gespeichert in ${saved.note}` : 'War schon gespeichert.';
    }
    throw new Error('Unbekanntes Werkzeug');
  } catch (e) {
    return { error: true, text: 'Fehler: ' + e.message };
  }
}

/**
 * Streamt eine Antwort (mit Gedächtnis-Werkzeugen).
 * Callbacks: onText(text), onTool({name,label}), onSaved(fact). Liefert {stopReason, usage, model}.
 */
export async function streamReply({ messages, route, timeZone, signal, onText, onTool, onSaved, onAction, hud = {} }) {
  const history = sanitizeHistory(messages);
  if (!history.length) throw new Error('Keine Nachricht erhalten.');
  if (!hasKey()) return mockReply({ history, onText, signal });

  let memory = '';
  try { memory = await loadCoreMemory(); } catch (e) { console.warn('[gedächtnis]', e.message); }
  const system = [{ type: 'text', text: buildSystemPrompt({ timeZone }) }];
  system.push({ type: 'text', text: memory
    ? `# Dein Gedächtnis (aus dem Obsidian-Vault des Boss)\nNutze dieses Wissen natürlich und unaufdringlich – wie ein Butler, der seinen Boss kennt. Sag nicht ständig "laut meinen Notizen".\n\n${memory}`
    : '# Dein Gedächtnis\nNoch leer – du lernst den Boss gerade erst kennen.' });

  const loc = hud.location && Number.isFinite(hud.location.lat)
    ? `${String(hud.location.name).slice(0, 80)} (${hud.location.lat.toFixed(3)}, ${hud.location.lng.toFixed(3)})` : 'keiner';
  system.push({ type: 'text', text: `# HUD-Zustand\nErde geöffnet: ${hud.earthOpen ? 'ja' : 'nein'} · Aktueller Ort auf der Erde: ${loc} · Street View offen: ${hud.streetOpen ? 'ja' : 'nein'}` });

  const base = {
    model: route.model,
    max_tokens: route.tier === 'smart' ? 16000 : 4000,
    system,
    thinking: { type: 'adaptive' },
    output_config: { effort: route.effort },
    tools: TOOLS,
  };
  let useFallback = FALLBACK_MODELS.has(route.model);
  const convo = [...history];
  let final = null;

  for (let step = 0; step < 6; step++) {
    const params = { ...base, messages: convo };
    let stream;
    const open = () => (useFallback
      ? getClient().beta.messages.stream({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }, { signal })
      : getClient().messages.stream(params, { signal }));
    try {
      stream = open();
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') onText(event.delta.text);
      }
      final = await stream.finalMessage();
    } catch (err) {
      // Falls dein Konto den Fallback-Beta noch nicht hat: ohne erneut versuchen
      if (useFallback && step === 0 && err instanceof Anthropic.BadRequestError && /fallback|beta/i.test(err.message)) {
        useFallback = false; step--; continue;
      }
      throw err;
    }

    if (final.stop_reason !== 'tool_use') break;
    const uses = final.content.filter((b) => b.type === 'tool_use');
    if (!uses.length) break;
    convo.push({ role: 'assistant', content: final.content });
    const results = [];
    for (const u of uses) {
      onTool?.({ name: u.name, label: TOOL_LABEL[u.name] || u.name });
      const r = await runTool(u, onSaved, hud, onAction);
      results.push(typeof r === 'string'
        ? { type: 'tool_result', tool_use_id: u.id, content: r }
        : { type: 'tool_result', tool_use_id: u.id, content: r.text, is_error: true });
    }
    convo.push({ role: 'user', content: results });
  }

  if (final.stop_reason === 'refusal') {
    onText('\n[Diese Anfrage hat der Sicherheitsfilter von Claude abgelehnt, Boss.]');
  } else if (final.stop_reason === 'max_tokens') {
    onText(' …\n[Antwort gekürzt – sagen Sie "weiter", dann mache ich weiter.]');
  }
  return { stopReason: final.stop_reason, usage: final.usage, model: final.model };
}

// ---------- Demo-Modus ohne API-Key ----------
const MOCK_LINES = [
  'Demo-Modus aktiv, Boss. Mir fehlt noch der API-Schlüssel in der .env – bis dahin kann ich nur charmant aussehen. Was mir, zugegeben, hervorragend gelingt.',
  'Sehr wohl, Boss. Sobald der Claude-Key eingetragen ist, antworte ich richtig. Bis dahin: Alle Systeme laufen, das Hologramm glänzt.',
  'Hahaha, Boss, Sie und Ihre Tests. Ich bin bereit – sobald mein Gehirn (der API-Key) angeschlossen ist.',
];
let mockIndex = 0;
async function mockReply({ history, onText, signal }) {
  const last = history[history.length - 1].content;
  const line = MOCK_LINES[mockIndex++ % MOCK_LINES.length] + ` (Sie schrieben: "${last.slice(0, 80)}")`;
  for (const word of line.split(/(\s+)/)) {
    if (signal?.aborted) break;
    onText(word);
    await new Promise((r) => setTimeout(r, 35));
  }
  return { stopReason: 'end_turn', usage: null, model: 'demo' };
}
