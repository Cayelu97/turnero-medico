import React from 'react';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  Printer, 
  Download, 
  X, 
  Share2, 
  AlertTriangle,
  MessageCircle,
  Building
} from 'lucide-react';
import { WhatsAppService } from '../../services/whatsapp';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { formatDateAR } from '../../utils/formatters';

export const VoucherModal = ({ turno, paciente, profesional, consultorio, obraSocial, plan, practica, onClose }) => {
  const { clinica } = useApp();
  if (!turno) return null;

  const allClinicas = StorageService.getClinicasList();
  const sedeTurno = allClinicas.find(c => c.id === (turno.clinica_id || consultorio?.clinica_id)) || clinica || {
    nombre: 'Centro Médico San Lucas',
    direccion: 'Av. Santa Fe 2450',
    telefono: '(011) 4801-9920'
  };

  const handleSendWhatsApp = () => {
    WhatsAppService.enviarMensaje({
      turno,
      paciente,
      profesional,
      consultorio,
      clinica: sedeTurno,
      tipo: 'NUEVO'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Enlace para Google Calendar
  const getGoogleCalendarUrl = () => {
    if (!turno.fecha || !turno.hora_inicio || !turno.hora_fin) return '#';
    const startIso = `${turno.fecha.replace(/-/g, '')}T${turno.hora_inicio.replace(/:/g, '')}00`;
    const endIso = `${turno.fecha.replace(/-/g, '')}T${turno.hora_fin.replace(/:/g, '')}00`;
    const title = encodeURIComponent(`Turno Médico: ${profesional?.especialidad || 'Consulta'} - Dr(a). ${profesional?.apellido || ''}`);
    const details = encodeURIComponent(`Turno en ${sedeTurno.nombre} - ${consultorio?.nombre || 'Consultorio'}. Código: ${turno.codigo_reserva}. Paciente: ${paciente?.nombre} ${paciente?.apellido}`);
    const location = encodeURIComponent(`${sedeTurno.nombre}, ${sedeTurno.direccion}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-hidden animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 my-auto overflow-hidden animate-scaleIn relative">
        
        {/* Botón Cerrar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition no-print cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div id="printable-area" className="p-6 sm:p-7 overflow-y-auto flex-1 print:p-2 print:text-black">
          {/* Header del Voucher */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300 print:pb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-left pr-8">
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide">
                  {sedeTurno.nombre}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {sedeTurno.direccion} {sedeTurno.telefono ? `• Tel: ${sedeTurno.telefono}` : ''}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block">CÓDIGO DE RESERVA</span>
                <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-mono text-xs font-black tracking-wider inline-block">
                  {turno.codigo_reserva}
                </span>
              </div>
            </div>

            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 my-1 no-print">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 print:text-lg">
              Comprobante de Turno Médico
            </h2>
            <p className="text-xs text-emerald-800 font-bold mt-0.5">
              ✓ Turno confirmado y reservado en el sistema
            </p>
          </div>

          {/* Información del Turno */}
          <div className="py-4 space-y-3 print:py-2 print:space-y-2">
            <div className="grid grid-cols-2 gap-3 p-3 bg-medical-50/70 border border-medical-200 rounded-xl print:bg-slate-50 print:border-slate-300">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-medical-600" /> Fecha del Turno
                </span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">{formatDateAR(turno.fecha)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-600 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-medical-600" /> Horario de Atención
                </span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">{turno.hora_inicio} hs</p>
              </div>
            </div>

            {/* Profesional & Consultorio */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 print:bg-white print:border-slate-300">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Profesional Asignado</span>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Dr(a). {profesional?.nombre} {profesional?.apellido}
                  </h4>
                  <p className="text-xs font-bold text-medical-700">{profesional?.especialidad} {profesional?.matricula_nacional ? `(${profesional.matricula_nacional})` : ''}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Lugar de Atención</span>
                  <p className="text-xs font-extrabold text-blue-900">🏥 {sedeTurno.nombre}</p>
                  <p className="text-xs font-bold text-slate-900">{consultorio?.nombre || 'Consultorio'}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{consultorio?.piso_ubicacion || 'Planta Baja'}</p>
                </div>
              </div>
            </div>

            {/* Cobertura y Práctica */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 print:bg-white print:border-slate-300 text-xs">
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-semibold">Paciente:</span>
                <span className="font-extrabold text-slate-900">{paciente?.nombre} {paciente?.apellido} (DNI {paciente?.dni})</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-semibold">Cobertura Médica:</span>
                <span className="font-extrabold text-slate-900">
                  {obraSocial?.nombre} {plan ? `(${plan.nombre_plan})` : ''} {turno.numero_afiliado ? `• Af: ${turno.numero_afiliado}` : ''}
                </span>
              </div>
              <div className="flex justify-between items-start border-t border-slate-200 pt-1.5">
                <span className="text-slate-500 font-semibold">Práctica / Motivo:</span>
                <span className="font-bold text-slate-900 text-right">{practica?.codigo_pmo} - {practica?.descripcion}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-1.5">
                <span className="text-slate-700 font-bold">Coseguro Estimado a Abonar:</span>
                <span className="font-black text-sm text-emerald-700">
                  {Number(turno.monto_coseguro || 0) === 0 ? 'Sin Coseguro ($0)' : `$${Number(turno.monto_coseguro).toLocaleString('es-AR')}`}
                </span>
              </div>
            </div>

            {/* Requisitos de preparación / indicaciones */}
            {(practica?.instrucciones_preparacion || obraSocial?.instrucciones) && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-0.5 print:bg-white print:border-slate-300">
                <div className="flex items-center gap-1 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>Instrucciones para el día del turno:</span>
                </div>
                {practica?.instrucciones_preparacion && (
                  <p>• {practica.instrucciones_preparacion}</p>
                )}
                {obraSocial?.instrucciones && (
                  <p>• {obraSocial.instrucciones}</p>
                )}
                <p className="font-semibold text-amber-800 pt-0.5">
                  * Presentarse en recepción 10 minutos antes con DNI y credencial médica.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Acciones de descarga / compartir (Footer sticky) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:px-7 border-t border-slate-200 bg-slate-50/90 shrink-0 no-print">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
              title="Enviar resumen del turno por WhatsApp al paciente"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar WhatsApp</span>
            </button>

            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-medical-600" />
              <span className="hidden sm:inline">Google Calendar</span>
            </a>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold text-xs shadow-md shadow-medical-600/20 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir A4</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

