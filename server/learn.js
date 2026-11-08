// Lernt nach jedem Gesprächsschritt still dazu und schreibt Neues ins Gedächtnis.
import Anthropic from '@anthropic-ai/sdk';
import { CATEGORIES, loadCoreMemory, saveFact } from './memory.js';
import { sanitizeHistory } from './claude.js';

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['facts'],
  properties: {
    facts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['category', 'text', 'project'],
        properties: {
          category: { type: 'string', enum: Object.keys(CATEGORIES) },
          text: { type: 'string' },
          project: { type: 'string' },
        },
      },
    },
  },
};

const INSTRUCTIONS = `Du bist das Gedächtnis-Modul von Hephaestion, dem persönlichen Assistenten einer Person, die er "Boss" nennt.
Lies den letzten Gesprächsausschnitt und extrahiere NUR neue, dauerhaft nützliche Fakten über den Boss, die noch NICHT im bisherigen Gedächtnis stehen.

Kategorien:
- ueber_mich: Leben, Beruf, Ausbildung, Wohnort, Alltag, Gesundheit nur wenn der Boss es selbst erzählt
- vorlieben: mag / mag nicht (Essen, Musik, Stil, Tools …)
- projekte: laufende oder geplante Projekte (immer mit Projektname in "project")
- ziele: Ziele, Wünsche, Pläne
- kommunikation: wie der Boss redet, Humor, Lieblingswörter, wie er angesprochen werden will
- menschen: wichtige Personen (Name + Beziehung)

Regeln:
- Jeder Fakt: ein kurzer, eigenständiger Satz in der dritten Person ohne "Der Boss", z. B. "Macht eine IT-Lehre." oder "Liebt Sushi, hasst Koriander."
- Nur was der Boss selbst gesagt oder klar gezeigt hat. Nichts aus Hephaestions Antworten erfinden, keine Vermutungen.
- Keine Belanglosigkeiten (einmalige Fragen wie "wie spät ist es"), keine Witze als Fakten.
- NIEMALS Passwörter, PINs, Bankdaten, API-Keys oder ähnliche Geheimnisse.
- "project" nur bei Kategorie projekte füllen, sonst leerer String.
- Gibt es nichts Neues: leere Liste. Meistens ist das so – lieber zu wenig als zu viel.`;

let client = null;
export async function learnFromConversation(messages, env = process.env) {
  if (!(env.ANTHROPIC_API_KEY || '').trim()) return { skipped: 'demo', saved: [] };
  const recent = sanitizeHistory(messages).slice(-6);
  if (!recent.some((m) => m.role === 'user')) return { saved: [] };
  client ||= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY.trim() });

  const memory = await loadCoreMemory();
  const transcript = recent.map((m) => `${m.role === 'user' ? 'BOSS' : 'HEPHAESTION'}: ${m.content}`).join('\n\n');
  const res = await client.messages.create({
    model: env.MODEL_FAST || 'claude-haiku-5-5',
    max_tokens: 2000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: INSTRUCTIONS,
    messages: [{
      role: 'user',
      content: `<bisheriges_gedaechtnis>\n${memory || '(leer)'}\n</bisheriges_gedaechtnis>\n\n<gespraech>\n${transcript}\n</gespraech>`,
    }],
  });
  if (res.stop_reason !== 'end_turn') return { saved: [] };
  const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  let facts = [];
  try { facts = JSON.parse(text).facts || []; } catch { return { saved: [] }; }

  const saved = [];
  for (const f of facts.slice(0, 8)) {
    const r = await saveFact(f);
    if (r) saved.push(r);
  }
  return { saved };
}
