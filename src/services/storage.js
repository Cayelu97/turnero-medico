// ==============================================================================
// GESTOR DE ALMACENAMIENTO Y LÓGICA DE NEGOCIO MULTI-TENANT (LOCAL & SUPABASE READY)
// ==============================================================================
import { createClient } from '@supabase/supabase-js';
import { getDayOfWeekFromDateString, getLocalDateString, getFeriadoNacional } from '../utils/dateUtils.js';
import { triggerAutoCloudSync } from './cloudSync.js';

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
  AGENDAS: 'mediturnos_agendas',
  BLOQUEOS: 'mediturnos_bloqueos',
  PACIENTES: 'mediturnos_pacientes',
  TURNOS: 'mediturnos_turnos',
  ATENCIONES_HCE: 'mediturnos_atenciones_hce',
  MOTIVOS: 'mediturnos_motivos',
  USERS: 'mediturnos_users',
  SUPABASE_CONFIG: 'mediturnos_supabase_config',
  TV_CALLS: 'mediturnos_tv_calls',
  MOVIMIENTOS_CAJA: 'mediturnos_movimientos_caja',
  LOTES_FACTURACION: 'mediturnos_lotes_facturacion',
  CUENTAS_CORRIENTES_PACIENTES: 'mediturnos_cta_cte_pacientes',
  MOVIMIENTOS_CTA_CTE_PACIENTES: 'mediturnos_mov_cta_cte_pacientes',
  CUENTAS_CORRIENTES_OS: 'mediturnos_cta_cte_os',
  MOVIMIENTOS_CTA_CTE_OS: 'mediturnos_mov_cta_cte_os',
  COMPROBANTES_ARCA: 'mediturnos_comprobantes_arca',
  CONSENTIMIENTOS: 'mediturnos_consentimientos',
  ARANCELES_CONVENIOS: 'mediturnos_aranceles_convenios'
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

// Especialidades Médicas y de Salud Mental Estándar en Argentina / Córdoba
export const INITIAL_ESPECIALIDADES = [
  { id: 'esp-0', nombre: 'Psicología y Salud Mental', codigo: 'PSIC', descripcion: 'Psicoterapia individual, infanto-juvenil, pareja, familia y psicodiagnóstico', activa: true },
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
  { id: 'esp-13', nombre: 'Psiquiatría', codigo: 'PSIQ', descripcion: 'Evaluación psiquiátrica, psicofarmacología y seguimiento', activa: true },
  { id: 'esp-14', nombre: 'Diagnóstico por Imágenes / Ecografía', codigo: 'IMAG', descripcion: 'Ecografía general, Doppler, radiología y resonancia', activa: true },
  { id: 'esp-15', nombre: 'Kinesiología y Fisioterapia', codigo: 'KINE', descripcion: 'Rehabilitación motora, fisioterapia respiratoria y traumatológica', activa: true },
  { id: 'esp-16', nombre: 'Odontología', codigo: 'ODONT', descripcion: 'Salud bucal, prevención, operatoria, endodoncia y prótesis', activa: true },
  { id: 'esp-17', nombre: 'Neumonología', codigo: 'NEUM', descripcion: 'Enfermedades respiratorias, asma, EPOC y función pulmonar', activa: true },
  { id: 'esp-18', nombre: 'Alergia e Inmunología', codigo: 'ALERG', descripcion: 'Alergias respiratorias, cutáneas, alimentarias e inmunidad', activa: true },
  { id: 'esp-19', nombre: 'Reumatología', codigo: 'REUM', descripcion: 'Artritis, artrosis, lupus y enfermedades autoinmunes', activa: true },
  { id: 'esp-20', nombre: 'Flebología y Cirugía Vascular', codigo: 'FLEB', descripcion: 'Tratamiento de várices, telangiectasias y patología venosa', activa: true }
];

// Servicios Médicos y de Psicología
export const INITIAL_SERVICIOS = [
  {
    id: 'serv-0a',
    clinica_id: 'clinica-1',
    nombre: 'Psicoterapia Individual (Adultos / Adolescentes)',
    especialidad_id: 'esp-0',
    tipo: 'CONSULTA',
    duracion_default_min: 45,
    color_etiqueta: '#6366f1',
    practicas_ids: ['nom-psi-1', 'nom-psi-2'],
    practica_default_id: 'nom-psi-2',
    descripcion: 'Sesiones de psicoterapia clínica individual presencial u online.',
    activo: true
  },
  {
    id: 'serv-0b',
    clinica_id: 'clinica-1',
    nombre: 'Terapia de Pareja y Familiar',
    especialidad_id: 'esp-0',
    tipo: 'CONSULTA',
    duracion_default_min: 60,
    color_etiqueta: '#8b5cf6',
    practicas_ids: ['nom-psi-3'],
    practica_default_id: 'nom-psi-3',
    descripcion: 'Abordaje vincular sistémico de pareja y dinámicas familiares.',
    activo: true
  },
  {
    id: 'serv-0c',
    clinica_id: 'clinica-1',
    nombre: 'Evaluaciones, Psicodiagnóstico y Aptos',
    especialidad_id: 'esp-0',
    tipo: 'ESTUDIO_PRACTICA',
    duracion_default_min: 50,
    color_etiqueta: '#a855f7',
    practicas_ids: ['nom-psi-4', 'nom-psi-5', 'nom-psi-6'],
    practica_default_id: 'nom-psi-4',
    descripcion: 'Batería de tests proyectivos/psicométricos con informe clínico o laboral.',
    activo: true
  },
  {
    id: 'serv-1',
    clinica_id: 'clinica-1',
    nombre: 'Consultas Cardiológicas',
    especialidad_id: 'esp-1',
    tipo: 'CONSULTA',
    duracion_default_min: 20,
    color_etiqueta: '#0284c7',
    practicas_ids: ['nom-1', 'nom-2', 'nom-5'],
    practica_default_id: 'nom-1',
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
    practica_default_id: 'nom-4',
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
    id: 'serv-6',
    clinica_id: 'clinica-1',
    nombre: 'Ecografía General y Diagnóstico por Imágenes',
    especialidad_id: 'esp-14',
    tipo: 'ESTUDIO_PRACTICA',
    duracion_default_min: 30,
    color_etiqueta: '#8b5cf6',
    practicas_ids: ['nom-3', 'nom-4'],
    practica_default_id: 'nom-3',
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
    practica_default_id: 'nom-6',
    descripcion: 'Rehabilitación motora, fisioterapia respiratoria y traumatológica',
    activo: true
  }
];

// Clínicas / Sedes iniciales (Multi-Sede / Multi-Tenant)
export const INITIAL_CLINICAS = [
  {
    id: 'clinica-1',
    nombre: 'Aipaa 355',
    cuit: '30-71234567-9',
    direccion: 'Av. Colón 1250, Córdoba Capital',
    telefono: '+54 351 428-9000',
    whatsapp: '+54 9 351 428-9000',
    email: 'aipaa@saludnet.com.ar',
    mensaje_bienvenida: 'Sede Aipaa 355 - Consultorios de Psicología y Salud Mental.',
    color_primario: '#6366f1',
    condicion_iva: 'MONO',
    punto_venta: 1,
    iibb: '28490182-9',
    inicio_actividades: '2021-03-01',
    activa: true
  },
  {
    id: 'clinica-2',
    nombre: 'Circulare COLON',
    cuit: '30-79812345-1',
    direccion: 'Av. Colón 2450, Alberdi',
    telefono: '+54 351 481-4400',
    whatsapp: '+54 9 351 481-4400',
    email: 'colon@saludnet.com.ar',
    mensaje_bienvenida: 'Sede Circulare COLON - Atención Psicológica y Consultorios.',
    color_primario: '#0d9488',
    condicion_iva: 'RI',
    punto_venta: 2,
    iibb: '90128490-1',
    inicio_actividades: '2020-01-15',
    activa: true
  },
  {
    id: 'clinica-3',
    nombre: 'Inti Carrara',
    cuit: '30-72458901-3',
    direccion: 'Av. Rafael Núñez 4200, Cerro de las Rosas',
    telefono: '+54 351 468-2200',
    whatsapp: '+54 9 351 468-2200',
    email: 'inticarrara@saludnet.com.ar',
    mensaje_bienvenida: 'Sede Inti Carrara - Consultas y Terapias Especializadas.',
    color_primario: '#8b5cf6',
    condicion_iva: 'RI',
    punto_venta: 3,
    iibb: '30491028-4',
    inicio_actividades: '2022-06-01',
    activa: true
  },
  {
    id: 'clinica-4',
    nombre: 'online CASA',
    cuit: '30-75619283-7',
    direccion: 'Atención Remota Online / Telemedicina',
    telefono: '+54 351 493-1100',
    whatsapp: '+54 9 351 493-1100',
    email: 'online@saludnet.com.ar',
    mensaje_bienvenida: 'Sede online CASA - Consultas Online / Videollamada.',
    color_primario: '#0284c7',
    condicion_iva: 'RI',
    punto_venta: 4,
    iibb: '40192831-2',
    inicio_actividades: '2023-02-10',
    activa: true
  }
];

// Usuarios y Roles
export const INITIAL_USERS = [
  { id: 'usr-1', nombre: 'Administrador General', email: 'admin@clinica.com', password: 'admin', rol: 'ADMIN_CLINICA', clinica_id: 'clinica-1', activo: true },
  { id: 'usr-2', nombre: 'Secretaría de Recepción', email: 'secretaria@clinica.com', password: '123', rol: 'SECRETARIA', clinica_id: 'clinica-1', activo: true },
  { id: 'usr-3', nombre: 'Lic. Sofía Albarracín (CPPC)', email: 'psicologia@clinica.com', password: '123', rol: 'PROFESIONAL', clinica_id: 'clinica-1', profesional_id: 'prof-psi-1', activo: true },
  { id: 'usr-4', nombre: 'Dr. Martín Pérez Rossi', email: 'doctor@clinica.com', password: '123', rol: 'PROFESIONAL', clinica_id: 'clinica-1', profesional_id: 'prof-1', activo: true }
];

