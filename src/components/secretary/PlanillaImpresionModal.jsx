import React, { useRef } from 'react';
import { Printer, FileSpreadsheet, X, Calendar, Clock, User, Building2, Stethoscope, CheckSquare, ShieldCheck } from 'lucide-react';
import { formatDateAR } from '../../utils/formatters';
import { exportarTurnosExcel } from '../../utils/exportUtils';
import { useApp } from '../../context/AppContext';

export const PlanillaImpresionModal = ({
  isOpen,
  onClose,
  turnos = [],
  fechaSeleccionada,
  profesionalSeleccionado,
  sedeSeleccionada
}) => {
  const { clinica = {}, pacientes = [], profesionales = [], consultorios = [], obrasSociales = [], planes = [], servicios = [], nomenclador = [], clinicas = [] } = useApp() || {};
  const printAreaRef = useRef(null);

  if (!isOpen) return null;

  // Filtrar y ordenar turnos
  const targetProf = profesionales.find(p => p.id === profesionalSeleccionado);
  const targetSede = clinicas.find(c => c.id === sedeSeleccionada) || clinica;

  const turnosFiltrados = turnos.filter(t => {
    if (profesionalSeleccionado && t.profesional_id !== profesionalSeleccionado) return false;
    if (fechaSeleccionada && t.fecha !== fechaSeleccionada) return false;
    if (sedeSeleccionada && sedeSeleccionada !== 'TODOS' && t.clinica_id && t.clinica_id !== sedeSeleccionada) return false;
    return t.estado !== 'CANCELADO';
  }).sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''));

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportarTurnosExcel({
      turnos: turnosFiltrados,
      pacientes,
      profesionales,
      consultorios,
      obrasSociales,
      planes,
      servicios,
      nomenclador,
      clinicas,
      nombreArchivo: `Planilla_Turnos_${targetProf ? targetProf.apellido : 'Todos'}_${fechaSeleccionada || 'General'}`
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[96vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto">
        
        {/* BARRA SUPERIOR DE CONTROL (NO SE IMPRIME) */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-sky-100 text-sky-800 rounded-xl">
              <Printer className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-sm text-slate-900">Planilla de Turnos para Consultorio & Exportación</h3>
              <p className="text-xs text-slate-500">Imprimí en papel / guardá como PDF para el profesional o descargá en Excel</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar Excel (.xlsx)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Planilla / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ÁREA IMPRIMIBLE DE LA PLANILLA (ESTILOS ESPECIALES PARA HOJA A4 / PDF) */}
        <div ref={printAreaRef} className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible">
          
          {/* ENCABEZADO MÉDICO DE LA PLANILLA */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5 flex justify-between items-start">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {targetSede?.nombre || clinica?.nombre || 'Centro Médico'}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                {targetSede?.direccion || 'Consultorios Médicos'} • Tel: {targetSede?.telefono || clinica?.telefono || '-'}
              </p>
              <div className="inline-block mt-2 px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-md text-xs font-black text-slate-800">
                PLANILLA OFICIAL DE ATENCIÓN EN CONSULTORIO
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Profesional</div>
              <strong className="text-base sm:text-lg font-black text-slate-900 block">
                {targetProf ? `Dr(a). ${targetProf.apellido}, ${targetProf.nombre}` : 'Todos los profesionales'}
              </strong>
              <span className="text-xs font-semibold text-slate-700 block">
                {targetProf?.especialidad || 'Especialidades Múltiples'}
              </span>
              <div className="mt-1 text-xs font-black text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-block">
                Fecha: {fechaSeleccionada ? formatDateAR(fechaSeleccionada) : 'Todas las fechas'}
              </div>
            </div>
          </div>

          {/* RESUMEN INFORMATIVO */}
          <div className="flex justify-between items-center mb-4 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span>Total de pacientes citados: <strong className="text-slate-900">{turnosFiltrados.length}</strong></span>
            <span>Generado el: {new Date().toLocaleDateString('es-AR')} a las {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</span>
          </div>

          {/* TABLA DE TURNOS */}
          {turnosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              No hay turnos registrados para el profesional y fecha seleccionados.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black text-[11px] uppercase">
                  <th className="py-2.5 px-2 text-center w-8 border border-slate-900">#</th>
                  <th className="py-2.5 px-2 text-center w-10 border border-slate-900">Presente</th>
                  <th className="py-2.5 px-2 w-16 border border-slate-900">Hora</th>
                  <th className="py-2.5 px-2 border border-slate-900">Paciente</th>
                  <th className="py-2.5 px-2 w-24 border border-slate-900">DNI</th>
                  <th className="py-2.5 px-2 w-28 border border-slate-900">Teléfono</th>
                  <th className="py-2.5 px-2 border border-slate-900">Obra Social / Plan</th>
                  <th className="py-2.5 px-2 border border-slate-900">Servicio / Práctica</th>
                  <th className="py-2.5 px-3 border border-slate-900 w-48">Notas / Diagnóstico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {turnosFiltrados.map((t, idx) => {
                  const pac = pacientes.find(p => p.id === t.paciente_id);
                  const os = obrasSociales.find(o => o.id === (t.obra_social_id || pac?.obra_social_id)) || (pac?.obra_social_id ? { nombre: pac.obra_social_id } : null);
                  const osNombre = os?.sigla || os?.nombre || pac?.obra_social_nombre || pac?.obra_social || t.obra_social_nombre || 'Particular';
                  const plan = planes.find(p => p.id === (t.plan_id || pac?.plan_id));
                  const serv = servicios.find(s => s.id === t.servicio_id);
                  const practica = nomenclador.find(n => n.id === t.practica_id);

                  return (
                    <tr key={t.id} className="border-b border-slate-300 hover:bg-slate-50 break-inside-avoid">
                      <td className="py-2 px-2 text-center font-bold text-slate-500 border border-slate-300">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2 text-center border border-slate-300">
                        <div className="w-4 h-4 border-2 border-slate-400 rounded mx-auto flex items-center justify-center text-[9px] font-bold">
                          {t.estado === 'EN_ESPERA' || t.estado === 'EN_ATENCION' || t.estado === 'ATENDIDO' ? '✓' : ''}
                        </div>
                      </td>
                      <td className="py-2 px-2 font-mono font-black text-slate-900 border border-slate-300 whitespace-nowrap">
                        {t.hora_inicio} hs
                        {t.es_sobreturno && (
                          <span className="block text-[8px] font-black text-orange-700 uppercase">Sobreturno</span>
                        )}
                      </td>
                      <td className="py-2 px-2 border border-slate-300">
                        <strong className="text-slate-900 font-extrabold block">
                          {pac ? `${pac.apellido}, ${pac.nombre}` : 'Paciente'}
                        </strong>
                        {t.observaciones && (
                          <span className="text-[10px] text-slate-500 italic block truncate max-w-[200px]">
                            Obs: {t.observaciones}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 font-mono text-slate-700 border border-slate-300">
                        {pac?.dni || '-'}
                      </td>
                      <td className="py-2 px-2 text-slate-700 border border-slate-300">
                        {pac?.telefono_whatsapp || '-'}
                      </td>
                      <td className="py-2 px-2 border border-slate-300">
                        <strong className="text-slate-800 block">{osNombre}</strong>
                        <span className="text-[10px] text-slate-500 block">
                          {plan ? plan.nombre_plan : ''} {pac?.numero_afiliado ? `• Af: ${pac.numero_afiliado}` : ''}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-700 border border-slate-300">
                        {serv?.nombre || practica?.descripcion || 'Consulta'}
                      </td>
                      <td className="py-2 px-3 border border-slate-300 min-h-[32px] text-slate-400 text-[10px]">
                        {/* Espacio para anotaciones manuales del médico */}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* PIE DE FIRMA PARA EL PROFESIONAL & RECEPCIÓN */}
          <div className="mt-12 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs text-slate-600 print:mt-16">
            <div>
              <div className="w-48 border-b border-slate-400 mx-auto mb-1" />
              <span className="font-bold">Firma & Sello del Profesional</span>
            </div>
            <div>
              <div className="w-48 border-b border-slate-400 mx-auto mb-1" />
              <span className="font-bold">Recepción / Secretaría</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
