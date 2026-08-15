-- ==============================================================================
-- MIGRACIÓN SEGURA PARA BASE DE DATOS EN PRODUCCIÓN (Supabase + Vercel)
-- Versión: Antigravity Medical 2.0 (Psicología, Facturación ARCA, Cuentas Corrientes)
-- ==============================================================================

-- 1. TABLA: LOTES DE PRESENTACIÓN A OBRAS SOCIALES & CPPC (Si no existe)
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
    estado TEXT DEFAULT 'PRESENTADO',
    fecha_presentacion DATE DEFAULT CURRENT_DATE,
    fecha_cobro DATE,
    items_detalle JSONB DEFAULT '[]'::jsonb,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA: MOVIMIENTOS DE CUENTA CORRIENTE PACIENTES (Si no existe)
CREATE TABLE IF NOT EXISTS movimientos_cta_cte_pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ DEFAULT now(),
    tipo TEXT NOT NULL,                      -- 'CARGO' | 'PAGO'
    concepto TEXT NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    medio_pago TEXT,
    numero_comprobante TEXT,
    observaciones TEXT,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA: MOVIMIENTOS DE CUENTA CORRIENTE OBRAS SOCIALES (Si no existe)
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

-- 4. TABLA: FACTURACIÓN ELECTRÓNICA ARCA / AFIP (Si no existe)
CREATE TABLE IF NOT EXISTS comprobantes_arca (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    tipo_comprobante_id INTEGER NOT NULL,
    tipo_comprobante_nombre TEXT NOT NULL,
    letra TEXT NOT NULL,
    punto_venta INTEGER NOT NULL,
    numero_comprobante INTEGER NOT NULL,
    numero_completo TEXT NOT NULL,
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
    entorno TEXT DEFAULT 'SANDBOX',
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 5. TABLA: CONSENTIMIENTOS INFORMADOS DIGITALES (Si no existe)
CREATE TABLE IF NOT EXISTS consentimientos_informados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    version TEXT DEFAULT '1.0',
    firmado BOOLEAN DEFAULT true,
    fecha_firma TIMESTAMPTZ DEFAULT now(),
    dispositivo TEXT,
    ip_origen TEXT,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- 6. CAMPOS ADICIONALES PARA TABLAS EXISTENTES (Columnas opcionales de retrocompatibilidad)
DO $$ 
BEGIN 
    -- Nomenclador: tipo_nomenclador y unidades NBU/Odonto
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='practicas_nomenclador' AND column_name='tipo_nomenclador') THEN
        ALTER TABLE practicas_nomenclador ADD COLUMN tipo_nomenclador TEXT DEFAULT 'PMO_MEDICO';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='practicas_nomenclador' AND column_name='unidades_bioquimicas') THEN
        ALTER TABLE practicas_nomenclador ADD COLUMN unidades_bioquimicas NUMERIC(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='practicas_nomenclador' AND column_name='unidades_gastos') THEN
        ALTER TABLE practicas_nomenclador ADD COLUMN unidades_gastos NUMERIC(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='practicas_nomenclador' AND column_name='capitulo_odontologia') THEN
        ALTER TABLE practicas_nomenclador ADD COLUMN capitulo_odontologia TEXT;
    END IF;

    -- Turnos: soporte de modalidad y link virtual
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='turnos' AND column_name='modalidad') THEN
        ALTER TABLE turnos ADD COLUMN modalidad TEXT DEFAULT 'PRESENCIAL';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='turnos' AND column_name='link_videoconsulta') THEN
        ALTER TABLE turnos ADD COLUMN link_videoconsulta TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='turnos' AND column_name='numero_bono') THEN
        ALTER TABLE turnos ADD COLUMN numero_bono TEXT;
    END IF;
END $$;

-- 7. ÍNDICES DE ALTO RENDIMIENTO (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_comprobantes_arca_cae ON comprobantes_arca(cae);
CREATE INDEX IF NOT EXISTS idx_lotes_periodo ON lotes_facturacion(periodo_anio, periodo_mes);
CREATE INDEX IF NOT EXISTS idx_consentimientos_paciente ON consentimientos_informados(paciente_id);

-- 8. REGISTRO SEGURO EN SUPABASE REALTIME (Sin errores si ya existían)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE turnos;
    EXCEPTION WHEN duplicate_object THEN
        -- Ya estaba agregado, no hacer nada
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE pacientes;
    EXCEPTION WHEN duplicate_object THEN
        -- Ya estaba agregado, no hacer nada
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE comprobantes_arca;
    EXCEPTION WHEN duplicate_object THEN
        -- Ya estaba agregado, no hacer nada
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE lotes_facturacion;
    EXCEPTION WHEN duplicate_object THEN
        -- Ya estaba agregado, no hacer nada
    END;
END $$;
