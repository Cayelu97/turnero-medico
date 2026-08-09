-- ==============================================================================
-- MEDITURNOS PRO / CLINICOS - DATOS SEMILLA (SEED DATA ARGENTINA)
-- ==============================================================================

-- 1. CLÍNICA POR DEFECTO
INSERT INTO clinicas (id, nombre, cuit, direccion, telefono, email, mensaje_bienvenida)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Centro Médico San Lucas',
    '30-71234567-9',
    'Av. Santa Fe 2450, Piso 3, CABA',
    '+54 11 4821-9000',
    'turnos@centrosanlucas.com.ar',
    'Bienvenido a nuestro centro médico. Elija su especialidad o profesional para reservar su turno online de forma ágil.'
) ON CONFLICT (id) DO NOTHING;

-- 2. CONSULTORIOS FÍSICOS
INSERT INTO consultorios (id, clinica_id, nombre, piso_ubicacion, equipamiento, activo)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Consultorio 1 - Cardiología', 'Planta Baja', 'Electrocardiógrafo, Camilla de examen, Tensiómetro', true),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Consultorio 2 - Ecografía & Diagnóstico', 'Piso 1 - Sala A', 'Ecógrafo General & Doppler Color', true),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Consultorio 3 - Pediatría', 'Planta Baja', 'Balanza pediátrica, Tallímetro, Otoscopio', true),
    ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Consultorio 4 - Traumatología', 'Piso 1 - Sala B', 'Negatoscopio digital, Camilla articulada', true),
    ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Consultorio 5 - Clínica Médica', 'Planta Baja', 'Equipo de diagnóstico clínico general', true)
ON CONFLICT (id) DO NOTHING;

