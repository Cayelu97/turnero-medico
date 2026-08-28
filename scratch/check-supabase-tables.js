import { createClient } from '@supabase/supabase-js';

const url = 'https://pmqcqvuxecibnxfkxrks.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWNxdnV4ZWNpYm54Zmt4cmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyODc5MzMsImV4cCI6MjEwMTg2MzkzM30.A_uDL8BbDAIf21gVmWa8Nu1gI2Oimxe2dJ991zVCJrI';
const sb = createClient(url, key);

const tables = [
  'turnos', 'profesionales', 'clinicas', 'horarios', 'agendas', 
  'pacientes', 'obras_sociales', 'servicios', 'consultorios', 'app_sync'
];

async function check() {
  for (const t of tables) {
    try {
      const { data, error } = await sb.from(t).select('*').limit(10);
      if (error) {
        console.log(`Table ${t}: ERROR ->`, error.message);
      } else {
        console.log(`Table ${t}: ${data.length} records found.`);
        if (data.length > 0) {
          console.log(`  Sample 1st item in ${t}:`, JSON.stringify(data[0]).slice(0, 150));
        }
      }
    } catch (e) {
      console.log(`Table ${t}: Exception ->`, e.message);
    }
  }
}

check();
