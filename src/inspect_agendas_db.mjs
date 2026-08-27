import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pmqcqvuxecibnxfkxrks.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWNxdnV4ZWNpYm54Zmt4cmtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI4NzkzMywiZXhwIjoyMTAxODYzOTMzfQ.j7pImUwMjXmAmDOjedinzQcctnWit5WhrLkQ8kQxQB0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function inspectAgendasAndHorarios() {
  const { data } = await supabase.from('app_sync').select('*').eq('id', 'global_state').single();
  if (data && data.payload) {
    const p = data.payload;
    console.log('--- PROFESIONALES ---');
    console.log(JSON.stringify((p.mediturnos_profesionales || []).map(pr => ({ id: pr.id, nombre: pr.nombre, apellido: pr.apellido, sedes_ids: pr.sedes_ids })), null, 2));

    console.log('--- CLINICAS / SEDES ---');
    console.log(JSON.stringify((p.mediturnos_clinicas || []).map(c => ({ id: c.id, nombre: c.nombre })), null, 2));

    console.log('--- AGENDAS ---');
    console.log(JSON.stringify(p.mediturnos_agendas || [], null, 2));

    console.log('--- HORARIOS ---');
    console.log(JSON.stringify(p.mediturnos_horarios || [], null, 2));
  }
}

inspectAgendasAndHorarios();
