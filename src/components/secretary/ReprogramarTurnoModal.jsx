import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowRightLeft, 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  MessageCircle, 
  Printer, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { WhatsAppService } from '../../services/whatsapp';
import { getLocalDateString, getDayDetailsFromDateString, addDaysToDateString, formatDateAR } from '../../utils/dateUtils';

export const ReprogramarTurnoModal = ({ isOpen, turno, onClose, onReprogramSuccess }) => {
  const { 
    profesionales, 
    consultorios, 
    pacientes, 
    obrasSociales, 
    planes, 
    nomenclador, 
    motivos, 
    clinica,
    reprogramarTurno 
  } = useApp();

  const [step, setStep] = useState(1); // 1: Selección, 2: Éxito con WhatsApp
  const [selectedProfId, setSelectedProfId] = useState('');
  const [selectedFecha, setSelectedFecha] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [motivoId, setMotivoId] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Reprogramación completada
  const [reprogrammedData, setReprogrammedData] = useState(null);

  // Inicializar con los datos del turno a reprogramar
  useEffect(() => {
    if (turno) {
      setSelectedProfId(turno.profesional_id);
      setSelectedFecha(turno.fecha);
      setSelectedSlot(null);
      setMotivoId(motivos.find(m => m.tipo === 'REPROGRAMACION')?.id || '');
      setObservaciones('');
      setStep(1);
      setReprogrammedData(null);
    }
  }, [turno, isOpen, motivos]);

  const currentPaciente = turno ? pacientes.find(p => p.id === turno.paciente_id) : null;
  const currentProf = turno ? profesionales.find(p => p.id === turno.profesional_id) : null;
  const targetProf = profesionales.find(p => p.id === selectedProfId);

  // Horarios del médico seleccionado
  const horariosDelMedico = useMemo(() => {
    if (!selectedProfId) return [];
    return StorageService.getHorariosByProfesional(selectedProfId);
  }, [selectedProfId]);

  const DIAS_NOMBRES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const diasAtencionTexto = useMemo(() => {
    if (horariosDelMedico.length === 0) return 'Sin horarios configurados';
    const dias = Array.from(new Set(horariosDelMedico.map(h => DIAS_NOMBRES[Number(h.dia_semana)]))).join(', ');
    const horas = horariosDelMedico.map(h => `${h.hora_inicio} a ${h.hora_fin}`).slice(0, 2).join(' / ');
    return `${dias} • ${horas}`;
  }, [horariosDelMedico]);

  // Próximos días disponibles del profesional seleccionado
  const proximosDiasDisponibles = useMemo(() => {
    if (!selectedProfId || horariosDelMedico.length === 0) return [];

    const diasSemanaAtencion = new Set(horariosDelMedico.map(h => Number(h.dia_semana)));
    const result = [];
    const todayStr = getLocalDateString(new Date());

    for (let i = 0; i < 45 && result.length < 12; i++) {
      const dateStr = addDaysToDateString(todayStr, i);
      const dayDetails = getDayDetailsFromDateString(dateStr);

      if (diasSemanaAtencion.has(dayDetails.diaSemana)) {
        const slotsDisponibles = StorageService.getSlotsDisponibles(selectedProfId, dateStr, turno?.servicio_id || null);
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
  }, [selectedProfId, horariosDelMedico, turno]);

  // Autoseleccionar la primera fecha libre si la actual no tiene disponibilidad
  useEffect(() => {
    if (proximosDiasDisponibles.length > 0) {
      const exists = proximosDiasDisponibles.some(d => d.fecha === selectedFecha);
      if (!exists) {
        setSelectedFecha(proximosDiasDisponibles[0].fecha);
      }
    }
  }, [proximosDiasDisponibles, selectedProfId]);

  // Slots para la fecha seleccionada
  const slotsList = useMemo(() => {
    if (!selectedProfId || !selectedFecha) return [];
    return StorageService.getSlotsDisponibles(selectedProfId, selectedFecha, turno?.servicio_id || null);
  }, [selectedProfId, selectedFecha, turno]);

  if (!isOpen || !turno) return null;

  const motivosReprogramacion = motivos.filter(m => m.tipo === 'REPROGRAMACION' && m.activo !== false);

  const handleConfirmReprogram = (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      alert('Por favor seleccione un horario disponible.');
      return;
    }
    if (!motivoId) {
      alert('El motivo de reprogramación es obligatorio.');
      return;
    }

    const selectedMotivoObj = motivos.find(m => m.id === motivoId);

    const updated = reprogramarTurno({
      turnoId: turno.id,
      nuevaFecha: selectedFecha,
      nuevoSlot: selectedSlot,
      nuevoProfesionalId: selectedProfId,
      motivoId: motivoId,
      motivoDescripcion: selectedMotivoObj?.descripcion || 'Reprogramación',
      observaciones: observaciones
    });

    const profObj = profesionales.find(p => p.id === selectedProfId);
    const consObj = consultorios.find(c => c.id === selectedSlot.consultorio_id);
    const osObj = obrasSociales.find(o => o.id === turno.obra_social_id);
    const planObj = planes.find(p => p.id === turno.plan_id);

    setReprogrammedData({
      turno: updated,
      paciente: currentPaciente,
      profesional: profObj,
      consultorio: consObj,
      obraSocial: osObj,
      plan: planObj
    });

    setStep(2);
    if (onReprogramSuccess) onReprogramSuccess(updated);
  };

  const handleSendWhatsApp = () => {
    if (!reprogrammedData) return;
    WhatsAppService.enviarMensaje({
      turno: reprogrammedData.turno,
      paciente: reprogrammedData.paciente,
      profesional: reprogrammedData.profesional,
      consultorio: reprogrammedData.consultorio,
      clinica,
      tipo: 'REPROGRAMADO'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs overflow-hidden animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-5xl xl:max-w-6xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scaleIn my-auto">
        {step === 1 ? (
          <>
            {/* Header del Modal */}
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-medical-500 text-white rounded-2xl shadow-md shadow-sky-600/20">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight">Reprogramar Turno Médico</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Paciente: <strong className="text-slate-800">{currentPaciente?.nombre} {currentPaciente?.apellido}</strong> (DNI {currentPaciente?.dni})
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Scrollable en 2 Columnas */}
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <form id="form-reprogramar-turno" onSubmit={handleConfirmReprogram} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* COLUMNA IZQUIERDA (5 Cols): Turno Actual, Profesional y Motivo */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Turno Actual */}
                  <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-3xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-amber-900">🗓️ Turno a Modificar:</span>
                      <span className="font-mono text-xs font-black bg-white text-amber-950 px-2 py-0.5 rounded-lg border border-amber-300">
                        {turno.codigo_reserva}
                      </span>
                    </div>
                    <p className="text-amber-800 font-semibold">
                      {formatDateAR(turno.fecha)} a las {turno.hora_inicio} hs
                    </p>
                    <p className="text-[11px] text-amber-700">
                      Médico: Dr(a). {currentProf?.nombre} {currentProf?.apellido}
                    </p>
                  </div>

                  {/* 1. Profesional Asignado */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-2.5">
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                      1. Médico Profesional
                    </label>
                    <select
                      value={selectedProfId}
                      onChange={(e) => {
                        setSelectedProfId(e.target.value);
                        setSelectedSlot(null);
                      }}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                    >
                      {profesionales.map(p => (
                        <option key={p.id} value={p.id}>
                          Dr(a). {p.nombre} {p.apellido} ({p.especialidad})
                        </option>
                      ))}
                    </select>
                    <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl text-[11px] text-slate-600">
                      <span>Días de atención: <strong className="text-slate-800">{diasAtencionTexto}</strong></span>
                    </div>
                  </div>

                  {/* 3. Motivo Obligatorio & Observaciones */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        3. Motivo Formal * (Obligatorio)
                      </label>
                      <select
                        required
                        value={motivoId}
                        onChange={(e) => setMotivoId(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                      >
                        <option value="">-- Seleccione el motivo formal --</option>
                        {motivosReprogramacion.map(m => (
                          <option key={m.id} value={m.id}>{m.descripcion}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Observaciones adicionales
                      </label>
                      <input
                        type="text"
                        placeholder="ej: Paciente solicitó cambio por turno laboral"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA (7 Cols): Fecha y Horarios Disponibles */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Selección de Fecha */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        2. Nueva Fecha ({proximosDiasDisponibles.length} días con turnos)
                      </label>
                      <input
                        type="date"
                        min={getLocalDateString(new Date())}
                        value={selectedFecha}
                        onChange={(e) => {
                          setSelectedFecha(e.target.value);
                          setSelectedSlot(null);
                        }}
                        className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-black bg-white shadow-xs"
                      />
                    </div>

                    {proximosDiasDisponibles.length === 0 ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium">
                        El profesional seleccionado no tiene turnos libres en los próximos 30 días.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
                        {proximosDiasDisponibles.slice(0, 5).map((dia) => {
                          const isSelected = selectedFecha === dia.fecha;

                          return (
                            <button
                              key={dia.fecha}
                              type="button"
                              onClick={() => {
                                setSelectedFecha(dia.fecha);
                                setSelectedSlot(null);
                              }}
                              className={`p-2.5 rounded-2xl border transition flex flex-col items-center justify-center cursor-pointer ${
                                isSelected
                                  ? 'bg-medical-600 text-white border-medical-700 shadow-sm ring-2 ring-medical-500/20 scale-102'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-medical-400 hover:bg-medical-50/40'
                              }`}
                            >
                              <span className={`text-[10px] uppercase font-black ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                {dia.diaNombre}
                              </span>
                              <span className="text-sm font-black my-0.5">
                                {dia.diaNumero} {dia.mesNombre}
                              </span>
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full mt-0.5 ${
                                isSelected ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {dia.disponiblesCount} libres
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Horarios Disponibles */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                      3. Horarios Disponibles ({slotsList.filter(s => s.disponible).length} libres)
                    </label>

                    {slotsList.length === 0 ? (
                      <p className="text-xs text-slate-400 p-6 bg-white rounded-2xl border border-dashed border-slate-200 text-center font-medium">
                        No hay horarios disponibles para esta fecha. Seleccione otro día en el calendario.
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1">
                        {slotsList.map((slot, idx) => {
                          const isSelected = selectedSlot?.hora_inicio === slot.hora_inicio;
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={!slot.disponible}
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-2.5 rounded-xl text-xs font-mono font-black transition flex items-center justify-center cursor-pointer ${
                                isSelected
                                  ? 'bg-medical-600 text-white shadow-md shadow-sky-600/30 scale-105'
                                  : slot.disponible
                                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-60'
                              }`}
                            >
                              {slot.hora_inicio}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

              </form>
            </div>

            {/* Footer Fijo */}
            <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="form-reprogramar-turno"
                disabled={!selectedSlot || !motivoId}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-xs shadow-md transition cursor-pointer ${
                  selectedSlot && motivoId
                    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Reprogramación</span>
              </button>
            </div>
          </>
        ) : (
          /* PASO 2: ÉXITO CON BOTÓN WHATSAPP */
          <div className="p-6 space-y-5 text-center overflow-y-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-100 text-sky-700 rounded-3xl mb-1 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">¡Turno Reprogramado Exitosamente!</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Código de Reserva: <strong className="font-mono text-slate-900">{reprogrammedData?.turno.codigo_reserva}</strong>
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Paciente:</span>
                <strong className="text-slate-900">{reprogrammedData?.paciente.nombre} {reprogrammedData?.paciente.apellido}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nuevo Profesional:</span>
                <strong className="text-slate-900">Dr(a). {reprogrammedData?.profesional.nombre} {reprogrammedData?.profesional.apellido}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nueva Fecha y Hora:</span>
                <strong className="text-sky-800 font-bold">{formatDateAR(reprogrammedData?.turno.fecha)} a las {reprogrammedData?.turno.hora_inicio} hs</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ubicación:</span>
                <strong className="text-slate-900">{reprogrammedData?.consultorio?.nombre || 'Consultorio'}</strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Notificación por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Listo / Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
