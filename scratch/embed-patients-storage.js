import fs from 'fs';

const pacientes = JSON.parse(fs.readFileSync('c:/Turnero/scratch/migrated_pacientes.json', 'utf8'));
const hasAgustina = pacientes.some(p => p.id === 'pac-1787870676906' || (p.dni && p.dni.includes('35894120')));
if (!hasAgustina) {
  pacientes.unshift({
    id: 'pac-1787870676906',
    clinica_id: 'clinica-1',
    dni: '35894120',
    nombre: 'Agustina',
    apellido: 'Benítez',
    nombre_completo: 'Agustina Benítez',
    edad: 29,
    telefono_whatsapp: '+54 9 351 552-3344',
    email: 'agustina.benitez@gmail.com',
    domicilio: 'Av. Colón 1400, Córdoba',
    obra_social_id: 'os-sancor',
    obra_social_nombre: 'Sancor Salud',
    plan_id: 'pl-sancor-500',
    plan_nombre: 'Plan 500',
    numero_afiliado: '1350025',
    consentimiento_informado: {
      aceptado: true,
      fecha_firma: '2026-08-20T10:00:00Z'
    },
    marca_temporal_registro: '2026-08-20 10:00:00',
    alergias: '',
    antecedentes: 'Psicología Clínica',
    medicacion_habitual: '',
    activo: true
  });
}

const storagePath = 'c:/Turnero/src/services/storage.js';
let storageContent = fs.readFileSync(storagePath, 'utf8');

// Replace pacientes: [...] in INITIAL_DATA
const startMarker = 'pacientes: [';
const startIdx = storageContent.indexOf(startMarker);
if (startIdx !== -1) {
  const afterStart = storageContent.slice(startIdx);
  const endIdx = afterStart.indexOf('\n  ],\n  turnos: [');
  if (endIdx !== -1) {
    const formattedPacientes = 'pacientes: ' + JSON.stringify(pacientes, null, 2);
    storageContent = storageContent.slice(0, startIdx) + formattedPacientes + storageContent.slice(startIdx + endIdx + 5);
    fs.writeFileSync(storagePath, storageContent, 'utf8');
    console.log(`✅ Embedded ${pacientes.length} patients into INITIAL_DATA in src/services/storage.js`);
  } else {
    console.log('End marker not found');
  }
} else {
  console.log('Start marker not found');
}
