import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  Check, 
  X, 
  CalendarPlus,
  Stethoscope,
  Sparkles,
  DollarSign
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { formatDateAR } from '../../utils/formatters';

export const ConfirmarTurnoPacienteModal = ({ codigoReserva, onClose }) => {
  const { updateTurnoEstado, showToast, turnos, profesionales, consultorios, obrasSociales, planes, nomenclador, pacientes } = useApp();
  
  const [turno, setTurno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accionRealizada, setAccionRealizada] = useState(null); // 'CONFIRMADO' | 'CANCELADO'
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  useEffect(() => {
    if (!codigoReserva) {
      setLoading(false);
      return;
    }

    const allTurnos = StorageService.getTurnos();
    const cleanCode = codigoReserva.trim().toUpperCase();
    const found = allTurnos.find(t => 
      (t.codigo_reserva && t.codigo_reserva.toUpperCase() === cleanCode) ||
      t.id === codigoReserva
    );

    setTurno(found || null);
    if (found?.confirmado_whatsapp) {
      setAccionRealizada('CONFIRMADO');
    }
    setLoading(false);
  }, [codigoReserva, turnos]);

  if (!codigoReserva) return null;

  const paciente = turno ? (pacientes.find(p => p.id === turno.paciente_id) || StorageService.getPacientes().find(p => p.id === turno.paciente_id)) : null;
  const profesional = turno ? (profesionales.find(p => p.id === turno.profesional_id) || StorageService.getProfesionales().find(p => p.id === turno.profesional_id)) : null;
  const consultorio = turno ? (consultorios.find(c => c.id === turno.consultorio_id) || StorageService.getConsultorios().find(c => c.id === turno.consultorio_id)) : null;
  const clinica = turno ? StorageService.getClinicasList().find(c => c.id === turno.clinica_id) : null;
  const obraSocial = turno ? (obrasSociales.find(os => os.id === turno.obra_social_id || os.nombre?.toLowerCase() === turno.obra_social_nombre?.toLowerCase())) : null;
  const plan = turno ? (planes.find(p => p.id === turno.plan_id || p.nombre === turno.plan_nombre)) : null;
  const practica = turno ? nomenclador.find(n => n.id === turno.practica_id) : null;

  const handleConfirmar = () => {
    if (!turno) return;
    updateTurnoEstado(turno.id, turno.estado === 'PROGRAMADO' ? 'CONFIRMADO' : turno.estado, { confirmado_whatsapp: true });
    setAccionRealizada('CONFIRMADO');
    
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    showToast('¡Asistencia confirmada con éxito! Te esperamos.', 'success');
  };

  const handleCancelar = () => {
    if (!turno) return;
    updateTurnoEstado(turno.id, 'CANCELADO', { motivo_cancelacion: 'Cancelado por el paciente desde WhatsApp' });
    setAccionRealizada('CANCELADO');
    setShowCancelPrompt(false);
    showToast('El turno ha sido cancelado.', 'info');
  };

  // Enlace para Google Calendar
  const getGoogleCalendarUrl = () => {
    if (!turno || !turno.fecha || !turno.hora_inicio || !turno.hora_fin) return '#';
    const startIso = `${turno.fecha.replace(/-/g, '')}T${turno.hora_inicio.replace(/:/g, '')}00`;
    const endIso = `${turno.fecha.replace(/-/g, '')}T${turno.hora_fin.replace(/:/g, '')}00`;
    const title = encodeURIComponent(`Turno Médico: ${profesional?.especialidad || 'Consulta'} - Dr(a). ${profesional?.apellido || ''}`);
    const details = encodeURIComponent(`Turno en ${clinica?.nombre || 'Centro Médico'} - Código: ${turno.codigo_reserva}.`);
    const location = encodeURIComponent(`${clinica?.nombre || ''}, ${clinica?.direccion || ''}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-200 my-auto animate-scaleIn text-slate-900 relative">
        
        {/* Header con botón cerrar */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                {clinica?.nombre || 'Centro Médico'}
              </h2>
              <span className="text-[11px] text-slate-500 font-bold">
                Confirmación Directa de Turno
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm font-bold">
            Buscando información de tu turno...
          </div>
        ) : !turno ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">No encontramos el turno solicitado</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              El código <strong>{codigoReserva}</strong> no corresponde a un turno activo o ya fue modificado.
            </p>
            <button
              onClick={onClose}
              className="mt-3 px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            
            {/* Banner de Estado */}
            {accionRealizada === 'CONFIRMADO' ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-1">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white mb-1 shadow-sm">
                  <Check className="w-5 h-5" />
                </div>
                <h3 className="font-black text-emerald-950 text-sm">
                  ¡Turno Confirmado con Éxito!
                </h3>
                <p className="text-emerald-800 text-[11px] font-medium">
                  Hemos notificado a recepción y al equipo médico tu presencia para el día pactado.
                </p>
              </div>
            ) : accionRealizada === 'CANCELADO' || turno.estado === 'CANCELADO' ? (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-1">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 text-white mb-1">
                  <X className="w-5 h-5" />
                </div>
                <h3 className="font-black text-rose-950 text-sm">
                  Turno Cancelado
                </h3>
                <p className="text-rose-800 text-[11px]">
                  El turno ha sido cancelado y el horario quedó disponible para otros pacientes.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-2xl text-center">
                <p className="text-sky-900 font-bold text-xs">
                  👋 Hola <strong>{paciente?.nombre}</strong>, por favor confirmá tu asistencia para reservar definitivamente tu lugar en la agenda:
                </p>
              </div>
            )}

            {/* Tarjeta con los detalles completos del turno */}
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Código de Reserva</span>
                  <strong className="font-mono text-sm font-black text-slate-900">{turno.codigo_reserva}</strong>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                  turno.confirmado_whatsapp ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-slate-200 text-slate-800'
                }`}>
                  {turno.confirmado_whatsapp ? '✓ Asistencia Confirmada' : turno.estado}
                </span>
              </div>

              {/* Profesional y Especialidad */}
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Profesional</span>
                <strong className="text-sm font-black text-slate-900 block">
                  Dr(a). {profesional?.nombre} {profesional?.apellido}
                </strong>
                <span className="text-slate-600 font-bold">{profesional?.especialidad}</span>
              </div>

              {/* Fecha y Horario */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-white rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-sky-600" /> Fecha
                  </span>
                  <strong className="text-xs font-black text-slate-900">{formatDateAR(turno.fecha)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-sky-600" /> Horario
                  </span>
                  <strong className="text-xs font-black text-slate-900">{turno.hora_inicio} hs</strong>
                </div>
              </div>

              {/* Sede y Consultorio */}
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-medical-600" /> Lugar de Atención
                </span>
                <strong className="text-xs font-bold text-slate-800 block">
                  {clinica?.nombre || 'Sede Central'} • {consultorio?.nombre || 'Consultorio'}
                </strong>
                <span className="text-[11px] text-slate-500 font-medium block">
                  {clinica?.direccion}
                </span>
              </div>

              {/* Cobertura y Coseguro */}
              <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-indigo-700 font-black uppercase block">Cobertura Médica</span>
                  <strong className="text-xs font-bold text-slate-900">
                    {obraSocial?.nombre || turno.obra_social_nombre || 'Particular'} {(plan?.nombre || turno.plan_nombre) ? `(${plan?.nombre || turno.plan_nombre})` : ''}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-indigo-700 font-black uppercase block">Coseguro</span>
                  <strong className={`text-xs font-black ${Number(turno.monto_coseguro || 0) > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {Number(turno.monto_coseguro || 0) > 0 ? `$${Number(turno.monto_coseguro).toLocaleString('es-AR')}` : 'Sin cargo (100%)'}
                  </strong>
                </div>
              </div>
            </div>

            {/* BOTONES DE CONFIRMACIÓN O CANCELACIÓN */}
            {accionRealizada !== 'CANCELADO' && turno.estado !== 'CANCELADO' && (
              <div className="space-y-2 pt-1">
                {accionRealizada !== 'CONFIRMADO' && (
                  <button
                    onClick={handleConfirmar}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirmar Mi Asistencia</span>
                  </button>
                )}

                {accionRealizada === 'CONFIRMADO' && (
                  <a
                    href={getGoogleCalendarUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <CalendarPlus className="w-4 h-4 text-sky-600" />
                    <span>Agregar a Google Calendar</span>
                  </a>
                )}

                {!showCancelPrompt ? (
                  <button
                    type="button"
                    onClick={() => setShowCancelPrompt(true)}
                    className="w-full py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    No podré asistir (Cancelar Turno)
                  </button>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-center animate-fadeIn">
                    <p className="text-rose-900 font-bold text-xs">
                      ¿Estás seguro/a que deseas cancelar este turno?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCancelPrompt(false)}
                        className="flex-1 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Volver
                      </button>
                      <button
                        onClick={handleCancelar}
                        className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                      >
                        Sí, Cancelar Turno
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botón Salir */}
            <div className="text-center pt-2">
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cerrar ventana
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};