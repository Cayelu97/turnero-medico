import React, { useState } from 'react';
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
  XCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { WhatsAppService } from '../../services/whatsapp';
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

  React.useEffect(() => {
    if (currentUser?.rol === 'PROFESIONAL' && currentUser?.profesional_id) {
      setSelectedDoctorId(currentUser.profesional_id);
    }
  }, [currentUser]);

  // Turno que está siendo atendido actualmente
  const [activeTurnoId, setActiveTurnoId] = useState(null);
  const [portalTab, setPortalTab] = useState('hoy'); // 'hoy' | 'futuros' | 'historial'
  const [showAgendarModal, setShowAgendarModal] = useState(false);
  const [showReprogramModal, setShowReprogramModal] = useState(false);
  const [turnoToReprogram, setTurnoToReprogram] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [turnoToCancel, setTurnoToCancel] = useState(null);

  // Formulario de evolución clínica en vivo
  const [evolucionForm, setEvolucionForm] = useState({
    motivo_consulta: '',
    anamnesis_examen_fisico: '',
    diagnostico_cie10: 'I10 - Hipertensión esencial (primaria)',
    diagnostico_descripcion: '',
    receta_indicaciones: '',
    plan_tratamiento: ''
  });

  const [recipeToPrint, setRecipeToPrint] = useState(null);

  const CIE10_LIST = [
    { code: 'I10', desc: 'Hipertensión esencial (primaria)' },
    { code: 'E11', desc: 'Diabetes mellitus tipo 2' },
    { code: 'J00', desc: 'Rinofaringitis aguda (resfriado común)' },
    { code: 'J20', desc: 'Bronquitis aguda' },
    { code: 'M54.5', desc: 'Lumbago no especificado' },
    { code: 'R07.4', desc: 'Dolor en el pecho, no especificado' },
    { code: 'K21', desc: 'Enfermedad por reflujo gastroesofágico' },
    { code: 'N39.0', desc: 'Infección de vías urinarias' },
    { code: 'F41.1', desc: 'Trastorno de ansiedad generalizada' },
    { code: 'Z00.0', desc: 'Examen médico general de rutina' }
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  const selectedDoctor = profesionales.find(p => p.id === selectedDoctorId);

  // Turnos del día de este médico
  const doctorTurnosHoy = turnos
    .filter(t => t.profesional_id === selectedDoctorId && t.fecha === todayStr && t.estado !== 'CANCELADO')
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  // Turnos futuros de este médico (a partir de mañana)
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

  // Llamar al paciente (Dispara TV y cambia a EN_ATENCION)
  const handleLlamarPaciente = (turno) => {
    updateTurnoEstado(turno.id, 'EN_ATENCION');
    setActiveTurnoId(turno.id);
    setEvolucionForm({
      motivo_consulta: turno.observaciones || 'Consulta de rutina',
      anamnesis_examen_fisico: '',
      diagnostico_cie10: 'I10 - Hipertensión esencial (primaria)',
      diagnostico_descripcion: '',
      receta_indicaciones: '',
      plan_tratamiento: ''
    });
  };

  // Finalizar atención y guardar HCE
  const handleFinalizarAtencion = (e) => {
    e.preventDefault();
    if (!currentTurno || !currentPaciente) return;

    // Guardar HCE
    saveAtencionHce({
      turno_id: currentTurno.id,
      paciente_id: currentPaciente.id,
      profesional_id: selectedDoctorId,
      ...evolucionForm,
      fecha_atencion: new Date().toISOString()
    });

    // Cambiar estado a ATENDIDO
    updateTurnoEstado(currentTurno.id, 'ATENDIDO');
    setActiveTurnoId(null);
  };

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header del Consultorio Digital */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm"
            style={{ backgroundColor: selectedDoctor?.color_agenda || '#0284c7' }}
          >
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                Consultorio Digital • Dr(a). {selectedDoctor?.nombre} {selectedDoctor?.apellido}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-sky-100 text-sky-800 rounded-md">
                {selectedDoctor?.especialidad}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedDoctor?.matricula_nacional} • {selectedDoctor?.matricula_provincial} • {clinica.nombre}
            </p>
          </div>
        </div>

        {/* Selector de Médico y Botón Nuevo Turno */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAgendarModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-black shadow-md shadow-medical-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Agendar Próximo Turno</span>
          </button>

          {currentUser?.rol !== 'PROFESIONAL' ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">Supervisar Médico:</span>
              <select
                value={selectedDoctorId}
                onChange={(e) => {
                  setSelectedDoctorId(e.target.value);
                  setActiveTurnoId(null);
                }}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-medical-500"
              >
                {profesionales.map(p => (
                  <option key={p.id} value={p.id}>Dr(a). {p.nombre} {p.apellido}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-extrabold text-purple-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Consultorio Personal Exclusivo</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs del Portal Médico */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs w-fit">
        <button
          type="button"
          onClick={() => setPortalTab('hoy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            portalTab === 'hoy'
              ? 'bg-medical-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Atención & Sala de Espera Hoy ({doctorTurnosHoy.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setPortalTab('futuros')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            portalTab === 'futuros'
              ? 'bg-medical-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Mis Próximos Turnos (Futuros - {doctorTurnosFuturos.length})</span>
        </button>
      </div>

      {/* TAB 2: VISTA DE TURNOS FUTUROS DEL MÉDICO */}
      {portalTab === 'futuros' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Agenda de Pacientes Citados para Próximos Días</h3>
              <p className="text-xs text-slate-500">Visualiza quiénes tienen turno agendado en los próximos días o semanas</p>
            </div>
            <span className="px-3 py-1 bg-sky-100 text-sky-800 rounded-xl text-xs font-black">
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
                  <th className="py-3 px-3">Observaciones</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {doctorTurnosFuturos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
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
                          <span className="block text-[11px] text-slate-500">DNI {pac?.dni} • {pac?.telefono_whatsapp || 'Sin tel'}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span>{practica?.descripcion || 'Consulta Médica'}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span>{os?.nombre || 'Particular'}</span>
                          {plan && <span className="block text-[11px] text-slate-500">Plan {plan.nombre_plan}</span>}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            t.estado === 'CONFIRMADO' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {t.confirmado_whatsapp ? 'Confirmado WhatsApp' : t.estado}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                          {t.observaciones || '—'}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setTurnoToReprogram(t);
                                setShowReprogramModal(true);
                              }}
                              className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition"
                              title="Reprogramar"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setTurnoToCancel(t);
                                setShowCancelModal(true);
                              }}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
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

      {/* TAB 1: SALA DE ESPERA Y ATENCIÓN HOY */}
      {portalTab === 'hoy' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: SALA DE ESPERA DEL MÉDICO (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Tarjeta de Pacientes en Espera */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
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
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
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
                          <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                            {pac ? `${pac.apellido}, ${pac.nombre}` : 'Paciente'}
                          </h4>
                          <span className="text-[11px] text-slate-600 font-medium">
                            {os?.sigla || os?.nombre} {plan ? `(${plan.nombre_plan})` : ''}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleLlamarPaciente(t)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md shadow-purple-600/20 transition transform active:scale-95"
                      >
                        <Volume2 className="w-4 h-4 animate-bounce" />
                        <span>Llamar al Consultorio (TV)</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Próximos Turnos Programados */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <span className="font-extrabold text-xs text-slate-500 uppercase tracking-wider block border-b border-slate-100 pb-2">
              Próximos Turnos de Hoy ({programados.length})
            </span>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {programados.map(t => {
                const pac = pacientes.find(p => p.id === t.paciente_id);
                return (
                  <div key={t.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-700">{t.hora_inicio}</span>
                    <span className="font-bold text-slate-900 truncate max-w-[150px]">{pac?.apellido}, {pac?.nombre}</span>
                    <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded font-bold">Pendiente</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: CONSULTORIO ACTIVO & HISTORIA CLÍNICA (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {currentPaciente && currentTurno ? (
            <form onSubmit={handleFinalizarAtencion} className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-medical-500/30 shadow-md space-y-6">
              {/* Header Paciente Actual */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-medical-50 p-4 rounded-2xl border border-medical-200">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-black text-medical-800">
                    Paciente en Atención Actual
                  </span>
                  <h3 className="text-xl font-black text-slate-900">
                    {currentPaciente.apellido}, {currentPaciente.nombre}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5 font-medium">
                    <span>DNI: <strong>{currentPaciente.dni}</strong></span>
                    <span>•</span>
                    <span>Cobertura: <strong>{currentOs?.nombre} {currentPlan ? `(${currentPlan.nombre_plan})` : ''}</strong></span>
                    <span>•</span>
                    <span>Motivo: <strong>{currentPractica?.descripcion}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-purple-600 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5" /> En Consultorio
                  </span>
                </div>
              </div>

              {/* Antecedentes y Alergias del Paciente */}
              {(currentPaciente.alergias || currentPaciente.antecedentes) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {currentPaciente.alergias && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                      <strong className="text-rose-900 block font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Alergias:
                      </strong>
                      <span className="text-rose-800 font-medium">{currentPaciente.alergias}</span>
                    </div>
                  )}
                  {currentPaciente.antecedentes && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <strong className="text-slate-800 block font-bold">Antecedentes:</strong>
                      <span className="text-slate-600">{currentPaciente.antecedentes}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Formulario de Evolución Médica */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Motivo de Consulta y Síntomas *</label>
                  <input
                    type="text"
                    required
                    value={evolucionForm.motivo_consulta}
                    onChange={(e) => setEvolucionForm({ ...evolucionForm, motivo_consulta: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Anamnesis y Examen Físico</label>
                  <textarea
                    rows="3"
                    placeholder="ej: TA: 125/80 mmHg, Auscultación cardíaca sin soplos, murmullo vesicular conservado..."
                    value={evolucionForm.anamnesis_examen_fisico}
                    onChange={(e) => setEvolucionForm({ ...evolucionForm, anamnesis_examen_fisico: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500"
                  />
                </div>

                {/* Diagnóstico CIE-10 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Diagnóstico Codificado (CIE-10) *</label>
                    <select
                      value={evolucionForm.diagnostico_cie10}
                      onChange={(e) => setEvolucionForm({ ...evolucionForm, diagnostico_cie10: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                    >
                      {CIE10_LIST.map(c => (
                        <option key={c.code} value={`${c.code} - ${c.desc}`}>{c.code} - {c.desc}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Detalle / Diagnóstico Específico</label>
                    <input
                      type="text"
                      placeholder="ej: HTA estadío 1 controlada"
                      value={evolucionForm.diagnostico_descripcion}
                      onChange={(e) => setEvolucionForm({ ...evolucionForm, diagnostico_descripcion: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500"
                    />
                  </div>
                </div>

                {/* Receta e Indicaciones */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-indigo-600" /> Prescripción y Receta Médica Digital
                    </label>
                    {evolucionForm.receta_indicaciones && (
                      <button
                        type="button"
                        onClick={handlePrintRecipe}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir Receta</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    rows="3"
                    placeholder="ej: Losartán 50mg: Tomar 1 comprimido por la mañana en ayunas. Cantidad: 30 comp. Dieta baja en sodio."
                    value={evolucionForm.receta_indicaciones}
                    onChange={(e) => setEvolucionForm({ ...evolucionForm, receta_indicaciones: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-medical-500 bg-white"
                  />
                </div>
                {/* Próximo Turno de Control / Seguimiento */}
                <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">
                        Próximo Turno de Control para {currentPaciente?.nombre} {currentPaciente?.apellido}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Asigna el próximo turno de seguimiento y envía el recordatorio a su WhatsApp en 1 clic
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAgendarModal(true)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-black text-xs shadow-md shadow-sky-600/20 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Asignar Turno de Control</span>
                  </button>
                </div>
              </div>

              {/* Botones de Finalización */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTurnoId(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cerrar sin guardar
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/20 transition transform hover:-translate-y-0.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Historia Clínica y Finalizar Atención</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white p-16 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 space-y-3">
              <Stethoscope className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="text-base font-extrabold text-slate-700">Consultorio Listo para la Atención</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Selecciona a un paciente de la lista de <strong>"Pacientes en Espera"</strong> a la izquierda y presiona <strong>"Llamar al Consultorio"</strong> para emitir el aviso sonoro y cargar su ficha clínica.
              </p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* ÁREA IMPRIMIBLE DE RECETA MÉDICA */}
      {recipeToPrint && (
        <div id="printable-area" className="hidden print:block p-8 text-black bg-white space-y-6">
          <div className="border-b-2 border-black pb-4 text-center">
            <h2 className="text-xl font-bold">{clinica.nombre}</h2>
            <p className="text-xs">{clinica.direccion} • Tel: {clinica.telefono}</p>
            <h3 className="text-sm font-bold mt-2 uppercase tracking-widest">RECETARIO MÉDICO OFICIAL</h3>
          </div>

          <div className="text-xs space-y-1">
            <p><strong>Paciente:</strong> {recipeToPrint.paciente?.nombre} {recipeToPrint.paciente?.apellido}</p>
            <p><strong>DNI:</strong> {recipeToPrint.paciente?.dni}</p>
            <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-AR')}</p>
            <p><strong>Diagnóstico:</strong> {recipeToPrint.diagnostico}</p>
          </div>

          <div className="my-8 border border-black p-6 rounded-lg min-h-[250px]">
            <span className="font-bold text-sm block mb-3">Rp/</span>
            <pre className="font-mono text-sm whitespace-pre-wrap leading-relaxed">
              {recipeToPrint.receta}
            </pre>
          </div>

          <div className="pt-16 flex justify-end text-center">
            <div className="border-t border-black w-60 pt-2 text-xs">
              <p className="font-bold">Dr(a). {recipeToPrint.doctor?.nombre} {recipeToPrint.doctor?.apellido}</p>
              <p>{recipeToPrint.doctor?.especialidad} • {recipeToPrint.doctor?.matricula_nacional}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AGENDAMIENTO RÁPIDO PARA EL MÉDICO */}
      <AgendarTurnoSecretariaModal
        isOpen={showAgendarModal}
        defaultProfId={selectedDoctorId}
        onClose={() => setShowAgendarModal(false)}
      />

      {/* MODAL DE REPROGRAMACIÓN DE TURNOS */}
      <ReprogramarTurnoModal
        isOpen={showReprogramModal}
        turno={turnoToReprogram}
        onClose={() => setShowReprogramModal(false)}
      />

      {/* MODAL DE CANCELACIÓN CON MOTIVO OBLIGATORIO */}
      <CancelarTurnoModal
        isOpen={showCancelModal}
        turno={turnoToCancel}
        canceladoPor="PROFESIONAL"
        onClose={() => setShowCancelModal(false)}
      />
    </div>
  );
};
