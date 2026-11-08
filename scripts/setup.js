// Einrichtungs-Assistent: fragt die Einstellungen ab und schreibt sie in die .env
// Start: Doppelklick auf einrichten.bat  (oder: node scripts/setup.js)
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

function parse(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=(.*)$/.exec(line);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}
const mask = (v) => (v ? `${v.slice(0, 7)}…${v.slice(-4)}` : '(leer)');

const QUESTIONS = [
  {
    key: 'ANTHROPIC_API_KEY', title: 'Claude API-Key', secret: true,
    help: 'Von console.anthropic.com → API Keys. Beginnt mit sk-ant-',
    check: (v) => (v.startsWith('sk-ant-') ? null : 'Ein Claude-Key beginnt normalerweise mit "sk-ant-". Trotzdem verwenden?'),
  },
  {
    key: 'GOOGLE_MAPS_API_KEY', title: 'Google-Maps-Key für Street View (optional)', secret: true,
    help: 'Von console.cloud.google.com → Schlüssel und Anmeldedaten. Beginnt mit AIza. Leer lassen = Street View als Link.',
    check: (v) => (v.startsWith('AIza') ? null : 'Ein Google-Maps-Key beginnt mit "AIza". Dieser sieht nach einem anderen Schlüssel aus und wird vermutlich nicht funktionieren. Trotzdem verwenden?'),
  },
  {
    key: 'OBSIDIAN_VAULT', title: 'Pfad zum Obsidian-Vault (optional)',
    help: 'Z. B. C:\\Users\\Name\\Documents\\Obsidian\\MeinVault – leer lassen = eigener Ordner "vault"',
    check: (v) => (fs.existsSync(v) ? null : 'Diesen Ordner gibt es nicht. Trotzdem verwenden?'),
  },
  { key: 'WEATHER_CITY', title: 'Stadt fürs Wetter', help: 'Falls der Browser den Standort nicht freigibt' },
];

const template = fs.readFileSync(examplePath, 'utf8');
const current = fs.existsSync(envPath) ? parse(fs.readFileSync(envPath, 'utf8')) : {};
const values = { ...parse(template), ...current };

const rl = readline.createInterface({ input: process.stdin, terminal: false });
const lines = rl[Symbol.asyncIterator]();
async function ask(prompt) {
  process.stdout.write(prompt);
  const { value, done } = await lines.next();
  return done ? '' : String(value);
}
console.log('\n  ===== HEPHAESTION · EINRICHTUNG =====');
console.log('  Einfügen mit Rechtsklick (oder Strg+V). Enter = Wert behalten.\n');

for (const q of QUESTIONS) {
  const now = values[q.key] || '';
  console.log(`  ▸ ${q.title}`);
  console.log(`    ${q.help}`);
  console.log(`    Aktuell: ${q.secret ? mask(now) : now || '(leer)'}`);
  let answer = (await ask('    Neu (Enter = behalten, "-" = leeren): ')).trim().replace(/^["']|["']$/g, '');
  if (answer === '-') { values[q.key] = ''; console.log('    → geleert\n'); continue; }
  if (!answer) { console.log('    → behalten\n'); continue; }
  const warn = q.check?.(answer);
  if (warn) {
    const ok = (await ask(`    ⚠ ${warn} (j/n): `)).trim().toLowerCase();
    if (ok !== 'j' && ok !== 'ja') { console.log('    → nicht übernommen\n'); continue; }
  }
  values[q.key] = answer;
  console.log('    → gespeichert\n');
}
rl.close();

// Vorlage übernehmen (Kommentare bleiben), Werte einsetzen, unbekannte alte Werte anhängen
const used = new Set();
let out = template.split(/\r?\n/).map((line) => {
  const m = /^(\s*)([A-Z0-9_]+)\s*=/.exec(line);
  if (!m) return line;
  used.add(m[2]);
  return `${m[2]}=${values[m[2]] ?? ''}`;
}).join('\n');
const extra = Object.keys(current).filter((k) => !used.has(k));
if (extra.length) out += '\n# Weitere Einstellungen\n' + extra.map((k) => `${k}=${current[k]}`).join('\n') + '\n';
fs.writeFileSync(envPath, out, 'utf8');
console.log(`  ✓ Gespeichert in ${envPath}\n`);
