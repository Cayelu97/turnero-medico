import * as XLSX from 'xlsx';
import { formatDateAR } from './formatters';

/**
 * Exporta un listado de turnos a formato Excel (.xlsx) con estructura profesional y metadatos clínicos.
 */
export const exportarTurnosExcel = ({
  turnos = [],
  pacientes = [],
  profesionales = [],
  consultorios = [],
  obrasSociales = [],
  planes = [],
  servicios = [],
  nomenclador = [],
  clinicas = [],
  titulo = 'Planilla de Turnos',
  nombreArchivo = 'Planilla_Turnos'
}) => {
  if (!turnos || turnos.length === 0) {
    alert('No hay turnos para exportar con los filtros seleccionados.');
    return;
  }

  // Ordenar turnos cronológicamente por fecha y hora
  const turnosOrdenados = [...turnos].sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
    return (a.hora_inicio || '').localeCompare(b.hora_inicio || '');
  });

  // Mapeo detallado de filas
  const dataRows = turnosOrdenados.map((t, index) => {
    const pac = pacientes.find(p => p.id === t.paciente_id);
    const prof = profesionales.find(p => p.id === t.profesional_id);
    const cons = consultorios.find(c => c.id === t.consultorio_id);
    const sede = clinicas.find(c => c.id === t.clinica_id);
    const os = obrasSociales.find(o => o.id === (t.obra_social_id || pac?.obra_social_id)) || (pac?.obra_social_id ? { nombre: pac.obra_social_id } : null);
    const osNombre = os?.sigla || os?.nombre || pac?.obra_social_nombre || pac?.obra_social || t.obra_social_nombre || 'Particular';
    const plan = planes.find(p => p.id === (t.plan_id || pac?.plan_id));
    const serv = servicios.find(s => s.id === t.servicio_id);
    const practica = nomenclador.find(n => n.id === t.practica_id);

    return {
      '#': index + 1,
      'Fecha': t.fecha,
      'Hora Inicio': t.hora_inicio || '',
      'Hora Fin': t.hora_fin || '',
      'Código Turno': t.codigo_reserva || '',
      'Estado': t.estado ? t.estado.replace('_', ' ') : 'PROGRAMADO',
      'Confirmado WhatsApp': t.confirmado_whatsapp ? 'SÍ (Confirmado)' : 'Pendiente',
      'Paciente': pac ? `${pac.apellido}, ${pac.nombre}` : 'Paciente',
      'DNI': pac?.dni || '',
      'Teléfono / WhatsApp': pac?.telefono_whatsapp || '',
      'Obra Social / Cobertura': osNombre,
      'Plan': plan?.nombre_plan || '-',
      'N° Afiliado': pac?.numero_afiliado || t.numero_afiliado || '-',
      'Profesional': prof ? `Dr(a). ${prof.apellido}, ${prof.nombre}` : 'No asignado',
      'Especialidad': prof?.especialidad || '-',
      'Servicio': serv?.nombre || 'Consulta General',
      'Práctica Nomenclador': practica?.descripcion || '-',
      'Sede': sede?.nombre || 'Sede Central',
      'Consultorio': cons?.nombre || '-',
      'Sobreturno': t.es_sobreturno ? 'SÍ' : 'NO',
      'Observaciones': t.observaciones || ''
    };
  });

  // Crear hoja de cálculo
  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  // Definir anchos de columnas óptimos para lectura
  worksheet['!cols'] = [
    { wch: 5 },   // #
    { wch: 12 },  // Fecha
    { wch: 12 },  // Hora Inicio
    { wch: 12 },  // Hora Fin
    { wch: 15 },  // Código
    { wch: 14 },  // Estado
    { wch: 22 },  // Confirmado
    { wch: 28 },  // Paciente
    { wch: 12 },  // DNI
    { wch: 18 },  // Teléfono
    { wch: 22 },  // Obra Social
    { wch: 14 },  // Plan
    { wch: 16 },  // N° Afiliado
    { wch: 26 },  // Profesional
    { wch: 20 },  // Especialidad
    { wch: 22 },  // Servicio
    { wch: 24 },  // Práctica
    { wch: 24 },  // Sede
    { wch: 20 },  // Consultorio
    { wch: 12 },  // Sobreturno
    { wch: 30 }   // Observaciones
  ];

  // Crear libro y añadir hoja
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Turnos');

  // Guardar archivo
  const fechaHoy = new Date().toISOString().split('T')[0];
  const finalFilename = `${nombreArchivo}_${fechaHoy}.xlsx`;
  XLSX.writeFile(workbook, finalFilename);
};
