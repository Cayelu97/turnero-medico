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
  DollarSign,
  Search,
  MessageCircle,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { formatDateAR } from '../../utils/formatters';

export const ConfirmarTurnoPacienteModal = ({ codigoReserva, token, onClose }) => {
  const { 
    updateTurnoEstado, 
    showToast, 
    turnos, 
    profesionales, 
    consultorios, 
    obrasSociales, 
    planes, 
    nomenclador, 
    pacientes,
    activeClinica,
    clinicas 
  } = useApp();
  
  const [turno, setTurno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accionRealizada, setAccionRealizada] = useState(null); // 'CONFIRMADO' | 'CANCELADO'
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  // Estados para recuperación manual por DNI
  const [dniRecuperacion, setDniRecuperacion] = useState('');
  const [nombreRecuperacion, setNombreRecuperacion] = useState('');
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    if (!codigoReserva && !token) {
      setLoading(false);
      return;
    }

    // 1. Intentar decodificar token si viene en los props o en la URL
    const tokenToUse = token || new URLSearchParams(window.location.search).get('t') || new URLSearchParams(window.location.search).get('data');
    if (tokenToUse) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(tokenToUse))));
        if (decoded && (decoded.c || decoded.id)) {
          const cleanCode = (decoded.c || codigoReserva || 'TRN-S/D').toUpperCase();
          const turnoObj = {
            id: decoded.id || `trn-${decoded.c || Date.now()}`,
            codigo_reserva: cleanCode,
            fecha: decoded.f || new Date().toISOString().split('T')[0],
            hora_inicio: decoded.hi || '09:00',
            hora_fin: decoded.hf || '09:30',
            modalidad: decoded.m || 'PRESENCIAL',
            paciente_id: decoded.pid || (decoded.pd ? `pac-${decoded.pd}` : 'pac-1'),
            paciente_nombre: decoded.pa ? `${decoded.pa}, ${decoded.pn}` : (decoded.pn || 'Paciente'),
            paciente_dni: decoded.pd || '',
            paciente_telefono: decoded.pt || '',
            profesional_id: decoded.docId || 'prof-psi-1',
            profesional_nombre: decoded.doc || 'Dr(a). Profesional',
            especialidad_nombre: decoded.esp || 'Consulta Médica',
            clinica_id: decoded.cliId || 'clinica-1',
            clinica_nombre: decoded.cliNom || 'Sede Central - Aipaa 355',
            consultorio_nombre: decoded.conNom || 'Consultorio',
            obra_social_id: decoded.osId || '',
            obra_social_nombre: decoded.osNom || 'Particular',
            plan_id: decoded.plId || '',
            plan_nombre: decoded.plNom || '',
            monto_coseguro: Number(decoded.cos || 0),
            estado: decoded.est || 'PROGRAMADO'
          };

          // Guardar e hidratar en LocalStorage para este dispositivo
          try {
            StorageService.saveTurno(turnoObj);
            if (decoded.pd) {
              const allPacs = StorageService.getPacientes();
              if (!allPacs.some(p => p.dni?.toString().replace(/\D/g, '') === decoded.pd.toString().replace(/\D/g, ''))) {
                StorageService.savePaciente({
                  id: turnoObj.paciente_id,
                  nombre: decoded.pn || 'Paciente',
                  apellido: decoded.pa || '',
                  dni: decoded.pd,
                  telefono_whatsapp: decoded.pt || '',
                  obra_social_nombre: decoded.osNom,
                  plan_nombre: decoded.plNom
                });
              }
            }
          } catch (e) {
            console.warn('Error guardando turno desde token:', e);
          }

          setTurno(turnoObj);
          if (turnoObj.confirmado_whatsapp) {
            setAccionRealizada('CONFIRMADO');
          }
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Error parseando token de WhatsApp:', e);
      }
    }

    // 2. Si no hay token, buscar en las colecciones locales
    const allTurnos = StorageService.getTurnos();
    const cleanCode = (codigoReserva || '').trim().toUpperCase();
    const found = allTurnos.find(t => 
      (t.codigo_reserva && t.codigo_reserva.toUpperCase() === cleanCode) ||
      t.id === codigoReserva
    );

    if (found) {
      setTurno(found);
      if (found?.confirmado_whatsapp) {
        setAccionRealizada('CONFIRMADO');
      }
    } else {
      setTurno(null);
    }
    setLoading(false);
  }, [codigoReserva, token, turnos]);

  // Manejar búsqueda y vinculación manual por DNI
  const handleBuscarPorDni = (e) => {
    e.preventDefault();
    setErrorBusqueda('');
    const clean = dniRecuperacion.replace(/\D/g, '');
    if (!clean) {
      setErrorBusqueda('Por favor ingresá tu número de DNI.');
      return;
    }

    const allPacs = StorageService.getPacientes();
    const foundPac = allPacs.find(p => p.dni?.toString().replace(/\D/g, '') === clean);
    
    // Crear turno vinculado con el código solicitado
    const targetClinica = activeClinica || clinicas?.[0] || { id: 'clinica-1', nombre: 'Sede Central - Aipaa 355', direccion: 'Av. Colón 1250' };
    const turnoRecuperado = {
      id: `trn-${codigoReserva || Date.now()}`,
      codigo_reserva: (codigoReserva || `TRN-${Math.floor(10000 + Math.random() * 90000)}`).toUpperCase(),
      fecha: new Date().toISOString().split('T')[0],
      hora_inicio: '09:00',
      hora_fin: '09:30',
      modalidad: 'PRESENCIAL',
      paciente_id: foundPac?.id || `pac-${clean}`,
      paciente_nombre: foundPac ? `${foundPac.apellido || ''}, ${foundPac.nombre || ''}`.trim() : (nombreRecuperacion || 'Paciente'),
      paciente_dni: clean,
      paciente_telefono: foundPac?.telefono_whatsapp || '',
      profesional_id: 'prof-psi-1',
      profesional_nombre: 'Dr. Profesional Médico',
      especialidad_nombre: 'Consulta Médica',
      clinica_id: targetClinica.id,
      clinica_nombre: targetClinica.nombre,
      obra_social_nombre: foundPac?.obra_social_nombre || 'Particular',
      plan_nombre: foundPac?.plan_nombre || '',
      monto_coseguro: 0,
      estado: 'PROGRAMADO'
    };

    StorageService.saveTurno(turnoRecuperado);
    setTurno(turnoRecuperado);
  };

  if (!codigoReserva && !token) return null;

  const paciente = turno ? (pacientes.find(p => p.id === turno.paciente_id) || StorageService.getPacientes().find(p => p.id === turno.paciente_id) || { nombre: turno.paciente_nombre, dni: turno.paciente_dni }) : null;
  const profesional = turno ? (profesionales.find(p => p.id === turno.profesional_id) || StorageService.getProfesionales().find(p => p.id === turno.profesional_id) || { nombre: turno.profesional_nombre, especialidad: turno.especialidad_nombre || 'Consulta' }) : null;
  const consultorio = turno ? (consultorios.find(c => c.id === turno.consultorio_id) || StorageService.getConsultorios().find(c => c.id === turno.consultorio_id) || { nombre: turno.consultorio_nombre || 'Consultorio' }) : null;
  const clinica = turno ? (StorageService.getClinicasList().find(c => c.id === turno.clinica_id) || activeClinica || { nombre: turno.clinica_nombre || 'Sede Central', direccion: 'Av. Colón 1250' }) : null;
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
    if (!turno || !turno.fecha || !turno.hora_inicio) return '#';
    const startIso = `${turno.fecha.replace(/-/g, '')}T${turno.hora_inicio.replace(/:/g, '')}00`;
    const endIso = `${turno.fecha.replace(/-/g, '')}T${(turno.hora_fin || '10:00').replace(/:/g, '')}00`;
    const title = encodeURIComponent(`Turno Médico: ${profesional?.especialidad || 'Consulta'} - Dr(a). ${profesional?.apellido || profesional?.nombre || ''}`);
    const details = encodeURIComponent(`Turno en ${clinica?.nombre || 'Centro Médico'} - Código: ${turno.codigo_reserva}.`);
    const location = encodeURIComponent(`${clinica?.nombre || ''}, ${clinica?.direccion || ''}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  };

  // Enlace para enviar confirmación vía WhatsApp a recepción
  const getWhatsAppReplyUrl = (tipo = 'CONFIRMAR') => {
    const phone = clinica?.whatsapp || '+54 9 351 428-9000';
    const cleanPhone = phone.replace(/\D/g, '');
    const msg = tipo === 'CONFIRMAR'
      ? `Hola! Confirmo mi asistencia al turno *${turno?.codigo_reserva}* para el día *${turno?.fecha}* a las *${turno?.hora_inicio} hs* en *${clinica?.nombre}*. Paciente: ${paciente?.nombre || turno?.paciente_nombre} (DNI: ${paciente?.dni || turno?.paciente_dni}).`
      : `Hola, lamento informar que no podré asistir al turno *${turno?.codigo_reserva}* del día ${turno?.fecha} y solicito su cancelación. Muchas gracias.`;
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
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
          <div className="py-12 text-center text-slate-500 text-sm font-bold animate-pulse">
            Buscando información de tu turno...
          </div>
        ) : !turno ? (
          /* =========================================================================
             PANTALLA DE RECUPERACIÓN INTELIGENTE POR DNI / CÓDIGO
             ========================================================================= */
          <div className="py-4 space-y-4 text-xs">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Vincular y Confirmar Turno: <span className="font-mono text-indigo-700">{codigoReserva}</span>
              </h3>
              <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
                Para confirmar tu asistencia desde este dispositivo, ingresá tu número de DNI para verificar tu reserva en el sistema:
              </p>
            </div>

            <form onSubmit={handleBuscarPorDni} className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                  Número de DNI del Paciente *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="ej: 35894120 (sin puntos)"
                    value={dniRecuperacion}
                    onChange={(e) => setDniRecuperacion(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {showManualForm && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                    Nombre y Apellido
                  </label>
                  <input
                    type="text"
                    placeholder="Tu nombre completo"
                    value={nombreRecuperacion}
                    onChange={(e) => setNombreRecuperacion(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              )}

              {errorBusqueda && (
                <p className="text-rose-600 font-bold text-[11px]">{errorBusqueda}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Buscar y Confirmar Turno</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                Cerrar ventana
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            
            {/* Banner de Estado */}
            {accionRealizada === 'CONFIRMADO' ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-1 animate-fadeIn">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white mb-1 shadow-sm">
                  <Check className="w-5 h-5" />
                </div>
                <h3 className="font-black text-emerald-950 text-sm">
                  ¡Asistencia Confirmada con Éxito!
                </h3>
                <p className="text-emerald-800 text-[11px] font-medium">
                  Notificamos a recepción y al equipo médico tu presencia para el día pactado.
                </p>
              </div>
            ) : accionRealizada === 'CANCELADO' || turno.estado === 'CANCELADO' ? (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-1 animate-fadeIn">
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
              <div className="p-3 bg-sky-50/80 border border-sky-200 rounded-2xl text-center">
                <p className="text-sky-900 font-bold text-xs">
                  👋 Hola <strong>{paciente?.nombre || turno.paciente_nombre || 'Paciente'}</strong>, por favor confirmá tu asistencia para asegurar definitivamente tu lugar en la agenda:
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
                  (turno.confirmado_whatsapp || accionRealizada === 'CONFIRMADO') 
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                    : accionRealizada === 'CANCELADO' || turno.estado === 'CANCELADO'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-900'
                }`}>
                  {(turno.confirmado_whatsapp || accionRealizada === 'CONFIRMADO') ? '✓ Confirmado' : turno.estado}
                </span>
              </div>

              {/* Paciente */}
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Paciente Titular</span>
                <strong className="text-xs font-black text-slate-900 block">
                  {paciente?.apellido ? `${paciente.apellido}, ${paciente.nombre}` : (paciente?.nombre || turno.paciente_nombre || 'Paciente')}
                </strong>
                <span className="text-[11px] text-slate-500 font-mono font-bold">
                  DNI: {paciente?.dni || turno.paciente_dni || 'S/D'}
                </span>
              </div>

              {/* Profesional y Especialidad */}
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Profesional</span>
                <strong className="text-xs font-black text-slate-900 block">
                  Dr(a). {profesional?.nombre} {profesional?.apellido || ''}
                </strong>
                <span className="text-slate-600 font-bold text-[11px]">{profesional?.especialidad || turno.especialidad_nombre || 'Consulta'}</span>
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
                  {clinica?.direccion || 'Av. Colón 1250, Córdoba'}
                </span>
              </div>

              {/* Cobertura y Coseguro */}
              <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-indigo-700 font-black uppercase block">Cobertura Médica</span>
                  <strong className="text-xs font-bold text-slate-900">
                    {obraSocial?.nombre || turno.obra_social_nombre || 'Particular'} {(plan?.nombre_plan || plan?.nombre || turno.plan_nombre) ? `(${plan?.nombre_plan || plan?.nombre || turno.plan_nombre})` : ''}
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
                {accionRealizada !== 'CONFIRMADO' && !turno.confirmado_whatsapp && (
                  <button
                    onClick={handleConfirmar}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirmar Mi Asistencia</span>
                  </button>
                )}

                {(accionRealizada === 'CONFIRMADO' || turno.confirmado_whatsapp) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href={getGoogleCalendarUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <CalendarPlus className="w-4 h-4 text-sky-600" />
                      <span>Google Calendar</span>
                    </a>
                    <a
                      href={getWhatsAppReplyUrl('CONFIRMAR')}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>Avisar a Recepción</span>
                    </a>
                  </div>
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
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
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