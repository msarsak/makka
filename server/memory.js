// Hephaestions Gedächtnis: dein Obsidian-Vault.
// - Liest vor jedem Gespräch die wichtigsten Notizen.
// - Darf im ganzen Vault suchen und lesen.
// - Schreibt NUR in den Unterordner "Hephaestion/" und löscht nie etwas.
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const HEPH_DIR = 'Hephaestion';

// Kernnotizen, die er vor jedem Gespräch liest (Pfad relativ zum Vault)
export const CATEGORIES = {
  ueber_mich: { file: `${HEPH_DIR}/Boss/Über mich.md`, title: 'Über mich', intro: 'Wer der Boss ist: Leben, Arbeit, Alltag.' },
  vorlieben: { file: `${HEPH_DIR}/Boss/Vorlieben.md`, title: 'Vorlieben', intro: 'Was der Boss mag und nicht mag.' },
  projekte: { file: `${HEPH_DIR}/Boss/Projekte.md`, title: 'Projekte', intro: 'Laufende und geplante Projekte. Details in den verlinkten Projektnotizen.' },
  ziele: { file: `${HEPH_DIR}/Boss/Ziele.md`, title: 'Ziele', intro: 'Wohin der Boss will – kurz- und langfristig.' },
  kommunikation: { file: `${HEPH_DIR}/Boss/Wie der Boss redet.md`, title: 'Wie der Boss redet', intro: 'Sprachstil, Humor, Wörter, wie der Boss angesprochen werden will.' },
  menschen: { file: `${HEPH_DIR}/Boss/Menschen.md`, title: 'Menschen', intro: 'Wichtige Menschen im Leben des Boss.' },
};

