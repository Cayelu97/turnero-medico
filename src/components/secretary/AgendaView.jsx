import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  ShieldCheck, 
  Search, 
  CalendarDays, 
  CheckCircle2, 
  XCircle, 
  Settings,
  MessageCircle,
  Repeat,
  FileText,
  Filter,
  Download,
  LayoutGrid,
  Users,
  Building,
  UserCheck,
  Stethoscope,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ConfigurarAgendaModal } from './ConfigurarAgendaModal';
import { TurnoRecurrenteModal } from './TurnoRecurrenteModal';
import { AgendarTurnoSecretariaModal } from './AgendarTurnoSecretariaModal';
import { ReprogramarTurnoModal } from './ReprogramarTurnoModal';
import { CancelarTurnoModal } from './CancelarTurnoModal';
import { DetalleTurnoModal } from './DetalleTurnoModal';
import { VoucherModal } from '../patient/VoucherModal';
import { getLocalDateString, addDaysToDateString } from '../../utils/dateUtils';

export const AgendaView = () => {
  const { 
    turnos = [], 
    profesionales = [], 
    servicios = [], 
    consultorios = [], 
    pacientes = [], 
    obrasSociales = [], 
    planes = [], 
    nomenclador = [], 
    allClinicas = [], 
    confirmarTurnoPorPaciente = () => {},
    showToast = () => {}
  } = useApp() || {};

  const [viewMode, setViewMode] = useState('diaria');
  const [currentDate, setCurrentDate] = useState(() => getLocalDateString(new Date()));
  const [selectedCentroFilter, setSelectedCentroFilter] = useState('TODOS');
  const [selectedProfFilter, setSelectedProfFilter] = useState('');
  const [selectedServicioFilter, setSelectedServicioFilter] = useState('');
  const [selectedConsFilter, setSelectedConsFilter] = useState('');
  const [searchPatientQuery, setSearchPatientQuery] = useState('');
  const [activeKpiFilter, setActiveKpiFilter] = useState('ALL'); 

  const [sortOrderSemanal, setSortOrderSemanal] = useState('asc');
  const [futurosRango, setFuturosRango] = useState('30d');

  const [showConfigAgendaModal, setShowConfigAgendaModal] = useState(false);
  const [showRecurrenteModal, setShowRecurrenteModal] = useState(false);
  const [showAgendarModal, setShowAgendarModal] = useState(false);
  const [agendarProfId, setAgendarProfId] = useState(null);
  const [agendarDefaultHora, setAgendarDefaultHora] = useState(null);
  const [showReprogramarModal, setShowReprogramarModal] = useState(false);
  const [turnoToReprogram, setTurnoToReprogram] = useState(null);
  const [showCancelarModal, setShowCancelarModal] = useState(false);
  const [turnoToCancel, setTurnoToCancel] = useState(null);
  const [selectedTurnoForVoucher, setSelectedTurnoForVoucher] = useState(null);
  const [selectedDetalleTurno, setSelectedDetalleTurno] = useState(null);

  const handlePrevDay = () => setCurrentDate(prev => addDaysToDateString(prev, -1));
  const handleNextDay = () => setCurrentDate(prev => addDaysToDateString(prev, 1));
  const handleToday = () => setCurrentDate(getLocalDateString(new Date()));

  const visibleProfessionals = useMemo(() => {
    return profesionales.filter(p => {
      if (selectedCentroFilter !== 'TODOS' && p.clinica_id && p.clinica_id !== selectedCentroFilter) return false;
      if (selectedProfFilter && p.id !== selectedProfFilter) return false;
      return p.activo !== false;
    });
  }, [profesionales, selectedCentroFilter, selectedProfFilter]);

  const turnosDelDia = useMemo(() => {
    return turnos.filter(t => {
      if (t.fecha !== currentDate) return false;
      if (selectedCentroFilter !== 'TODOS' && t.clinica_id && t.clinica_id !== selectedCentroFilter) return false;
      if (selectedProfFilter && t.profesional_id !== selectedProfFilter) return false;
      if (selectedServicioFilter && t.servicio_id !== selectedServicioFilter) return false;
      if (selectedConsFilter && t.consultorio_id !== selectedConsFilter) return false;
      if (searchPatientQuery.trim()) {
        const q = searchPatientQuery.toLowerCase();
        const pac = pacientes.find(p => p.id === t.paciente_id);
        const matchPac = pac && (`${pac.nombre} ${pac.apellido}`.toLowerCase().includes(q) || pac.dni.includes(q));
        const matchCod = t.codigo_reserva && t.codigo_reserva.toLowerCase().includes(q);
        if (!matchPac && !matchCod) return false;
      }
      if (activeKpiFilter === 'EN_ESPERA' && t.estado !== 'EN_ESPERA') return false;
      if (activeKpiFilter === 'EN_ATENCION' && t.estado !== 'EN_ATENCION') return false;
      if (activeKpiFilter === 'ATENDIDO' && t.estado !== 'ATENDIDO') return false;
      if (activeKpiFilter === 'SOBRETURNOS' && (!t.es_sobreturno || t.estado === 'CANCELADO')) return false;
      if (activeKpiFilter === 'CANCELADOS' && t.estado !== 'CANCELADO' && t.estado !== 'NO_ASISTIO') return false;
      return true;
    });
  }, [turnos, currentDate, selectedCentroFilter, selectedProfFilter, selectedServicioFilter, selectedConsFilter, searchPatientQuery, activeKpiFilter, pacientes]);

  const kpisDia = useMemo(() => {
    const todosDelDia = turnos.filter(t => {
      if (t.fecha !== currentDate) return false;
      if (selectedCentroFilter !== 'TODOS' && t.clinica_id && t.clinica_id !== selectedCentroFilter) return false;
      if (selectedProfFilter && t.profesional_id !== selectedProfFilter) return false;
      return true;
    });
    return {
      total: todosDelDia.length,
      enEspera: todosDelDia.filter(t => t.estado === 'EN_ESPERA').length,
      enAtencion: todosDelDia.filter(t => t.estado === 'EN_ATENCION').length,
      atendidos: todosDelDia.filter(t => t.estado === 'ATENDIDO').length,
      sobreturnos: todosDelDia.filter(t => t.es_sobreturno && t.estado !== 'CANCELADO').length,
      cancelados: todosDelDia.filter(t => t.estado === 'CANCELADO' || t.estado === 'NO_ASISTIO').length
    };
  }, [turnos, currentDate, selectedCentroFilter, selectedProfFilter]);

  const todayStr = getLocalDateString(new Date());
  const turnosFuturos = useMemo(() => {
    return turnos.filter(t => {
      if (t.fecha < todayStr) return false;
      if (selectedCentroFilter !== 'TODOS' && t.clinica_id && t.clinica_id !== selectedCentroFilter) return false;
      if (selectedProfFilter && t.profesional_id !== selectedProfFilter) return false;
      if (selectedServicioFilter && t.servicio_id !== selectedServicioFilter) return false;
      if (selectedConsFilter && t.consultorio_id !== selectedConsFilter) return false;
      if (futurosRango === '7d' && t.fecha > addDaysToDateString(todayStr, 7)) return false;
      if (futurosRango === '15d' && t.fecha > addDaysToDateString(todayStr, 15)) return false;
      if (futurosRango === '30d' && t.fecha > addDaysToDateString(todayStr, 30)) return false;
      if (searchPatientQuery.trim()) {
        const q = searchPatientQuery.toLowerCase();
        const pac = pacientes.find(p => p.id === t.paciente_id);
        const matchPac = pac && (`${pac.nombre} ${pac.apellido}`.toLowerCase().includes(q) || pac.dni.includes(q));
        const matchCod = t.codigo_reserva && t.codigo_reserva.toLowerCase().includes(q);
        if (!matchPac && !matchCod) return false;
      }
      return true;
    }).sort((a, b) => a.fecha !== b.fecha ? a.fecha.localeCompare(b.fecha) : a.hora_inicio.localeCompare(b.hora_inicio));
  }, [turnos, todayStr, selectedCentroFilter, selectedProfFilter, selectedServicioFilter, selectedConsFilter, futurosRango, searchPatientQuery, pacientes]);

  const semanaDays = useMemo(() => {
    const targetDate = new Date(currentDate + 'T00:00:00');
    const dayOfWeek = targetDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(targetDate);
    monday.setDate(targetDate.getDate() + diffToMonday);
    return Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return getLocalDateString(d);
    });
  }, [currentDate]);

  const timelineHours = useMemo(() => Array.from({ length: 13 }).map((_, i) => `${(i + 8).toString().padStart(2, '0')}:00`), []);

  const handleExportCSV = () => {
    const lista = viewMode === 'futuros' ? turnosFuturos : turnosDelDia;
    if (lista.length === 0) return showToast('No hay turnos para exportar', 'info');
    const headers = ['Fecha', 'Hora', 'Paciente', 'DNI', 'Profesional', 'Estado', 'Sobreturno'];
    const rows = lista.map(t => [t.fecha, t.hora_inicio, `"${pacientes.find(p => p.id === t.paciente_id)?.nombre || ''}"`, pacientes.find(p => p.id === t.paciente_id)?.dni || '', `"${profesionales.find(p => p.id === t.profesional_id)?.apellido || ''}"`, t.estado, t.es_sobreturno ? 'SI' : 'NO']);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `agenda_${currentDate}.csv`;
    link.click();
    showToast('Exportación exitosa');
  };

  const handleOpenNuevoTurno = (profId = null, hora = null) => {
    setAgendarProfId(profId || selectedProfFilter || null);
    setAgendarDefaultHora(hora);
    setShowAgendarModal(true);
  };

  const getEstadoBadge = (estado, confirmadoWhatsApp) => {
    switch (estado) {
      case 'PROGRAMADO': return { label: confirmadoWhatsApp ? 'Conf. WhatsApp' : 'Programado', bg: confirmadoWhatsApp ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200', dot: confirmadoWhatsApp ? 'bg-emerald-500' : 'bg-sky-500' };
      case 'EN_ESPERA': return { label: 'En Espera', bg: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-300', dot: 'bg-amber-500' };
      case 'EN_ATENCION': return { label: 'En Consulta', bg: 'bg-purple-50 text-purple-800 border-purple-300 ring-1 ring-purple-300', dot: 'bg-purple-500' };
      case 'ATENDIDO': return { label: 'Atendido', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-600' };
      default: return { label: estado, bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200">
            {['diaria', 'timeline', 'semanal', 'futuros'].map(m => (
              <button key={m} onClick={() => setViewMode(m)} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${viewMode === m ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600'}`}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"><Download className="w-3.5 h-3.5" /> Exportar</button>
            <button onClick={() => setShowRecurrenteModal(true)} className="px-3 py-2 bg-purple-50 text-purple-800 rounded-xl text-xs font-bold">Paquete</button>
            <button onClick={() => setShowConfigAgendaModal(true)} className="p-2 bg-slate-100 rounded-xl"><Settings className="w-4 h-4" /></button>
            <button onClick={() => handleOpenNuevoTurno()} className="px-4 py-2 bg-medical-600 text-white rounded-xl text-xs font-black shadow-md">+ Nuevo Turno</button>
          </div>
        </div>

        {viewMode !== 'futuros' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
            {[{id:'ALL', l:'Total', v:kpisDia.total}, {id:'EN_ESPERA', l:'Espera', v:kpisDia.enEspera}, {id:'EN_ATENCION', l:'Consulta', v:kpisDia.enAtencion}, {id:'ATENDIDO', l:'Atendidos', v:kpisDia.atendidos}, {id:'SOBRETURNOS', l:'Sobreturnos', v:kpisDia.sobreturnos}, {id:'CANCELADOS', l:'Cancel/Aus', v:kpisDia.cancelados}].map(k => (
              <button key={k.id} onClick={() => setActiveKpiFilter(activeKpiFilter === k.id ? 'ALL' : k.id)} className={`p-2.5 rounded-2xl border ${activeKpiFilter === k.id ? 'bg-slate-900 text-white' : 'bg-slate-50'}`}>
                <span className="text-[10px] block uppercase font-bold">{k.l}</span>
                <span className="text-lg font-black">{k.v}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button onClick={handlePrevDay} className="p-1.5"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={handleToday} className="px-2 py-1 text-xs font-bold">Hoy</button>
              <button onClick={handleNextDay} className="p-1.5"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <input type="date" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={selectedProfFilter} onChange={(e) => setSelectedProfFilter(e.target.value)} className="px-3 py-1.5 border rounded-xl text-xs font-bold bg-slate-50">
              <option value="">Todos los Profesionales</option>
              {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
            <input type="text" placeholder="Buscar..." value={searchPatientQuery} onChange={(e) => setSearchPatientQuery(e.target.value)} className="pl-3 pr-3 py-1.5 border rounded-xl text-xs font-bold bg-slate-50" />
          </div>
        </div>
      </div>

      {/* 1. VISTA DIARIA MULTI-PROFESIONAL */}
      {viewMode === 'diaria' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {visibleProfessionals.map((prof) => {
            const profTurnos = turnosDelDia
              .filter(t => t.profesional_id === prof.id)
              .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

            const sobreturnosCount = profTurnos.filter(t => t.es_sobreturno && t.estado !== 'CANCELADO').length;

            return (
              <div 
                key={prof.id} 
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition"
              >
                {/* Cabecera del Profesional */}
                <div 
                  className="p-3.5 border-b border-slate-100 flex items-center justify-between"
                  style={{ borderTop: `4px solid ${prof.color_agenda || '#0284c7'}` }}
                >
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-2xs"
                      style={{ backgroundColor: prof.color_agenda || '#0284c7' }}
                    >
                      {prof.nombre[0]}{prof.apellido[0]}
                    </div>
                    <div>
                      <h3 className="font-black text-xs text-slate-900 leading-tight">
                        Dr(a). {prof.nombre} {prof.apellido}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                        {prof.especialidad}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenNuevoTurno(prof.id)}
                    className="p-1.5 bg-medical-50 hover:bg-medical-100 text-medical-800 rounded-xl text-[11px] font-black border border-medical-200 transition cursor-pointer"
                    title="Agendar turno o sobreturno para este profesional"
                  >
                    + Turno
                  </button>
                </div>

                {/* Resumen de la Columna */}
                <div className="px-3.5 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                  <span><strong>{profTurnos.length}</strong> citados</span>
                  {sobreturnosCount > 0 && (
                    <span className="text-orange-700 font-bold bg-orange-50 px-2 py-0.2 rounded-md border border-orange-200 text-[10px]">
                      {sobreturnosCount} sobreturnos
                    </span>
                  )}
                </div>

                {/* Lista de Turnos */}
                <div className="p-3 space-y-2.5 max-h-[640px] overflow-y-auto bg-slate-50/30">
                  {profTurnos.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl space-y-2">
                      <p>Sin turnos para esta fecha.</p>
                      <button
                        onClick={() => handleOpenNuevoTurno(prof.id)}
                        className="inline-flex items-center gap-1 text-medical-600 font-black hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Agendar turno
                      </button>
                    </div>
                  ) : (
                    profTurnos.map((t) => {
                      const pac = pacientes.find(p => p.id === t.paciente_id);
                      const os = obrasSociales.find(o => o.id === t.obra_social_id);
                      const plan = planes.find(p => p.id === t.plan_id);
                      const practica = nomenclador.find(p => p.id === t.practica_id);
                      const serv = servicios.find(s => s.id === t.servicio_id);
                      const badge = getEstadoBadge(t.estado, t.confirmado_whatsapp);
                      const isCancelled = t.estado === 'CANCELADO' || t.estado === 'NO_ASISTIO';

                      return (
                        <div 
                          key={t.id}
                          onClick={() => setSelectedDetalleTurno(t)}
                          className={`p-3 rounded-2xl border transition shadow-2xs space-y-2 cursor-pointer group hover:shadow-md ${
                            isCancelled 
                              ? 'bg-slate-100/70 border-slate-200 opacity-60' 
                              : t.estado === 'EN_ESPERA'
                              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30'
                              : t.estado === 'EN_ATENCION'
                              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-400/30'
                              : 'bg-white border-slate-200/80 hover:border-medical-300'
                          }`}
                        >
                          {/* Horario & Badge */}
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/60">
                                {t.hora_inicio}
                              </span>
                              {t.es_sobreturno && (
                                <span className="text-[9px] font-black bg-orange-100 text-orange-900 border border-orange-300 px-1.5 py-0.2 rounded">
                                  SOBRETURNO
                                </span>
                              )}
                              {t.nro_sesion && (
                                <span className="text-[9px] font-black bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded">
                                  S{t.nro_sesion}/{t.total_sesiones}
                                </span>
                              )}
                            </div>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${badge.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                          </div>

                          {/* Paciente y Cobertura */}
                          <div>
                            <h4 className="font-black text-xs text-slate-900 truncate group-hover:text-medical-600 transition">
                              {pac ? `${pac.apellido}, ${pac.nombre}` : 'Paciente'}
                            </h4>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate mt-0.5">
                              <ShieldCheck className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span>{os?.sigla || os?.nombre || 'Particular'} {plan ? `(${plan.nombre_plan})` : ''}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              {serv && (
                                <span className="inline-block text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100">
                                  {serv.nombre}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* WhatsApp & Acciones Rápidas */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px]" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedTurnoForVoucher({ turno: t, paciente: pac, profesional: prof, consultorio: consultorios.find(c => c.id === t.consultorio_id), obraSocial: os, plan, practica })}
                              className="text-slate-500 hover:text-medical-600 font-bold cursor-pointer"
                            >
                              Comprobante
                            </button>

                            <div className="flex gap-2 font-bold">
                              {!isCancelled && (
                                <>
                                  <button
                                    onClick={() => {
                                      setTurnoToReprogram(t);
                                      setShowReprogramarModal(true);
                                    }}
                                    className="text-sky-700 hover:underline cursor-pointer"
                                  >
                                    Reprogramar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setTurnoToCancel(t);
                                      setShowCancelarModal(true);
                                    }}
                                    className="text-rose-600 hover:underline cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. GRILLA HORARIA CONTINUA (TIMELINE DOCTOLIB STYLE) */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6 overflow-x-auto space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-tealmed-600" />
                <span>Grilla Horaria ({new Date(currentDate + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })})</span>
              </h3>
              <p className="text-xs text-slate-500">Haga clic en un slot libre para agendar inmediatamente con el médico correspondiente.</p>
            </div>
          </div>

          <div className="min-w-[700px]">
            <div className="grid gap-2 border-b border-slate-200 pb-2" style={{ gridTemplateColumns: `80px repeat(${visibleProfessionals.length || 1}, minmax(180px, 1fr))` }}>
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider py-2">Hora</div>
              {visibleProfessionals.map(prof => (
                <div key={prof.id} className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-[10px]" style={{ backgroundColor: prof.color_agenda || '#0284c7' }}>
                    {prof.nombre[0]}{prof.apellido[0]}
                  </div>
                  <div className="truncate">
                    <span className="font-black text-xs text-slate-900 block truncate">Dr(a). {prof.apellido}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{prof.especialidad}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="divide-y divide-slate-100">
              {timelineHours.map(hour => (
                <div key={hour} className="grid gap-2 py-1.5 items-center" style={{ gridTemplateColumns: `80px repeat(${visibleProfessionals.length || 1}, minmax(180px, 1fr))` }}>
                  <div className="font-mono text-xs font-black text-slate-600 bg-slate-100/80 px-2 py-1.5 rounded-lg text-center">{hour}</div>
                  {visibleProfessionals.map(prof => {
                    const turnosEnHora = turnosDelDia.filter(t => t.profesional_id === prof.id && t.hora_inicio.startsWith(hour.slice(0, 2)) && t.estado !== 'CANCELADO');

                    if (turnosEnHora.length === 0) {
                      return (
                        <div key={prof.id} onClick={() => handleOpenNuevoTurno(prof.id, hour)} className="p-2 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 hover:text-medical-600 hover:border-medical-400 hover:bg-medical-50/40 cursor-pointer transition text-xs font-bold group">
                          <span className="group-hover:hidden text-[11px] text-slate-300">Libre</span>
                          <span className="hidden group-hover:inline-flex items-center gap-1 font-black text-medical-700 text-xs"><Plus className="w-3 h-3" /> Agendar</span>
                        </div>
                      );
                    }

                    return (
                      <div key={prof.id} className="space-y-1">
                        {turnosEnHora.map(t => {
                          const pac = pacientes.find(p => p.id === t.paciente_id);
                          const os = obrasSociales.find(o => o.id === t.obra_social_id);
                          return (
                            <div key={t.id} onClick={() => setSelectedDetalleTurno(t)} className="p-2 rounded-xl border text-xs cursor-pointer transition bg-white border-slate-200 hover:border-medical-400 shadow-2xs">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono font-black text-slate-900 text-[11px]">{t.hora_inicio}</span>
                                <span className="text-[9px] font-bold text-slate-500 truncate max-w-[60px]">{os?.sigla || 'Part.'}</span>
                              </div>
                              <div className="font-black text-slate-800 text-[11px] truncate mt-0.5">{pac ? `${pac.apellido}, ${pac.nombre}` : 'Paciente'}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. VISTA SEMANAL */}
      {viewMode === 'semanal' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-900">Cronograma Semanal</h3>
            <button onClick={() => setSortOrderSemanal(s => s === 'asc' ? 'desc' : 'asc')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
              Orden: {sortOrderSemanal === 'asc' ? '08:00 ➔ 20:00' : '20:00 ➔ 08:00'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {semanaDays.map((diaStr) => {
              const diaTurnos = turnos.filter(t => t.fecha === diaStr && (!selectedProfFilter || t.profesional_id === selectedProfFilter) && t.estado !== 'CANCELADO')
                .sort((a, b) => sortOrderSemanal === 'asc' ? a.hora_inicio.localeCompare(b.hora_inicio) : b.hora_inicio.localeCompare(a.hora_inicio));
              const isCurrentSelected = diaStr === currentDate;
              const dateObj = new Date(diaStr + 'T00:00:00');

              return (
                <div key={diaStr} onClick={() => { setCurrentDate(diaStr); setViewMode('diaria'); }} className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-3 ${isCurrentSelected ? 'border-medical-600 bg-medical-50/40 shadow-sm' : 'border-slate-200 hover:border-medical-300 bg-slate-50/40 hover:bg-white'}`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-xs text-slate-800 uppercase tracking-wider">{dateObj.toLocaleDateString('es-AR', { weekday: 'short' })}</span>
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-md border ${isCurrentSelected ? 'bg-medical-600 text-white border-medical-600' : 'bg-white text-slate-900 border-slate-200'}`}>{diaStr.split('-')[2]}</span>
                    </div>
                    <span className="text-xs font-black text-medical-800 block mb-2">{diaTurnos.length} turnos</span>
                    <div className="space-y-1.5 min-h-[120px]">
                      {diaTurnos.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-[11px] italic">Sin turnos</div>
                      ) : (
                        diaTurnos.map(t => (
                          <div key={t.id} onClick={(e) => { e.stopPropagation(); setSelectedDetalleTurno(t); }} className="p-2 bg-white border border-slate-200 hover:border-medical-500 hover:shadow-md rounded-xl text-xs transition cursor-pointer">
                            <strong className="font-mono font-black text-slate-900 text-[11px] mr-1">{t.hora_inicio}</strong>
                            <span className="font-bold text-slate-800 text-[11px] truncate block">{pacientes.find(p => p.id === t.paciente_id)?.apellido || 'Paciente'}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-medical-600 text-center pt-2 border-t border-slate-200/80">Ver día ➔</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. VISTA TURNOS FUTUROS */}
      {viewMode === 'futuros' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900">Listado de Turnos Futuros Agendados</h3>
              <p className="text-xs text-slate-500">Visualice y exporte todas las reservas futuras.</p>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-900 rounded-xl text-xs font-black">{turnosFuturos.length} turnos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3">Fecha & Hora</th>
                  <th className="py-3 px-3">Paciente</th>
                  <th className="py-3 px-3">Profesional</th>
                  <th className="py-3 px-3">Cobertura</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {turnosFuturos.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">No hay turnos futuros.</td></tr>
                ) : (
                  turnosFuturos.map((t) => {
                    const pac = pacientes.find(p => p.id === t.paciente_id);
                    const prof = profesionales.find(p => p.id === t.profesional_id);
                    const os = obrasSociales.find(o => o.id === t.obra_social_id);
                    const badge = getEstadoBadge(t.estado, t.confirmado_whatsapp);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{t.codigo_reserva}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{t.fecha} • <span className="text-medical-700">{t.hora_inicio} hs</span></td>
                        <td className="py-3 px-3"><strong>{pac ? `${pac.apellido}, ${pac.nombre}` : 'Paciente'}</strong><span className="block text-[11px] text-slate-500">DNI {pac?.dni}</span></td>
                        <td className="py-3 px-3"><strong>Dr(a). {prof?.nombre} {prof?.apellido}</strong><span className="block text-[11px] text-medical-700">{prof?.especialidad}</span></td>
                        <td className="py-3 px-3">{os?.nombre || 'Particular'}</td>
                        <td className="py-3 px-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${badge.bg}`}>{badge.label}</span></td>
                        <td className="py-3 px-3 text-right">
                          <button onClick={() => setSelectedDetalleTurno(t)} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs cursor-pointer">Gestionar</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      <ConfigurarAgendaModal isOpen={showConfigAgendaModal} onClose={() => setShowConfigAgendaModal(false)} />
      <TurnoRecurrenteModal isOpen={showRecurrenteModal} onClose={() => setShowRecurrenteModal(false)} />
      <AgendarTurnoSecretariaModal isOpen={showAgendarModal} defaultFecha={currentDate} defaultProfId={agendarProfId} onClose={() => setShowAgendarModal(false)} />
      <ReprogramarTurnoModal isOpen={showReprogramarModal} turno={turnoToReprogram} onClose={() => setShowReprogramarModal(false)} />
      <CancelarTurnoModal isOpen={showCancelarModal} turno={turnoToCancel} canceladoPor="SECRETARIA" onClose={() => setShowCancelarModal(false)} />
      <DetalleTurnoModal isOpen={!!selectedDetalleTurno} turno={selectedDetalleTurno} onClose={() => setSelectedDetalleTurno(null)} onReprogramar={t => { setTurnoToReprogram(t); setShowReprogramarModal(true); }} onCancelar={t => { setTurnoToCancel(t); setShowCancelarModal(true); }} onVerVoucher={t => setSelectedTurnoForVoucher({ turno: t, paciente: pacientes.find(p => p.id === t.paciente_id), profesional: profesionales.find(p => p.id === t.profesional_id), consultorio: consultorios.find(c => c.id === t.consultorio_id), obraSocial: obrasSociales.find(o => o.id === t.obra_social_id), plan: planes.find(p => p.id === t.plan_id), practica: nomenclador.find(n => n.id === t.practica_id) })} />
      {selectedTurnoForVoucher && <VoucherModal turno={selectedTurnoForVoucher.turno} paciente={selectedTurnoForVoucher.paciente} profesional={selectedTurnoForVoucher.profesional} consultorio={selectedTurnoForVoucher.consultorio} obraSocial={selectedTurnoForVoucher.obraSocial} plan={selectedTurnoForVoucher.plan} practica={selectedTurnoForVoucher.practica} onClose={() => setSelectedTurnoForVoucher(null)} />}
    </div>
  );
};
