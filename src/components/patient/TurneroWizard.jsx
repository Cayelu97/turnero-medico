import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Stethoscope, 
  User, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  DollarSign, 
  AlertCircle,
  Search,
  Check,
  Building,
  Layers,
  MapPin,
  Sparkles,
  X,
  Lock,
  Brain,
  Bot,
  Send
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { AiService } from '../../services/aiService';
import { VoucherModal } from './VoucherModal';
import { formatDateAR } from '../../utils/formatters';

export const TurneroWizard = () => {
  const { 
    clinica, 
    especialidades: catalogoEspecialidades,
    servicios,
    profesionales, 
    obrasSociales, 
    planes, 
    nomenclador, 
    consultorios, 
    conveniosCoseguros,
    createTurno,
    saveConsentimiento
  } = useApp();

  const wizardContainerRef = React.useRef(null);
  const [step, setStep] = useState(1);

  // Auto-scroll suave a la parte superior del asistente al avanzar/retroceder de paso
  useEffect(() => {
    if (wizardContainerRef.current) {
      wizardContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Asistente de Triage Clínico con IA
  const [aiQuery, setAiQuery] = useState('');
  const [aiTriageResult, setAiTriageResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [consentimientoAceptado, setConsentimientoAceptado] = useState(true);

  // Modo de búsqueda en Paso 1: 'especialidad' | 'profesional'
  const [searchMode, setSearchMode] = useState('especialidad');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstitucion, setSelectedInstitucion] = useState('');
  const [selectedPracticaFilter, setSelectedPracticaFilter] = useState('');

  // Wizard state
  const [modalidadTurno, setModalidadTurno] = useState('PRESENCIAL'); // 'PRESENCIAL' | 'ONLINE'
  const [selectedEspecialidad, setSelectedEspecialidad] = useState('');
  const [selectedServicioId, setSelectedServicioId] = useState('');
  const [selectedProfesionalId, setSelectedProfesionalId] = useState('');
  const [selectedObraSocialId, setSelectedObraSocialId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedPracticaId, setSelectedPracticaId] = useState('');
  const [selectedFecha, setSelectedFecha] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Datos del Paciente
  const [pacienteForm, setPacienteForm] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    telefono_whatsapp: '',
    email: '',
    numero_afiliado: '',
    motivo_consulta: ''
  });

  // Disponibilidad de Slots
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Voucher generado
  const [voucherData, setVoucherData] = useState(null);

  // Lista de especialidades desde el catálogo oficial
  const especialidades = catalogoEspecialidades?.length > 0 
    ? catalogoEspecialidades 
    : Array.from(new Set(profesionales.map(p => p.especialidad))).map((e, idx) => ({ id: `esp-${idx}`, nombre: e }));

  // Días y horarios de atención del profesional
  const horariosDelMedico = React.useMemo(() => {
    if (!selectedProfesionalId) return [];
    return StorageService.getHorariosByProfesional(selectedProfesionalId);
  }, [selectedProfesionalId]);

  const DIAS_NOMBRES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const diasAtencionTexto = React.useMemo(() => {
    if (horariosDelMedico.length === 0) return 'Sin horarios cargados';
    const dias = Array.from(new Set(horariosDelMedico.map(h => DIAS_NOMBRES[h.dia_semana]))).join(', ');
    const horas = horariosDelMedico.map(h => `${h.hora_inicio} a ${h.hora_fin}`).slice(0, 2).join(' / ');
    return `${dias} • ${horas}`;
  }, [horariosDelMedico]);

  // Próximos días con disponibilidad real (siguientes 30 días)
  const proximosDiasDisponibles = React.useMemo(() => {
    if (!selectedProfesionalId) return [];
    if (horariosDelMedico.length === 0) return [];

    const diasSemanaAtencion = new Set(horariosDelMedico.map(h => h.dia_semana));
    const result = [];
    const curr = new Date();

    for (let i = 0; i < 35 && result.length < 12; i++) {
      const dateStr = curr.toISOString().split('T')[0];
      const diaSemana = curr.getDay();

      if (diasSemanaAtencion.has(diaSemana)) {
        const slotsDisponibles = StorageService.getSlotsDisponibles(selectedProfesionalId, dateStr, selectedServicioId || null);
        const disponiblesCount = slotsDisponibles.filter(s => s.disponible).length;
        if (disponiblesCount > 0) {
          result.push({
            fecha: dateStr,
            diaNombre: curr.toLocaleDateString('es-AR', { weekday: 'short' }),
            diaNumero: curr.getDate(),
            mesNombre: curr.toLocaleDateString('es-AR', { month: 'short' }),
            disponiblesCount
          });
        }
      }
      curr.setDate(curr.getDate() + 1);
    }
    return result;
  }, [selectedProfesionalId, selectedServicioId, horariosDelMedico]);

  // Autoseleccionar la primera fecha disponible cuando cambia el médico o entramos al paso 3
  useEffect(() => {
    if (proximosDiasDisponibles.length > 0) {
      const exists = proximosDiasDisponibles.some(d => d.fecha === selectedFecha);
      if (!exists) {
        setSelectedFecha(proximosDiasDisponibles[0].fecha);
      }
    }
  }, [proximosDiasDisponibles, selectedProfesionalId]);

  // Cargar slots cuando cambian profesional, fecha o servicio
  useEffect(() => {
    if (selectedProfesionalId && selectedFecha) {
      setLoadingSlots(true);
      const available = StorageService.getSlotsDisponibles(selectedProfesionalId, selectedFecha, selectedServicioId || null);
      setSlots(available);
      setSelectedSlot(null);
      setLoadingSlots(false);
    } else {
      setSlots([]);
      setSelectedSlot(null);
    }
  }, [selectedProfesionalId, selectedFecha, selectedServicioId]);



  const selectedServicio = servicios.find(s => s.id === selectedServicioId);

  // Auto-fijar la práctica predeterminada si el servicio la define
  useEffect(() => {
    if (selectedServicio?.practica_default_id) {
      setSelectedPracticaId(selectedServicio.practica_default_id);
    } else if (!selectedPracticaId && nomenclador.length > 0) {
      setSelectedPracticaId(nomenclador[0].id);
    }
  }, [selectedServicioId, selectedServicio, nomenclador]);

  const selectedProf = profesionales.find(p => p.id === selectedProfesionalId);

  // Servicios que realmente corresponden a este profesional
  const serviciosDelProf = React.useMemo(() => {
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

  // Autoseleccionar el servicio correspondiente al elegir el profesional
  useEffect(() => {
    if (serviciosDelProf.length > 0) {
      if (!selectedServicioId || !serviciosDelProf.some(s => s.id === selectedServicioId)) {
        setSelectedServicioId(serviciosDelProf[0].id);
      }
    } else {
      setSelectedServicioId('');
    }
  }, [selectedProf, serviciosDelProf]);

  // Cálculo del coseguro estimado
  const coseguroCalculado = StorageService.calcularCoseguro(
    selectedObraSocialId,
    selectedPlanId,
    selectedPracticaId
  );

  const selectedOS = obrasSociales.find(o => o.id === selectedObraSocialId);
  const selectedPlan = planes.find(p => p.id === selectedPlanId);
  const selectedPractica = nomenclador.find(p => p.id === selectedPracticaId);
  const selectedConsultorio = consultorios.find(c => c.id === selectedSlot?.consultorio_id);

  // Planes filtrados por obra social
  const availablePlanes = planes.filter(p => p.obra_social_id === selectedObraSocialId);

  // Filtrado inteligente de profesionales según pestañas y búsqueda
  const filteredProfesionales = profesionales.filter(p => {
    if (p.activo === false) return false;

    if (searchMode === 'especialidad') {
      if (selectedEspecialidad && p.especialidad.toLowerCase() !== selectedEspecialidad.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesEsp = p.especialidad.toLowerCase().includes(q);
        const matchesProf = `${p.nombre} ${p.apellido}`.toLowerCase().includes(q);
        if (!matchesEsp && !matchesProf) return false;
      }
    } else {
      // Modo por profesional
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const full = `${p.nombre} ${p.apellido}`.toLowerCase();
        if (!full.includes(q) && !p.especialidad.toLowerCase().includes(q)) return false;
      }
    }

    if (selectedPracticaFilter) {
      if (p.practicas_habilitadas_ids && !p.practicas_habilitadas_ids.includes(selectedPracticaFilter)) {
        return false;
      }
    }

    return true;
  });

  // Estado de paciente encontrado en padrón
  const [pacienteEncontrado, setPacienteEncontrado] = useState(false);

  const handleDniBlur = () => {
    if (!pacienteForm.dni.trim()) return;
    const cleanDni = pacienteForm.dni.replace(/\D/g, '');
    const found = StorageService.findPacienteByDni(cleanDni);
    if (found) {
      setPacienteForm(prev => ({
        ...prev,
        dni: found.dni,
        nombre: found.nombre || prev.nombre,
        apellido: found.apellido || prev.apellido,
        telefono_whatsapp: found.telefono_whatsapp || prev.telefono_whatsapp,
        email: found.email || prev.email,
        numero_afiliado: found.numero_afiliado || prev.numero_afiliado
      }));
      if (found.obra_social_id && !selectedObraSocialId) {
        setSelectedObraSocialId(found.obra_social_id);
      }
      if (found.plan_id && !selectedPlanId) {
        setSelectedPlanId(found.plan_id);
      }
      setPacienteEncontrado(true);
    } else {
      setPacienteEncontrado(false);
    }
  };

  // Asistente IA de Triage Clínico
  const handleExecuteAiTriage = (queryText) => {
    const textToAnalyze = queryText || aiQuery;
    if (!textToAnalyze.trim()) return;

    setAiLoading(true);
    setTimeout(() => {
      const result = AiService.triagePaciente({
        textoPaciente: textToAnalyze,
        especialidadesDisponibles: especialidades.map(e => e.nombre || e),
        profesionalesDisponibles: profesionales
      });
      setAiTriageResult(result);
      setAiLoading(false);
    }, 400);
  };

  const handleApplyAiRecommendation = (result) => {
    if (result.especialidadSugerida) {
      setSelectedEspecialidad(result.especialidadSugerida);
      setSearchMode('especialidad');
    }
    if (result.profesionalesRecomendados?.length > 0) {
      const matchProf = profesionales.find(p => 
        result.profesionalesRecomendados.some(rp => rp.toLowerCase().includes(p.apellido.toLowerCase()))
      );
      if (matchProf) {
        setSelectedProfesionalId(matchProf.id);
      }
    }
    if (result.codigoPmoSugerido) {
      const matchPractica = nomenclador.find(p => p.codigo_pmo === result.codigoPmoSugerido);
      if (matchPractica) {
        setSelectedPracticaId(matchPractica.id);
      }
    }
    setPacienteForm(prev => ({
      ...prev,
      motivo_consulta: result.resumenMotivo || aiQuery
    }));
  };

  // Enviar y Confirmar Reserva
  const handleConfirmTurno = (e) => {
    e.preventDefault();
    if (!selectedProfesionalId || !selectedFecha || !selectedSlot || !selectedPracticaId || !selectedObraSocialId) {
      alert('Por favor complete todos los pasos del turno.');
      return;
    }

    const { turno, paciente } = createTurno({
      pacienteData: {
        dni: pacienteForm.dni,
        nombre: pacienteForm.nombre,
        apellido: pacienteForm.apellido,
        telefono_whatsapp: pacienteForm.telefono_whatsapp,
        email: pacienteForm.email,
        obra_social_id: selectedObraSocialId,
        plan_id: selectedPlanId || null,
        numero_afiliado: pacienteForm.numero_afiliado
      },
      turnoData: {
        profesional_id: selectedProfesionalId,
        servicio_id: selectedServicioId || null,
        consultorio_id: selectedSlot.consultorio_id,
        practica_id: selectedPracticaId,
        obra_social_id: selectedObraSocialId,
        plan_id: selectedPlanId || null,
        numero_afiliado: pacienteForm.numero_afiliado,
        fecha: selectedFecha,
        hora_inicio: selectedSlot.hora_inicio,
        hora_fin: selectedSlot.hora_fin,
        es_sobreturno: false,
        modalidad: modalidadTurno,
        link_videoconsulta: modalidadTurno === 'ONLINE' ? `https://meet.jit.si/SanLucas-Consulta-${Date.now().toString().slice(-6)}` : null,
        monto_coseguro: coseguroCalculado,
        observaciones: pacienteForm.motivo_consulta
      }
    });

    // Guardar consentimiento informado si fue tildado
    if (consentimientoAceptado && paciente) {
      saveConsentimiento({
        paciente_id: paciente.id,
        paciente_nombre: `${paciente.apellido}, ${paciente.nombre}`,
        paciente_dni: paciente.dni,
        tipo: 'PSICOLOGICO_GENERAL',
        version: '1.0',
        firmado: true,
        fecha_firma: new Date().toISOString(),
        dispositivo: navigator.userAgent
      });
    }

    // Disparar confeti de celebración
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    // Mostrar Voucher
    setVoucherData({
      turno,
      paciente,
      profesional: selectedProf,
      consultorio: selectedConsultorio,
      obraSocial: selectedOS,
      plan: selectedPlan,
      practica: selectedPractica
    });

    // Resetear Wizard
    setStep(1);
    setSelectedProfesionalId('');
    setSelectedSlot(null);
  };

  return (
    <div ref={wizardContainerRef} id="turnero-wizard-container" className="max-w-4xl mx-auto space-y-6 scroll-mt-6">
      {/* Banner de Bienvenida */}
      <div className="bg-gradient-to-r from-medical-700 via-sky-600 to-tealmed-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-600/10">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-sky-200 mb-1">
          <Building className="w-4 h-4" />
          <span>{clinica.nombre}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Reserva de Turnos Online
        </h1>
        <p className="text-sm text-sky-100 mt-1 max-w-2xl">
          {clinica.mensaje_bienvenida || 'Obtén tu turno médico en 4 sencillos pasos. Busca por especialidad o profesional, selecciona tu horario y confirma tu cita.'}
        </p>
      </div>

      {/* Stepper Wizard Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {[
            { num: 1, title: 'Búsqueda & Médico', icon: Stethoscope },
            { num: 2, title: 'Cobertura & Práctica', icon: ShieldCheck },
            { num: 3, title: 'Fecha & Horario', icon: Calendar },
            { num: 4, title: 'Datos del Afiliado', icon: User }
          ].map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            const Icon = s.icon;

            return (
              <button
                key={s.num}
                disabled={step < s.num}
                onClick={() => setStep(s.num)}
                className={`flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl text-left transition ${
                  isCurrent
                    ? 'bg-medical-50 text-medical-800 border border-medical-200 font-bold'
                    : isCompleted
                    ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold'
                    : 'text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  isCurrent
                    ? 'bg-medical-600 text-white shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span className="text-[10px] sm:text-xs leading-tight text-center sm:text-left">
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido del Paso Actual */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8">
        {/* PASO 1: BÚSQUEDA DUAL (ESPECIALIDAD VS PROFESIONAL) + ASISTENTE IA */}
        {step === 1 && (
          <div className="space-y-6">
            
            {/* ASISTENTE VIRTUAL DE TRIAGE CLÍNICO CON IA */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl shadow-lg shadow-indigo-950/20 space-y-3.5 border border-indigo-800/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">¿No sabes qué especialista o servicio necesitas?</h3>
                    <p className="text-[11px] text-indigo-200">Describe tus síntomas o motivo de consulta y nuestro Asistente IA te orientará al instante</p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-indigo-500/30 text-indigo-200 rounded-md border border-indigo-400/30">
                  Triage Inteligente
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ej: Siento ataques de pánico y ansiedad recurrente... o Consulta por terapia de pareja..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleExecuteAiTriage();
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-indigo-300/60 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => handleExecuteAiTriage()}
                  disabled={aiLoading || !aiQuery.trim()}
                  className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{aiLoading ? 'Analizando...' : 'Orientarme'}</span>
                </button>
              </div>

              {/* Sugerencias Rápidas de Triage */}
              {!aiTriageResult && (
                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                  <span className="text-indigo-300 font-bold">Ejemplos rápidos:</span>
                  {[
                    'Ansiedad y ataques de pánico',
                    'Terapia de pareja / crisis vincular',
                    'Depresión y falta de motivación',
                    'Control cardiológico anual'
                  ].map(ex => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => {
                        setAiQuery(ex);
                        handleExecuteAiTriage(ex);
                      }}
                      className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-indigo-100 rounded-lg transition cursor-pointer"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              )}

              {/* Resultado del Triage IA */}
              {aiTriageResult && (
                <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 space-y-2.5 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Recomendación Personalizada:
                    </span>
                    <button
                      type="button"
                      onClick={() => setAiTriageResult(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-white text-xs leading-relaxed">
                    {aiTriageResult.explicacion}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-black/20 p-2.5 rounded-xl">
                    <div>
                      <span className="text-indigo-300 block">Especialidad Recomendada:</span>
                      <strong className="text-white">{aiTriageResult.especialidadSugerida}</strong>
                    </div>
                    <div>
                      <span className="text-indigo-300 block">Profesional Sugerido:</span>
                      <strong className="text-white">{aiTriageResult.profesionalesRecomendados?.join(', ') || 'Profesionales de Salud Mental'}</strong>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleApplyAiRecommendation(aiTriageResult)}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition shadow-md cursor-pointer flex items-center gap-1"
                    >
                      <span>Aplicar recomendación y ver turnos</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Selector de Pestañas estilo Oulton / Doctoralia */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => {
                  setSearchMode('especialidad');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                  searchMode === 'especialidad'
                    ? 'bg-medical-50 text-medical-800 border border-medical-200 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-medical-600" />
                <span>Por especialidad</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearchMode('profesional');
                  setSelectedEspecialidad('');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                  searchMode === 'profesional'
                    ? 'bg-medical-50 text-medical-800 border border-medical-200 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4 text-medical-600" />
                <span>Por profesional</span>
              </button>
            </div>

            {/* Caja de Búsqueda Principal & Filtros */}
            <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
              {/* Buscador grande */}
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    searchMode === 'especialidad'
                      ? 'Buscar especialidad (ej. Cardiología, Pediatría, Dermatología...)'
                      : 'Buscar médico por nombre o apellido (ej. Pérez Rossi, González...)'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-medical-500 shadow-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filtros Secundarios: Especialidad / Sede / Práctica */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {searchMode === 'especialidad' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Especialidad:</label>
                    <select
                      value={selectedEspecialidad}
                      onChange={(e) => setSelectedEspecialidad(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                    >
                      <option value="">Todas las especialidades ({especialidades.length})</option>
                      {especialidades.map(esp => (
                        <option key={esp.id || esp.nombre} value={esp.nombre}>
                          {esp.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Sede / Institución:</label>
                  <select
                    value={selectedInstitucion}
                    onChange={(e) => setSelectedInstitucion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                  >
                    <option value="">{clinica.nombre} (Principal)</option>
                    <option value="anexo">Sede Consultorios Externos Belgrano</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Práctica / Estudio:</label>
                  <select
                    value={selectedPracticaFilter}
                    onChange={(e) => setSelectedPracticaFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                  >
                    <option value="">Cualquier práctica / consulta</option>
                    {nomenclador.map(nom => (
                      <option key={nom.id} value={nom.id}>
                        {nom.codigo_pmo} - {nom.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chips rápidos de especialidades más consultadas */}
              {searchMode === 'especialidad' && !selectedEspecialidad && (
                <div className="pt-2 border-t border-slate-200/70 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 mr-1">Frecuentes:</span>
                  {['Cardiología', 'Pediatría', 'Clínica Médica', 'Traumatología', 'Dermatología', 'Ginecología'].map(espName => (
                    <button
                      key={espName}
                      type="button"
                      onClick={() => setSelectedEspecialidad(espName)}
                      className="px-2.5 py-1 bg-white hover:bg-medical-50 hover:text-medical-800 hover:border-medical-300 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition"
                    >
                      {espName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Listado de Médicos disponibles */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700">
                  Profesionales disponibles ({filteredProfesionales.length}):
                </span>
                {selectedEspecialidad && (
                  <button
                    type="button"
                    onClick={() => setSelectedEspecialidad('')}
                    className="text-[11px] font-bold text-medical-600 hover:underline flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Limpiar filtro: {selectedEspecialidad}
                  </button>
                )}
              </div>

              {filteredProfesionales.length === 0 ? (
                <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                  No se encontraron profesionales con los criterios seleccionados. Intente borrar los filtros.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredProfesionales.map((p) => {
                    const isSelected = selectedProfesionalId === p.id;

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProfesionalId(p.id);
                          setSelectedServicioId('');
                        }}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'border-medical-600 bg-medical-50/50 shadow-md shadow-medical-600/10 ring-2 ring-medical-600/20'
                            : 'border-slate-200 hover:border-medical-300 hover:bg-slate-50 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-xs flex-shrink-0"
                            style={{ backgroundColor: p.color_agenda || '#0284c7' }}
                          >
                            {p.nombre[0]}{p.apellido[0]}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900">
                              Dr(a). {p.nombre} {p.apellido}
                            </h4>
                            <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-medical-800 bg-medical-100 rounded-md mt-0.5">
                              {p.especialidad}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                              {p.matricula_nacional && <span>{p.matricula_nacional}</span>}
                              <span>•</span>
                              <span>⏱️ {p.duracion_turno_minutos || 20} min</span>
                            </div>
                          </div>
                        </div>

                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-medical-600 bg-medical-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selector de Servicio / Motivo del Turno si hay un médico seleccionado */}
            {selectedProf && serviciosDelProf.length > 0 && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Servicio / Motivo de Consulta con Dr(a). {selectedProf.apellido}:
                  </label>
                  {serviciosDelProf.length === 1 && (
                    <span className="text-[10px] font-bold text-medical-700 bg-medical-50 px-2 py-0.5 rounded-md border border-medical-200">
                      ✓ Servicio asignado al profesional
                    </span>
                  )}
                </div>

                <div className={`grid gap-2 ${serviciosDelProf.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  {serviciosDelProf.map(s => {
                    const isSelected = selectedServicioId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedServicioId(s.id)}
                        className={`p-3.5 rounded-xl border-2 text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-medical-50 border-medical-600 text-medical-950 font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-extrabold block">{s.nombre}</span>
                          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                            {s.tipo === 'ESTUDIO_PRACTICA' ? '🔬 Estudio / Práctica diagnóstica' : '🩺 Consulta / Procedimiento'} • ⏱️ {s.duracion_default_min || selectedProf.duracion_turno_minutos || 20} min
                          </span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-medical-600 bg-medical-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={!selectedProfesionalId}
                onClick={() => setStep(2)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition shadow-md ${
                  selectedProfesionalId
                    ? 'bg-medical-600 hover:bg-medical-700 text-white shadow-medical-600/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Continuar a Cobertura</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: COBERTURA Y PRÁCTICA */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Paso 2: Obra Social, Prepaga y Práctica Médica
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Indique su cobertura médica para calcular los requisitos de atención y coseguro aplicable.
              </p>
            </div>

            {/* Obra Social Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Seleccione su Obra Social o Prepaga *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {obrasSociales.map((os) => {
                  const isSelected = selectedObraSocialId === os.id;
                  return (
                    <button
                      key={os.id}
                      type="button"
                      onClick={() => {
                        setSelectedObraSocialId(os.id);
                        setSelectedPlanId('');
                      }}
                      className={`p-3 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-medical-600 bg-medical-50 text-medical-900 font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold truncate">{os.nombre}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{os.sigla || 'Convenio activo'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plan de la Obra Social */}
            {selectedOS && availablePlanes.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Plan de {selectedOS.nombre}:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availablePlanes.map((pl) => {
                    const isSelected = selectedPlanId === pl.id;
                    return (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => setSelectedPlanId(pl.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                          isSelected
                            ? 'bg-medical-600 text-white border-medical-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {pl.nombre_plan}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Práctica del Nomenclador */}
            <div>
              {selectedServicio?.practica_default_id && selectedPractica ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Práctica Médica Predeterminada (Fijada por Servicio) *
                  </label>
                  <div className="p-4 bg-sky-50/90 border-2 border-sky-400 rounded-2xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-sky-950 bg-white px-2 py-0.5 rounded border border-sky-200 shadow-2xs">
                            {selectedPractica.codigo_pmo}
                          </span>
                          <h4 className="text-xs font-extrabold text-slate-900">{selectedPractica.descripcion}</h4>
                        </div>
                        <span className="text-[11px] text-sky-900 font-medium block mt-1">
                          🔒 Esta práctica corresponde exclusivamente al servicio <strong>"{selectedServicio.nombre}"</strong> y está fijada por protocolo.
                        </span>
                        {selectedPractica.instrucciones_preparacion && (
                          <p className="text-[11px] text-amber-800 font-semibold mt-1">
                            ℹ️ Prep: {selectedPractica.instrucciones_preparacion}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-sky-200 text-sky-900 text-[10px] font-black uppercase rounded-lg flex-shrink-0">
                      Fijada por Servicio
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Práctica o Tipo de Consulta Solicitada *
                  </label>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {nomenclador.map((nom) => {
                      const isSelected = selectedPracticaId === nom.id;
                      return (
                        <div
                          key={nom.id}
                          onClick={() => setSelectedPracticaId(nom.id)}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                            isSelected
                              ? 'border-medical-600 bg-medical-50/50 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                                {nom.codigo_pmo}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900">{nom.descripcion}</h4>
                            </div>
                            {nom.instrucciones_preparacion && (
                              <p className="text-[11px] text-amber-700 mt-1">
                                ℹ️ Prep: {nom.instrucciones_preparacion}
                              </p>
                            )}
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-medical-600 bg-medical-600 text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Indicador de Coseguro Estimado */}
            {selectedOS && selectedPractica && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-emerald-900 block">Coseguro Estimado en Recepción:</span>
                  <span className="text-[11px] text-emerald-700">Calculado según tu cobertura médica y práctica</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-800">
                    {coseguroCalculado === 0 ? 'Sin Coseguro ($0)' : `$${coseguroCalculado.toLocaleString('es-AR')}`}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>
              <button
                type="button"
                disabled={!selectedObraSocialId || !selectedPracticaId}
                onClick={() => setStep(3)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-md ${
                  selectedObraSocialId && selectedPracticaId
                    ? 'bg-medical-600 hover:bg-medical-700 text-white shadow-medical-600/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Continuar a Fecha y Horario</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: FECHA Y HORARIO */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Paso 3: Seleccione Día y Horario Disponible
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Atención con Dr(a). {selectedProf?.nombre} {selectedProf?.apellido} ({selectedProf?.especialidad})
                  </p>
                </div>

                {/* Badge de Horarios de Atención del Médico */}
                <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-left sm:text-right">
                  <span className="text-[10px] font-black uppercase text-sky-800 block">Días de Atención:</span>
                  <span className="text-xs font-bold text-slate-800">{diasAtencionTexto}</span>
                </div>
              </div>
            </div>

            {/* SELECTOR DE MODALIDAD (PRESENCIAL VS TELECONSULTA) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                Modalidad de la Sesión:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalidadTurno('PRESENCIAL')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                    modalidadTurno === 'PRESENCIAL'
                      ? 'bg-medical-600 text-white border-medical-600 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>🏢 Presencial en Consultorio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalidadTurno('ONLINE')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                    modalidadTurno === 'ONLINE'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>💻 Sesión Virtual / Online</span>
                </button>
              </div>
            </div>

            {/* CARRUSEL DE PRÓXIMOS DÍAS DISPONIBLES */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Próximos días con disponibilidad ({proximosDiasDisponibles.length} fechas encontradas):
              </label>
              
              {proximosDiasDisponibles.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-bold">
                  ⚠️ El profesional no tiene turnos libres en los próximos 30 días o no tiene horarios configurados.
                </div>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                  {proximosDiasDisponibles.map((dia) => {
                    const isSelected = selectedFecha === dia.fecha;

                    return (
                      <button
                        key={dia.fecha}
                        type="button"
                        onClick={() => setSelectedFecha(dia.fecha)}
                        className={`flex-shrink-0 p-3 rounded-2xl border-2 text-center transition flex flex-col items-center min-w-[85px] cursor-pointer ${
                          isSelected
                            ? 'bg-medical-600 text-white border-medical-700 shadow-md shadow-medical-600/20 scale-105'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-medical-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`text-[11px] uppercase font-black ${isSelected ? 'text-sky-100' : 'text-slate-500'}`}>
                          {dia.diaNombre}
                        </span>
                        <span className="text-lg font-black my-0.5">
                          {dia.diaNumero}
                        </span>
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-sky-100' : 'text-slate-500'}`}>
                          {dia.mesNombre}
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full mt-1.5 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {dia.disponiblesCount} libres
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selector de fecha manual / otra fecha */}
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">¿Deseas buscar otra fecha?</span>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedFecha}
                  onChange={(e) => setSelectedFecha(e.target.value)}
                  className="px-3 py-1 border border-slate-200 rounded-lg text-xs font-extrabold text-slate-800 bg-slate-50"
                />
              </div>
            </div>

            {/* Grilla de Slots Divididos por Mañana y Tarde */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Horarios Disponibles para el {new Date(selectedFecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}:
              </label>
              
              {loadingSlots ? (
                <div className="p-8 text-center text-xs text-slate-400">Cargando horarios disponibles...</div>
              ) : slots.length === 0 ? (
                <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-500 space-y-2">
                  <p>No hay horarios disponibles para esta fecha.</p>
                  {proximosDiasDisponibles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedFecha(proximosDiasDisponibles[0].fecha)}
                      className="px-4 py-2 bg-medical-600 text-white rounded-xl text-xs font-bold shadow-xs"
                    >
                      Ir al primer día con turnos ({proximosDiasDisponibles[0].diaNombre} {proximosDiasDisponibles[0].diaNumero} {proximosDiasDisponibles[0].mesNombre})
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Turno Mañana */}
                  {slots.some(s => Number(s.hora_inicio.split(':')[0]) < 13) && (
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold text-slate-600 flex items-center gap-1.5">
                        ☀️ Turno Mañana (08:00 a 13:00 hs)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {slots.filter(s => Number(s.hora_inicio.split(':')[0]) < 13).map((s, idx) => {
                          const isSelected = selectedSlot?.hora_inicio === s.hora_inicio;
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={!s.disponible}
                              onClick={() => setSelectedSlot(s)}
                              className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                                isSelected
                                  ? 'bg-medical-600 text-white border-medical-700 shadow-md shadow-medical-600/20'
                                  : s.disponible
                                  ? 'bg-white border-slate-200 text-slate-800 hover:border-medical-400 hover:bg-medical-50/40 shadow-2xs'
                                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <span className="font-mono text-sm font-black">{s.hora_inicio}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded mt-1 truncate max-w-full ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : s.disponible
                                  ? (coseguroCalculado === 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-indigo-50 text-indigo-800 border border-indigo-200')
                                  : 'text-slate-400'
                              }`}>
                                {s.disponible
                                  ? (selectedOS?.sigla === 'PART' ? `$${Number(selectedPractica?.valor_particular || 16000).toLocaleString('es-AR')}` : coseguroCalculado === 0 ? '100% Cubierto' : `Copago $${coseguroCalculado}`)
                                  : 'Ocupado'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Turno Tarde */}
                  {slots.some(s => Number(s.hora_inicio.split(':')[0]) >= 13) && (
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold text-slate-600 flex items-center gap-1.5">
                        🌙 Turno Tarde (13:00 a 20:00 hs)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {slots.filter(s => Number(s.hora_inicio.split(':')[0]) >= 13).map((s, idx) => {
                          const isSelected = selectedSlot?.hora_inicio === s.hora_inicio;
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={!s.disponible}
                              onClick={() => setSelectedSlot(s)}
                              className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                                isSelected
                                  ? 'bg-medical-600 text-white border-medical-700 shadow-md shadow-medical-600/20'
                                  : s.disponible
                                  ? 'bg-white border-slate-200 text-slate-800 hover:border-medical-400 hover:bg-medical-50/40 shadow-2xs'
                                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <span className="font-mono text-sm font-black">{s.hora_inicio}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded mt-1 truncate max-w-full ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : s.disponible
                                  ? (coseguroCalculado === 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-indigo-50 text-indigo-800 border border-indigo-200')
                                  : 'text-slate-400'
                              }`}>
                                {s.disponible
                                  ? (selectedOS?.sigla === 'PART' ? `$${Number(selectedPractica?.valor_particular || 16000).toLocaleString('es-AR')}` : coseguroCalculado === 0 ? '100% Cubierto' : `Copago $${coseguroCalculado}`)
                                  : 'Ocupado'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>
              <button
                type="button"
                disabled={!selectedSlot}
                onClick={() => setStep(4)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-md ${
                  selectedSlot
                    ? 'bg-medical-600 hover:bg-medical-700 text-white shadow-medical-600/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Continuar a Datos Personales</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: DATOS PERSONALES Y CONFIRMACIÓN */}
        {step === 4 && (
          <form onSubmit={handleConfirmTurno} className="space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Paso 4: Datos del Paciente & Confirmación
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete los datos para generar su comprobante de turno y recibir el recordatorio por WhatsApp.
              </p>
            </div>

            {/* Resumen del Turno */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Médico:</span>
                <strong className="text-slate-900">Dr(a). {selectedProf?.nombre} {selectedProf?.apellido} ({selectedProf?.especialidad})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha y Hora:</span>
                <strong className="text-slate-900">{formatDateAR(selectedFecha)} a las {selectedSlot?.hora_inicio} hs</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cobertura:</span>
                <strong className="text-slate-900">{selectedOS?.nombre} {selectedPlan ? `(${selectedPlan.nombre_plan})` : ''}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-700 font-bold">Coseguro Estimado:</span>
                <strong className="text-emerald-700 font-black">
                  {coseguroCalculado === 0 ? 'Sin Coseguro ($0)' : `$${coseguroCalculado.toLocaleString('es-AR')}`}
                </strong>
              </div>
            </div>

            {/* Alerta de Paciente Identificado en Padrón */}
            {pacienteEncontrado && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-xs text-emerald-900 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <strong className="block font-black">¡Hola de nuevo, {pacienteForm.nombre}!</strong>
                  <span>Recuperamos automáticamente tus datos de contacto del padrón para facilitarte el agendamiento.</span>
                </div>
              </div>
            )}

            {/* Formulario del Paciente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">DNI del Paciente *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: 35890123"
                  value={pacienteForm.dni}
                  onChange={(e) => {
                    setPacienteForm({ ...pacienteForm, dni: e.target.value });
                    if (e.target.value.replace(/\D/g, '').length >= 7) {
                      const found = StorageService.findPacienteByDni(e.target.value);
                      if (found) {
                        setPacienteForm(prev => ({
                          ...prev,
                          nombre: found.nombre || prev.nombre,
                          apellido: found.apellido || prev.apellido,
                          telefono_whatsapp: found.telefono_whatsapp || prev.telefono_whatsapp,
                          email: found.email || prev.email,
                          numero_afiliado: found.numero_afiliado || prev.numero_afiliado
                        }));
                        setPacienteEncontrado(true);
                      }
                    }
                  }}
                  onBlur={handleDniBlur}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Número de Afiliado (opcional)</label>
                <input
                  type="text"
                  placeholder="ej: 1098492019/01"
                  value={pacienteForm.numero_afiliado}
                  onChange={(e) => setPacienteForm({ ...pacienteForm, numero_afiliado: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Juan Ignacio"
                  value={pacienteForm.nombre}
                  onChange={(e) => setPacienteForm({ ...pacienteForm, nombre: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Apellido *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Gómez"
                  value={pacienteForm.apellido}
                  onChange={(e) => setPacienteForm({ ...pacienteForm, apellido: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="ej: 11 4829-1920"
                  value={pacienteForm.telefono_whatsapp}
                  onChange={(e) => setPacienteForm({ ...pacienteForm, telefono_whatsapp: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="ej: juan.gomez@gmail.com"
                  value={pacienteForm.email}
                  onChange={(e) => setPacienteForm({ ...pacienteForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Motivo de Consulta / Observaciones</label>
              <textarea
                rows="2"
                placeholder="Indique brevemente el motivo de su visita o síntomas..."
                value={pacienteForm.motivo_consulta}
                onChange={(e) => setPacienteForm({ ...pacienteForm, motivo_consulta: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500"
              />
            </div>

            {/* CONSENTIMIENTO INFORMADO DIGITAL (Ley 26.657 & Ley 26.529) */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2 text-xs">
              <label className="flex items-start gap-2.5 font-bold text-indigo-950 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consentimientoAceptado}
                  onChange={(e) => setConsentimientoAceptado(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span>He leído y acepto el Consentimiento Informado para la atención asistencial</span>
                  <p className="text-[11px] font-normal text-indigo-800/80 mt-0.5">
                    Presto conformidad para la apertura de Historia Clínica y el encuadre profesional conforme a las Leyes Nacionales 26.657 (Salud Mental) y 26.529 (Derechos del Paciente y Secreto Profesional) y normativas del Colegio de Psicólogos de Córdoba.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>
              <button
                type="submit"
                disabled={!consentimientoAceptado}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirmar y Reservar Turno</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Modal Voucher de Confirmación */}
      {voucherData && (
        <VoucherModal
          turno={voucherData.turno}
          paciente={voucherData.paciente}
          profesional={voucherData.profesional}
          consultorio={voucherData.consultorio}
          obraSocial={voucherData.obraSocial}
          plan={voucherData.plan}
          practica={voucherData.practica}
          onClose={() => setVoucherData(null)}
        />
      )}
    </div>
  );
};
