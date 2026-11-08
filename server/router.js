// Entscheidet, ob eine Nachricht das schnelle oder das starke Modell bekommt.

const HEAVY_PATTERNS = [
  /analys/i, /strateg/i, /konzept/i, /businessplan/i, /vergleich/i,
  /programmier/i, /\bcode\b/i, /skript/i, /debug/i, /algorithm/i,
  /ausführlich/i, /detailliert/i, /schritt für schritt/i, /gründlich/i,
  /schreib\w* (mir )?(eine?n?|den|die|das) (seite|text|artikel|bericht|aufsatz|bewerbung|konzept|plan)/i,
  /mach\w* (mir )?(eine?n?) (seite|plan|konzept)/i,
  /plan(e|ung)? (für|mein)/i, /berechne/i, /beweis/i,
];

export function chooseModel(text, { turbo = false, env = process.env } = {}) {
  const fast = env.MODEL_FAST || 'claude-haiku-5-5';
  const smart = env.MODEL_SMART || 'claude-opus-5-5';
  const t = String(text || '');
  const heavy = turbo || t.length > 600 || HEAVY_PATTERNS.some((re) => re.test(t));
  return heavy
    ? { tier: 'smart', model: smart, effort: 'medium', reason: turbo ? 'turbo' : 'komplex' }
    : { tier: 'fast', model: fast, effort: 'low', reason: 'alltag' };
}
