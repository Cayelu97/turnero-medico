import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  Clock, 
  User, 
  ShieldCheck, 
  XCircle, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Lock, 
  ShieldAlert, 
  KeyRound, 
  Phone, 
  AlertCircle, 
  ArrowRightLeft,
  CalendarPlus,
  HeartHandshake,
  MapPin,
  Stethoscope,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { formatDateAR } from '../../utils/formatters';
import { VoucherModal } from './VoucherModal';
import { ReprogramarTurnoModal } from '../secretary/ReprogramarTurnoModal';
import { CancelarTurnoModal } from '../secretary/CancelarTurnoModal';

export const MisTurnos = () => {
  const { 
    turnos, 
    pacientes, 
    profesionales, 
    consultorios, 
    obrasSociales, 
    planes, 
    nomenclador, 
    clinicas,
    activeClinica,
    cancelarTurno, 
    updateTurnoEstado, 
    showToast,
    setCurrentView 
  } = useApp();

  const [criterioBusqueda, setCriterioBusqueda] = useState('');
  const [patientFound, setPatientFound] = useState(null);
  const [patientTurnos, setPatientTurnos] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedTurnoForVoucher, setSelectedTurnoForVoucher] = useState(null);
  const [turnoToCancel, setTurnoToCancel] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [turnoToReprogram, setTurnoToReprogram] = useState(null);
  const [showReprogramModal, setShowReprogramModal] = useState(false);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setHasSearched(true);
    setPatientFound(null);
    setPatientTurnos([]);

    const query = criterioBusqueda.trim();
    if (!query) {
      setErrorMsg('Por favor ingresá tu número de DNI o Código de Reserva.');
      return;
    }

    const cleanDni = query.replace(/\D/g, '');
    const cleanQueryUpper = query.toUpperCase();

    // 1. Obtener todas las fuentes de pacientes
    const allPacs = StorageService.getPacientes();
    const allTurnos = StorageService.getTurnos();

    // 2. Buscar paciente por DNI, teléfono o código de reserva
    let matchedPatient = null;

    if (cleanDni) {
      matchedPatient = allPacs.find(p => p.dni?.toString().replace(/\D/g, '') === cleanDni)
        || pacientes.find(p => p.dni?.toString().replace(/\D/g, '') === cleanDni);
    }

    // Si no encontró por DNI, buscar por código de reserva en turnos
    let matchedTurnos = [];
    if (!matchedPatient) {
      const turnoMatch = allTurnos.find(t => 
        (t.codigo_reserva && t.codigo_reserva.toUpperCase() === cleanQueryUpper) ||
        t.id === query
      );
      if (turnoMatch) {
        matchedTurnos = [turnoMatch];
        matchedPatient = allPacs.find(p => p.id === turnoMatch.paciente_id) 
          || {
            id: turnoMatch.paciente_id || 'pac-temp',
            nombre: turnoMatch.paciente_nombre || 'Paciente',
            apellido: '',
            dni: turnoMatch.paciente_dni || cleanDni || 'S/D',
            obra_social_nombre: turnoMatch.obra_social_nombre || 'Particular',
            plan_nombre: turnoMatch.plan_nombre || '',
            telefono_whatsapp: turnoMatch.paciente_telefono || ''
          };
      }
    }

    // Si encontramos al paciente por DNI, buscar todos sus turnos
    if (matchedPatient) {
      const pDniClean = matchedPatient.dni?.toString().replace(/\D/g, '');
      const pId = matchedPatient.id;

      matchedTurnos = allTurnos.filter(t => 
        (pId && t.paciente_id === pId) ||
        (pDniClean && t.paciente_dni?.toString().replace(/\D/g, '') === pDniClean)
      );

      setPatientFound(matchedPatient);
      setPatientTurnos(matchedTurnos);
    } else {
      setErrorMsg(`No encontramos registros con el DNI o Código "${query}". Si es tu primera consulta médica, podés sacar un turno ahora.`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      
      {/* Tarjeta de Búsqueda de Turnos y Ficha Médica */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-sky-50 text-sky-700 rounded-2xl border border-sky-100 shadow-2xs">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Mis Turnos & Ficha del Paciente
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ingresá tu <strong>DNI</strong> o <strong>Código de Reserva</strong> para consultar tus citas médicas y confirmar asistencia.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Portal Seguro</span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ingresá tu DNI (ej: 35894120) o Código (ej: TRN-94454)"
                value={criterioBusqueda}
                onChange={(e) => {
                  setCriterioBusqueda(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-hidden transition"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-sky-600/20 transition cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Buscar Mis Datos</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-rose-800 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </form>
      </div>

      {/* RESULTADO: FICHA DEL PACIENTE Y LISTADO DE TURNOS */}
      {patientFound && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Ficha Médica del Paciente */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-50 via-indigo-50/40 to-white border border-sky-200 rounded-3xl shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-sm shadow-2xs">
                  {patientFound.nombre ? patientFound.nombre.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {patientFound.apellido ? `${patientFound.apellido}, ${patientFound.nombre}` : (patientFound.nombre || 'Paciente')}
                  </h3>
                  <span className="text-xs font-mono font-bold text-sky-800 bg-white px-2 py-0.5 rounded-lg border border-sky-200 inline-block">
                    DNI: {patientFound.dni || 'S/D'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-black rounded-xl border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Paciente Registrado</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Cobertura de Salud</span>
                <strong className="text-slate-900 font-bold">
                  {patientFound.obra_social_nombre || 'Particular'} {patientFound.plan_nombre ? `(${patientFound.plan_nombre})` : ''}
                </strong>
                {patientFound.numero_afiliado && (
                  <span className="block text-[11px] text-slate-500 font-mono">Afiliado: {patientFound.numero_afiliado}</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Contacto & WhatsApp</span>
                <strong className="text-slate-900 font-bold font-mono">
                  {patientFound.telefono_whatsapp || 'No registrado'}
                </strong>
                {patientFound.email && (
                  <span className="block text-[11px] text-slate-500 truncate">{patientFound.email}</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Domicilio</span>
                <strong className="text-slate-800 font-medium truncate block">
                  {patientFound.domicilio || 'Córdoba Capital, Córdoba'}
                </strong>
              </div>
            </div>
          </div>

          {/* Listado de Turnos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Turnos Agendados ({patientTurnos.length})
              </h4>
            </div>

            {patientTurnos.length === 0 ? (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
                <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto">
                  <CalendarPlus className="w-6 h-6" />
                </div>
                <h4 className="font-black text-slate-900 text-sm">No registras turnos activos en este momento</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tu ficha médica está al día. Si deseas agendar una nueva consulta con nuestros especialistas, podés solicitar tu turno online:
                </p>
                <button
                  type="button"
                  onClick={() => window.location.href = '/?modo=paciente'}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-md shadow-sky-600/20 transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Solicitar un Nuevo Turno</span>
                </button>
              </div>
            ) : (
              patientTurnos.map((t) => {
                const prof = profesionales.find(p => p.id === t.profesional_id) || { nombre: t.profesional_nombre || 'Profesional', especialidad: t.especialidad_nombre || 'Consulta' };
                const cons = consultorios.find(c => c.id === t.consultorio_id) || { nombre: t.consultorio_nombre || 'Consultorio' };
                const targetClinica = clinicas?.find(c => c.id === t.clinica_id) || activeClinica || { nombre: 'Sede Central', direccion: 'Av. Colón 1250' };
                const os = obrasSociales.find(o => o.id === t.obra_social_id);
                const plan = planes.find(p => p.id === t.plan_id);
                const practica = nomenclador.find(p => p.id === t.practica_id);
                const isCancelled = t.estado === 'CANCELADO';
                const isConfirmed = t.confirmado_whatsapp || t.estado === 'CONFIRMADO';

                return (
                  <div 
                    key={t.id} 
                    className={`p-4 sm:p-5 rounded-3xl border transition shadow-xs space-y-3 ${
                      isCancelled 
                        ? 'bg-slate-50 border-slate-200 opacity-60' 
                        : isConfirmed 
                          ? 'bg-white border-emerald-200 hover:border-emerald-300' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Header de la tarjeta */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-900 text-white rounded-xl font-mono text-xs font-black shadow-2xs">
                          {t.codigo_reserva}
                        </span>
                        <span className={`px-2.5 py-0.5 text-xs font-black rounded-lg ${
                          isCancelled
                            ? 'bg-rose-100 text-rose-800'
                            : isConfirmed
                              ? 'bg-emerald-100 text-emerald-900'
                              : t.estado === 'EN_ESPERA'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-sky-100 text-sky-900'
                        }`}>
                          {isCancelled ? 'CANCELADO' : isConfirmed ? '✓ ASISTENCIA CONFIRMADA' : t.estado}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1 text-slate-900">
                          <Calendar className="w-3.5 h-3.5 text-sky-600" />
                          {formatDateAR(t.fecha)}
                        </span>
                        <span className="flex items-center gap-1 text-slate-900 font-mono">
                          <Clock className="w-3.5 h-3.5 text-sky-600" />
                          {t.hora_inicio} hs
                        </span>
                      </div>
                    </div>

                    {/* Grilla de información */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Profesional</span>
                        <strong className="text-slate-900 font-black block">
                          Dr(a). {prof.nombre} {prof.apellido || ''}
                        </strong>
                        <span className="text-sky-800 font-bold text-[11px]">{prof.especialidad || 'Consulta Médica'}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Lugar de Atención</span>
                        <strong className="text-slate-900 font-bold block">
                          {targetClinica.nombre}
                        </strong>
                        <span className="text-slate-500 text-[11px] block">{cons.nombre} • {targetClinica.direccion}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Cobertura & Coseguro</span>
                        <strong className="text-slate-900 font-bold block">
                          {t.obra_social_nombre || patientFound.obra_social_nombre || 'Particular'}
                        </strong>
                        <span className={`text-[11px] font-black ${Number(t.monto_coseguro || 0) > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {Number(t.monto_coseguro || 0) > 0 ? `Coseguro: $${Number(t.monto_coseguro).toLocaleString('es-AR')}` : 'Cobertura 100%'}
                        </span>
                      </div>
                    </div>

                    {/* Botones de acción para el paciente */}
                    {!isCancelled && (
                      <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100 flex-wrap">
                        {!isConfirmed && (
                          <button
                            type="button"
                            onClick={() => {
                              updateTurnoEstado(t.id, 'CONFIRMADO', { confirmado_whatsapp: true });
                              showToast('¡Gracias! Has confirmado tu asistencia al turno.', 'success');
                              handleSearch();
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirmar Asistencia</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedTurnoForVoucher({ turno: t, paciente: patientFound, profesional: prof, consultorio: cons, obraSocial: os, plan, practica })}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ver Comprobante / PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTurnoToReprogram(t);
                            setShowReprogramModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 text-sky-600" />
                          <span>Reprogramar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTurnoToCancel(t);
                            setShowCancelModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Cancelar Turno</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal de Reprogramación */}
      {showReprogramModal && (
        <ReprogramarTurnoModal
          isOpen={showReprogramModal}
          turno={turnoToReprogram}
          onClose={() => {
            setShowReprogramModal(false);
            handleSearch();
          }}
        />
      )}

      {/* Modal de Cancelación con Motivo Obligatorio */}
      {showCancelModal && (
        <CancelarTurnoModal
          isOpen={showCancelModal}
          turno={turnoToCancel}
          canceladoPor="PACIENTE"
          onClose={() => {
            setShowCancelModal(false);
            handleSearch();
          }}
        />
      )}

      {/* Voucher Modal */}
      {selectedTurnoForVoucher && (
        <VoucherModal
          turno={selectedTurnoForVoucher.turno}
          paciente={selectedTurnoForVoucher.paciente}
          profesional={selectedTurnoForVoucher.profesional}
          consultorio={selectedTurnoForVoucher.consultorio}
          obraSocial={selectedTurnoForVoucher.obraSocial}
          plan={selectedTurnoForVoucher.plan}
          practica={selectedTurnoForVoucher.practica}
          onClose={() => setSelectedTurnoForVoucher(null)}
        />
      )}
    </div>
  );
};

