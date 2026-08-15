-- ==============================================================================
-- MEDITURNOS PRO / CLINICOS - ESQUEMA COMPLETO PARA SUPABASE (POSTGRESQL)
-- ==============================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: CLÍNICAS / CENTROS MÉDICOS (MULTI-TENANT)
CREATE TABLE IF NOT EXISTS clinicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    cuit TEXT,
    direccion TEXT,
    telefono TEXT,
    email TEXT,
    logo_url TEXT,
    color_primario TEXT DEFAULT '#0284c7',
    mensaje_bienvenida TEXT DEFAULT 'Bienvenido a nuestro sistema de turnos online.',
    creado_en TIMESTAMPTZ DEFAULT now(),
    actualizado_en TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA: CONSULTORIOS FÍSICOS
CREATE TABLE IF NOT EXISTS consultorios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL, -- ej: "Consultorio 1 - Cardiología", "Consultorio 2 - Ecografía"
    piso_ubicacion TEXT,   -- ej: "Planta Baja", "Piso 1 - Ala Norte"
    equipamiento TEXT,     -- ej: "Ecógrafo Doppler, Camilla ginecológica"
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA: OBRAS SOCIALES Y PREPAGAS
CREATE TABLE IF NOT EXISTS obras_sociales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,          -- ej: "OSDE", "Swiss Medical", "PAMI", "IOMA", "Particular"
    sigla TEXT,                    -- ej: "OSDE", "SMG", "PAMI"
    cuit TEXT,
    telefono_contacto TEXT,
    email_autorizaciones TEXT,
    requiere_bono BOOLEAN DEFAULT false,
    requiere_autorizacion_previa BOOLEAN DEFAULT false,
    instrucciones_afiliado TEXT,   -- ej: "Presentar credencial digital y DNI al momento de la consulta."
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 4. TABLA: PLANES POR OBRA SOCIAL
CREATE TABLE IF NOT EXISTS planes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    obra_social_id UUID REFERENCES obras_sociales(id) ON DELETE CASCADE,
    nombre_plan TEXT NOT NULL,     -- ej: "210", "310", "410", "SMG20", "PMO Básico"
    codigo_plan TEXT,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 5. TABLA: NOMENCLADOR DE PRÁCTICAS MÉDICAS (PMO / PRESTACIONES)
CREATE TABLE IF NOT EXISTS practicas_nomenclador (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    codigo_pmo TEXT NOT NULL,      -- ej: "42.01.01", "18.01.01", "34.01.01"
    descripcion TEXT NOT NULL,     -- ej: "Consulta médica general", "Ecografía abdominal"
    duracion_minutos INTEGER DEFAULT 20,
    valor_particular NUMERIC(10, 2) DEFAULT 0,
    coseguro_defecto NUMERIC(10, 2) DEFAULT 0,
    requiere_orden_medica BOOLEAN DEFAULT false,
    requiere_autorizacion BOOLEAN DEFAULT false,
    instrucciones_preparacion TEXT, -- ej: "Ayuno de 8 horas para ecografía"
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 6. TABLA: CONVENIOS DE COSEGUROS (POR PLAN Y PRÁCTICA)
CREATE TABLE IF NOT EXISTS convenios_coseguros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES planes(id) ON DELETE CASCADE,
    practica_id UUID REFERENCES practicas_nomenclador(id) ON DELETE CASCADE,
    monto_coseguro NUMERIC(10, 2) DEFAULT 0,
    cubierto_100 BOOLEAN DEFAULT false,
    requiere_autorizacion BOOLEAN DEFAULT false,
    observaciones TEXT,
    creado_en TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plan_id, practica_id)
);

