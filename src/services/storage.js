// ==============================================================================
// GESTOR DE ALMACENAMIENTO Y LÓGICA DE NEGOCIO MULTI-TENANT (LOCAL & SUPABASE READY)
// ==============================================================================
import { createClient } from '@supabase/supabase-js';
import { getDayOfWeekFromDateString, getLocalDateString } from '../utils/dateUtils';

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

// Clínicas iniciales (Multi-Tenant)
export const INITIAL_CLINICAS = [
  {
    id: 'clinica-1',
    nombre: 'Centro de Salud y Psicología San Lucas',
    cuit: '30-71234567-9',
    direccion: 'Av. Colón 1250, Córdoba Capital, Córdoba',
    telefono: '+54 351 428-9000',
    whatsapp: '+54 9 351 428-9000',
    email: 'turnos@centrosanlucas.com.ar',
    mensaje_bienvenida: 'Bienvenido al turnero online de Centro San Lucas. Atención psicológica y especialidades médicas.',
    color_primario: '#6366f1',
    condicion_iva: 'MONO',
    punto_venta: 1,
    iibb: '28490182-9',
    inicio_actividades: '2021-03-01',
    activa: true
  },
  {
    id: 'clinica-2',
    nombre: 'Consultorios de Salud Mental Belgrano',
    cuit: '30-79812345-1',
    direccion: 'Av. Cabildo 1850, Belgrano, CABA',
    telefono: '+54 11 4781-4400',
    whatsapp: '+54 9 11 4781-4400',
    email: 'contacto@consultoriosbelgrano.com.ar',
    mensaje_bienvenida: 'Policonsultorios Belgrano - Psicología, Psiquiatría y Especialidades Médicas.',
    color_primario: '#0d9488',
    condicion_iva: 'RI',
    punto_venta: 2,
    iibb: '90128490-1',
    inicio_actividades: '2020-01-15',
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
    { id: 'c-0', clinica_id: 'clinica-1', nombre: 'Consultorio 1 - Psicología & Terapia Individual', piso_ubicacion: 'Planta Alta - Sala 1', equipamiento: 'Sillones de lectura, escritorio, insonorización', activo: true },
    { id: 'c-0b', clinica_id: 'clinica-1', nombre: 'Consultorio 2 - Psicología Infanto-Juvenil & Pareja', piso_ubicacion: 'Planta Alta - Sala 2', equipamiento: 'Caja de juegos diagnósticos, mesa infantil, sillones', activo: true },
    { id: 'c-1', clinica_id: 'clinica-1', nombre: 'Consultorio 3 - Cardiología & Clínica', piso_ubicacion: 'Planta Baja', equipamiento: 'Electrocardiógrafo, Tensiómetro, Camilla', activo: true },
    { id: 'c-2', clinica_id: 'clinica-1', nombre: 'Consultorio 4 - Diagnóstico por Imágenes & Ecografía', piso_ubicacion: 'Piso 1 - Sala A', equipamiento: 'Ecógrafo Doppler Color', activo: true },
    { id: 'c-3', clinica_id: 'clinica-1', nombre: 'Consultorio 5 - Pediatría', piso_ubicacion: 'Planta Baja', equipamiento: 'Balanza pediátrica, Tallímetro, Otoscopio', activo: true }
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
      id: 'prof-psi-3',
      clinica_id: 'clinica-1',
      nombre: 'Nahuel',
      apellido: 'López',
      matricula_provincial: 'M.P. 9.871 CPPC',
      matricula_nacional: 'MN 46.520',
      especialidad: 'Psicología y Salud Mental',
      especialidad_id: 'esp-0',
      servicios_ids: ['serv-0a', 'serv-0b', 'serv-0c'],
      email: 'nlopez@centrosanlucas.com.ar',
      telefono: '351 445-9922',
      duracion_turno_minutos: 45,
      max_sobreturnos_dia: 2,
      color_agenda: '#0ea5e9',
      obras_sociales_ids: ['os-1', 'os-apross', 'os-cppc', 'os-2', 'os-3'],
      atiende_particular: true,
      atiende_online: true,
      activo: true
    },
    {
      id: 'prof-1',
      clinica_id: 'clinica-1',
      nombre: 'Martín',
      apellido: 'Pérez Rossi',
      matricula_nacional: 'MN 114.829',
      matricula_provincial: 'MP 45.291',
      especialidad: 'Cardiología',
      especialidad_id: 'esp-1',
      servicios_ids: ['serv-1', 'serv-2'],
      email: 'mperez@centrosanlucas.com.ar',
      telefono: '351 5521-4411',
      duracion_turno_minutos: 20,
      max_sobreturnos_dia: 4,
      color_agenda: '#0284c7',
      obras_sociales_ids: ['os-1', 'os-apross', 'os-2', 'os-3', 'os-4', 'os-5', 'os-8'],
      atiende_particular: true,
      atiende_online: false,
      activo: true
    }
  ],
  horarios: [
    // Lic. Sofía Albarracín: Lunes (Presencial), Miércoles (Online/Telepsicología), Jueves (Ambas)
    { id: 'h-psi-1', profesional_id: 'prof-psi-1', servicio_id: 'serv-0a', consultorio_id: 'c-0', dia_semana: 1, hora_inicio: '14:00', hora_fin: '20:00', duracion_slot_min: 45, modalidad: 'PRESENCIAL', activo: true },
    { id: 'h-psi-2', profesional_id: 'prof-psi-1', servicio_id: 'serv-0a', consultorio_id: 'c-0', dia_semana: 3, hora_inicio: '09:00', hora_fin: '15:00', duracion_slot_min: 45, modalidad: 'ONLINE', activo: true },
    { id: 'h-psi-3', profesional_id: 'prof-psi-1', servicio_id: 'serv-0b', consultorio_id: 'c-0', dia_semana: 4, hora_inicio: '15:00', hora_fin: '20:00', duracion_slot_min: 60, modalidad: 'AMBAS', activo: true },
    // Lic. Nahuel López: Lunes a Viernes (Días 1, 2, 3, 4, 5) de 08:00 a 14:00
    { id: 'h-nl-1', profesional_id: 'prof-psi-3', servicio_id: 'serv-0a', consultorio_id: 'c-0', dia_semana: 1, hora_inicio: '08:00', hora_fin: '14:00', duracion_slot_min: 45, modalidad: 'PRESENCIAL', activo: true },
    { id: 'h-nl-2', profesional_id: 'prof-psi-3', servicio_id: 'serv-0a', consultorio_id: 'c-0', dia_semana: 2, hora_inicio: '08:00', hora_fin: '14:00', duracion_slot_min: 45, modalidad: 'PRESENCIAL', activo: true },
    { id: 'h-nl-3', profesional_id: 'prof-psi-3', servicio_id: 'serv-0a', consultorio_id: 'c-0', dia_semana: 3, hora_inicio: '08:00', hora_fin: '14:00', duracion_slot_min: 45, modalidad: 'ONLINE', activo: true },
    { id: 'h-nl-4', profesional_id: 'prof-psi-3', servicio_id: 'serv-0a', consultorio_id: 'c-0', dia_semana: 4, hora_inicio: '08:00', hora_fin: '14:00', duracion_slot_min: 45, modalidad: 'PRESENCIAL', activo: true },
    { id: 'h-nl-5', profesional_id: 'prof-psi-3', servicio_id: 'serv-0a', consultorio_id: 'c-0', dia_semana: 5, hora_inicio: '08:00', hora_fin: '14:00', duracion_slot_min: 45, modalidad: 'AMBAS', activo: true },
    // Dr. Pérez Rossi: Lunes (Presencial), Miércoles (Presencial), Viernes (Online)
    { id: 'h-1', profesional_id: 'prof-1', servicio_id: 'serv-1', consultorio_id: 'c-1', dia_semana: 1, hora_inicio: '08:00', hora_fin: '13:00', duracion_slot_min: 20, modalidad: 'PRESENCIAL', activo: true },
    { id: 'h-2', profesional_id: 'prof-1', servicio_id: 'serv-2', consultorio_id: 'c-2', dia_semana: 3, hora_inicio: '08:00', hora_fin: '13:00', duracion_slot_min: 30, modalidad: 'PRESENCIAL', activo: true },
    { id: 'h-3', profesional_id: 'prof-1', servicio_id: 'serv-1', consultorio_id: 'c-1', dia_semana: 5, hora_inicio: '14:00', hora_fin: '18:00', duracion_slot_min: 20, modalidad: 'ONLINE', activo: true }
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
      telefono_whatsapp: '+54 9 351 550-1122',
      email: 'lucas.fernandez@gmail.com',
      obra_social_id: 'os-apross',
      plan_id: 'pl-apross-1',
      numero_afiliado: '1098492019/01',
      alergias: 'Ninguna conocida',
      antecedentes: 'Trastorno de ansiedad generalizada y crisis de angustia',
      medicacion_habitual: 'Clonazepam 0.5mg según indicación psiquiátrica'
    },
    {
      id: 'pac-2',
      clinica_id: 'clinica-1',
      dni: '29749777',
      nombre: 'Mariana',
      apellido: 'Gómez',
      telefono_whatsapp: '+54 9 351 680-4455',
      email: 'mariana.gomez@hotmail.com',
      obra_social_id: 'os-2',
      plan_id: 'pl-2',
      numero_afiliado: '482019482/02',
      alergias: 'Penicilina',
      antecedentes: 'Psicoterapia por duelo reciente y estrés laboral',
      medicacion_habitual: 'Ninguna'
    }
  ],
  turnos: []
};

