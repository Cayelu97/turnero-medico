import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pmqcqvuxecibnxfkxrks.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWNxdnV4ZWNpYm54Zmt4cmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyODc5MzMsImV4cCI6MjEwMTg2MzkzM30.A_uDL8BbDAIf21gVmWa8Nu1gI2Oimxe2dJ991zVCJrI';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWNxdnV4ZWNpYm54Zmt4cmtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI4NzkzMywiZXhwIjoyMTAxODYzOTMzfQ.j7pImUwMjXmAmDOjedinzQcctnWit5WhrLkQ8kQxQB0';

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function testConnection() {
  console.log('--- Probando conexión a Supabase ---');
  try {
    const { data, error } = await client.from('clinicas').select('*');
    if (error) {
      console.log('Respuesta de Supabase:', error.message);
      if (error.code === '42P01' || error.message.includes('relation "public.clinicas" does not exist') || error.message.includes('does not exist')) {
        console.log('\n[INFO] La conexión a tu proyecto Supabase funciona al 100%, pero aún falta ejecutar el script SQL para crear las tablas.');
      }
    } else {
      console.log('\n[SUCCESS] ¡Tablas detectadas en Supabase!', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testConnection();
