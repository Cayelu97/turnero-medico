import React, { useState } from 'react';
import { Search, Calendar, Clock, User, ShieldCheck, XCircle, RefreshCw, FileText, CheckCircle2, Lock, ShieldAlert, KeyRound, Phone, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VoucherModal } from './VoucherModal';
import { ReprogramarTurnoModal } from '../secretary/ReprogramarTurnoModal';
import { CancelarTurnoModal } from '../secretary/CancelarTurnoModal';

export const MisTurnos = () => {
  const { turnos, pacientes, profesionales, consultorios, obrasSociales, planes, nomenclador } = useApp();

  const [dni, setDni] = useState('');
  const [authMethod, setAuthMethod] = useState('codigo'); // 'codigo' | 'celular'
  const [codigoReserva, setCodigoReserva] = useState('');
  const [ultimosDigitosCel, setUltimosDigitosCel] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedTurnoForVoucher, setSelectedTurnoForVoucher] = useState(null);
  const [turnoToCancel, setTurnoToCancel] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [turnoToReprogram, setTurnoToReprogram] = useState(null);
  const [showReprogramModal, setShowReprogramModal] = useState(false);

  const handleSearchAndAuth = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsAuthenticated(false);

    const cleanDni = dni.replace(/\D/g, '');
    if (!cleanDni) {
      setErrorMsg('Por favor ingrese su número de DNI.');
      return;
    }

    const patient = pacientes.find(p => p.dni.replace(/\D/g, '') === cleanDni);
    if (!patient) {
      setErrorMsg(`No se encontró ningún registro para el DNI ${dni}.`);
      return;
    }

    const patientTurnos = turnos.filter(t => t.paciente_id === patient.id);
    if (patientTurnos.length === 0) {
      setErrorMsg('No registra turnos agendados en el sistema.');
      return;
    }

    // Validación de segundo factor de seguridad
    if (authMethod === 'codigo') {
      const cleanCodigo = codigoReserva.trim().toUpperCase();
      if (!cleanCodigo) {
        setErrorMsg('Por favor ingrese el Código de Reserva del turno (ej: TRN-12345).');
        return;
      }
      const match = patientTurnos.some(t => t.codigo_reserva.toUpperCase() === cleanCodigo);
      if (!match) {
        setErrorMsg('El Código de Reserva no coincide con los turnos asociados a este DNI. Verifique su comprobante o ingrese mediante los 4 dígitos de su celular.');
        return;
      }
    } else {
      const cleanDigits = ultimosDigitosCel.replace(/\D/g, '');
      if (cleanDigits.length < 4) {
        setErrorMsg('Por favor ingrese los últimos 4 dígitos de su celular / WhatsApp.');
        return;
      }
      const patientPhone = (patient.telefono_whatsapp || '').replace(/\D/g, '');
      if (!patientPhone.endsWith(cleanDigits)) {
        setErrorMsg('Los 4 dígitos ingresados no coinciden con el número de teléfono registrado al solicitar el turno.');
        return;
      }
    }

    setIsAuthenticated(true);
  };

  const handleConfirmCancel = () => {
    if (!turnoToCancel) return;
    cancelarTurno(turnoToCancel.id, cancelMotivo || 'Cancelado por el paciente desde el portal online', 'PACIENTE');
    setTurnoToCancel(null);
    setCancelMotivo('');
  };

  const cleanDni = dni.replace(/\D/g, '');
  const patient = pacientes.find(p => p.dni.replace(/\D/g, '') === cleanDni);
  const patientTurnos = patient && isAuthenticated ? turnos.filter(t => t.paciente_id === patient.id) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tarjeta de Acceso Seguro */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-medical-50 text-medical-700 rounded-xl">
                <Lock className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-slate-900">Consulta y Gestión Segura de Turnos</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Para proteger su privacidad e impedir cancelaciones no autorizadas, valide su identidad con su <strong>DNI</strong> y un <strong>segundo factor de seguridad</strong>.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Acceso Protegido</span>
          </div>
        </div>

        <form onSubmit={handleSearchAndAuth} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Campo 1: DNI */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Número de DNI del Paciente *
              </label>
              <input
                type="text"
                required
                placeholder="ej: 34567890 (sin puntos)"
                value={dni}
                onChange={(e) => {
                  setDni(e.target.value);
                  setIsAuthenticated(false);
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-medical-500"
              />
            </div>

            {/* Selector de Segundo Factor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Segundo Factor de Seguridad *</label>
                <div className="flex gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setAuthMethod('codigo')}
                    className={`font-bold transition ${authMethod === 'codigo' ? 'text-medical-600 underline' : 'text-slate-400'}`}
                  >
                    Código de Turno
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('celular')}
                    className={`font-bold transition ${authMethod === 'celular' ? 'text-medical-600 underline' : 'text-slate-400'}`}
                  >
                    Últimos 4 dígitos Celular
                  </button>
                </div>
              </div>

              {authMethod === 'codigo' ? (
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ej: TRN-74192"
                    value={codigoReserva}
                    onChange={(e) => {
                      setCodigoReserva(e.target.value);
                      setIsAuthenticated(false);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-medical-500"
                  />
                </div>
              ) : (
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="ej: 8492 (últimos 4 dígitos)"
                    value={ultimosDigitosCel}
                    onChange={(e) => {
                      setUltimosDigitosCel(e.target.value);
                      setIsAuthenticated(false);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-medical-500"
                  />
                </div>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-800 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold text-xs shadow-md shadow-medical-600/20 transition"
            >
              <Search className="w-4 h-4" />
              <span>Validar y Ver Mis Turnos</span>
            </button>
          </div>
        </form>
      </div>

      {/* Turnos Validados */}
      {isAuthenticated && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-extrabold text-slate-800">
              Turnos registrados para: <strong className="text-medical-800">{patient?.nombre} {patient?.apellido}</strong> (DNI {patient?.dni})
            </h3>
            <span className="text-xs font-bold text-slate-500">{patientTurnos.length} turnos encontrados</span>
          </div>

          {patientTurnos.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center text-slate-500 text-xs">
              No registra turnos activos en este momento.
            </div>
          ) : (
            patientTurnos.map((t) => {
              const prof = profesionales.find(p => p.id === t.profesional_id);
              const cons = consultorios.find(c => c.id === t.consultorio_id);
              const os = obrasSociales.find(o => o.id === t.obra_social_id);
              const plan = planes.find(p => p.id === t.plan_id);
              const practica = nomenclador.find(p => p.id === t.practica_id);
              const isCancelled = t.estado === 'CANCELADO';

              return (
                <div key={t.id} className={`p-5 rounded-2xl border shadow-xs transition ${
                  isCancelled ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-mono text-xs font-black">
                        {t.codigo_reserva}
                      </span>
                      {t.nro_sesion && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md text-[10px] font-black">
                          Sesión {t.nro_sesion}/{t.total_sesiones}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                        t.estado === 'PROGRAMADO' ? 'bg-sky-100 text-sky-800' :
                        t.estado === 'CONFIRMADO' ? 'bg-emerald-100 text-emerald-800' :
                        t.estado === 'EN_ESPERA' ? 'bg-amber-100 text-amber-800' :
                        t.estado === 'EN_ATENCION' ? 'bg-purple-100 text-purple-800' :
                        t.estado === 'ATENDIDO' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {t.estado.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-medical-600" />
                        {t.fecha}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-medical-600" />
                        {t.hora_inicio} hs
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-semibold block">Médico:</span>
                      <strong className="text-slate-900">Dr(a). {prof?.nombre} {prof?.apellido}</strong>
                      <span className="block text-medical-700">{prof?.especialidad}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Ubicación:</span>
                      <strong className="text-slate-900">{cons?.nombre || 'Consultorio'}</strong>
                      <span className="block text-slate-500">{cons?.piso_ubicacion}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Práctica & Cobertura:</span>
                      <strong className="text-slate-900">{practica?.descripcion || 'Consulta'}</strong>
                      <span className="block text-slate-500">{os?.nombre} {plan ? `(${plan.nombre_plan})` : ''}</span>
                    </div>
                  </div>

                  {!isCancelled && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedTurnoForVoucher({ turno: t, paciente: patient, profesional: prof, consultorio: cons, obraSocial: os, plan, practica })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-medical-600" />
                        <span>Ver Comprobante</span>
                      </button>
                      <button
                        onClick={() => {
                          setTurnoToReprogram(t);
                          setShowReprogramModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg text-xs font-bold transition"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Reprogramar</span>
                      </button>
                      <button
                        onClick={() => {
                          setTurnoToCancel(t);
                          setShowCancelModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelar Turno</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal de Reprogramación */}
      <ReprogramarTurnoModal
        isOpen={showReprogramModal}
        turno={turnoToReprogram}
        onClose={() => setShowReprogramModal(false)}
      />

      {/* Modal de Cancelación con Motivo Obligatorio */}
      <CancelarTurnoModal
        isOpen={showCancelModal}
        turno={turnoToCancel}
        canceladoPor="PACIENTE"
        onClose={() => setShowCancelModal(false)}
      />

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
