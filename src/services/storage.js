// ==============================================================================
// GESTOR DE ALMACENAMIENTO Y LÓGICA DE NEGOCIO MULTI-TENANT (LOCAL & SUPABASE READY)
// ==============================================================================
import { createClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  CLINICA: 'mediturnos_clinica',
  CLINICAS_LIST: 'mediturnos_clinicas_list',
  CURRENT_USER: 'mediturnos_current_user',
  ESPECIALIDADES: 'mediturnos_especialidades',
  SERVICIOS: 'mediturnos_servicios',
  CONSULTORIOS: 'mediturnos_consultorios',
  OBRAS_SOCIALES: 'mediturnos_obras_sociales',
  PLANES: 'mediturnos_planes',
  NOMENCLADOR: 'mediturnos_nomenclador',
  CONVENIOS_COSEGUROS: 'mediturnos_convenios_coseguros',
  PROFESIONALES: 'mediturnos_profesionales',
  HORARIOS: 'mediturnos_horarios',
  BLOQUEOS: 'mediturnos_bloqueos',
  PACIENTES: 'mediturnos_pacientes',
  TURNOS: 'mediturnos_turnos',
  ATENCIONES_HCE: 'mediturnos_atenciones_hce',
  MOTIVOS: 'mediturnos_motivos',
  SUPABASE_CONFIG: 'mediturnos_supabase_config',
  TV_CALLS: 'mediturnos_tv_calls'
};

// Motivos Oficiales de Cancelación y Reprogramación de Turnos
export const INITIAL_MOTIVOS = [
  // Cancelación
  { id: 'mot-1', tipo: 'CANCELACION', codigo: 'PAC_SOLICITUD', descripcion: 'Solicitado por el paciente (incompatibilidad de horario / viaje)', aplica_a: 'AMBOS', activo: true },
  { id: 'mot-2', tipo: 'CANCELACION', codigo: 'MED_AUSENCIA', descripcion: 'Ausencia o indisposición del profesional (enfermedad / congreso)', aplica_a: 'AMBOS', activo: true },
  { id: 'mot-3', tipo: 'CANCELACION', codigo: 'DOC_FALTANTE', descripcion: 'Falta de orden médica o autorización de Obra Social', aplica_a: 'SECRETARIA', activo: true },
  { id: 'mot-4', tipo: 'CANCELACION', codigo: 'DUPLICADO', descripcion: 'Turno duplicado o emitido por error de carga', aplica_a: 'SECRETARIA', activo: true },
  { id: 'mot-5', tipo: 'CANCELACION', codigo: 'FUERZA_MAYOR', descripcion: 'Causa de fuerza mayor / corte de suministro / asueto institucional', aplica_a: 'SECRETARIA', activo: true },
  { id: 'mot-6', tipo: 'CANCELACION', codigo: 'PAC_MEJORIA', descripcion: 'Paciente refiere mejoría o resolución del cuadro', aplica_a: 'PACIENTE', activo: true },

  // Reprogramación
  { id: 'mot-7', tipo: 'REPROGRAMACION', codigo: 'PAC_CAMBIO_FECHA', descripcion: 'Paciente solicita cambio de día u horario', aplica_a: 'AMBOS', activo: true },
  { id: 'mot-8', tipo: 'REPROGRAMACION', codigo: 'MED_CIRUGIA_GUARDIA', descripcion: 'Médico convocado a urgencia / quirófano / guardia', aplica_a: 'SECRETARIA', activo: true },
  { id: 'mot-9', tipo: 'REPROGRAMACION', codigo: 'ADELANTO_DISPONIBILIDAD', descripcion: 'Adelanto de turno por disponibilidad anticipada de agenda', aplica_a: 'SECRETARIA', activo: true },
  { id: 'mot-10', tipo: 'REPROGRAMACION', codigo: 'CAMBIO_PROFESIONAL', descripcion: 'Derivación / cambio a otro profesional de la misma especialidad', aplica_a: 'SECRETARIA', activo: true },
  { id: 'mot-11', tipo: 'REPROGRAMACION', codigo: 'REAJUSTE_CONSULTORIO', descripcion: 'Reajuste operativo de consultorio o equipamiento médico', aplica_a: 'SECRETARIA', activo: true }
];

// Especialidades Médicas Estándar en Argentina
export const INITIAL_ESPECIALIDADES = [
  { id: 'esp-1', nombre: 'Cardiología', codigo: 'CARD', descripcion: 'Diagnóstico y tratamiento de afecciones cardíacas y vasculares', activa: true },
  { id: 'esp-2', nombre: 'Pediatría', codigo: 'PED', descripcion: 'Atención médica integral desde el nacimiento hasta la adolescencia', activa: true },
  { id: 'esp-3', nombre: 'Clínica Médica / Medicina General', codigo: 'CMED', descripcion: 'Atención primaria, diagnóstico integral y prevención en adultos', activa: true },
  { id: 'esp-4', nombre: 'Traumatología y Ortopedia', codigo: 'TRAUM', descripcion: 'Lesiones óseas, articulares, musculares y rehabilitación', activa: true },
  { id: 'esp-5', nombre: 'Ginecología y Obstetricia', codigo: 'GINOB', descripcion: 'Salud integral de la mujer, control prenatal y salud reproductiva', activa: true },
  { id: 'esp-6', nombre: 'Dermatología', codigo: 'DERM', descripcion: 'Enfermedades de la piel, cabello y uñas. Prevención de lesiones', activa: true },
  { id: 'esp-7', nombre: 'Oftalmología', codigo: 'OFT', descripcion: 'Salud ocular, agudeza visual, fondo de ojo y cirugías', activa: true },
  { id: 'esp-8', nombre: 'Neurología', codigo: 'NEUR', descripcion: 'Trastornos del sistema nervioso central y periférico', activa: true },
  { id: 'esp-9', nombre: 'Gastroenterología', codigo: 'GASTR', descripcion: 'Patologías del aparato digestivo, hígado y vías biliares', activa: true },
  { id: 'esp-10', nombre: 'Endocrinología y Nutrición', codigo: 'ENDO', descripcion: 'Trastornos hormonales, tiroides, diabetes y metabolismo', activa: true },
  { id: 'esp-11', nombre: 'Otorrinolaringología (ORL)', codigo: 'ORL', descripcion: 'Afecciones de oído, nariz, garganta y cuerdas vocales', activa: true },
  { id: 'esp-12', nombre: 'Urología', codigo: 'UROL', descripcion: 'Aparato urinario y reproductor masculino, litiasis y próstata', activa: true },
  { id: 'esp-13', nombre: 'Psiquiatría y Salud Mental', codigo: 'PSIQ', descripcion: 'Evaluación y tratamiento integral de la salud mental', activa: true },
  { id: 'esp-14', nombre: 'Diagnóstico por Imágenes / Ecografía', codigo: 'IMAG', descripcion: 'Ecografía general, Doppler, radiología y resonancia', activa: true },
  { id: 'esp-15', nombre: 'Kinesiología y Fisioterapia', codigo: 'KINE', descripcion: 'Rehabilitación motora, fisioterapia respiratoria y traumatológica', activa: true },
  { id: 'esp-16', nombre: 'Odontología', codigo: 'ODONT', descripcion: 'Salud bucal, prevención, operatoria y prótesis', activa: true },
  { id: 'esp-17', nombre: 'Neumonología', codigo: 'NEUM', descripcion: 'Enfermedades respiratorias, asma, EPOC y función pulmonar', activa: true },
  { id: 'esp-18', nombre: 'Alergia e Inmunología', codigo: 'ALERG', descripcion: 'Alergias respiratorias, cutáneas, alimentarias e inmunidad', activa: true },
  { id: 'esp-19', nombre: 'Reumatología', codigo: 'REUM', descripcion: 'Artritis, artrosis, lupus y enfermedades autoinmunes', activa: true },
  { id: 'esp-20', nombre: 'Flebología y Cirugía Vascular', codigo: 'FLEB', descripcion: 'Tratamiento de várices, telangiectasias y patología venosa', activa: true }
];

