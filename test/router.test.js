import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseModel } from '../server/router.js';
import { sanitizeHistory } from '../server/claude.js';
import { buildSystemPrompt } from '../server/persona.js';

const env = { MODEL_FAST: 'claude-haiku-5-5', MODEL_SMART: 'claude-opus-5-5' };

test('Alltagsfragen gehen an das schnelle Modell', () => {
  const r = chooseModel('Wie spät ist es?', { env });
  assert.equal(r.tier, 'fast');
  assert.equal(r.model, 'claude-haiku-5-5');
});

test('schwere Aufgaben gehen an das starke Modell', () => {
  for (const t of ['Analysiere meinen Businessplan', 'Schreib mir einen Artikel über KI', 'Erklär das ausführlich', 'Hilf mir beim Code']) {
    assert.equal(chooseModel(t, { env }).tier, 'smart', t);
  }
});

test('Turbo erzwingt das starke Modell', () => {
  assert.equal(chooseModel('Hallo', { turbo: true, env }).model, 'claude-opus-5-5');
});

test('Verlauf wird bereinigt (Rollen, leere Nachrichten, Reihenfolge)', () => {
  const h = sanitizeHistory([
    { role: 'assistant', content: 'Hallo' },
    { role: 'user', content: 'a' },
    { role: 'user', content: 'b' },
    { role: 'system', content: 'hack' },
    { role: 'assistant', content: '  ' },
    { role: 'assistant', content: 'ok' },
  ]);
  assert.deepEqual(h, [{ role: 'user', content: 'a\n\nb' }, { role: 'assistant', content: 'ok' }]);
});

test('Persönlichkeit: Boss, Humor, Sicherheitsregeln', () => {
  const p = buildSystemPrompt({ now: new Date('2026-11-08T10:00:00Z') });
  assert.match(p, /Boss/);
  assert.match(p, /Witze/);
  assert.match(p, /E-Mails senden/);
  assert.match(p, /2026/);
});
