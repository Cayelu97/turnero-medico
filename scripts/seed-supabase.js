import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pmqcqvuxecibnxfkxrks.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWNxdnV4ZWNpYm54Zmt4cmtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjI4NzkzMywiZXhwIjoyMTAxODYzOTMzfQ.j7pImUwMjXmAmDOjedinzQcctnWit5WhrLkQ8kQxQB0';

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function seedCloudDatabase() {
  console.log('--- Poblating Supabase Cloud Database con UUIDs válidos ---');

  const clinicaId = '11111111-1111-1111-1111-111111111111';

  // 1. Clínica
  const { error: errClinica } = await client.from('clinicas').upsert({
    id: clinicaId,
    nombre: 'Centro Médico San Lucas',
    cuit: '30-71234567-9',
    direccion: 'Av. Santa Fe 2450, Piso 3, CABA',
    telefono: '+54 11 4821-9000',
    email: 'turnos@centrosanlucas.com.ar',
    mensaje_bienvenida: 'Bienvenido al turnero online de Centro Médico San Lucas. Seleccione especialidad, cobertura y horario.'
  });

  if (errClinica) console.error('Error insertando clínica:', errClinica.message);
  else console.log('✓ Clínica insertada en Supabase');

  // 2. Consultorios
  const consultorios = [
    { id: '22222222-2222-2222-2222-222222220001', clinica_id: clinicaId, nombre: 'Consultorio 1 - Cardiología', piso_ubicacion: 'Planta Baja', equipamiento: 'Electrocardiógrafo, Tensiómetro', activo: true },
    { id: '22222222-2222-2222-2222-222222220002', clinica_id: clinicaId, nombre: 'Consultorio 2 - Ecografía & Diagnóstico', piso_ubicacion: 'Piso 1 - Sala A', equipamiento: 'Ecógrafo Doppler Color', activo: true },
    { id: '22222222-2222-2222-2222-222222220003', clinica_id: clinicaId, nombre: 'Consultorio 3 - Pediatría', piso_ubicacion: 'Planta Baja', equipamiento: 'Balanza pediátrica, Tallímetro, Otoscopio', activo: true },
    { id: '22222222-2222-2222-2222-222222220004', clinica_id: clinicaId, nombre: 'Consultorio 4 - Traumatología', piso_ubicacion: 'Piso 1 - Sala B', equipamiento: 'Negatoscopio, Camilla articulada', activo: true },
    { id: '22222222-2222-2222-2222-222222220005', clinica_id: clinicaId, nombre: 'Consultorio 5 - Clínica Médica', piso_ubicacion: 'Planta Baja', equipamiento: 'Equipo diagnóstico general', activo: true }
  ];
  const { error: errCons } = await client.from('consultorios').upsert(consultorios);
  if (errCons) console.error('Error insertando consultorios:', errCons.message);
  else console.log('✓ Consultorios físicos insertados');

  // 3. Obras Sociales
  const obrasSociales = [
    { id: '33333333-3333-3333-3333-333333330001', clinica_id: clinicaId, nombre: 'Particular / Privado', sigla: 'PART', cuit: '', requiere_bono: false, requiere_autorizacion_previa: false, instrucciones_afiliado: 'Abono directo en recepción por efectivo, débito o transferencia.', activo: true },
    { id: '33333333-3333-3333-3333-333333330002', clinica_id: clinicaId, nombre: 'OSDE', sigla: 'OSDE', cuit: '30-54674125-3', requiere_bono: false, requiere_autorizacion_previa: false, instrucciones_afiliado: 'Presentar credencial digital de app OSDE y DNI.', activo: true },
    { id: '33333333-3333-3333-3333-333333330003', clinica_id: clinicaId, nombre: 'Swiss Medical', sigla: 'SMG', cuit: '30-67890123-4', requiere_bono: false, requiere_autorizacion_previa: false, instrucciones_afiliado: 'Validación por token o credencial digital.', activo: true },
    { id: '33333333-3333-3333-3333-333333330004', clinica_id: clinicaId, nombre: 'Galeno', sigla: 'GAL', cuit: '30-70809012-5', requiere_bono: false, requiere_autorizacion_previa: false, instrucciones_afiliado: 'Credencial física o digital activa y DNI.', activo: true },
    { id: '33333333-3333-3333-3333-333333330005', clinica_id: clinicaId, nombre: 'PAMI', sigla: 'PAMI', cuit: '30-52276392-2', requiere_bono: true, requiere_autorizacion_previa: true, instrucciones_afiliado: 'Presentar credencial y Orden Médica Electrónica (OME).', activo: true },
    { id: '33333333-3333-3333-3333-333333330006', clinica_id: clinicaId, nombre: 'IOMA', sigla: 'IOMA', cuit: '30-60000000-1', requiere_bono: true, requiere_autorizacion_previa: true, instrucciones_afiliado: 'Traer bono/token de consulta autorizado.', activo: true },
    { id: '33333333-3333-3333-3333-333333330007', clinica_id: clinicaId, nombre: 'OSECAC', sigla: 'OSECAC', cuit: '30-54728391-8', requiere_bono: true, requiere_autorizacion_previa: false, instrucciones_afiliado: 'Presentar carnet de afiliado y último recibo de sueldo.', activo: true },
    { id: '33333333-3333-3333-3333-333333330008', clinica_id: clinicaId, nombre: 'Medifé', sigla: 'MED', cuit: '30-68192301-7', requiere_bono: false, requiere_autorizacion_previa: false, instrucciones_afiliado: 'Credencial digital y autorización previa para estudios especiales.', activo: true }
  ];
  const { error: errOs } = await client.from('obras_sociales').upsert(obrasSociales);
  if (errOs) console.error('Error insertando obras sociales:', errOs.message);
  else console.log('✓ Obras Sociales insertadas');

  // 4. Planes
  const planes = [
    { id: '44444444-4444-4444-4444-444444440001', obra_social_id: '33333333-3333-3333-3333-333333330001', nombre_plan: 'Particular Estándar', codigo_plan: 'PART-STD', descripcion: 'Arancel de consulta particular', activo: true },
    { id: '44444444-4444-4444-4444-444444440002', obra_social_id: '33333333-3333-3333-3333-333333330002', nombre_plan: 'Plan 210', codigo_plan: 'OSDE-210', descripcion: 'Sin coseguro en consultas básicas', activo: true },
    { id: '44444444-4444-4444-4444-444444440003', obra_social_id: '33333333-3333-3333-3333-333333330002', nombre_plan: 'Plan 310', codigo_plan: 'OSDE-310', descripcion: 'Cobertura amplia sin coseguros', activo: true },
    { id: '44444444-4444-4444-4444-444444440004', obra_social_id: '33333333-3333-3333-3333-333333330002', nombre_plan: 'Plan 410 / 510', codigo_plan: 'OSDE-VIP', descripcion: 'Cobertura premium total', activo: true },
    { id: '44444444-4444-4444-4444-444444440005', obra_social_id: '33333333-3333-3333-3333-333333330003', nombre_plan: 'SMG20', codigo_plan: 'SMG-20', descripcion: 'Con copago en prácticas complejas', activo: true },
    { id: '44444444-4444-4444-4444-444444440006', obra_social_id: '33333333-3333-3333-3333-333333330003', nombre_plan: 'SMG30 / SMG50', codigo_plan: 'SMG-TOP', descripcion: 'Sin coseguros en consultas', activo: true },
    { id: '44444444-4444-4444-4444-444444440007', obra_social_id: '33333333-3333-3333-3333-333333330004', nombre_plan: 'Oro / Plata', codigo_plan: 'GAL-OP', descripcion: 'Cobertura general', activo: true },
    { id: '44444444-4444-4444-4444-444444440008', obra_social_id: '33333333-3333-3333-3333-333333330005', nombre_plan: 'PAMI Integral', codigo_plan: 'PAMI-INT', descripcion: 'Bono/Orden médica obligatoria', activo: true },
    { id: '44444444-4444-4444-4444-444444440009', obra_social_id: '33333333-3333-3333-3333-333333330006', nombre_plan: 'IOMA Obligatorio', codigo_plan: 'IOMA-OBL', descripcion: 'Bono categoría B/C según profesional', activo: true },
    { id: '44444444-4444-4444-4444-444444440010', obra_social_id: '33333333-3333-3333-3333-333333330007', nombre_plan: 'OSECAC General', codigo_plan: 'OSECAC-GEN', descripcion: 'Coseguro $1.500 en ciertas prácticas', activo: true }
  ];
  const { error: errPlanes } = await client.from('planes').upsert(planes);
  if (errPlanes) console.error('Error insertando planes:', errPlanes.message);
  else console.log('✓ Planes insertados');

  // 5. Nomenclador PMO
  const nomenclador = [
    { id: '55555555-5555-5555-5555-555555550001', clinica_id: clinicaId, codigo_pmo: '42.01.01', descripcion: 'Consulta Médica Especializada en Consultorio', duracion_minutos: 20, valor_particular: 18000, coseguro_defecto: 0, requiere_orden_medica: false, requiere_autorizacion: false, instrucciones_preparacion: 'Concurrir con estudios previos y medicación habitual.', activo: true },
    { id: '55555555-5555-5555-5555-555555550002', clinica_id: clinicaId, codigo_pmo: '42.01.02', descripcion: 'Consulta de Control / Seguimiento', duracion_minutos: 15, valor_particular: 12000, coseguro_defecto: 0, requiere_orden_medica: false, requiere_autorizacion: false, instrucciones_preparacion: 'Traer resultados de estudios solicitados.', activo: true },
    { id: '55555555-5555-5555-5555-555555550003', clinica_id: clinicaId, codigo_pmo: '18.01.01', descripcion: 'Ecografía Abdominal Completa', duracion_minutos: 30, valor_particular: 32000, coseguro_defecto: 4500, requiere_orden_medica: true, requiere_autorizacion: true, instrucciones_preparacion: 'Ayuno estricto de 8 horas. No tomar mate, café ni bebidas con gas.', activo: true },
    { id: '55555555-5555-5555-5555-555555550004', clinica_id: clinicaId, codigo_pmo: '18.01.06', descripcion: 'Ecocardiograma Doppler Color', duracion_minutos: 30, valor_particular: 42000, coseguro_defecto: 6000, requiere_orden_medica: true, requiere_autorizacion: true, instrucciones_preparacion: 'Concurrir con ropa cómoda de dos piezas.', activo: true },
    { id: '55555555-5555-5555-5555-555555550005', clinica_id: clinicaId, codigo_pmo: '17.01.01', descripcion: 'Electrocardiograma (ECG) con Informe', duracion_minutos: 15, valor_particular: 14000, coseguro_defecto: 2000, requiere_orden_medica: false, requiere_autorizacion: false, instrucciones_preparacion: 'No colocarse cremas en el torso.', activo: true },
    { id: '55555555-5555-5555-5555-555555550006', clinica_id: clinicaId, codigo_pmo: '25.01.01', descripcion: 'Sesión de Kinesiología y Fisioterapia', duracion_minutos: 40, valor_particular: 15000, coseguro_defecto: 2500, requiere_orden_medica: true, requiere_autorizacion: false, instrucciones_preparacion: 'Asistir con ropa deportiva cómoda y toalla personal.', activo: true }
  ];
  const { error: errNom } = await client.from('practicas_nomenclador').upsert(nomenclador);
  if (errNom) console.error('Error insertando nomenclador:', errNom.message);
  else console.log('✓ Nomenclador PMO insertado');

  // 6. Profesionales
  const profesionales = [
    { id: '66666666-6666-6666-6666-666666660001', clinica_id: clinicaId, nombre: 'Martín', apellido: 'Pérez Rossi', matricula_nacional: 'MN 114.829', matricula_provincial: 'MP 45.291', especialidad: 'Cardiología', email: 'mperez@centrosanlucas.com.ar', telefono: '11 5521-4411', duracion_turno_minutos: 20, max_sobreturnos_dia: 4, color_agenda: '#0284c7', atiende_particular: true, activo: true },
    { id: '66666666-6666-6666-6666-666666660002', clinica_id: clinicaId, nombre: 'Florencia', apellido: 'González Méndez', matricula_nacional: 'MN 132.540', matricula_provincial: 'MP 52.883', especialidad: 'Pediatría', email: 'fgonzalez@centrosanlucas.com.ar', telefono: '11 4490-1122', duracion_turno_minutos: 20, max_sobreturnos_dia: 3, color_agenda: '#ec4899', atiende_particular: true, activo: true },
    { id: '66666666-6666-6666-6666-666666660003', clinica_id: clinicaId, nombre: 'Gustavo', apellido: 'Albarracín', matricula_nacional: 'MN 98.412', matricula_provincial: 'MP 38.109', especialidad: 'Traumatología y Ortopedia', email: 'galbarracin@centrosanlucas.com.ar', telefono: '11 6382-9900', duracion_turno_minutos: 20, max_sobreturnos_dia: 5, color_agenda: '#f59e0b', atiende_particular: true, activo: true },
    { id: '66666666-6666-6666-6666-666666660004', clinica_id: clinicaId, nombre: 'Mariana', apellido: 'López Vega', matricula_nacional: 'MN 145.201', matricula_provincial: 'MP 56.402', especialidad: 'Diagnóstico por Imágenes', email: 'mlopez@centrosanlucas.com.ar', telefono: '11 7102-3344', duracion_turno_minutos: 30, max_sobreturnos_dia: 2, color_agenda: '#8b5cf6', atiende_particular: true, activo: true },
    { id: '66666666-6666-6666-6666-666666660005', clinica_id: clinicaId, nombre: 'Carlos', apellido: 'Villanueva', matricula_nacional: 'MN 105.670', matricula_provincial: 'MP 41.332', especialidad: 'Clínica Médica', email: 'cvillanueva@centrosanlucas.com.ar', telefono: '11 3912-7788', duracion_turno_minutos: 20, max_sobreturnos_dia: 4, color_agenda: '#10b981', atiende_particular: true, activo: true }
  ];
  const { error: errProf } = await client.from('profesionales').upsert(profesionales);
  if (errProf) console.error('Error insertando profesionales:', errProf.message);
  else console.log('✓ Profesionales médicos insertados');

  // 7. Horarios
  const horarios = [
    { id: '77777777-7777-7777-7777-777777770001', profesional_id: '66666666-6666-6666-6666-666666660001', consultorio_id: '22222222-2222-2222-2222-222222220001', dia_semana: 1, hora_inicio: '08:00', hora_fin: '13:00', duracion_slot_min: 20, activo: true },
    { id: '77777777-7777-7777-7777-777777770002', profesional_id: '66666666-6666-6666-6666-666666660001', consultorio_id: '22222222-2222-2222-2222-222222220001', dia_semana: 3, hora_inicio: '08:00', hora_fin: '13:00', duracion_slot_min: 20, activo: true },
    { id: '77777777-7777-7777-7777-777777770003', profesional_id: '66666666-6666-6666-6666-666666660001', consultorio_id: '22222222-2222-2222-2222-222222220001', dia_semana: 5, hora_inicio: '14:00', hora_fin: '18:00', duracion_slot_min: 20, activo: true },
    { id: '77777777-7777-7777-7777-777777770004', profesional_id: '66666666-6666-6666-6666-666666660002', consultorio_id: '22222222-2222-2222-2222-222222220003', dia_semana: 2, hora_inicio: '09:00', hora_fin: '14:00', duracion_slot_min: 20, activo: true },
    { id: '77777777-7777-7777-7777-777777770005', profesional_id: '66666666-6666-6666-6666-666666660002', consultorio_id: '22222222-2222-2222-2222-222222220003', dia_semana: 4, hora_inicio: '09:00', hora_fin: '14:00', duracion_slot_min: 20, activo: true },
    { id: '77777777-7777-7777-7777-777777770006', profesional_id: '66666666-6666-6666-6666-666666660003', consultorio_id: '22222222-2222-2222-2222-222222220004', dia_semana: 1, hora_inicio: '14:00', hora_fin: '19:00', duracion_slot_min: 20, activo: true },
    { id: '77777777-7777-7777-7777-777777770007', profesional_id: '66666666-6666-6666-6666-666666660003', consultorio_id: '22222222-2222-2222-2222-222222220004', dia_semana: 5, hora_inicio: '08:30', hora_fin: '13:30', duracion_slot_min: 20, activo: true }
  ];
  const { error: errHor } = await client.from('horarios_atencion').upsert(horarios);
  if (errHor) console.error('Error insertando horarios:', errHor.message);
  else console.log('✓ Horarios de atención insertados');

  console.log('\n[EXITO TOTAL] ¡Base de datos de Supabase poblada al 100%!');
}

seedCloudDatabase();