-- 7. TABLA: PROFESIONALES DE LA SALUD
CREATE TABLE IF NOT EXISTS profesionales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    matricula_nacional TEXT,
    matricula_provincial TEXT,
    especialidad TEXT NOT NULL,    -- ej: "Cardiología", "Pediatría", "Clínica Médica"
    email TEXT,
    telefono TEXT,
    duracion_turno_minutos INTEGER DEFAULT 20,
    max_sobreturnos_dia INTEGER DEFAULT 3,
    color_agenda TEXT DEFAULT '#0284c7',
    avatar_url TEXT,
    atiende_particular BOOLEAN DEFAULT true,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 8. TABLA: OBRAS SOCIALES ACEPTADAS POR PROFESIONAL
CREATE TABLE IF NOT EXISTS profesionales_obras_sociales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profesional_id UUID REFERENCES profesionales(id) ON DELETE CASCADE,
    obra_social_id UUID REFERENCES obras_sociales(id) ON DELETE CASCADE,
    UNIQUE(profesional_id, obra_social_id)
);

-- 9. TABLA: HORARIOS DE ATENCIÓN DE PROFESIONALES (GRILLA SEMANAL)
CREATE TABLE IF NOT EXISTS horarios_atencion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profesional_id UUID REFERENCES profesionales(id) ON DELETE CASCADE,
    consultorio_id UUID REFERENCES consultorios(id) ON DELETE SET NULL,
    dia_semana INTEGER NOT NULL,   -- 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
    hora_inicio TIME NOT NULL,     -- ej: '08:00'
    hora_fin TIME NOT NULL,        -- ej: '13:00'
    duracion_slot_min INTEGER DEFAULT 20,
    activo BOOLEAN DEFAULT true
);

-- 10. TABLA: BLOQUEOS, VACACIONES Y FERIADOS
CREATE TABLE IF NOT EXISTS bloqueos_agenda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    profesional_id UUID REFERENCES profesionales(id) ON DELETE CASCADE, -- NULL = Feriado general / Toda la clínica
    consultorio_id UUID REFERENCES consultorios(id) ON DELETE CASCADE, -- NULL = No restringe consultorio específico
    tipo TEXT NOT NULL,            -- 'VACACIONES', 'LICENCIA_MEDICA', 'FERIADO_NACIONAL', 'FERIADO_LOCAL', 'MANTENIMIENTO'
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    hora_inicio TIME,              -- Opcional si es bloqueo de medio día / rango
    hora_fin TIME,
    motivo TEXT NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 11. TABLA: PACIENTES
CREATE TABLE IF NOT EXISTS pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    dni TEXT NOT NULL,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    fecha_nacimiento DATE,
    genero TEXT,
    telefono_whatsapp TEXT NOT NULL,
    email TEXT,
    obra_social_id UUID REFERENCES obras_sociales(id) ON DELETE SET NULL,
    plan_id UUID REFERENCES planes(id) ON DELETE SET NULL,
    numero_afiliado TEXT,
    grupo_sanguineo TEXT,
    alergias TEXT,
    antecedentes TEXT,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 12. TABLA: TURNOS MÉDICOS
CREATE TABLE IF NOT EXISTS turnos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    codigo_reserva TEXT UNIQUE NOT NULL, -- ej: "TRN-84920"
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    profesional_id UUID REFERENCES profesionales(id) ON DELETE CASCADE,
    consultorio_id UUID REFERENCES consultorios(id) ON DELETE SET NULL,
    practica_id UUID REFERENCES practicas_nomenclador(id) ON DELETE SET NULL,
    obra_social_id UUID REFERENCES obras_sociales(id) ON DELETE SET NULL,
    plan_id UUID REFERENCES planes(id) ON DELETE SET NULL,
    numero_afiliado TEXT,
    fecha_hora_inicio TIMESTAMPTZ NOT NULL,
    fecha_hora_fin TIMESTAMPTZ NOT NULL,
    es_sobreturno BOOLEAN DEFAULT false,
    estado TEXT DEFAULT 'PROGRAMADO', -- 'PROGRAMADO', 'EN_ESPERA', 'EN_ATENCION', 'ATENDIDO', 'CANCELADO', 'NO_ASISTIO'
    monto_coseguro NUMERIC(10, 2) DEFAULT 0,
    estado_coseguro TEXT DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'COBRADO', 'EXENTO'
    medio_pago_coseguro TEXT,                 -- 'EFECTIVO', 'DEBITO', 'CREDITO', 'MERCADOPAGO', 'TRANSFERENCIA'
    comprobante_pago_nro TEXT,
    hora_llegada_recepcion TIMESTAMPTZ,
    hora_llamado_atencion TIMESTAMPTZ,
    hora_fin_atencion TIMESTAMPTZ,
    motivo_cancelacion TEXT,
    cancelado_por TEXT,                       -- 'PACIENTE', 'SECRETARIA', 'PROFESIONAL'
    observaciones TEXT,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 13. TABLA: HISTORIA CLÍNICA ELECTRÓNICA (HCE BASE)
