import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  ShieldCheck, 
  Search, 
  CalendarDays, 
  CheckCircle2, 
  XCircle, 
  X,
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
import { StorageService } from '../../services/storage';
import { getLocalDateString, addDaysToDateString, getDayOfWeekFromDateString, getDayDetailsFromDateString } from '../../utils/dateUtils';

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

  const [viewMode, setViewMode] = useState('diaria'); // 'diaria' | 'timeline' | 'timeline_semanal' | 'semanal' | 'futuros'
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
  const [agendarFecha, setAgendarFecha] = useState(null);
  const [showReprogramarModal, setShowReprogramarModal] = useState(false);
  const [turnoToReprogram, setTurnoToReprogram] = useState(null);
  const [showCancelarModal, setShowCancelarModal] = useState(false);
  const [turnoToCancel, setTurnoToCancel] = useState(null);
  const [selectedTurnoForVoucher, setSelectedTurnoForVoucher] = useState(null);
  const [selectedDetalleTurno, setSelectedDetalleTurno] = useState(null);

  const handlePrevDay = () => setCurrentDate(prev => addDaysToDateString(prev, -1));
  const handleNextDay = () => setCurrentDate(prev => addDaysToDateString(prev, 1));
  const handlePrevWeek = () => setCurrentDate(prev => addDaysToDateString(prev, -7));
  const handleNextWeek = () => setCurrentDate(prev => addDaysToDateString(prev, 7));
  const handleToday = () => setCurrentDate(getLocalDateString(new Date()));

  const visibleProfessionals = useMemo(() => {
    return profesionales.filter(p => {
      if (selectedCentroFilter !== 'TODOS' && p.clinica_id && p.clinica_id !== selectedCentroFilter) return false;
      if (selectedProfFilter && p.id !== selectedProfFilter) return false;
      if (selectedServicioFilter && p.servicios_ids && p.servicios_ids.length > 0 && !p.servicios_ids.includes(selectedServicioFilter)) return false;
      return p.activo !== false;
    });
  }, [profesionales, selectedCentroFilter, selectedProfFilter, selectedServicioFilter]);

  const [slotResolution, setSlotResolution] = useState('auto'); // 'auto' | '15' | '20' | '30' | '60'
  const [selectedWeeklyProfId, setSelectedWeeklyProfId] = useState('');

  // Sincronizar el profesional semanal con el filtro general o el primer profesional
  useEffect(() => {
    if (selectedProfFilter) {
      setSelectedWeeklyProfId(selectedProfFilter);
    } else if (!selectedWeeklyProfId && visibleProfessionals.length > 0) {
      setSelectedWeeklyProfId(visibleProfessionals[0].id);
    }
  }, [selectedProfFilter, visibleProfessionals, selectedWeeklyProfId]);

  // Duración de slot efectiva
  const activeWeeklyProf = useMemo(() => {
    return profesionales.find(p => p.id === (selectedWeeklyProfId || selectedProfFilter || (visibleProfessionals[0]?.id)));
  }, [profesionales, selectedWeeklyProfId, selectedProfFilter, visibleProfessionals]);

  const effectiveIntervalMinutes = useMemo(() => {
    if (slotResolution === '15') return 15;
    if (slotResolution === '20') return 20;
    if (slotResolution === '30') return 30;
    if (slotResolution === '60') return 60;
    
    // Auto: buscar primero en las agendas activas del médico, luego en sus horarios, luego en su perfil
    const targetProfId = activeWeeklyProf?.id;
    if (targetProfId) {
      const activeAgendas = StorageService.getAgendas(null, targetProfId).filter(a => a.estado === 'ACTIVA');
      if (activeAgendas.length > 0 && activeAgendas[0].duracion_slot_min) {
        return Number(activeAgendas[0].duracion_slot_min);
      }
      const activeHorarios = StorageService.getHorariosByProfesional(targetProfId);
      if (activeHorarios.length > 0 && activeHorarios[0].duracion_slot_min) {
        return Number(activeHorarios[0].duracion_slot_min);
      }
      if (activeWeeklyProf.duracion_turno_minutos) {
        return Number(activeWeeklyProf.duracion_turno_minutos);
      }
    }
    return 15;
  }, [slotResolution, activeWeeklyProf]);

  // Generar lista de franjas horarias exactas (08:00 a 20:00 con el intervalo seleccionado)
  const timelineSlots = useMemo(() => {
    const slots = [];
    const startMin = 8 * 60; // 08:00
    const endMin = 20 * 60;  // 20:00
    const step = effectiveIntervalMinutes || 20;

    for (let m = startMin; m < endMin; m += step) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
    }
    return slots;
  }, [effectiveIntervalMinutes]);

  const toMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  };

  // Función para determinar si un profesional atiende en un día y hora específicos
  const checkDoctorWorkingAt = (profId, fechaStr, horaStr) => {
    if (!profId || !fechaStr || !horaStr) return false;
    const diaSemana = getDayOfWeekFromDateString(fechaStr);
    if (diaSemana === 0) return false; // Domingos no

    const slotMin = toMinutes(horaStr);
    const horarios = StorageService.getHorariosByProfesional(profId).filter(h => {
      if (Number(h.dia_semana) !== Number(diaSemana)) return false;
      if (h.activo === false) return false;
      if (h.fecha_desde && fechaStr < h.fecha_desde) return false;
      if (h.fecha_hasta && fechaStr > h.fecha_hasta) return false;
      return true;
    });

    return horarios.some(h => {
      const startMin = toMinutes(h.hora_inicio);
      const endMin = toMinutes(h.hora_fin);
      return slotMin >= startMin && slotMin < endMin;
    });
  };

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

  const [showKpis, setShowKpis] = useState(false);
  const [showProximoLibreModal, setShowProximoLibreModal] = useState(false);

  // Buscador del turno más próximo disponible para el médico seleccionado
  const proximosSlotsLibres = useMemo(() => {
    if (!showProximoLibreModal) return [];
    const targetProf = selectedWeeklyProfId || visibleProfessionals[0]?.id;
    if (!targetProf) return [];
    
    const results = [];
    const baseDate = new Date();
    
    for (let i = 0; i < 14 && results.length < 6; i++) {
      const dStr = addDaysToDateString(getLocalDateString(baseDate), i);
      const slots = StorageService.getSlotsDisponibles(targetProf, dStr);
      for (const slot of slots) {
        if (results.length >= 6) break;
        const details = getDayDetailsFromDateString(dStr);
        results.push({
          fecha: dStr,
          diaNombre: details.diaNombre,
          diaNumero: details.diaNumero,
          mesNombre: details.mesNombre,
          hora: slot.hora_inicio,
          hora_fin: slot.hora_fin,
          consultorio_id: slot.consultorio_id,
          profesional_id: targetProf
        });
      }
    }
    return results;
  }, [showProximoLibreModal, selectedWeeklyProfId, visibleProfessionals]);

  const handleOpenNuevoTurno = (profId = null, hora = null, fecha = null, esSobreturno = false) => {
    setAgendarProfId(profId || selectedWeeklyProfId || selectedProfFilter || (visibleProfessionals[0]?.id) || null);
    setAgendarDefaultHora(hora);
    setAgendarFecha(fecha || currentDate);
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
    <div className="space-y-3">
      {/* BARRA DE COMANDOS ULTRA COMPACTA DE LA AGENDA (MÁXIMA PRESENCIA DE TURNOS) */}
      <div className="bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          
          {/* GRUPO IZQUIERDO: VISTAS & FECHA INLINE */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Selector de Vistas */}
            <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-xl border border-slate-200/60">
              {[
                { id: 'diaria', label: 'Diaria' },
                { id: 'timeline', label: 'Timeline Hoy' },
                { id: 'timeline_semanal', label: 'Timeline Semanal' },
                { id: 'futuros', label: 'Futuros' }
              ].map(m => (
                <button 
                  key={m.id} 
                  onClick={() => setViewMode(m.id)} 
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === m.id 
                      ? 'bg-white text-slate-900 shadow-2xs font-black' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Navegador de Fecha Inline */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
              {viewMode === 'timeline_semanal' || viewMode === 'semanal' ? (
                <>
                  <button onClick={handlePrevWeek} className="px-2 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition" title="Semana anterior">◄ Sem</button>
                  <button onClick={handleToday} className="px-2 py-1 text-xs font-black bg-white rounded-lg shadow-2xs">Esta Sem</button>
                  <button onClick={handleNextWeek} className="px-2 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition" title="Semana siguiente">Sem ►</button>
                </>
              ) : (
                <>
                  <button onClick={handlePrevDay} className="p-1 hover:bg-white text-slate-700 rounded-lg transition"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  <button onClick={handleToday} className="px-2 py-1 text-xs font-black bg-white rounded-lg shadow-2xs">Hoy</button>
                  <button onClick={handleNextDay} className="p-1 hover:bg-white text-slate-700 rounded-lg transition"><ChevronRight className="w-3.5 h-3.5" /></button>
                </>
              )}
            </div>

            <input 
              type="date" 
              value={currentDate} 
              onChange={(e) => setCurrentDate(e.target.value)} 
              className="px-2 py-1 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-medical-500 w-32" 
            />
          </div>

          {/* GRUPO CENTRO: MÉDICO, ESPECIALIDAD & RESOLUCIÓN */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Selector de Médico */}
            <select 
              value={selectedWeeklyProfId || selectedProfFilter} 
              onChange={(e) => {
                setSelectedProfFilter(e.target.value);
                setSelectedWeeklyProfId(e.target.value);
              }} 
              className="px-2.5 py-1 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-900 max-w-[200px] truncate"
            >
              <option value="">Todos los Profesionales</option>
              {profesionales.map(p => (
                <option key={p.id} value={p.id}>
                  Dr(a). {p.apellido} ({p.duracion_turno_minutos || 20}m)
                </option>
              ))}
            </select>

            {/* Filtro por Especialidad */}
            <select 
              value={selectedServicioFilter} 
              onChange={(e) => setSelectedServicioFilter(e.target.value)} 
              className="px-2.5 py-1 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 hidden sm:inline-block max-w-[140px] truncate"
            >
              <option value="">Especialidad</option>
              {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>

            {/* Selector de Intervalo / Paso */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200/60 text-xs font-bold">
              {[
                { id: 'auto', label: 'Auto' },
                { id: '15', label: '15m' },
                { id: '20', label: '20m' },
                { id: '30', label: '30m' },
                { id: '60', label: '1h' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setSlotResolution(r.id)}
                  className={`px-1.5 py-0.5 rounded-md text-[11px] transition cursor-pointer ${
                    slotResolution === r.id 
                      ? 'bg-white text-slate-900 shadow-2xs font-black' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Búsqueda Rápida de Pacientes */}
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar paciente / DNI..." 
                value={searchPatientQuery} 
                onChange={(e) => setSearchPatientQuery(e.target.value)} 
                className="pl-7 pr-2.5 py-1 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-medical-500 w-36 sm:w-44" 
              />
            </div>
          </div>

          {/* GRUPO DERECHO: ACCIONES DIRECTAS DE SECRETARÍA */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Paquete de Sesiones */}
            <button 
              onClick={() => setShowRecurrenteModal(true)} 
              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Agendar paquete de sesiones periódicas"
            >
              <Repeat className="w-3.5 h-3.5 text-purple-600" />
              <span>+ Sesiones</span>
            </button>

            {/* Botón Próximo Turno Libre */}
            <button 
              onClick={() => setShowProximoLibreModal(true)} 
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Buscar el turno libre más próximo del médico"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>⚡ Próximo Libre</span>
            </button>

            <button 
              onClick={() => handleOpenNuevoTurno()} 
              className="px-3.5 py-1 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Turno</span>
            </button>

            {/* Toggle de Métricas / KPIs */}
            <button 
              onClick={() => setShowKpis(!showKpis)} 
              className={`p-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                showKpis ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Mostrar u ocultar métricas de la agenda"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden md:inline">{kpisDia.total} citados</span>
            </button>

            <button 
              onClick={() => setShowConfigAgendaModal(true)} 
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition cursor-pointer" 
              title="Configurar Horarios del Médico"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* DRAWER COLAPSABLE DE MÉTRICAS (SOLO SE ABRE CUANDO EL USUARIO LO PIDE) */}
        {showKpis && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
            {[
              { id: 'ALL', l: 'Total Citados', v: kpisDia.total, bg: 'hover:bg-slate-100' },
              { id: 'EN_ESPERA', l: 'En Sala Espera', v: kpisDia.enEspera, bg: 'text-amber-900', dot: 'bg-amber-500' },
              { id: 'EN_ATENCION', l: 'En Consulta', v: kpisDia.enAtencion, bg: 'text-purple-900', dot: 'bg-purple-500' },
              { id: 'ATENDIDO', l: 'Atendidos', v: kpisDia.atendidos, bg: 'text-emerald-900', dot: 'bg-emerald-500' },
              { id: 'SOBRETURNOS', l: 'Sobreturnos', v: kpisDia.sobreturnos, bg: 'text-orange-900', dot: 'bg-orange-500' },
              { id: 'CANCELADOS', l: 'Cancelados / Aus', v: kpisDia.cancelados, bg: 'text-slate-600', dot: 'bg-slate-400' }
            ].map(k => (
              <button 
                key={k.id} 
                onClick={() => setActiveKpiFilter(activeKpiFilter === k.id ? 'ALL' : k.id)} 
                className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                  activeKpiFilter === k.id 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                    : 'bg-slate-50 border-slate-200/70 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] block uppercase font-black tracking-wider opacity-80">{k.l}</span>
                  {k.dot && <span className={`w-1.5 h-1.5 rounded-full ${k.dot}`} />}
                </div>
                <span className="text-base font-black">{k.v}</span>
              </button>
            ))}
          </div>
        )}
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
                        {prof.especialidad} • {prof.duracion_turno_minutos || 20}m
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenNuevoTurno(prof.id, null, currentDate)}
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
                        onClick={() => handleOpenNuevoTurno(prof.id, null, currentDate)}
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

      {/* 2. TIMELINE DIARIO (HORAS CON INTERVALO EXACTO vs DOCTORES EN COLUMNAS) */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6 overflow-x-auto space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-tealmed-600" />
                <span>Timeline Diario ({new Date(currentDate + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })})</span>
              </h3>
              <p className="text-xs text-slate-500">Grilla horaria exacta con paso de {effectiveIntervalMinutes} min. Las celdas verdes son turnos libres dentro del horario laboral del médico.</p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
              Intervalo: {effectiveIntervalMinutes} min
            </span>
          </div>

          <div className="min-w-[750px]">
            <div className="grid gap-2 border-b border-slate-200 pb-2" style={{ gridTemplateColumns: `80px repeat(${visibleProfessionals.length || 1}, minmax(180px, 1fr))` }}>
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider py-2 text-center">Hora</div>
              {visibleProfessionals.map(prof => (
                <div key={prof.id} className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-[10px]" style={{ backgroundColor: prof.color_agenda || '#0284c7' }}>
                    {prof.nombre[0]}{prof.apellido[0]}
                  </div>
                  <div className="truncate">
                    <span className="font-black text-xs text-slate-900 block truncate">Dr(a). {prof.apellido}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{prof.especialidad} • {prof.duracion_turno_minutos || 20}m</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="divide-y divide-slate-100">
              {timelineSlots.map(slotTime => (
                <div key={slotTime} className="grid gap-2 py-1 items-center" style={{ gridTemplateColumns: `80px repeat(${visibleProfessionals.length || 1}, minmax(180px, 1fr))` }}>
                  <div className="font-mono text-xs font-black text-slate-600 bg-slate-100/80 px-2 py-1 rounded-lg text-center">{slotTime}</div>
                  {visibleProfessionals.map(prof => {
                    // Buscar turnos exactamente en este slot
                    const turnosEnSlot = turnosDelDia.filter(t => 
                      t.profesional_id === prof.id && 
                      (t.hora_inicio === slotTime || (slotResolution === '60' && t.hora_inicio.startsWith(slotTime.slice(0, 2)))) &&
                      t.estado !== 'CANCELADO'
                    );

                    const isWorking = checkDoctorWorkingAt(prof.id, currentDate, slotTime);

                    if (turnosEnSlot.length === 0) {
                      if (!isWorking) {
                        return (
                          <div key={prof.id} className="p-1.5 rounded-lg bg-slate-50/50 border border-slate-100 text-center text-slate-300 text-[10px] select-none">
                            —
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={prof.id} 
                          onClick={() => handleOpenNuevoTurno(prof.id, slotTime, currentDate)} 
                          className="p-1.5 border border-dashed border-emerald-300/80 bg-emerald-50/30 rounded-xl text-center text-emerald-800 hover:text-emerald-950 hover:border-emerald-500 hover:bg-emerald-100/60 cursor-pointer transition text-xs font-bold group"
                          title={`Agendar turno libre a las ${slotTime} con Dr(a). ${prof.apellido}`}
                        >
                          <span className="group-hover:hidden text-[11px] text-emerald-700 font-semibold">+ Libre ({slotTime})</span>
                          <span className="hidden group-hover:inline-flex items-center gap-1 font-black text-emerald-900 text-xs"><Plus className="w-3 h-3" /> Agendar {slotTime}</span>
                        </div>
                      );
                    }

                    return (
                      <div key={prof.id} className="space-y-1">
                        {turnosEnSlot.map(t => {
                          const pac = pacientes.find(p => p.id === t.paciente_id);
                          const os = obrasSociales.find(o => o.id === t.obra_social_id);
                          const badge = getEstadoBadge(t.estado, t.confirmado_whatsapp);

                          return (
                            <div 
                              key={t.id} 
                              onClick={() => setSelectedDetalleTurno(t)} 
                              className={`p-1.5 rounded-xl border text-xs cursor-pointer transition shadow-2xs hover:shadow-md ${
                                t.estado === 'EN_ESPERA' ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300' :
                                t.estado === 'EN_ATENCION' ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-300' :
                                'bg-white border-slate-200 hover:border-medical-400'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono font-black text-slate-900 text-[11px]">{t.hora_inicio}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${badge.bg}`}>{badge.label}</span>
                              </div>
                              <div className="font-black text-slate-800 text-[11px] truncate mt-0.5">{pac ? `${pac.apellido}, ${pac.nombre}` : 'Paciente'}</div>
                              <span className="text-[10px] text-slate-500 truncate block">{os?.sigla || 'Particular'}</span>
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

      {/* 3. TIMELINE SEMANAL (POR PROFESIONAL CON SLOTS EXACTOS) */}
      {viewMode === 'timeline_semanal' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-3 sm:p-5 overflow-x-auto">
          <div className="min-w-[880px]">
            {/* Cabecera de Días de la Semana */}
            <div className="grid gap-2 border-b border-slate-200 pb-2.5" style={{ gridTemplateColumns: `80px repeat(6, minmax(130px, 1fr))` }}>
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider py-2 text-center">Hora</div>
              {semanaDays.map((diaStr) => {
                const dateObj = new Date(diaStr + 'T00:00:00');
                const isSelectedDay = diaStr === currentDate;
                const targetProfId = selectedWeeklyProfId || visibleProfessionals[0]?.id;
                const turnosDelDiaCount = turnos.filter(t => t.fecha === diaStr && (!targetProfId || t.profesional_id === targetProfId) && t.estado !== 'CANCELADO').length;

                const diaNum = dateObj.getDay();
                const horariosDia = StorageService.getHorariosByProfesional(targetProfId).filter(h => Number(h.dia_semana) === Number(diaNum));
                const tieneAtencion = horariosDia.length > 0;

                return (
                  <div 
                    key={diaStr} 
                    onClick={() => setCurrentDate(diaStr)}
                    className={`p-2.5 rounded-2xl border text-center transition cursor-pointer ${
                      isSelectedDay ? 'bg-medical-600 text-white border-medical-600 shadow-sm' : 'bg-slate-50 border-slate-200/80 hover:bg-white hover:border-medical-300'
                    }`}
                  >
                    <span className="text-[11px] block uppercase font-black tracking-wider">
                      {dateObj.toLocaleDateString('es-AR', { weekday: 'short' })}
                    </span>
                    <strong className="text-sm font-black block leading-none my-0.5">
                      {diaStr.split('-')[2]}
                    </strong>
                    
                    {/* Badge de Horario de Atención para este Día */}
                    <div className="mt-1">
                      {tieneAtencion ? (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${isSelectedDay ? 'bg-white/20 text-white' : 'bg-emerald-100/70 text-emerald-800'}`}>
                          {horariosDia[0].hora_inicio} - {horariosDia[0].hora_fin}
                        </span>
                      ) : (
                        <span className={`text-[9px] font-semibold ${isSelectedDay ? 'text-white/60' : 'text-slate-400'}`}>
                          Sin atención
                        </span>
                      )}
                    </div>

                    <span className={`text-[10px] font-bold block mt-0.5 ${isSelectedDay ? 'text-white/90' : 'text-slate-500'}`}>
                      {turnosDelDiaCount} {turnosDelDiaCount === 1 ? 'turno' : 'turnos'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Filas con Resolución Exacta (e.g. cada 15/20/30m) */}
            <div className="divide-y divide-slate-100">
              {timelineSlots.map(slotTime => {
                const targetProfId = selectedWeeklyProfId || visibleProfessionals[0]?.id;

                return (
                  <div key={slotTime} className="grid gap-2 py-1 items-center" style={{ gridTemplateColumns: `80px repeat(6, minmax(130px, 1fr))` }}>
                    <div className="font-mono text-xs font-black text-slate-600 bg-slate-100/80 px-2 py-1 rounded-lg text-center">{slotTime}</div>
                    {semanaDays.map(diaStr => {
                      // Buscar turnos exactamente en este slot para este médico
                      const turnosEnCelda = turnos.filter(t => 
                        t.fecha === diaStr && 
                        (t.hora_inicio === slotTime || (slotResolution === '60' && t.hora_inicio.startsWith(slotTime.slice(0, 2)))) && 
                        (!targetProfId || t.profesional_id === targetProfId) && 
                        t.estado !== 'CANCELADO'
                      );

                      const isWorking = checkDoctorWorkingAt(targetProfId, diaStr, slotTime);

                      if (turnosEnCelda.length === 0) {
                        if (!isWorking) {
                          return (
                            <div key={diaStr} className="p-1.5 rounded-lg bg-slate-50/40 border border-slate-100 text-center text-slate-300 text-[10px] select-none">
                              —
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={diaStr} 
                            onClick={() => handleOpenNuevoTurno(targetProfId, slotTime, diaStr)} 
                            className="p-1.5 border border-dashed border-emerald-300/80 bg-emerald-50/30 rounded-xl text-center text-emerald-800 hover:text-emerald-950 hover:border-emerald-500 hover:bg-emerald-100/60 cursor-pointer transition text-xs font-bold group"
                            title={`Agendar turno libre el ${diaStr} a las ${slotTime}`}
                          >
                            <span className="group-hover:hidden text-[10px] text-emerald-700 font-semibold">+ Libre</span>
                            <span className="hidden group-hover:inline-flex items-center gap-1 font-black text-emerald-900 text-[10px]"><Plus className="w-3 h-3" /> Agendar {slotTime}</span>
                          </div>
                        );
                      }

                      return (
                        <div key={diaStr} className="space-y-1">
                          {turnosEnCelda.map(t => {
                            const pac = pacientes.find(p => p.id === t.paciente_id);
                            const os = obrasSociales.find(o => o.id === t.obra_social_id);
                            const badge = getEstadoBadge(t.estado, t.confirmado_whatsapp);

                            return (
                              <div 
                                key={t.id} 
                                onClick={() => setSelectedDetalleTurno(t)} 
                                className={`p-1.5 rounded-xl border text-xs cursor-pointer transition shadow-2xs hover:shadow-md ${
                                  t.estado === 'EN_ESPERA' ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300' :
                                  t.estado === 'EN_ATENCION' ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-300' :
                                  'bg-white border-slate-200 hover:border-medical-400'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono font-black text-slate-900 text-[10px]">{t.hora_inicio}</span>
                                  <span className={`text-[8px] font-bold px-1 rounded ${badge.bg}`}>{badge.label}</span>
                                </div>
                                <div className="font-black text-slate-800 text-[10px] truncate mt-0.5">{pac ? `${pac.apellido}, ${pac.nombre}` : 'Paciente'}</div>
                                <span className="text-[9px] text-slate-500 truncate block">{os?.sigla || 'Part.'}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. VISTA RESUMEN SEMANAL */}
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

      {/* 5. VISTA TURNOS FUTUROS */}
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

      {/* MODAL DE PRÓXIMOS TURNOS LIBRES */}
      {showProximoLibreModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Turnos Libres Más Próximos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dr(a). {activeWeeklyProf?.nombre} {activeWeeklyProf?.apellido} ({activeWeeklyProf?.duracion_turno_minutos || 20} min)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowProximoLibreModal(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {proximosSlotsLibres.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  No hay turnos libres disponibles en los próximos 14 días para este médico.
                </div>
              ) : (
                proximosSlotsLibres.map((slot, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      handleOpenNuevoTurno(slot.profesional_id, slot.hora, slot.fecha);
                      setShowProximoLibreModal(false);
                    }}
                    className="p-3 bg-slate-50 hover:bg-medical-50/50 border border-slate-200 hover:border-medical-400 rounded-2xl transition flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-center shadow-2xs">
                        <span className="text-[10px] block font-black uppercase text-slate-500">{slot.diaNombre}</span>
                        <strong className="text-sm font-black text-slate-900">{slot.diaNumero}</strong>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-medical-800 bg-white px-2 py-0.5 rounded-lg border border-medical-200 shadow-2xs">
                            {slot.hora} hs
                          </span>
                          <span className="text-xs font-bold text-slate-700 capitalize">
                            {slot.mesNombre}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {slot.fecha} • {consultorios.find(c => c.id === slot.consultorio_id)?.nombre || 'Consultorio'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-black text-medical-700 group-hover:translate-x-1 transition">
                      <span>Agendar</span>
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowProximoLibreModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALES DEL SISTEMA */}
      <ConfigurarAgendaModal isOpen={showConfigAgendaModal} onClose={() => setShowConfigAgendaModal(false)} />
      <TurnoRecurrenteModal isOpen={showRecurrenteModal} onClose={() => setShowRecurrenteModal(false)} />
      <AgendarTurnoSecretariaModal 
        isOpen={showAgendarModal} 
        defaultFecha={agendarFecha || currentDate} 
        defaultProfId={agendarProfId} 
        defaultHora={agendarDefaultHora} 
        onClose={() => { 
          setShowAgendarModal(false); 
          setAgendarFecha(null); 
          setAgendarDefaultHora(null); 
        }} 
      />
      <ReprogramarTurnoModal isOpen={showReprogramarModal} turno={turnoToReprogram} onClose={() => setShowReprogramarModal(false)} />
      <CancelarTurnoModal isOpen={showCancelarModal} turno={turnoToCancel} canceladoPor="SECRETARIA" onClose={() => setShowCancelarModal(false)} />
      <DetalleTurnoModal 
        isOpen={!!selectedDetalleTurno} 
        turno={selectedDetalleTurno} 
        onClose={() => setSelectedDetalleTurno(null)} 
        onReprogramar={t => { setTurnoToReprogram(t); setShowReprogramarModal(true); }} 
        onCancelar={t => { setTurnoToCancel(t); setShowCancelarModal(true); }} 
        onVerVoucher={t => setSelectedTurnoForVoucher({ turno: t, paciente: pacientes.find(p => p.id === t.paciente_id), profesional: profesionales.find(p => p.id === t.profesional_id), consultorio: consultorios.find(c => c.id === t.consultorio_id), obraSocial: obrasSociales.find(o => o.id === t.obra_social_id), plan: planes.find(p => p.id === t.plan_id), practica: nomenclador.find(n => n.id === t.practica_id) })} 
      />
      {selectedTurnoForVoucher && (
        <VoucherModal 
          turno={selectedTurnoForVoucher.turno} 
          paciente={selectedTurnoForVoucher.paciente} 
          profesional={selectedTurnoForVoucher.profesional} 
          consultorio={selectedTurnoForVoucher.consultorio} 
          obraSocial={selectedTurnoForVoucher.obraSocial} 
          plan={selectedTurnoForVoucher.plan} 
          practica={selectedTurnoForVoucher.practica} 
          onClose={() => setSelectedTurnoForVoucher(null)} 
        />
      )}
    </div>
  );
};
