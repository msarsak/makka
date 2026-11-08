import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findWake, SentenceBuffer, cleanForSpeech, pickVoice } from '../src/voice-utils.js';

test('Wake-Word in vielen Schreibweisen', () => {
  for (const t of ['Hey Hephaestion', 'hey hefästion', 'Hey Heph', 'Hey Hef', 'hey Chef', 'Hey, Hephaistion!', 'okay Hefestion', 'Hey Häfestion', 'Hephaestion, wie spät ist es']) {
    assert.equal(findWake(t).found, true, t);
  }
});

test('kein Fehlalarm bei normalen Sätzen', () => {
  for (const t of ['Hey wie gehts', 'Ich habe heute Hefe gekauft', 'He du da', 'Hey Eva', 'Das Heft liegt hier', 'Hallo zusammen']) {
    assert.equal(findWake(t).found, false, t);
  }
});

test('Befehl nach dem Wake-Word wird herausgelöst', () => {
  assert.equal(findWake('Hey Heph, wie wird das Wetter morgen?').command, 'wie wird das Wetter morgen?');
  assert.equal(findWake('hey hefästion').command, '');
  assert.equal(findWake('Hephaestion: erzähl mir einen Witz').command, 'erzähl mir einen Witz');
});

test('Sätze werden beim Streamen sauber getrennt', () => {
  const b = new SentenceBuffer();
  assert.deepEqual(b.push('Sehr wohl, Boss. Das Wet'), ['Sehr wohl, Boss.']);
  assert.deepEqual(b.push('ter ist **gut**! Noch'), ['Das Wetter ist gut!']);
  assert.deepEqual(b.push(' etwas'), []);
  assert.deepEqual(b.flush(), ['Noch etwas']);
});

test('Zahlen wie 3.5 werden nicht als Satzende gelesen', () => {
  const b = new SentenceBuffer();
  assert.deepEqual(b.push('Es sind 3.5 Grad. '), ['Es sind 3.5 Grad.']);
});

test('Vorlesetext ohne Markdown, Links, Emojis', () => {
  assert.equal(cleanForSpeech('**Hallo** Boss 😄 siehe https://x.de'), 'Hallo Boss siehe (Link siehe Bildschirm)');
});

test('beste deutsche Stimme wird gewählt', () => {
  const voices = [
    { name: 'Microsoft Hedda - German', lang: 'de-DE' },
    { name: 'Microsoft Conrad Online (Natural) - German (Germany)', lang: 'de-DE' },
    { name: 'Microsoft David - English', lang: 'en-US' },
  ];
  assert.match(pickVoice(voices).name, /Conrad/);
  assert.equal(pickVoice(voices, 'Microsoft Hedda - German').name, 'Microsoft Hedda - German');
  assert.equal(pickVoice([{ name: 'X', lang: 'en-US' }]), null);
});
