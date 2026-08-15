import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  UserPlus, 
  Clock, 
  User, 
  DoorClosed, 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  CalendarDays, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MoreVertical,
  ArrowRightLeft,
  Settings,
  MessageCircle,
  Repeat,
  Layers,
  FileText,
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ConfigurarAgendaModal } from './ConfigurarAgendaModal';
import { TurnoRecurrenteModal } from './TurnoRecurrenteModal';
import { AgendarTurnoSecretariaModal } from './AgendarTurnoSecretariaModal';
import { ReprogramarTurnoModal } from './ReprogramarTurnoModal';
import { CancelarTurnoModal } from './CancelarTurnoModal';
import { DetalleTurnoModal } from './DetalleTurnoModal';
import { VoucherModal } from '../patient/VoucherModal';
import { WhatsAppService } from '../../services/whatsapp';

export const AgendaView = () => {
  const { 
    turnos, 
    profesionales, 
    servicios, 
    consultorios, 
    pacientes, 
    obrasSociales, 
    planes, 
    nomenclador,
    allClinicas,
    activeClinica,
    updateTurnoEstado,
    reprogramarTurno,
    cancelarTurno,
    createTurno,
    confirmarTurnoPorPaciente
  } = useApp();

  // Modos de Vista: 'diaria' | 'semanal' | 'futuros'
  const [viewMode, setViewMode] = useState('diaria');
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedCentroFilter, setSelectedCentroFilter] = useState('TODOS');
  const [selectedProfFilter, setSelectedProfFilter] = useState('');
  const [selectedServicioFilter, setSelectedServicioFilter] = useState('');
  const [selectedConsFilter, setSelectedConsFilter] = useState('');
  const [searchPatientQuery, setSearchPatientQuery] = useState('');

  // Orden cronológico semanal ('asc': primero a último 08:00->20:00, 'desc': último a primero)
  const [sortOrderSemanal, setSortOrderSemanal] = useState('asc');

  // Filtro de rango de turnos futuros: '7d' | '15d' | '30d' | 'mes' | 'todos'
  const [futurosRango, setFuturosRango] = useState('30d');

  // Modales
  const [showConfigAgendaModal, setShowConfigAgendaModal] = useState(false);
  const [showRecurrenteModal, setShowRecurrenteModal] = useState(false);
  const [showAgendarModal, setShowAgendarModal] = useState(false);
  const [agendarProfId, setAgendarProfId] = useState(null);
  const [showReprogramarModal, setShowReprogramarModal] = useState(false);
  const [turnoToReprogram, setTurnoToReprogram] = useState(null);
  const [showCancelarModal, setShowCancelarModal] = useState(false);
  const [turnoToCancel, setTurnoToCancel] = useState(null);
  const [selectedTurnoForVoucher, setSelectedTurnoForVoucher] = useState(null);
  const [selectedDetalleTurno, setSelectedDetalleTurno] = useState(null);

  // Form states para nuevo turno / sobreturno
  const [quickForm, setQuickForm] = useState({
    profesional_id: '',
    servicio_id: '',
    practica_id: '',
    obra_social_id: '',
    plan_id: '',
    dni: '',
    nombre: '',
    apellido: '',
    telefono: '',
    hora_inicio: '10:00',
    es_sobreturno: false,
    observaciones: ''
  });

  // Reprogramar form
  const [reprogramDate, setReprogramDate] = useState(currentDate);
  const [reprogramSlot, setReprogramSlot] = useState(null);
  const [reprogramSlotsList, setReprogramSlotsList] = useState([]);

  // Navegación de fechas
  const handlePrevDay = () => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setCurrentDate(new Date().toISOString().split('T')[0]);
  };

  const visibleProfessionals = profesionales.filter(p => {
    if (selectedCentroFilter !== 'TODOS' && p.clinica_id && p.clinica_id !== selectedCentroFilter) return false;
    if (selectedProfFilter && p.id !== selectedProfFilter) return false;
    return p.activo !== false;
  });

  // Turnos del día seleccionado
  const turnosDelDia = turnos.filter(t => {
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
    return true;
  });

  // Turnos futuros filtrados
  const todayStr = new Date().toISOString().split('T')[0];
  const turnosFuturos = turnos.filter(t => {
    if (t.fecha < todayStr) return false; // Solo hoy o futuro
    if (selectedCentroFilter !== 'TODOS' && t.clinica_id && t.clinica_id !== selectedCentroFilter) return false;
    if (selectedProfFilter && t.profesional_id !== selectedProfFilter) return false;
    if (selectedServicioFilter && t.servicio_id !== selectedServicioFilter) return false;
    if (selectedConsFilter && t.consultorio_id !== selectedConsFilter) return false;

    // Filtro por rango
    if (futurosRango === '7d') {
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 7);
      if (t.fecha > maxDate.toISOString().split('T')[0]) return false;
    } else if (futurosRango === '15d') {
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 15);
      if (t.fecha > maxDate.toISOString().split('T')[0]) return false;
    } else if (futurosRango === '30d') {
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 30);
      if (t.fecha > maxDate.toISOString().split('T')[0]) return false;
    }

    if (searchPatientQuery.trim()) {
      const q = searchPatientQuery.toLowerCase();
      const pac = pacientes.find(p => p.id === t.paciente_id);
      const matchPac = pac && (`${pac.nombre} ${pac.apellido}`.toLowerCase().includes(q) || pac.dni.includes(q));
      const matchCod = t.codigo_reserva && t.codigo_reserva.toLowerCase().includes(q);
      if (!matchPac && !matchCod) return false;
    }
    return true;
  }).sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
    return a.hora_inicio.localeCompare(b.hora_inicio);
  });

  // Obtener fechas de la semana actual para la vista semanal
  const getSemanaDays = () => {
    const curr = new Date(currentDate + 'T00:00:00');
    const firstDay = curr.getDate() - curr.getDay() + 1; // Lunes
    const days = [];
    for (let i = 0; i < 6; i++) { // Lun a Sáb
      const next = new Date(curr);
      next.setDate(firstDay + i);
      days.push(next.toISOString().split('T')[0]);
    }
    return days;
  };

  const semanaDays = getSemanaDays();

  const handleOpenSobreturno = (profId = null) => {
    const targetProfId = profId || profesionales[0]?.id;
    const prof = profesionales.find(p => p.id === targetProfId);
    
    const sobreturnosHoy = turnos.filter(t => 
      t.profesional_id === targetProfId && 
      t.fecha === currentDate && 
      t.es_sobreturno && 
      t.estado !== 'CANCELADO'
    ).length;

    const maxPermitidos = prof?.max_sobreturnos_dia || 3;

    if (sobreturnosHoy >= maxPermitidos) {
      if (!confirm(`El Dr(a). ${prof?.apellido} ya alcanzó su límite de ${maxPermitidos} sobreturnos para hoy. ¿Desea forzar la carga de emergencia?`)) {
        return;
      }
    }

    setQuickForm({
      profesional_id: targetProfId,
      servicio_id: '',
      practica_id: nomenclador[0]?.id || '',
      obra_social_id: obrasSociales[0]?.id || '',
      plan_id: '',
      dni: '',
      nombre: '',
      apellido: '',
      telefono: '',
      hora_inicio: '12:00',
      es_sobreturno: true,
      observaciones: 'Sobreturno autorizado por secretaría'
    });
    setShowSobreturnoModal(true);
  };

  const handleQuickDniBlur = () => {
    if (!quickForm.dni.trim()) return;
    const existing = StorageService.findPacienteByDni(quickForm.dni);
    if (existing) {
      setQuickForm(prev => ({
        ...prev,
        nombre: existing.nombre || '',
        apellido: existing.apellido || '',
        telefono: existing.telefono_whatsapp || '',
        obra_social_id: existing.obra_social_id || prev.obra_social_id,
        plan_id: existing.plan_id || prev.plan_id
      }));
    }
  };

  const handleSaveTurnoManual = (e) => {
    e.preventDefault();
    if (!quickForm.dni || !quickForm.nombre || !quickForm.apellido || !quickForm.profesional_id) {
      alert('Por favor complete los datos obligatorios.');
      return;
    }

    const prof = profesionales.find(p => p.id === quickForm.profesional_id);
    const duracion = prof?.duracion_turno_minutos || 20;
    const [h, m] = quickForm.hora_inicio.split(':').map(Number);
    const endMinutes = h * 60 + m + duracion;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const hora_fin = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const horariosProf = StorageService.getHorariosByProfesional(quickForm.profesional_id);
    const dateObj = new Date(currentDate + 'T00:00:00');
    const horario = horariosProf.find(h => h.dia_semana === dateObj.getDay());
    const consultorioId = horario?.consultorio_id || consultorios[0]?.id;

    const result = createTurno({
      pacienteData: {
        dni: quickForm.dni,
        nombre: quickForm.nombre,
        apellido: quickForm.apellido,
        telefono_whatsapp: quickForm.telefono,
        obra_social_id: quickForm.obra_social_id,
        plan_id: quickForm.plan_id || null
      },
      turnoData: {
        profesional_id: quickForm.profesional_id,
        servicio_id: quickForm.servicio_id || null,
        consultorio_id: consultorioId,
        practica_id: quickForm.practica_id,
        obra_social_id: quickForm.obra_social_id,
        plan_id: quickForm.plan_id || null,
        fecha: currentDate,
        hora_inicio: quickForm.hora_inicio,
        hora_fin: hora_fin,
        es_sobreturno: quickForm.es_sobreturno,
        observaciones: quickForm.observaciones
      }
    });

    if (result?.error) {
      return;
    }

    setShowNuevoTurnoModal(false);
    setShowSobreturnoModal(false);
  };

  const handleOpenReprogramar = (turno) => {
    setTurnoToReprogram(turno);
    setReprogramDate(turno.fecha);
    const slots = StorageService.getSlotsDisponibles(turno.profesional_id, turno.fecha, turno.servicio_id);
    setReprogramSlotsList(slots);
    setReprogramSlot(null);
    setShowReprogramarModal(true);
  };

  const handleReprogramDateChange = (newDate) => {
    setReprogramDate(newDate);
    if (turnoToReprogram) {
      const slots = StorageService.getSlotsDisponibles(turnoToReprogram.profesional_id, newDate, turnoToReprogram.servicio_id);
      setReprogramSlotsList(slots);
      setReprogramSlot(null);
    }
  };

  const handleConfirmReprogram = (e) => {
    e.preventDefault();
    if (!turnoToReprogram || !reprogramSlot) return;

    reprogramarTurno(turnoToReprogram.id, reprogramDate, reprogramSlot);
    setShowReprogramarModal(false);
  };

  const getEstadoBadge = (estado, confirmadoWhatsApp) => {
    switch (estado) {
      case 'CONFIRMADO':
        return { label: 'Confirmado WhatsApp', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' };
      case 'PROGRAMADO':
        return { 
          label: confirmadoWhatsApp ? 'Confirmado' : 'Sin Confirmar', 
          bg: confirmadoWhatsApp ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-slate-100 text-slate-600 border-slate-200' 
        };
      case 'EN_ESPERA':
        return { label: 'En Sala de Espera', bg: 'bg-amber-100 text-amber-900 border-amber-300 font-black animate-pulse' };
      case 'EN_ATENCION':
        return { label: 'En Consultorio', bg: 'bg-purple-100 text-purple-900 border-purple-300 font-black' };
      case 'ATENDIDO':
        return { label: 'Atendido', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'NO_ASISTIO':
        return { label: 'No Asistió (Ausente)', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'CANCELADO':
        return { label: 'Cancelado', bg: 'bg-slate-200 text-slate-500 border-slate-300' };
      default:
        return { label: estado, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-5">
      {/* Barra de Encabezado Superior: Selector de Modo de Vista y Búsqueda */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tabs de Modo de Vista */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
            <button
              onClick={() => setViewMode('diaria')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                viewMode === 'diaria'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4 text-medical-600" />
              <span>Vista Diaria</span>
            </button>

            <button
              onClick={() => setViewMode('semanal')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                viewMode === 'semanal'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-medical-600" />
              <span>Vista Semanal</span>
            </button>

            <button
              onClick={() => setViewMode('futuros')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                viewMode === 'futuros'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Turnos Futuros ({turnosFuturos.length})</span>
            </button>
          </div>

          {/* Botones de Acción de Secretaría */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Paquete de Sesiones Recurrentes */}
            <button
              onClick={() => setShowRecurrenteModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-extrabold transition shadow-xs"
              title="Agendar paquete de sesiones para Kinesiología, Fisioterapia, Psicología..."
            >
              <Repeat className="w-4 h-4 text-purple-600" />
              <span>Paquete de Sesiones</span>
            </button>

            {/* Configurador de Agendas ⚙️ */}
            <button
              onClick={() => setShowConfigAgendaModal(true)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-200 shadow-xs"
              title="Configurar Agendas de Médicos (Tuerca ⚙️)"
            >
              <Settings className="w-4 h-4 text-slate-600" />
            </button>

            {/* Nuevo Turno (Asistente Ágil de Secretaría) */}
            <button
              onClick={() => {
                setAgendarProfId(selectedProfFilter || null);
                setShowAgendarModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-black shadow-md shadow-medical-600/20 transition transform hover:-translate-y-0.5"
              title="Abrir Asistente Ágil de Agendamiento para Secretaría"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Turno</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros & Buscador Global */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Navegador de Fecha (para vista Diaria y Semanal) */}
          {viewMode !== 'futuros' ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={handlePrevDay}
                  className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition"
                  title="Día anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-2.5 py-1 hover:bg-white rounded-lg text-xs font-bold text-slate-800 transition"
                >
                  Hoy
                </button>
                <button
                  onClick={handleNextDay}
                  className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition"
                  title="Día siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-medical-500 bg-slate-50"
              />
              <span className="text-[11px] font-extrabold text-medical-800 bg-medical-50 px-2.5 py-1.5 rounded-xl border border-medical-200 hidden md:inline-block">
                {new Date(currentDate + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>
          ) : (
            /* Filtro de Rango para Turnos Futuros */
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Ver turnos:
              </span>
              {[
                { id: '7d', label: 'Próximos 7 días' },
                { id: '15d', label: 'Próximos 15 días' },
                { id: '30d', label: 'Próximos 30 días' },
                { id: 'todos', label: 'Todos los futuros' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setFuturosRango(r.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    futurosRango === r.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {/* Selectores de Profesional, Servicio y Buscador por Paciente */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedProfFilter}
              onChange={(e) => setSelectedProfFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500 bg-slate-50"
            >
              <option value="">Todos los Profesionales ({profesionales.length})</option>
              {profesionales.map(p => (
                <option key={p.id} value={p.id}>Dr(a). {p.nombre} {p.apellido} ({p.especialidad})</option>
              ))}
            </select>

            <select
              value={selectedServicioFilter}
              onChange={(e) => setSelectedServicioFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500 bg-slate-50"
            >
              <option value="">Todos los Servicios ({servicios?.length || 0})</option>
              {servicios.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>

            {/* Buscador de Pacientes en Tiempo Real */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar paciente / DNI / Código..."
                value={searchPatientQuery}
                onChange={(e) => setSearchPatientQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* SELECTOR MULTI-CENTRO / VISTA CONSOLIDADA O POR SEDE */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              🏢 Sede / Centro:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCentroFilter('TODOS')}
              className={`px-3 py-1 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                selectedCentroFilter === 'TODOS'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>🌐 Todos los Centros (Consolidado)</span>
            </button>
            {allClinicas.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCentroFilter(c.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedCentroFilter === c.id
                    ? 'bg-medical-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>🏥 {c.nombre}</span>
              </button>
            ))}
          </div>

          <span className="text-[11px] font-bold text-slate-500">
            {selectedCentroFilter === 'TODOS' 
              ? `Mostrando turnos combinados de todas las sedes (${allClinicas.length})`
              : `Filtrando por: ${allClinicas.find(c => c.id === selectedCentroFilter)?.nombre || 'Sede activa'}`}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VISTA DIARIA (COLUMNAS MULTI-PROFESIONAL) */}
      {/* ========================================================================= */}
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
                className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col"
              >
                {/* Cabecera del Profesional */}
                <div 
                  className="p-4 border-b border-slate-100 flex items-center justify-between"
                  style={{ borderTop: `4px solid ${prof.color_agenda || '#0284c7'}` }}
                >
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-xs"
                      style={{ backgroundColor: prof.color_agenda || '#0284c7' }}
                    >
                      {prof.nombre[0]}{prof.apellido[0]}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs text-slate-900 leading-tight">
                        Dr(a). {prof.nombre} {prof.apellido}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                        {prof.especialidad}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenSobreturno(prof.id)}
                    className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-[10px] font-bold border border-amber-200 transition"
                    title="Otorgar sobreturno"
                  >
                    + Sobreturno
                  </button>
                </div>

                {/* Resumen del Día */}
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                  <span>{profTurnos.length} turnos citados</span>
                  {sobreturnosCount > 0 && (
                    <span className="text-amber-700 font-bold">
                      {sobreturnosCount} sobreturnos
                    </span>
                  )}
                </div>

                {/* Lista de Turnos */}
                <div className="p-3 space-y-2.5 max-h-[600px] overflow-y-auto bg-slate-50/40">
                  {profTurnos.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                      No hay turnos para esta fecha.
                      <button
                        onClick={() => handleOpenSobreturno(prof.id)}
                        className="block mx-auto mt-2 text-medical-600 font-bold hover:underline"
                      >
                        + Otorgar sobreturno
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
                      const isCancelled = t.estado === 'CANCELADO';

                      return (
                        <div 
                          key={t.id}
                          className={`p-3.5 rounded-2xl border transition shadow-xs space-y-2 ${
                            isCancelled 
                              ? 'bg-slate-100/70 border-slate-200 opacity-60' 
                              : t.estado === 'EN_ESPERA'
                              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30'
                              : t.estado === 'EN_ATENCION'
                              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-400/30'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {/* Horario & Estado */}
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                                {t.hora_inicio}
                              </span>
                              {t.es_sobreturno && (
                                <span className="text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-200 px-1 py-0.5 rounded">
                                  SOBRETURNO
                                </span>
                              )}
                              {t.nro_sesion && (
                                <span className="text-[9px] font-black bg-purple-100 text-purple-800 px-1 py-0.5 rounded">
                                  S{t.nro_sesion}/{t.total_sesiones}
                                </span>
                              )}
                            </div>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </div>

                          {/* Paciente y Cobertura */}
                          <div>
                            <h4 className="font-extrabold text-xs text-slate-900 truncate">
                              {pac ? `${pac.apellido}, ${pac.nombre}` : 'Paciente'}
                            </h4>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate mt-0.5">
                              <ShieldCheck className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span>{os?.sigla || os?.nombre || 'Particular'} {plan ? `(${plan.nombre_plan})` : ''}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              {serv && (
                                <span className="inline-block text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                                  {serv.nombre}
                                </span>
                              )}
                              {selectedCentroFilter === 'TODOS' && t.clinica_id && (
                                <span className="inline-block text-[9px] font-black text-sky-800 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
                                  🏥 {allClinicas?.find(c => c.id === t.clinica_id)?.nombre?.replace('Centro Médico ', '') || 'Sede'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* WhatsApp Reminder status & Práctica */}
                          <div className="text-[11px] text-slate-600 border-t border-slate-100 pt-1.5 flex justify-between items-center">
                            <span className="truncate max-w-[130px]" title={practica?.descripcion}>
                              {practica?.descripcion || 'Consulta'}
                            </span>
                            {!isCancelled && !t.confirmado_whatsapp && (
                              <button
                                onClick={() => confirmarTurnoPorPaciente(t.id)}
                                className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                                title="Marcar confirmación de WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                Confirmar
                              </button>
                            )}
                          </div>

                          {/* Botones de acción rápida */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 text-[11px]">
                            <button
                              onClick={() => setSelectedTurnoForVoucher({ turno: t, paciente: pac, profesional: prof, consultorio: consultorios.find(c => c.id === t.consultorio_id), obraSocial: os, plan, practica })}
                              className="text-slate-500 hover:text-medical-600 font-bold"
                            >
                              Comprobante
                            </button>

                            <div className="flex gap-2">
                              {!isCancelled && (
                                <>
                                  <button
                                    onClick={() => {
                                      setTurnoToReprogram(t);
                                      setShowReprogramarModal(true);
                                    }}
                                    className="text-sky-700 hover:underline font-bold"
                                    title="Reprogramar fecha/hora/médico"
                                  >
                                    Reprogramar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setTurnoToCancel(t);
                                      setShowCancelarModal(true);
                                    }}
                                    className="text-rose-600 hover:underline font-bold"
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

      {/* ========================================================================= */}
      {/* 2. VISTA SEMANAL (GRILLA LUNES A SÁBADO CON ORDEN CRONOLÓGICO Y GESTIÓN) */}
      {/* ========================================================================= */}
      {viewMode === 'semanal' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <span>Cronograma Semanal ({new Date(semanaDays[0] + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} al {new Date(semanaDays[5] + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Haga clic en un turno para modificar datos, reprogramar o cancelar. Haga clic en la tarjeta para ver el día completo.
              </p>
            </div>

            {/* BOTÓN DEFINIR ORDEN PRIMERO AL ÚLTIMO / ÚLTIMO AL PRIMERO */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSortOrderSemanal(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Cambiar orden de los turnos en las columnas"
              >
                <Clock className="w-3.5 h-3.5 text-medical-600" />
                <span>Orden: {sortOrderSemanal === 'asc' ? '08:00 ➔ 20:00 (Primero al Último)' : '20:00 ➔ 08:00 (Último al Primero)'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {semanaDays.map((diaStr) => {
              const diaTurnos = turnos.filter(t => {
                if (t.fecha !== diaStr) return false;
                if (selectedProfFilter && t.profesional_id !== selectedProfFilter) return false;
                if (t.estado === 'CANCELADO') return false;
                return true;
              }).sort((a, b) => {
                return sortOrderSemanal === 'asc'
                  ? a.hora_inicio.localeCompare(b.hora_inicio)
                  : b.hora_inicio.localeCompare(a.hora_inicio);
              });

              const isCurrentSelected = diaStr === currentDate;
              const dateObj = new Date(diaStr + 'T00:00:00');

              return (
                <div 
                  key={diaStr}
                  onClick={() => {
                    setCurrentDate(diaStr);
                    setViewMode('diaria');
                  }}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-3 ${
                    isCurrentSelected 
                      ? 'border-medical-600 bg-medical-50/40 shadow-sm' 
                      : 'border-slate-200 hover:border-medical-300 bg-slate-50/50 hover:bg-white'
                  }`}
                >
                  <div>
                    {/* Header Día */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-xs text-slate-800 uppercase tracking-wider">
                        {dateObj.toLocaleDateString('es-AR', { weekday: 'short' })}
                      </span>
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-md border ${
                        isCurrentSelected ? 'bg-medical-600 text-white border-medical-600' : 'bg-white text-slate-900 border-slate-200'
                      }`}>
                        {diaStr.split('-')[2]}
                      </span>
                    </div>

                    <span className="text-xs font-black text-medical-800 block mb-2">
                      {diaTurnos.length} {diaTurnos.length === 1 ? 'turno' : 'turnos'}
                    </span>

                    {/* LISTADO DE TURNOS ORDENADOS Y CLICKEABLES */}
                    <div className="space-y-1.5 min-h-[140px]">
                      {diaTurnos.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-[11px] italic">
                          Sin turnos
                        </div>
                      ) : (
                        diaTurnos.map(t => {
                          const pac = pacientes.find(p => p.id === t.paciente_id);
                          const os = obrasSociales.find(o => o.id === t.obra_social_id);
                          const isEnEspera = t.estado === 'EN_ESPERA';
                          const isEnAtencion = t.estado === 'EN_ATENCION';
                          const isAtendido = t.estado === 'ATENDIDO';
                          
                          return (
                            <div 
                              key={t.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDetalleTurno(t);
                              }}
                              className="p-2 bg-white border border-slate-200 hover:border-medical-500 hover:shadow-md rounded-xl text-xs transition cursor-pointer group"
                              title="Haga clic para ver detalles, editar o reprogramar este turno"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    isEnAtencion ? 'bg-purple-600 animate-ping' :
                                    isEnEspera ? 'bg-amber-500' :
                                    isAtendido ? 'bg-slate-400' : 'bg-emerald-500'
                                  }`} />
                                  <strong className="font-mono font-black text-slate-900 text-[11px]">
                                    {t.hora_inicio}
                                  </strong>
                                </div>
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 truncate max-w-[65px]">
                                  {os ? os.nombre : 'Particular'}
                                </span>
                              </div>
                              <div className="font-bold text-slate-800 text-[11px] truncate mt-0.5 group-hover:text-medical-700">
                                {pac ? `${pac.apellido}, ${pac.nombre}` : 'Paciente'}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] font-bold text-medical-600 text-center pt-2 border-t border-slate-200/80 hover:underline">
                    Ver agenda del día ➔
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VISTA DE TURNOS FUTUROS (TABLA INTERACTIVA) */}
      {/* ========================================================================= */}
      {viewMode === 'futuros' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900">Listado de Turnos Futuros Agendados</h3>
              <p className="text-xs text-slate-500">Visualiza todas las reservas futuras de la clínica o de un profesional específico</p>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-900 rounded-xl text-xs font-black">
              {turnosFuturos.length} turnos programados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3">Fecha & Hora</th>
                  <th className="py-3 px-3">Paciente</th>
                  <th className="py-3 px-3">Profesional & Especialidad</th>
                  <th className="py-3 px-3">Servicio / Práctica</th>
                  <th className="py-3 px-3">Cobertura</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {turnosFuturos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      No hay turnos futuros que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  turnosFuturos.map((t) => {
                    const pac = pacientes.find(p => p.id === t.paciente_id);
                    const prof = profesionales.find(p => p.id === t.profesional_id);
                    const serv = servicios.find(s => s.id === t.servicio_id);
                    const os = obrasSociales.find(o => o.id === t.obra_social_id);
                    const plan = planes.find(p => p.id === t.plan_id);
                    const practica = nomenclador.find(p => p.id === t.practica_id);
                    const badge = getEstadoBadge(t.estado, t.confirmado_whatsapp);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {t.codigo_reserva}
                          {t.nro_sesion && (
                            <span className="block text-[9px] text-purple-700 font-black">
                              Sesión {t.nro_sesion}/{t.total_sesiones}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {t.fecha} • <span className="text-medical-700 font-black">{t.hora_inicio} hs</span>
                        </td>
                        <td className="py-3 px-3">
                          <strong className="text-slate-900">{pac ? `${pac.apellido}, ${pac.nombre}` : 'Paciente'}</strong>
                          <span className="block text-[11px] text-slate-500">DNI {pac?.dni}</span>
                        </td>
                        <td className="py-3 px-3">
                          <strong className="text-slate-900">Dr(a). {prof?.nombre} {prof?.apellido}</strong>
                          <span className="block text-[11px] text-medical-700 font-bold">{prof?.especialidad}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span>{practica?.descripcion || 'Consulta'}</span>
                          {serv && (
                            <span className="block text-[10px] text-purple-700 font-bold">{serv.nombre}</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span>{os?.nombre || 'Particular'}</span>
                          {plan && <span className="block text-[11px] text-slate-500">Plan {plan.nombre_plan}</span>}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedTurnoForVoucher({ turno: t, paciente: pac, profesional: prof, consultorio: consultorios.find(c => c.id === t.consultorio_id), obraSocial: os, plan, practica })}
                              className="p-1.5 text-slate-500 hover:text-medical-600 hover:bg-slate-100 rounded-lg"
                              title="Ver Comprobante"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setTurnoToReprogram(t);
                                setShowReprogramarModal(true);
                              }}
                              className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition"
                              title="Reprogramar Turno"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setTurnoToCancel(t);
                                setShowCancelarModal(true);
                              }}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                              title="Cancelar Turno"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* ========================================================================= */}
      {/* MODALES: CONFIGURAR AGENDAS, PAQUETE SESIONES, NUEVO TURNO, REPROGRAMAR, CANCELAR */}
      {/* ========================================================================= */}
      <ConfigurarAgendaModal
        isOpen={showConfigAgendaModal}
        onClose={() => setShowConfigAgendaModal(false)}
      />

      <TurnoRecurrenteModal
        isOpen={showRecurrenteModal}
        onClose={() => setShowRecurrenteModal(false)}
      />

      {/* ASISTENTE ÁGIL DE AGENDAMIENTO PARA SECRETARÍA */}
      <AgendarTurnoSecretariaModal
        isOpen={showAgendarModal}
        defaultFecha={currentDate}
        defaultProfId={agendarProfId}
        onClose={() => setShowAgendarModal(false)}
      />

      {/* MODAL AVANZADO DE REPROGRAMACIÓN (Mismo u Otro Médico, Disponibilidad Real & WhatsApp) */}
      <ReprogramarTurnoModal
        isOpen={showReprogramarModal}
        turno={turnoToReprogram}
        onClose={() => setShowReprogramarModal(false)}
      />

      {/* MODAL DE CANCELACIÓN (Motivo Obligatorio & WhatsApp) */}
      <CancelarTurnoModal
        isOpen={showCancelarModal}
        turno={turnoToCancel}
        canceladoPor="SECRETARIA"
        onClose={() => setShowCancelarModal(false)}
      />

      {/* MODAL DE GESTIÓN Y EDICIÓN RÁPIDA DE TURNO (Al hacer clic en un paciente/renglón) */}
      <DetalleTurnoModal
        isOpen={!!selectedDetalleTurno}
        turno={selectedDetalleTurno}
        onClose={() => setSelectedDetalleTurno(null)}
        onReprogramar={(t) => {
          setTurnoToReprogram(t);
          setShowReprogramarModal(true);
        }}
        onCancelar={(t) => {
          setTurnoToCancel(t);
          setShowCancelarModal(true);
        }}
        onVerVoucher={(t) => {
          const pac = pacientes.find(p => p.id === t.paciente_id);
          const prof = profesionales.find(p => p.id === t.profesional_id);
          const cons = consultorios.find(c => c.id === t.consultorio_id);
          const os = obrasSociales.find(o => o.id === t.obra_social_id);
          const plan = planes.find(p => p.id === t.plan_id);
          const practica = nomenclador.find(n => n.id === t.practica_id);
          setSelectedTurnoForVoucher({
            turno: t,
            paciente: pac,
            profesional: prof,
            consultorio: cons,
            obraSocial: os,
            plan: plan,
            practica: practica
          });
        }}
      />

      {/* Voucher Modal */}
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
