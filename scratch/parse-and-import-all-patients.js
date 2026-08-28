import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const url = 'https://pmqcqvuxecibnxfkxrks.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWNxdnV4ZWNpYm54Zmt4cmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyODc5MzMsImV4cCI6MjEwMTg2MzkzM30.A_uDL8BbDAIf21gVmWa8Nu1gI2Oimxe2dJ991zVCJrI';
const sb = createClient(url, anonKey);

// Read CSV
const buf = fs.readFileSync('C:/Turnero/Importar/migro pacientes.csv');
let content = buf.toString('latin1');

const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
const header = lines[0];
const dataRows = lines.slice(1);

console.log(`Processing ${dataRows.length} rows from CSV...`);

function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').trim();
}

function cleanPhone(raw) {
  if (!raw) return '';
  let cleaned = raw.replace(/[^\d+]/g, '').trim();
  return cleaned;
}

function parseContactos(raw) {
  if (!raw || raw.trim() === '-' || raw.trim() === 'No' || raw.trim() === 'no') return [];
  const text = raw.trim();
  
  // Try extracting phone number and name
  // Format examples: "3513230725 Cinthia", "+54 9 3548 43-0261 Liliana guevara", "Veronica Heredia - 0351 6658267", "Maria Ines Arloro 3462 41 9845"
  let phone = '';
  let name = '';
  let relation = 'Contacto Familiar / Urgencias';

  const phoneMatch = text.match(/(\+?\d[\d\s\-]{6,}\d)/);
  if (phoneMatch) {
    phone = phoneMatch[1].trim();
    name = text.replace(phoneMatch[1], '').replace(/[-–—/:]/g, ' ').replace(/\s+/g, ' ').trim();
  } else {
    name = text;
  }

  // Detect relation if mentioned
  const lower = text.toLowerCase();
  if (lower.includes('mamá') || lower.includes('mama') || lower.includes('madre')) relation = 'Madre';
  else if (lower.includes('papá') || lower.includes('papa') || lower.includes('padre')) relation = 'Padre';
  else if (lower.includes('hermano') || lower.includes('hermana')) relation = 'Hermano/a';
  else if (lower.includes('pareja') || lower.includes('espos') || lower.includes('novi')) relation = 'Pareja';
  else if (lower.includes('hijo') || lower.includes('hija')) relation = 'Hijo/a';
  else if (lower.includes('tío') || lower.includes('tia') || lower.includes('tía')) relation = 'Tío/a';
  else if (lower.includes('amig')) relation = 'Amigo/a';

  return [
    {
      id: `fam-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      nombre: toTitleCase(name) || 'Contacto de Urgencias',
      relacion: relation,
      telefono: phone || text,
      es_principal: true,
      notas: text
    }
  ];
}

const parsedPacientes = [];

dataRows.forEach((rowStr, index) => {
  const parts = rowStr.split(';').map(p => p.trim());
  
  const marcaTemporal = parts[0] || '';
  const email = parts[1] || '';
  const rawNombreCompleto = parts[2] || '';
  const rawDni = parts[3] || '';
  const rawCelular = parts[4] || '';
  const domicilio = parts[5] || '';
  const rawEmergenciaPersona = parts[6] || '';
  const rawServicioEmergencia = parts[7] || '';
  const rawEdad = parts[8] || '';
  const rawObraSocial = parts[9] || '';
  const conQuienVive = parts[10] || '';
  const consentimiento = parts[11] || '';

  const cleanDni = rawDni.replace(/\D/g, '');

  // Separate Nombre and Apellido
  let nombre = '';
  let apellido = '';

  const cleanFullName = rawNombreCompleto.trim().replace(/\s+/g, ' ');
  if (cleanFullName.includes(',')) {
    const p = cleanFullName.split(',');
    apellido = toTitleCase(p[0]);
    nombre = toTitleCase(p.slice(1).join(' '));
  } else {
    const tokens = cleanFullName.split(' ');
    if (tokens.length === 1) {
      nombre = toTitleCase(tokens[0]);
      apellido = '';
    } else if (tokens.length === 2) {
      nombre = toTitleCase(tokens[0]);
      apellido = toTitleCase(tokens[1]);
    } else if (tokens.length === 3) {
      // e.g. "Guevara Martín Nicolas" or "Miguel angel Pérez"
      nombre = toTitleCase(tokens.slice(1).join(' '));
      apellido = toTitleCase(tokens[0]);
    } else {
      // 4 or more
      nombre = toTitleCase(tokens.slice(0, 2).join(' '));
      apellido = toTitleCase(tokens.slice(2).join(' '));
    }
  }

  // Obra Social Mapping
  let osNombre = rawObraSocial || '';
  let osId = 'os-1';
  let planNombre = 'Particular';

  const osCheck = (rawObraSocial + ' ' + rawServicioEmergencia).toLowerCase();
  if (osCheck.includes('apross')) {
    osNombre = 'APROSS';
    osId = 'os-apross';
    planNombre = 'Directo / Adherentes';
  } else if (osCheck.includes('sancor')) {
    osNombre = 'Sancor Salud';
    osId = 'os-sancor';
    planNombre = 'Plan 500';
  } else if (osCheck.includes('osde')) {
    osNombre = 'OSDE';
    osId = 'os-2';
    planNombre = 'Plan 210';
  } else if (osCheck.includes('swiss') || osCheck.includes('smg')) {
    osNombre = 'Swiss Medical';
    osId = 'os-3';
    planNombre = 'SMG20';
  } else if (osCheck.includes('daspu')) {
    osNombre = 'DASPU';
    osId = 'os-daspu';
    planNombre = 'DASPU Universitario';
  } else if (osCheck.includes('galeno')) {
    osNombre = 'Galeno';
    osId = 'os-4';
    planNombre = 'Plata / Oro';
  } else if (osCheck.includes('medife') || osCheck.includes('medifé')) {
    osNombre = 'Medifé';
    osId = 'os-8';
    planNombre = 'Plata';
  } else if (osCheck.includes('cppc') || osCheck.includes('psicolog')) {
    osNombre = 'Colegio de Psicólogos (CPPC)';
    osId = 'os-cppc';
    planNombre = 'Convenio Colectivo';
  }

  // Emergency service check
  let poseeEmergencia = false;
  let emergenciaNombre = 'No posee';
  if (rawServicioEmergencia && !rawServicioEmergencia.toLowerCase().includes('no') && rawServicioEmergencia !== '-') {
    poseeEmergencia = true;
    emergenciaNombre = rawServicioEmergencia;
  }

  // Edad
  let edadNum = rawEdad ? parseInt(rawEdad.replace(/\D/g, '')) : null;

  const pacienteObj = {
    id: cleanDni ? `pac-${cleanDni}` : `pac-row-${index+1}-${Date.now()}`,
    clinica_id: 'clinica-1',
    dni: cleanDni || `S-DNI-${index+1}`,
    nombre: nombre || 'Sin Nombre',
    apellido: apellido || 'Sin Apellido',
    nombre_completo: cleanFullName,
    edad: edadNum || '',
    telefono_whatsapp: rawCelular ? cleanPhone(rawCelular) : '',
    email: email || '',
    domicilio: domicilio || '',
    con_quien_vive: conQuienVive || '',
    contactos_familiares: parseContactos(rawEmergenciaPersona),
    servicio_emergencia: {
      posee: poseeEmergencia,
      nombre: emergenciaNombre
    },
    obra_social_id: osId,
    obra_social_nombre: osNombre || 'Particular',
    plan_id: '',
    plan_nombre: planNombre,
    numero_afiliado: '',
    consentimiento_informado: {
      aceptado: true,
      fecha_firma: marcaTemporal || new Date().toISOString()
    },
    marca_temporal_registro: marcaTemporal || new Date().toISOString(),
    alergias: '',
    antecedentes: conQuienVive ? `Convivencia: ${conQuienVive}` : '',
    medicacion_habitual: '',
    activo: true
  };

  parsedPacientes.push(pacienteObj);
});

console.log(`\nSuccessfully parsed ${parsedPacientes.length} patient records!`);
console.log('Sample parsed patient #1:');
console.log(JSON.stringify(parsedPacientes[0], null, 2));

console.log('Sample parsed patient #2:');
console.log(JSON.stringify(parsedPacientes[1], null, 2));

// Save to scratch file
fs.writeFileSync('c:/Turnero/scratch/migrated_pacientes.json', JSON.stringify(parsedPacientes, null, 2));
console.log('\nWrote parsed patients to c:/Turnero/scratch/migrated_pacientes.json');
