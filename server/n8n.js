// n8n-Workflows per Webhook. Gespeichert in workflows.json (bleibt lokal, nicht auf GitHub).
// Sicherheitsregel: Workflows mit "confirm" laufen erst nach OK des Boss im HUD.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const WORKFLOWS_FILE = process.env.WORKFLOWS_FILE || path.join(here, '..', 'workflows.json');

const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

export async function listWorkflows(file = WORKFLOWS_FILE) {
  try { const data = JSON.parse(await fs.readFile(file, 'utf8')); return Array.isArray(data) ? data : []; }
  catch { return []; }
}
async function writeWorkflows(list, file) { await fs.writeFile(file, JSON.stringify(list, null, 2), 'utf8'); }

export function validateWorkflow(w) {
  const name = clean(w?.name, 60);
  const url = clean(w?.url, 500);
  if (!name) throw new Error('Name fehlt');
  let u;
  try { u = new URL(url); } catch { throw new Error('Webhook-URL ist ungültig'); }
  if (!/^https?:$/.test(u.protocol)) throw new Error('Webhook-URL muss mit http:// oder https:// beginnen');
  return { id: w.id || crypto.randomUUID().slice(0, 8), name, url, description: clean(w?.description, 300), confirm: w?.confirm !== false };
}

export async function saveWorkflow(w, file = WORKFLOWS_FILE) {
  const wf = validateWorkflow(w);
  const list = await listWorkflows(file);
  const i = list.findIndex((x) => x.id === wf.id);
  if (i >= 0) list[i] = wf; else list.push(wf);
  await writeWorkflows(list, file);
  return wf;
}

export async function deleteWorkflow(id, file = WORKFLOWS_FILE) {
  const list = (await listWorkflows(file)).filter((w) => w.id !== id);
  await writeWorkflows(list, file);
}

export function findWorkflow(list, nameOrId) {
  const q = String(nameOrId || '').toLowerCase().trim();
  return list.find((w) => w.id === q) || list.find((w) => w.name.toLowerCase() === q)
    || list.find((w) => w.name.toLowerCase().includes(q) || q.includes(w.name.toLowerCase()));
}

/** Führt den Webhook aus und gibt eine kurze Zusammenfassung der Antwort zurück. */
export async function runWebhook(wf, data = {}) {
  const r = await fetch(wf.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'hephaestion', workflow: wf.name, data, sentAt: new Date().toISOString() }),
    signal: AbortSignal.timeout(30000),
  });
  const text = (await r.text()).slice(0, 4000);
  if (!r.ok) throw new Error(`n8n antwortet mit HTTP ${r.status}: ${text.slice(0, 200)}`);
  return text || '(keine Antwort, Workflow wurde gestartet)';
}

// Wartende Freigaben (nur im Arbeitsspeicher, verfallen nach 10 Minuten)
const pending = new Map();
export function requestConfirmation(wf, data) {
  const id = crypto.randomUUID();
  pending.set(id, { wf, data, at: Date.now() });
  for (const [k, v] of pending) if (Date.now() - v.at > 10 * 60 * 1000) pending.delete(k);
  return id;
}
export function takeConfirmation(id) {
  const p = pending.get(id);
  pending.delete(id);
  if (!p || Date.now() - p.at > 10 * 60 * 1000) return null;
  return p;
}
