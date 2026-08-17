import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Calendar, 
  Clock, 
  DoorClosed, 
  Check, 
  X, 
  Sparkles, 
  User, 
  Layers, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Power,
  CalendarRange,
  Globe,
  Building,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { formatDateAR, getLocalDateString } from '../../utils/dateUtils';
import { ReprogramarAgendaModal } from './ReprogramarAgendaModal';

export const ConfigurarAgendaModal = ({ isOpen, onClose, defaultProfId = null }) => {
  const { 
    profesionales = [], 
    servicios = [], 
    consultorios = [], 
    agendas = [],
    saveAgenda,
    cerrarAgenda,
    deleteAgenda,
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'form'
  const [selectedProfId, setSelectedProfId] = useState(() => defaultProfId || profesionales[0]?.id || '');
  const [editingAgendaId, setEditingAgendaId] = useState(null);

  // Form State
  const [nombreAgenda, setNombreAgenda] = useState('Consultas Clínicas y Generales');
  const [servicioId, setServicioId] = useState('');
  const [fechaDesde, setFechaDesde] = useState(() => getLocalDateString(new Date()));
  const [fechaHasta, setFechaHasta] = useState('');
  const [sinFechaFin, setSinFechaFin] = useState(true);
  const [diasSeleccionados, setDiasSeleccionados] = useState([1, 2, 3, 4, 5]); // Lunes a Viernes
  const [duracionSlot, setDuracionSlot] = useState(45);
  const [consultorioId, setConsultorioId] = useState(() => consultorios[0]?.id || '');
  const [modalidad, setModalidad] = useState('PRESENCIAL');
  const [maxSobreturnos, setMaxSobreturnos] = useState(2);

  // Franjas horarias
  const [habilitarManana, setHabilitarManana] = useState(true);
  const [mananaInicio, setMananaInicio] = useState('08:00');
  const [mananaFin, setMananaFin] = useState('14:00');

  const [habilitarTarde, setHabilitarTarde] = useState(false);
  const [tardeInicio, setTardeInicio] = useState('15:00');
  const [tardeFin, setTardeFin] = useState('20:00');

  // Modal de advertencia de turnos futuros afectados
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [turnosAfectados, setTurnosAfectados] = useState([]);
  const [pendingSavePayload, setPendingSavePayload] = useState(null);

  // Sincronizar profesional seleccionado al cambiar defaultProfId
  useEffect(() => {
    if (defaultProfId) {
      setSelectedProfId(defaultProfId);
    }
  }, [defaultProfId, isOpen]);

  // Cargar datos de agenda si se va a editar
  const handleOpenEditAgenda = (agenda) => {
    setEditingAgendaId(agenda.id);
    setNombreAgenda(agenda.nombre || 'Agenda Médica');
    setSelectedProfId(agenda.profesional_id);
    setServicioId(agenda.servicio_id || '');
    setFechaDesde(agenda.fecha_desde || getLocalDateString(new Date()));
    setFechaHasta(agenda.fecha_hasta || '');
    setSinFechaFin(!agenda.fecha_hasta);
    setDuracionSlot(agenda.duracion_slot_min || 45);
    setConsultorioId(agenda.consultorio_id || consultorios[0]?.id || '');
    setModalidad(agenda.modalidad || 'PRESENCIAL');
    setMaxSobreturnos(agenda.max_sobreturnos_dia || 2);

    if (agenda.dias_horarios && agenda.dias_horarios.length > 0) {
      const dias = agenda.dias_horarios.map(dh => Number(dh.dia_semana));
      setDiasSeleccionados(dias);

      const primeraFranja = agenda.dias_horarios[0]?.franjas?.[0];
      const segundaFranja = agenda.dias_horarios[0]?.franjas?.[1];

      if (primeraFranja) {
        setHabilitarManana(true);
        setMananaInicio(primeraFranja.hora_inicio || '08:00');
        setMananaFin(primeraFranja.hora_fin || '14:00');
      }

      if (segundaFranja) {
        setHabilitarTarde(true);
        setTardeInicio(segundaFranja.hora_inicio || '15:00');
        setTardeFin(segundaFranja.hora_fin || '20:00');
      } else {
        setHabilitarTarde(false);
      }
    }

    setActiveTab('form');
  };

  const handleOpenNewAgenda = () => {
    setEditingAgendaId(null);
    setNombreAgenda('Consultas Generales');
    setServicioId('');
    setFechaDesde(getLocalDateString(new Date()));
    setFechaHasta('');
    setSinFechaFin(true);
    setDiasSeleccionados([1, 2, 3, 4, 5]);
    setDuracionSlot(45);
    setConsultorioId(consultorios[0]?.id || '');
    setModalidad('PRESENCIAL');
    setMaxSobreturnos(2);
    setHabilitarManana(true);
    setMananaInicio('08:00');
    setMananaFin('14:00');
    setHabilitarTarde(false);
    setActiveTab('form');
  };

  if (!isOpen) return null;

  const selectedProf = profesionales.find(p => p.id === selectedProfId);
  const agendasDelProf = agendas.filter(a => a.profesional_id === selectedProfId);

  // Servicios aplicables a este médico
  const serviciosDelMedico = servicios.filter(s => 
    (selectedProf?.servicios_ids && selectedProf.servicios_ids.includes(s.id)) ||
    s.especialidad_id === selectedProf?.especialidad_id ||
    s.nombre.toLowerCase().includes(selectedProf?.especialidad?.toLowerCase() || '')
  );

  const DIAS_CATALOGO = [
    { id: 1, label: 'Lun', full: 'Lunes' },
    { id: 2, label: 'Mar', full: 'Martes' },
    { id: 3, label: 'Mié', full: 'Miércoles' },
    { id: 4, label: 'Jue', full: 'Jueves' },
    { id: 5, label: 'Vie', full: 'Viernes' },
    { id: 6, label: 'Sáb', full: 'Sábado' }
  ];

  const toggleDia = (diaId) => {
    setDiasSeleccionados(prev => 
      prev.includes(diaId) ? prev.filter(d => d !== diaId) : [...prev, diaId]
    );
  };

  const selectLunesAViernes = () => {
    setDiasSeleccionados([1, 2, 3, 4, 5]);
  };

  const selectLunesASabado = () => {
    setDiasSeleccionados([1, 2, 3, 4, 5, 6]);
  };

  // Validar y procesar guardado de agenda
  const handleValidateAndSubmit = (e) => {
    e.preventDefault();
    if (!selectedProfId || diasSeleccionados.length === 0) {
      alert('Por favor seleccione al menos un día de atención de lunes a sábado.');
      return;
    }

    const franjas = [];
    if (habilitarManana && mananaInicio && mananaFin) {
      franjas.push({ hora_inicio: mananaInicio, hora_fin: mananaFin, modalidad });
    }
    if (habilitarTarde && tardeInicio && tardeFin) {
      franjas.push({ hora_inicio: tardeInicio, hora_fin: tardeFin, modalidad });
    }

    if (franjas.length === 0) {
      alert('Debe habilitar al menos una franja horaria (Mañana o Tarde).');
      return;
    }

    const diasNum = diasSeleccionados.map(Number).filter(d => d >= 1 && d <= 6);

    const payload = {
      id: editingAgendaId || undefined,
      profesional_id: selectedProfId,
      servicio_id: servicioId || null,
      consultorio_id: consultorioId,
      nombre: nombreAgenda || 'Agenda Médica',
      fecha_desde: fechaDesde || getLocalDateString(new Date()),
      fecha_hasta: sinFechaFin ? null : (fechaHasta || null),
      duracion_slot_min: Number(duracionSlot || 45),
      modalidad,
      max_sobreturnos_dia: Number(maxSobreturnos || 2),
      dias_horarios: diasNum.map(d => ({
        dia_semana: d,
        franjas: [...franjas]
      })),
      estado: 'ACTIVA'
    };

    // Auditar si existen turnos futuros que quedarían fuera de los días/fechas habilitadas
    const afectados = StorageService.getTurnosAfectadosPorAgenda(
      selectedProfId,
      diasNum,
      payload.fecha_desde,
      payload.fecha_hasta
    );

    if (afectados.length > 0) {
      setTurnosAfectados(afectados);
      setPendingSavePayload(payload);
      setShowWarningModal(true);
      return;
    }

    // Guardar inmediatamente si no hay afectados
    saveAgenda(payload);
    setActiveTab('list');
  };

  const handleConfirmSaveAfectados = () => {
    if (pendingSavePayload) {
      saveAgenda(pendingSavePayload);
      setPendingSavePayload(null);
      setActiveTab('list');
    }
  };

  // Cerrar agenda con confirmación
  const handleCerrarAgendaClick = (agenda) => {
    const afectados = StorageService.getTurnosAfectadosPorAgenda(
      agenda.profesional_id,
      [], // Al cerrar, ningún día queda habilitado para esa agenda
      agenda.fecha_desde,
      agenda.fecha_hasta
    );

    if (afectados.length > 0) {
      setTurnosAfectados(afectados);
      setPendingSavePayload({ action: 'CERRAR', agendaId: agenda.id });
      setShowWarningModal(true);
      return;
    }

    if (confirm(`¿Desea cerrar la agenda "${agenda.nombre}"?`)) {
      cerrarAgenda(agenda.id, 'Cierre solicitado por secretaría');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto animate-scaleIn">
          
          {/* Header del Configurador */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-medical-50 text-medical-600 rounded-2xl border border-medical-200 shadow-sm">
                <CalendarRange className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg sm:text-xl text-slate-900 leading-tight">
                  Gestor Profesional de Agendas Médicas
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Control de vigencias, días habilitados, modalidades y auditoría de turnos
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de Profesional y Pestañas */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Médico:</span>
              <select
                value={selectedProfId}
                onChange={(e) => {
                  setSelectedProfId(e.target.value);
                  setActiveTab('list');
                }}
                className="w-full sm:max-w-xs px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500 shadow-2xs"
              >
                {profesionales.map(p => (
                  <option key={p.id} value={p.id}>
                    Dr(a). {p.nombre} {p.apellido} ({p.especialidad})
                  </option>
                ))}
              </select>
            </div>

            {/* Pestañas de Vista */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 self-start sm:self-auto">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                  activeTab === 'list' 
                    ? 'bg-white text-medical-800 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Agendas Activas ({agendasDelProf.length})
              </button>
              <button
                onClick={handleOpenNewAgenda}
                className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1 cursor-pointer ${
                  activeTab === 'form' 
                    ? 'bg-white text-medical-800 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{editingAgendaId ? 'Editar Agenda' : 'Nueva Agenda'}</span>
              </button>
            </div>
          </div>

          {/* VISTA 1: LISTADO DE AGENDAS DEL PROFESIONAL */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              {agendasDelProf.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3">
                  <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Sin agendas activas configuradas</h4>
                    <p className="text-xs text-slate-500">Este profesional no tiene ninguna agenda configurada en el sistema.</p>
                  </div>
                  <button
                    onClick={handleOpenNewAgenda}
                    className="px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Primera Agenda para {selectedProf?.apellido}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5 max-h-96 overflow-y-auto pr-1">
                  {agendasDelProf.map(agenda => {
                    const consultorio = consultorios.find(c => c.id === agenda.consultorio_id);
                    const servicio = servicios.find(s => s.id === agenda.servicio_id);
                    const diasMap = { 1: 'LUN', 2: 'MAR', 3: 'MIÉ', 4: 'JUE', 5: 'VIE', 6: 'SÁB' };
                    const diasHabilitados = (agenda.dias_horarios || []).map(dh => diasMap[dh.dia_semana]).filter(Boolean);

                    return (
                      <div 
                        key={agenda.id} 
                        className={`p-4 rounded-2xl border transition space-y-3 ${
                          agenda.estado === 'ACTIVA' 
                            ? 'bg-slate-50/80 border-slate-200 hover:border-medical-300 shadow-2xs' 
                            : 'bg-slate-100/60 border-slate-200 opacity-75'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900">{agenda.nombre}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              agenda.estado === 'ACTIVA' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {agenda.estado}
                            </span>
                            <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md text-[10px] font-bold">
                              {agenda.modalidad === 'AMBAS' ? '🏢 Presencial & 💻 Online' : agenda.modalidad === 'ONLINE' ? '💻 Online' : '🏢 Presencial'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              onClick={() => handleOpenEditAgenda(agenda)}
                              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            {agenda.estado === 'ACTIVA' ? (
                              <button
                                onClick={() => handleCerrarAgendaClick(agenda)}
                                className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>Cerrar</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => deleteAgenda(agenda.id)}
                                className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Detalles de la Agenda */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                          <div>
                            <span className="text-[11px] text-slate-500 font-bold block">Vigencia:</span>
                            <span className="font-semibold text-slate-800">
                              {formatDateAR(agenda.fecha_desde)} al {agenda.fecha_hasta ? formatDateAR(agenda.fecha_hasta) : 'Indefinido'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] text-slate-500 font-bold block">Consultorio:</span>
                            <span className="font-semibold text-slate-800">
                              {consultorio?.nombre?.split('-')[0] || 'Consultorio 1'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] text-slate-500 font-bold block">Duración de Turno:</span>
                            <span className="font-semibold text-slate-800">
                              Cada {agenda.duracion_slot_min || 45} min
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] text-slate-500 font-bold block">Servicio Asociado:</span>
                            <span className="font-semibold text-slate-800">
                              {servicio?.nombre || 'General / Consultas'}
                            </span>
                          </div>
                        </div>

                        {/* Días y Horarios */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] text-slate-500 font-bold mr-1">Días Habilitados:</span>
                          {diasHabilitados.map(d => (
                            <span key={d} className="px-2 py-0.5 bg-medical-50 border border-medical-200 text-medical-800 rounded-md font-mono text-[11px] font-extrabold">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VISTA 2: FORMULARIO DE CREACIÓN / EDICIÓN */}
          {activeTab === 'form' && (
            <form onSubmit={handleValidateAndSubmit} className="space-y-4">
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-900 flex items-center justify-between">
                <span className="font-bold">
                  {editingAgendaId ? `Editando: ${nombreAgenda}` : `Creando nueva agenda para Dr(a). ${selectedProf?.apellido}`}
                </span>
                <span className="text-[11px] text-sky-700">Días estrictos de Lun a Sáb</span>
              </div>

              {/* 1. Nombre de Agenda y Servicio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Descriptivo de la Agenda *</label>
                  <input
                    type="text"
                    required
                    value={nombreAgenda}
                    onChange={(e) => setNombreAgenda(e.target.value)}
                    placeholder="Ej. Consultas Psicológicas Matutinas"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Servicio Médico Asociado</label>
                  <select
                    value={servicioId}
                    onChange={(e) => {
                      const sId = e.target.value;
                      setServicioId(sId);
                      const serv = servicios.find(s => s.id === sId);
                      if (serv?.duracion_default_min) {
                        setDuracionSlot(serv.duracion_default_min);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                  >
                    <option value="">Servicio General / Consultas</option>
                    {serviciosDelMedico.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} ({s.duracion_default_min} min)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Vigencia Desde / Hasta */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <label className="block text-xs font-extrabold text-slate-800">Período de Vigencia de la Agenda</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block mb-1">Fecha Desde:</span>
                    <input
                      type="date"
                      required
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block mb-1">Fecha Hasta:</span>
                    <input
                      type="date"
                      disabled={sinFechaFin}
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>

                  <div className="pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sinFechaFin}
                        onChange={(e) => {
                          setSinFechaFin(e.target.checked);
                          if (e.target.checked) setFechaHasta('');
                        }}
                        className="w-4 h-4 text-medical-600 rounded"
                      />
                      <span className="text-xs font-bold text-slate-700">Vigencia Indefinida / Sin Límite</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 3. Días de Atención Semanal */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Días Habilitados en esta Agenda *</label>
                  <div className="flex gap-2 text-xs">
                    <button type="button" onClick={selectLunesAViernes} className="text-medical-600 hover:underline font-bold">
                      Lun a Vie
                    </button>
                    <span className="text-slate-300">•</span>
                    <button type="button" onClick={selectLunesASabado} className="text-medical-600 hover:underline font-bold">
                      Lun a Sáb
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {DIAS_CATALOGO.map(dia => {
                    const isChecked = diasSeleccionados.includes(dia.id);
                    return (
                      <button
                        type="button"
                        key={dia.id}
                        onClick={() => toggleDia(dia.id)}
                        className={`py-2 px-1 rounded-xl text-xs font-black transition flex flex-col items-center justify-center border cursor-pointer ${
                          isChecked 
                            ? 'bg-medical-600 text-white border-medical-700 shadow-xs' 
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{dia.label}</span>
                        <span className="text-[9px] opacity-80">{isChecked ? '✓' : '—'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Franjas Horarias */}
              <div className="space-y-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="block text-xs font-bold text-slate-800">Franjas Horarias de Atención</label>
                
                {/* Franja Mañana */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                    <input
                      type="checkbox"
                      checked={habilitarManana}
                      onChange={(e) => setHabilitarManana(e.target.checked)}
                      className="w-4 h-4 text-medical-600 rounded"
                    />
                    <span>Turno Mañana</span>
                  </label>
                  {habilitarManana && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Desde:</span>
                        <input
                          type="time"
                          value={mananaInicio}
                          onChange={(e) => setMananaInicio(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Hasta:</span>
                        <input
                          type="time"
                          value={mananaFin}
                          onChange={(e) => setMananaFin(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Franja Tarde */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                    <input
                      type="checkbox"
                      checked={habilitarTarde}
                      onChange={(e) => setHabilitarTarde(e.target.checked)}
                      className="w-4 h-4 text-medical-600 rounded"
                    />
                    <span>Turno Tarde / Vespertino</span>
                  </label>
                  {habilitarTarde && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Desde:</span>
                        <input
                          type="time"
                          value={tardeInicio}
                          onChange={(e) => setTardeInicio(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Hasta:</span>
                        <input
                          type="time"
                          value={tardeFin}
                          onChange={(e) => setTardeFin(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Duración, Consultorio, Modalidad */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duración del Turno *</label>
                  <select
                    value={duracionSlot}
                    onChange={(e) => setDuracionSlot(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                  >
                    <option value={15}>Cada 15 minutos</option>
                    <option value={20}>Cada 20 minutos</option>
                    <option value={30}>Cada 30 minutos</option>
                    <option value={40}>Cada 40 minutos</option>
                    <option value={45}>Cada 45 minutos (Psicoterapia)</option>
                    <option value={50}>Cada 50 minutos</option>
                    <option value={60}>Cada 60 minutos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Consultorio Asignado</label>
                  <select
                    value={consultorioId}
                    onChange={(e) => setConsultorioId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                  >
                    {consultorios.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Modalidad de Atención</label>
                  <select
                    value={modalidad}
                    onChange={(e) => setModalidad(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                  >
                    <option value="PRESENCIAL">🏢 Solo Presencial</option>
                    <option value="ONLINE">💻 Solo Online (Videollamada)</option>
                    <option value="AMBAS">🌐 Ambas (Presencial y Online)</option>
                  </select>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-extrabold transition shadow-md shadow-sky-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{editingAgendaId ? 'Guardar Cambios de Agenda' : 'Publicar Nueva Agenda'}</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* Modal de Advertencia de Turnos Futuros Afectados */}
      {showWarningModal && (
        <ReprogramarAgendaModal
          isOpen={showWarningModal}
          onClose={() => {
            setShowWarningModal(false);
            setPendingSavePayload(null);
          }}
          profesional={selectedProf}
          turnosAfectados={turnosAfectados}
          onConfirmProceed={() => {
            setShowWarningModal(false);
            if (pendingSavePayload?.action === 'CERRAR') {
              cerrarAgenda(pendingSavePayload.agendaId, 'Cierre con turnos auditados');
            } else {
              handleConfirmSaveAfectados();
            }
          }}
        />
      )}
    </>
  );
};
