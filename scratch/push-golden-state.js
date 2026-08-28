import { createClient } from '@supabase/supabase-js';

const url = 'https://pmqcqvuxecibnxfkxrks.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWNxdnV4ZWNpYm54Zmt4cmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyODc5MzMsImV4cCI6MjEwMTg2MzkzM30.A_uDL8BbDAIf21gVmWa8Nu1gI2Oimxe2dJ991zVCJrI';
const sb = createClient(url, anonKey);

const clinicas = [
  {
    id: 'clinica-1',
    nombre: 'Aipaa 355',
    cuit: '30-71234567-9',
    direccion: 'Av. Colón 1250, Córdoba Capital',
    telefono: '+54 351 428-9000',
    whatsapp: '+54 9 351 428-9000',
    email: 'aipaa@saludnet.com.ar',
    color_primario: '#6366f1',
    condicion_iva: 'MONO',
    punto_venta: 1,
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
    color_primario: '#0d9488',
    condicion_iva: 'RI',
    punto_venta: 2,
    activa: true
  },
  {
    id: 'clinica-3',
    nombre: 'Inti Carrara',
    cuit: '30-71122334-8',
    direccion: 'Carrara 890, Alta Córdoba',
    telefono: '+54 351 471-2200',
    whatsapp: '+54 9 351 471-2200',
    email: 'inti@saludnet.com.ar',
    color_primario: '#8b5cf6',
    condicion_iva: 'RI',
    punto_venta: 3,
    activa: true
  },
  {
    id: 'clinica-4',
    nombre: 'online CASA',
    cuit: '30-75566778-2',
    direccion: 'Atención Virtual por Videoconsulta',
    telefono: '+54 351 555-0199',
    whatsapp: '+54 9 351 555-0199',
    email: 'online@saludnet.com.ar',
    color_primario: '#0284c7',
    condicion_iva: 'MONO',
    punto_venta: 4,
    activa: true
  }
];

const profesional = {
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
};

const horarios = [
  // Lunes: Aipaa 355 (09:00 a 20:00, 60m)
  {
    id: 'h-lopez-aipaa-lun',
    agenda_id: 'ag-lopez-aipaa',
    clinica_id: 'clinica-1',
    profesional_id: 'prof-1786315328730',
    servicio_id: 'serv-1786315370753',
    consultorio_id: 'c-1-1',
    dia_semana: 1,
    hora_inicio: '09:00',
    hora_fin: '20:00',
    duracion_slot_min: 60,
    modalidad: 'PRESENCIAL',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    activo: true
  },
  // Martes: Circulare COLON (09:00 a 14:00, 45m)
  {
    id: 'h-lopez-colon-mar',
    agenda_id: 'ag-lopez-colon',
    clinica_id: 'clinica-2',
    profesional_id: 'prof-1786315328730',
    servicio_id: 'serv-1786315370753',
    consultorio_id: 'c-2-1',
    dia_semana: 2,
    hora_inicio: '09:00',
    hora_fin: '14:00',
    duracion_slot_min: 45,
    modalidad: 'PRESENCIAL',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    activo: true
  },
  // Martes: Inti Carrara (14:00 a 20:00, 60m)
  {
    id: 'h-lopez-inti-mar',
    agenda_id: 'ag-lopez-inti',
    clinica_id: 'clinica-3',
    profesional_id: 'prof-1786315328730',
    servicio_id: 'serv-1786315370753',
    consultorio_id: 'c-3-1',
    dia_semana: 2,
    hora_inicio: '14:00',
    hora_fin: '20:00',
    duracion_slot_min: 60,
    modalidad: 'PRESENCIAL',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    activo: true
  },
  // Miércoles: Aipaa 355 (11:00 a 20:00, 60m)
  {
    id: 'h-lopez-aipaa-mie',
    agenda_id: 'ag-lopez-aipaa-mie',
    clinica_id: 'clinica-1',
    profesional_id: 'prof-1786315328730',
    servicio_id: 'serv-1786315370753',
    consultorio_id: 'c-1-1',
    dia_semana: 3,
    hora_inicio: '11:00',
    hora_fin: '20:00',
    duracion_slot_min: 60,
    modalidad: 'PRESENCIAL',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    activo: true
  },
  // Jueves: online CASA (09:00 a 12:00, 60m)
  {
    id: 'h-lopez-online-jue',
    agenda_id: 'ag-lopez-online',
    clinica_id: 'clinica-4',
    profesional_id: 'prof-1786315328730',
    servicio_id: 'serv-1786315370753',
    consultorio_id: 'c-4-1',
    dia_semana: 4,
    hora_inicio: '09:00',
    hora_fin: '12:00',
    duracion_slot_min: 60,
    modalidad: 'ONLINE',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    activo: true
  },
  // Jueves: Aipaa 355 (13:00 a 20:00, 60m)
  {
    id: 'h-lopez-aipaa-jue',
    agenda_id: 'ag-lopez-aipaa-jue',
    clinica_id: 'clinica-1',
    profesional_id: 'prof-1786315328730',
    servicio_id: 'serv-1786315370753',
    consultorio_id: 'c-1-1',
    dia_semana: 4,
    hora_inicio: '13:00',
    hora_fin: '20:00',
    duracion_slot_min: 60,
    modalidad: 'PRESENCIAL',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    activo: true
  },
  // Viernes: Circulare COLON (09:00 a 12:00, 60m)
  {
    id: 'h-lopez-colon-vie',
    agenda_id: 'ag-lopez-colon-vie',
    clinica_id: 'clinica-2',
    profesional_id: 'prof-1786315328730',
    servicio_id: 'serv-1786315370753',
    consultorio_id: 'c-2-1',
    dia_semana: 5,
    hora_inicio: '09:00',
    hora_fin: '12:00',
    duracion_slot_min: 60,
    modalidad: 'PRESENCIAL',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    activo: true
  },
  // Viernes: Inti Carrara (13:00 a 20:00, 60m)
  {
    id: 'h-lopez-inti-vie',
    agenda_id: 'ag-lopez-inti-vie',
    clinica_id: 'clinica-3',
    profesional_id: 'prof-1786315328730',
    servicio_id: 'serv-1786315370753',
    consultorio_id: 'c-3-1',
    dia_semana: 5,
    hora_inicio: '13:00',
    hora_fin: '20:00',
    duracion_slot_min: 60,
    modalidad: 'PRESENCIAL',
    fecha_desde: '2026-01-01',
    fecha_hasta: null,
    activo: true
  }
];

