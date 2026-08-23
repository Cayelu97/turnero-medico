import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Volume2, 
  UserCheck, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Printer, 
  AlertCircle, 
  Pill, 
  Calendar, 
  ShieldCheck, 
  Save, 
  DoorClosed,
  ChevronRight,
  Plus,
  MessageCircle,
  Sparkles,
  ArrowRightLeft,
  XCircle,
  X,
  Brain,
  Mic,
  MicOff,
  Video,
  ExternalLink,
  Copy,
  Download,
  QrCode
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { WhatsAppService } from '../../services/whatsapp';
import { AiService, CIE10_DSM5_CATALOGO } from '../../services/aiService';
import { formatDateAR } from '../../utils/formatters';
import { getLocalDateString } from '../../utils/dateUtils';
import { AgendarTurnoSecretariaModal } from '../secretary/AgendarTurnoSecretariaModal';
import { ReprogramarTurnoModal } from '../secretary/ReprogramarTurnoModal';
import { CancelarTurnoModal } from '../secretary/CancelarTurnoModal';

export const DoctorPortal = () => {
  const { 
    profesionales, 
    consultorios, 
    turnos, 
    pacientes, 
    obrasSociales, 
    planes, 
    nomenclador, 
    atencionesHce, 
    updateTurnoEstado, 
    saveAtencionHce, 
    currentUser,
    clinica 
  } = useApp();

  // Seleccionar médico activo (estricto al profesional logueado)
  const defaultDocId = (currentUser?.rol === 'PROFESIONAL' && currentUser?.profesional_id)
    ? currentUser.profesional_id
    : (profesionales[0]?.id || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState(defaultDocId);

  useEffect(() => {
    if (currentUser?.rol === 'PROFESIONAL' && currentUser?.profesional_id) {
      setSelectedDoctorId(currentUser.profesional_id);
    }
  }, [currentUser]);

  // Turno que está siendo atendido actualmente
  const [activeTurnoId, setActiveTurnoId] = useState(null);
  const [portalTab, setPortalTab] = useState('hoy'); // 'hoy' | 'futuros' | 'informes'
  const [showAgendarModal, setShowAgendarModal] = useState(false);
  const [showReprogramModal, setShowReprogramModal] = useState(false);
  const [turnoToReprogram, setTurnoToReprogram] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [turnoToCancel, setTurnoToCancel] = useState(null);

  // Modo Zen (Enfoque Clínico) y Timeline de Sesiones Previas
  const [zenMode, setZenMode] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  // Reconocimiento de Voz / Dictado
  const [isRecording, setIsRecording] = useState(false);
  const [speechRecognitionInstance, setSpeechRecognitionInstance] = useState(null);

  // Formulario de evolución clínica / sesión psicológica
  const [evolucionForm, setEvolucionForm] = useState({
    motivo_consulta: '',
    anamnesis_examen_fisico: '',
    diagnostico_cie10: 'F41.1 - Trastorno de ansiedad generalizada (TAG)',
    diagnostico_descripcion: '',
    receta_indicaciones: '',
    plan_tratamiento: '',
    modalidad_atencion: 'PRESENCIAL', // 'PRESENCIAL' | 'ONLINE'
    link_videoconsulta: ''
  });

  const [recipeToPrint, setRecipeToPrint] = useState(null);
  const [informeProrrogaPreview, setInformeProrrogaPreview] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const selectedDoctor = profesionales.find(p => p.id === selectedDoctorId);

  // Turnos del día de este profesional
  const doctorTurnosHoy = turnos
    .filter(t => t.profesional_id === selectedDoctorId && t.fecha === todayStr && t.estado !== 'CANCELADO')
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  // Turnos futuros
  const doctorTurnosFuturos = turnos
    .filter(t => t.profesional_id === selectedDoctorId && t.fecha > todayStr && t.estado !== 'CANCELADO')
    .sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
      return a.hora_inicio.localeCompare(b.hora_inicio);
    });

  const enEspera = doctorTurnosHoy.filter(t => t.estado === 'EN_ESPERA');
  const enAtencion = doctorTurnosHoy.find(t => t.estado === 'EN_ATENCION');
  const atendidos = doctorTurnosHoy.filter(t => t.estado === 'ATENDIDO');
  const programados = doctorTurnosHoy.filter(t => t.estado === 'PROGRAMADO');

  // Paciente en atención actual
  const currentTurno = enAtencion || (activeTurnoId ? doctorTurnosHoy.find(t => t.id === activeTurnoId) : null);
  const currentPaciente = currentTurno ? pacientes.find(p => p.id === currentTurno.paciente_id) : null;
  const currentOs = currentTurno ? obrasSociales.find(o => o.id === currentTurno.obra_social_id) : null;
  const currentPlan = currentTurno ? planes.find(p => p.id === currentTurno.plan_id) : null;
  const currentPractica = currentTurno ? nomenclador.find(p => p.id === currentTurno.practica_id) : null;
  const currentCons = currentTurno ? consultorios.find(c => c.id === currentTurno.consultorio_id) : null;

  // Actualizar formulario cuando cambia el paciente actual
  useEffect(() => {
    if (currentTurno && currentPaciente) {
      const isPsico = selectedDoctor?.especialidad?.toLowerCase().includes('psicol');
      const videoRoom = `https://meet.jit.si/SanLucas-Consulta-${currentTurno.codigo_reserva}`;

      setEvolucionForm(prev => ({
        ...prev,
        motivo_consulta: currentTurno.observaciones || currentPractica?.descripcion || (isPsico ? 'Sesión de Psicoterapia Individual' : 'Consulta Médica General'),
        diagnostico_cie10: isPsico ? 'F41.1 - Trastorno de ansiedad generalizada (TAG)' : 'I10 - Hipertensión esencial (primaria)',
        link_videoconsulta: videoRoom
      }));
    }
  }, [currentTurno?.id]);

  // Llamar paciente al consultorio
  const handleLlamarPaciente = (turno) => {
    updateTurnoEstado(turno.id, 'EN_ATENCION');
    setActiveTurnoId(turno.id);

    const consultorioNombre = currentCons?.nombre || 'Consultorio';
    const doctorNombre = `Lic./Dr(a). ${selectedDoctor?.nombre} ${selectedDoctor?.apellido}`;
    StorageService.addTvCall(turno, consultorioNombre, doctorNombre);
  };

  // Dictado por voz (Web Speech API)
  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (speechRecognitionInstance) {
        speechRecognitionInstance.stop();
      }
      setIsRecording(false);
    } else {
      const recognition = AiService.iniciarDictadoVoz({
        onResultado: (texto) => {
          setEvolucionForm(prev => ({
            ...prev,
            anamnesis_examen_fisico: (prev.anamnesis_examen_fisico ? prev.anamnesis_examen_fisico + ' ' : '') + texto
          }));
        },
        onError: (err) => {
          alert(err);
          setIsRecording(false);
        },
        onFinalizado: () => {
          setIsRecording(false);
        }
      });
      if (recognition) {
        setSpeechRecognitionInstance(recognition);
        setIsRecording(true);
      }
    }
  };

  // Estructurar Nota de Sesión con IA
  const handleEstructurarNotaConIA = () => {
    const estructurado = AiService.estructurarNotaClinica({
      notasBorrador: evolucionForm.anamnesis_examen_fisico || evolucionForm.motivo_consulta,
      pacienteNombre: currentPaciente ? `${currentPaciente.nombre} ${currentPaciente.apellido}` : 'Paciente',
      enfoque: 'Cognitivo-Conductual / Sistémico'
    });

    setEvolucionForm(prev => ({
      ...prev,
      anamnesis_examen_fisico: `[SUBJETIVO]\n${estructurado.subjetivo}\n\n[OBJETIVO / ENCUADRE]\n${estructurado.objetivo}`,
      diagnostico_descripcion: estructurado.analisis,
      plan_tratamiento: estructurado.planTratamiento
    }));
  };

  // Generar Informe de Prórroga APROSS / OSDE / CPPC con IA
  const handleGenerarInformeProrroga = () => {
    if (!currentPaciente || !selectedDoctor) return;

    const informe = AiService.generarInformeProrroga({
      profesional: selectedDoctor,
      paciente: currentPaciente,
      obraSocial: currentOs,
      sesionesRealizadas: 25,
      sesionesSolicitadas: 15,
      diagnostico: evolucionForm.diagnostico_cie10,
      objetivosTerapeuticos: evolucionForm.plan_tratamiento || 'Consolidar herramientas de autorregulación emocional y prevención de recaídas.'
    });

    setInformeProrrogaPreview(informe);
  };

  // Sesiones anteriores del paciente actual
  const prevSessions = currentPaciente
    ? atencionesHce.filter(a => a.paciente_id === currentPaciente.id).sort((a, b) => new Date(b.fecha_atencion) - new Date(a.fecha_atencion))
    : [];

  // Plantillas rápidas de encuadre
  const applyClinicalTemplate = (tipo) => {
    if (tipo === 'ADMISIÓN') {
      setEvolucionForm(prev => ({
        ...prev,
        motivo_consulta: 'Primera Entrevista / Admisión Clínica y Encuadre Terapéutico',
        anamnesis_examen_fisico: '1. Motivo de Consulta Manifiesto y Latente:\n2. Historia del Problema Actual y Desencadenantes:\n3. Antecedentes Personales y Red de Apoyo:\n4. Examen del Estado Psíquico (Orientación, Ánimo, Afecto, Ansiedad):\n5. Encuadre Acordado (Frecuencia semanal, honorarios, modalidad):',
        plan_tratamiento: 'Evaluación diagnóstica en próximas 2 sesiones. Psicoeducación inicial.'
      }));
    } else if (tipo === 'SEGUIMIENTO') {
      setEvolucionForm(prev => ({
        ...prev,
        motivo_consulta: 'Sesión de Psicoterapia / Seguimiento y Revisión de Tareas',
        anamnesis_examen_fisico: '1. Estado Actual y Revisión de Tareas Inter-sesión:\n2. Situaciones Disparadoras de Ansiedad/Malestar en la semana:\n3. Intervenciones Clínicas / Reestructuración Cognitiva:\n4. Respuesta del Paciente e Insights:',
        plan_tratamiento: '1. Registro de autoregistro conductual.\n2. Práctica de respiración diafragmática y defusión cognitiva.'
      }));
    } else if (tipo === 'CRISIS') {
      setEvolucionForm(prev => ({
        ...prev,
        motivo_consulta: 'Atención / Intervención en Crisis Aguda',
        anamnesis_examen_fisico: '1. Desencadenante Inmediato de la Crisis:\n2. Evaluación de Riesgo (Ideación, Conducta, Contención Familiar):\n3. Técnicas de Estabilización y Desescalada Emocional:\n4. Contacto de Red de Apoyo y Acuerdos de Seguridad:',
        plan_tratamiento: 'Plan de seguridad activo. Seguimiento telefónico a las 48hs. Derivación a psiquiatría o interconsulta si corresponde.'
      }));
    } else if (tipo === 'ALTA') {
      setEvolucionForm(prev => ({
        ...prev,
        motivo_consulta: 'Sesión de Cierre / Consolidación de Logros y Alta Terapéutica',
        anamnesis_examen_fisico: '1. Evaluación de Objetivos Alcanzados vs Estado Inicial:\n2. Herramientas y Recursos Consolidados por el Paciente:\n3. Plan de Prevención de Recaídas:\n4. Despedida y Encuadre de Puertas Abiertas:',
        plan_tratamiento: 'Alta del proceso terapéutico regular. Sesión de control optativa a los 3 meses.'
      }));
    }
  };

  // Finalizar atención y guardar HCE
  const handleFinalizarAtencion = (e) => {
    e.preventDefault();
    if (!currentTurno || !currentPaciente) return;

    saveAtencionHce({
      turno_id: currentTurno.id,
      paciente_id: currentPaciente.id,
      profesional_id: selectedDoctorId,
      fecha_atencion: new Date().toISOString(),
      motivo_consulta: evolucionForm.motivo_consulta,
      anamnesis_examen_fisico: evolucionForm.anamnesis_examen_fisico,
      diagnostico_cie10: evolucionForm.diagnostico_cie10,
      diagnostico_descripcion: evolucionForm.diagnostico_descripcion,
      receta_indicaciones: evolucionForm.receta_indicaciones,
      plan_tratamiento: evolucionForm.plan_tratamiento,
      modalidad_atencion: evolucionForm.modalidad_atencion
    });

    updateTurnoEstado(currentTurno.id, 'ATENDIDO');
    setActiveTurnoId(null);
    setZenMode(false);
    setShowTimeline(false);
    setEvolucionForm({
      motivo_consulta: '',
      anamnesis_examen_fisico: '',
      diagnostico_cie10: 'F41.1 - Trastorno de ansiedad generalizada (TAG)',
      diagnostico_descripcion: '',
      receta_indicaciones: '',
      plan_tratamiento: '',
      modalidad_atencion: 'PRESENCIAL',
      link_videoconsulta: ''
    });
  };

  // Imprimir receta
  const handlePrintRecipe = () => {
    setRecipeToPrint({
      paciente: currentPaciente,
      doctor: selectedDoctor,
      diagnostico: evolucionForm.diagnostico_cie10,
      receta: evolucionForm.receta_indicaciones
    });
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER DEL PORTAL DEL PROFESIONAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-600/20">
            {selectedDoctor?.especialidad?.toLowerCase().includes('psicol') ? <Brain className="w-6 h-6" /> : <Stethoscope className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                Consultorio de {selectedDoctor?.nombre} {selectedDoctor?.apellido}
              </h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                {selectedDoctor?.matricula_provincial || selectedDoctor?.matricula_nacional || 'M.P. 10.492 CPPC'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {selectedDoctor?.especialidad} • {currentCons?.nombre || 'Consultorio Asignado'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAgendarModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Agendar Próxima Sesión</span>
          </button>
        </div>
      </div>

      {/* TABS DE VISTA */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs w-fit">
        <button
          type="button"
          onClick={() => setPortalTab('hoy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            portalTab === 'hoy'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Atención & Sala de Espera Hoy ({doctorTurnosHoy.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setPortalTab('futuros')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            portalTab === 'futuros'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Próximas Sesiones ({doctorTurnosFuturos.length})</span>
        </button>
      </div>

      {/* CONTENIDO TAB 1: SALA DE ESPERA & CONSULTORIO ACTIVO */}
      {portalTab === 'hoy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUMNA IZQUIERDA: SALA DE ESPERA (4 COLS o Oculta en Modo Zen) */}
          <div className={zenMode ? 'hidden' : 'lg:col-span-4 space-y-4'}>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Pacientes en Espera ({enEspera.length})
                </span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[11px] font-black">
                  {enEspera.length} presentes
                </span>
              </div>

              {enEspera.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 font-medium">
                  No hay pacientes esperando en sala en este momento.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {enEspera.map((t) => {
                    const pac = pacientes.find(p => p.id === t.paciente_id);
                    const os = obrasSociales.find(o => o.id === t.obra_social_id);
                    const plan = planes.find(p => p.id === t.plan_id);

                    return (
                      <div 
                        key={t.id}
                        className="p-3.5 bg-amber-50/70 border border-amber-300/80 rounded-2xl shadow-xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-black text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded">
                                {t.hora_inicio} hs
                              </span>
                              <span className="font-mono text-[11px] text-slate-600 font-bold">
                                {t.codigo_reserva}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 mt-1">
                              {pac ? `${pac.apellido}, ${pac.nombre}` : 'Paciente'}
                            </h4>
                            <span className="text-[11px] text-slate-600 font-medium">
                              {os?.sigla || os?.nombre} {plan ? `(${plan.nombre_plan})` : ''}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleLlamarPaciente(t)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4 animate-bounce" />
                          <span>Llamar al Consultorio / TV</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Próximos Turnos de Hoy */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="font-bold text-xs text-slate-500 uppercase tracking-wider block border-b border-slate-100 pb-2">
                Próximos Turnos de Hoy ({programados.length})
              </span>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {programados.map(t => {
                  const pac = pacientes.find(p => p.id === t.paciente_id);
                  return (
                    <div key={t.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-700">{t.hora_inicio}</span>
                      <span className="font-bold text-slate-900 truncate max-w-[150px]">{pac?.apellido}, {pac?.nombre}</span>
                      <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">Programado</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: HISTORIA CLÍNICA & SESIÓN ASISTIDA POR IA (8 COLS o 12 COLS en Modo Zen) */}
          <div className={zenMode ? 'lg:col-span-12 space-y-4 max-w-4xl mx-auto w-full transition-all' : 'lg:col-span-8 space-y-4 transition-all'}>
            {currentPaciente && currentTurno ? (
              <form onSubmit={handleFinalizarAtencion} className="bg-white p-6 sm:p-8 rounded-3xl border border-indigo-200 shadow-md space-y-6">
                
                {/* Header Paciente Actual */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-black text-indigo-800">
                      Sesión / Consulta en Atención Actual
                    </span>
                    <h3 className="text-xl font-black text-slate-900">
                      {currentPaciente.apellido}, {currentPaciente.nombre}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-0.5 font-medium">
                      <span>DNI: <strong>{currentPaciente.dni}</strong></span>
                      <span>•</span>
                      <span>Cobertura: <strong>{currentOs?.nombre} {currentPlan ? `(${currentPlan.nombre_plan})` : ''}</strong></span>
                      <span>•</span>
                      <span>Motivo: <strong>{currentPractica?.descripcion || 'Psicoterapia'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTimeline(!showTimeline)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        showTimeline
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-indigo-700 hover:bg-indigo-50 border-indigo-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Historial Sesiones ({prevSessions.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setZenMode(!zenMode)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        zenMode
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                      }`}
                      title={zenMode ? "Salir de Modo Zen" : "Activar Modo Enfoque Zen"}
                    >
                      <span>{zenMode ? 'Normal' : 'Modo Zen'}</span>
                    </button>

                    <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" /> En Sesión
                    </span>
                  </div>
                </div>

                {/* TIMELINE DE SESIONES PREVIAS DEL PACIENTE (DESPLEGABLE) */}
                {showTimeline && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        Línea de Tiempo de Evoluciones Anteriores ({prevSessions.length} registros)
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowTimeline(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        Cerrar
                      </button>
                    </div>

                    {prevSessions.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        Esta es la primera sesión registrada en Historia Clínica para este paciente.
                      </p>
                    ) : (
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {prevSessions.map((ses, idx) => (
                          <div key={ses.id || idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-xs shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-indigo-700">{formatDateAR(ses.fecha_atencion)}</span>
                              <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded font-semibold">
                                {ses.diagnostico_cie10 || 'Psicoterapia'}
                              </span>
                            </div>
                            <p className="font-medium text-slate-800 font-sans line-clamp-2">
                              {ses.anamnesis_examen_fisico || ses.motivo_consulta}
                            </p>
                            {ses.plan_tratamiento && (
                              <p className="text-[11px] text-slate-500 italic">
                                Plan acordado: {ses.plan_tratamiento}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* MODALIDAD Y TELEPSICOLOGÍA */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-700">Modalidad:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEvolucionForm({ ...evolucionForm, modalidad_atencion: 'PRESENCIAL' })}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                          evolucionForm.modalidad_atencion === 'PRESENCIAL'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        Presencial
                      </button>
                      <button
                        type="button"
                        onClick={() => setEvolucionForm({ ...evolucionForm, modalidad_atencion: 'ONLINE' })}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                          evolucionForm.modalidad_atencion === 'ONLINE'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        Online / Videoconsulta
                      </button>
                    </div>
                  </div>

                  {evolucionForm.modalidad_atencion === 'ONLINE' && (
                    <div className="flex items-center gap-2">
                      <a
                        href={evolucionForm.link_videoconsulta}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Abrir Sala Virtual</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(evolucionForm.link_videoconsulta);
                          alert('Enlace de videoconsulta copiado al portapapeles para enviar al paciente por WhatsApp.');
                        }}
                        className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-xl cursor-pointer"
                        title="Copiar link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* PLANTILLAS RÁPIDAS DE ENCUADRE CLÍNICO */}
                <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-1.5">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Plantillas Clínicas en 1 Clic:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'ADMISIÓN', label: '🌱 Admisión / 1ra Entrevista' },
                      { id: 'SEGUIMIENTO', label: '🔄 Seguimiento TCC / Sesión Regular' },
                      { id: 'CRISIS', label: '⚡ Intervención en Crisis' },
                      { id: 'ALTA', label: '🎓 Cierre / Alta Terapéutica' }
                    ].map(tpl => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => applyClinicalTemplate(tpl.id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition cursor-pointer"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* HERRAMIENTAS ASISTIDAS POR IA */}
                <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-sky-50 border border-indigo-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Asistente Clínico Inteligente (Voz & IA)
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-white/80 px-2 py-0.5 rounded-full border border-indigo-200">
                      Confidencialidad Ética Garantizada
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isRecording
                          ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30'
                          : 'bg-white text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      <span>{isRecording ? 'Grabando voz en vivo...' : 'Dictar por Voz'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleEstructurarNotaConIA}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Estructurar Nota de Sesión con IA</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerarInformeProrroga}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Generar Informe de Prórroga (APROSS/CPPC)</span>
                    </button>
                  </div>
                </div>

                {/* FORMULARIO DE NOTA CLÍNICA */}
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Motivo / Tema Abordado en la Sesión *</label>
                    <input
                      type="text"
                      required
                      value={evolucionForm.motivo_consulta}
                      onChange={(e) => setEvolucionForm({ ...evolucionForm, motivo_consulta: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Evolución Clínica / Registro de Sesión (Confidencial)
                    </label>
                    <textarea
                      rows="4"
                      placeholder="Describe la dinámica de la sesión, intervenciones realizadas y respuesta del paciente..."
                      value={evolucionForm.anamnesis_examen_fisico}
                      onChange={(e) => setEvolucionForm({ ...evolucionForm, anamnesis_examen_fisico: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Diagnóstico Codificado CIE-10 / DSM-5 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Diagnóstico Codificado (CIE-10 / DSM-5) *</label>
                      <select
                        value={evolucionForm.diagnostico_cie10}
                        onChange={(e) => setEvolucionForm({ ...evolucionForm, diagnostico_cie10: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white focus:ring-2 focus:ring-indigo-500"
                      >
                        {CIE10_DSM5_CATALOGO.map(c => (
                          <option key={c.code} value={`${c.code} - ${c.desc}`}>
                            {c.code} - {c.desc} {c.dsm ? `(DSM: ${c.dsm})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hipótesis / Detalle Clínico Específico</label>
                      <input
                        type="text"
                        placeholder="ej: Crisis de angustia situacional con remisión progresiva"
                        value={evolucionForm.diagnostico_descripcion}
                        onChange={(e) => setEvolucionForm({ ...evolucionForm, diagnostico_descripcion: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Plan Terapéutico y Tareas */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Plan Terapéutico & Tareas / Acuerdos para la Próxima Sesión</label>
                    <textarea
                      rows="2"
                      placeholder="ej: 1. Registro de pensamientos automáticos. 2. Técnica de respiración diafragmática ante picos de activación."
                      value={evolucionForm.plan_tratamiento}
                      onChange={(e) => setEvolucionForm({ ...evolucionForm, plan_tratamiento: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Receta / Indicaciones Farmacológicas o Certificados */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-black text-slate-900 flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-indigo-600" /> Prescripción / Indicaciones o Certificados
                      </label>
                      {evolucionForm.receta_indicaciones && (
                        <button
                          type="button"
                          onClick={handlePrintRecipe}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir Documento</span>
                        </button>
                      )}
                    </div>
                    <textarea
                      rows="2"
                      placeholder="Indicaciones terapéuticas, derivaciones a psiquiatría o estudios solicitados..."
                      value={evolucionForm.receta_indicaciones}
                      onChange={(e) => setEvolucionForm({ ...evolucionForm, receta_indicaciones: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                {/* BOTONES DE FINALIZACIÓN */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveTurnoId(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cerrar sin guardar
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/20 transition transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar Registro Clínico y Finalizar Sesión</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white p-16 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 space-y-3">
                <Brain className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="text-base font-extrabold text-slate-700">Consultorio Listo para la Atención</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Selecciona a un paciente de la lista de <strong>"Pacientes en Espera"</strong> a la izquierda y presiona <strong>"Llamar al Consultorio"</strong> para emitir el aviso sonoro en pantalla TV y cargar su registro clínico asistido.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 2: PRÓXIMAS SESIONES FUTURAS */}
      {portalTab === 'futuros' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900">Agenda de Pacientes Citados para Próximos Días</h3>
              <p className="text-xs text-slate-500">Sesiones programadas y turnos recurrentes</p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-800 rounded-xl text-xs font-black">
              {doctorTurnosFuturos.length} pacientes programados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3">Fecha & Hora</th>
                  <th className="py-3 px-3">Paciente & DNI</th>
                  <th className="py-3 px-3">Motivo / Práctica</th>
                  <th className="py-3 px-3">Cobertura</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {doctorTurnosFuturos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No registra turnos futuros agendados en este momento.
                    </td>
                  </tr>
                ) : (
                  doctorTurnosFuturos.map((t) => {
                    const pac = pacientes.find(p => p.id === t.paciente_id);
                    const os = obrasSociales.find(o => o.id === t.obra_social_id);
                    const plan = planes.find(p => p.id === t.plan_id);
                    const practica = nomenclador.find(p => p.id === t.practica_id);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {t.codigo_reserva}
                          {t.nro_sesion && (
                            <span className="block text-[9px] text-indigo-700 font-black">
                              Sesión {t.nro_sesion}/{t.total_sesiones}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {formatDateAR(t.fecha)} • <span className="text-indigo-700 font-black">{t.hora_inicio} hs</span>
                        </td>
                        <td className="py-3 px-3">
                          <strong className="text-slate-900">{pac ? `${pac.apellido}, ${pac.nombre}` : 'Paciente'}</strong>
                          <span className="block text-[11px] text-slate-500">DNI {pac?.dni} • {pac?.telefono_whatsapp || 'Sin tel'}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span>{practica?.descripcion || 'Sesión de Psicoterapia'}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span>{os?.nombre || 'Particular'}</span>
                          {plan && <span className="block text-[11px] text-slate-500">{plan.nombre_plan}</span>}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            t.estado === 'CONFIRMADO' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {t.confirmado_whatsapp ? 'Confirmado WhatsApp' : t.estado}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setTurnoToReprogram(t);
                                setShowReprogramModal(true);
                              }}
                              className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                              title="Reprogramar"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setTurnoToCancel(t);
                                setShowCancelModal(true);
                              }}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Cancelar"
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

      {/* MODAL INFORME DE PRÓRROGA APROSS / CPPC GENERADO POR IA */}
      {informeProrrogaPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 no-print">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">
                    Informe de Prórroga / Justificación Clínica a Obra Social
                  </h3>
                  <span className="text-[11px] text-indigo-700 font-bold">
                    Generado automáticamente con IA conforme a requerimientos de APROSS / CPPC
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  onClick={() => setInformeProrrogaPreview(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CUERPO DEL INFORME (A4) */}
            <div className="p-8 border border-slate-200 rounded-2xl bg-white space-y-6 text-slate-900 text-xs leading-relaxed font-serif">
              <div className="text-center border-b border-slate-300 pb-4 space-y-1">
                <h2 className="text-base font-bold uppercase tracking-wider">{informeProrrogaPreview.titulo}</h2>
                <p className="text-[11px] text-slate-500 font-sans">{informeProrrogaPreview.lugar} • {informeProrrogaPreview.fecha}</p>
              </div>

              <div className="font-sans text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p><strong>Destinatario:</strong> {informeProrrogaPreview.destinatario}</p>
                <p><strong>Paciente:</strong> {informeProrrogaPreview.datosPaciente.nombreCompleto} (DNI: {informeProrrogaPreview.datosPaciente.dni} • Afiliado: {informeProrrogaPreview.datosPaciente.numeroAfiliado})</p>
                <p><strong>Profesional:</strong> {informeProrrogaPreview.datosProfesional.nombreCompleto} ({informeProrrogaPreview.datosProfesional.matricula} - {informeProrrogaPreview.datosProfesional.colegio})</p>
                <p><strong>Diagnóstico (CIE-10):</strong> <span className="font-bold">{informeProrrogaPreview.diagnosticoClinico}</span></p>
              </div>

              <div className="space-y-3 text-justify">
                <p>{informeProrrogaPreview.cuerpoInforme}</p>
                <p>{informeProrrogaPreview.evolucionClinica}</p>
                <p>{informeProrrogaPreview.fundamentacionProrroga}</p>
                <p><strong>Objetivos Terapéuticos de la Próxima Etapa:</strong> {informeProrrogaPreview.objetivosProximaEtapa}</p>
                <p><strong>Frecuencia Sugerida:</strong> {informeProrrogaPreview.frecuenciaSugerida}</p>
                <p>{informeProrrogaPreview.conclusion}</p>
              </div>

              <div className="pt-12 flex justify-end">
                <div className="text-center font-sans text-xs space-y-1 border-t border-slate-400 pt-2 w-64">
                  <p className="font-bold">{informeProrrogaPreview.datosProfesional.nombreCompleto}</p>
                  <p className="text-slate-600">{informeProrrogaPreview.datosProfesional.matricula}</p>
                  <p className="text-[10px] text-slate-400">Firma y Sello Profesional</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODALES DE GESTIÓN */}
      <AgendarTurnoSecretariaModal
        isOpen={showAgendarModal}
        defaultProfId={selectedDoctorId}
        onClose={() => setShowAgendarModal(false)}
      />

      <ReprogramarTurnoModal
        isOpen={showReprogramModal}
        turno={turnoToReprogram}
        onClose={() => setShowReprogramModal(false)}
      />

      <CancelarTurnoModal
        isOpen={showCancelModal}
        turno={turnoToCancel}
        canceladoPor="PROFESIONAL"
        onClose={() => setShowCancelModal(false)}
      />

    </div>
  );
};