-- 3. OBRAS SOCIALES Y PREPAGAS
INSERT INTO obras_sociales (id, clinica_id, nombre, sigla, cuit, requiere_bono, requiere_autorizacion_previa, instrucciones_afiliado, activo)
VALUES 
    ('o0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Particular / Privado', 'PART', '', false, false, 'Abono directo en recepción por efectivo, débito o transferencia.', true),
    ('o0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'OSDE', 'OSDE', '30-54674125-3', false, false, 'Presentar credencial digital de app OSDE y DNI.', true),
    ('o0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Swiss Medical', 'SMG', '30-67890123-4', false, false, 'Validación por token o credencial digital.', true),
    ('o0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Galeno', 'GAL', '30-70809012-5', false, false, 'Credencial física o digital activa y DNI.', true),
    ('o0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'PAMI', 'PAMI', '30-52276392-2', true, true, 'Presentar credencial y Orden Médica Electrónica (OME).', true),
    ('o0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'IOMA', 'IOMA', '30-60000000-1', true, true, 'Traer bono/token de consulta autorizado.', true),
    ('o0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'OSECAC', 'OSECAC', '30-54728391-8', true, false, 'Presentar carnet de afiliado y último recibo de sueldo.', true),
    ('o0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Medifé', 'MED', '30-68192301-7', false, false, 'Credencial digital y autorización previa para estudios especiales.', true)
ON CONFLICT (id) DO NOTHING;

-- 4. PLANES POR OBRA SOCIAL
INSERT INTO planes (id, obra_social_id, nombre_plan, codigo_plan, descripcion, activo)
VALUES 
    ('p0000000-0000-0000-0000-000000000001', 'o0000000-0000-0000-0000-000000000001', 'Particular Estándar', 'PART-STD', 'Arancel de consulta particular', true),
    ('p0000000-0000-0000-0000-000000000002', 'o0000000-0000-0000-0000-000000000002', 'Plan 210', 'OSDE-210', 'Sin coseguro en consultas básicas', true),
    ('p0000000-0000-0000-0000-000000000003', 'o0000000-0000-0000-0000-000000000002', 'Plan 310', 'OSDE-310', 'Cobertura amplia sin coseguros', true),
    ('p0000000-0000-0000-0000-000000000004', 'o0000000-0000-0000-0000-000000000002', 'Plan 410 / 510', 'OSDE-VIP', 'Cobertura premium total', true),
    ('p0000000-0000-0000-0000-000000000005', 'o0000000-0000-0000-0000-000000000003', 'SMG20', 'SMG-20', 'Con copago en prácticas complejas', true),
    ('p0000000-0000-0000-0000-000000000006', 'o0000000-0000-0000-0000-000000000003', 'SMG30 / SMG50', 'SMG-TOP', 'Sin coseguros en consultas', true),
    ('p0000000-0000-0000-0000-000000000007', 'o0000000-0000-0000-0000-000000000004', 'Oro / Plata', 'GAL-OP', 'Cobertura general', true),
    ('p0000000-0000-0000-0000-000000000008', 'o0000000-0000-0000-0000-000000000005', 'PAMI Integral', 'PAMI-INT', 'Bono/Orden médica obligatoria', true),
    ('p0000000-0000-0000-0000-000000000009', 'o0000000-0000-0000-0000-000000000006', 'IOMA Obligatorio', 'IOMA-OBL', 'Bono categoría B/C según profesional', true),
    ('p0000000-0000-0000-0000-000000000010', 'o0000000-0000-0000-0000-000000000007', 'OSECAC General', 'OSECAC-GEN', 'Coseguro $1.500 en ciertas prácticas', true)
ON CONFLICT (id) DO NOTHING;

-- 5. NOMENCLADOR DE PRÁCTICAS MÉDICAS (PMO)
INSERT INTO practicas_nomenclador (id, clinica_id, codigo_pmo, descripcion, duracion_minutos, valor_particular, coseguro_defecto, requiere_orden_medica, requiere_autorizacion, instrucciones_preparacion, activo)
VALUES 
    ('n0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '42.01.01', 'Consulta Médica Especializada en Consultorio', 20, 18000.00, 0.00, false, false, 'Concurrir con estudios previos y medicación actual.', true),
    ('n0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '42.01.02', 'Consulta de Control / Seguimiento', 15, 12000.00, 0.00, false, false, 'Traer resultados de laboratorio o estudios indicados.', true),
    ('n0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '18.01.01', 'Ecografía Abdominal Completa', 30, 32000.00, 4500.00, true, true, 'Ayuno de 8 horas. No consumir lácteos ni gaseosas el día anterior.', true),
    ('n0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '18.01.06', 'Ecocardiograma Doppler Color', 30, 42000.00, 6000.00, true, true, 'Concurrir con ropa cómoda de dos piezas.', true),
    ('n0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '17.01.01', 'Electrocardiograma (ECG) con Informe', 15, 14000.00, 2000.00, false, false, 'No colocarse cremas en el pecho antes del estudio.', true),
    ('n0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', '25.01.01', 'Sesión de Kinesiología y Fisioterapia', 40, 15000.00, 2500.00, true, false, 'Asistir con ropa deportiva cómoda y toalla personal.', true),
    ('n0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', '08.01.01', 'Fondo de Ojo / Examen Oftalmológico', 20, 20000.00, 3000.00, false, false, 'Asistir acompañado, se colocan gotas dilatadoras.', true)
ON CONFLICT (id) DO NOTHING;

-- 6. PROFESIONALES DE LA SALUD
INSERT INTO profesionales (id, clinica_id, nombre, apellido, matricula_nacional, matricula_provincial, especialidad, email, telefono, duracion_turno_minutos, max_sobreturnos_dia, color_agenda, atiende_particular, activo)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Martín', 'Pérez Rossi', 'MN 114.829', 'MP 45.291', 'Cardiología', 'mperez@centrosanlucas.com.ar', '11 5521-4411', 20, 4, '#0284c7', true, true),
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Florencia', 'González Méndez', 'MN 132.540', 'MP 52.883', 'Pediatría', 'fgonzalez@centrosanlucas.com.ar', '11 4490-1122', 20, 3, '#ec4899', true, true),
    ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Gustavo', 'Albarracín', 'MN 98.412', 'MP 38.109', 'Traumatología y Ortopedia', 'galbarracin@centrosanlucas.com.ar', '11 6382-9900', 20, 5, '#f59e0b', true, true),
    ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Mariana', 'López Vega', 'MN 145.201', 'MP 56.402', 'Diagnóstico por Imágenes', 'mlopez@centrosanlucas.com.ar', '11 7102-3344', 30, 2, '#8b5cf6', true, true),
    ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Carlos', 'Villanueva', 'MN 105.670', 'MP 41.332', 'Clínica Médica', 'cvillanueva@centrosanlucas.com.ar', '11 3912-7788', 20, 4, '#10b981', true, true)
ON CONFLICT (id) DO NOTHING;

-- 7. HORARIOS DE ATENCIÓN DE PROFESIONALES (GRILLA SEMANAL)
-- 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes
INSERT INTO horarios_atencion (id, profesional_id, consultorio_id, dia_semana, hora_inicio, hora_fin, duracion_slot_min, activo)
VALUES 
    -- Dr. Martín Pérez (Cardiología - Lunes y Miércoles 08:00 a 13:00 en Consultorio 1)
    ('h0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 1, '08:00', '13:00', 20, true),
    ('h0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 3, '08:00', '13:00', 20, true),
    ('h0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 5, '14:00', '18:00', 20, true),
    
    -- Dra. Florencia González (Pediatría - Martes y Jueves 09:00 a 14:00 en Consultorio 3)
    ('h0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 2, '09:00', '14:00', 20, true),
    ('h0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 4, '09:00', '14:00', 20, true),
    
    -- Dr. Gustavo Albarracín (Traumatología - Lunes y Viernes 14:00 a 19:00 en Consultorio 4)
    ('h0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 1, '14:00', '19:00', 20, true),
    ('h0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 5, '08:30', '13:30', 20, true),
    
    -- Dra. Mariana López (Ecografías - Miércoles y Sábados en Consultorio 2)
    ('h0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 3, '14:00', '19:00', 30, true),
    ('h0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 6, '09:00', '13:00', 30, true),
    
    -- Dr. Carlos Villanueva (Clínica Médica - Lunes a Jueves 15:00 a 20:00 en Consultorio 5)
    ('h0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 1, '15:00', '20:00', 20, true),
    ('h0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 2, '15:00', '20:00', 20, true),
    ('h0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 3, '15:00', '20:00', 20, true),
    ('h0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 4, '15:00', '20:00', 20, true)
ON CONFLICT (id) DO NOTHING;

-- 8. FERIADOS NACIONALES ARGENTINA 2026
INSERT INTO bloqueos_agenda (id, clinica_id, profesional_id, consultorio_id, tipo, fecha_inicio, fecha_fin, motivo)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', NULL, NULL, 'FERIADO_NACIONAL', '2026-01-01', '2026-01-01', 'Año Nuevo'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', NULL, NULL, 'FERIADO_NACIONAL', '2026-02-16', '2026-02-17', 'Carnaval'),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', NULL, NULL, 'FERIADO_NACIONAL', '2026-03-24', '2026-03-24', 'Día Nacional de la Memoria por la Verdad y la Justicia'),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', NULL, NULL, 'FERIADO_NACIONAL', '2026-04-02', '2026-04-02', 'Día del Veterano y de los Caídos en la Guerra de Malvinas'),
    ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', NULL, NULL, 'FERIADO_NACIONAL', '2026-05-01', '2026-05-01', 'Día del Trabajador'),
    ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', NULL, NULL, 'FERIADO_NACIONAL', '2026-05-25', '2026-05-25', 'Día de la Revolución de Mayo'),
    ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', NULL, NULL, 'FERIADO_NACIONAL', '2026-06-20', '2026-06-20', 'Paso a la Inmortalidad del Gral. Manuel Belgrano'),
    ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', NULL, NULL, 'FERIADO_NACIONAL', '2026-07-09', '2026-07-09', 'Día de la Independencia'),
    ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', NULL, NULL, 'FERIADO_NACIONAL', '2026-08-17', '2026-08-17', 'Paso a la Inmortalidad del Gral. José de San Martín'),
    ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', NULL, NULL, 'FERIADO_NACIONAL', '2026-10-12', '2026-10-12', 'Día del Respeto a la Diversidad Cultural'),
    ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', NULL, NULL, 'FERIADO_NACIONAL', '2026-12-25', '2026-12-25', 'Navidad')
ON CONFLICT (id) DO NOTHING;
