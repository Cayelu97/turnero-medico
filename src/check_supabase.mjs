import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pmqcqvuxecibnxfkxrks.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWNxdnV4ZWNpYm54Zmt4cmtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI4NzkzMywiZXhwIjoyMTAxODYzOTMzfQ.j7pImUwMjXmAmDOjedinzQcctnWit5WhrLkQ8kQxQB0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function check() {
  console.log('--- Comprobando tablas en Supabase ---');
  const tables = [
    'profesionales',
    'profesional',
    'especialidades',
    'servicios',
    'consultorios',
    'obras_sociales',
    'planes',
    'nomenclador',
    'pacientes',
    'turnos',
    'clinicas',
    'centros'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(5);
      if (error) {
        console.log(`Tabla [${table}]: ERROR - ${error.message} (${error.code})`);
      } else {
        console.log(`Tabla [${table}]: OK - ${data.length} registros`, data);
      }
    } catch (e) {
      console.log(`Tabla [${table}]: EXCEPTION - ${e.message}`);
    }
  }
}

check();
