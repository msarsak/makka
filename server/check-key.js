// Prüft, ob dein Claude API-Key funktioniert:  npm run check-key
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { friendlyError } from './claude.js';

const key = (process.env.ANTHROPIC_API_KEY || '').trim();
if (!key) {
  console.log('\n✗ Kein API-Key gefunden. Trage ANTHROPIC_API_KEY in die Datei .env ein.\n');
  process.exit(1);
}
console.log(`\nPrüfe Key ${key.slice(0, 10)}…${key.slice(-4)} …`);
const model = process.env.MODEL_FAST || 'claude-haiku-5-5';
try {
  const client = new Anthropic({ apiKey: key });
  const msg = await client.messages.create({
    model,
    max_tokens: 200,
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: 'Antworte nur mit: Systeme online.' }],
  });
  const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  console.log(`✓ Key funktioniert! Modell ${msg.model} sagt: "${text.trim()}"\n`);
} catch (err) {
  console.log('✗ ' + friendlyError(err) + '\n');
  process.exit(1);
}