// Servicios Médicos (Líneas de Atención por Especialidad)
export const INITIAL_SERVICIOS = [
  {
    id: 'serv-1',
    clinica_id: 'clinica-1',
    nombre: 'Consultas Cardiológicas',
    especialidad_id: 'esp-1',
    tipo: 'CONSULTA',
    duracion_default_min: 20,
    color_etiqueta: '#0284c7',
    practicas_ids: ['nom-1', 'nom-2', 'nom-5'],
    practica_default_id: 'nom-1', // Código sugerido por defecto (Consulta Especializada)
    descripcion: 'Consultas médicas cardiológicas de primera vez y controles de rutina',
    activo: true
  },
  {
    id: 'serv-2',
    clinica_id: 'clinica-1',
    nombre: 'Estudios y Prácticas Cardiológicas',
    especialidad_id: 'esp-1',
    tipo: 'ESTUDIO_PRACTICA',
    duracion_default_min: 30,
    color_etiqueta: '#7c3aed',
    practicas_ids: ['nom-4', 'nom-5'],
    practica_default_id: 'nom-4', // Código sugerido por defecto (Ecocardiograma Doppler)
    descripcion: 'Ecocardiograma Doppler Color, Electrocardiograma (ECG) y Holter',
    activo: true
  },
  {
    id: 'serv-3',
    clinica_id: 'clinica-1',
    nombre: 'Consultas Pediátricas y Control Niño Sano',
    especialidad_id: 'esp-2',
    tipo: 'CONSULTA',
    duracion_default_min: 20,
    color_etiqueta: '#ec4899',
    practicas_ids: ['nom-1', 'nom-2'],
    practica_default_id: 'nom-1',
    descripcion: 'Atención pediátrica, control de crecimiento, desarrollo y esquemas de vacunación',
    activo: true
  },
  {
    id: 'serv-4',
    clinica_id: 'clinica-1',
    nombre: 'Consultas de Traumatología General',
    especialidad_id: 'esp-4',
    tipo: 'CONSULTA',
    duracion_default_min: 20,
    color_etiqueta: '#f59e0b',
    practicas_ids: ['nom-1', 'nom-2'],
    practica_default_id: 'nom-1',
    descripcion: 'Evaluación clínica de patologías osteoarticulares, columna y miembros',
    activo: true
  },
  {
    id: 'serv-5',
    clinica_id: 'clinica-1',
    nombre: 'Infiltraciones y Procedimientos Traumatológicos',
    especialidad_id: 'esp-4',
    tipo: 'PROCEDIMIENTO',
    duracion_default_min: 30,
    color_etiqueta: '#d97706',
    practicas_ids: ['nom-1'],
    practica_default_id: 'nom-1',
    descripcion: 'Infiltraciones articulares ecoguiadas, colocación de férulas y curaciones',
    activo: true
  },
  {
    id: 'serv-6',
    clinica_id: 'clinica-1',
    nombre: 'Ecografía General y Diagnóstico por Imágenes',
    especialidad_id: 'esp-14',
    tipo: 'ESTUDIO_PRACTICA',
    duracion_default_min: 30,
    color_etiqueta: '#8b5cf6',
    practicas_ids: ['nom-3', 'nom-4'],
    practica_default_id: 'nom-3', // Código sugerido por defecto (Ecografía Abdominal)
    descripcion: 'Ecografía abdominal, ginecológica, tiroidea y partes blandas',
    activo: true
  },
  {
    id: 'serv-7',
    clinica_id: 'clinica-1',
    nombre: 'Consultas de Clínica Médica General',
    especialidad_id: 'esp-3',
    tipo: 'CONSULTA',
    duracion_default_min: 20,
    color_etiqueta: '#10b981',
    practicas_ids: ['nom-1', 'nom-2'],
    practica_default_id: 'nom-1',
    descripcion: 'Atención médica integral del adulto y chequeos preventivos de salud',
    activo: true
  },
  {
    id: 'serv-8',
    clinica_id: 'clinica-1',
    nombre: 'Kinesiología y Fisioterapia',
    especialidad_id: 'esp-15',
    tipo: 'PROCEDIMIENTO',
    duracion_default_min: 40,
    color_etiqueta: '#06b6d4',
    practicas_ids: ['nom-6'],
    practica_default_id: 'nom-6', // Código sugerido por defecto (Sesión Kinesio)
    descripcion: 'Rehabilitación motora, fisioterapia respiratoria y traumatológica',
    activo: true
  }
];

// Clínicas iniciales (Multi-Tenant)
export const INITIAL_CLINICAS = [
  {
    id: 'clinica-1',
    nombre: 'Centro Médico San Lucas',
    cuit: '30-71234567-9',
    direccion: 'Av. Santa Fe 2450, Piso 3, CABA',
    telefono: '+54 11 4821-9000',
    whatsapp: '+54 9 11 4821-9000',
    email: 'turnos@centrosanlucas.com.ar',
    mensaje_bienvenida: 'Bienvenido al turnero online de Centro Médico San Lucas. Seleccione especialidad, cobertura y horario.',
    color_primario: '#0284c7',
    activa: true
  },
  {
    id: 'clinica-2',
    nombre: 'Policonsultorios Médicos Belgrano',
    cuit: '30-79812345-1',
    direccion: 'Av. Cabildo 1850, Belgrano, CABA',
    telefono: '+54 11 4781-4400',
    whatsapp: '+54 9 11 4781-4400',
    email: 'contacto@consultoriosbelgrano.com.ar',
    mensaje_bienvenida: 'Policonsultorios Belgrano - Especialidades médicas y estudios de diagnóstico.',
    color_primario: '#0d9488',
    activa: true
  }
];

// Usuarios y Roles de demostración
export const INITIAL_USERS = [
  { id: 'usr-1', nombre: 'Administrador General', email: 'admin@mediturnos.com', rol: 'SUPERADMIN', clinica_id: null },
  { id: 'usr-2', nombre: 'Secretaría San Lucas', email: 'recepcion@centrosanlucas.com.ar', rol: 'SECRETARIA', clinica_id: 'clinica-1' },
  { id: 'usr-3', nombre: 'Dr. Martín Pérez Rossi', email: 'mperez@centrosanlucas.com.ar', rol: 'PROFESIONAL', clinica_id: 'clinica-1', profesional_id: 'prof-1' },
  { id: 'usr-4', nombre: 'Secretaría Belgrano', email: 'recepcion@consultoriosbelgrano.com.ar', rol: 'SECRETARIA', clinica_id: 'clinica-2' }
];