export function vaultRoot(env = process.env) {
  const v = (env.OBSIDIAN_VAULT || '').trim().replace(/^["']|["']$/g, '');
  return path.resolve(v || path.join(here, '..', 'vault'));
}

const today = () => new Date().toLocaleDateString('sv-SE'); // 2026-11-08
const link = (rel, label) => `[[${rel.replace(/\.md$/, '')}|${label}]]`;

/** Löst einen Pfad sicher innerhalb des Vaults auf (kein ../, keine absoluten Pfade). */
export function safeResolve(root, rel) {
  const target = path.resolve(root, String(rel || '').replace(/^[/\\]+/, ''));
  const r = path.relative(root, target);
  if (r === '' || r.startsWith('..') || path.isAbsolute(r)) return null;
  return target;
}

function cleanName(name) {
  return String(name || '').replace(/[\\/:*?"<>|#^[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

export async function ensureVault(root = vaultRoot()) {
  await fs.mkdir(path.join(root, HEPH_DIR, 'Boss'), { recursive: true });
  await fs.mkdir(path.join(root, HEPH_DIR, 'Projekte'), { recursive: true });
  await fs.mkdir(path.join(root, HEPH_DIR, 'Tagebuch'), { recursive: true });
  for (const c of Object.values(CATEGORIES)) {
    const f = path.join(root, c.file);
    if (!fssync.existsSync(f)) {
      await fs.writeFile(f, `# ${c.title}\n\n> ${c.intro}\n> Wird von Hephaestion gepflegt – du darfst hier jederzeit selbst schreiben.\n\n`, 'utf8');
    }
  }
  const index = path.join(root, HEPH_DIR, 'Hephaestion.md');
  if (!fssync.existsSync(index)) {
    const links = Object.values(CATEGORIES).map((c) => `- ${link(c.file, c.title)}`).join('\n');
    await fs.writeFile(index, `# Hephaestion – Gedächtnis\n\nAlles, was ich über den Boss weiß.\n\n${links}\n\nTagebuch: \`${HEPH_DIR}/Tagebuch/\`\n`, 'utf8');
  }
  return root;
}

/** Text der Kernnotizen für den System-Prompt (gekürzt). */
export async function loadCoreMemory(root = vaultRoot(), env = process.env, maxChars = 12000) {
  await ensureVault(root);
  const parts = [];
  const extra = (env.OBSIDIAN_CORE_NOTES || '').split(',').map((s) => s.trim()).filter(Boolean);
  const files = [...extra, ...Object.values(CATEGORIES).map((c) => c.file)];
  for (const rel of files) {
    const abs = safeResolve(root, rel);
    if (!abs) continue;
    try {
      const txt = (await fs.readFile(abs, 'utf8')).replace(/^> .*\n/gm, '').trim();
      if (txt.split('\n').length > 1) parts.push(`## Notiz: ${rel}\n${txt}`);
    } catch { /* fehlt – egal */ }
  }
  let out = parts.join('\n\n');
  if (out.length > maxChars) out = out.slice(0, maxChars) + '\n[… gekürzt]';
  return out;
}

async function walk(dir, root, out = [], limit = 5000) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (out.length >= limit) break;
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) await walk(abs, root, out, limit);
    else if (e.name.endsWith('.md')) out.push(abs);
  }
  return out;
}

/** Einfache Volltextsuche im ganzen Vault. */
export async function searchVault(query, root = vaultRoot(), max = 8) {
  const terms = String(query || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 1);
  if (!terms.length) return [];
  const files = await walk(root, root);
  const hits = [];
  for (const abs of files) {
    const rel = path.relative(root, abs).split(path.sep).join('/');
    let txt;
    try { txt = await fs.readFile(abs, 'utf8'); } catch { continue; }
    const low = txt.toLowerCase();
    const name = rel.toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (name.includes(t)) score += 5;
      let i = -1, n = 0;
      while ((i = low.indexOf(t, i + 1)) >= 0 && n < 20) n++;
      score += n;
    }
    if (!score) continue;
    const first = Math.max(0, low.indexOf(terms.find((t) => low.includes(t)) ?? terms[0]));
    const snippet = txt.slice(Math.max(0, first - 120), first + 240).replace(/\s+/g, ' ').trim();
    hits.push({ path: rel, score, snippet });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, max);
}

export async function readNote(rel, root = vaultRoot(), maxChars = 12000) {
  const abs = safeResolve(root, rel.endsWith('.md') ? rel : rel + '.md');
  if (!abs) throw new Error('Pfad liegt außerhalb des Vaults');
  const txt = await fs.readFile(abs, 'utf8');
  return txt.length > maxChars ? txt.slice(0, maxChars) + '\n[… gekürzt]' : txt;
}

function norm(s) { return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }

/** Speichert einen Fakt in die passende Notiz (mit Links + Tagebuch). Gibt null zurück, wenn schon bekannt. */
export async function saveFact({ category, text, project }, root = vaultRoot()) {
  await ensureVault(root);
  const fact = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 500);
  if (fact.length < 3) return null;
  const cat = CATEGORIES[category] ? category : 'ueber_mich';
  const date = today();
  let targetRel = CATEGORIES[cat].file;
  let targetLabel = CATEGORIES[cat].title;

  // Projekte bekommen eine eigene Notiz, die von "Projekte" verlinkt wird
  const pname = cleanName(project);
  if (cat === 'projekte' && pname) {
    targetRel = `${HEPH_DIR}/Projekte/${pname}.md`;
    targetLabel = pname;
    const pAbs = path.join(root, targetRel);
    if (!fssync.existsSync(pAbs)) {
      await fs.writeFile(pAbs, `# ${pname}\n\nProjekt vom ${link(CATEGORIES.ueber_mich.file, 'Boss')} · Übersicht: ${link(CATEGORIES.projekte.file, 'Projekte')}\n\n## Notizen\n`, 'utf8');
    }
    const listAbs = path.join(root, CATEGORIES.projekte.file);
    const list = await fs.readFile(listAbs, 'utf8');
    if (!list.includes(`[[${HEPH_DIR}/Projekte/${pname}|`)) {
      await fs.appendFile(listAbs, `- ${link(targetRel, pname)} – seit ${date}\n`, 'utf8');
    }
  }

  const abs = path.join(root, targetRel);
  const existing = await fs.readFile(abs, 'utf8');
  if (norm(existing).includes(norm(fact))) return null; // schon gespeichert
  await fs.appendFile(abs, `- ${fact} _(${date})_\n`, 'utf8');

  const diary = path.join(root, HEPH_DIR, 'Tagebuch', `${date}.md`);
  if (!fssync.existsSync(diary)) await fs.writeFile(diary, `# Tagebuch ${date}\n\nWas ich heute über den Boss gelernt habe:\n\n`, 'utf8');
  await fs.appendFile(diary, `- ${fact} → ${link(targetRel, targetLabel)}\n`, 'utf8');

  return { category: cat, text: fact, note: targetRel };
}

export async function memoryStats(root = vaultRoot()) {
  try {
    await ensureVault(root);
    const files = await walk(root, root);
    const own = files.filter((f) => path.relative(root, f).startsWith(HEPH_DIR));
    let facts = 0;
    for (const f of own) {
      if (f.includes(`${path.sep}Tagebuch${path.sep}`)) continue;
      facts += ((await fs.readFile(f, 'utf8')).match(/^- .*_\(\d{4}-\d{2}-\d{2}\)_$/gm) || []).length;
    }
    return { ok: true, vault: root, notes: files.length, facts, custom: Boolean((process.env.OBSIDIAN_VAULT || '').trim()) };
  } catch (e) {
    return { ok: false, vault: root, error: e.message };
  }
}
