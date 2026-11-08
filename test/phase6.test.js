import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { saveWorkflow, listWorkflows, deleteWorkflow, findWorkflow, runWebhook, requestConfirmation, takeConfirmation, validateWorkflow } from '../server/n8n.js';
import { parseReddit } from '../server/research.js';
import { md, LOOK_RE } from '../src/panels.js';

const tmpFile = async () => path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'heph-n8n-')), 'workflows.json');

test('Workflows speichern, finden, löschen', async () => {
  const f = await tmpFile();
  const a = await saveWorkflow({ name: 'Rechnung erstellen', url: 'https://n8n.example.com/webhook/abc', description: 'Erstellt eine Rechnung' }, f);
  await saveWorkflow({ name: 'Social Post', url: 'https://n8n.example.com/webhook/post', confirm: true }, f);
  assert.equal((await listWorkflows(f)).length, 2);
  assert.equal(a.confirm, true, 'Standard: Freigabe nötig');
  assert.equal(findWorkflow(await listWorkflows(f), 'rechnung').name, 'Rechnung erstellen');
  await deleteWorkflow(a.id, f);
  assert.deepEqual((await listWorkflows(f)).map((w) => w.name), ['Social Post']);
});

test('ungültige Webhook-URLs werden abgelehnt', () => {
  assert.throws(() => validateWorkflow({ name: 'x', url: 'kein link' }), /ungültig/);
  assert.throws(() => validateWorkflow({ name: 'x', url: 'file:///etc/passwd' }), /http/);
  assert.throws(() => validateWorkflow({ name: '', url: 'https://a.b' }), /Name/);
});

test('Webhook wird mit Daten aufgerufen', async () => {
  let got = null;
  const srv = http.createServer((req, res) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { got = JSON.parse(b); res.end('{"status":"ok"}'); }); });
  await new Promise((r) => srv.listen(0, r));
  const out = await runWebhook({ name: 'Test', url: `http://127.0.0.1:${srv.address().port}/webhook/x` }, { betrag: 42 });
  srv.close();
  assert.equal(out, '{"status":"ok"}');
  assert.equal(got.source, 'hephaestion');
  assert.deepEqual(got.data, { betrag: 42 });
});

test('Freigabe kann nur einmal eingelöst werden', () => {
  const id = requestConfirmation({ name: 'X' }, {});
  assert.equal(takeConfirmation(id).wf.name, 'X');
  assert.equal(takeConfirmation(id), null);
  assert.equal(takeConfirmation('erfunden'), null);
});

test('Reddit-Antwort wird lesbar aufbereitet', () => {
  const posts = parseReddit({ data: { children: [{ data: { title: 'n8n Tipps', subreddit: 'n8n', score: 120, num_comments: 33, permalink: '/r/n8n/comments/1/x/', created_utc: 1762560000, selftext: 'Hallo  Welt' } }] } });
  assert.deepEqual(posts[0], { title: 'n8n Tipps', subreddit: 'r/n8n', score: 120, comments: 33, url: 'https://www.reddit.com/r/n8n/comments/1/x/', created: '2025-11-08', text: 'Hallo Welt' });
});

test('Panel-Markdown ist sicher (kein HTML/JS durchlassen)', () => {
  const html = md('## Titel\n- **fett** und [Link](https://a.de)\n<script>alert(1)</script>\n[böse](javascript:alert(1))');
  assert.match(html, /<h3>Titel<\/h3>/);
  assert.match(html, /<li><strong>fett<\/strong> und <a href="https:\/\/a.de"/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /href="javascript/);
});

test('"Was siehst du?" wird erkannt', () => {
  for (const t of ['Was siehst du?', 'Hey Heph, schau mal', 'Was halte ich in der Hand?', 'Wie sehe ich aus?', 'kannst du das sehen']) assert.ok(LOOK_RE.test(t), t);
  for (const t of ['Wie spät ist es?', 'Ich sehe das anders', 'Mach mir eine Seite']) assert.ok(!LOOK_RE.test(t), t);
});