export const INITIAL_DATA = {
  clinica: INITIAL_CLINICAS[0],
  especialidades: INITIAL_ESPECIALIDADES,
  servicios: INITIAL_SERVICIOS,
  consultorios: [
    { id: 'c-1', clinica_id: 'clinica-1', nombre: 'Consultorio 1 - Cardiología', piso_ubicacion: 'Planta Baja', equipamiento: 'Electrocardiógrafo, Tensiómetro', activo: true },
    { id: 'c-2', clinica_id: 'clinica-1', nombre: 'Consultorio 2 - Diagnóstico por Imágenes & Ecografía', piso_ubicacion: 'Piso 1 - Sala A', equipamiento: 'Ecógrafo Doppler Color', activo: true },
    { id: 'c-3', clinica_id: 'clinica-1', nombre: 'Consultorio 3 - Pediatría', piso_ubicacion: 'Planta Baja', equipamiento: 'Balanza pediátrica, Tallímetro, Otoscopio', activo: true },
    { id: 'c-4', clinica_id: 'clinica-1', nombre: 'Consultorio 4 - Traumatología', piso_ubicacion: 'Piso 1 - Sala B', equipamiento: 'Negatoscopio, Camilla articulada', activo: true },
    { id: 'c-5', clinica_id: 'clinica-1', nombre: 'Consultorio 5 - Clínica Médica', piso_ubicacion: 'Planta Baja', equipamiento: 'Equipo diagnóstico general', activo: true },
    // Consultorios para Clínica 2 (Belgrano)
    { id: 'c-201', clinica_id: 'clinica-2', nombre: 'Consultorio Belgrano 1', piso_ubicacion: 'PB', equipamiento: 'Camilla, Tensiómetro', activo: true },
    { id: 'c-202', clinica_id: 'clinica-2', nombre: 'Consultorio Belgrano 2 - Ginecología', piso_ubicacion: 'Piso 1', equipamiento: 'Colposcopio, Camilla ginecológica', activo: true }
  ],
  obras_sociales: [
    { id: 'os-1', clinica_id: 'clinica-1', nombre: 'Particular / Privado', sigla: 'PART', cuit: '', requiere_bono: false, requiere_autorizacion: false, instrucciones: 'Abono en recepción al momento de la atención.', activo: true },
    { id: 'os-2', clinica_id: 'clinica-1', nombre: 'OSDE', sigla: 'OSDE', cuit: '30-54674125-3', requiere_bono: false, requiere_autorizacion: false, instrucciones: 'Presentar credencial digital activa y DNI.', activo: true },
    { id: 'os-3', clinica_id: 'clinica-1', nombre: 'Swiss Medical', sigla: 'SMG', cuit: '30-67890123-4', requiere_bono: false, requiere_autorizacion: false, instrucciones: 'Validación por token digital en recepción.', activo: true },
    { id: 'os-4', clinica_id: 'clinica-1', nombre: 'Galeno', sigla: 'GAL', cuit: '30-70809012-5', requiere_bono: false, requiere_autorizacion: false, instrucciones: 'Presentar credencial digital o física.', activo: true },
    { id: 'os-5', clinica_id: 'clinica-1', nombre: 'PAMI', sigla: 'PAMI', cuit: '30-52276392-2', requiere_bono: true, requiere_autorizacion: true, instrucciones: 'Presentar carnet PAMI y Orden Médica Electrónica (OME).', activo: true },
    { id: 'os-6', clinica_id: 'clinica-1', nombre: 'IOMA', sigla: 'IOMA', cuit: '30-60000000-1', requiere_bono: true, requiere_autorizacion: true, instrucciones: 'Traer bono/token de consulta autorizado impreso o digital.', activo: true },
    { id: 'os-7', clinica_id: 'clinica-1', nombre: 'OSECAC', sigla: 'OSECAC', cuit: '30-54728391-8', requiere_bono: true, requiere_autorizacion: false, instrucciones: 'Carnet de afiliado y último recibo de sueldo.', activo: true },
    { id: 'os-8', clinica_id: 'clinica-1', nombre: 'Medifé', sigla: 'MED', cuit: '30-68192301-7', requiere_bono: false, requiere_autorizacion: false, instrucciones: 'Credencial digital y autorización previa para estudios especiales.', activo: true }
  ],
  planes: [
    { id: 'pl-1', obra_social_id: 'os-1', nombre_plan: 'Particular Estándar', codigo_plan: 'PART-STD', descripcion: 'Arancel de consulta particular', activo: true },
    { id: 'pl-2', obra_social_id: 'os-2', nombre_plan: 'Plan 210', codigo_plan: 'OSDE-210', descripcion: 'Cobertura directa sin coseguro', activo: true },
    { id: 'pl-3', obra_social_id: 'os-2', nombre_plan: 'Plan 310', codigo_plan: 'OSDE-310', descripcion: 'Cobertura amplia', activo: true },
    { id: 'pl-4', obra_social_id: 'os-2', nombre_plan: 'Plan 410 / 510', codigo_plan: 'OSDE-VIP', descripcion: 'Cobertura premium total', activo: true },
    { id: 'pl-5', obra_social_id: 'os-3', nombre_plan: 'SMG20', codigo_plan: 'SMG-20', descripcion: 'Con copago en ciertas prácticas', activo: true },
    { id: 'pl-6', obra_social_id: 'os-3', nombre_plan: 'SMG30 / SMG50', codigo_plan: 'SMG-TOP', descripcion: 'Sin coseguros en consultas', activo: true },
    { id: 'pl-7', obra_social_id: 'os-4', nombre_plan: 'Plata / Oro', codigo_plan: 'GAL-PO', descripcion: 'Cobertura integral', activo: true },
    { id: 'pl-8', obra_social_id: 'os-5', nombre_plan: 'PAMI Integral', codigo_plan: 'PAMI-INT', descripcion: 'Requiere OME', activo: true },
    { id: 'pl-9', obra_social_id: 'os-6', nombre_plan: 'IOMA Obligatorio', codigo_plan: 'IOMA-OBL', descripcion: 'Bono categoría B/C', activo: true },
    { id: 'pl-10', obra_social_id: 'os-7', nombre_plan: 'OSECAC General', codigo_plan: 'OSECAC-GEN', descripcion: 'Coseguro según práctica', activo: true },
    { id: 'pl-11', obra_social_id: 'os-8', nombre_plan: 'Plan Bronce / Plata', codigo_plan: 'MED-BP', descripcion: 'Cobertura base', activo: true }
  ],
  nomenclador: [
    { id: 'nom-1', clinica_id: 'clinica-1', codigo_pmo: '42.01.01', descripcion: 'Consulta Médica Especializada en Consultorio', duracion_minutos: 20, valor_particular: 18000, coseguro_defecto: 0, requiere_orden: false, requiere_autorizacion: false, instrucciones_preparacion: 'Concurrir con estudios previos y medicación habitual.', activo: true },
    { id: 'nom-2', clinica_id: 'clinica-1', codigo_pmo: '42.01.02', descripcion: 'Consulta de Control / Seguimiento', duracion_minutos: 15, valor_particular: 12000, coseguro_defecto: 0, requiere_orden: false, requiere_autorizacion: false, instrucciones_preparacion: 'Traer resultados de estudios solicitados.', activo: true },
    { id: 'nom-3', clinica_id: 'clinica-1', codigo_pmo: '18.01.01', descripcion: 'Ecografía Abdominal Completa', duracion_minutos: 30, valor_particular: 32000, coseguro_defecto: 4500, requiere_orden: true, requiere_autorizacion: true, instrucciones_preparacion: 'Ayuno estricto de 8 horas. No tomar mate, café ni bebidas con gas.', activo: true },
    { id: 'nom-4', clinica_id: 'clinica-1', codigo_pmo: '18.01.06', descripcion: 'Ecocardiograma Doppler Color', duracion_minutos: 30, valor_particular: 42000, coseguro_defecto: 6000, requiere_orden: true, requiere_autorizacion: true, instrucciones_preparacion: 'Concurrir con ropa cómoda de dos piezas.', activo: true },
    { id: 'nom-5', clinica_id: 'clinica-1', codigo_pmo: '17.01.01', descripcion: 'Electrocardiograma (ECG) con Informe', duracion_minutos: 15, valor_particular: 14000, coseguro_defecto: 2000, requiere_orden: false, requiere_autorizacion: false, instrucciones_preparacion: 'No colocarse cremas corporales en el torso.', activo: true },
    { id: 'nom-6', clinica_id: 'clinica-1', codigo_pmo: '25.01.01', descripcion: 'Sesión de Kinesiología y Fisioterapia', duracion_minutos: 40, valor_particular: 15000, coseguro_defecto: 2500, requiere_orden: true, requiere_autorizacion: false, instrucciones_preparacion: 'Asistir con ropa deportiva cómoda y toalla de mano.', activo: true }
  ],
  convenios_coseguros: [
    { id: 'cov-1', plan_id: 'pl-5', practica_id: 'nom-3', monto_coseguro: 3000, cubierto_100: false, observaciones: 'Coseguro reducido para SMG20' },
    { id: 'cov-2', plan_id: 'pl-5', practica_id: 'nom-4', monto_coseguro: 4500, cubierto_100: false, observaciones: 'Requiere bono digital' },
    { id: 'cov-3', plan_id: 'pl-9', practica_id: 'nom-1', monto_coseguro: 2500, cubierto_100: false, observaciones: 'Bono consulta categoría C' }
  ],
  profesionales: [
    {
      id: 'prof-1',
      clinica_id: 'clinica-1',
      nombre: 'Martín',
      apellido: 'Pérez Rossi',
      matricula_nacional: 'MN 114.829',
      matricula_provincial: 'MP 45.291',
      especialidad: 'Cardiología',
      especialidad_id: 'esp-1',
      servicios_ids: ['serv-1', 'serv-2'], // Consultas y Prácticas
      email: 'mperez@centrosanlucas.com.ar',
      telefono: '11 5521-4411',
      duracion_turno_minutos: 20,
      max_sobreturnos_dia: 4,
      color_agenda: '#0284c7',
      obras_sociales_ids: ['os-1', 'os-2', 'os-3', 'os-4', 'os-5', 'os-6', 'os-7', 'os-8'],
      atiende_particular: true,
      activo: true
    }
  ],
  horarios: [
    // Dr. Pérez Rossi: Lunes y Viernes Consultas (Consultorio 1), Miércoles Estudios Ecocardiograma (Consultorio 2)
    { id: 'h-1', profesional_id: 'prof-1', servicio_id: 'serv-1', consultorio_id: 'c-1', dia_semana: 1, hora_inicio: '08:00', hora_fin: '13:00', duracion_slot_min: 20, activo: true },
    { id: 'h-2', profesional_id: 'prof-1', servicio_id: 'serv-2', consultorio_id: 'c-2', dia_semana: 3, hora_inicio: '08:00', hora_fin: '13:00', duracion_slot_min: 30, activo: true },
    { id: 'h-3', profesional_id: 'prof-1', servicio_id: 'serv-1', consultorio_id: 'c-1', dia_semana: 5, hora_inicio: '14:00', hora_fin: '18:00', duracion_slot_min: 20, activo: true }
  ],
  bloqueos: [
    { id: 'b-1', clinica_id: 'clinica-1', profesional_id: null, consultorio_id: null, tipo: 'FERIADO_NACIONAL', fecha_inicio: '2026-01-01', fecha_fin: '2026-01-01', motivo: 'Año Nuevo' },
    { id: 'b-2', clinica_id: 'clinica-1', profesional_id: null, consultorio_id: null, tipo: 'FERIADO_NACIONAL', fecha_inicio: '2026-05-01', fecha_fin: '2026-05-01', motivo: 'Día del Trabajador' },
    { id: 'b-3', clinica_id: 'clinica-1', profesional_id: null, consultorio_id: null, tipo: 'FERIADO_NACIONAL', fecha_inicio: '2026-05-25', fecha_fin: '2026-05-25', motivo: 'Revolución de Mayo' },
    { id: 'b-4', clinica_id: 'clinica-1', profesional_id: null, consultorio_id: null, tipo: 'FERIADO_NACIONAL', fecha_inicio: '2026-07-09', fecha_fin: '2026-07-09', motivo: 'Día de la Independencia' },
    { id: 'b-5', clinica_id: 'clinica-1', profesional_id: null, consultorio_id: null, tipo: 'FERIADO_NACIONAL', fecha_inicio: '2026-12-25', fecha_fin: '2026-12-25', motivo: 'Navidad' }
  ],
  pacientes: [
    {
      id: 'pac-1',
      clinica_id: 'clinica-1',
      dni: '35890123',
      nombre: 'Lucas',
      apellido: 'Fernández',
      telefono_whatsapp: '+54 9 11 5500-1122',
      email: 'lucas.fernandez@gmail.com',
      obra_social_id: 'os-2',
      plan_id: 'pl-2',
      numero_afiliado: '1098492019/01',
      alergias: 'Penicilina, Sulfas',
      antecedentes: 'Hipertensión arterial diagnosticada en 2021',
      medicacion_habitual: 'Losartán 50mg/día'
    }
  ],
  turnos: []
};