const agendas = [
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
  }
];

const obras_sociales = [
  { id: 'os-sancor', clinica_id: 'clinica-1', nombre: 'Sancor Salud', sigla: 'SANCOR', cuit: '30-68192301-9', requiere_bono: false, requiere_autorizacion: false, instrucciones: 'Validar credencial digital.', activa: true },
  { id: 'os-apross', clinica_id: 'clinica-1', nombre: 'APROSS (Córdoba)', sigla: 'APROSS', cuit: '30-99923812-4', requiere_bono: true, requiere_autorizacion: true, instrucciones: 'Validar credencial digital en App oficial APROSS.', activa: true },
  { id: 'os-cppc', clinica_id: 'clinica-1', nombre: 'Colegio de Psicólogos de Cba (CPPC)', sigla: 'CPPC', cuit: '30-61849201-3', requiere_bono: true, requiere_autorizacion: false, instrucciones: 'Planilla oficial del Colegio de Psicólogos.', activa: true },
  { id: 'os-1', clinica_id: 'clinica-1', nombre: 'Particular / Privado', sigla: 'PART', cuit: '', requiere_bono: false, requiere_autorizacion: false, activa: true },
  { id: 'os-2', clinica_id: 'clinica-1', nombre: 'OSDE', sigla: 'OSDE', cuit: '30-54674125-3', requiere_bono: false, requiere_autorizacion: false, activa: true },
  { id: 'os-3', clinica_id: 'clinica-1', nombre: 'Swiss Medical', sigla: 'SMG', cuit: '30-67890123-4', requiere_bono: false, requiere_autorizacion: false, activa: true }
];

const planes = [
  { id: 'pl-sancor-500', obra_social_id: 'os-sancor', nombre_plan: 'Plan 500', codigo_plan: 'SANCOR-500', activo: true },
  { id: 'pl-sancor-1000', obra_social_id: 'os-sancor', nombre_plan: 'Plan 1000', codigo_plan: 'SANCOR-1000', activo: true },
  { id: 'pl-apross-1', obra_social_id: 'os-apross', nombre_plan: 'APROSS Directo', codigo_plan: 'APROSS-DIR', activo: true },
  { id: 'pl-cppc-1', obra_social_id: 'os-cppc', nombre_plan: 'Convenio Colectivo CPPC', codigo_plan: 'CPPC-CONV', activo: true },
  { id: 'pl-1', obra_social_id: 'os-1', nombre_plan: 'Particular Sesión Individual', codigo_plan: 'PART-STD', activo: true }
];

