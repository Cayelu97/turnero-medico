import fs from 'fs';

// Check encoding (utf-8 vs latin1)
const buf = fs.readFileSync('C:/Turnero/Importar/migro pacientes.csv');
let content = buf.toString('utf8');
if (content.includes('')) {
  content = buf.toString('latin1');
}

const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
console.log('Total non-empty lines:', lines.length);
console.log('Header:\n', lines[0]);

console.log('\n--- 10 sample lines ---');
for (let i = 1; i <= Math.min(10, lines.length - 1); i++) {
  console.log(`[${i}]`, lines[i]);
}
