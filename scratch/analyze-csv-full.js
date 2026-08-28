import fs from 'fs';

const buf = fs.readFileSync('C:/Turnero/Importar/migro pacientes.csv');
let content = buf.toString('latin1'); // latin1 handles Spanish accents properly

const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
console.log('Header:', lines[0]);

const rows = lines.slice(1);
console.log(`Total patient rows: ${rows.length}`);

// Inspect each column value distribution
rows.forEach((r, idx) => {
  const parts = r.split(';').map(p => p.trim());
  if (parts.length < 5) {
    console.log(`Row ${idx+1} has only ${parts.length} columns:`, r);
  }
  // Check DNI
  const dni = parts[3] ? parts[3].replace(/\D/g, '') : '';
  if (!dni) {
    console.log(`Row ${idx+1} has missing DNI:`, r);
  }
});
