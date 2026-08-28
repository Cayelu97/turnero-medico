import fs from 'fs';
import path from 'path';

const brainDir = 'C:/Users/macena/.gemini/antigravity/brain';
const convs = fs.readdirSync(brainDir);

console.log('Total conversations:', convs.length);

for (const c of convs) {
  const p = path.join(brainDir, c, '.system_generated', 'logs', 'transcript_full.jsonl');
  if (fs.existsSync(p)) {
    const text = fs.readFileSync(p, 'utf8');
    if (text.includes('pac-') && text.includes('dni')) {
      const matches = text.match(/"dni":\s*"[0-9]+"/g);
      if (matches && matches.length > 5) {
        console.log(`Conv ${c}: found ${matches.length} DNI occurrences!`);
      }
    }
  }
}
