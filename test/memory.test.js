import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ensureVault, saveFact, loadCoreMemory, searchVault, readNote, safeResolve, memoryStats, vaultRoot } from '../server/memory.js';

const tmp = () => fs.mkdtemp(path.join(os.tmpdir(), 'heph-vault-'));

test('legt die Gedächtnis-Struktur an', async () => {
  const root = await tmp();
  await ensureVault(root);
  for (const f of ['Hephaestion/Hephaestion.md', 'Hephaestion/Boss/Über mich.md', 'Hephaestion/Boss/Vorlieben.md', 'Hephaestion/Boss/Projekte.md']) {
    await fs.access(path.join(root, f));
  }
});

test('speichert Fakten mit Datum, Tagebuch-Link und ohne Duplikate', async () => {
  const root = await tmp();
  const r = await saveFact({ category: 'vorlieben', text: 'Liebt Sushi, hasst Koriander.' }, root);
  assert.equal(r.note, 'Hephaestion/Boss/Vorlieben.md');
  assert.equal(await saveFact({ category: 'vorlieben', text: 'liebt sushi hasst koriander' }, root), null);
  const note = await fs.readFile(path.join(root, r.note), 'utf8');
  assert.match(note, /^- Liebt Sushi, hasst Koriander\. _\(\d{4}-\d{2}-\d{2}\)_$/m);
  const diaryDir = path.join(root, 'Hephaestion/Tagebuch');
  const diary = await fs.readFile(path.join(diaryDir, (await fs.readdir(diaryDir))[0]), 'utf8');
  assert.match(diary, /\[\[Hephaestion\/Boss\/Vorlieben\|Vorlieben\]\]/);
});

test('Projekte bekommen eigene, verlinkte Notizen', async () => {
  const root = await tmp();
  await saveFact({ category: 'projekte', text: 'Baut einen KI-Assistenten im JARVIS-Stil.', project: 'Hephaestion' }, root);
  await saveFact({ category: 'projekte', text: 'Phase 3 ist das Gedächtnis.', project: 'Hephaestion' }, root);
  const list = await fs.readFile(path.join(root, 'Hephaestion/Boss/Projekte.md'), 'utf8');
  assert.equal(list.match(/\[\[Hephaestion\/Projekte\/Hephaestion\|Hephaestion\]\]/g).length, 1);
  const proj = await fs.readFile(path.join(root, 'Hephaestion/Projekte/Hephaestion.md'), 'utf8');
  assert.match(proj, /JARVIS/); assert.match(proj, /Phase 3/);
});

test('Kernnotizen landen im Kontext, eigene Zusatznotizen auch', async () => {
  const root = await tmp();
  await fs.writeFile(path.join(root, 'Mein Profil.md'), '# Profil\nIch heiße Makka.');
  await saveFact({ category: 'ueber_mich', text: 'Macht eine IT-Lehre.' }, root);
  const ctx = await loadCoreMemory(root, { OBSIDIAN_CORE_NOTES: 'Mein Profil.md' });
  assert.match(ctx, /IT-Lehre/); assert.match(ctx, /Makka/);
  assert.doesNotMatch(ctx, /Wird von Hephaestion gepflegt/);
});

test('Suche und Lesen im ganzen Vault, aber nie außerhalb', async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, 'Reisen'));
  await fs.writeFile(path.join(root, 'Reisen/Italien.md'), '# Italien\nIm Sommer nach Rom und Neapel.');
  await fs.mkdir(path.join(root, '.obsidian'));
  await fs.writeFile(path.join(root, '.obsidian/rom.md'), 'Rom intern');
  const hits = await searchVault('Rom Urlaub', root);
  assert.equal(hits[0].path, 'Reisen/Italien.md');
  assert.equal(hits.length, 1);
  assert.match(await readNote('Reisen/Italien', root), /Neapel/);
  await assert.rejects(readNote('../../etc/passwd', root));
  assert.equal(safeResolve(root, '../x.md'), null);
});

test('Statistik zählt Fakten', async () => {
  const root = await tmp();
  await saveFact({ category: 'ziele', text: 'Will mit n8n Automationen verkaufen.' }, root);
  const s = await memoryStats(root);
  assert.equal(s.ok, true); assert.equal(s.facts, 1);
});

test('Vault-Pfad aus .env, auch mit Anführungszeichen', () => {
  assert.equal(vaultRoot({ OBSIDIAN_VAULT: '"/tmp/MeinVault"' }), path.resolve('/tmp/MeinVault'));
  assert.match(vaultRoot({}), /vault$/);
});