const pacientes = [
  {
    id: 'pac-1787870676906',
    clinica_id: 'clinica-1',
    dni: '35894120',
    nombre: 'Agustina',
    apellido: 'Benítez',
    edad: 29,
    telefono_whatsapp: '+54 9 351 552-3344',
    email: 'agustina.benitez@gmail.com',
    domicilio: 'Av. Colón 1400, Córdoba',
    obra_social_id: 'os-sancor',
    obra_social_nombre: 'Sancor Salud',
    plan_id: 'pl-sancor-500',
    numero_afiliado: '1350025',
    activo: true
  },
  {
    id: 'pac-1',
    clinica_id: 'clinica-1',
    dni: '34891024',
    nombre: 'Lucas',
    apellido: 'Morales Rossi',
    edad: 36,
    telefono_whatsapp: '+54 9 351 440-9988',
    email: 'lucas.morales@gmail.com',
    domicilio: 'Bv. San Juan 650, Nueva Córdoba',
    obra_social_id: 'os-apross',
    obra_social_nombre: 'APROSS',
    plan_id: 'pl-apross-1',
    numero_afiliado: '1098492019/01',
    activo: true
  }
];

const turnos = [
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
];

const servicios = [
  {
    id: 'serv-1786315370753',
    clinica_id: 'clinica-1',
    nombre: 'Psicología y Salud Mental',
    especialidad_id: 'esp-0',
    duracion_defecto_min: 60,
    activo: true
  }
];

const especialidades = [
  {
    id: 'esp-0',
    nombre: 'Psicología y Salud Mental',
    descripcion: 'Atención psicológica clínica, psicoterapia y psicodiagnóstico',
    icono: 'Brain',
    activo: true
  }
];

const consultorios = [
  { id: 'c-1-1', clinica_id: 'clinica-1', nombre: 'Consultorio Aipaa 1 - Psicología & Terapia', piso_ubicacion: 'Planta Alta', activo: true },
  { id: 'c-1-2', clinica_id: 'clinica-1', nombre: 'Consultorio Aipaa 2 - Consultas Generales', piso_ubicacion: 'Planta Baja', activo: true },
  { id: 'c-2-1', clinica_id: 'clinica-2', nombre: 'Consultorio Colón 1 - Terapia & Salud Mental', piso_ubicacion: 'Planta Baja', activo: true },
  { id: 'c-3-1', clinica_id: 'clinica-3', nombre: 'Consultorio Inti 1 - Salud Mental & Consultas', piso_ubicacion: 'Piso 1', activo: true },
  { id: 'c-4-1', clinica_id: 'clinica-4', nombre: 'Consultorio Virtual - Videollamada', piso_ubicacion: 'Online', activo: true }
];

const payload = {
  mediturnos_clinica: clinicas[0],
  mediturnos_clinicas_list: clinicas,
  mediturnos_profesionales: [profesional],
  mediturnos_horarios: horarios,
  mediturnos_agendas: agendas,
  mediturnos_obras_sociales: obras_sociales,
  mediturnos_planes: planes,
  mediturnos_pacientes: pacientes,
  mediturnos_turnos: turnos,
  mediturnos_servicios: servicios,
  mediturnos_especialidades: especialidades,
  mediturnos_consultorios: consultorios,
  mediturnos_bloqueos: [
    { id: 'b-1', clinica_id: 'clinica-1', tipo: 'FERIADO_NACIONAL', fecha_inicio: '2026-01-01', fecha_fin: '2026-01-01', motivo: 'Año Nuevo' },
    { id: 'b-2', clinica_id: 'clinica-1', tipo: 'FERIADO_NACIONAL', fecha_inicio: '2026-05-01', fecha_fin: '2026-05-01', motivo: 'Día del Trabajador' },
    { id: 'b-3', clinica_id: 'clinica-1', tipo: 'FERIADO_NACIONAL', fecha_inicio: '2026-05-25', fecha_fin: '2026-05-25', motivo: 'Revolución de Mayo' },
    { id: 'b-4', clinica_id: 'clinica-1', tipo: 'FERIADO_NACIONAL', fecha_inicio: '2026-07-09', fecha_fin: '2026-07-09', motivo: 'Día de la Independencia' },
    { id: 'b-5', clinica_id: 'clinica-1', tipo: 'FERIADO_NACIONAL', fecha_inicio: '2026-12-25', fecha_fin: '2026-12-25', motivo: 'Navidad' }
  ],
  mediturnos_users: [
    { id: 'usr-1', nombre: 'Administrador General', email: 'admin@clinica.com', password: 'admin', rol: 'ADMIN_CLINICA', clinica_id: 'clinica-1', activo: true },
    { id: 'usr-2', nombre: 'Secretaría de Recepción', email: 'secretaria@clinica.com', password: '123', rol: 'SECRETARIA', clinica_id: 'clinica-1', activo: true }
  ]
};

async function push() {
  const nowIso = new Date().toISOString();
  const { data, error } = await sb
    .from('app_sync')
    .upsert({
      id: 'global_state',
      payload,
      updated_at: nowIso
    });
  
  if (error) {
    console.error('Error uploading golden state:', error);
  } else {
    console.log('✅ GOLDEN STATE SUCCESSFULLY WRITTEN TO SUPABASE at', nowIso);
  }
}

push();