export const INITIAL_DATA = {
  clinica: INITIAL_CLINICAS[0],
  especialidades: INITIAL_ESPECIALIDADES,
  servicios: INITIAL_SERVICIOS,
  consultorios: [
    // Sede 1: Aipaa 355
    { id: 'c-1-1', clinica_id: 'clinica-1', nombre: 'Consultorio Aipaa 1 - Psicología & Terapia', piso_ubicacion: 'Planta Alta', equipamiento: 'Sillones individuales, insonorización', activo: true },
    { id: 'c-1-2', clinica_id: 'clinica-1', nombre: 'Consultorio Aipaa 2 - Consultas Generales', piso_ubicacion: 'Planta Baja', equipamiento: 'Escritorio, sillones', activo: true },
    // Sede 2: Circulare COLON
    { id: 'c-2-1', clinica_id: 'clinica-2', nombre: 'Consultorio Colón 1 - Terapia & Salud Mental', piso_ubicacion: 'Planta Baja', equipamiento: 'Sillones de consulta, Escritorio', activo: true },
    { id: 'c-2-2', clinica_id: 'clinica-2', nombre: 'Consultorio Colón 2 - Consultorio Principal', piso_ubicacion: 'Planta Baja', equipamiento: 'Escritorio clínico', activo: true },
    // Sede 3: Inti Carrara
    { id: 'c-3-1', clinica_id: 'clinica-3', nombre: 'Consultorio Inti 1 - Salud Mental & Consultas', piso_ubicacion: 'Piso 1', equipamiento: 'Sillones confortables, escritorio', activo: true },
    { id: 'c-3-2', clinica_id: 'clinica-3', nombre: 'Consultorio Inti 2 - Consultorio de Atención', piso_ubicacion: 'Piso 1', equipamiento: 'Escritorio y sillón', activo: true },
    // Sede 4: online CASA
    { id: 'c-4-1', clinica_id: 'clinica-4', nombre: 'Consultorio Virtual - Videollamada', piso_ubicacion: 'Online', equipamiento: 'Plataforma de Videoconsulta', activo: true }
  ],
  obras_sociales: [
    { id: 'os-1', clinica_id: 'clinica-1', nombre: 'Particular / Privado', sigla: 'PART', cuit: '', requiere_bono: false, requiere_autorizacion: false, instrucciones: 'Abono por sesión o pack mensual en recepción/transferencia.', activo: true },
    { id: 'os-apross', clinica_id: 'clinica-1', nombre: 'APROSS (Córdoba)', sigla: 'APROSS', cuit: '30-99923812-4', requiere_bono: true, requiere_autorizacion: true, instrucciones: 'Validar credencial digital en App oficial APROSS y código de token.', activo: true },
    { id: 'os-cppc', clinica_id: 'clinica-1', nombre: 'Colegio de Psicólogos de Cba (CPPC)', sigla: 'CPPC', cuit: '30-61849201-3', requiere_bono: true, requiere_autorizacion: false, instrucciones: 'Presentación por planilla oficial del Colegio de Psicólogos.', activo: true },
    { id: 'os-2', clinica_id: 'clinica-1', nombre: 'OSDE', sigla: 'OSDE', cuit: '30-54674125-3', requiere_bono: false, requiere_autorizacion: false, instrucciones: 'Presentar credencial digital activa y DNI.', activo: true },
    { id: 'os-3', clinica_id: 'clinica-1', nombre: 'Swiss Medical', sigla: 'SMG', cuit: '30-67890123-4', requiere_bono: false, requiere_autorizacion: false, instrucciones: 'Validación por token digital en recepción.', activo: true },
    { id: 'os-4', clinica_id: 'clinica-1', nombre: 'Galeno', sigla: 'GAL', cuit: '30-70809012-5', requiere_bono: false, requiere_autorizacion: false, instrucciones: 'Presentar credencial digital o física.', activo: true },
    { id: 'os-5', clinica_id: 'clinica-1', nombre: 'PAMI', sigla: 'PAMI', cuit: '30-52276392-2', requiere_bono: true, requiere_autorizacion: true, instrucciones: 'Presentar carnet PAMI y Orden Médica Electrónica (OME).', activo: true },
    { id: 'os-8', clinica_id: 'clinica-1', nombre: 'Medifé', sigla: 'MED', cuit: '30-68192301-7', requiere_bono: false, requiere_autorizacion: false, instrucciones: 'Credencial digital y autorización previa para estudios especiales.', activo: true }
  ],
  planes: [
    { id: 'pl-1', obra_social_id: 'os-1', nombre_plan: 'Particular Sesión Individual', codigo_plan: 'PART-STD', descripcion: 'Arancel ético de referencia CPPC / Particular', activo: true },
    { id: 'pl-1b', obra_social_id: 'os-1', nombre_plan: 'Abono Mensual (Pack 4 Sesiones)', codigo_plan: 'PART-PACK4', descripcion: 'Pack mensual con descuento para psicoterapia continua', activo: true },
    { id: 'pl-apross-1', obra_social_id: 'os-apross', nombre_plan: 'APROSS Directo / Adherentes', codigo_plan: 'APROSS-DIR', descripcion: 'Cobertura con copago institucional', activo: true },
    { id: 'pl-cppc-1', obra_social_id: 'os-cppc', nombre_plan: 'Convenio Colectivo CPPC Obras Sociales', codigo_plan: 'CPPC-CONV', descripcion: 'Liquidación a través del Colegio de Psicólogos', activo: true },
    { id: 'pl-2', obra_social_id: 'os-2', nombre_plan: 'Plan 210', codigo_plan: 'OSDE-210', descripcion: 'Cobertura directa sin coseguro', activo: true },
    { id: 'pl-3', obra_social_id: 'os-2', nombre_plan: 'Plan 310', codigo_plan: 'OSDE-310', descripcion: 'Cobertura amplia', activo: true },
    { id: 'pl-5', obra_social_id: 'os-3', nombre_plan: 'SMG20', codigo_plan: 'SMG-20', descripcion: 'Con copago en ciertas prácticas', activo: true },
    { id: 'pl-7', obra_social_id: 'os-4', nombre_plan: 'Plata / Oro', codigo_plan: 'GAL-PO', descripcion: 'Cobertura integral', activo: true },
    { id: 'pl-8', obra_social_id: 'os-5', nombre_plan: 'PAMI Integral', codigo_plan: 'PAMI-INT', descripcion: 'Requiere OME', activo: true }
  ],
  nomenclador: [
    // 1. PSICOLOGÍA & SALUD MENTAL (CPPC / PMO)
    { id: 'nom-psi-1', clinica_id: 'clinica-1', tipo_nomenclador: 'PSICOLOGIA', codigo_pmo: '33.01.01', descripcion: 'Consulta de Admisión / Entrevista Inicial de Psicología', duracion_minutos: 45, valor_particular: 18000, coseguro_defecto: 0, requiere_orden: false, requiere_autorizacion: false, instrucciones_preparacion: 'Concurrir 5 minutos antes o conectarse con anticipación si es online.', activo: true },
    { id: 'nom-psi-2', clinica_id: 'clinica-1', tipo_nomenclador: 'PSICOLOGIA', codigo_pmo: '33.01.02', descripcion: 'Sesión de Psicoterapia Individual (Adultos / Adolescentes / Niños)', duracion_minutos: 45, valor_particular: 16000, coseguro_defecto: 2000, requiere_orden: false, requiere_autorizacion: true, instrucciones_preparacion: 'En sesiones virtuales, procurar un espacio tranquilo y libre de interrupciones.', activo: true },
    { id: 'nom-psi-3', clinica_id: 'clinica-1', tipo_nomenclador: 'PSICOLOGIA', codigo_pmo: '33.01.03', descripcion: 'Psicoterapia de Pareja y Familia', duracion_minutos: 60, valor_particular: 24000, coseguro_defecto: 3500, requiere_orden: false, requiere_autorizacion: true, instrucciones_preparacion: 'Asistencia de ambos integrantes del vínculo.', activo: true },
    { id: 'nom-psi-4', clinica_id: 'clinica-1', tipo_nomenclador: 'PSICOLOGIA', codigo_pmo: '33.01.05', descripcion: 'Psicodiagnóstico Clínico (Batería de Tests + Informe Devolución)', duracion_minutos: 50, valor_particular: 65000, coseguro_defecto: 8000, requiere_orden: true, requiere_autorizacion: true, instrucciones_preparacion: 'Proceso de 4 sesiones de evaluación psicométrica y proyectiva.', activo: true },
    { id: 'nom-psi-5', clinica_id: 'clinica-1', tipo_nomenclador: 'PSICOLOGIA', codigo_pmo: '33.01.06', descripcion: 'Evaluación Psicolaboral / Perfil de Puesto (Apto Psicológico)', duracion_minutos: 60, valor_particular: 35000, coseguro_defecto: 0, requiere_orden: false, requiere_autorizacion: false, instrucciones_preparacion: 'Traer DNI original y anteojos recetados si utiliza.', activo: true },
    { id: 'nom-psi-6', clinica_id: 'clinica-1', tipo_nomenclador: 'PSICOLOGIA', codigo_pmo: '33.01.08', descripcion: 'Orientación Vocacional y Ocupacional (Módulo Completo)', duracion_minutos: 50, valor_particular: 50000, coseguro_defecto: 0, requiere_orden: false, requiere_autorizacion: false, instrucciones_preparacion: 'Proceso de 5 encuentros de orientación.', activo: true },
    { id: 'nom-psi-7', clinica_id: 'clinica-1', tipo_nomenclador: 'PSICOLOGIA', codigo_pmo: '33.01.09', descripcion: 'Informe Psicológico y Solicitud de Prórroga a Obra Social', duracion_minutos: 20, valor_particular: 12000, coseguro_defecto: 0, requiere_orden: false, requiere_autorizacion: false, instrucciones_preparacion: 'Emisión de informe técnico para auditoría médica / APROSS.', activo: true },

    // 2. MÉDICO / PMO
    { id: 'nom-1', clinica_id: 'clinica-1', tipo_nomenclador: 'PMO_MEDICO', codigo_pmo: '42.01.01', descripcion: 'Consulta Médica Especializada en Consultorio', duracion_minutos: 20, valor_particular: 18000, coseguro_defecto: 0, requiere_orden: false, requiere_autorizacion: false, instrucciones_preparacion: 'Concurrir con estudios previos y medicación habitual.', activo: true },
    { id: 'nom-2', clinica_id: 'clinica-1', tipo_nomenclador: 'PMO_MEDICO', codigo_pmo: '42.01.02', descripcion: 'Consulta de Control / Seguimiento', duracion_minutos: 15, valor_particular: 12000, coseguro_defecto: 0, requiere_orden: false, requiere_autorizacion: false, instrucciones_preparacion: 'Traer resultados de estudios solicitados.', activo: true },
    { id: 'nom-3', clinica_id: 'clinica-1', tipo_nomenclador: 'IMAGENES', codigo_pmo: '18.01.01', descripcion: 'Ecografía Abdominal Completa', duracion_minutos: 30, valor_particular: 32000, coseguro_defecto: 4500, requiere_orden: true, requiere_autorizacion: true, instrucciones_preparacion: 'Ayuno estricto de 8 horas. No tomar mate, café ni bebidas con gas.', activo: true },
    { id: 'nom-4', clinica_id: 'clinica-1', tipo_nomenclador: 'IMAGENES', codigo_pmo: '18.01.06', descripcion: 'Ecocardiograma Doppler Color', duracion_minutos: 30, valor_particular: 42000, coseguro_defecto: 6000, requiere_orden: true, requiere_autorizacion: true, instrucciones_preparacion: 'Concurrir con ropa cómoda de dos piezas.', activo: true },
    { id: 'nom-5', clinica_id: 'clinica-1', tipo_nomenclador: 'IMAGENES', codigo_pmo: '17.01.01', descripcion: 'Electrocardiograma (ECG) con Informe', duracion_minutos: 15, valor_particular: 14000, coseguro_defecto: 2000, requiere_orden: false, requiere_autorizacion: false, instrucciones_preparacion: 'No colocarse cremas corporales en el torso.', activo: true },
    { id: 'nom-6', clinica_id: 'clinica-1', tipo_nomenclador: 'KINESICO', codigo_pmo: '25.01.01', descripcion: 'Sesión de Kinesiología y Fisioterapia', duracion_minutos: 40, valor_particular: 15000, coseguro_defecto: 2500, requiere_orden: true, requiere_autorizacion: false, instrucciones_preparacion: 'Asistir con ropa deportiva cómoda y toalla de mano.', activo: true },

    // 3. NBU (NOMENCLADOR BIOQUÍMICO ÚNICO)
    { id: 'nom-nbu-1', clinica_id: 'clinica-1', tipo_nomenclador: 'NBU_BIOQUIMICO', codigo_pmo: '66.00.01', descripcion: 'Hemograma Completo Automatizado con Fórmula Leucocitaria', duracion_minutos: 10, valor_particular: 9500, coseguro_defecto: 1000, unidades_bioquimicas: 12, unidades_gastos: 4, requiere_orden: true, requiere_autorizacion: false, instrucciones_preparacion: 'Ayuno de 8 a 12 horas.', activo: true },
    { id: 'nom-nbu-2', clinica_id: 'clinica-1', tipo_nomenclador: 'NBU_BIOQUIMICO', codigo_pmo: '66.01.20', descripcion: 'Glucemia en Sangre (Glicemia en ayunas)', duracion_minutos: 10, valor_particular: 4800, coseguro_defecto: 500, unidades_bioquimicas: 6, unidades_gastos: 2, requiere_orden: true, requiere_autorizacion: false, instrucciones_preparacion: 'Ayuno estricto de 8 horas.', activo: true },
    { id: 'nom-nbu-3', clinica_id: 'clinica-1', tipo_nomenclador: 'NBU_BIOQUIMICO', codigo_pmo: '66.03.40', descripcion: 'Perfil Lipídico Completo (Colesterol Total, HDL, LDL, Triglicéridos)', duracion_minutos: 10, valor_particular: 14000, coseguro_defecto: 1500, unidades_bioquimicas: 18, unidades_gastos: 6, requiere_orden: true, requiere_autorizacion: false, instrucciones_preparacion: 'Ayuno de 12 horas. Evitar comidas grasas la noche anterior.', activo: true },

    // 4. NOMENCLADOR ODONTOLÓGICO
    { id: 'nom-odo-1', clinica_id: 'clinica-1', tipo_nomenclador: 'ODONTOLOGICO', codigo_pmo: '01.01', descripcion: 'Consulta y Diagnóstico Bucodental con Ficha Odontológica', duracion_minutos: 25, valor_particular: 15000, coseguro_defecto: 0, capitulo_odontologia: '01 - Consultas', requiere_orden: false, requiere_autorizacion: false, instrucciones_preparacion: 'Higiene dental previa a la consulta.', activo: true },
    { id: 'nom-odo-2', clinica_id: 'clinica-1', tipo_nomenclador: 'ODONTOLOGICO', codigo_pmo: '02.01', descripcion: 'Restauración Operatoria con Resina Fotocurable (Composite)', duracion_minutos: 35, valor_particular: 28000, coseguro_defecto: 3000, capitulo_odontologia: '02 - Operatoria Dental', requiere_orden: false, requiere_autorizacion: true, instrucciones_preparacion: 'Indicar pieza y caras afectadas.', activo: true },
    { id: 'nom-odo-3', clinica_id: 'clinica-1', tipo_nomenclador: 'ODONTOLOGICO', codigo_pmo: '03.01', descripcion: 'Tratamiento de Conducto Unirradicular (Endodoncia)', duracion_minutos: 45, valor_particular: 48000, coseguro_defecto: 6000, capitulo_odontologia: '03 - Endodoncia', requiere_orden: false, requiere_autorizacion: true, instrucciones_preparacion: 'Presentar radiografía periapical previa.', activo: true },
    { id: 'nom-odo-4', clinica_id: 'clinica-1', tipo_nomenclador: 'ODONTOLOGICO', codigo_pmo: '08.01', descripcion: 'Radiografía Periapical Diagnóstica', duracion_minutos: 15, valor_particular: 8000, coseguro_defecto: 1000, capitulo_odontologia: '08 - Radiología Dental', requiere_orden: false, requiere_autorizacion: false, instrucciones_preparacion: 'Sin elementos metálicos en la boca.', activo: true }
  ],
  convenios_coseguros: [
    { id: 'cov-1', plan_id: 'pl-5', practica_id: 'nom-3', monto_coseguro: 3000, cubierto_100: false, observaciones: 'Coseguro reducido para SMG20' },
    { id: 'cov-2', plan_id: 'pl-5', practica_id: 'nom-4', monto_coseguro: 4500, cubierto_100: false, observaciones: 'Requiere bono digital' },
    { id: 'cov-3', plan_id: 'pl-apross-1', practica_id: 'nom-psi-2', monto_coseguro: 2000, cubierto_100: false, observaciones: 'Copago APROSS Psicología individual' },
    { id: 'cov-4', plan_id: 'pl-cppc-1', practica_id: 'nom-psi-2', monto_coseguro: 1500, cubierto_100: false, observaciones: 'Convenio Colegio de Psicólogos' }
  ],
  profesionales: [
    {
      id: 'prof-psi-1',
      clinica_id: 'clinica-1',
      sedes_ids: ['clinica-1', 'clinica-2', 'clinica-3', 'clinica-4'],
      nombre: 'Sofía',
      apellido: 'Albarracín',
      matricula_provincial: 'M.P. 10.492 CPPC',
      matricula_nacional: 'MN 49.201',
      especialidad: 'Psicología y Salud Mental',
      especialidad_id: 'esp-0',
      servicios_ids: ['serv-0a', 'serv-0b', 'serv-0c'],
      email: 'salbarracin@centrosanlucas.com.ar',
      telefono: '351 552-8811',
      duracion_turno_minutos: 45,
      max_sobreturnos_dia: 2,
      color_agenda: '#6366f1',
      obras_sociales_ids: ['os-1', 'os-apross', 'os-cppc', 'os-2', 'os-3', 'os-4'],
      atiende_particular: true,
      atiende_online: true,
      activo: true
    },
    {
      id: 'prof-psi-2',
      clinica_id: 'clinica-1',
      sedes_ids: ['clinica-1', 'clinica-2'],
      nombre: 'Gonzalo',
      apellido: 'Maidana',
      matricula_provincial: 'M.P. 8.921 CPPC',
      matricula_nacional: 'MN 42.110',
      especialidad: 'Psicología y Salud Mental',
      especialidad_id: 'esp-0',
      servicios_ids: ['serv-0a', 'serv-0c'],
      email: 'gmaidana@centrosanlucas.com.ar',
      telefono: '351 619-3322',
      duracion_turno_minutos: 50,
      max_sobreturnos_dia: 2,
      color_agenda: '#8b5cf6',
      obras_sociales_ids: ['os-1', 'os-apross', 'os-cppc', 'os-2'],
      atiende_particular: true,
      atiende_online: true,
      activo: true
    },
    {
      id: 'prof-1786315328730',
      clinica_id: 'clinica-1',
      sedes_ids: ['clinica-1', 'clinica-2', 'clinica-3', 'clinica-4'],
      nombre: 'Nahuel',
      apellido: 'López',
      matricula_provincial: 'M.P. 9.871 CPPC',
      matricula_nacional: 'MN 46.520',
      especialidad: 'Psicología y Salud Mental',
      especialidad_id: 'esp-0',
      servicios_ids: ['serv-1786315370753'],
      email: 'nlopez@saludnet.com.ar',
      telefono: '351 445-9922',
      duracion_turno_minutos: 60,
      max_sobreturnos_dia: 2,
      color_agenda: '#0ea5e9',
      obras_sociales_ids: ['os-sancor', 'os-apross', 'os-cppc', 'os-1', 'os-2', 'os-3'],
      atiende_particular: true,
      atiende_online: true,
      activo: true
    }
  ],
  horarios: [
    // Lic. Nahuel López: Horarios Reales desde las 09:00 hs
    { id: 'h-lopez-aipaa-lun', profesional_id: 'prof-1786315328730', clinica_id: 'clinica-1', servicio_id: 'serv-1786315370753', consultorio_id: 'c-1-1', dia_semana: 1, hora_inicio: '09:00', hora_fin: '20:00', duracion_slot_min: 60, modalidad: 'PRESENCIAL', activo: true },
    { id: 'h-lopez-colon-mar', profesional_id: 'prof-1786315328730', clinica_id: 'clinica-2', servicio_id: 'serv-1786315370753', consultorio_id: 'c-2-1', dia_semana: 2, hora_inicio: '09:00', hora_fin: '14:00', duracion_slot_min: 45, modalidad: 'PRESENCIAL', activo: true },
    { id: 'h-lopez-inti-mar', profesional_id: 'prof-1786315328730', clinica_id: 'clinica-3', servicio_id: 'serv-1786315370753', consultorio_id: 'c-3-1', dia_semana: 2, hora_inicio: '14:00', hora_fin: '20:00', duracion_slot_min: 60, modalidad: 'PRESENCIAL', activo: true },
    { id: 'h-lopez-aipaa-mie', profesional_id: 'prof-1786315328730', clinica_id: 'clinica-1', servicio_id: 'serv-1786315370753', consultorio_id: 'c-1-1', dia_semana: 3, hora_inicio: '11:00', hora_fin: '20:00', duracion_slot_min: 60, modalidad: 'PRESENCIAL', activo: true },
    { id: 'h-lopez-online-jue', profesional_id: 'prof-1786315328730', clinica_id: 'clinica-4', servicio_id: 'serv-1786315370753', consultorio_id: 'c-4-1', dia_semana: 4, hora_inicio: '09:00', hora_fin: '12:00', duracion_slot_min: 60, modalidad: 'ONLINE', activo: true },
    { id: 'h-lopez-aipaa-jue', profesional_id: 'prof-1786315328730', clinica_id: 'clinica-1', servicio_id: 'serv-1786315370753', consultorio_id: 'c-1-1', dia_semana: 4, hora_inicio: '13:00', hora_fin: '20:00', duracion_slot_min: 60, modalidad: 'PRESENCIAL', activo: true },
    { id: 'h-lopez-colon-vie', profesional_id: 'prof-1786315328730', clinica_id: 'clinica-2', servicio_id: 'serv-1786315370753', consultorio_id: 'c-2-1', dia_semana: 5, hora_inicio: '09:00', hora_fin: '12:00', duracion_slot_min: 60, modalidad: 'PRESENCIAL', activo: true },
    { id: 'h-lopez-inti-vie', profesional_id: 'prof-1786315328730', clinica_id: 'clinica-3', servicio_id: 'serv-1786315370753', consultorio_id: 'c-3-1', dia_semana: 5, hora_inicio: '13:00', hora_fin: '20:00', duracion_slot_min: 60, modalidad: 'PRESENCIAL', activo: true }
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
    "id": "pac-1787870676906",
    "clinica_id": "clinica-1",
    "dni": "35894120",
    "nombre": "Agustina",
    "apellido": "Benítez",
    "nombre_completo": "Agustina Benítez",
    "edad": 29,
    "telefono_whatsapp": "+54 9 351 552-3344",
    "email": "agustina.benitez@gmail.com",
    "domicilio": "Av. Colón 1400, Córdoba",
    "obra_social_id": "os-sancor",
    "obra_social_nombre": "Sancor Salud",
    "plan_id": "pl-sancor-500",
    "plan_nombre": "Plan 500",
    "numero_afiliado": "1350025",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "2026-08-20T10:00:00Z"
    },
    "marca_temporal_registro": "2026-08-20 10:00:00",
    "alergias": "",
    "antecedentes": "Psicología Clínica",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-41679246",
    "clinica_id": "clinica-1",
    "dni": "41679246",
    "nombre": "Anastasia",
    "apellido": "Molina",
    "nombre_completo": "Anastasia molina",
    "edad": "",
    "telefono_whatsapp": "3888670604",
    "email": "anastasiamolina06@gmail.com",
    "domicilio": "Tristán Narvaja 2389",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755501-1743",
        "nombre": "Contacto de Urgencias",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3888403804",
        "es_principal": true,
        "notas": "3888403804"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "05/04/2023"
    },
    "marca_temporal_registro": "05/04/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-35018580",
    "clinica_id": "clinica-1",
    "dni": "35018580",
    "nombre": "Romina Scolari",
    "apellido": "Ivana",
    "nombre_completo": "Ivana Romina Scolari",
    "edad": "",
    "telefono_whatsapp": "3512519314",
    "email": "scolariromi@gmail.com",
    "domicilio": "Barrio San Martín",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755501-4025",
        "nombre": "Cinthia",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3513230725",
        "es_principal": true,
        "notas": "3513230725 Cinthia"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "APROSS y DASPU"
    },
    "obra_social_id": "os-apross",
    "obra_social_nombre": "APROSS",
    "plan_id": "",
    "plan_nombre": "Directo / Adherentes",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "06/04/2023"
    },
    "marca_temporal_registro": "06/04/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-35636703",
    "clinica_id": "clinica-1",
    "dni": "35636703",
    "nombre": "Martín Nicolas",
    "apellido": "Guevara",
    "nombre_completo": "Guevara Martín Nicolas",
    "edad": "",
    "telefono_whatsapp": "3548500456",
    "email": "mniguevara0702@gmail.com",
    "domicilio": "Roque Sáenz Peña 860",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755502-8403",
        "nombre": "Liliana Guevara",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "+54 9 3548 43-0261",
        "es_principal": true,
        "notas": "+54 9 3548 43-0261 Liliana guevara"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "08/04/2023"
    },
    "marca_temporal_registro": "08/04/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-36925195",
    "clinica_id": "clinica-1",
    "dni": "36925195",
    "nombre": "Miguel Angel",
    "apellido": "Pérez Arevalo",
    "nombre_completo": "Miguel angel Pérez arevalo",
    "edad": "",
    "telefono_whatsapp": "3518751215",
    "email": "letreroselfaro@gmail.com",
    "domicilio": "Mza 10 lote 39 barrio cabildo anexo",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755502-845",
        "nombre": "Contacto de Urgencias",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3518751215",
        "es_principal": true,
        "notas": "3518751215"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "EMI emergencia"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "09/04/2023"
    },
    "marca_temporal_registro": "09/04/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-29475270",
    "clinica_id": "clinica-1",
    "dni": "29475270",
    "nombre": "Benjamín Rumualdo",
    "apellido": "Facundo",
    "nombre_completo": "Facundo Benjamín Rumualdo",
    "edad": "",
    "telefono_whatsapp": "3517592480",
    "email": "rumualdofacundo@gmail.com",
    "domicilio": "Molinari Romero 1253 piso 2",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755502-950",
        "nombre": "Contacto de Urgencias",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3516843876",
        "es_principal": true,
        "notas": "3516843876"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "11/04/2023"
    },
    "marca_temporal_registro": "11/04/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-41265488",
    "clinica_id": "clinica-1",
    "dni": "41265488",
    "nombre": "Emanuel Heredia",
    "apellido": "Leandro",
    "nombre_completo": "Leandro emanuel Heredia",
    "edad": "",
    "telefono_whatsapp": "3516564800",
    "email": "leandroheredia1998@gmail.com",
    "domicilio": "Pincen 750",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755502-9431",
        "nombre": "Veronica Heredia",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "0351 6658267",
        "es_principal": true,
        "notas": "Veronica Heredia - 0351 6658267"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "11/04/2023"
    },
    "marca_temporal_registro": "11/04/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-44673515",
    "clinica_id": "clinica-1",
    "dni": "44673515",
    "nombre": "Emanuel Giovanini",
    "apellido": "Matias",
    "nombre_completo": "Matias Emanuel Giovanini",
    "edad": "",
    "telefono_whatsapp": "3536561289",
    "email": "matiasgiova03@gmail.com",
    "domicilio": "Malagueño. Valle del Golf, Manzana 27 Lote 5",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755502-5042",
        "nombre": "Carina Priotti",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3532403259",
        "es_principal": true,
        "notas": "3532403259 Carina Priotti"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "15/04/2023"
    },
    "marca_temporal_registro": "15/04/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-43714129",
    "clinica_id": "clinica-1",
    "dni": "43714129",
    "nombre": "Mateo",
    "apellido": "Pompei",
    "nombre_completo": "Mateo Pompei",
    "edad": "",
    "telefono_whatsapp": "3462414856",
    "email": "mateopompei@gmail.com",
    "domicilio": "Obispo Oro 440, 11F",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755502-6423",
        "nombre": "Maria Ines Arloro",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3462 41 9845",
        "es_principal": true,
        "notas": "Maria Ines Arloro 3462 41 9845"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Gea Mill"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "15/04/2023"
    },
    "marca_temporal_registro": "15/04/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-41951364",
    "clinica_id": "clinica-1",
    "dni": "41951364",
    "nombre": "Adrián Paredes",
    "apellido": "Ramiro",
    "nombre_completo": "Ramiro Adrián Paredes",
    "edad": "",
    "telefono_whatsapp": "2901486840",
    "email": "rami2013.ar@gmail.com",
    "domicilio": "Montevideo 835",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755502-4506",
        "nombre": "Contacto de Urgencias",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "2901486840",
        "es_principal": true,
        "notas": "2901486840"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Apross"
    },
    "obra_social_id": "os-apross",
    "obra_social_nombre": "APROSS",
    "plan_id": "",
    "plan_nombre": "Directo / Adherentes",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "15/04/2023"
    },
    "marca_temporal_registro": "15/04/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-39935266",
    "clinica_id": "clinica-1",
    "dni": "39935266",
    "nombre": "Javier Nahuel",
    "apellido": "Li Palomino",
    "nombre_completo": "Javier Nahuel Li Palomino",
    "edad": "",
    "telefono_whatsapp": "3517461222",
    "email": "nahuel.lipalomino96@gmail.com",
    "domicilio": "Belgrano 1178",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755503-6297",
        "nombre": "Yesi",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3512663870",
        "es_principal": true,
        "notas": "Yesi 3512663870"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "18/04/2023"
    },
    "marca_temporal_registro": "18/04/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-42219395",
    "clinica_id": "clinica-1",
    "dni": "42219395",
    "nombre": "Gianfranco",
    "apellido": "Gioda",
    "nombre_completo": "Gianfranco Gioda",
    "edad": "",
    "telefono_whatsapp": "3571617563",
    "email": "giangioda6@gmail.com",
    "domicilio": "Parana 657",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755503-5770",
        "nombre": "Marcela",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3571327802",
        "es_principal": true,
        "notas": "Marcela 3571327802"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "19/04/2023"
    },
    "marca_temporal_registro": "19/04/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-41482286",
    "clinica_id": "clinica-1",
    "dni": "41482286",
    "nombre": "Franco Bruno",
    "apellido": "Emanuel Orsi",
    "nombre_completo": "Franco Bruno Emanuel Orsi",
    "edad": "",
    "telefono_whatsapp": "3517335464",
    "email": "francoorsi23@gmail.com",
    "domicilio": "Pizarro 5031 -B° Inaudi",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755503-8919",
        "nombre": "Norma",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3512534486",
        "es_principal": true,
        "notas": "3512534486 norma"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "24/04/2023"
    },
    "marca_temporal_registro": "24/04/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-42388425",
    "clinica_id": "clinica-1",
    "dni": "42388425",
    "nombre": "Nicolas",
    "apellido": "Quiñones",
    "nombre_completo": "Nicolas Quiñones",
    "edad": "",
    "telefono_whatsapp": "3564578688",
    "email": "quinonesnhhmm@gmail.com",
    "domicilio": "Buenos aires 810 2 D",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755503-9974",
        "nombre": "Cecilia",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3564584752",
        "es_principal": true,
        "notas": "3564584752 cecilia"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Apross"
    },
    "obra_social_id": "os-apross",
    "obra_social_nombre": "APROSS",
    "plan_id": "",
    "plan_nombre": "Directo / Adherentes",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "26/04/2023"
    },
    "marca_temporal_registro": "26/04/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-45328364",
    "clinica_id": "clinica-1",
    "dni": "45328364",
    "nombre": "Guadalupe",
    "apellido": "Monzón",
    "nombre_completo": "Guadalupe Monzón",
    "edad": "",
    "telefono_whatsapp": "3884802080",
    "email": "guadamm19@gmail.com",
    "domicilio": "Illia 336 esquina chacabuco",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755503-9804",
        "nombre": "Patricia (madre)",
        "relacion": "Madre",
        "telefono": "3884102723",
        "es_principal": true,
        "notas": "3884102723 Patricia (Madre)"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "29/04/2023"
    },
    "marca_temporal_registro": "29/04/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-39805557",
    "clinica_id": "clinica-1",
    "dni": "39805557",
    "nombre": "Ezequiel Santillan",
    "apellido": "Matias",
    "nombre_completo": "Matias Ezequiel Santillan",
    "edad": "",
    "telefono_whatsapp": "3513044224",
    "email": "matias.santillan.2121@gmail.com",
    "domicilio": "Duartes quiros 251",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755503-1683",
        "nombre": "Andres Santillan",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3834 648044",
        "es_principal": true,
        "notas": "3834 648044 Andres Santillan"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "08/05/2023"
    },
    "marca_temporal_registro": "08/05/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-40836103",
    "clinica_id": "clinica-1",
    "dni": "40836103",
    "nombre": "Gonzalo Agustin",
    "apellido": "Gauna Cuevas",
    "nombre_completo": "Gonzalo Agustin Gauna Cuevas",
    "edad": "",
    "telefono_whatsapp": "3517612049",
    "email": "gonzalocuevas97@gmail.com",
    "domicilio": "Obispo Salguero 156",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755503-17",
        "nombre": "Florencia",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "+54 9 2995 00-9348",
        "es_principal": true,
        "notas": "+54 9 2995 00-9348 Florencia"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "08/05/2023"
    },
    "marca_temporal_registro": "08/05/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-43281863",
    "clinica_id": "clinica-1",
    "dni": "43281863",
    "nombre": "Lautaro",
    "apellido": "Jesus",
    "nombre_completo": "Lautaro Jesus",
    "edad": "",
    "telefono_whatsapp": "3564376319",
    "email": "mejiasboscarol304@gmail.com",
    "domicilio": "Mariano Regueiro 340",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755503-5098",
        "nombre": "Candela",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3564650465",
        "es_principal": true,
        "notas": "3564650465 Candela"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "10/05/2023"
    },
    "marca_temporal_registro": "10/05/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-35524514",
    "clinica_id": "clinica-1",
    "dni": "35524514",
    "nombre": "Emanuel Lascano",
    "apellido": "Luca",
    "nombre_completo": "Luca Emanuel Lascano",
    "edad": "",
    "telefono_whatsapp": "3512385925",
    "email": "lascano.emanuel@gmail.com",
    "domicilio": "Jujuy 1924 depto 5 alta Córdoba",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755503-3667",
        "nombre": "Agustina",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "351 530-2784",
        "es_principal": true,
        "notas": "Agustina  351 530-2784"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "12/05/2023"
    },
    "marca_temporal_registro": "12/05/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-96230212",
    "clinica_id": "clinica-1",
    "dni": "96230212",
    "nombre": "Angelo Gabriel",
    "apellido": "Pineda Patiño",
    "nombre_completo": "Angelo gabriel Pineda Patiño",
    "edad": "",
    "telefono_whatsapp": "3518629812",
    "email": "pinedaangelo852@gmail.com",
    "domicilio": "Domuyo 1957 zona ruta 20",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755503-965",
        "nombre": "Francis",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3513506086",
        "es_principal": true,
        "notas": "Francis 3513506086"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "13/05/2023"
    },
    "marca_temporal_registro": "13/05/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-42048879",
    "clinica_id": "clinica-1",
    "dni": "42048879",
    "nombre": "Bruno",
    "apellido": "Salinas",
    "nombre_completo": "Bruno salinas",
    "edad": "",
    "telefono_whatsapp": "3544430255",
    "email": "chipisalinas1@mail.com",
    "domicilio": "Villa dolores",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755503-823",
        "nombre": "Contacto de Urgencias",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3544465471",
        "es_principal": true,
        "notas": "3544465471"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "14/05/2023"
    },
    "marca_temporal_registro": "14/05/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-45474303",
    "clinica_id": "clinica-1",
    "dni": "45474303",
    "nombre": "Federico Helmut",
    "apellido": "Kiessling Corradi",
    "nombre_completo": "Federico Helmut Kiessling Corradi",
    "edad": "",
    "telefono_whatsapp": "5492665038179",
    "email": "federico.hkiessling@gmail.com",
    "domicilio": "Independencia 1017, Departamento 7A",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755503-1566",
        "nombre": ", Roberto Kiessling",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "2665033350",
        "es_principal": true,
        "notas": "2665033350, Roberto Kiessling"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "14/05/2023"
    },
    "marca_temporal_registro": "14/05/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-40679200",
    "clinica_id": "clinica-1",
    "dni": "40679200",
    "nombre": "Dri Furlan",
    "apellido": "Sofía",
    "nombre_completo": "Sofía Dri Furlan",
    "edad": "",
    "telefono_whatsapp": "3525489380",
    "email": "sofiabelendri@gmail.com",
    "domicilio": "Tucumán 1216 Jesús Maria",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755503-5182",
        "nombre": "Monica Furlan (madre)",
        "relacion": "Madre",
        "telefono": "3525476976",
        "es_principal": true,
        "notas": "Monica Furlan (madre) 3525476976"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "19/05/2023"
    },
    "marca_temporal_registro": "19/05/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-39621665",
    "clinica_id": "clinica-1",
    "dni": "39621665",
    "nombre": "Hernan Avila",
    "apellido": "David",
    "nombre_completo": "David Hernan Avila",
    "edad": "",
    "telefono_whatsapp": "3516315950",
    "email": "aviladavid1921@gmail.com",
    "domicilio": "Peteroa 1921",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755503-3414",
        "nombre": "Judith",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3576 46-8090",
        "es_principal": true,
        "notas": "3576 46-8090 Judith"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "29/05/2023"
    },
    "marca_temporal_registro": "29/05/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-41695029",
    "clinica_id": "clinica-1",
    "dni": "41695029",
    "nombre": "Mateo",
    "apellido": "Julian",
    "nombre_completo": "Mateo Julian",
    "edad": "",
    "telefono_whatsapp": "3572527173",
    "email": "mateolombardo99@hotmail.com",
    "domicilio": "Pilar (Zenaida Cabrera 1735)",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-2729",
        "nombre": "Contacto de Urgencias",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3572615731",
        "es_principal": true,
        "notas": "3572615731"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "29/05/2023"
    },
    "marca_temporal_registro": "29/05/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-40686241",
    "clinica_id": "clinica-1",
    "dni": "40686241",
    "nombre": "Aldana",
    "apellido": "Guanca",
    "nombre_completo": "Aldana Guanca",
    "edad": "",
    "telefono_whatsapp": "3512824056",
    "email": "aldanaguanca97@gmail.com",
    "domicilio": "Padre L Monti 2257",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-2338",
        "nombre": "Contacto de Urgencias",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3513626748",
        "es_principal": true,
        "notas": "3513626748"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "01/06/2023"
    },
    "marca_temporal_registro": "01/06/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-41267323",
    "clinica_id": "clinica-1",
    "dni": "41267323",
    "nombre": "Jorge Brian",
    "apellido": "Matis Gonzalez",
    "nombre_completo": "Jorge Brian Matis Gonzalez",
    "edad": "",
    "telefono_whatsapp": "3513192390",
    "email": "jorgematisgonzalez@gmail.com",
    "domicilio": "Ituzaingó 572 PB 5",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-1741",
        "nombre": "Maira",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "2974934737",
        "es_principal": true,
        "notas": "Maira 2974934737"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "02/06/2023"
    },
    "marca_temporal_registro": "02/06/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-37619499",
    "clinica_id": "clinica-1",
    "dni": "37619499",
    "nombre": "Yohana",
    "apellido": "Bazan",
    "nombre_completo": "Yohana Bazan",
    "edad": "",
    "telefono_whatsapp": "3513979765",
    "email": "powiibazan@icloud.com",
    "domicilio": "Luis de Góngora 1534, córdoba capital.",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-537",
        "nombre": "Liliana",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3513420262",
        "es_principal": true,
        "notas": "Liliana 3513420262"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Emi"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "02/06/2023"
    },
    "marca_temporal_registro": "02/06/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-43696709",
    "clinica_id": "clinica-1",
    "dni": "43696709",
    "nombre": "Héctor Leandro",
    "apellido": "Acosta Janchik",
    "nombre_completo": "Héctor Leandro Acosta Janchik",
    "edad": "",
    "telefono_whatsapp": "3644347096",
    "email": "leandrojanchik16@gmail.com",
    "domicilio": "Pje Rafael Escuti 847",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-7172",
        "nombre": "\" (madre)",
        "relacion": "Madre",
        "telefono": "3644545729",
        "es_principal": true,
        "notas": "\"3644545729 (madre)"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "351 812-8528 (pareja)\""
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "03/06/2023"
    },
    "marca_temporal_registro": "03/06/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-45956787",
    "clinica_id": "clinica-1",
    "dni": "45956787",
    "nombre": "Valentina",
    "apellido": "Sin Apellido",
    "nombre_completo": "Valentina",
    "edad": "",
    "telefono_whatsapp": "3854176485",
    "email": "valenchutorres10@gmail.com",
    "domicilio": "Independencia 1446",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-9512",
        "nombre": "Paola Pons",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3854176485",
        "es_principal": true,
        "notas": "3854176485 Paola Pons"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "05/06/2023"
    },
    "marca_temporal_registro": "05/06/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-40419848",
    "clinica_id": "clinica-1",
    "dni": "40419848",
    "nombre": "Gaston Carlos",
    "apellido": "Eduardo Frances",
    "nombre_completo": "Gaston Carlos Eduardo Frances",
    "edad": "",
    "telefono_whatsapp": "3541686952",
    "email": "gastifrances1@gmail.com",
    "domicilio": "Villa Carlos Paz, calle Almafuerte 252",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-1475",
        "nombre": ", Lucia",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "+54 9 3541 62-7203",
        "es_principal": true,
        "notas": "+54 9 3541 62-7203, Lucia"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "08/06/2023"
    },
    "marca_temporal_registro": "08/06/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-42124545",
    "clinica_id": "clinica-1",
    "dni": "42124545",
    "nombre": "Stefania Cravero",
    "apellido": "Daiana",
    "nombre_completo": "Daiana Stefania Cravero",
    "edad": "",
    "telefono_whatsapp": "3513457818",
    "email": "daicravero99@gmail.com",
    "domicilio": "Avenida Pueyrredón 1449",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-8789",
        "nombre": "Franco",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3512635305",
        "es_principal": true,
        "notas": "Franco 3512635305"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "13/06/2023"
    },
    "marca_temporal_registro": "13/06/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-95818302",
    "clinica_id": "clinica-1",
    "dni": "95818302",
    "nombre": "Paolo",
    "apellido": "Morales",
    "nombre_completo": "Paolo Morales",
    "edad": "",
    "telefono_whatsapp": "3518641303",
    "email": "paolo.ifs@gmail.com",
    "domicilio": "Arturo M Bas 555",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-427",
        "nombre": "Pablo Corbalán",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "+54 9 387 574-0787",
        "es_principal": true,
        "notas": "+54 9 387 574-0787 Pablo Corbalán"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "08/09/2023"
    },
    "marca_temporal_registro": "08/09/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-45956868",
    "clinica_id": "clinica-1",
    "dni": "45956868",
    "nombre": "Lucila",
    "apellido": "Esper",
    "nombre_completo": "Lucila esper",
    "edad": "",
    "telefono_whatsapp": "385155838219",
    "email": "lucilaesper6@gmail.com",
    "domicilio": "Obispo oro 440",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-1766",
        "nombre": "Mariela Gerez Gonzalez",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "0385155355367",
        "es_principal": true,
        "notas": "0385155355367 Mariela Gerez Gonzalez"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "09/09/2023"
    },
    "marca_temporal_registro": "09/09/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-42854921",
    "clinica_id": "clinica-1",
    "dni": "42854921",
    "nombre": "Abigail Molina",
    "apellido": "Virginia",
    "nombre_completo": "Virginia Abigail Molina",
    "edad": "",
    "telefono_whatsapp": "3517064068",
    "email": "virgimolina.musica@gmail.com",
    "domicilio": "William bragg 5768",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-4981",
        "nombre": "Luis Molina",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3516603980",
        "es_principal": true,
        "notas": "3516603980 Luis Molina"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "OSPEDYC"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "06/10/2023"
    },
    "marca_temporal_registro": "06/10/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-46493979",
    "clinica_id": "clinica-1",
    "dni": "46493979",
    "nombre": "Martin Bide",
    "apellido": "Juan",
    "nombre_completo": "Juan Martin Bide",
    "edad": "",
    "telefono_whatsapp": "3462593235",
    "email": "juanmartinbide@gmail.com",
    "domicilio": "Santa Rosa 878",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-7435",
        "nombre": "Contacto de Urgencias",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "03462665992",
        "es_principal": true,
        "notas": "03462665992"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "10/10/2023"
    },
    "marca_temporal_registro": "10/10/2023",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-43128354",
    "clinica_id": "clinica-1",
    "dni": "43128354",
    "nombre": "Valentin",
    "apellido": "Giacovero",
    "nombre_completo": "Valentin Giacovero",
    "edad": "",
    "telefono_whatsapp": "3416906360",
    "email": "valenn2197@gmail.com",
    "domicilio": "Obispo Trejo 1370",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-4124",
        "nombre": "Claudia",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3415807742",
        "es_principal": true,
        "notas": "3415807742 Claudia"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Avalian"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "21/01/2024"
    },
    "marca_temporal_registro": "21/01/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-41762764",
    "clinica_id": "clinica-1",
    "dni": "41762764",
    "nombre": "Jorge Pedro",
    "apellido": "Pablo Rodriguez Belvedere",
    "nombre_completo": "Jorge Pedro Pablo Rodriguez Belvedere",
    "edad": "",
    "telefono_whatsapp": "3516657837",
    "email": "pedrorobel3@gmail.com",
    "domicilio": "Punta del Sauce 2318",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-8583",
        "nombre": "Mercedes Belvedere",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3516450385",
        "es_principal": true,
        "notas": "3516450385 - Mercedes Belvedere"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "23/02/2024"
    },
    "marca_temporal_registro": "23/02/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-36433261",
    "clinica_id": "clinica-1",
    "dni": "36433261",
    "nombre": "Evelyn Correa",
    "apellido": "Soledad",
    "nombre_completo": "Soledad Evelyn Correa",
    "edad": "",
    "telefono_whatsapp": "3514591831",
    "email": "soledadevelyncorrea17@gmail.com",
    "domicilio": "Felix de zuñiga 3938",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-3703",
        "nombre": "Alexis",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3517666902",
        "es_principal": true,
        "notas": "3517666902 alexis"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "14/03/2024"
    },
    "marca_temporal_registro": "14/03/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-37733714",
    "clinica_id": "clinica-1",
    "dni": "37733714",
    "nombre": "Martin Nuñez",
    "apellido": "Favio",
    "nombre_completo": "Favio Martin Nuñez",
    "edad": "",
    "telefono_whatsapp": "3516375614",
    "email": "faviomartin127@gmail.com",
    "domicilio": "Santa Rosa 1016",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-8739",
        "nombre": "Luciana Nuñez (hermana)",
        "relacion": "Hermano/a",
        "telefono": "3512783185",
        "es_principal": true,
        "notas": "3512783185 - Luciana Nuñez (hermana)"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Omint"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "15/03/2024"
    },
    "marca_temporal_registro": "15/03/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-45484141",
    "clinica_id": "clinica-1",
    "dni": "45484141",
    "nombre": "Maira Jofre",
    "apellido": "Sofía",
    "nombre_completo": "Sofía Maira Jofre",
    "edad": "",
    "telefono_whatsapp": "3541335331",
    "email": "sofia.jofre225@gmail.com",
    "domicilio": "Antonio Asili, 720 (Comuna San Roque, Córdoba)",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-1777",
        "nombre": "Yolanda (madre)",
        "relacion": "Madre",
        "telefono": "351-6651428",
        "es_principal": true,
        "notas": "Yolanda (madre) 351-6651428"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "04/04/2024"
    },
    "marca_temporal_registro": "04/04/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-40521760",
    "clinica_id": "clinica-1",
    "dni": "40521760",
    "nombre": "Florencia Cabrera",
    "apellido": "Cintia",
    "nombre_completo": "Cintia florencia cabrera",
    "edad": "",
    "telefono_whatsapp": "3518781018",
    "email": "Flor43601@gmail.com",
    "domicilio": "Henderson 5477 b° carrara",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-2458",
        "nombre": "Victoria (abuela Materna De Maite)",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3517588053",
        "es_principal": true,
        "notas": "3517588053 victoria (Abuela Materna de Maite)"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "12/04/2024"
    },
    "marca_temporal_registro": "12/04/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-42783483",
    "clinica_id": "clinica-1",
    "dni": "42783483",
    "nombre": "Borja Manuel",
    "apellido": "Pedraza Canaves",
    "nombre_completo": "Borja Manuel Pedraza Canaves",
    "edad": "",
    "telefono_whatsapp": "3571323954",
    "email": "borjamanuelpedraza@gmail.com",
    "domicilio": "La plata 870",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-2850",
        "nombre": "Rocío",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "+54 9 358 431-8293",
        "es_principal": true,
        "notas": "+54 9 358 431-8293 rocío"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "17/04/2024"
    },
    "marca_temporal_registro": "17/04/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-38409106",
    "clinica_id": "clinica-1",
    "dni": "38409106",
    "nombre": "Javier Rojo",
    "apellido": "Ignacio",
    "nombre_completo": "Ignacio Javier Rojo",
    "edad": "",
    "telefono_whatsapp": "3516151648",
    "email": "ignaciorojo94@hotmail.com",
    "domicilio": "Gualilan 4643 barrio empalme",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-9899",
        "nombre": "Paola",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3516327590",
        "es_principal": true,
        "notas": "3516327590 Paola"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "24/04/2024"
    },
    "marca_temporal_registro": "24/04/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-46031535",
    "clinica_id": "clinica-1",
    "dni": "46031535",
    "nombre": "Miranda Ambrosi",
    "apellido": "Ornella",
    "nombre_completo": "Ornella Miranda Ambrosi",
    "edad": "",
    "telefono_whatsapp": "3513091450",
    "email": "ornella.ambrosi@mi.unc.edu.ar",
    "domicilio": "Luis braile 2030",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-5996",
        "nombre": "Hugo (padre)",
        "relacion": "Padre",
        "telefono": "3513020543",
        "es_principal": true,
        "notas": "Hugo (padre): 3513020543"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "26/04/2024"
    },
    "marca_temporal_registro": "26/04/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-96256698",
    "clinica_id": "clinica-1",
    "dni": "96256698",
    "nombre": "Elia Soledad",
    "apellido": "Mendoza Ocampo",
    "nombre_completo": "Elia Soledad Mendoza Ocampo",
    "edad": "",
    "telefono_whatsapp": "3512109872",
    "email": "soledadocampo72@gmail.com",
    "domicilio": "Ampliación Rosedal. Octaviano Navarro#2689",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-4169",
        "nombre": "Contacto de Urgencias",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3518087122",
        "es_principal": true,
        "notas": "3518087122"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "14/05/2024"
    },
    "marca_temporal_registro": "14/05/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-36143001",
    "clinica_id": "clinica-1",
    "dni": "36143001",
    "nombre": "Ines Torres",
    "apellido": "Marina",
    "nombre_completo": "Marina Ines Torres",
    "edad": "",
    "telefono_whatsapp": "3516293863",
    "email": "torres.marinaines@gmail.com",
    "domicilio": "Pública 14 n°4289, Carrara de Horizonte Norte",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-3178",
        "nombre": "Silvana Si Ascenzi ( Prima)",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3516970633",
        "es_principal": true,
        "notas": "Silvana Si Ascenzi 3516970633( Prima)"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Solesac Salud"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "20/05/2024"
    },
    "marca_temporal_registro": "20/05/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-24692769",
    "clinica_id": "clinica-1",
    "dni": "24692769",
    "nombre": "Paola Donini",
    "apellido": "Grisel",
    "nombre_completo": "Grisel Paola donini",
    "edad": "",
    "telefono_whatsapp": "3517516197",
    "email": "grselh346@gmail.com",
    "domicilio": "Olivares 3519. Barrio:matienzo",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-9386",
        "nombre": "Mirta Madre",
        "relacion": "Madre",
        "telefono": "3513333000",
        "es_principal": true,
        "notas": "3513333000/ Mirta madre"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Ecco"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "19/06/2024"
    },
    "marca_temporal_registro": "19/06/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-32456916",
    "clinica_id": "clinica-1",
    "dni": "32456916",
    "nombre": "Leonardo Gala",
    "apellido": "Luna Valverde",
    "nombre_completo": "Leonardo Gala Luna Valverde",
    "edad": "",
    "telefono_whatsapp": "3518133000",
    "email": "pedritolunaporsiempre@gmail.com",
    "domicilio": "la rioja 1185",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-6864",
        "nombre": "Fernanda",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3512022202",
        "es_principal": true,
        "notas": "3512022202 Fernanda"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "10/07/2024"
    },
    "marca_temporal_registro": "10/07/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-36986482",
    "clinica_id": "clinica-1",
    "dni": "36986482",
    "nombre": "Giuliano",
    "apellido": "Buchieri",
    "nombre_completo": "Giuliano Buchieri",
    "edad": "",
    "telefono_whatsapp": "3515227354",
    "email": "giuliano.buchieri89@gmail.com",
    "domicilio": "Pastor Taboada 1237",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-6210",
        "nombre": "Jesica Buchieri",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "+54 9 3543 60-8963",
        "es_principal": true,
        "notas": "+54 9 3543 60-8963 Jesica Buchieri"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Swiss Medical"
    },
    "obra_social_id": "os-3",
    "obra_social_nombre": "Swiss Medical",
    "plan_id": "",
    "plan_nombre": "SMG20",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "23/07/2024"
    },
    "marca_temporal_registro": "23/07/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-41648675",
    "clinica_id": "clinica-1",
    "dni": "41648675",
    "nombre": "Rubén Villalba",
    "apellido": "Maximiliano",
    "nombre_completo": "Maximiliano Rubén Villalba",
    "edad": "",
    "telefono_whatsapp": "3518168853",
    "email": "maxirvillalba@gmail.com",
    "domicilio": "Los algarrobos 583",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-3815",
        "nombre": "Contacto de Urgencias",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3518198658",
        "es_principal": true,
        "notas": "3518198658"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "30/09/2024"
    },
    "marca_temporal_registro": "30/09/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-36522792",
    "clinica_id": "clinica-1",
    "dni": "36522792",
    "nombre": "Vera Cortez",
    "apellido": "Héctor Alberto",
    "nombre_completo": "Vera Cortez Héctor Alberto",
    "edad": "",
    "telefono_whatsapp": "2302500480",
    "email": "albvera9@gmail.com",
    "domicilio": "General Pico - La Pampa",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-1124",
        "nombre": "Mariana Vera (hermana)",
        "relacion": "Hermano/a",
        "telefono": "3804-523398",
        "es_principal": true,
        "notas": "3804-523398 Mariana Vera (Hermana)"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "04/10/2024"
    },
    "marca_temporal_registro": "04/10/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-47363869",
    "clinica_id": "clinica-1",
    "dni": "47363869",
    "nombre": "Florencia",
    "apellido": "Marchisone",
    "nombre_completo": "Florencia marchisone",
    "edad": "",
    "telefono_whatsapp": "3573513972",
    "email": "flormarchisone147@gmail.com",
    "domicilio": "Bv. Illia 654",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-776",
        "nombre": "Elio Rodríguez (pareja)",
        "relacion": "Pareja",
        "telefono": "3573 508085",
        "es_principal": true,
        "notas": "Elio Rodríguez (pareja) 3573 508085"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "11/11/2024"
    },
    "marca_temporal_registro": "11/11/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-40502924",
    "clinica_id": "clinica-1",
    "dni": "40502924",
    "nombre": "Alejandro Guzmán",
    "apellido": "Ricardo",
    "nombre_completo": "Ricardo Alejandro Guzmán",
    "edad": "",
    "telefono_whatsapp": "3517885925",
    "email": "ricardo096guz@gmail.com",
    "domicilio": "Avenida lo cóndores s/n, san Roque",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-2502",
        "nombre": "Juan",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3541283512",
        "es_principal": true,
        "notas": "3541283512 Juan"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "12/11/2024"
    },
    "marca_temporal_registro": "12/11/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-41158938",
    "clinica_id": "clinica-1",
    "dni": "41158938",
    "nombre": "Rocio",
    "apellido": "Sordo",
    "nombre_completo": "Rocio Sordo",
    "edad": "",
    "telefono_whatsapp": "3492228800",
    "email": "rociosordo9@gmail.com",
    "domicilio": "Buenos Aires 412",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-9155",
        "nombre": "Beatriz Machado (mamá)",
        "relacion": "Madre",
        "telefono": "3564578832",
        "es_principal": true,
        "notas": "Beatriz Machado (mamá) 3564578832"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "12/11/2024"
    },
    "marca_temporal_registro": "12/11/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-35055095",
    "clinica_id": "clinica-1",
    "dni": "35055095",
    "nombre": "Fabricio Saenz",
    "apellido": "Mauro",
    "nombre_completo": "Mauro fabricio saenz",
    "edad": "",
    "telefono_whatsapp": "3516362940",
    "email": "mauro_cba13@hotmail.com",
    "domicilio": "Jose gabino blanco 2962",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-1301",
        "nombre": "Vanessa",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3513160413",
        "es_principal": true,
        "notas": "3513160413 Vanessa"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "20/11/2024"
    },
    "marca_temporal_registro": "20/11/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-45081035",
    "clinica_id": "clinica-1",
    "dni": "45081035",
    "nombre": "Brenda",
    "apellido": "Gutierrez",
    "nombre_completo": "Brenda Gutierrez",
    "edad": "",
    "telefono_whatsapp": "3517475511",
    "email": "brenpayne536@gmail.com",
    "domicilio": "Villa boedo Manzana 17 lote 17",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-9425",
        "nombre": "Marcela(mamá)",
        "relacion": "Madre",
        "telefono": "3517662078",
        "es_principal": true,
        "notas": "Marcela(mamá) 3517662078"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "20/11/2024"
    },
    "marca_temporal_registro": "20/11/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-41152986",
    "clinica_id": "clinica-1",
    "dni": "41152986",
    "nombre": "Candelaria Suárez",
    "apellido": "María",
    "nombre_completo": "María Candelaria Suárez",
    "edad": "",
    "telefono_whatsapp": "3517912070",
    "email": "mmcandesuarez@gmail.com",
    "domicilio": "Arauco 669, Barrio 20 de junio",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-4375",
        "nombre": "Ivana Arbach",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3513538007",
        "es_principal": true,
        "notas": "3513538007 - Ivana Arbach"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Apross"
    },
    "obra_social_id": "os-apross",
    "obra_social_nombre": "APROSS",
    "plan_id": "",
    "plan_nombre": "Directo / Adherentes",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "03/12/2024"
    },
    "marca_temporal_registro": "03/12/2024",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-41520631",
    "clinica_id": "clinica-1",
    "dni": "41520631",
    "nombre": "Matias Juncos",
    "apellido": "Lorenzo",
    "nombre_completo": "Lorenzo Matias Juncos",
    "edad": "",
    "telefono_whatsapp": "3512811416",
    "email": "matiasjuncos23@gmail.com",
    "domicilio": "Darragueira 5055 B Dean Funes",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-9445",
        "nombre": "Marisa",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3512219494",
        "es_principal": true,
        "notas": "3512219494 Marisa"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "10/01/2025"
    },
    "marca_temporal_registro": "10/01/2025",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-40804155",
    "clinica_id": "clinica-1",
    "dni": "40804155",
    "nombre": "Diarte",
    "apellido": "Gaspar",
    "nombre_completo": "Diarte Gaspar",
    "edad": "",
    "telefono_whatsapp": "3704830800",
    "email": "gaspar10romano@gmail.com",
    "domicilio": "Bv Illia 446",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755504-2821",
        "nombre": "Rita",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3854356766",
        "es_principal": true,
        "notas": "3854356766 Rita"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "19/04/2025"
    },
    "marca_temporal_registro": "19/04/2025",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-51196526",
    "clinica_id": "clinica-1",
    "dni": "51196526",
    "nombre": "Santiago Benjamín",
    "apellido": "Peralta Quiroga",
    "nombre_completo": "Santiago Benjamín Peralta Quiroga",
    "edad": "",
    "telefono_whatsapp": "3512056189",
    "email": "qemilce29@gmail.com",
    "domicilio": "Yaco Misque 1.444 Barrio Crisol Norte",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755505-5996",
        "nombre": "Contacto de Urgencias",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "351-6652002",
        "es_principal": true,
        "notas": "351-6652002"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "EMI"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "13/05/2025"
    },
    "marca_temporal_registro": "13/05/2025",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-30659139",
    "clinica_id": "clinica-1",
    "dni": "30659139",
    "nombre": "Leticia Araujo",
    "apellido": "Veronica",
    "nombre_completo": "Veronica Leticia Araujo",
    "edad": "",
    "telefono_whatsapp": "3516472299",
    "email": "veritoaraujo.va@gmail.com",
    "domicilio": "Santa cruz 366",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755505-9964",
        "nombre": "Alejandro",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3516625193",
        "es_principal": true,
        "notas": "3516625193 Alejandro"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Urgencias"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "11/06/2025"
    },
    "marca_temporal_registro": "11/06/2025",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-24919358",
    "clinica_id": "clinica-1",
    "dni": "24919358",
    "nombre": "María Belen",
    "apellido": "Acosta",
    "nombre_completo": "Acosta María Belen",
    "edad": "",
    "telefono_whatsapp": "3512642525",
    "email": "mabeacosta@hotmail.com",
    "domicilio": "Manuel Olascoaga 966",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755505-8821",
        "nombre": "Contacto de Urgencias",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3516517638",
        "es_principal": true,
        "notas": "3516517638"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Urgencias"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "24/07/2025"
    },
    "marca_temporal_registro": "24/07/2025",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-45573574",
    "clinica_id": "clinica-1",
    "dni": "45573574",
    "nombre": "Aymará Leotta",
    "apellido": "Tiara",
    "nombre_completo": "Tiara Aymará Leotta",
    "edad": "",
    "telefono_whatsapp": "3525410094",
    "email": "gulaleotta@gmail.com",
    "domicilio": "27 de abril 252",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755505-5072",
        "nombre": "Evangelina Vettese",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "2966694969",
        "es_principal": true,
        "notas": "evangelina vettese 2966694969"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "04/08/2025"
    },
    "marca_temporal_registro": "04/08/2025",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-46845276",
    "clinica_id": "clinica-1",
    "dni": "46845276",
    "nombre": "Alvarez Ferrero",
    "apellido": "Tiago",
    "nombre_completo": "Tiago Alvarez Ferrero",
    "edad": "",
    "telefono_whatsapp": "3515064042",
    "email": "tiagoalvarezferrero@gmail.com",
    "domicilio": "Pablo Pizzurno 2513. Rosedal Anexo",
    "con_quien_vive": "",
    "contactos_familiares": [
      {
        "id": "fam-1787937755505-6802",
        "nombre": "Moira",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3515904519",
        "es_principal": true,
        "notas": "Moira 3515904519"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Apross"
    },
    "obra_social_id": "os-apross",
    "obra_social_nombre": "APROSS",
    "plan_id": "",
    "plan_nombre": "Directo / Adherentes",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "14/08/2025"
    },
    "marca_temporal_registro": "14/08/2025",
    "alergias": "",
    "antecedentes": "",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-28851493",
    "clinica_id": "clinica-1",
    "dni": "28851493",
    "nombre": "Flavia Andrea",
    "apellido": "Auad Perez",
    "nombre_completo": "Flavia Andrea Auad Perez",
    "edad": 44,
    "telefono_whatsapp": "3513932864",
    "email": "flavia.auad@gmail.com",
    "domicilio": "Saul Taborda 80 - Unquillo",
    "con_quien_vive": "Hija",
    "contactos_familiares": [
      {
        "id": "fam-1787937755505-9715",
        "nombre": "Natalia Auad",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "351 3436326",
        "es_principal": true,
        "notas": "351 3436326 Natalia Auad"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "CEC"
    },
    "obra_social_id": "os-apross",
    "obra_social_nombre": "APROSS",
    "plan_id": "",
    "plan_nombre": "Directo / Adherentes",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "02/10/2025"
    },
    "marca_temporal_registro": "02/10/2025",
    "alergias": "",
    "antecedentes": "Convivencia: Hija",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-46333818",
    "clinica_id": "clinica-1",
    "dni": "46333818",
    "nombre": "Ignacio Santillán",
    "apellido": "Germán",
    "nombre_completo": "Germán Ignacio Santillán",
    "edad": 20,
    "telefono_whatsapp": "2966674712",
    "email": "santillangerman450@gmail.com",
    "domicilio": "Miguel Calixto del Corro 515, Córdoba Capital, Córdoba, Argentina",
    "con_quien_vive": "Compañeros de piso",
    "contactos_familiares": [
      {
        "id": "fam-1787937755505-828",
        "nombre": "Gabriela Gerard (madre)",
        "relacion": "Madre",
        "telefono": "2966354849",
        "es_principal": true,
        "notas": "2966354849 - Gabriela Gerard (madre)"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-3",
    "obra_social_nombre": "Swiss Medical",
    "plan_id": "",
    "plan_nombre": "SMG20",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "17/11/2025"
    },
    "marca_temporal_registro": "17/11/2025",
    "alergias": "",
    "antecedentes": "Convivencia: Compañeros de piso",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-94131929",
    "clinica_id": "clinica-1",
    "dni": "94131929",
    "nombre": "Joaquin Andres",
    "apellido": "Lenzi Andraos",
    "nombre_completo": "Joaquin Andres Lenzi Andraos",
    "edad": 23,
    "telefono_whatsapp": "3541694960",
    "email": "Joakolenzi@gmail.com",
    "domicilio": "Leandro N Alem 682",
    "con_quien_vive": "Madre y abuelos",
    "contactos_familiares": [
      {
        "id": "fam-1787937755505-9029",
        "nombre": "Cristina",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3541602101",
        "es_principal": true,
        "notas": "Cristina 3541602101"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "19/11/2025"
    },
    "marca_temporal_registro": "19/11/2025",
    "alergias": "",
    "antecedentes": "Convivencia: Madre y abuelos",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-28658008",
    "clinica_id": "clinica-1",
    "dni": "28658008",
    "nombre": "Elizabeth Saires",
    "apellido": "Cecilia",
    "nombre_completo": "Cecilia Elizabeth Saires",
    "edad": 44,
    "telefono_whatsapp": "3513578945",
    "email": "ceciliasaires58@gmail.com",
    "domicilio": "El dorado 6252",
    "con_quien_vive": "Con mi 3 hijo y mi marido",
    "contactos_familiares": [
      {
        "id": "fam-1787937755505-841",
        "nombre": "Gustavo Antonio Espinosa",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "35137305468",
        "es_principal": true,
        "notas": "35137305468 Gustavo Antonio Espinosa"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "01/12/2025"
    },
    "marca_temporal_registro": "01/12/2025",
    "alergias": "",
    "antecedentes": "Convivencia: Con mi 3 hijo y mi marido",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-46222314",
    "clinica_id": "clinica-1",
    "dni": "46222314",
    "nombre": "Valentina Giuliani",
    "apellido": "Lucia",
    "nombre_completo": "Lucia Valentina Giuliani",
    "edad": 20,
    "telefono_whatsapp": "3543657956",
    "email": "luciagiuliani001@gmail.com",
    "domicilio": "Frqncisco n de laprida 234",
    "con_quien_vive": "En una residencia",
    "contactos_familiares": [
      {
        "id": "fam-1787937755505-7691",
        "nombre": "Ivana (mi Mama)",
        "relacion": "Madre",
        "telefono": "3543537609",
        "es_principal": true,
        "notas": "3543537609 Ivana (mi mama)"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Gea",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "04/12/2025"
    },
    "marca_temporal_registro": "04/12/2025",
    "alergias": "",
    "antecedentes": "Convivencia: En una residencia",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-40106652",
    "clinica_id": "clinica-1",
    "dni": "40106652",
    "nombre": "Manuel",
    "apellido": "Servent",
    "nombre_completo": "Manuel servent",
    "edad": 28,
    "telefono_whatsapp": "3513718987",
    "email": "manuelservent96@gmail.com",
    "domicilio": "Maipú 343",
    "con_quien_vive": "Con mi mamá",
    "contactos_familiares": [
      {
        "id": "fam-1787937755505-5956",
        "nombre": "Paola Pagliaro (mamá)",
        "relacion": "Madre",
        "telefono": "3516817698",
        "es_principal": true,
        "notas": "Paola Pagliaro (mamá) 3516817698"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-daspu",
    "obra_social_nombre": "DASPU",
    "plan_id": "",
    "plan_nombre": "DASPU Universitario",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "18/12/2025"
    },
    "marca_temporal_registro": "18/12/2025",
    "alergias": "",
    "antecedentes": "Convivencia: Con mi mamá",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-59467519",
    "clinica_id": "clinica-1",
    "dni": "59467519",
    "nombre": "Augusto Garcias",
    "apellido": "Octavio",
    "nombre_completo": "Octavio Augusto Garcias",
    "edad": 3,
    "telefono_whatsapp": "3512028780",
    "email": "brisagarcias_99@hotmail.com",
    "domicilio": "Henderson 5835",
    "con_quien_vive": "Con mamá, abuelo y tío",
    "contactos_familiares": [
      {
        "id": "fam-1787937755505-2473",
        "nombre": "Brisa",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3512028780",
        "es_principal": true,
        "notas": "Brisa 3512028780"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Urgencias"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "26/12/2025"
    },
    "marca_temporal_registro": "26/12/2025",
    "alergias": "",
    "antecedentes": "Convivencia: Con mamá, abuelo y tío",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-41322362",
    "clinica_id": "clinica-1",
    "dni": "41322362",
    "nombre": "Mauro Javier",
    "apellido": "Quinteros Diaz",
    "nombre_completo": "Mauro Javier Quinteros Diaz",
    "edad": 27,
    "telefono_whatsapp": "3512046747",
    "email": "mauro.quinteros@mi.unc.edu.ar",
    "domicilio": "Mercedes 1753",
    "con_quien_vive": "Pareja (Trinidad)",
    "contactos_familiares": [
      {
        "id": "fam-1787937755505-9684",
        "nombre": "Alejandro (hermano)",
        "relacion": "Hermano/a",
        "telefono": "3517639537",
        "es_principal": true,
        "notas": "Alejandro (hermano) 3517639537"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "09/01/2026"
    },
    "marca_temporal_registro": "09/01/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Pareja (Trinidad)",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-41322362",
    "clinica_id": "clinica-1",
    "dni": "41322362",
    "nombre": "Mauro Javier",
    "apellido": "Quinteros Diaz",
    "nombre_completo": "Mauro Javier Quinteros Diaz",
    "edad": 27,
    "telefono_whatsapp": "3512046747",
    "email": "mauro.quinteros@mi.unc.edu.ar",
    "domicilio": "Mercedes 1753",
    "con_quien_vive": "Pareja",
    "contactos_familiares": [
      {
        "id": "fam-1787937755505-245",
        "nombre": "Trinidad",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3515148288",
        "es_principal": true,
        "notas": "Trinidad 3515148288"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "09/01/2026"
    },
    "marca_temporal_registro": "09/01/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Pareja",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-29475270",
    "clinica_id": "clinica-1",
    "dni": "29475270",
    "nombre": "Benjamín Rumualdo",
    "apellido": "Facundo",
    "nombre_completo": "Facundo Benjamín Rumualdo",
    "edad": 43,
    "telefono_whatsapp": "3517592480",
    "email": "rumualdofacundo@gmail.com",
    "domicilio": "Marcelo t de Alvear 180",
    "con_quien_vive": "Mis cuatro hijos.",
    "contactos_familiares": [
      {
        "id": "fam-1787937755507-5733",
        "nombre": "Pedro Rumualdo.",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3515449908",
        "es_principal": true,
        "notas": "3515449908 Pedro Rumualdo."
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-apross",
    "obra_social_nombre": "APROSS",
    "plan_id": "",
    "plan_nombre": "Directo / Adherentes",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "12/01/2026"
    },
    "marca_temporal_registro": "12/01/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Mis cuatro hijos.",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-32785596",
    "clinica_id": "clinica-1",
    "dni": "32785596",
    "nombre": "Marcelo",
    "apellido": "Millan",
    "nombre_completo": "Marcelo Millan",
    "edad": 39,
    "telefono_whatsapp": "3515998586",
    "email": "mmillan87@gmail.com",
    "domicilio": "Mariano Benitez 1462",
    "con_quien_vive": "Novia",
    "contactos_familiares": [
      {
        "id": "fam-1787937755507-3918",
        "nombre": "Contacto de Urgencias",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "35153061007",
        "es_principal": true,
        "notas": "35153061007"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "23/01/2026"
    },
    "marca_temporal_registro": "23/01/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Novia",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-35137021",
    "clinica_id": "clinica-1",
    "dni": "35137021",
    "nombre": "Stefania",
    "apellido": "Mari",
    "nombre_completo": "Stefania Mari",
    "edad": 35,
    "telefono_whatsapp": "3548583621",
    "email": "licstefaniamari@gmail.com",
    "domicilio": "Catamarca 1295. Córdoba",
    "con_quien_vive": "Sola",
    "contactos_familiares": [
      {
        "id": "fam-1787937755507-3795",
        "nombre": "Virginia Zuvic (amiga)",
        "relacion": "Amigo/a",
        "telefono": "351-3953132",
        "es_principal": true,
        "notas": "Virginia Zuvic (amiga) 351-3953132"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-sancor",
    "obra_social_nombre": "Sancor Salud",
    "plan_id": "",
    "plan_nombre": "Plan 500",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "29/01/2026"
    },
    "marca_temporal_registro": "29/01/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Sola",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-39421625",
    "clinica_id": "clinica-1",
    "dni": "39421625",
    "nombre": "Alberto Suárez",
    "apellido": "Cristian",
    "nombre_completo": "Cristian Alberto Suárez",
    "edad": 30,
    "telefono_whatsapp": "3518179023",
    "email": "cristiansuarez9583@gmail.com",
    "domicilio": "José Antonio Ceballos 1421",
    "con_quien_vive": "Madre",
    "contactos_familiares": [
      {
        "id": "fam-1787937755507-4200",
        "nombre": "Santiago",
        "relacion": "Tío/a",
        "telefono": "3513964324",
        "es_principal": true,
        "notas": "3513964324 Santiago"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-apross",
    "obra_social_nombre": "APROSS",
    "plan_id": "",
    "plan_nombre": "Directo / Adherentes",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "18/02/2026"
    },
    "marca_temporal_registro": "18/02/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Madre",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-28656078",
    "clinica_id": "clinica-1",
    "dni": "28656078",
    "nombre": "Marta Contreras",
    "apellido": "Adriana",
    "nombre_completo": "Adriana Marta Contreras",
    "edad": 44,
    "telefono_whatsapp": "3516707340",
    "email": "adrianacontreras07@hotmail.com",
    "domicilio": "Félix paz 684",
    "con_quien_vive": "Mis dos hijos",
    "contactos_familiares": [
      {
        "id": "fam-1787937755507-6260",
        "nombre": "Francisco",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3516118249",
        "es_principal": true,
        "notas": "Francisco 3516118249"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Swiss Medical"
    },
    "obra_social_id": "os-3",
    "obra_social_nombre": "Swiss Medical",
    "plan_id": "",
    "plan_nombre": "SMG20",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "25/03/2026"
    },
    "marca_temporal_registro": "25/03/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Mis dos hijos",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-53729683",
    "clinica_id": "clinica-1",
    "dni": "53729683",
    "nombre": "Ramos Rodriguez",
    "apellido": "Sebastian",
    "nombre_completo": "SEBASTIAN RAMOS RODRIGUEZ",
    "edad": 12,
    "telefono_whatsapp": "3512950121",
    "email": "natiroo@hotmail.com",
    "domicilio": "PÚBLICA H 5814. CARRARA DE HORIZONTE",
    "con_quien_vive": "Papá, Mamá y una Hermana.",
    "contactos_familiares": [
      {
        "id": "fam-1787937755507-506",
        "nombre": "Jesica",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3516294012",
        "es_principal": true,
        "notas": "3516294012 JESICA"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "ECCO"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "OSPSA",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "22/04/2026"
    },
    "marca_temporal_registro": "22/04/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Papá, Mamá y una Hermana.",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-55286301",
    "clinica_id": "clinica-1",
    "dni": "55286301",
    "nombre": "Ussei Perez",
    "apellido": "Guillermina",
    "nombre_completo": "Guillermina Ussei Perez",
    "edad": 10,
    "telefono_whatsapp": "3516125357",
    "email": "lucasru@gmail.com",
    "domicilio": "Calle Publica G 5807",
    "con_quien_vive": "Papa mama y hermano",
    "contactos_familiares": [
      {
        "id": "fam-1787937755507-213",
        "nombre": "Lucas Ussei",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "Lucas Ussei",
        "es_principal": true,
        "notas": "Lucas Ussei"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Urgencias"
    },
    "obra_social_id": "os-2",
    "obra_social_nombre": "OSDE",
    "plan_id": "",
    "plan_nombre": "Plan 210",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "29/04/2026"
    },
    "marca_temporal_registro": "29/04/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Papa mama y hermano",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-56761915",
    "clinica_id": "clinica-1",
    "dni": "56761915",
    "nombre": "Ussei Perez",
    "apellido": "Benjamin",
    "nombre_completo": "Benjamin Ussei Perez",
    "edad": 8,
    "telefono_whatsapp": "3516125357",
    "email": "lucasru@gmail.com",
    "domicilio": "Calle Publica G 5807",
    "con_quien_vive": "Papá Mamá y hermana",
    "contactos_familiares": [
      {
        "id": "fam-1787937755508-5467",
        "nombre": "Lucas Ussei",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3516125357",
        "es_principal": true,
        "notas": "Lucas Ussei 3516125357"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Urgencias"
    },
    "obra_social_id": "os-2",
    "obra_social_nombre": "OSDE",
    "plan_id": "",
    "plan_nombre": "Plan 210",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "29/04/2026"
    },
    "marca_temporal_registro": "29/04/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Papá Mamá y hermana",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-2337557116938743",
    "clinica_id": "clinica-1",
    "dni": "2337557116938743",
    "nombre": "Manuel Alejandro",
    "apellido": "Basualdo Y Claudia Mabel Longhitano",
    "nombre_completo": "Manuel Alejandro basualdo y claudia Mabel longhitano",
    "edad": 52,
    "telefono_whatsapp": "1172356961",
    "email": "claulongui@hotmail.com",
    "domicilio": "Publica J 6140 carrera de horizonte norte",
    "con_quien_vive": "Esposa,  hija  y cuñada",
    "contactos_familiares": [
      {
        "id": "fam-1787937755508-7674",
        "nombre": "Contacto de Urgencias",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "1151082041",
        "es_principal": true,
        "notas": "1151082041"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "PAMI",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "29/04/2026"
    },
    "marca_temporal_registro": "29/04/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Esposa,  hija  y cuñada",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-26925630",
    "clinica_id": "clinica-1",
    "dni": "26925630",
    "nombre": "Eliana Resnik",
    "apellido": "Lorena",
    "nombre_completo": "Lorena Eliana Resnik",
    "edad": 47,
    "telefono_whatsapp": "3585080138",
    "email": "l_resnik@hotmail.com",
    "domicilio": "Av.Hipolito Irigoyen 165 6b",
    "con_quien_vive": "Sola",
    "contactos_familiares": [
      {
        "id": "fam-1787937755508-2756",
        "nombre": "Maria Luz Recalde (hija)",
        "relacion": "Hijo/a",
        "telefono": "358 507-5677",
        "es_principal": true,
        "notas": "Maria Luz Recalde (hija) 358 507-5677"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Apross"
    },
    "obra_social_id": "os-apross",
    "obra_social_nombre": "APROSS",
    "plan_id": "",
    "plan_nombre": "Directo / Adherentes",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "01/05/2026"
    },
    "marca_temporal_registro": "01/05/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Sola",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-22928471",
    "clinica_id": "clinica-1",
    "dni": "22928471",
    "nombre": "Carlos Lodeiro",
    "apellido": "Juan",
    "nombre_completo": "Juan Carlos Lodeiro",
    "edad": 53,
    "telefono_whatsapp": "3516369940",
    "email": "jclodeiro@yahoo.com.ar",
    "domicilio": "Angelo de Peredo 431 Piso DPTO F",
    "con_quien_vive": "Solo",
    "contactos_familiares": [
      {
        "id": "fam-1787937755508-9802",
        "nombre": "Sonia Zannini",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "351 2040712",
        "es_principal": true,
        "notas": "351 2040712 Sonia Zannini"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Prevención",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "13/05/2026"
    },
    "marca_temporal_registro": "13/05/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Solo",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-36141569",
    "clinica_id": "clinica-1",
    "dni": "36141569",
    "nombre": "Jorgelina Gonzalez",
    "apellido": "Daniela",
    "nombre_completo": "Daniela jorgelina gonzalez",
    "edad": 34,
    "telefono_whatsapp": "",
    "email": "danielajgonzalez@hotmail.es",
    "domicilio": "Rio gallegos 1505",
    "con_quien_vive": "2 hijos y pareja",
    "contactos_familiares": [
      {
        "id": "fam-1787937755508-5933",
        "nombre": "Leonardo Petri",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3513470329",
        "es_principal": true,
        "notas": "3513470329 leonardo petri"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-8",
    "obra_social_nombre": "Medifé",
    "plan_id": "",
    "plan_nombre": "Plata",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "14/05/2026"
    },
    "marca_temporal_registro": "14/05/2026",
    "alergias": "",
    "antecedentes": "Convivencia: 2 hijos y pareja",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-41963480",
    "clinica_id": "clinica-1",
    "dni": "41963480",
    "nombre": "Matías Muñoz",
    "apellido": "Rodrigo",
    "nombre_completo": "Rodrigo Matías Muñoz",
    "edad": 26,
    "telefono_whatsapp": "3541627064",
    "email": "rodrimatimunoz@gmail.com",
    "domicilio": "Maipú 556, Villa Carlos Paz",
    "con_quien_vive": "Mi madre y mi padre",
    "contactos_familiares": [
      {
        "id": "fam-1787937755508-9131",
        "nombre": ", Marcela",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3515433510",
        "es_principal": true,
        "notas": "3515433510, Marcela"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "19/05/2026"
    },
    "marca_temporal_registro": "19/05/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Mi madre y mi padre",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-24991219",
    "clinica_id": "clinica-1",
    "dni": "24991219",
    "nombre": "Alberto Cesaro",
    "apellido": "Daniel",
    "nombre_completo": "Daniel Alberto Cesaro",
    "edad": 50,
    "telefono_whatsapp": "3513184651",
    "email": "danielcesaro59@gmail.com",
    "domicilio": "Calle 19 4290 Carrara de horizonte",
    "con_quien_vive": "esposa y mis dos hijas",
    "contactos_familiares": [
      {
        "id": "fam-1787937755508-6942",
        "nombre": "Soledad",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3517657069",
        "es_principal": true,
        "notas": "Soledad 3517657069"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Emergencia"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Omint",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "02/06/2026"
    },
    "marca_temporal_registro": "02/06/2026",
    "alergias": "",
    "antecedentes": "Convivencia: esposa y mis dos hijas",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-52862920",
    "clinica_id": "clinica-1",
    "dni": "52862920",
    "nombre": "Escalante",
    "apellido": "Delfina",
    "nombre_completo": "Escalante Delfina",
    "edad": 13,
    "telefono_whatsapp": "3512154805",
    "email": "escalanteulises080@gmail.com",
    "domicilio": "Cleto aguirre 6577",
    "con_quien_vive": "Padre",
    "contactos_familiares": [
      {
        "id": "fam-1787937755508-9853",
        "nombre": "Contacto de Urgencias",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3512469696",
        "es_principal": true,
        "notas": "3512469696"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Emi"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Nobis",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "08/06/2026"
    },
    "marca_temporal_registro": "08/06/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Padre",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-48532094",
    "clinica_id": "clinica-1",
    "dni": "48532094",
    "nombre": "Tait Abramor",
    "apellido": "Julián",
    "nombre_completo": "Julián Tait Abramor",
    "edad": 17,
    "telefono_whatsapp": "3512042635",
    "email": "emiliotait3@gmail.com",
    "domicilio": "Caseros 686",
    "con_quien_vive": "Madre y padre",
    "contactos_familiares": [
      {
        "id": "fam-1787937755508-6948",
        "nombre": "Emilio Tait Tel",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3512326878",
        "es_principal": true,
        "notas": "Emilio Tait  tel: 3512326878"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-apross",
    "obra_social_nombre": "APROSS",
    "plan_id": "",
    "plan_nombre": "Directo / Adherentes",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "08/06/2026"
    },
    "marca_temporal_registro": "08/06/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Madre y padre",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-42336054",
    "clinica_id": "clinica-1",
    "dni": "42336054",
    "nombre": "Greta",
    "apellido": "Rizzi",
    "nombre_completo": "Greta Rizzi",
    "edad": 26,
    "telefono_whatsapp": "3517047881",
    "email": "grerizzi123@gmail.com",
    "domicilio": "Laguna Honda 8983",
    "con_quien_vive": "Con mí mamá",
    "contactos_familiares": [
      {
        "id": "fam-1787937755508-7188",
        "nombre": "3,51154e+11",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3,51154E+11",
        "es_principal": true,
        "notas": "3,51154E+11"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "07/08/2026"
    },
    "marca_temporal_registro": "07/08/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Con mí mamá",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-row-91-1787937755508",
    "clinica_id": "clinica-1",
    "dni": "S-DNI-91",
    "nombre": "L",
    "apellido": "Sin Apellido",
    "nombre_completo": "L",
    "edad": "",
    "telefono_whatsapp": "",
    "email": "fernandezluna.admin@gmail.com",
    "domicilio": "O",
    "con_quien_vive": "M",
    "contactos_familiares": [
      {
        "id": "fam-1787937755508-7548",
        "nombre": "O",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "O",
        "es_principal": true,
        "notas": "O"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "14/08/2026"
    },
    "marca_temporal_registro": "14/08/2026",
    "alergias": "",
    "antecedentes": "Convivencia: M",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-46451115",
    "clinica_id": "clinica-1",
    "dni": "46451115",
    "nombre": "Alejandra Cesaro",
    "apellido": "Agustina",
    "nombre_completo": "Agustina Alejandra Cesaro",
    "edad": 20,
    "telefono_whatsapp": "3512366646",
    "email": "agustinacesaro13@gmail.com",
    "domicilio": "Calle pública 19 4290",
    "con_quien_vive": "Mamá, papá, hermana",
    "contactos_familiares": [
      {
        "id": "fam-1787937755508-8566",
        "nombre": "Daniel Alberto Cesaro",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "+54 9 3513 18-4651",
        "es_principal": true,
        "notas": "+54 9 3513 18-4651 Daniel Alberto Cesaro"
      }
    ],
    "servicio_emergencia": {
      "posee": true,
      "nombre": "Omint"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "14/08/2026"
    },
    "marca_temporal_registro": "14/08/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Mamá, papá, hermana",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-28656444",
    "clinica_id": "clinica-1",
    "dni": "28656444",
    "nombre": "Ricardo De",
    "apellido": "La Fuente",
    "nombre_completo": "RICARDO DE LA FUENTE",
    "edad": 45,
    "telefono_whatsapp": "3515115202",
    "email": "delafuentericardoadrian@gmail.com",
    "domicilio": "CALLE PUBLICA D 5730 CARRARA DE HORIZONTE",
    "con_quien_vive": "Esposa e hijos",
    "contactos_familiares": [
      {
        "id": "fam-1787937755508-5354",
        "nombre": "Sabrina",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3515158574",
        "es_principal": true,
        "notas": "3515158574 SABRINA"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-8",
    "obra_social_nombre": "Medifé",
    "plan_id": "",
    "plan_nombre": "Plata",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "14/08/2026"
    },
    "marca_temporal_registro": "14/08/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Esposa e hijos",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-48670367",
    "clinica_id": "clinica-1",
    "dni": "48670367",
    "nombre": "Dante",
    "apellido": "Formento",
    "nombre_completo": "Dante Formento",
    "edad": 17,
    "telefono_whatsapp": "3518071415",
    "email": "danteformnto@gmail.com",
    "domicilio": "Av santa fe 85",
    "con_quien_vive": "Mama",
    "contactos_familiares": [
      {
        "id": "fam-1787937755508-9323",
        "nombre": "Contacto de Urgencias",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3513908183",
        "es_principal": true,
        "notas": "3513908183"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Parque salud",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "15/08/2026"
    },
    "marca_temporal_registro": "15/08/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Mama",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-11072757",
    "clinica_id": "clinica-1",
    "dni": "11072757",
    "nombre": "Susana Nallim",
    "apellido": "María",
    "nombre_completo": "María Susana Nallim",
    "edad": 72,
    "telefono_whatsapp": "3875384077",
    "email": "msusananallim@gmail.com",
    "domicilio": "Salta capital complejo arenales torreG dpto 197",
    "con_quien_vive": "Sola",
    "contactos_familiares": [
      {
        "id": "fam-1787937755508-8617",
        "nombre": "María Ana Ortiz Cel",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3876115456",
        "es_principal": true,
        "notas": "María Ana Ortiz cel 3876115456"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "IPS",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "18/08/2026"
    },
    "marca_temporal_registro": "18/08/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Sola",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-41963480",
    "clinica_id": "clinica-1",
    "dni": "41963480",
    "nombre": "Matías Muñoz",
    "apellido": "Rodrigo",
    "nombre_completo": "Rodrigo Matías Muñoz",
    "edad": 27,
    "telefono_whatsapp": "3541627064",
    "email": "rodrimatimunoz@gmail.com",
    "domicilio": "Maipú 556, Villa Carlos Paz",
    "con_quien_vive": "Con mi mamá y mi papá",
    "contactos_familiares": [
      {
        "id": "fam-1787937755508-3917",
        "nombre": "Marcela Silvana Molina,",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3515433510",
        "es_principal": true,
        "notas": "Marcela Silvana Molina, 3515433510"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-1",
    "obra_social_nombre": "Particular",
    "plan_id": "",
    "plan_nombre": "Particular",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "20/08/2026"
    },
    "marca_temporal_registro": "20/08/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Con mi mamá y mi papá",
    "medicacion_habitual": "",
    "activo": true
  },
  {
    "id": "pac-36447625",
    "clinica_id": "clinica-1",
    "dni": "36447625",
    "nombre": "Eugenio",
    "apellido": "March",
    "nombre_completo": "Eugenio March",
    "edad": 34,
    "telefono_whatsapp": "3516591409",
    "email": "eugeniomarch@hotmail.com",
    "domicilio": "M20 L43 docta",
    "con_quien_vive": "Primo",
    "contactos_familiares": [
      {
        "id": "fam-1787937755508-9006",
        "nombre": "Pablo",
        "relacion": "Contacto Familiar / Urgencias",
        "telefono": "3516347111",
        "es_principal": true,
        "notas": "3516347111 pablo"
      }
    ],
    "servicio_emergencia": {
      "posee": false,
      "nombre": "No posee"
    },
    "obra_social_id": "os-8",
    "obra_social_nombre": "Medifé",
    "plan_id": "",
    "plan_nombre": "Plata",
    "numero_afiliado": "",
    "consentimiento_informado": {
      "aceptado": true,
      "fecha_firma": "25/08/2026"
    },
    "marca_temporal_registro": "25/08/2026",
    "alergias": "",
    "antecedentes": "Convivencia: Primo",
    "medicacion_habitual": "",
    "activo": true
  }
],
  turnos: [
    {
      id: 'trn-1787870676907',
      fecha: '2026-08-31',
      hora_inicio: '09:00',
      hora_fin: '10:00',
      fecha_hora_inicio: '2026-08-31T09:00:00',
      fecha_hora_fin: '2026-08-31T10:00:00',
      clinica_id: 'clinica-1',
      profesional_id: 'prof-1786315328730',
      paciente_id: 'pac-1787870676906',
      consultorio_id: 'c-1-1',
      servicio_id: 'serv-1786315370753',
      practica_id: 'nom-psi-1',
      obra_social_id: 'os-sancor',
      obra_social_nombre: 'Sancor Salud',
      plan_id: 'pl-sancor-500',
      numero_afiliado: '1350025',
      estado: 'PROGRAMADO',
      es_sobreturno: false,
      monto_coseguro: 0,
      estado_coseguro: 'EXENTO',
      codigo_reserva: 'TRN-22698',
      observaciones: 'Turno programado de Psicología',
      confirmado_whatsapp: false
    }
  ]
};

// Agendas Iniciales Profesionales (Con Vigencia y Días Deterministas por Sede)
export const INITIAL_AGENDAS = [
  // Lic. Nahuel López: 4 Agendas Reales en las 4 Sedes (Inicios desde las 09:00 hs)
  {
    id: 'ag-lopez-aipaa',
    clinica_id: 'clinica-1',
    profesional_id: 'prof-1786315328730',
    servicio_id: 'serv-1786315370753',
    consultorio_id: 'c-1-1',
    nombre: 'Aipaa 355 - Lunes, Miércoles y Jueves',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    duracion_slot_min: 60,
    modalidad: 'PRESENCIAL',
    max_sobreturnos_dia: 2,
    dias_horarios: [
      { dia_semana: 1, franjas: [{ hora_inicio: '09:00', hora_fin: '20:00', modalidad: 'PRESENCIAL' }] },
      { dia_semana: 3, franjas: [{ hora_inicio: '11:00', hora_fin: '20:00', modalidad: 'PRESENCIAL' }] },
      { dia_semana: 4, franjas: [{ hora_inicio: '13:00', hora_fin: '20:00', modalidad: 'PRESENCIAL' }] }
    ],
    estado: 'ACTIVA',
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'ag-lopez-colon',
    clinica_id: 'clinica-2',
    profesional_id: 'prof-1786315328730',
    servicio_id: 'serv-1786315370753',
    consultorio_id: 'c-2-1',
    nombre: 'Circulare COLON - Martes y Viernes',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    duracion_slot_min: 45,
    modalidad: 'PRESENCIAL',
    max_sobreturnos_dia: 2,
    dias_horarios: [
      { dia_semana: 2, franjas: [{ hora_inicio: '09:00', hora_fin: '14:00', modalidad: 'PRESENCIAL' }] },
      { dia_semana: 5, franjas: [{ hora_inicio: '09:00', hora_fin: '12:00', modalidad: 'PRESENCIAL' }] }
    ],
    estado: 'ACTIVA',
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'ag-lopez-inti',
    clinica_id: 'clinica-3',
    profesional_id: 'prof-1786315328730',
    servicio_id: 'serv-1786315370753',
    consultorio_id: 'c-3-1',
    nombre: 'Inti Carrara - Martes y Viernes Tarde',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    duracion_slot_min: 60,
    modalidad: 'PRESENCIAL',
    max_sobreturnos_dia: 2,
    dias_horarios: [
      { dia_semana: 2, franjas: [{ hora_inicio: '14:00', hora_fin: '20:00', modalidad: 'PRESENCIAL' }] },
      { dia_semana: 5, franjas: [{ hora_inicio: '13:00', hora_fin: '20:00', modalidad: 'PRESENCIAL' }] }
    ],
    estado: 'ACTIVA',
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'ag-lopez-online',
    clinica_id: 'clinica-4',
    profesional_id: 'prof-1786315328730',
    servicio_id: 'serv-1786315370753',
    consultorio_id: 'c-4-1',
    nombre: 'online CASA - Jueves Mañana',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    duracion_slot_min: 60,
    modalidad: 'ONLINE',
    max_sobreturnos_dia: 2,
    dias_horarios: [
      { dia_semana: 4, franjas: [{ hora_inicio: '09:00', hora_fin: '12:00', modalidad: 'ONLINE' }] }
    ],
    estado: 'ACTIVA',
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z'
  },

  // Lic. Sofía Albarracín: 3 agendas
  {
    id: 'ag-psi-1',
    clinica_id: 'clinica-1',
    profesional_id: 'prof-psi-1',
    servicio_id: 'serv-0a',
    consultorio_id: 'c-1-1',
    nombre: 'Sede Central - Lunes Presencial',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    duracion_slot_min: 45,
    modalidad: 'PRESENCIAL',
    max_sobreturnos_dia: 2,
    dias_horarios: [
      { dia_semana: 1, franjas: [{ hora_inicio: '14:00', hora_fin: '20:00', modalidad: 'PRESENCIAL' }] }
    ],
    estado: 'ACTIVA',
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'ag-psi-2',
    clinica_id: 'clinica-2',
    profesional_id: 'prof-psi-1',
    servicio_id: 'serv-0a',
    consultorio_id: 'c-2-1',
    nombre: 'Sede Norte - Miércoles Online',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    duracion_slot_min: 45,
    modalidad: 'ONLINE',
    max_sobreturnos_dia: 2,
    dias_horarios: [
      { dia_semana: 3, franjas: [{ hora_inicio: '09:00', hora_fin: '15:00', modalidad: 'ONLINE' }] }
    ],
    estado: 'ACTIVA',
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'ag-psi-3',
    clinica_id: 'clinica-3',
    profesional_id: 'prof-psi-1',
    servicio_id: 'serv-0b',
    consultorio_id: 'c-3-1',
    nombre: 'Sede Nueva Córdoba - Jueves Híbrido',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    duracion_slot_min: 60,
    modalidad: 'AMBAS',
    max_sobreturnos_dia: 2,
    dias_horarios: [
      { dia_semana: 4, franjas: [{ hora_inicio: '15:00', hora_fin: '20:00', modalidad: 'AMBAS' }] }
    ],
    estado: 'ACTIVA',
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z'
  }
];

INITIAL_DATA.agendas = INITIAL_AGENDAS;

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
  if (!localStorage.getItem(STORAGE_KEYS.AGENDAS)) {
    localStorage.setItem(STORAGE_KEYS.AGENDAS, JSON.stringify(INITIAL_AGENDAS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
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

  // Verificación no destructiva de las 4 sedes y profesionales multi-sede
  try {
    const clinicasList = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLINICAS_LIST) || '[]');
    if (!Array.isArray(clinicasList) || clinicasList.length === 0) {
      localStorage.setItem(STORAGE_KEYS.CLINICAS_LIST, JSON.stringify(INITIAL_CLINICAS));
      if (!localStorage.getItem(STORAGE_KEYS.CLINICA)) {
        localStorage.setItem(STORAGE_KEYS.CLINICA, JSON.stringify(INITIAL_CLINICAS[0]));
      }
    }
    // Asegurar sedes_ids en profesionales existentes sin pisar sus horarios
    const profs = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFESIONALES) || '[]');
    if (Array.isArray(profs)) {
      let updated = false;
      profs.forEach(p => {
        if (!p.sedes_ids || !Array.isArray(p.sedes_ids) || p.sedes_ids.length === 0) {
          p.sedes_ids = ['clinica-1', 'clinica-2', 'clinica-3', 'clinica-4'];
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEYS.PROFESIONALES, JSON.stringify(profs));
      }
    }
  } catch (e) {
    console.warn('Verificación multi-sede:', e);
  }

  // Facturación: inicializar en blanco y limpiar mocks viejos
  if (!localStorage.getItem(STORAGE_KEYS.MOVIMIENTOS_CAJA)) {
    localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS_CAJA, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMPROBANTES_ARCA)) {
    localStorage.setItem(STORAGE_KEYS.COMPROBANTES_ARCA, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.LOTES_FACTURACION)) {
    localStorage.setItem(STORAGE_KEYS.LOTES_FACTURACION, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUENTAS_CORRIENTES_PACIENTES)) {
    localStorage.setItem(STORAGE_KEYS.CUENTAS_CORRIENTES_PACIENTES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MOVIMIENTOS_CTA_CTE_PACIENTES)) {
    localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS_CTA_CTE_PACIENTES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUENTAS_CORRIENTES_OS)) {
    localStorage.setItem(STORAGE_KEYS.CUENTAS_CORRIENTES_OS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MOVIMIENTOS_CTA_CTE_OS)) {
    localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS_CTA_CTE_OS, JSON.stringify([]));
  }

  // Purgar mocks residuales de caja/facturación para pruebas limpias
  try {
    const movs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVIMIENTOS_CAJA) || '[]');
    if (movs.some(m => m.id === 'caj-1' || m.id === 'caj-2')) {
      localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS_CAJA, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.COMPROBANTES_ARCA, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.LOTES_FACTURACION, JSON.stringify([]));
    }
  } catch (e) {}

  // Sanitización de horarios huérfanos y domingos residuales
  try {
    StorageService.sanitizarHorariosHuerfanos();
  } catch (e) {
    console.warn('Error sanitizando horarios:', e);
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
    triggerAutoCloudSync();
  },

  // GESTIÓN DE SESIÓN Y USUARIOS / ROLES
  getCurrentUser: () => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },
  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },
  getUsers: (clinicaId = null) => {
    const all = StorageService.getCollection(STORAGE_KEYS.USERS);
    if (!all || all.length === 0) {
      StorageService.saveCollection(STORAGE_KEYS.USERS, INITIAL_USERS);
      return INITIAL_USERS;
    }
    if (!clinicaId || clinicaId === 'TODAS') return all;
    return all.filter(u => !u.clinica_id || u.clinica_id === clinicaId);
  },
  saveUser: (user) => {
    const items = StorageService.getCollection(STORAGE_KEYS.USERS);
    if (user.id) {
      const idx = items.findIndex(u => u.id === user.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...user };
      else items.push(user);
    } else {
      user.id = `usr-${Date.now()}`;
      user.activo = user.activo !== false;
      items.push(user);
    }
    StorageService.saveCollection(STORAGE_KEYS.USERS, items);
    return user;
  },
  deleteUser: (id) => {
    const items = StorageService.getCollection(STORAGE_KEYS.USERS).filter(u => u.id !== id);
    StorageService.saveCollection(STORAGE_KEYS.USERS, items);
  },
  authenticateUser: (email, password) => {
    const all = StorageService.getUsers();
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = all.find(u => u.email && u.email.toLowerCase() === cleanEmail && u.activo !== false);
    if (!user) {
      return { success: false, message: 'Usuario no encontrado o cuenta desactivada.' };
    }
    if (user.password && user.password !== password) {
      return { success: false, message: 'Contraseña incorrecta.' };
    }
    return { success: true, user };
  },
  getUsersList: () => StorageService.getUsers(),

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

  // CONSULTORIOS FÍSICOS (Filtrados por clínica o todas)
  getConsultorios: (clinicaId = null) => {
    let all = StorageService.getCollection(STORAGE_KEYS.CONSULTORIOS);
    if (!all || !Array.isArray(all)) {
      all = [...INITIAL_DATA.consultorios];
      StorageService.saveCollection(STORAGE_KEYS.CONSULTORIOS, all);
    }
    if (!clinicaId || clinicaId === 'TODAS' || clinicaId === 'ALL') {
      return all;
    }
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

  // PROFESIONALES (Multi-Sede)
  getProfesionales: (clinicaId = null) => {
    let all = StorageService.getCollection(STORAGE_KEYS.PROFESIONALES);
    if (!all || !Array.isArray(all)) {
      all = [...INITIAL_DATA.profesionales];
      StorageService.saveCollection(STORAGE_KEYS.PROFESIONALES, all);
    }

    // Sincronizar dinámicamente con la duración de sus agendas activas
    try {
      const agendas = StorageService.getCollection(STORAGE_KEYS.AGENDAS) || [];
      let updated = false;
      all.forEach(p => {
        const ag = agendas.find(a => String(a.profesional_id) === String(p.id) && a.estado === 'ACTIVA');
        if (ag && ag.duracion_slot_min && Number(p.duracion_turno_minutos) !== Number(ag.duracion_slot_min)) {
          p.duracion_turno_minutos = Number(ag.duracion_slot_min);
          updated = true;
        }
      });
      if (updated) {
        StorageService.saveCollection(STORAGE_KEYS.PROFESIONALES, all);
      }
    } catch (e) {
      console.warn('Sincronización getProfesionales:', e);
    }

    if (!clinicaId || clinicaId === 'TODAS' || clinicaId === 'ALL') {
      return all;
    }
    const targetClinicaId = clinicaId || StorageService.getClinicaActiva().id;
    return all.filter(p => {
      if (p.sedes_ids && Array.isArray(p.sedes_ids) && p.sedes_ids.length > 0) {
        return p.sedes_ids.includes(targetClinicaId);
      }
      if (p.clinicas_ids && Array.isArray(p.clinicas_ids) && p.clinicas_ids.length > 0) {
        return p.clinicas_ids.includes(targetClinicaId);
      }
      return !p.clinica_id || p.clinica_id === targetClinicaId;
    });
  },
  saveProfesional: (prof) => {
    const items = StorageService.getCollection(STORAGE_KEYS.PROFESIONALES) || [];
    const clinicaId = StorageService.getClinicaActiva().id;
    prof.clinica_id = prof.clinica_id || clinicaId;
    if (!prof.sedes_ids || !Array.isArray(prof.sedes_ids) || prof.sedes_ids.length === 0) {
      prof.sedes_ids = [prof.clinica_id];
    }
    prof.activo = prof.activo !== false;
    prof.duracion_turno_minutos = Number(prof.duracion_turno_minutos) || 20;
    prof.max_sobreturnos_dia = Number(prof.max_sobreturnos_dia) || 3;

    // Auto-asignar servicios y obras sociales por defecto si vienen vacíos
    if (!prof.servicios_ids || prof.servicios_ids.length === 0) {
      const allServicios = StorageService.getServicios(prof.clinica_id);
      const matchingServ = allServicios.filter(s => 
        s.especialidad_id === prof.especialidad_id || 
        (prof.especialidad && s.nombre.toLowerCase().includes(prof.especialidad.toLowerCase()))
      );
      prof.servicios_ids = matchingServ.length > 0 ? matchingServ.map(s => s.id) : (allServicios[0] ? [allServicios[0].id] : []);
    }

    if (!prof.obras_sociales_ids || prof.obras_sociales_ids.length === 0) {
      const allOs = StorageService.getObrasSociales(prof.clinica_id);
      prof.obras_sociales_ids = allOs.map(o => o.id);
    }

    let isNew = false;
    if (prof.id) {
      const idx = items.findIndex(p => p.id === prof.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...prof };
      else items.push(prof);
    } else {
      prof.id = `prof-${Date.now()}`;
      items.push(prof);
      isNew = true;
    }
    StorageService.saveCollection(STORAGE_KEYS.PROFESIONALES, items);

    return prof;
  },
  deleteProfesional: (id) => {
    const items = StorageService.getCollection(STORAGE_KEYS.PROFESIONALES);
    const prof = items.find(p => p.id === id);
    if (!prof) return { success: false, error: 'Profesional no encontrado.' };

    const turnos = StorageService.getTurnos().filter(t => t.profesional_id === id);
    if (turnos.length > 0) {
      throw new Error(`No es posible eliminar al profesional Dr(a). ${prof.apellido} porque tiene ${turnos.length} turno(s) registrados en su historial. Para deshabilitarlo, desactive su estado a INACTIVO.`);
    }

    const updated = items.filter(p => p.id !== id);
    StorageService.saveCollection(STORAGE_KEYS.PROFESIONALES, updated);
    return { success: true };
  },

  // ==============================================================================
  // AGENDAS MÉDICAS PROFESIONALES (Con Vigencia, Ciclo de Vida y Detección de Turnos)
  // ==============================================================================
  getAgendas: (clinicaId = null, profesionalId = null, incluirInactivas = false) => {
    let items = StorageService.getCollection(STORAGE_KEYS.AGENDAS);
    if (!items || !Array.isArray(items)) {
      items = [...INITIAL_AGENDAS];
      StorageService.saveCollection(STORAGE_KEYS.AGENDAS, items);
    }

    if (clinicaId && clinicaId !== 'TODAS' && clinicaId !== 'ALL') {
      items = items.filter(a => !a.clinica_id || a.clinica_id === clinicaId);
    }
    if (profesionalId) {
      items = items.filter(a => a.profesional_id === profesionalId);
    }
    if (!incluirInactivas) {
      items = items.filter(a => a.estado === 'ACTIVA');
    }
    return items;
  },

  saveAgenda: (agendaData) => {
    let items = StorageService.getCollection(STORAGE_KEYS.AGENDAS);
    if (!items || items.length === 0) items = [...INITIAL_AGENDAS];
    const clinicaId = StorageService.getClinicaActiva()?.id;
    agendaData.clinica_id = agendaData.clinica_id || clinicaId;
    agendaData.updated_at = new Date().toISOString();

    if (agendaData.id) {
      const idx = items.findIndex(a => a.id === agendaData.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...agendaData };
      else items.push(agendaData);
    } else {
      agendaData.id = `ag-${Date.now()}`;
      agendaData.created_at = new Date().toISOString();
      agendaData.estado = agendaData.estado || 'ACTIVA';
      items.push(agendaData);
    }
    StorageService.saveCollection(STORAGE_KEYS.AGENDAS, items);

    // Sincronizar atómicamente la tabla horarios para este profesional
    StorageService.sincronizarHorariosDesdeAgendas(agendaData.profesional_id);
    return agendaData;
  },

  cerrarAgenda: (agendaId, motivo = '') => {
    const items = StorageService.getCollection(STORAGE_KEYS.AGENDAS);
    const agenda = items.find(a => a.id === agendaId);
    if (agenda) {
      agenda.estado = 'CERRADA';
      agenda.motivo_cierre = motivo;
      agenda.updated_at = new Date().toISOString();
      StorageService.saveCollection(STORAGE_KEYS.AGENDAS, items);
      StorageService.sincronizarHorariosDesdeAgendas(agenda.profesional_id);
    }
    return agenda;
  },

  reactivarAgenda: (agendaId) => {
    const items = StorageService.getCollection(STORAGE_KEYS.AGENDAS);
    const agenda = items.find(a => a.id === agendaId);
    if (agenda) {
      agenda.estado = 'ACTIVA';
      agenda.motivo_cierre = null;
      agenda.updated_at = new Date().toISOString();
      StorageService.saveCollection(STORAGE_KEYS.AGENDAS, items);
      StorageService.sincronizarHorariosDesdeAgendas(agenda.profesional_id);
    }
    return agenda;
  },

  deleteAgenda: (agendaId) => {
    const items = StorageService.getCollection(STORAGE_KEYS.AGENDAS);
    const target = items.find(a => a.id === agendaId);
    if (!target) return { success: false, error: 'Agenda no encontrada.' };

    // Validar si la agenda contiene turnos otorgados en el historial
    const allTurnos = StorageService.getTurnos();
    const turnosAsociados = allTurnos.filter(t => {
      if (t.agenda_id === agendaId) return true;
      if (t.profesional_id === target.profesional_id && 
          (!target.servicio_id || t.servicio_id === target.servicio_id) &&
          (!target.fecha_desde || t.fecha >= target.fecha_desde) &&
          (!target.fecha_hasta || t.fecha <= target.fecha_hasta)) {
        return true;
      }
      return false;
    });

    if (turnosAsociados.length > 0) {
      throw new Error(`No es posible eliminar la agenda "${target.nombre}" porque contiene ${turnosAsociados.length} turno(s) en su historial. Para preservar la integridad del historial clínico, debe utilizar la opción "Cerrar Vigencia".`);
    }

    const updated = items.filter(a => a.id !== agendaId);
    StorageService.saveCollection(STORAGE_KEYS.AGENDAS, updated);
    if (target) {
      StorageService.sincronizarHorariosDesdeAgendas(target.profesional_id);
    }
    return { success: true };
  },

  // Busca turnos futuros que quedarían afectados al modificar o cerrar una agenda
  getTurnosAfectadosPorAgenda: (profesionalId, diasHabilitados = [], fechaDesde = null, fechaHasta = null) => {
    const todayStr = getLocalDateString(new Date());
    const turnos = StorageService.getTurnos().filter(t => 
      t.profesional_id === profesionalId && 
      t.fecha >= todayStr && 
      t.estado !== 'CANCELADO'
    );

    const diasNum = diasHabilitados.map(Number);
    const afectados = turnos.filter(t => {
      // Si la fecha está fuera de la nueva vigencia
      if (fechaDesde && t.fecha < fechaDesde) return true;
      if (fechaHasta && t.fecha > fechaHasta) return true;
      // Si el día de la semana fue quitado de la atención
      const dayOfWeek = getDayOfWeekFromDateString(t.fecha);
      if (!diasNum.includes(dayOfWeek)) return true;
      return false;
    });

    return afectados;
  },

  // Sincroniza la tabla horarios a partir de todas las agendas activas del médico
  sincronizarHorariosDesdeAgendas: (profesionalId) => {
    const agendasActivas = StorageService.getAgendas(null, profesionalId, false);
    
    // Si no hay agendas explícitas configuradas, no pisar ni borrar los horarios existentes del profesional!
    if (agendasActivas.length === 0) {
      return StorageService.getHorarios().filter(h => String(h.profesional_id) === String(profesionalId));
    }

    const allHorarios = StorageService.getHorarios().filter(h => h.profesional_id !== profesionalId);

    const newHorarios = [];
    agendasActivas.forEach(ag => {
      if (ag.dias_horarios && Array.isArray(ag.dias_horarios)) {
        ag.dias_horarios.forEach(dh => {
          const diaNum = Number(dh.dia_semana);
          if (diaNum >= 1 && diaNum <= 6) { // Excluye domingo estrictamente
            (dh.franjas || []).forEach((franja, fIdx) => {
              if (franja.hora_inicio && franja.hora_fin) {
                newHorarios.push({
                  id: `h-${ag.id}-${diaNum}-${fIdx}`,
                  agenda_id: ag.id,
                  clinica_id: ag.clinica_id,
                  profesional_id: ag.profesional_id,
                  servicio_id: ag.servicio_id || null,
                  consultorio_id: ag.consultorio_id,
                  dia_semana: diaNum,
                  hora_inicio: franja.hora_inicio,
                  hora_fin: franja.hora_fin,
                  duracion_slot_min: Number(ag.duracion_slot_min || 15),
                  modalidad: franja.modalidad || ag.modalidad || 'PRESENCIAL',
                  fecha_desde: ag.fecha_desde || null,
                  fecha_hasta: ag.fecha_hasta || null,
                  activo: true
                });
              }
            });
          }
        });
      }
    });

    const updated = [...allHorarios, ...newHorarios];
    StorageService.saveCollection(STORAGE_KEYS.HORARIOS, updated);

    // Sincronizar también la duración en la ficha del profesional si tiene agenda activa
    if (agendasActivas.length > 0 && agendasActivas[0].duracion_slot_min) {
      const slotMin = Number(agendasActivas[0].duracion_slot_min);
      const profs = StorageService.getCollection(STORAGE_KEYS.PROFESIONALES);
      const profIndex = profs.findIndex(p => String(p.id) === String(profesionalId));
      if (profIndex >= 0 && profs[profIndex].duracion_turno_minutos !== slotMin) {
        profs[profIndex].duracion_turno_minutos = slotMin;
        StorageService.saveCollection(STORAGE_KEYS.PROFESIONALES, profs);
      }
    }

    return newHorarios;
  },

  // Sanitiza y purga definitivamente cualquier horario residual de domingo o corrupto
  sanitizarHorariosHuerfanos: () => {
    let horarios = StorageService.getCollection(STORAGE_KEYS.HORARIOS);
    if (!horarios || !Array.isArray(horarios)) return;
    
    // Purgar domingos (dia_semana === 0) y horarios inválidos
    const clean = horarios.filter(h => 
      h.profesional_id && 
      Number(h.dia_semana) !== 0 && 
      Number(h.dia_semana) >= 1 && 
      Number(h.dia_semana) <= 6 &&
      h.activo !== false
    );

    StorageService.saveCollection(STORAGE_KEYS.HORARIOS, clean);
  },

  // HORARIOS / GRILLAS DE AGENDA
  getHorarios: () => StorageService.getCollection(STORAGE_KEYS.HORARIOS) || [],
  getHorariosByProfesional: (profesionalId, clinicaId = null) => {
    if (!profesionalId) return [];
    
    let list = StorageService.getHorarios().filter(h => 
      String(h.profesional_id) === String(profesionalId) && 
      Number(h.dia_semana) !== 0 &&
      Number(h.dia_semana) >= 1 && 
      Number(h.dia_semana) <= 6 &&
      h.activo !== false
    );

    // Si no hay horarios explícitos en tabla HORARIOS, sincronizar desde AGENDAS
    if (list.length === 0) {
      list = StorageService.sincronizarHorariosDesdeAgendas(profesionalId);
    }

    if (clinicaId && clinicaId !== 'TODAS' && clinicaId !== 'ALL') {
      list = list.filter(h => !h.clinica_id || h.clinica_id === clinicaId);
    }

    return list;
  },
  saveHorario: (horario) => {
    const items = StorageService.getHorarios();
    if (Number(horario.dia_semana) === 0) return horario; // Bloquear domingos
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
  configurarAgendaSemanal: ({ profesional_id, clinica_id = null, servicio_id, dias_semana, turnos_horarios, consultorio_id, duracion_slot_min, modalidad = 'PRESENCIAL', fecha_desde = null, fecha_hasta = null, nombre = 'Agenda de Consultas' }) => {
    const diasNum = dias_semana.map(Number).filter(d => d >= 1 && d <= 6);
    const targetClinicaId = clinica_id || StorageService.getClinicaActiva()?.id;
    
    // Crear o actualizar la entidad Agenda formal
    const agendaObj = {
      profesional_id,
      clinica_id: targetClinicaId,
      servicio_id: servicio_id || null,
      consultorio_id,
      nombre,
      fecha_desde: fecha_desde || getLocalDateString(new Date()),
      fecha_hasta: fecha_hasta || null,
      duracion_slot_min: Number(duracion_slot_min || 20),
      modalidad,
      max_sobreturnos_dia: 2,
      dias_horarios: diasNum.map(dia => ({
        dia_semana: dia,
        franjas: turnos_horarios.map(th => ({
          hora_inicio: th.hora_inicio,
          hora_fin: th.hora_fin,
          modalidad: th.modalidad || modalidad
        }))
      })),
      estado: 'ACTIVA'
    };

    StorageService.saveAgenda(agendaObj);
    return StorageService.getHorariosByProfesional(profesional_id);
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
    const items = StorageService.getCollection(STORAGE_KEYS.PACIENTES);
    const paciente = items.find(p => p.id === id);
    if (!paciente) return { success: false, error: 'Paciente no encontrado.' };

    const cleanDni = String(paciente.dni || '').replace(/\D/g, '');

    // 1. Validar si tiene turnos
    const allTurnos = StorageService.getTurnos();
    const turnosDelPaciente = allTurnos.filter(t => 
      t.paciente_id === id || 
      (cleanDni && String(t.dni || t.paciente_dni || '').replace(/\D/g, '') === cleanDni)
    );

    // 2. Validar si tiene atenciones / Historia Clínica (HCE)
    const atencionesHce = StorageService.getCollection(STORAGE_KEYS.ATENCIONES_HCE) || [];
    const atencionesDelPaciente = atencionesHce.filter(a => 
      a.paciente_id === id || 
      (cleanDni && String(a.dni || a.paciente_dni || '').replace(/\D/g, '') === cleanDni)
    );

    // 3. Validar si tiene comprobantes de facturación (ARCA)
    const comprobantes = StorageService.getCollection(STORAGE_KEYS.COMPROBANTES_ARCA) || [];
    const facturasDelPaciente = comprobantes.filter(c => 
      c.paciente_id === id || 
      (cleanDni && String(c.receptor?.doc_nro || '').replace(/\D/g, '') === cleanDni)
    );

    // 4. Validar si tiene movimientos de caja
    const movsCaja = StorageService.getCollection(STORAGE_KEYS.MOVIMIENTOS_CAJA) || [];
    const movsCajaPaciente = movsCaja.filter(m => 
      (cleanDni && String(m.paciente_dni || '').replace(/\D/g, '') === cleanDni)
    );

    const motivos = [];
    if (turnosDelPaciente.length > 0) motivos.push(`${turnosDelPaciente.length} turno(s) en su historial`);
    if (atencionesDelPaciente.length > 0) motivos.push(`${atencionesDelPaciente.length} atención(es) en Historia Clínica`);
    if (facturasDelPaciente.length > 0) motivos.push(`${facturasDelPaciente.length} comprobante(s) de facturación ARCA`);
    if (movsCajaPaciente.length > 0) motivos.push(`${movsCajaPaciente.length} movimiento(s) de caja`);

    if (motivos.length > 0) {
      throw new Error(`No es posible eliminar al paciente "${paciente.nombre} ${paciente.apellido}" porque posee registros asociados (${motivos.join(', ')}). Para preservar la trazabilidad médico-legal y contable, debe mantener su ficha o marcarlo como INACTIVO.`);
    }

    const updated = items.filter(p => p.id !== id);
    StorageService.saveCollection(STORAGE_KEYS.PACIENTES, updated);
    return { success: true };
  },

  // Limpieza integral de facturación y turnos para pruebas limpias
  limpiarFacturacion: () => {
    StorageService.saveCollection(STORAGE_KEYS.MOVIMIENTOS_CAJA, []);
    StorageService.saveCollection(STORAGE_KEYS.COMPROBANTES_ARCA, []);
    StorageService.saveCollection(STORAGE_KEYS.LOTES_FACTURACION, []);
    StorageService.saveCollection(STORAGE_KEYS.CUENTAS_CORRIENTES_PACIENTES, []);
    StorageService.saveCollection(STORAGE_KEYS.MOVIMIENTOS_CTA_CTE_PACIENTES, []);
    StorageService.saveCollection(STORAGE_KEYS.CUENTAS_CORRIENTES_OS, []);
    StorageService.saveCollection(STORAGE_KEYS.MOVIMIENTOS_CTA_CTE_OS, []);
  },

  resetTurnosYFacturacion: () => {
    StorageService.saveCollection(STORAGE_KEYS.TURNOS, []);
    StorageService.saveCollection(STORAGE_KEYS.ATENCIONES_HCE, []);
    StorageService.limpiarFacturacion();
  },

  // PARSER INTELIGENTE DE PACIENTES PARA PSICOLOGÍA Y FORMULARIOS GOOGLE FORMS / EXCEL
  parseGoogleSheetsText: (rawText) => {
    if (!rawText || !rawText.trim()) return [];
    
    const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return [];

    const firstLine = lines[0];
    const isTSV = firstLine.includes('\t');
    const separator = isTSV ? '\t' : (firstLine.includes(';') ? ';' : ',');

    const splitRow = (rowStr) => {
      if (separator === '\t') {
        return rowStr.split('\t').map(c => c.trim().replace(/^["']|["']$/g, ''));
      }
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === separator && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const headerCells = splitRow(firstLine).map(h => h.toLowerCase().trim());
    
    let colMap = {
      marca_temporal: -1,
      email: -1,
      nombre_completo: -1,
      dni: -1,
      celular: -1,
      domicilio: -1,
      contacto_emergencia: -1,
      servicio_emergencia: -1,
      edad: -1,
      obra_social: -1,
      con_quien_vive: -1,
      consentimiento: -1
    };

    const hasHeader = headerCells.some(h => 
      h.includes('marca') || h.includes('correo') || h.includes('email') || 
      h.includes('nombre') || h.includes('dni') || h.includes('celular') || 
      h.includes('domicilio') || h.includes('emergencia') || h.includes('edad') ||
      h.includes('social') || h.includes('vive') || h.includes('consentimiento')
    );

    if (hasHeader) {
      headerCells.forEach((h, idx) => {
        // 1. Prioridad: Contacto de Emergencia / Familiar (para no confundirlo con el nombre del paciente)
        if (h.includes('llamar') || h.includes('familiar') || h.includes('necesario') || h.includes('caso de ser necesario') || (h.includes('contacto') && !h.includes('directo'))) {
          colMap.contacto_emergencia = idx;
        }
        // 2. Servicio de Emergencia Médica (Ambulancia)
        else if (h.includes('servicio de emergencia') || h.includes('posee servicio') || (h.includes('emergencia') && !h.includes('llamar'))) {
          colMap.servicio_emergencia = idx;
        }
        // 3. Con quién vive
        else if (h.includes('vive') || h.includes('convive') || h.includes('conviviente') || h.includes('hogar')) {
          colMap.con_quien_vive = idx;
        }
        // 4. Obra Social
        else if (h.includes('obra social') || h.includes('prepaga') || h.includes('cobertura') || h.includes('social')) {
          colMap.obra_social = idx;
        }
        // 5. Consentimiento Informado
        else if (h.includes('consentimiento') || h.includes('términos') || h.includes('trminos') || h.includes('acepto')) {
          colMap.consentimiento = idx;
        }
        // 6. Marca Temporal / Timestamp
        else if (h.includes('marca') || h.includes('timestamp') || h.includes('hora') || h.includes('fecha')) {
          colMap.marca_temporal = idx;
        }
        // 7. Email
        else if (h.includes('correo') || h.includes('email') || h.includes('electr')) {
          colMap.email = idx;
        }
        // 8. Domicilio
        else if (h.includes('domicilio') || h.includes('reside') || h.includes('direcci') || h.includes('calle')) {
          colMap.domicilio = idx;
        }
        // 9. DNI / Documento
        else if (h.includes('dni') || h.includes('documento') || h.includes('cédula')) {
          colMap.dni = idx;
        }
        // 10. Celular del Paciente
        else if (h.includes('celular') || h.includes('whatsapp') || (h.includes('tel') && !h.includes('llamar'))) {
          colMap.celular = idx;
        }
        // 11. Edad
        else if (h.includes('edad') || h.includes('años')) {
          colMap.edad = idx;
        }
        // 12. Nombre Completo del Paciente
        else if (h.includes('nombre') || h.includes('apellido') || h.includes('paciente')) {
          colMap.nombre_completo = idx;
        }
      });
    } else {
      // Mapeo por defecto según las columnas exactas del formulario
      colMap = {
        marca_temporal: 0,
        email: 1,
        nombre_completo: 2,
        dni: 3,
        celular: 4,
        domicilio: 5,
        contacto_emergencia: 6,
        servicio_emergencia: 7,
        edad: 8,
        obra_social: 9,
        con_quien_vive: 10,
        consentimiento: 11
      };
    }

    const dataRows = hasHeader ? lines.slice(1) : lines;
    const parsedPatients = [];

    dataRows.forEach((rowStr, rowIndex) => {
      const cells = splitRow(rowStr);
      if (cells.length < 2 || !cells.some(c => c.length > 0)) return;

      const getVal = (colIdx) => (colIdx >= 0 && colIdx < cells.length) ? cells[colIdx].trim() : '';

      const rawMarcaTemporal = getVal(colMap.marca_temporal);
      const rawEmail = getVal(colMap.email);
      let rawNombreCompleto = getVal(colMap.nombre_completo);
      const rawDni = getVal(colMap.dni);
      let rawCelular = getVal(colMap.celular);
      const rawDomicilio = getVal(colMap.domicilio);
      const rawContactoEmergencia = getVal(colMap.contacto_emergencia);
      const rawServicioEmergencia = getVal(colMap.servicio_emergencia);
      const rawEdad = getVal(colMap.edad);
      const rawObraSocial = getVal(colMap.obra_social);
      const rawConQuienVive = getVal(colMap.con_quien_vive);
      const rawConsentimiento = getVal(colMap.consentimiento);

      // Si el nombre viene con un teléfono pegado al inicio (ej: "3515449908 Pedro Rumualdo"), sanitizarlo
      if (/^\+?\d{6,}/.test(rawNombreCompleto.trim())) {
        const phoneMatch = rawNombreCompleto.trim().match(/^(\+?\d[\d\s\-]{6,}\d)\s*(.*)$/);
        if (phoneMatch) {
          if (!rawCelular) rawCelular = phoneMatch[1].trim();
          rawNombreCompleto = phoneMatch[2].trim();
        }
      }

      // 1. Separación de Nombre y Apellido
      let nombre = '';
      let apellido = '';
      if (rawNombreCompleto.includes(',')) {
        const parts = rawNombreCompleto.split(',');
        apellido = parts[0].trim();
        nombre = parts.slice(1).join(' ').trim();
      } else if (rawNombreCompleto) {
        const words = rawNombreCompleto.split(/\s+/);
        if (words.length === 1) {
          nombre = words[0];
          apellido = '';
        } else if (words.length === 2) {
          nombre = words[0];
          apellido = words[1];
        } else {
          nombre = words.slice(0, Math.ceil(words.length / 2)).join(' ');
          apellido = words.slice(Math.ceil(words.length / 2)).join(' ');
        }
      }

      // 2. DNI
      const cleanDni = rawDni.replace(/\D/g, '');

      // 3. Celular normalizado
      let cleanCelular = rawCelular;
      if (cleanCelular && !cleanCelular.startsWith('+')) {
        const digits = cleanCelular.replace(/\D/g, '');
        if (digits.length >= 8) {
          cleanCelular = digits.startsWith('54') ? `+${digits}` : (digits.startsWith('9') ? `+54 ${digits}` : `+54 9 ${digits}`);
        }
      }

      // 4. Contactos Familiares Múltiples
      const contactosFamiliares = [];
      if (rawContactoEmergencia) {
        const rawSegments = rawContactoEmergencia.split(/\s*(?:\/|;|\n|\be\b|\by\b)\s*/i);
        
        rawSegments.forEach((seg, sIdx) => {
          const segTrim = seg.trim();
          if (!segTrim) return;

          const phoneMatch = segTrim.match(/(?:\+?54\s*9?)?\s*(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/);
          const tel = phoneMatch ? phoneMatch[0].trim() : '';

          let nameAndRel = segTrim.replace(tel, '').replace(/cel(?:ular)?|tel(?:éfono)?|llam(?:ar)?|a(?:l)?|contacto:?/gi, '').trim();
          nameAndRel = nameAndRel.replace(/^[:\-–,]+|[:\-–,]+$/g, '').trim();

          let relacion = 'Familiar / Referente';
          const relMatch = nameAndRel.match(/\b(mam[aá]|madre|pap[aá]|padre|pareja|espos[oa]|novi[oa]|c[oó]nyuge|hij[oa]|tutor(?:a)?|herman[oa]|t[ií][oa]|prim[oa]|abuel[oa]|amig[oa]|psiquiatra|m[eé]dico)\b/i);
          if (relMatch) {
            const rWord = relMatch[1].toLowerCase();
            if (rWord.includes('mam') || rWord.includes('madr')) relacion = 'Madre';
            else if (rWord.includes('pap') || rWord.includes('padr')) relacion = 'Padre';
            else if (rWord.includes('pareja') || rWord.includes('espos') || rWord.includes('novi') || rWord.includes('cóny')) relacion = 'Pareja';
            else if (rWord.includes('hij')) relacion = 'Hijo/a';
            else if (rWord.includes('tutor')) relacion = 'Tutor/a';
            else if (rWord.includes('herman')) relacion = 'Hermano/a';
            else if (rWord.includes('ti') || rWord.includes('tí')) relacion = 'Tío/a';
            else if (rWord.includes('abuel')) relacion = 'Abuelo/a';
            else if (rWord.includes('amig')) relacion = 'Amigo/a de confianza';
            else if (rWord.includes('psiq') || rWord.includes('méd') || rWord.includes('med')) relacion = 'Profesional tratante';

            nameAndRel = nameAndRel.replace(new RegExp(`\\(?\\b${relMatch[1]}\\b\\)?`, 'gi'), '').trim();
            nameAndRel = nameAndRel.replace(/^[:\-–,]+|[:\-–,]+$/g, '').trim();
          }

          contactosFamiliares.push({
            id: `fam-imp-${rowIndex}-${sIdx}`,
            nombre: nameAndRel || `Contacto Familiar ${sIdx + 1}`,
            relacion: relacion,
            telefono: tel || segTrim,
            es_principal: sIdx === 0,
            notas: ''
          });
        });
      }

      // 5. Servicio de Emergencia
      const servLow = (rawServicioEmergencia || '').toLowerCase();
      const poseeEmergencia = Boolean(
        rawServicioEmergencia && 
        !servLow.includes('no') && 
        !servLow.includes('ningun') && 
        servLow !== '-' && 
        servLow !== '.'
      );
      const servicioEmergenciaObj = {
        posee: poseeEmergencia,
        nombre: poseeEmergencia ? (rawServicioEmergencia.replace(/^s[ií][,:\s]*/i, '').trim() || 'Servicio de Emergencia') : 'No posee'
      };

      // 6. Consentimiento
      const consLow = (rawConsentimiento || '').toLowerCase();
      const aceptoConsentimiento = Boolean(
        consLow.includes('s') || 
        consLow.includes('acepto') || 
        consLow.includes('true') || 
        consLow.includes('ok') || 
        consLow.includes('1') || 
        consLow === 'x'
      );

      parsedPatients.push({
        _rawIndex: rowIndex + 1,
        id: `pac-imp-${Date.now()}-${rowIndex}`,
        nombre: nombre || 'Sin Nombre',
        apellido: apellido || 'Sin Apellido',
        nombre_completo: rawNombreCompleto || `${nombre} ${apellido}`,
        dni: cleanDni || `S-DNI-${rowIndex + 1}`,
        telefono_whatsapp: cleanCelular || '',
        email: rawEmail || '',
        domicilio: rawDomicilio || '',
        edad: rawEdad ? (parseInt(rawEdad.replace(/\D/g, '')) || rawEdad) : '',
        con_quien_vive: rawConQuienVive || '',
        contactos_familiares: contactosFamiliares,
        servicio_emergencia: servicioEmergenciaObj,
        obra_social_nombre: rawObraSocial || 'Particular',
        obra_social_id: '',
        consentimiento_informado: {
          aceptado: aceptoConsentimiento,
          fecha_firma: rawMarcaTemporal || new Date().toISOString()
        },
        marca_temporal_registro: rawMarcaTemporal || new Date().toISOString(),
        alergias: '',
        antecedentes: rawConQuienVive ? `Admisión psicológica: Convivencia (${rawConQuienVive})` : '',
        activo: true
      });
    });

    return parsedPatients;
  },

  importarPacientesMasivo: (pacientesArray, options = { onDuplicate: 'update' }) => {
    const items = StorageService.getCollection(STORAGE_KEYS.PACIENTES);
    const obrasSociales = StorageService.getCollection(STORAGE_KEYS.OBRAS_SOCIALES);
    const clinicaId = StorageService.getClinicaActiva().id;

    let creados = 0;
    let actualizados = 0;
    const errores = [];

    pacientesArray.forEach((p, idx) => {
      try {
        const cleanDni = String(p.dni || '').replace(/\D/g, '');
        if (!cleanDni && !p.nombre) {
          errores.push({ fila: idx + 1, error: 'Paciente sin DNI ni Nombre' });
          return;
        }

        // Mapear Obra Social por coincidencia de nombre o sigla
        let osId = p.obra_social_id;
        if (!osId && p.obra_social_nombre) {
          const osLow = p.obra_social_nombre.toLowerCase();
          const matchOS = obrasSociales.find(os => 
            os.nombre.toLowerCase().includes(osLow) || 
            (os.sigla && os.sigla.toLowerCase() === osLow) ||
            osLow.includes(os.nombre.toLowerCase())
          );
          osId = matchOS ? matchOS.id : 'os-1';
        }
        if (!osId) osId = 'os-1';

        const pacienteToSave = {
          ...p,
          dni: cleanDni,
          obra_social_id: osId,
          clinica_id: p.clinica_id || clinicaId,
          activo: true
        };

        const existingIdx = cleanDni ? items.findIndex(item => String(item.dni).replace(/\D/g, '') === cleanDni) : -1;

        if (existingIdx >= 0) {
          if (options.onDuplicate === 'update') {
            items[existingIdx] = {
              ...items[existingIdx],
              ...pacienteToSave,
              id: items[existingIdx].id
            };
            actualizados++;
          }
        } else {
          pacienteToSave.id = `pac-${Date.now()}-${idx}-${Math.floor(Math.random()*1000)}`;
          items.push(pacienteToSave);
          creados++;
        }
      } catch (err) {
        errores.push({ fila: idx + 1, error: err.message });
      }
    });

    StorageService.saveCollection(STORAGE_KEYS.PACIENTES, items);
    return { creados, actualizados, total: creados + actualizados, errores };
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
  // ==============================================================================
  // VALIDACIÓN CLÍNICA ESTRICTA DE TURNOS (Colisiones, Fechas Pasadas, Cupos)
  // ==============================================================================
  validarTurno: (turnoData, { ignorarTurnoId = null, permitirPasado = false } = {}) => {
    if (!turnoData) return { valido: false, codigo: 'DATOS_INVALIDOS', mensaje: 'Datos de turno requeridos.' };
    
    const todayStr = getLocalDateString(new Date());
    const now = new Date();
    const currentMinutesNow = now.getHours() * 60 + now.getMinutes();

    // 1. Validar que no sea fecha pasada
    if (!permitirPasado && turnoData.fecha < todayStr) {
      return {
        valido: false,
        codigo: 'FECHA_PASADA',
        mensaje: `No es posible agendar turnos en fechas pasadas (${turnoData.fecha}).`
      };
    }

    // 2. Validar que no sea una hora pasada en el día de hoy
    if (!permitirPasado && turnoData.fecha === todayStr && turnoData.hora_inicio) {
      const [h, m] = turnoData.hora_inicio.split(':').map(Number);
      const turnoStartMinutes = h * 60 + m;
      if (turnoStartMinutes <= currentMinutesNow) {
        return {
          valido: false,
          codigo: 'HORA_PASADA',
          mensaje: `No es posible agendar turnos en horarios que ya transcurrieron hoy (${turnoData.hora_inicio}).`
        };
      }
    }

    // 3. Validar si la fecha es Feriado Nacional
    const feriado = getFeriadoNacional(turnoData.fecha);
    const profs = StorageService.getCollection(STORAGE_KEYS.PROFESIONALES) || [];
    const prof = profs.find(p => String(p.id) === String(turnoData.profesional_id));
    const atiendeFeriados = prof?.atiende_feriados === true;

    if (feriado && !atiendeFeriados && !turnoData.es_sobreturno && !permitirPasado) {
      return {
        valido: false,
        codigo: 'DIA_FERIADO',
        mensaje: `La fecha seleccionada es Feriado Nacional (${feriado.nombre}) y el profesional no atiende feriados.`
      };
    }

    // 4. Validar colisiones horarias para el mismo profesional (salvo sobreturno explícito)
    if (!turnoData.es_sobreturno) {
      const turnosExistentes = (StorageService.getCollection(STORAGE_KEYS.TURNOS) || []).filter(t => 
        String(t.profesional_id) === String(turnoData.profesional_id) &&
        t.fecha === turnoData.fecha &&
        t.estado !== 'CANCELADO' &&
        (!ignorarTurnoId || t.id !== ignorarTurnoId) &&
        (!turnoData.id || t.id !== turnoData.id)
      );

      const [nHIni, nMIni] = (turnoData.hora_inicio || '00:00').split(':').map(Number);
      const nStart = nHIni * 60 + nMIni;
      let nEnd;
      if (turnoData.hora_fin) {
        const [nHFin, nMFin] = turnoData.hora_fin.split(':').map(Number);
        nEnd = nHFin * 60 + nMFin;
      } else {
        const dur = Number(prof?.duracion_turno_minutos) || 20;
        nEnd = nStart + dur;
      }

      const colision = turnosExistentes.find(t => {
        if (!t.hora_inicio) return false;
        const [tHIni, tMIni] = t.hora_inicio.split(':').map(Number);
        const tStart = tHIni * 60 + tMIni;
        let tEnd;
        if (t.hora_fin) {
          const [tHFin, tMFin] = t.hora_fin.split(':').map(Number);
          tEnd = tHFin * 60 + tMFin;
        } else {
          tEnd = tStart + 20;
        }
        return Math.max(tStart, nStart) < Math.min(tEnd, nEnd);
      });

      if (colision) {
        return {
          valido: false,
          codigo: 'COLISION_HORARIO',
          mensaje: `El profesional ya tiene un turno reservado (${colision.hora_inicio} a ${colision.hora_fin || 'fin'}) para esta fecha y horario.`,
          colision
        };
      }
    } else {
      // 5. Validar límite máximo de sobreturnos
      const maxSobreturnos = Number(prof?.max_sobreturnos_dia || 3);
      const sobreturnosHoy = (StorageService.getCollection(STORAGE_KEYS.TURNOS) || []).filter(t => 
        String(t.profesional_id) === String(turnoData.profesional_id) &&
        t.fecha === turnoData.fecha &&
        t.es_sobreturno &&
        t.estado !== 'CANCELADO' &&
        (!ignorarTurnoId || t.id !== ignorarTurnoId) &&
        (!turnoData.id || t.id !== turnoData.id)
      ).length;

      if (sobreturnosHoy >= maxSobreturnos) {
        return {
          valido: false,
          codigo: 'MAX_SOBRETURNOS_EXCEDIDO',
          mensaje: `Se alcanzó el límite máximo de sobreturnos permitidos (${maxSobreturnos}) para este profesional en la fecha seleccionada.`
        };
      }
    }

    return { valido: true };
  },

  saveTurno: (turno, options = {}) => {
    const items = StorageService.getCollection(STORAGE_KEYS.TURNOS) || [];
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

  // SLOTS DISPONIBLES (Filtrado por profesional, fecha, servicio, modalidad y sede opcionales)
  getSlotsDisponibles: (profesionalId, fechaStr, servicioId = null, modalidad = null, clinicaId = null) => {
    if (!profesionalId || !fechaStr) return [];

    const todayStr = getLocalDateString(new Date());
    const now = new Date();
    const currentMinutesNow = now.getHours() * 60 + now.getMinutes();
    const esDiaHoy = fechaStr === todayStr;
    const esDiaPasado = fechaStr < todayStr;

    // Verificar si es Feriado Nacional y si el médico atiende feriados
    const feriado = getFeriadoNacional(fechaStr);
    const profs = StorageService.getCollection(STORAGE_KEYS.PROFESIONALES) || [];
    const prof = profs.find(p => String(p.id) === String(profesionalId));
    const atiendeFeriados = prof?.atiende_feriados === true;
    const esFeriadoNoAtendido = feriado && !atiendeFeriados;

    const diaSemana = getDayOfWeekFromDateString(fechaStr);
    // Domingo nunca tiene atención en nuestro sistema clínico
    if (diaSemana === 0) return [];

    const bloqueos = StorageService.getBloqueos();
    const esBloqueado = bloqueos.some(b => {
      const matchFecha = fechaStr >= b.fecha_inicio && fechaStr <= b.fecha_fin;
      if (!matchFecha) return false;
      if (!b.profesional_id) return true;
      if (b.profesional_id === profesionalId) return true;
      return false;
    });

    if (esBloqueado || esFeriadoNoAtendido) return [];

    // Obtener horarios que coincidan con el día de la semana y vigencia activa
    const allAgendas = StorageService.getAgendas(null, profesionalId, true);
    let horarios = StorageService.getHorariosByProfesional(profesionalId, clinicaId).filter(h => {
      if (Number(h.dia_semana) !== Number(diaSemana)) return false;
      if (h.activo === false) return false;
      // Validar que la agenda padre esté ACTIVA
      if (h.agenda_id) {
        const ag = allAgendas.find(a => a.id === h.agenda_id);
        if (ag && ag.estado !== 'ACTIVA') return false;
      }
      // Validar vigencia de fecha de la agenda
      if (h.fecha_desde && fechaStr < h.fecha_desde) return false;
      if (h.fecha_hasta && fechaStr > h.fecha_hasta) return false;
      return true;
    });
    if (servicioId) {
      horarios = horarios.filter(h => !h.servicio_id || h.servicio_id === servicioId);
    }
    // Filtrar por modalidad si fue especificada ('PRESENCIAL' u 'ONLINE')
    if (modalidad) {
      horarios = horarios.filter(h => !h.modalidad || h.modalidad === 'AMBAS' || h.modalidad === modalidad);
    }
    if (horarios.length === 0) return [];

    // Turnos ya agendados para este profesional y fecha (excluyendo cancelados)
    const turnosExistentes = (StorageService.getCollection(STORAGE_KEYS.TURNOS) || []).filter(t => 
      String(t.profesional_id) === String(profesionalId) && 
      t.fecha === fechaStr && 
      t.estado !== 'CANCELADO'
    );

    const consultoriosList = StorageService.getConsultorios('TODAS');
    const clinicasList = StorageService.getClinicasList();
    const slots = [];

    horarios.forEach(h => {
      const [hIni, mIni] = h.hora_inicio.split(':').map(Number);
      const [hFin, mFin] = h.hora_fin.split(':').map(Number);
      const slotDuration = Number(h.duracion_slot_min) || 20;

      let currentMinutes = hIni * 60 + mIni;
      const endMinutes = hFin * 60 + mFin;

      const consObj = consultoriosList.find(c => c.id === h.consultorio_id);
      const slotClinicaId = h.clinica_id || consObj?.clinica_id || StorageService.getClinicaActiva().id;
      const slotClinica = clinicasList.find(c => c.id === slotClinicaId) || clinicasList[0];

      while (currentMinutes + slotDuration <= endMinutes) {
        const slotHour = Math.floor(currentMinutes / 60);
        const slotMin = currentMinutes % 60;
        const horaStr = `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;
        
        const endSlotMinutes = currentMinutes + slotDuration;
        const endSlotHour = Math.floor(endSlotMinutes / 60);
        const endSlotMin = endSlotMinutes % 60;
        const horaFinStr = `${String(endSlotHour).padStart(2, '0')}:${String(endSlotMin).padStart(2, '0')}`;

        // Validación estricta de tiempo transcurrido (pasado)
        const esHoraPasada = esDiaPasado || (esDiaHoy && currentMinutes <= currentMinutesNow);

        // Validación estricta de solapamiento matemático: max(start1, start2) < min(end1, end2)
        const isOccupied = turnosExistentes.some(t => {
          if (!t.hora_inicio) return false;
          const [tHIni, tMIni] = t.hora_inicio.split(':').map(Number);
          const tStartMin = tHIni * 60 + tMIni;
          let tEndMin;
          if (t.hora_fin) {
            const [tHFin, tMFin] = t.hora_fin.split(':').map(Number);
            tEndMin = tHFin * 60 + tMFin;
          } else {
            tEndMin = tStartMin + slotDuration;
          }
          return Math.max(tStartMin, currentMinutes) < Math.min(tEndMin, endSlotMinutes);
        });

        slots.push({
          hora_inicio: horaStr,
          hora_fin: horaFinStr,
          disponible: !isOccupied && !esHoraPasada,
          es_pasado: esHoraPasada,
          esta_ocupado: isOccupied,
          consultorio_id: h.consultorio_id,
          consultorio_nombre: consObj?.nombre || 'Consultorio 1',
          clinica_id: slotClinicaId,
          clinica_nombre: slotClinica?.nombre || 'Sede Central',
          clinica_direccion: slotClinica?.direccion || '',
          clinica_color: slotClinica?.color_primario || '#0284c7',
          servicio_id: h.servicio_id,
          modalidad: h.modalidad || 'PRESENCIAL',
          duracion_min: slotDuration
        });

        currentMinutes += slotDuration;
      }
    });

    // Ordenar slots cronológicamente
    slots.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

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

    const [startYear, startMonth, startDay] = fecha_inicio.split('T')[0].split('-').map(Number);
    let currentDate = new Date(startYear, startMonth - 1, startDay, 12, 0, 0);
    let sessionsFound = 0;
    let safetyCounter = 0; // Evitar loop infinito

    while (sessionsFound < cantidad_sesiones && safetyCounter < 180) {
      safetyCounter++;
      const diaSemana = currentDate.getDay();
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, '0');
      const d = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      if (dias_semana.map(Number).includes(diaSemana)) {
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

  // CAJA RECAUDADORA Y ARQUEO DIARIO
  getMovimientosCaja: (clinicaId = null) => {
    const all = StorageService.getCollection(STORAGE_KEYS.MOVIMIENTOS_CAJA);
    if (!clinicaId || clinicaId === 'TODAS' || clinicaId === 'ALL') {
      return all;
    }
    const targetClinicaId = clinicaId || StorageService.getClinicaActiva().id;
    return all.filter(m => !m.clinica_id || m.clinica_id === targetClinicaId);
  },
  saveMovimientoCaja: (mov) => {
    const items = StorageService.getCollection(STORAGE_KEYS.MOVIMIENTOS_CAJA);
    const clinicaId = StorageService.getClinicaActiva().id;
    mov.clinica_id = mov.clinica_id || clinicaId;
    if (mov.id) {
      const idx = items.findIndex(m => m.id === mov.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...mov };
      else items.unshift(mov);
    } else {
      mov.id = `caj-${Date.now()}`;
      mov.fecha = mov.fecha || new Date().toISOString().split('T')[0];
      mov.hora = mov.hora || new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      mov.created_at = new Date().toISOString();
      items.unshift(mov);
    }
    StorageService.saveCollection(STORAGE_KEYS.MOVIMIENTOS_CAJA, items);
    return mov;
  },
  // LOTES DE FACTURACIÓN (PRESENTACIÓN A OBRAS SOCIALES & CPPC)
  getLotesFacturacion: (clinicaId = null) => {
    const all = StorageService.getCollection(STORAGE_KEYS.LOTES_FACTURACION);
    const targetClinicaId = clinicaId || StorageService.getClinicaActiva().id;
    return all.filter(l => !l.clinica_id || l.clinica_id === targetClinicaId);
  },
  saveLoteFacturacion: (lote) => {
    const items = StorageService.getCollection(STORAGE_KEYS.LOTES_FACTURACION);
    const clinicaId = StorageService.getClinicaActiva().id;
    lote.clinica_id = lote.clinica_id || clinicaId;
    if (lote.id) {
      const idx = items.findIndex(l => l.id === lote.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...lote, updated_at: new Date().toISOString() };
      else items.unshift(lote);
    } else {
      lote.id = `lote-${Date.now()}`;
      lote.numero_lote = lote.numero_lote || `LOTE-${new Date().getFullYear()}-${String(items.length + 1).padStart(4, '0')}`;
      lote.estado = lote.estado || 'BORRADOR'; // 'BORRADOR' | 'PRESENTADO' | 'AUDITADO' | 'LIQUIDADO' | 'COBRADO'
      lote.created_at = new Date().toISOString();
      items.unshift(lote);
    }
    StorageService.saveCollection(STORAGE_KEYS.LOTES_FACTURACION, items);
    return lote;
  },
  deleteLoteFacturacion: (id) => {
    const items = StorageService.getCollection(STORAGE_KEYS.LOTES_FACTURACION);
    const filtered = items.filter(l => l.id !== id);
    StorageService.saveCollection(STORAGE_KEYS.LOTES_FACTURACION, filtered);
    return true;
  },

  // CUENTAS CORRIENTES DE PACIENTES
  getMovimientosCtaCtePaciente: (pacienteId) => {
    const all = StorageService.getCollection(STORAGE_KEYS.MOVIMIENTOS_CTA_CTE_PACIENTES);
    if (!pacienteId) return all;
    return all.filter(m => m.paciente_id === pacienteId).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  },
  saveMovimientoCtaCtePaciente: (mov) => {
    const items = StorageService.getCollection(STORAGE_KEYS.MOVIMIENTOS_CTA_CTE_PACIENTES);
    const clinicaId = StorageService.getClinicaActiva().id;
    mov.clinica_id = mov.clinica_id || clinicaId;
    if (mov.id) {
      const idx = items.findIndex(m => m.id === mov.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...mov };
      else items.unshift(mov);
    } else {
      mov.id = `mctap-${Date.now()}`;
      mov.fecha = mov.fecha || new Date().toISOString().split('T')[0];
      mov.created_at = new Date().toISOString();
      items.unshift(mov);
    }
    StorageService.saveCollection(STORAGE_KEYS.MOVIMIENTOS_CTA_CTE_PACIENTES, items);
    return mov;
  },

  // CUENTAS CORRIENTES DE OBRAS SOCIALES / FINANCIADORES
  getMovimientosCtaCteOs: (obraSocialId) => {
    const all = StorageService.getCollection(STORAGE_KEYS.MOVIMIENTOS_CTA_CTE_OS);
    if (!obraSocialId) return all;
    return all.filter(m => m.obra_social_id === obraSocialId).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  },
  saveMovimientoCtaCteOs: (mov) => {
    const items = StorageService.getCollection(STORAGE_KEYS.MOVIMIENTOS_CTA_CTE_OS);
    const clinicaId = StorageService.getClinicaActiva().id;
    mov.clinica_id = mov.clinica_id || clinicaId;
    if (mov.id) {
      const idx = items.findIndex(m => m.id === mov.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...mov };
      else items.unshift(mov);
    } else {
      mov.id = `mctaos-${Date.now()}`;
      mov.fecha = mov.fecha || new Date().toISOString().split('T')[0];
      mov.created_at = new Date().toISOString();
      items.unshift(mov);
    }
    StorageService.saveCollection(STORAGE_KEYS.MOVIMIENTOS_CTA_CTE_OS, items);
    return mov;
  },

  // CONSENTIMIENTOS INFORMADOS DIGITALES
  getConsentimientos: (clinicaId = null) => {
    const all = StorageService.getCollection(STORAGE_KEYS.CONSENTIMIENTOS);
    const targetClinicaId = clinicaId || StorageService.getClinicaActiva().id;
    return all.filter(c => !c.clinica_id || c.clinica_id === targetClinicaId);
  },
  saveConsentimiento: (consentimiento) => {
    const items = StorageService.getCollection(STORAGE_KEYS.CONSENTIMIENTOS);
    const clinicaId = StorageService.getClinicaActiva().id;
    consentimiento.clinica_id = consentimiento.clinica_id || clinicaId;
    if (consentimiento.id) {
      const idx = items.findIndex(c => c.id === consentimiento.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...consentimiento };
      else items.unshift(consentimiento);
    } else {
      consentimiento.id = `cons-${Date.now()}`;
      consentimiento.firmado_en = new Date().toISOString();
      items.unshift(consentimiento);
    }
    StorageService.saveCollection(STORAGE_KEYS.CONSENTIMIENTOS, items);
    return consentimiento;
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