CREATE TABLE IF NOT EXISTS atenciones_historia_clinica (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turno_id UUID REFERENCES turnos(id) ON DELETE CASCADE,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    profesional_id UUID REFERENCES profesionales(id) ON DELETE CASCADE,
    fecha_atencion TIMESTAMPTZ DEFAULT now(),
    motivo_consulta TEXT,
    anamnesis_examen_fisico TEXT,
    diagnostico_cie10 TEXT,                  -- ej: "I10 - Hipertensión esencial"
    diagnostico_descripcion TEXT,
    plan_tratamiento TEXT,
    receta_indicaciones TEXT,
    estudios_solicitados TEXT,
    adjuntos_urls JSONB DEFAULT '[]'::jsonb,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 14. TABLA: FACTURACIÓN Y LIQUIDACIONES MÉDICAS
CREATE TABLE IF NOT EXISTS liquidaciones_medicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    profesional_id UUID REFERENCES profesionales(id) ON DELETE CASCADE,
    periodo_mes INTEGER NOT NULL,
    periodo_anio INTEGER NOT NULL,
    total_consultas INTEGER DEFAULT 0,
    monto_total_bruto NUMERIC(12, 2) DEFAULT 0,
    retencion_clinica_porcentaje NUMERIC(5, 2) DEFAULT 20.00,
    monto_neto_profesional NUMERIC(12, 2) DEFAULT 0,
    estado TEXT DEFAULT 'BORRADOR',          -- 'BORRADOR', 'APROBADA', 'PAGADA'
    fecha_pago DATE,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 15. TABLA: LOTES DE PRESENTACIÓN A OBRAS SOCIALES & CPPC
CREATE TABLE IF NOT EXISTS lotes_facturacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    obra_social_id UUID REFERENCES obras_sociales(id) ON DELETE CASCADE,
    numero_lote TEXT NOT NULL,
    periodo_mes INTEGER NOT NULL,
    periodo_anio INTEGER NOT NULL,
    total_prestaciones INTEGER DEFAULT 0,
    monto_total_presentado NUMERIC(12, 2) DEFAULT 0,
    monto_total_debitos NUMERIC(12, 2) DEFAULT 0,
    monto_total_liquidado NUMERIC(12, 2) DEFAULT 0,
    estado TEXT DEFAULT 'PRESENTADO',         -- 'PRESENTADO', 'AUDITADO', 'LIQUIDADO', 'COBRADO'
    fecha_presentacion DATE DEFAULT CURRENT_DATE,
    fecha_cobro DATE,
    items_detalle JSONB DEFAULT '[]'::jsonb,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 16. TABLA: MOVIMIENTOS DE CUENTA CORRIENTE PACIENTES
CREATE TABLE IF NOT EXISTS movimientos_cta_cte_pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ DEFAULT now(),
    tipo TEXT NOT NULL,                      -- 'CARGO' (suma deuda) | 'PAGO' (resta deuda)
    concepto TEXT NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    medio_pago TEXT,
    numero_comprobante TEXT,
    observaciones TEXT,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 17. TABLA: MOVIMIENTOS DE CUENTA CORRIENTE OBRAS SOCIALES
CREATE TABLE IF NOT EXISTS movimientos_cta_cte_os (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    obra_social_id UUID REFERENCES obras_sociales(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ DEFAULT now(),
    tipo TEXT NOT NULL,                      -- 'CARGO' | 'PAGO' | 'DEBITO'
    concepto TEXT NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    medio_pago TEXT,
    numero_comprobante TEXT,
    observaciones TEXT,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 18. TABLA: FACTURACIÓN ELECTRÓNICA ARCA (AFIP WSFE)
CREATE TABLE IF NOT EXISTS comprobantes_arca (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    tipo_comprobante_id INTEGER NOT NULL,    -- 1: Factura A, 6: Factura B, 11: Factura C, 15: Recibo C
    tipo_comprobante_nombre TEXT NOT NULL,
    letra TEXT NOT NULL,                     -- 'A', 'B', 'C'
    punto_venta INTEGER NOT NULL,
    numero_comprobante INTEGER NOT NULL,
    numero_completo TEXT NOT NULL,           -- '00001-00000042'
    cae TEXT NOT NULL,
    cae_vto DATE NOT NULL,
    fecha_emision TIMESTAMPTZ DEFAULT now(),
    emisor JSONB NOT NULL,
    receptor JSONB NOT NULL,
    items JSONB NOT NULL,
    subtotal_neto NUMERIC(12, 2) DEFAULT 0,
    total_iva NUMERIC(12, 2) DEFAULT 0,
    importe_total NUMERIC(12, 2) NOT NULL,
    qr_payload TEXT,
    qr_url TEXT,
    turno_id UUID REFERENCES turnos(id) ON DELETE SET NULL,
    lote_id UUID REFERENCES lotes_facturacion(id) ON DELETE SET NULL,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL,
    obra_social_id UUID REFERENCES obras_sociales(id) ON DELETE SET NULL,
    estado TEXT DEFAULT 'APROBADO',
    entorno TEXT DEFAULT 'SANDBOX',          -- 'SANDBOX' | 'PRODUCCION'
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 19. TABLA: CONSENTIMIENTOS INFORMADOS DIGITALES (Ley 26.657 & Ley 26.529)
CREATE TABLE IF NOT EXISTS consentimientos_informados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,                      -- 'PSICOLOGICO_GENERAL', 'TELECONSULTA', 'TRATAMIENTO_ESPECIAL'
    version TEXT DEFAULT '1.0',
    firmado BOOLEAN DEFAULT true,
    fecha_firma TIMESTAMPTZ DEFAULT now(),
    dispositivo TEXT,
    ip_origen TEXT,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- Índices de alto rendimiento para búsquedas y turnero
CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON turnos(fecha_hora_inicio);
CREATE INDEX IF NOT EXISTS idx_turnos_profesional ON turnos(profesional_id);
CREATE INDEX IF NOT EXISTS idx_turnos_paciente ON turnos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON turnos(estado);
CREATE INDEX IF NOT EXISTS idx_turnos_codigo ON turnos(codigo_reserva);
CREATE INDEX IF NOT EXISTS idx_pacientes_dni ON pacientes(dni);
CREATE INDEX IF NOT EXISTS idx_bloqueos_fechas ON bloqueos_agenda(fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_comprobantes_arca_cae ON comprobantes_arca(cae);
CREATE INDEX IF NOT EXISTS idx_lotes_periodo ON lotes_facturacion(periodo_anio, periodo_mes);

-- Habilitar Supabase Realtime para tablas críticas de forma segura
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE turnos;
    EXCEPTION WHEN duplicate_object THEN
        -- ya existía
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE pacientes;
    EXCEPTION WHEN duplicate_object THEN
        -- ya existía
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE comprobantes_arca;
    EXCEPTION WHEN duplicate_object THEN
        -- ya existía
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE lotes_facturacion;
    EXCEPTION WHEN duplicate_object THEN
        -- ya existía
    END;
END $$;
