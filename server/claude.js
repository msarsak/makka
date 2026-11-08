// Verbindung zur Claude API (Anthropic). Der Key kommt NUR aus der .env.
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from './persona.js';

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

/**
 * Streamt eine Antwort. Callbacks: onText(text), liefert am Ende {stopReason, usage, model}.
 */
export async function streamReply({ messages, route, timeZone, signal, onText }) {
  const history = sanitizeHistory(messages);
  if (!history.length) throw new Error('Keine Nachricht erhalten.');
  if (!hasKey()) return mockReply({ history, onText, signal });

  const base = {
    model: route.model,
    max_tokens: route.tier === 'smart' ? 16000 : 4000,
    system: buildSystemPrompt({ timeZone }),
    thinking: { type: 'adaptive' },
    output_config: { effort: route.effort },
    messages: history,
  };

  const run = async (useFallback) => {
    const stream = useFallback
      ? getClient().beta.messages.stream(
          { ...base, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' },
          { signal })
      : getClient().messages.stream(base, { signal });
    let sent = 0;
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        sent += event.delta.text.length;
        onText(event.delta.text);
      }
    }
    const final = await stream.finalMessage();
    return { final, sent };
  };

  let result;
  const wantFallback = FALLBACK_MODELS.has(route.model);
  try {
    result = await run(wantFallback);
  } catch (err) {
    // Falls dein Konto den Fallback-Beta noch nicht hat: ohne erneut versuchen
    if (wantFallback && err instanceof Anthropic.BadRequestError && /fallback|beta/i.test(err.message)) {
      result = await run(false);
    } else throw err;
  }

  const { final } = result;
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