// Agendas Iniciales Profesionales (Con Vigencia y Días Deterministas)
export const INITIAL_AGENDAS = [
  {
    id: 'ag-nl-1',
    clinica_id: 'clinica-1',
    profesional_id: 'prof-psi-3', // Lic. Nahuel López
    servicio_id: 'serv-0a',
    consultorio_id: 'c-0',
    nombre: 'Consultas Psicológicas Lunes a Viernes',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    duracion_slot_min: 45,
    modalidad: 'PRESENCIAL',
    max_sobreturnos_dia: 2,
    dias_horarios: [
      { dia_semana: 1, franjas: [{ hora_inicio: '08:00', hora_fin: '14:00', modalidad: 'PRESENCIAL' }] },
      { dia_semana: 2, franjas: [{ hora_inicio: '08:00', hora_fin: '14:00', modalidad: 'PRESENCIAL' }] },
      { dia_semana: 3, franjas: [{ hora_inicio: '08:00', hora_fin: '14:00', modalidad: 'ONLINE' }] },
      { dia_semana: 4, franjas: [{ hora_inicio: '08:00', hora_fin: '14:00', modalidad: 'PRESENCIAL' }] },
      { dia_semana: 5, franjas: [{ hora_inicio: '08:00', hora_fin: '14:00', modalidad: 'AMBAS' }] }
    ],
    estado: 'ACTIVA',
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'ag-psi-1',
    clinica_id: 'clinica-1',
    profesional_id: 'prof-psi-1', // Lic. Sofía Albarracín
    servicio_id: 'serv-0a',
    consultorio_id: 'c-0',
    nombre: 'Psicoterapia Individual & Telepsicología',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    duracion_slot_min: 45,
    modalidad: 'AMBAS',
    max_sobreturnos_dia: 2,
    dias_horarios: [
      { dia_semana: 1, franjas: [{ hora_inicio: '14:00', hora_fin: '20:00', modalidad: 'PRESENCIAL' }] },
      { dia_semana: 3, franjas: [{ hora_inicio: '09:00', hora_fin: '15:00', modalidad: 'ONLINE' }] },
      { dia_semana: 4, franjas: [{ hora_inicio: '15:00', hora_fin: '20:00', modalidad: 'AMBAS' }] }
    ],
    estado: 'ACTIVA',
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'ag-med-1',
    clinica_id: 'clinica-1',
    profesional_id: 'prof-1', // Dr. Martín Pérez Rossi
    servicio_id: 'serv-1',
    consultorio_id: 'c-1',
    nombre: 'Cardiología Clínica y Prácticas',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    duracion_slot_min: 20,
    modalidad: 'PRESENCIAL',
    max_sobreturnos_dia: 4,
    dias_horarios: [
      { dia_semana: 1, franjas: [{ hora_inicio: '08:00', hora_fin: '13:00', modalidad: 'PRESENCIAL' }] },
      { dia_semana: 3, franjas: [{ hora_inicio: '08:00', hora_fin: '13:00', modalidad: 'PRESENCIAL' }] },
      { dia_semana: 5, franjas: [{ hora_inicio: '14:00', hora_fin: '18:00', modalidad: 'ONLINE' }] }
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
  if (!localStorage.getItem(STORAGE_KEYS.MOVIMIENTOS_CAJA)) {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS_CAJA, JSON.stringify([
      {
        id: 'caj-1',
        tipo: 'INGRESO',
        concepto: 'Coseguro Consulta Médica (TRN-94041)',
        paciente_nombre: 'Aye Lopez',
        paciente_dni: '29749777',
        profesional_nombre: 'Dr(a). Nahuel Lopez',
        obra_social_nombre: 'OSDE',
        forma_pago: 'EFECTIVO',
        monto: 3500,
        usuario_nombre: 'Secretaría Recepción',
        fecha: today,
        hora: '09:15',
        comprobante: 'REC-00102',
        observaciones: 'Pago en efectivo en mostrador'
      },
      {
        id: 'caj-2',
        tipo: 'INGRESO',
        concepto: 'Consulta Particular Psicología',
        paciente_nombre: 'Carlos Benítez',
        paciente_dni: '32100450',
        profesional_nombre: 'Dr(a). Nahuel Lopez',
        obra_social_nombre: 'Particular',
        forma_pago: 'MERCADOPAGO',
        monto: 12000,
        usuario_nombre: 'Secretaría Recepción',
        fecha: today,
        hora: '10:30',
        comprobante: 'MP-892182',
        observaciones: 'QR Mercado Pago'
      }
    ]));
  }

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

  // ==============================================================================
  // AGENDAS MÉDICAS PROFESIONALES (Con Vigencia, Ciclo de Vida y Detección de Turnos)
  // ==============================================================================
  getAgendas: (clinicaId = null, profesionalId = null) => {
    let items = StorageService.getCollection(STORAGE_KEYS.AGENDAS);
    if (!items || !Array.isArray(items)) {
      items = [...INITIAL_AGENDAS];
      StorageService.saveCollection(STORAGE_KEYS.AGENDAS, items);
    }

    // Auto-inferir agendas para profesionales que tienen horarios pero aún no tenían agenda registrada
    try {
      const todosProfesionales = StorageService.getProfesionales();
      const todosHorarios = StorageService.getHorarios();
      let updated = false;

      todosProfesionales.forEach(p => {
        const tieneAgenda = items.some(a => a.profesional_id === p.id && a.estado === 'ACTIVA');
        const horariosProf = todosHorarios.filter(h => h.profesional_id === p.id && h.activo !== false);

        if (!tieneAgenda && horariosProf.length > 0) {
          const diasHorariosMap = {};
          horariosProf.forEach(h => {
            const diaNum = Number(h.dia_semana);
            if (diaNum >= 1 && diaNum <= 6) {
              if (!diasHorariosMap[diaNum]) diasHorariosMap[diaNum] = [];
              diasHorariosMap[diaNum].push({
                hora_inicio: h.hora_inicio,
                hora_fin: h.hora_fin,
                modalidad: h.modalidad || 'PRESENCIAL'
              });
            }
          });

          const dias_horarios = Object.keys(diasHorariosMap).map(d => ({
            dia_semana: Number(d),
            franjas: diasHorariosMap[d]
          }));

          if (dias_horarios.length > 0) {
            const inferida = {
              id: `ag-auto-${p.id}`,
              clinica_id: p.clinica_id || StorageService.getClinicaActiva()?.id,
              profesional_id: p.id,
              servicio_id: horariosProf[0]?.servicio_id || null,
              consultorio_id: horariosProf[0]?.consultorio_id || 'c-0',
              nombre: `Agenda Principal (${horariosProf[0]?.modalidad === 'ONLINE' ? 'Virtual' : 'Presencial'})`,
              fecha_desde: horariosProf[0]?.fecha_desde || '2026-01-01',
              fecha_hasta: horariosProf[0]?.fecha_hasta || null,
              duracion_slot_min: Number(horariosProf[0]?.duracion_slot_min || p.duracion_turno_minutos || 45),
              modalidad: horariosProf[0]?.modalidad || (p.atiende_online ? 'AMBAS' : 'PRESENCIAL'),
              max_sobreturnos_dia: Number(p.max_sobreturnos_dia || 2),
              dias_horarios,
              estado: 'ACTIVA',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            items.push(inferida);
            updated = true;
          }
        }
      });

      if (updated) {
        StorageService.saveCollection(STORAGE_KEYS.AGENDAS, items);
      }
    } catch (e) {
      console.warn('Error auto-infiriendo agendas:', e);
    }

    const targetClinicaId = clinicaId || StorageService.getClinicaActiva()?.id;
    if (targetClinicaId && targetClinicaId !== 'TODAS' && targetClinicaId !== 'ALL') {
      items = items.filter(a => !a.clinica_id || a.clinica_id === targetClinicaId);
    }
    if (profesionalId) {
      items = items.filter(a => a.profesional_id === profesionalId);
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

  deleteAgenda: (agendaId) => {
    const items = StorageService.getCollection(STORAGE_KEYS.AGENDAS);
    const target = items.find(a => a.id === agendaId);
    const updated = items.filter(a => a.id !== agendaId);
    StorageService.saveCollection(STORAGE_KEYS.AGENDAS, updated);
    if (target) {
      StorageService.sincronizarHorariosDesdeAgendas(target.profesional_id);
    }
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
    const agendasActivas = StorageService.getAgendas(null, profesionalId).filter(a => a.estado === 'ACTIVA');
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
                  profesional_id: ag.profesional_id,
                  servicio_id: ag.servicio_id || null,
                  consultorio_id: ag.consultorio_id,
                  dia_semana: diaNum,
                  hora_inicio: franja.hora_inicio,
                  hora_fin: franja.hora_fin,
                  duracion_slot_min: Number(ag.duracion_slot_min || 20),
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
  getHorarios: () => StorageService.getCollection(STORAGE_KEYS.HORARIOS),
  getHorariosByProfesional: (profesionalId) => {
    return StorageService.getHorarios().filter(h => 
      h.profesional_id === profesionalId && 
      Number(h.dia_semana) !== 0 &&
      Number(h.dia_semana) >= 1 && 
      Number(h.dia_semana) <= 6 &&
      h.activo !== false
    );
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
  configurarAgendaSemanal: ({ profesional_id, servicio_id, dias_semana, turnos_horarios, consultorio_id, duracion_slot_min, modalidad = 'PRESENCIAL', fecha_desde = null, fecha_hasta = null, nombre = 'Agenda de Consultas' }) => {
    const diasNum = dias_semana.map(Number).filter(d => d >= 1 && d <= 6);
    
    // Crear o actualizar la entidad Agenda formal
    const agendaObj = {
      profesional_id,
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

  // SLOTS DISPONIBLES (Filtrado por profesional, fecha, servicio opcional y modalidad opcional)
  getSlotsDisponibles: (profesionalId, fechaStr, servicioId = null, modalidad = null) => {
    if (!profesionalId || !fechaStr) return [];

    const diaSemana = getDayOfWeekFromDateString(fechaStr);
    // Domingo nunca tiene atención en nuestro sistema clínico
    if (diaSemana === 0) return [];

    const bloqueos = StorageService.getBloqueos();
    const esFeriadoOBloqueado = bloqueos.some(b => {
      const matchFecha = fechaStr >= b.fecha_inicio && fechaStr <= b.fecha_fin;
      if (!matchFecha) return false;
      if (!b.profesional_id) return true;
      if (b.profesional_id === profesionalId) return true;
      return false;
    });

    if (esFeriadoOBloqueado) return [];

    // Obtener horarios que coincidan con el día de la semana y vigencia activa
    let horarios = StorageService.getHorariosByProfesional(profesionalId).filter(h => {
      if (Number(h.dia_semana) !== Number(diaSemana)) return false;
      if (h.activo === false) return false;
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
    const turnosExistentes = StorageService.getTurnos().filter(t => 
      String(t.profesional_id) === String(profesionalId) && 
      t.fecha === fechaStr && 
      t.estado !== 'CANCELADO'
    );

    const slots = [];

    horarios.forEach(h => {
      const [hIni, mIni] = h.hora_inicio.split(':').map(Number);
      const [hFin, mFin] = h.hora_fin.split(':').map(Number);
      const slotDuration = Number(h.duracion_slot_min) || 20;

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
          disponible: !isOccupied,
          consultorio_id: h.consultorio_id,
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
