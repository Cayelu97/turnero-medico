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
  ShieldAlert,
  ArrowRight,
  SunMedium,
  Moon,
  CalendarCheck
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
  const agendasDelProf = StorageService.getAgendas(null, selectedProfId);

  // Servicios aplicables a este médico
  const serviciosDelMedico = servicios.filter(s => 
    (selectedProf?.servicios_ids && selectedProf.servicios_ids.includes(s.id)) ||
    s.especialidad_id === selectedProf?.especialidad_id ||
    s.nombre.toLowerCase().includes(selectedProf?.especialidad?.toLowerCase() || '')
  );

  const DIAS_CATALOGO = [
    { id: 1, label: 'Lunes', corto: 'LUN' },
    { id: 2, label: 'Martes', corto: 'MAR' },
    { id: 3, label: 'Miércoles', corto: 'MIÉ' },
    { id: 4, label: 'Jueves', corto: 'JUE' },
    { id: 5, label: 'Viernes', corto: 'VIE' },
    { id: 6, label: 'Sábado', corto: 'SÁB' }
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

  // Cálculo estimativo de turnos por día
  const calcularSlotsPorDia = () => {
    let minutosTotal = 0;
    if (habilitarManana && mananaInicio && mananaFin) {
      const [h1, m1] = mananaInicio.split(':').map(Number);
      const [h2, m2] = mananaFin.split(':').map(Number);
      minutosTotal += Math.max(0, (h2 * 60 + m2) - (h1 * 60 + m1));
    }
    if (habilitarTarde && tardeInicio && tardeFin) {
      const [h1, m1] = tardeInicio.split(':').map(Number);
      const [h2, m2] = tardeFin.split(':').map(Number);
      minutosTotal += Math.max(0, (h2 * 60 + m2) - (h1 * 60 + m1));
    }
    return Math.floor(minutosTotal / (Number(duracionSlot) || 45));
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
      [], // Al cerrar, ningún día queda habilitado
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs overflow-hidden animate-fadeIn">
        <div className="bg-white rounded-3xl w-full max-w-5xl xl:max-w-6xl max-h-[92vh] shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-scaleIn my-auto">
          
          {/* HEADER STICKY */}
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-medical-500 text-white rounded-2xl shadow-md shadow-sky-600/20">
                <CalendarRange className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg sm:text-xl text-slate-900 leading-tight">
                  Gestor Profesional de Agendas Médicas
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Control de vigencias, días habilitados, modalidades y auditoría de turnos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Pestañas de Vista */}
              <div className="flex items-center bg-slate-200/70 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                    activeTab === 'list' 
                      ? 'bg-white text-medical-800 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Agendas Activas ({agendasDelProf.length})
                </button>
                <button
                  type="button"
                  onClick={handleOpenNewAgenda}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer ${
                    activeTab === 'form' 
                      ? 'bg-white text-medical-800 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingAgendaId ? 'Editar Agenda' : 'Nueva Agenda'}</span>
                </button>
              </div>

              <button 
                onClick={onClose} 
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* BARRA DE FILTRO POR PROFESIONAL */}
          <div className="px-6 py-3 bg-slate-100/60 border-b border-slate-100 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2.5 flex-1 max-w-md">
              <span className="text-xs font-extrabold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-medical-600" />
                Médico Profesional:
              </span>
              <select
                value={selectedProfId}
                onChange={(e) => {
                  setSelectedProfId(e.target.value);
                  setActiveTab('list');
                }}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-black bg-white focus:ring-2 focus:ring-medical-500 shadow-2xs"
              >
                {profesionales.map(p => (
                  <option key={p.id} value={p.id}>
                    Dr(a). {p.nombre} {p.apellido} ({p.especialidad})
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>Especialidad: <span className="text-slate-800 font-extrabold">{selectedProf?.especialidad}</span></span>
              <span>•</span>
              <span>Modalidad: <span className="text-slate-800 font-extrabold">{selectedProf?.atiende_online ? 'Presencial y Online' : 'Solo Presencial'}</span></span>
            </div>
          </div>

          {/* CONTENIDO DEL MODAL SCROLLABLE */}
          <div className="p-6 overflow-y-auto flex-1 bg-white">
            
            {/* VISTA 1: LISTADO DE AGENDAS */}
            {activeTab === 'list' && (
              <div className="space-y-4">
                {agendasDelProf.length === 0 ? (
                  <div className="py-12 px-6 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl space-y-4">
                    <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                      <CalendarCheck className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 max-w-md mx-auto">
                      <h4 className="font-black text-base text-slate-900">Sin agendas registradas para {selectedProf?.apellido}</h4>
                      <p className="text-xs text-slate-500">
                        Crea la primera agenda para definir los días de atención, franjas horarias y duración de turnos.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenNewAgenda}
                      className="px-6 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-black transition shadow-md shadow-sky-600/20 inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Crear Primera Agenda</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {agendasDelProf.map(agenda => {
                      const consultorio = consultorios.find(c => c.id === agenda.consultorio_id);
                      const servicio = servicios.find(s => s.id === agenda.servicio_id);
                      const diasMap = { 1: 'LUN', 2: 'MAR', 3: 'MIÉ', 4: 'JUE', 5: 'VIE', 6: 'SÁB' };
                      const diasHabilitados = (agenda.dias_horarios || []).map(dh => diasMap[dh.dia_semana]).filter(Boolean);

                      return (
                        <div 
                          key={agenda.id} 
                          className={`p-5 rounded-3xl border transition flex flex-col justify-between space-y-4 ${
                            agenda.estado === 'ACTIVA' 
                              ? 'bg-gradient-to-br from-white to-slate-50 border-slate-200/90 shadow-sm hover:shadow-md hover:border-medical-400' 
                              : 'bg-slate-100/60 border-slate-200 opacity-75'
                          }`}
                        >
                          {/* Header de Tarjeta */}
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-black text-sm text-slate-900 leading-snug">{agenda.nombre}</h4>
                                <span className="text-[11px] text-slate-500 font-bold block">
                                  {servicio?.nombre || 'General / Consultas'}
                                </span>
                              </div>
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                agenda.estado === 'ACTIVA' 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {agenda.estado}
                              </span>
                            </div>

                            {/* Tags de Modalidad y Consultorio */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md text-[10px] font-bold">
                                {agenda.modalidad === 'AMBAS' ? '🏢 Presencial y Online' : agenda.modalidad === 'ONLINE' ? '💻 Solo Online' : '🏢 Solo Presencial'}
                              </span>
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md text-[10px] font-bold">
                                ⏱️ {agenda.duracion_slot_min || 45} min / turno
                              </span>
                              {consultorio && (
                                <span className="px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded-md text-[10px] font-bold">
                                  🚪 {consultorio.nombre.split('-')[0]}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Días y Horarios */}
                          <div className="p-3 bg-white border border-slate-200/70 rounded-2xl space-y-2 text-xs">
                            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
                              <span>Vigencia:</span>
                              <span className="text-slate-800">
                                {formatDateAR(agenda.fecha_desde)} al {agenda.fecha_hasta ? formatDateAR(agenda.fecha_hasta) : 'Indefinido'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1 pt-1">
                              {diasHabilitados.map(d => (
                                <span key={d} className="px-2 py-0.5 bg-medical-50 border border-medical-200 text-medical-800 rounded-md font-mono text-[11px] font-black">
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Botones de Acción */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAgenda(agenda)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 text-medical-600" />
                              <span>Editar</span>
                            </button>
                            {agenda.estado === 'ACTIVA' ? (
                              <button
                                type="button"
                                onClick={() => handleCerrarAgendaClick(agenda)}
                                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>Cerrar Agenda</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => deleteAgenda(agenda.id)}
                                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VISTA 2: FORMULARIO WIDE EN 2 COLUMNAS */}
            {activeTab === 'form' && (
              <form id="form-agenda" onSubmit={handleValidateAndSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* COLUMNA IZQUIERDA (6 Cols): Parámetros Generales y Vigencia */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                      <span className="w-5 h-5 rounded-full bg-medical-600 text-white flex items-center justify-center text-[10px]">1</span>
                      <span>Configuración General de la Agenda</span>
                    </div>

                    {/* Nombre y Servicio */}
                    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-3xl">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Descriptivo *</label>
                        <input
                          type="text"
                          required
                          value={nombreAgenda}
                          onChange={(e) => setNombreAgenda(e.target.value)}
                          placeholder="Ej. Consultas Clínicas Matutinas"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-black focus:ring-2 focus:ring-medical-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Servicio / Tipo de Turnero</label>
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
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-black bg-white focus:ring-2 focus:ring-medical-500"
                        >
                          <option value="">Servicio General / Consultas Médicas</option>
                          {serviciosDelMedico.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.nombre} ({s.duracion_default_min} min)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Período de Vigencia */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
                      <label className="block text-xs font-black text-slate-800">Período de Vigencia</label>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[11px] text-slate-500 font-bold block mb-1">Fecha Desde:</span>
                          <input
                            type="date"
                            required
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-black bg-white"
                          />
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-500 font-bold block mb-1">Fecha Hasta:</span>
                          <input
                            type="date"
                            disabled={sinFechaFin}
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-black bg-white disabled:bg-slate-200 disabled:text-slate-400"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={sinFechaFin}
                          onChange={(e) => {
                            setSinFechaFin(e.target.checked);
                            if (e.target.checked) setFechaHasta('');
                          }}
                          className="w-4 h-4 text-medical-600 rounded"
                        />
                        <span className="text-xs font-bold text-slate-700">Vigencia Indefinida / Sin fecha de vencimiento</span>
                      </label>
                    </div>

                    {/* Consultorio, Modalidad y Duración */}
                    <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-3xl">
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
                          <option value={45}>Cada 45 minutos (Terapia / HC)</option>
                          <option value={50}>Cada 50 minutos</option>
                          <option value={60}>Cada 60 minutos</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Sobreturnos Permitidos</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={maxSobreturnos}
                          onChange={(e) => setMaxSobreturnos(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* COLUMNA DERECHA (6 Cols): Días Habilitados y Franjas Horarias */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                      <span className="w-5 h-5 rounded-full bg-medical-600 text-white flex items-center justify-center text-[10px]">2</span>
                      <span>Días y Franjas Horarias de Atención</span>
                    </div>

                    {/* Selector de Días Semanales */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-800">Días Habilitados en la Agenda *</label>
                        <div className="flex items-center gap-2 text-xs font-black">
                          <button type="button" onClick={selectLunesAViernes} className="text-medical-600 hover:underline cursor-pointer">
                            Lun a Vie
                          </button>
                          <span className="text-slate-300">•</span>
                          <button type="button" onClick={selectLunesASabado} className="text-medical-600 hover:underline cursor-pointer">
                            Lun a Sáb
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {DIAS_CATALOGO.map(dia => {
                          const isChecked = diasSeleccionados.includes(dia.id);
                          return (
                            <button
                              type="button"
                              key={dia.id}
                              onClick={() => toggleDia(dia.id)}
                              className={`py-3 px-2 rounded-2xl text-xs font-black transition flex flex-col items-center justify-center border cursor-pointer ${
                                isChecked 
                                  ? 'bg-medical-600 text-white border-medical-700 shadow-sm scale-102' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span className="text-[11px] uppercase tracking-wider">{dia.corto}</span>
                              <span className="text-[10px] opacity-80">{isChecked ? '✓ Activo' : '—'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Franjas Horarias Mañana / Tarde */}
                    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-3xl">
                      <label className="block text-xs font-black text-slate-800">Horarios de Atención</label>
                      
                      {/* Franja Mañana */}
                      <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer font-black text-xs text-slate-900">
                            <input
                              type="checkbox"
                              checked={habilitarManana}
                              onChange={(e) => setHabilitarManana(e.target.checked)}
                              className="w-4 h-4 text-medical-600 rounded"
                            />
                            <SunMedium className="w-4 h-4 text-amber-500" />
                            <span>Turno Mañana</span>
                          </label>
                        </div>
                        
                        {habilitarManana && (
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold block mb-1">Hora Inicio:</span>
                              <input
                                type="time"
                                value={mananaInicio}
                                onChange={(e) => setMananaInicio(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-black"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold block mb-1">Hora Fin:</span>
                              <input
                                type="time"
                                value={mananaFin}
                                onChange={(e) => setMananaFin(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-black"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Franja Tarde */}
                      <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer font-black text-xs text-slate-900">
                            <input
                              type="checkbox"
                              checked={habilitarTarde}
                              onChange={(e) => setHabilitarTarde(e.target.checked)}
                              className="w-4 h-4 text-medical-600 rounded"
                            />
                            <Moon className="w-4 h-4 text-purple-500" />
                            <span>Turno Tarde / Vespertino</span>
                          </label>
                        </div>

                        {habilitarTarde && (
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold block mb-1">Hora Inicio:</span>
                              <input
                                type="time"
                                value={tardeInicio}
                                onChange={(e) => setTardeInicio(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-black"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold block mb-1">Hora Fin:</span>
                              <input
                                type="time"
                                value={tardeFin}
                                onChange={(e) => setTardeFin(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-black"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Resumen en Vivo de Capacidad de Turnos */}
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-950">
                      <div>
                        <span className="text-[11px] text-emerald-700 font-bold block">Capacidad Estimada:</span>
                        <span className="text-sm font-black text-emerald-900">
                          {calcularSlotsPorDia()} turnos por día habilitado
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-800">
                        {diasSeleccionados.length} días/semana
                      </span>
                    </div>

                  </div>

                </div>

              </form>
            )}

          </div>

          {/* FOOTER STICKY */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            >
              Cerrar
            </button>

            {activeTab === 'form' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                >
                  Volver al Listado
                </button>
                <button
                  type="submit"
                  form="form-agenda"
                  className="px-6 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-black transition shadow-lg shadow-sky-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{editingAgendaId ? 'Guardar Cambios de Agenda' : 'Publicar Nueva Agenda'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenNewAgenda}
                className="px-5 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-black transition shadow-md shadow-sky-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nueva Agenda</span>
              </button>
            )}
          </div>

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
