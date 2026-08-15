import React, { useState, useEffect } from 'react';
import { 
  XCircle, 
  AlertTriangle, 
  X, 
  MessageCircle, 
  CheckCircle2, 
  User, 
  Calendar, 
  Clock, 
  Stethoscope 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WhatsAppService } from '../../services/whatsapp';

export const CancelarTurnoModal = ({ isOpen, turno, canceladoPor = 'SECRETARIA', onClose, onCancelSuccess }) => {
  const { 
    pacientes, 
    profesionales, 
    consultorios, 
    motivos, 
    clinica, 
    cancelarTurno 
  } = useApp();

  const [motivoId, setMotivoId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [isCancelledSuccess, setIsCancelledSuccess] = useState(false);
  const [cancelledData, setCancelledData] = useState(null);

  useEffect(() => {
    if (turno) {
      const defaultMot = motivos.find(m => m.tipo === 'CANCELACION')?.id || '';
      setMotivoId(defaultMot);
      setObservaciones('');
      setIsCancelledSuccess(false);
    }
  }, [turno, isOpen, motivos]);

  if (!isOpen || !turno) return null;

  const currentPaciente = pacientes.find(p => p.id === turno.paciente_id);
  const currentProf = profesionales.find(p => p.id === turno.profesional_id);
  const currentCons = consultorios.find(c => c.id === turno.consultorio_id);

  const motivosCancelacion = motivos.filter(m => {
    if (m.tipo !== 'CANCELACION' || m.activo === false) return false;
    if (canceladoPor === 'PACIENTE' && m.aplica_a === 'SECRETARIA') return false;
    return true;
  });

  const handleConfirmCancel = (e) => {
    e.preventDefault();
    if (!motivoId) {
      alert('Por favor seleccione el motivo de cancelación.');
      return;
    }

    const selectedMotivoObj = motivos.find(m => m.id === motivoId);

    const updated = cancelarTurno({
      turnoId: turno.id,
      motivoId: motivoId,
      motivoDescripcion: selectedMotivoObj?.descripcion || 'Cancelación de turno',
      observaciones: observaciones,
      canceladoPor: canceladoPor
    });

    setCancelledData({
      turno: updated,
      paciente: currentPaciente,
      profesional: currentProf,
      consultorio: currentCons
    });

    setIsCancelledSuccess(true);
    if (onCancelSuccess) onCancelSuccess(updated);
  };

  const handleSendWhatsApp = () => {
    if (!cancelledData) return;
    WhatsAppService.enviarMensaje({
      turno: cancelledData.turno,
      paciente: cancelledData.paciente,
      profesional: cancelledData.profesional,
      consultorio: cancelledData.consultorio,
      clinica,
      tipo: 'CANCELADO'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scaleIn my-auto">
        {!isCancelledSuccess ? (
          <div className="p-5 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="p-2 bg-rose-100 rounded-2xl shadow-2xs">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 leading-tight">Cancelar Turno Médico</h3>
                  <span className="text-xs text-slate-500">Esta acción liberará el horario</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen del Turno */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Paciente:</span>
                <strong className="text-slate-900">{currentPaciente?.nombre} {currentPaciente?.apellido} (DNI {currentPaciente?.dni})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Profesional:</span>
                <strong className="text-slate-900">Dr(a). {currentProf?.nombre} {currentProf?.apellido}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha y Hora:</span>
                <strong className="text-rose-700">{turno.fecha} a las {turno.hora_inicio} hs</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Código:</span>
                <span className="font-mono font-bold text-slate-900">{turno.codigo_reserva}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  Motivo Formal de Cancelación * (Obligatorio)
                </label>
                <select
                  required
                  value={motivoId}
                  onChange={(e) => setMotivoId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                >
                  <option value="">-- Seleccione un motivo --</option>
                  {motivosCancelacion.map(m => (
                    <option key={m.id} value={m.id}>{m.descripcion}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones / Justificación adicional
                </label>
                <textarea
                  rows="2"
                  placeholder="ej: Paciente llamó informando viaje imprevisto..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={!motivoId}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition ${
                    motivoId
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Confirmar Cancelación</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* PASO ÉXITO: AVISO WHATSAPP */
          <div className="space-y-4 text-center py-2">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-rose-100 text-rose-700 rounded-3xl mb-1 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">El turno ha sido Cancelado</h3>
              <p className="text-xs text-slate-500 mt-0.5">El horario quedó libre nuevamente en la agenda.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Notificar Cancelación por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
