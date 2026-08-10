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
    const dias = Array.from(new Set(horariosDelMedico.map(h => DIAS_NOMBRES[h.dia_semana]))).join(', ');
    const horas = horariosDelMedico.map(h => `${h.hora_inicio} a ${h.hora_fin}`).slice(0, 2).join(' / ');
    return `${dias} • ${horas}`;
  }, [horariosDelMedico]);

  // Próximos días disponibles del profesional seleccionado
  const proximosDiasDisponibles = useMemo(() => {
    if (!selectedProfId) return [];
    if (horariosDelMedico.length === 0) return [];

    const diasSemanaAtencion = new Set(horariosDelMedico.map(h => h.dia_semana));
    const result = [];
    const curr = new Date();

    for (let i = 0; i < 35 && result.length < 12; i++) {
      const dateStr = curr.toISOString().split('T')[0];
      const diaSemana = curr.getDay();

      if (diasSemanaAtencion.has(diaSemana)) {
        const slotsDisponibles = StorageService.getSlotsDisponibles(selectedProfId, dateStr, turno?.servicio_id || null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scaleIn my-auto">
        {step === 1 ? (
          <>
            {/* Header del Modal */}
            <div className="px-5 sm:px-6 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-100 text-sky-800 rounded-2xl shadow-2xs">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight">Reprogramar Turno Médico</h3>
                  <p className="text-xs text-slate-500">
                    Paciente: <strong>{currentPaciente?.nombre} {currentPaciente?.apellido}</strong> (DNI {currentPaciente?.dni})
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Scrollable */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* Turno Actual (Anterior) */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-amber-900 block">🗓️ Turno Actual a Modificar:</span>
                  <span className="text-amber-800 font-medium">
                    {formatDateAR(turno.fecha)} a las {turno.hora_inicio} hs con Dr(a). {currentProf?.nombre} {currentProf?.apellido}
                  </span>
                </div>
                <span className="font-mono text-xs font-black bg-white text-amber-950 px-2 py-1 rounded-lg border border-amber-300">
                  {turno.codigo_reserva}
                </span>
              </div>

              <form id="form-reprogramar-turno" onSubmit={handleConfirmReprogram} className="space-y-4">
              {/* Selección del Profesional (Mismo u Otro) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                  1. Profesional Asignado
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={selectedProfId}
                    onChange={(e) => {
                      setSelectedProfId(e.target.value);
                      setSelectedSlot(null);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                  >
                    {profesionales.map(p => (
                      <option key={p.id} value={p.id}>
                        Dr(a). {p.nombre} {p.apellido} ({p.especialidad})
                      </option>
                    ))}
                  </select>

                  <div className="p-2 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center">
                    <span>Atención: <strong>{diasAtencionTexto}</strong></span>
                  </div>
                </div>
              </div>

              {/* Selección de Fecha con Carrusel de Próximos Días */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                  2. Seleccione la Nueva Fecha ({proximosDiasDisponibles.length} días con turnos)
                </label>

                {proximosDiasDisponibles.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                    El profesional seleccionado no tiene turnos libres en los próximos 30 días.
                  </div>
                ) : (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {proximosDiasDisponibles.map((dia) => {
                      const isSelected = selectedFecha === dia.fecha;

                      return (
                        <button
                          key={dia.fecha}
                          type="button"
                          onClick={() => {
                            setSelectedFecha(dia.fecha);
                            setSelectedSlot(null);
                          }}
                          className={`flex-shrink-0 p-2.5 rounded-2xl border-2 text-center transition flex flex-col items-center min-w-[80px] ${
                            isSelected
                              ? 'bg-sky-600 text-white border-sky-700 shadow-md scale-105'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-sky-300'
                          }`}
                        >
                          <span className={`text-[10px] uppercase font-black ${isSelected ? 'text-sky-100' : 'text-slate-500'}`}>
                            {dia.diaNombre}
                          </span>
                          <span className="text-base font-black my-0.5">
                            {dia.diaNumero}
                          </span>
                          <span className={`text-[9px] font-bold ${isSelected ? 'text-sky-100' : 'text-slate-500'}`}>
                            {dia.mesNombre}
                          </span>
                          <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full mt-1 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {dia.disponiblesCount} libres
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Input fecha manual */}
                <div className="flex items-center gap-2 text-xs pt-1">
                  <span className="text-slate-500">O ingresar otra fecha:</span>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedFecha}
                    onChange={(e) => {
                      setSelectedFecha(e.target.value);
                      setSelectedSlot(null);
                    }}
                    className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50"
                  />
                </div>
              </div>

              {/* Horarios Disponibles */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                  3. Horarios Disponibles para el {new Date(selectedFecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </label>

                {slotsList.length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No hay horarios disponibles para esta fecha.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {slotsList.map((slot, idx) => {
                      const isSelected = selectedSlot?.hora_inicio === slot.hora_inicio;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={!slot.disponible}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center ${
                            isSelected
                              ? 'bg-sky-600 text-white shadow-xs'
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

              {/* Motivo Obligatorio & Observaciones */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    4. Motivo de Reprogramación * (Obligatorio)
                  </label>
                  <select
                    required
                    value={motivoId}
                    onChange={(e) => setMotivoId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="">-- Seleccione el motivo formal --</option>
                    {motivosReprogramacion.map(m => (
                      <option key={m.id} value={m.id}>{m.descripcion}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Observaciones adicionales (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="ej: Paciente solicitó cambio por turno laboral"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                  />
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
