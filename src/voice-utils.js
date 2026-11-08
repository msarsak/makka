// Reine Hilfsfunktionen für die Sprache (ohne Browser, daher gut testbar).

// Die Spracherkennung schreibt "Hephaestion" oft falsch: Hefästion, Hephaistion,
// Hefe Stion, Heff, Hey Chef … Darum erkennen wir großzügig.
const GREET = '(?:hey|hei|hej|hay|hi|he|ey|ok|okay|hallo)';
const NAME = '(?:h?[eä](?:ph|ff?)\\p{L}*|ha(?:ph|ff?)\\p{L}*|chef)';
const WAKE_RE = new RegExp(`(?:^|[^\\p{L}])${GREET}[\\s,!.]+${NAME}(?=$|[^\\p{L}])`, 'iu');
// Langer Name auch ohne "Hey" am Satzanfang: "Hephaestion, wie spät ist es?"
const NAME_ONLY_RE = /^\s*h?[eä](?:ph|ff?)\p{L}*st\p{L}*(?=$|[^\p{L}])/iu;

/** Sucht das Wake-Word. Liefert { found, command } – command ist der Rest danach. */
export function findWake(text) {
  const t = String(text || '');
  const m = WAKE_RE.exec(t) || NAME_ONLY_RE.exec(t);
  if (!m) return { found: false, command: '' };
  const command = t.slice(m.index + m[0].length).replace(/^[\s,.!?:;–-]+/, '').trim();
  return { found: true, command };
}

/** Entfernt Formatierung, Links und Emojis, damit sich das Vorlesen natürlich anhört. */
export function cleanForSpeech(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' (Code siehe Bildschirm) ')
    .replace(/https?:\/\/\S+/g, ' (Link siehe Bildschirm) ')
    .replace(/[*_`#>|~]+/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Sammelt gestreamten Text und gibt fertige Sätze zum Vorlesen heraus. */
export class SentenceBuffer {
  constructor({ maxLen = 220 } = {}) { this.buf = ''; this.maxLen = maxLen; }
  push(chunk) {
    this.buf += chunk;
    const out = [];
    for (;;) {
      const m = /^([\s\S]*?[.!?…:;](?:["“”')\]]*))(\s+)/.exec(this.buf) || /^([\s\S]*?)\n+/.exec(this.buf);
      if (m && m[1].trim().length >= 2) {
        out.push(m[1].trim());
        this.buf = this.buf.slice(m[0].length);
        continue;
      }
      if (this.buf.length > this.maxLen) { // sehr langer Satz: am Komma teilen
        const cut = this.buf.lastIndexOf(', ', this.maxLen);
        if (cut > 40) { out.push(this.buf.slice(0, cut + 1).trim()); this.buf = this.buf.slice(cut + 2); continue; }
      }
      break;
    }
    return out.map(cleanForSpeech).filter(Boolean);
  }
  flush() { const rest = cleanForSpeech(this.buf); this.buf = ''; return rest ? [rest] : []; }
}

/** Wählt die beste deutsche Stimme (Edge-Natural-Stimmen klingen am besten). */
export function pickVoice(voices, savedName) {
  const list = (voices || []).filter((v) => /^de(-|_|$)/i.test(v.lang));
  if (savedName) { const s = (voices || []).find((v) => v.name === savedName); if (s) return s; }
  const prefs = ['Conrad', 'Florian', 'Killian', 'Jonas', 'Google Deutsch', 'Stefan', 'Katja', 'Seraphina', 'Amala'];
  const score = (v) => {
    let s = 0;
    const i = prefs.findIndex((p) => v.name.includes(p));
    if (i >= 0) s += 100 - i * 5;
    if (/natural|online|neural/i.test(v.name)) s += 50;
    if (/de-DE/i.test(v.lang)) s += 10;
    return s;
  };
  return list.sort((a, b) => score(b) - score(a))[0] || null;
}