// Generador de Turnos Iniciales: Limpio para pruebas reales
export function generateInitialSampleTurnos() {
  return [];
}

// Inicializador de LocalStorage
export const initLocalStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.CLINICAS_LIST)) {
    localStorage.setItem(STORAGE_KEYS.CLINICAS_LIST, JSON.stringify(INITIAL_CLINICAS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLINICA)) {
    localStorage.setItem(STORAGE_KEYS.CLINICA, JSON.stringify(INITIAL_CLINICAS[0]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[1]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ESPECIALIDADES)) {
    localStorage.setItem(STORAGE_KEYS.ESPECIALIDADES, JSON.stringify(INITIAL_ESPECIALIDADES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SERVICIOS)) {
    localStorage.setItem(STORAGE_KEYS.SERVICIOS, JSON.stringify(INITIAL_SERVICIOS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONSULTORIOS)) {
    localStorage.setItem(STORAGE_KEYS.CONSULTORIOS, JSON.stringify(INITIAL_DATA.consultorios));
  }
  if (!localStorage.getItem(STORAGE_KEYS.OBRAS_SOCIALES)) {
    localStorage.setItem(STORAGE_KEYS.OBRAS_SOCIALES, JSON.stringify(INITIAL_DATA.obras_sociales));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PLANES)) {
    localStorage.setItem(STORAGE_KEYS.PLANES, JSON.stringify(INITIAL_DATA.planes));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOMENCLADOR)) {
    localStorage.setItem(STORAGE_KEYS.NOMENCLADOR, JSON.stringify(INITIAL_DATA.nomenclador));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONVENIOS_COSEGUROS)) {
    localStorage.setItem(STORAGE_KEYS.CONVENIOS_COSEGUROS, JSON.stringify(INITIAL_DATA.convenios_coseguros));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROFESIONALES)) {
    localStorage.setItem(STORAGE_KEYS.PROFESIONALES, JSON.stringify(INITIAL_DATA.profesionales));
  }
  if (!localStorage.getItem(STORAGE_KEYS.HORARIOS)) {
    localStorage.setItem(STORAGE_KEYS.HORARIOS, JSON.stringify(INITIAL_DATA.horarios));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BLOQUEOS)) {
    localStorage.setItem(STORAGE_KEYS.BLOQUEOS, JSON.stringify(INITIAL_DATA.bloqueos));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PACIENTES)) {
    localStorage.setItem(STORAGE_KEYS.PACIENTES, JSON.stringify(INITIAL_DATA.pacientes));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TURNOS)) {
    localStorage.setItem(STORAGE_KEYS.TURNOS, JSON.stringify(generateInitialSampleTurnos()));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATENCIONES_HCE)) {
    localStorage.setItem(STORAGE_KEYS.ATENCIONES_HCE, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MOTIVOS)) {
    localStorage.setItem(STORAGE_KEYS.MOTIVOS, JSON.stringify(INITIAL_MOTIVOS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TV_CALLS)) {
    localStorage.setItem(STORAGE_KEYS.TV_CALLS, JSON.stringify([]));
  }
};

