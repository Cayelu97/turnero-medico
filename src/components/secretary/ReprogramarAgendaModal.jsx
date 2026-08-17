import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  MessageCircle, 
  RefreshCw, 
  ShieldAlert, 
  Check,
  Send
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { WhatsAppService } from '../../services/whatsapp';
import { formatDateAR } from '../../utils/dateUtils';

export const ReprogramarAgendaModal = ({ 
  isOpen, 
  onClose, 
  profesional, 
  turnosAfectados = [], 
  onConfirmProceed 
}) => {
  const { clinica, reprogramarTurno, cancelarTurno, showToast } = useApp();
  const [processedTurnos, setProcessedTurnos] = useState({});
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  if (!isOpen || turnosAfectados.length === 0) return null;

  // Reprogramar automáticamente un turno al próximo slot libre
  const handleAutoReprogramar = async (turno) => {
    const slotsDisponibles = [];
    const today = new Date();
    
    // Buscar en los próximos 30 días el primer slot libre
    for (let i = 1; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const slots = StorageService.getSlotsDisponibles(turno.profesional_id, dateStr, turno.servicio_id, turno.modalidad);
      const libre = slots.find(s => s.disponible);
      if (libre) {
        slotsDisponibles.push({ fecha: dateStr, slot: libre });
        break;
      }
    }

    if (slotsDisponibles.length === 0) {
      alert('No se encontraron slots libres en los próximos 30 días para reprogramar automáticamente este turno.');
      return;
    }

    const target = slotsDisponibles[0];
    const updated = reprogramarTurno(turno.id, target.fecha, target.slot.hora_inicio, 'Reprogramación automática por reestructuración de agenda médica');

    setProcessedTurnos(prev => ({
      ...prev,
      [turno.id]: {
        accion: 'REPROGRAMADO',
        nuevaFecha: target.fecha,
        nuevaHora: target.slot.hora_inicio
      }
    }));

    showToast(`Turno de ${turno.paciente_nombre || 'paciente'} reprogramado para ${formatDateAR(target.fecha)} ${target.slot.hora_inicio} hs`);
  };

  // Enviar mensaje de WhatsApp al paciente notificando el cambio
  const handleNotificarWhatsApp = (turno) => {
    const proc = processedTurnos[turno.id];
    const fechaTexto = proc?.nuevaFecha ? formatDateAR(proc.nuevaFecha) : formatDateAR(turno.fecha);
    const horaTexto = proc?.nuevaHora || turno.hora_inicio;

    const mensaje = `Hola ${turno.paciente_nombre || 'Paciente'}, te escribimos de *${clinica?.nombre || 'la clínica'}*. Te informamos que debido a una reestructuración de la agenda médica del Dr(a). ${profesional?.apellido || ''}, tu turno fue reprogramado para el día *${fechaTexto}* a las *${horaTexto} hs*. Por favor confirmanos si podés asistir. ¡Muchas gracias!`;

    const telLimpio = String(turno.paciente_telefono || '').replace(/\D/g, '');
    if (!telLimpio) {
      alert('El paciente no tiene un número de WhatsApp registrado.');
      return;
    }

    const url = `https://wa.me/${telLimpio.startsWith('54') ? telLimpio : `549${telLimpio}`}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  // Cancelar turno afectado con motivo oficial
  const handleCancelarTurnoAfectado = (turno) => {
    if (!confirm(`¿Desea cancelar el turno de ${turno.paciente_nombre || 'este paciente'}?`)) return;
    cancelarTurno(turno.id, 'Cancelado por cierre o reestructuración de agenda profesional');
    setProcessedTurnos(prev => ({
      ...prev,
      [turno.id]: { accion: 'CANCELADO' }
    }));
    showToast('Turno cancelado');
  };

  // Reprogramar todos en lote
  const handleReprogramarTodos = async () => {
    setIsProcessingAll(true);
    for (const t of turnosAfectados) {
      if (!processedTurnos[t.id]) {
        await handleAutoReprogramar(t);
      }
    }
    setIsProcessingAll(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-amber-200 my-auto animate-scaleIn">
        
        {/* Header de Advertencia Clínica */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3 text-amber-600">
            <div className="p-3 bg-amber-100 rounded-2xl border border-amber-200 shadow-sm">
              <ShieldAlert className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl text-slate-900 leading-tight">
                Advertencia: Turnos Futuros Afectados
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                La modificación o cierre de agenda para <span className="font-bold text-slate-800">Dr(a). {profesional?.nombre} {profesional?.apellido}</span> afecta a <span className="font-extrabold text-amber-700">{turnosAfectados.length} turno(s) ya otorgado(s)</span>.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Acciones Globales Rápidas */}
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
          <div className="text-xs text-amber-900">
            <p className="font-bold">¿Cómo deseas proceder con los turnos?</p>
            <p className="text-[11px] text-amber-700">Puedes reprogramar automáticamente a los pacientes o avisarles por WhatsApp.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleReprogramarTodos}
              disabled={isProcessingAll}
              className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessingAll ? 'animate-spin' : ''}`} />
              <span>Reprogramar Todos al Siguiente Libre</span>
            </button>
          </div>
        </div>

        {/* Lista de Turnos Afectados */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 mb-6">
          {turnosAfectados.map(turno => {
            const proc = processedTurnos[turno.id];
            return (
              <div 
                key={turno.id}
                className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  proc ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {/* Datos del Turno y Paciente */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-mono text-[11px] font-black">
                      {turno.codigo_reserva || 'TRN'}
                    </span>
                    <span className="font-bold text-xs text-slate-900">
                      {turno.paciente_nombre || `DNI ${turno.paciente_dni}`}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      ({turno.obra_social_nombre || 'Particular'})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-medical-600" />
                      {formatDateAR(turno.fecha)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-medical-600" />
                      {turno.hora_inicio} hs
                    </span>
                    {turno.paciente_telefono && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Phone className="w-3.5 h-3.5" />
                        {turno.paciente_telefono}
                      </span>
                    )}
                  </div>

                  {proc && proc.accion === 'REPROGRAMADO' && (
                    <div className="text-emerald-700 font-bold text-xs flex items-center gap-1 pt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Reubicado para: {formatDateAR(proc.nuevaFecha)} a las {proc.nuevaHora} hs</span>
                    </div>
                  )}

                  {proc && proc.accion === 'CANCELADO' && (
                    <div className="text-rose-700 font-bold text-xs flex items-center gap-1 pt-0.5">
                      <X className="w-3.5 h-3.5" />
                      <span>Turno cancelado</span>
                    </div>
                  )}
                </div>

                {/* Acciones por Turno */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {!proc && (
                    <>
                      <button
                        onClick={() => handleAutoReprogramar(turno)}
                        className="px-2.5 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Reubicar automáticamente en próximo slot libre"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reubicar</span>
                      </button>
                      <button
                        onClick={() => handleCancelarTurnoAfectado(turno)}
                        className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Cancelar turno"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    </>
                  )}

                  {turno.paciente_telefono && (
                    <button
                      onClick={() => handleNotificarWhatsApp(turno)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Enviar WhatsApp de notificación"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Avisar WA</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer y Confirmación Final */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-4 gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Volver a la Agenda
          </button>

          <button
            onClick={() => {
              onConfirmProceed();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-extrabold transition shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar y Guardar Cambios de Agenda</span>
          </button>
        </div>

      </div>
    </div>
  );
};
