import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pmqcqvuxecibnxfkxrks.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWNxdnV4ZWNpYm54Zmt4cmtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI4NzkzMywiZXhwIjoyMTAxODYzOTMzfQ.j7pImUwMjXmAmDOjedinzQcctnWit5WhrLkQ8kQxQB0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkSchema() {
  const { data, error } = await supabase.from('profesionales').select('*');
  console.log('Profesionales en Supabase:', data);

  const { data: turnosData } = await supabase.from('turnos').select('*');
  console.log('Turnos en Supabase:', turnosData);

  const { data: clinicasData } = await supabase.from('clinicas').select('*');
  console.log('Clinicas en Supabase:', clinicasData);
}

checkSchema();