export const StorageService = {
  // SUPABASE CONFIG
  getSupabaseConfig: () => {
    try {
      const cfg = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
      const parsed = cfg ? JSON.parse(cfg) : {};
      const url = parsed.url || import.meta.env.VITE_SUPABASE_URL || 'https://pmqcqvuxecibnxfkxrks.supabase.co';
      const anonKey = parsed.anonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      return { url, anonKey, connected: Boolean(url && anonKey) };
    } catch {
      return { 
        url: import.meta.env.VITE_SUPABASE_URL || 'https://pmqcqvuxecibnxfkxrks.supabase.co', 
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '', 
        connected: false 
      };
    }
  },
  saveSupabaseConfig: (config) => {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(config));
  },
  getSupabaseClient: () => {
    const cfg = StorageService.getSupabaseConfig();
    if (cfg.url && cfg.anonKey) {
      try {
        return createClient(cfg.url, cfg.anonKey);
      } catch (err) {
        console.error('Error al inicializar cliente Supabase:', err);
      }
    }
    return null;
  },

  // CRUD GENÉRICO
  getCollection: (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error leyendo ${key}:`, e);
      return [];
    }
  },
  saveCollection: (key, items) => {
    localStorage.setItem(key, JSON.stringify(items));
  },

  // GESTIÓN DE SESIÓN Y USUARIOS / ROLES
  getCurrentUser: () => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : INITIAL_USERS[1];
  },
  setCurrentUser: (user) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },
  getUsersList: () => INITIAL_USERS,

  // MULTI-TENANT: CLÍNICAS / CONSULTORIOS
  getClinicaActiva: () => {
    const data = localStorage.getItem(STORAGE_KEYS.CLINICA);
    return data ? JSON.parse(data) : INITIAL_CLINICAS[0];
  },
  setClinicaActiva: (clinica) => {
    localStorage.setItem(STORAGE_KEYS.CLINICA, JSON.stringify(clinica));
  },
  getClinicasList: () => StorageService.getCollection(STORAGE_KEYS.CLINICAS_LIST),
  saveClinica: (clinicaData) => {
    const items = StorageService.getClinicasList();
    if (clinicaData.id) {
      const idx = items.findIndex(c => c.id === clinicaData.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...clinicaData };
      else items.push(clinicaData);
    } else {
      clinicaData.id = `clinica-${Date.now()}`;
      items.push(clinicaData);
    }
    StorageService.saveCollection(STORAGE_KEYS.CLINICAS_LIST, items);
    const current = StorageService.getClinicaActiva();
    if (current.id === clinicaData.id) {
      StorageService.setClinicaActiva({ ...current, ...clinicaData });
    }
    return clinicaData;
  },

  // ABM ESPECIALIDADES MÉDICAS
  getEspecialidades: () => {
    const items = StorageService.getCollection(STORAGE_KEYS.ESPECIALIDADES);
    return items.length > 0 ? items : INITIAL_ESPECIALIDADES;
  },
  saveEspecialidad: (esp) => {
    const items = StorageService.getEspecialidades();
    if (esp.id) {
      const idx = items.findIndex(e => e.id === esp.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...esp };
      else items.push(esp);
    } else {
      esp.id = `esp-${Date.now()}`;
      esp.activa = esp.activa !== false;
      items.push(esp);
    }
    StorageService.saveCollection(STORAGE_KEYS.ESPECIALIDADES, items);
    return esp;
  },
  deleteEspecialidad: (id) => {
    const items = StorageService.getEspecialidades().filter(e => e.id !== id);
    StorageService.saveCollection(STORAGE_KEYS.ESPECIALIDADES, items);
  },

  // ABM SERVICIOS MÉDICOS (Líneas de Atención)
  getServicios: (clinicaId = null) => {
    const all = StorageService.getCollection(STORAGE_KEYS.SERVICIOS);
    const items = all.length > 0 ? all : INITIAL_SERVICIOS;
    const targetClinicaId = clinicaId || StorageService.getClinicaActiva().id;
    return items.filter(s => !s.clinica_id || s.clinica_id === targetClinicaId);
  },
  saveServicio: (servicio) => {
    const items = StorageService.getCollection(STORAGE_KEYS.SERVICIOS);
    const clinicaId = StorageService.getClinicaActiva().id;
    servicio.clinica_id = servicio.clinica_id || clinicaId;

    if (servicio.id) {
      const idx = items.findIndex(s => s.id === servicio.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...servicio };
      else items.push(servicio);
    } else {
      servicio.id = `serv-${Date.now()}`;
      servicio.activo = servicio.activo !== false;
      items.push(servicio);
    }
    StorageService.saveCollection(STORAGE_KEYS.SERVICIOS, items);
    return servicio;
  },
  deleteServicio: (id) => {
    const items = StorageService.getCollection(STORAGE_KEYS.SERVICIOS).filter(s => s.id !== id);
    StorageService.saveCollection(STORAGE_KEYS.SERVICIOS, items);
  },

  // CONSULTORIOS FÍSICOS (Filtrados por clínica)
  getConsultorios: (clinicaId = null) => {
    const all = StorageService.getCollection(STORAGE_KEYS.CONSULTORIOS);
    const targetClinicaId = clinicaId || StorageService.getClinicaActiva().id;
    return all.filter(c => !c.clinica_id || c.clinica_id === targetClinicaId);
  },
  saveConsultorio: (consultorio) => {
    const items = StorageService.getCollection(STORAGE_KEYS.CONSULTORIOS);
    const clinicaId = StorageService.getClinicaActiva().id;
    consultorio.clinica_id = consultorio.clinica_id || clinicaId;

    if (consultorio.id) {
      const idx = items.findIndex(c => c.id === consultorio.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...consultorio };
      else items.push(consultorio);
    } else {
      consultorio.id = `c-${Date.now()}`;
      consultorio.activo = consultorio.activo !== false;
      items.push(consultorio);
    }
    StorageService.saveCollection(STORAGE_KEYS.CONSULTORIOS, items);
    return consultorio;
  },
  deleteConsultorio: (id) => {
    const items = StorageService.getCollection(STORAGE_KEYS.CONSULTORIOS).filter(c => c.id !== id);
    StorageService.saveCollection(STORAGE_KEYS.CONSULTORIOS, items);
  },

  // OBRAS SOCIALES
  getObrasSociales: (clinicaId = null) => {
    const all = StorageService.getCollection(STORAGE_KEYS.OBRAS_SOCIALES);
    const targetClinicaId = clinicaId || StorageService.getClinicaActiva().id;
    return all.filter(os => !os.clinica_id || os.clinica_id === targetClinicaId);
  },
  saveObraSocial: (os) => {
    const items = StorageService.getCollection(STORAGE_KEYS.OBRAS_SOCIALES);
    const clinicaId = StorageService.getClinicaActiva().id;
    os.clinica_id = os.clinica_id || clinicaId;

    if (os.id) {
      const idx = items.findIndex(o => o.id === os.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...os };
      else items.push(os);
    } else {
      os.id = `os-${Date.now()}`;
      os.activo = os.activo !== false;
      items.push(os);
    }
    StorageService.saveCollection(STORAGE_KEYS.OBRAS_SOCIALES, items);
    return os;
  },
  deleteObraSocial: (id) => {
    const items = StorageService.getCollection(STORAGE_KEYS.OBRAS_SOCIALES).filter(o => o.id !== id);
    StorageService.saveCollection(STORAGE_KEYS.OBRAS_SOCIALES, items);
    const planes = StorageService.getPlanes().filter(p => p.obra_social_id !== id);
    StorageService.saveCollection(STORAGE_KEYS.PLANES, planes);
  },

  // PLANES
  getPlanes: () => StorageService.getCollection(STORAGE_KEYS.PLANES),
  savePlan: (plan) => {
    const items = StorageService.getPlanes();
    if (plan.id) {
      const idx = items.findIndex(p => p.id === plan.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...plan };
      else items.push(plan);
    } else {
      plan.id = `pl-${Date.now()}`;
      plan.activo = plan.activo !== false;
      items.push(plan);
    }
    StorageService.saveCollection(STORAGE_KEYS.PLANES, items);
    return plan;
  },
  deletePlan: (id) => {
    const items = StorageService.getPlanes().filter(p => p.id !== id);
    StorageService.saveCollection(STORAGE_KEYS.PLANES, items);
  },

  // NOMENCLADOR DE PRÁCTICAS
  getNomenclador: (clinicaId = null) => {
    const all = StorageService.getCollection(STORAGE_KEYS.NOMENCLADOR);
    const targetClinicaId = clinicaId || StorageService.getClinicaActiva().id;
    return all.filter(nom => !nom.clinica_id || nom.clinica_id === targetClinicaId);
  },
  savePractica: (practica) => {
    const items = StorageService.getCollection(STORAGE_KEYS.NOMENCLADOR);
    const clinicaId = StorageService.getClinicaActiva().id;
    practica.clinica_id = practica.clinica_id || clinicaId;

    if (practica.id) {
      const idx = items.findIndex(p => p.id === practica.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...practica };
      else items.push(practica);
    } else {
      practica.id = `nom-${Date.now()}`;
      practica.activo = practica.activo !== false;
      items.push(practica);
    }
    StorageService.saveCollection(STORAGE_KEYS.NOMENCLADOR, items);
    return practica;
  },
  deletePractica: (id) => {
    const items = StorageService.getCollection(STORAGE_KEYS.NOMENCLADOR).filter(p => p.id !== id);
    StorageService.saveCollection(STORAGE_KEYS.NOMENCLADOR, items);
  },

  // MOTIVOS DE CANCELACIÓN Y REPROGRAMACIÓN
  getMotivos: (tipo = null) => {
    const all = StorageService.getCollection(STORAGE_KEYS.MOTIVOS);
    if (!all || all.length === 0) {
      StorageService.saveCollection(STORAGE_KEYS.MOTIVOS, INITIAL_MOTIVOS);
      return tipo ? INITIAL_MOTIVOS.filter(m => m.tipo === tipo) : INITIAL_MOTIVOS;
    }
    if (tipo) return all.filter(m => m.tipo === tipo);
    return all;
  },
  saveMotivo: (motivo) => {
    const items = StorageService.getMotivos();
    if (motivo.id) {
      const idx = items.findIndex(m => m.id === motivo.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...motivo };
      else items.push(motivo);
    } else {
      motivo.id = `mot-${Date.now()}`;
      motivo.activo = motivo.activo !== false;
      items.push(motivo);
    }
    StorageService.saveCollection(STORAGE_KEYS.MOTIVOS, items);
    return motivo;
  },
  deleteMotivo: (id) => {
    const items = StorageService.getMotivos().filter(m => m.id !== id);
    StorageService.saveCollection(STORAGE_KEYS.MOTIVOS, items);
  },

  // CONVENIOS Y COSEGUROS
  getConveniosCoseguros: () => StorageService.getCollection(STORAGE_KEYS.CONVENIOS_COSEGUROS),
  saveConvenioCoseguro: (convenio) => {
    const items = StorageService.getConveniosCoseguros();
    const idx = items.findIndex(c => c.plan_id === convenio.plan_id && c.practica_id === convenio.practica_id);
    if (idx >= 0) items[idx] = { ...items[idx], ...convenio };
    else {
      convenio.id = `cov-${Date.now()}`;
      items.push(convenio);
    }
    StorageService.saveCollection(STORAGE_KEYS.CONVENIOS_COSEGUROS, items);
    return convenio;
  },
  calcularCoseguro: (obraSocialId, planId, practicaId) => {
    if (!practicaId) return 0;
    const practica = StorageService.getNomenclador().find(p => p.id === practicaId);
    if (!practica) return 0;

    const os = StorageService.getObrasSociales().find(o => o.id === obraSocialId);
    if (os && os.sigla === 'PART') return Number(practica.valor_particular || 0);
    if (!planId) return Number(practica.coseguro_defecto || 0);

    const convenios = StorageService.getConveniosCoseguros();
    const convenio = convenios.find(c => c.plan_id === planId && c.practica_id === practicaId);
    if (convenio) {
      if (convenio.cubierto_100) return 0;
      return Number(convenio.monto_coseguro || 0);
    }
    return Number(practica.coseguro_defecto || 0);
  },

  // PROFESIONALES
  getProfesionales: (clinicaId = null) => {
    const all = StorageService.getCollection(STORAGE_KEYS.PROFESIONALES);
    if (!clinicaId || clinicaId === 'TODAS' || clinicaId === 'ALL') {
      return all;
    }
    const targetClinicaId = clinicaId || StorageService.getClinicaActiva().id;
    return all.filter(p => !p.clinica_id || p.clinica_id === targetClinicaId);
  },
  saveProfesional: (prof) => {
    const items = StorageService.getCollection(STORAGE_KEYS.PROFESIONALES);
    const clinicaId = StorageService.getClinicaActiva().id;
    prof.clinica_id = prof.clinica_id || clinicaId;

    if (prof.id) {
      const idx = items.findIndex(p => p.id === prof.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...prof };
      else items.push(prof);
    } else {
      prof.id = `prof-${Date.now()}`;
      prof.activo = prof.activo !== false;
      items.push(prof);
    }
    StorageService.saveCollection(STORAGE_KEYS.PROFESIONALES, items);
    return prof;
  },
  deleteProfesional: (id) => {
    const items = StorageService.getCollection(STORAGE_KEYS.PROFESIONALES).filter(p => p.id !== id);
    StorageService.saveCollection(STORAGE_KEYS.PROFESIONALES, items);
  },

  // HORARIOS / GRILLAS DE AGENDA
  getHorarios: () => StorageService.getCollection(STORAGE_KEYS.HORARIOS),
  getHorariosByProfesional: (profesionalId) => {
    return StorageService.getHorarios().filter(h => h.profesional_id === profesionalId && h.activo !== false);
  },
  saveHorario: (horario) => {
    const items = StorageService.getHorarios();
    if (horario.id) {
      const idx = items.findIndex(h => h.id === horario.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...horario };
      else items.push(horario);
    } else {
      horario.id = `h-${Date.now()}`;
      horario.activo = horario.activo !== false;
      items.push(horario);
    }
    StorageService.saveCollection(STORAGE_KEYS.HORARIOS, items);
    return horario;
  },
  deleteHorario: (id) => {
    const items = StorageService.getHorarios().filter(h => h.id !== id);
    StorageService.saveCollection(STORAGE_KEYS.HORARIOS, items);
  },
  // CONFIGURADOR EN LOTE DE AGENDA SEMANAL
  configurarAgendaSemanal: ({ profesional_id, servicio_id, dias_semana, turnos_horarios, consultorio_id, duracion_slot_min }) => {
    const allHorarios = StorageService.getHorarios();
    // Eliminar horarios anteriores de esos días para este médico y servicio
    const filtered = allHorarios.filter(h => !(
      h.profesional_id === profesional_id && 
      dias_semana.includes(h.dia_semana) &&
      (!servicio_id || h.servicio_id === servicio_id)
    ));

    const newFranjas = [];
    dias_semana.forEach(dia => {
      turnos_horarios.forEach((th, idx) => {
        if (th.hora_inicio && th.hora_fin) {
          newFranjas.push({
            id: `h-${Date.now()}-${dia}-${idx}`,
            profesional_id,
            servicio_id: servicio_id || null,
            consultorio_id,
            dia_semana: Number(dia),
            hora_inicio: th.hora_inicio,
            hora_fin: th.hora_fin,
            duracion_slot_min: Number(duracion_slot_min || 20),
            activo: true
          });
        }
      });
    });

    const updated = [...filtered, ...newFranjas];
    StorageService.saveCollection(STORAGE_KEYS.HORARIOS, updated);
    return newFranjas;
  },

  // BLOQUEOS Y VACACIONES
  getBloqueos: (clinicaId = null) => {
    const all = StorageService.getCollection(STORAGE_KEYS.BLOQUEOS);
    const targetClinicaId = clinicaId || StorageService.getClinicaActiva().id;
    return all.filter(b => !b.clinica_id || b.clinica_id === targetClinicaId);
  },
  saveBloqueo: (bloqueo) => {
    const items = StorageService.getCollection(STORAGE_KEYS.BLOQUEOS);
    const clinicaId = StorageService.getClinicaActiva().id;
    bloqueo.clinica_id = bloqueo.clinica_id || clinicaId;

    if (bloqueo.id) {
      const idx = items.findIndex(b => b.id === bloqueo.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...bloqueo };
      else items.push(bloqueo);
    } else {
      bloqueo.id = `b-${Date.now()}`;
      items.push(bloqueo);
    }
    StorageService.saveCollection(STORAGE_KEYS.BLOQUEOS, items);
    return bloqueo;
  },
  deleteBloqueo: (id) => {
    const items = StorageService.getCollection(STORAGE_KEYS.BLOQUEOS).filter(b => b.id !== id);
    StorageService.saveCollection(STORAGE_KEYS.BLOQUEOS, items);
  },

  // PACIENTES
  getPacientes: (clinicaId = null) => {
    const all = StorageService.getCollection(STORAGE_KEYS.PACIENTES);
    const targetClinicaId = clinicaId || StorageService.getClinicaActiva().id;
    return all.filter(p => !p.clinica_id || p.clinica_id === targetClinicaId);
  },
  findPacienteByDni: (dni) => {
    const cleanDni = String(dni).replace(/\D/g, '');
    const targetClinicaId = StorageService.getClinicaActiva().id;
    return StorageService.getPacientes(targetClinicaId).find(p => String(p.dni).replace(/\D/g, '') === cleanDni);
  },
  savePaciente: (paciente) => {
    const items = StorageService.getCollection(STORAGE_KEYS.PACIENTES);
    const clinicaId = StorageService.getClinicaActiva().id;
    paciente.clinica_id = paciente.clinica_id || clinicaId;

    if (paciente.id) {
      const idx = items.findIndex(p => p.id === paciente.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...paciente };
      else items.push(paciente);
    } else {
      const existing = StorageService.findPacienteByDni(paciente.dni);
      if (existing) {
        Object.assign(existing, paciente);
        StorageService.saveCollection(STORAGE_KEYS.PACIENTES, items);
        return existing;
      }
      paciente.id = `pac-${Date.now()}`;
      items.push(paciente);
    }
    StorageService.saveCollection(STORAGE_KEYS.PACIENTES, items);
    return paciente;
  },
  deletePaciente: (id) => {
    const items = StorageService.getCollection(STORAGE_KEYS.PACIENTES).filter(p => p.id !== id);
    StorageService.saveCollection(STORAGE_KEYS.PACIENTES, items);
  },

  // TURNOS
  getTurnos: (clinicaId = null) => {
    const all = StorageService.getCollection(STORAGE_KEYS.TURNOS);
    if (!clinicaId || clinicaId === 'TODAS' || clinicaId === 'ALL') {
      return all;
    }
    const targetClinicaId = clinicaId || StorageService.getClinicaActiva().id;
    return all.filter(t => !t.clinica_id || t.clinica_id === targetClinicaId);
  },
  saveTurno: (turno) => {
    const items = StorageService.getCollection(STORAGE_KEYS.TURNOS);
    const clinicaId = StorageService.getClinicaActiva().id;
    turno.clinica_id = turno.clinica_id || clinicaId;

    if (turno.id) {
      const idx = items.findIndex(t => t.id === turno.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...turno };
      else items.push(turno);
    } else {
      turno.id = `trn-${Date.now()}`;
      turno.codigo_reserva = turno.codigo_reserva || `TRN-${Math.floor(10000 + Math.random() * 90000)}`;
      turno.estado = turno.estado || 'PROGRAMADO';
      items.push(turno);
    }
    StorageService.saveCollection(STORAGE_KEYS.TURNOS, items);
    return turno;
  },

  // SLOTS DISPONIBLES (Filtrado por profesional, servicio opcional y fecha)
  getSlotsDisponibles: (profesionalId, fechaStr, servicioId = null) => {
    if (!profesionalId || !fechaStr) return [];

    const [year, month, day] = fechaStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const diaSemana = dateObj.getDay();

    const bloqueos = StorageService.getBloqueos();
    const esFeriadoOBloqueado = bloqueos.some(b => {
      const matchFecha = fechaStr >= b.fecha_inicio && fechaStr <= b.fecha_fin;
      if (!matchFecha) return false;
      if (!b.profesional_id) return true;
      if (b.profesional_id === profesionalId) return true;
      return false;
    });

    if (esFeriadoOBloqueado) return [];

    let horarios = StorageService.getHorariosByProfesional(profesionalId).filter(h => h.dia_semana === diaSemana);
    if (servicioId) {
      horarios = horarios.filter(h => !h.servicio_id || h.servicio_id === servicioId);
    }
    if (horarios.length === 0) return [];

    const turnosExistentes = StorageService.getTurnos().filter(t => 
      t.profesional_id === profesionalId && 
      t.fecha === fechaStr && 
      t.estado !== 'CANCELADO'
    );

    const occupiedHours = new Set(turnosExistentes.map(t => t.hora_inicio));
    const slots = [];

    horarios.forEach(h => {
      const [hIni, mIni] = h.hora_inicio.split(':').map(Number);
      const [hFin, mFin] = h.hora_fin.split(':').map(Number);
      const slotDuration = h.duracion_slot_min || 20;

      let currentMinutes = hIni * 60 + mIni;
      const endMinutes = hFin * 60 + mFin;

      while (currentMinutes + slotDuration <= endMinutes) {
        const slotHour = Math.floor(currentMinutes / 60);
        const slotMin = currentMinutes % 60;
        const horaStr = `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;
        
        const endSlotMinutes = currentMinutes + slotDuration;
        const endSlotHour = Math.floor(endSlotMinutes / 60);
        const endSlotMin = endSlotMinutes % 60;
        const horaFinStr = `${String(endSlotHour).padStart(2, '0')}:${String(endSlotMin).padStart(2, '0')}`;

        const isOccupied = occupiedHours.has(horaStr);

        slots.push({
          hora_inicio: horaStr,
          hora_fin: horaFinStr,
          disponible: !isOccupied,
          consultorio_id: h.consultorio_id,
          servicio_id: h.servicio_id,
          duracion_min: slotDuration
        });

        currentMinutes += slotDuration;
      }
    });

    return slots;
  },

  // PAQUETES DE SESIONES RECURRENTES (Kinesiología, Fisioterapia, Psicología, Fonoaudiología)
  createPaqueteSesiones: ({
    pacienteData,
    profesional_id,
    servicio_id,
    practica_id,
    obra_social_id,
    plan_id,
    fecha_inicio,
    hora_inicio,
    hora_fin,
    consultorio_id,
    dias_semana = [1],
    cantidad_sesiones = 10,
    monto_coseguro_sesion = 0,
    observaciones = ''
  }) => {
    // 1. Guardar/actualizar paciente
    const paciente = StorageService.savePaciente(pacienteData);
    const clinicaId = StorageService.getClinicaActiva().id;
    const paqueteId = `paq-${Date.now()}`;
    const codigoBase = `PAQ-${Math.floor(1000 + Math.random() * 9000)}`;

    const bloqueos = StorageService.getBloqueos(clinicaId);
    const generatedTurnos = [];

    let currentDate = new Date(fecha_inicio + 'T00:00:00');
    let sessionsFound = 0;
    let safetyCounter = 0; // Evitar loop infinito

    while (sessionsFound < cantidad_sesiones && safetyCounter < 180) {
      safetyCounter++;
      const diaSemana = currentDate.getDay();
      const dateStr = currentDate.toISOString().split('T')[0];

      if (dias_semana.includes(diaSemana)) {
        // Verificar si la fecha está bloqueada
        const isBlocked = bloqueos.some(b => {
          const matchFecha = dateStr >= b.fecha_inicio && dateStr <= b.fecha_fin;
          if (!matchFecha) return false;
          if (!b.profesional_id || b.profesional_id === profesional_id) return true;
          return false;
        });

        if (!isBlocked) {
          sessionsFound++;
          const turnoObj = {
            id: `trn-${Date.now()}-${sessionsFound}`,
            clinica_id: clinicaId,
            codigo_reserva: `${codigoBase}-S${sessionsFound}`,
            paquete_id: paqueteId,
            nro_sesion: sessionsFound,
            total_sesiones: cantidad_sesiones,
            paciente_id: paciente.id,
            profesional_id,
            servicio_id: servicio_id || null,
            consultorio_id: consultorio_id || null,
            practica_id: practica_id || null,
            obra_social_id: obra_social_id || null,
            plan_id: plan_id || null,
            numero_afiliado: pacienteData.numero_afiliado || '',
            fecha: dateStr,
            hora_inicio,
            hora_fin: hora_fin || hora_inicio,
            fecha_hora_inicio: `${dateStr}T${hora_inicio}:00`,
            fecha_hora_fin: `${dateStr}T${hora_fin || hora_inicio}:00`,
            es_sobreturno: false,
            estado: 'PROGRAMADO',
            monto_coseguro: monto_coseguro_sesion,
            estado_coseguro: monto_coseguro_sesion > 0 ? 'PENDIENTE' : 'EXENTO',
            confirmado_whatsapp: false,
            observaciones: `Sesión ${sessionsFound}/${cantidad_sesiones} • ${observaciones || 'Tratamiento recurrente'}`
          };
          generatedTurnos.push(turnoObj);
        }
      }

      // Avanzar al día siguiente
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Guardar todos los turnos generados
    const allTurnos = StorageService.getCollection(STORAGE_KEYS.TURNOS);
    const updated = [...allTurnos, ...generatedTurnos];
    StorageService.saveCollection(STORAGE_KEYS.TURNOS, updated);

    return {
      paquete_id: paqueteId,
      codigo_paquete: codigoBase,
      paciente,
      turnos: generatedTurnos,
      total_sesiones: generatedTurnos.length
    };
  },

  // LLAMADOR TV
  getTvCalls: () => StorageService.getCollection(STORAGE_KEYS.TV_CALLS),
  addTvCall: (turno, consultorioNombre, doctorNombre) => {
    const calls = StorageService.getTvCalls();
    const newCall = {
      id: `call-${Date.now()}`,
      turno_id: turno.id,
      codigo_reserva: turno.codigo_reserva,
      paciente_nombre: turno.paciente ? `${turno.paciente.nombre} ${turno.paciente.apellido}` : 'Paciente',
      consultorio: consultorioNombre || 'Consultorio',
      medico: doctorNombre || 'Profesional',
      timestamp: new Date().toISOString()
    };
    const updated = [newCall, ...calls.filter(c => c.turno_id !== turno.id)].slice(0, 8);
    StorageService.saveCollection(STORAGE_KEYS.TV_CALLS, updated);
    return newCall;
  },

  // HISTORIA CLÍNICA
  getAtencionesHce: () => StorageService.getCollection(STORAGE_KEYS.ATENCIONES_HCE),
  saveAtencionHce: (atencion) => {
    const items = StorageService.getAtencionesHce();
    if (atencion.id) {
      const idx = items.findIndex(a => a.id === atencion.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...atencion };
      else items.push(atencion);
    } else {
      atencion.id = `hce-${Date.now()}`;
      atencion.fecha_atencion = atencion.fecha_atencion || new Date().toISOString();
      items.unshift(atencion);
    }
    StorageService.saveCollection(STORAGE_KEYS.ATENCIONES_HCE, items);
    return atencion;
  },

  // EXPORT / IMPORT
  exportFullDatabaseJson: () => {
    const dump = {};
    Object.keys(STORAGE_KEYS).forEach(k => {
      const keyName = STORAGE_KEYS[k];
      const data = localStorage.getItem(keyName);
      if (data) dump[keyName] = JSON.parse(data);
    });
    return JSON.stringify(dump, null, 2);
  },
  importFullDatabaseJson: (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      Object.keys(data).forEach(key => {
        localStorage.setItem(key, JSON.stringify(data[key]));
      });
      return true;
    } catch (e) {
      console.error('Error importando backup:', e);
      return false;
    }
  },
  resetToFactoryDefaults: () => {
    localStorage.clear();
    initLocalStorage();
  }
};
