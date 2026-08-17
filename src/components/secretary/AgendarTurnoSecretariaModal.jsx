import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Search, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  MessageCircle, 
  Printer, 
  Plus, 
  UserPlus,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Stethoscope,
  Layers,
  AlertCircle,
  Lock,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { WhatsAppService } from '../../services/whatsapp';
import { VoucherModal } from '../patient/VoucherModal';
import { formatDateAR, getLocalDateString, addDaysToDateString, getDayDetailsFromDateString } from '../../utils/dateUtils';

export const AgendarTurnoSecretariaModal = ({ isOpen, onClose, defaultFecha = null, defaultProfId = null }) => {
  const { 
    profesionales = [], 
    servicios = [], 
    consultorios = [], 
    obrasSociales = [], 
    planes = [], 
    nomenclador = [], 
    pacientes = [], 
    clinica = {}, 
    createTurno = () => {}, 
    showToast = () => {} 
  } = useApp() || {};

  const [step, setStep] = useState(1); // 1: Datos y Horario, 2: Confirmado
  
  // Fecha seleccionada
  const [fecha, setFecha] = useState(() => defaultFecha || getLocalDateString(new Date()));
  const [selectedProfId, setSelectedProfId] = useState(() => defaultProfId || (profesionales[0]?.id || ''));
  const [selectedServicioId, setSelectedServicioId] = useState('');
  const [selectedPracticaId, setSelectedPracticaId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [esSobreturno, setEsSobreturno] = useState(false);
  const [horaSobreturno, setHoraSobreturno] = useState('12:30');
  const [modalidadTurno, setModalidadTurno] = useState('PRESENCIAL');

  // Paciente
  const [dniSearch, setDniSearch] = useState('');
  const [pacienteForm, setPacienteForm] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    telefono_whatsapp: '',
    obra_social_id: obrasSociales[0]?.id || '',
    plan_id: '',
    numero_afiliado: '',
    observaciones: 'Turno programado'
  });

  // Turno creado
  const [createdTurnoData, setCreatedTurnoData] = useState(null);

  // Es agendamiento propio del profesional
  const isDoctorSelfSchedule = Boolean(defaultProfId);

  // RESETEAR SIEMPRE AL ABRIR EL MODAL (Soluciona que no quede en pantalla de éxito)
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setCreatedTurnoData(null);
      setSelectedSlot(null);
      setEsSobreturno(false);
      if (defaultFecha) setFecha(defaultFecha);
      if (defaultProfId) setSelectedProfId(defaultProfId);
      else if (profesionales.length > 0 && !selectedProfId) setSelectedProfId(profesionales[0].id);
    }
  }, [isOpen, defaultFecha, defaultProfId, profesionales]);

  const handleModalClose = () => {
    setStep(1);
    setCreatedTurnoData(null);
    setSelectedSlot(null);
    onClose();
  };

  const selectedProf = profesionales.find(p => p.id === selectedProfId);

  // Servicios pertenecientes al profesional seleccionado
  const serviciosDelProf = useMemo(() => {
    if (!selectedProf) return [];
    if (selectedProf.servicios_ids && selectedProf.servicios_ids.length > 0) {
      return servicios.filter(s => selectedProf.servicios_ids.includes(s.id));
    }
    const match = servicios.filter(s => 
      s.especialidad_id === selectedProf.especialidad_id ||
      (selectedProf.especialidad && s.nombre.toLowerCase().includes(selectedProf.especialidad.toLowerCase()))
    );
    if (match.length > 0) return match;
    return servicios;
  }, [selectedProf, servicios]);

  // Autoseleccionar primer servicio del médico
  useEffect(() => {
    if (serviciosDelProf.length > 0) {
      if (!selectedServicioId || !serviciosDelProf.some(s => s.id === selectedServicioId)) {
        setSelectedServicioId(serviciosDelProf[0].id);
      }
    } else {
      setSelectedServicioId('');
    }
  }, [selectedProfId, serviciosDelProf]);

  // Autoseleccionar práctica por defecto del servicio
  const selectedServicio = servicios.find(s => s.id === selectedServicioId);
  useEffect(() => {
    if (selectedServicio?.practica_default_id) {
      setSelectedPracticaId(selectedServicio.practica_default_id);
    } else if (!selectedPracticaId && nomenclador.length > 0) {
      setSelectedPracticaId(nomenclador[0].id);
    }
  }, [selectedServicioId, selectedServicio, nomenclador]);

  // Horarios configurados del médico
  const horariosDelMedico = useMemo(() => {
    if (!selectedProfId) return [];
    return StorageService.getHorariosByProfesional(selectedProfId);
  }, [selectedProfId]);

  // Próximos días de atención real con turnos disponibles calculados de forma determinista
  const proximosDiasDisponibles = useMemo(() => {
    if (!selectedProfId || horariosDelMedico.length === 0) return [];

    const horariosFiltrados = horariosDelMedico.filter(h => !modalidadTurno || !h.modalidad || h.modalidad === 'AMBAS' || h.modalidad === modalidadTurno);
    const diasSemanaAtencion = new Set(horariosFiltrados.map(h => Number(h.dia_semana)));
    const result = [];
    const todayStr = getLocalDateString(new Date());

    for (let i = 0; i < 45 && result.length < 12; i++) {
      const dateStr = addDaysToDateString(todayStr, i);
      const dayDetails = getDayDetailsFromDateString(dateStr);

      if (diasSemanaAtencion.has(dayDetails.diaSemana)) {
        const slotsDisponibles = StorageService.getSlotsDisponibles(selectedProfId, dateStr, selectedServicioId || null, modalidadTurno);
        const disponiblesCount = slotsDisponibles.filter(s => s.disponible).length;
        if (disponiblesCount > 0) {
          result.push({
            fecha: dateStr,
            diaNombre: dayDetails.diaNombre,
            diaNumero: dayDetails.diaNumero,
            mesNombre: dayDetails.mesNombre,
            disponiblesCount
          });
        }
      }
    }
    return result;
  }, [selectedProfId, horariosDelMedico, selectedServicioId, modalidadTurno]);

  if (!isOpen) return null;

  // Autocompletar datos del paciente por DNI
  const handleDniSearchBlur = () => {
    if (!dniSearch.trim()) return;
    const existing = StorageService.findPacienteByDni(dniSearch);
    if (existing) {
      setPacienteForm({
        dni: existing.dni,
        nombre: existing.nombre || '',
        apellido: existing.apellido || '',
        telefono_whatsapp: existing.telefono_whatsapp || '',
        obra_social_id: existing.obra_social_id || obrasSociales[0]?.id || '',
        plan_id: existing.plan_id || '',
        numero_afiliado: existing.numero_afiliado || '',
        observaciones: 'Paciente habitual'
      });
      showToast(`Paciente encontrado: ${existing.nombre} ${existing.apellido}`);
    } else {
      setPacienteForm(prev => ({ ...prev, dni: dniSearch }));
    }
  };

  const dateObj = new Date(fecha + 'T00:00:00');
  const diaSemana = dateObj.getDay();

  // Slots del médico seleccionado para la fecha
  const slotsDelMedico = selectedProfId 
    ? StorageService.getSlotsDisponibles(selectedProfId, fecha, selectedServicioId || null)
    : [];

  const handleConfirmarTurno = (e) => {
    e.preventDefault();
    if (!pacienteForm.dni || !pacienteForm.nombre || !pacienteForm.apellido || !selectedProfId) {
      showToast('Complete los datos del paciente y horario.', 'error');
      return;
    }

    const prof = profesionales.find(p => p.id === selectedProfId);
    const duracion = prof?.duracion_turno_minutos || 20;

    let hora_inicio = selectedSlot?.hora_inicio;
    let hora_fin = selectedSlot?.hora_fin;

    if (esSobreturno) {
      hora_inicio = horaSobreturno;
      const [h, m] = horaSobreturno.split(':').map(Number);
      const endM = h * 60 + m + duracion;
      hora_fin = `${String(Math.floor(endM / 60)).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`;
    }

    if (!hora_inicio) {
      showToast('Seleccione un horario disponible o active un sobreturno.', 'error');
      return;
    }

    const horariosProf = StorageService.getHorariosByProfesional(selectedProfId);
    const horario = horariosProf.find(h => h.dia_semana === diaSemana);
    const consultorioId = selectedSlot?.consultorio_id || horario?.consultorio_id || consultorios[0]?.id;

    const result = createTurno({
      pacienteData: {
        dni: pacienteForm.dni,
        nombre: pacienteForm.nombre,
        apellido: pacienteForm.apellido,
        telefono_whatsapp: pacienteForm.telefono_whatsapp,
        obra_social_id: pacienteForm.obra_social_id,
        plan_id: pacienteForm.plan_id || null,
        numero_afiliado: pacienteForm.numero_afiliado
      },
      turnoData: {
        profesional_id: selectedProfId,
        servicio_id: selectedServicioId || null,
        consultorio_id: consultorioId,
        practica_id: selectedPracticaId,
        obra_social_id: pacienteForm.obra_social_id,
        plan_id: pacienteForm.plan_id || null,
        numero_afiliado: pacienteForm.numero_afiliado,
        fecha: fecha,
        hora_inicio: hora_inicio,
        hora_fin: hora_fin,
        es_sobreturno: esSobreturno,
        observaciones: pacienteForm.observaciones
      }
    });

    if (result?.error) {
      return;
    }

    const { turno, paciente } = result;

    const profObj = profesionales.find(p => p.id === selectedProfId);
    const consObj = consultorios.find(c => c.id === consultorioId);
    const osObj = obrasSociales.find(o => o.id === pacienteForm.obra_social_id);
    const planObj = planes.find(p => p.id === pacienteForm.plan_id);
    const pracObj = nomenclador.find(p => p.id === selectedPracticaId);

    setCreatedTurnoData({
      turno,
      paciente,
      profesional: profObj,
      consultorio: consObj,
      obraSocial: osObj,
      plan: planObj,
      practica: pracObj
    });

    setStep(2);
  };

  const handleSendWhatsApp = () => {
    if (!createdTurnoData) return;
    WhatsAppService.enviarMensaje({
      turno: createdTurnoData.turno,
      paciente: createdTurnoData.paciente,
      profesional: createdTurnoData.profesional,
      consultorio: createdTurnoData.consultorio,
      obraSocial: createdTurnoData.obraSocial,
      clinica: clinica
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scaleIn my-auto">
        
        {/* HEADER */}
        <div className="px-5 sm:px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-medical-50 text-medical-700 rounded-2xl border border-medical-200 shadow-2xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                {step === 1 
                  ? (isDoctorSelfSchedule ? `Agendar Turno en mi Consultorio` : `Agendar Turno Rápido`) 
                  : `¡Turno Confirmado con Éxito!`}
              </h3>
              <p className="text-xs text-slate-500">
                {isDoctorSelfSchedule 
                  ? `Dr(a). ${selectedProf?.nombre} ${selectedProf?.apellido} • ${selectedProf?.especialidad}`
                  : `Recepción & Secretaría de Consultorios`}
              </p>
            </div>
          </div>
          <button onClick={handleModalClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {step === 1 ? (
            <form id="form-agendar-secretaria" onSubmit={handleConfirmarTurno} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* COLUMNA IZQUIERDA (5 COLS): DATOS DEL PACIENTE & COBERTURA */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* 1. DATOS DEL PACIENTE */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-medical-600" />
                      1. Datos del Paciente
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Escriba DNI para autocompletar
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">DNI del Paciente *</label>
                      <input
                        type="text"
                        required
                        placeholder="ej: 38123456"
                        value={pacienteForm.dni}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPacienteForm(prev => ({ ...prev, dni: val }));
                          setDniSearch(val);
                          if (val.replace(/\D/g, '').length >= 7) {
                            const existing = StorageService.findPacienteByDni(val);
                            if (existing) {
                              setPacienteForm({
                                dni: existing.dni,
                                nombre: existing.nombre || '',
                                apellido: existing.apellido || '',
                                telefono_whatsapp: existing.telefono_whatsapp || '',
                                obra_social_id: existing.obra_social_id || obrasSociales[0]?.id || '',
                                plan_id: existing.plan_id || '',
                                numero_afiliado: existing.numero_afiliado || '',
                                observaciones: 'Paciente habitual'
                              });
                            }
                          }
                        }}
                        onBlur={handleDniSearchBlur}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-medical-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Nombre *</label>
                        <input
                          type="text"
                          required
                          placeholder="Nombre"
                          value={pacienteForm.nombre}
                          onChange={(e) => setPacienteForm({ ...pacienteForm, nombre: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Apellido *</label>
                        <input
                          type="text"
                          required
                          placeholder="Apellido"
                          value={pacienteForm.apellido}
                          onChange={(e) => setPacienteForm({ ...pacienteForm, apellido: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">WhatsApp / Celular *</label>
                      <input
                        type="tel"
                        required
                        placeholder="ej: 351 428-9000"
                        value={pacienteForm.telefono_whatsapp}
                        onChange={(e) => setPacienteForm({ ...pacienteForm, telefono_whatsapp: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. COBERTURA MÉDICA & MOTIVO */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-medical-600" />
                    2. Cobertura Médica
                  </span>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Obra Social / Cobertura</label>
                      <select
                        value={pacienteForm.obra_social_id}
                        onChange={(e) => setPacienteForm({ ...pacienteForm, obra_social_id: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                      >
                        {obrasSociales.map(os => (
                          <option key={os.id} value={os.id}>{os.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">N° Afiliado / Bono (opcional)</label>
                      <input
                        type="text"
                        placeholder="ej: 1098492019/01"
                        value={pacienteForm.numero_afiliado}
                        onChange={(e) => setPacienteForm({ ...pacienteForm, numero_afiliado: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Observaciones del Turno</label>
                      <input
                        type="text"
                        placeholder="ej: Primera consulta / Control regular"
                        value={pacienteForm.observaciones}
                        onChange={(e) => setPacienteForm({ ...pacienteForm, observaciones: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA (7 COLS): PROFESIONAL, FECHA Y SLOTS */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* SECCIÓN PROFESIONAL & MODALIDAD */}
                <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-sky-600" />
                      3. Profesional & Modalidad
                    </span>
                    {selectedServicio?.practica_default_id && (
                      <span className="text-[10px] font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded-md border border-sky-300">
                        🔒 Código: [{nomenclador.find(p => p.id === selectedServicio.practica_default_id)?.codigo_pmo || '42.01.01'}]
                      </span>
                    )}
                  </div>

                  {isDoctorSelfSchedule ? (
                    <div className="p-3 bg-white border border-sky-300 rounded-xl flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-xs"
                          style={{ backgroundColor: selectedProf?.color_agenda || '#0284c7' }}
                        >
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="text-xs text-slate-900 block font-black">
                            Dr(a). {selectedProf?.nombre} {selectedProf?.apellido}
                          </strong>
                          <span className="text-[11px] text-medical-800 font-semibold">
                            {selectedProf?.especialidad} • Turno en consultorio propio
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold text-[10px] rounded">
                        ✓ Asignado a tu agenda
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Médico Profesional *</label>
                        <select
                          value={selectedProfId}
                          onChange={(e) => {
                            setSelectedProfId(e.target.value);
                            setSelectedSlot(null);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                        >
                          <option value="">Seleccione Profesional...</option>
                          {profesionales.filter(p => p.activo).map(p => (
                            <option key={p.id} value={p.id}>{p.nombre} {p.apellido} ({p.especialidad})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Modalidad</label>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => setModalidadTurno('PRESENCIAL')}
                            className={`flex-1 py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
                              modalidadTurno === 'PRESENCIAL'
                                ? 'bg-medical-600 text-white border-medical-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            🏢 Presencial
                          </button>
                          <button
                            type="button"
                            onClick={() => setModalidadTurno('ONLINE')}
                            className={`flex-1 py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
                              modalidadTurno === 'ONLINE'
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            💻 Online
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECCIÓN FECHA & HORARIOS DISPONIBLES */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-medical-600" />
                      4. Fecha & Horarios Disponibles
                    </span>

                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={fecha}
                        onChange={(e) => {
                          setFecha(e.target.value);
                          setSelectedSlot(null);
                        }}
                        className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-black bg-white shadow-xs"
                      />
                      <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                        {formatDateAR(fecha)}
                      </span>
                    </div>
                  </div>

                  {/* PÍLDORAS DE DÍAS DISPONIBLES */}
                  {proximosDiasDisponibles.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-600">
                        Días de atención con turnos libres para esta modalidad:
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {proximosDiasDisponibles.slice(0, 5).map((dia) => {
                          const isSelected = fecha === dia.fecha;
                          return (
                            <button
                              key={dia.fecha}
                              type="button"
                              onClick={() => {
                                setFecha(dia.fecha);
                                setSelectedSlot(null);
                              }}
                              className={`p-2 rounded-xl text-center transition border cursor-pointer ${
                                isSelected
                                  ? 'bg-medical-600 text-white border-medical-700 shadow-sm ring-2 ring-medical-500/20'
                                  : 'bg-white text-slate-800 border-slate-200 hover:border-medical-400 hover:bg-medical-50/40'
                              }`}
                            >
                              <span className="text-[10px] font-bold uppercase block opacity-80">{dia.diaNombre}</span>
                              <strong className="text-sm font-black block">{dia.diaNumero} {dia.mesNombre}</strong>
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                                isSelected ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {dia.disponiblesCount} libres
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* GRILLA DE SLOTS / HORARIOS */}
                  {!esSobreturno ? (
                    <div>
                      {slotsDelMedico.length === 0 ? (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
                          <p className="text-xs text-amber-800 font-bold">
                            ⚠️ No hay turnos libres para esta fecha y modalidad en la grilla regular.
                          </p>
                          <button
                            type="button"
                            onClick={() => setEsSobreturno(true)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            + Otorgar como Sobreturno
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="block text-[11px] font-bold text-slate-600">
                            Horarios Disponibles ({slotsDelMedico.filter(s => s.disponible).length} libres):
                          </label>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                            {slotsDelMedico.map((slot, idx) => {
                              const isSelected = selectedSlot?.hora_inicio === slot.hora_inicio;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  disabled={!slot.disponible}
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`py-2 px-1 rounded-xl text-xs font-black transition border cursor-pointer ${
                                    !slot.disponible
                                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                      : isSelected
                                      ? 'bg-medical-600 text-white border-medical-700 shadow-sm ring-2 ring-medical-500/20'
                                      : 'bg-white text-slate-800 border-slate-200 hover:border-medical-500 hover:bg-medical-50/50'
                                  }`}
                                >
                                  {slot.hora_inicio}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* SOBRETURNO */
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <strong className="text-xs text-amber-900 block font-black">
                          ⚡ Modo Sobreturno Activado
                        </strong>
                        <span className="text-[11px] text-amber-700">
                          Horario personalizado intercalado
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={horaSobreturno}
                          onChange={(e) => setHoraSobreturno(e.target.value)}
                          className="px-3 py-1.5 border border-amber-300 rounded-xl text-xs font-black bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setEsSobreturno(false)}
                          className="text-xs text-slate-500 hover:text-slate-800 underline font-bold cursor-pointer"
                        >
                          Volver a grilla
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>
          ) : (
          /* PASO 2: VOUCHER DE CONFIRMACIÓN CON WHATSAPP */
          <div className="space-y-6 text-center animate-fadeIn py-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-black text-slate-900">¡Turno Agendado Exitosamente!</h4>
              <p className="text-xs text-slate-500">
                Código de Reserva: <strong className="font-mono text-slate-900">{createdTurnoData?.turno?.codigo_reserva}</strong>
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2 max-w-md mx-auto">
              <p><strong>Paciente:</strong> {createdTurnoData?.paciente?.nombre} {createdTurnoData?.paciente?.apellido} (DNI: {createdTurnoData?.paciente?.dni})</p>
              <p><strong>Profesional:</strong> Dr(a). {createdTurnoData?.profesional?.nombre} {createdTurnoData?.profesional?.apellido}</p>
              <p><strong>Fecha y Hora:</strong> {formatDateAR(createdTurnoData?.turno?.fecha)} a las {createdTurnoData?.turno?.hora_inicio} hs</p>
              <p><strong>Consultorio:</strong> {createdTurnoData?.consultorio?.nombre}</p>
              <p><strong>Práctica PMO:</strong> [{createdTurnoData?.practica?.codigo_pmo}] {createdTurnoData?.practica?.descripcion}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Comprobante por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleModalClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Listo / Cerrar
              </button>
            </div>
          </div>
        )}
        </div>

        {/* MODAL FOOTER FIJO */}
        {step === 1 && (
          <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="form-agendar-secretaria"
              className="px-6 py-2 bg-medical-600 hover:bg-medical-500 text-white rounded-xl text-xs font-black shadow-md shadow-medical-600/20 transition cursor-pointer"
            >
              Confirmar y Agendar Turno
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
