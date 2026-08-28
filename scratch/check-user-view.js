import { createClient } from '@supabase/supabase-js';

const url = 'https://pmqcqvuxecibnxfkxrks.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWNxdnV4ZWNpYm54Zmt4cmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyODc5MzMsImV4cCI6MjEwMTg2MzkzM30.A_uDL8BbDAIf21gVmWa8Nu1gI2Oimxe2dJ991zVCJrI';
const sb = createClient(url, key);

async function run() {
  const { data } = await sb.from('app_sync').select('*').eq('id', 'global_state').single();
  const payload = data.payload;

  const turnos = payload.mediturnos_turnos || [];
  const profesionales = payload.mediturnos_profesionales || [];
  const horarios = payload.mediturnos_horarios || [];
  const clinicas = payload.mediturnos_clinicas_list || [];

  console.log('Turnos count:', turnos.length);
  console.log('Turno:', turnos[0]);

  // Check what AgendaView does:
  const currentDate = '2026-09-04'; // From user screenshot
  const targetDate = new Date(currentDate + 'T00:00:00');
  const dayOfWeek = targetDate.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() + diffToMonday);
  
  const semanaDays = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  console.log('semanaDays:', semanaDays);

  const selectedWeeklyProfId = profesionales[0]?.id;
  console.log('selectedWeeklyProfId:', selectedWeeklyProfId, profesionales[0]?.nombre, profesionales[0]?.apellido);

  const turnosDelDiaCount = turnos.filter(t => t.fecha === '2026-08-31' && (!selectedWeeklyProfId || t.profesional_id === selectedWeeklyProfId) && t.estado !== 'CANCELADO').length;
  console.log('turnos on 2026-08-31 count:', turnosDelDiaCount);

  // Check Horarios on Monday (dia_semana: 1):
  const horariosDia = horarios.filter(h => h.profesional_id === selectedWeeklyProfId && Number(h.dia_semana) === 1);
  console.log('Horarios on Monday for prof:', horariosDia);
}

run();
