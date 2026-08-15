import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Clock, 
  DollarSign, 
  Tv, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Search, 
  DoorClosed, 
  ShieldCheck, 
  Calendar,
  Volume2,
  Stethoscope
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CobroCoseguroModal } from './CobroCoseguroModal';
import { getLocalDateString } from '../../utils/dateUtils';

export const RecepcionView = () => {
  const { 
    turnos, 
    profesionales, 
    consultorios, 
    pacientes, 
    obrasSociales, 
    planes, 
    nomenclador,
    updateTurnoEstado,
    setCurrentView 
  } = useApp();

  const [filterState, setFilterState] = useState('ALL'); // 'ALL' | 'EN_ESPERA' | 'PROGRAMADO' | 'ATENDIDO'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTurnoForCobro, setSelectedTurnoForCobro] = useState(null);

  const todayStr = getLocalDateString(new Date());

  // Turnos de hoy
  const turnosHoy = turnos.filter(t => t.fecha === todayStr);

  // Estadísticas del día
  const totalHoy = turnosHoy.filter(t => t.estado !== 'CANCELADO').length;
  const enEsperaHoy = turnosHoy.filter(t => t.estado === 'EN_ESPERA').length;
  const enAtencionHoy = turnosHoy.filter(t => t.estado === 'EN_ATENCION').length;
  const atendidosHoy = turnosHoy.filter(t => t.estado === 'ATENDIDO').length;
  const totalRecaudadoCoseguros = turnosHoy
    .filter(t => t.estado_coseguro === 'COBRADO')
    .reduce((sum, t) => sum + Number(t.monto_coseguro || 0), 0);

  // Cálculo de tiempo de espera en minutos
  const getMinutosEspera = (horaLlegadaStr) => {
    if (!horaLlegadaStr) return 0;
    const llegada = new Date(horaLlegadaStr).getTime();
    const ahora = new Date().getTime();
    return Math.max(0, Math.floor((ahora - llegada) / 60000));
  };

  const filteredTurnos = turnosHoy.filter(t => {
    if (filterState !== 'ALL' && t.estado !== filterState) return false;
    if (searchTerm) {
      const pac = pacientes.find(p => p.id === t.paciente_id);
      const text = `${pac?.nombre || ''} ${pac?.apellido || ''} ${pac?.dni || ''} ${t.codigo_reserva}`.toLowerCase();
      if (!text.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  }).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Resumen de Recepción en Tarjetas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500">Total Hoy</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalHoy}</p>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-sm">
          <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> En Sala de Espera
          </span>
          <p className="text-2xl font-black text-amber-900 mt-1">{enEsperaHoy}</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 shadow-sm">
          <span className="text-xs font-bold text-purple-800 flex items-center gap-1">
            <Stethoscope className="w-3.5 h-3.5" /> En Consultorio
          </span>
          <p className="text-2xl font-black text-purple-900 mt-1">{enAtencionHoy}</p>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Atendidos
          </span>
          <p className="text-2xl font-black text-emerald-900 mt-1">{atendidosHoy}</p>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm col-span-2 sm:col-span-1">
          <span className="text-xs font-bold text-slate-400">Caja Coseguros</span>
          <p className="text-xl font-black text-emerald-400 mt-1">
            ${totalRecaudadoCoseguros.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por apellido, DNI o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setFilterState('ALL')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterState === 'ALL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            Todos ({turnosHoy.length})
          </button>
          <button
            onClick={() => setFilterState('EN_ESPERA')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterState === 'EN_ESPERA' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            En Espera ({enEsperaHoy})
          </button>
          <button
            onClick={() => setFilterState('PROGRAMADO')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterState === 'PROGRAMADO' ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            Pendientes de Llegar
          </button>
          <button
            onClick={() => setFilterState('ATENDIDO')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterState === 'ATENDIDO' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            Atendidos ({atendidosHoy})
          </button>
        </div>
      </div>

      {/* Lista de Pacientes en Recepción */}
      <div className="space-y-3">
        {filteredTurnos.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
            No hay pacientes en este estado para el día de hoy.
          </div>
        ) : (
          filteredTurnos.map((t) => {
            const pac = pacientes.find(p => p.id === t.paciente_id);
            const prof = profesionales.find(p => p.id === t.profesional_id);
            const cons = consultorios.find(c => c.id === t.consultorio_id);
            const os = obrasSociales.find(o => o.id === t.obra_social_id);
            const plan = planes.find(p => p.id === t.plan_id);
            const practica = nomenclador.find(p => p.id === t.practica_id);

            const minutosEspera = getMinutosEspera(t.hora_llegada_recepcion);
            const esCoseguroPendiente = t.monto_coseguro > 0 && t.estado_coseguro !== 'COBRADO';

            return (
              <div 
                key={t.id}
                className={`p-4 sm:p-5 rounded-3xl border shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  t.estado === 'EN_ESPERA' 
                    ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20' 
                    : t.estado === 'EN_ATENCION'
                    ? 'bg-purple-50/60 border-purple-300 ring-2 ring-purple-400/20'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Info del Paciente y Horario */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center p-2.5 bg-slate-100 rounded-2xl border border-slate-200 min-w-[64px]">
                    <span className="font-mono text-sm font-black text-slate-900">{t.hora_inicio}</span>
                    <span className="text-[10px] text-slate-500 font-bold">hs</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-base text-slate-900">
                        {pac ? `${pac.apellido}, ${pac.nombre}` : 'Paciente'}
                      </h3>
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        DNI {pac?.dni}
                      </span>
                      <span className="font-mono text-xs font-extrabold text-medical-700 bg-medical-50 px-2 py-0.5 rounded border border-medical-200">
                        {t.codigo_reserva}
                      </span>
                      {t.es_sobreturno && (
                        <span className="text-[10px] font-black bg-amber-200 text-amber-950 px-2 py-0.5 rounded">
                          SOBRETURNO
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap font-medium">
                      <span><strong>Médico:</strong> Dr(a). {prof?.apellido} ({prof?.especialidad})</span>
                      <span>•</span>
                      <span><strong>Lugar:</strong> {cons?.nombre || 'Consultorio'}</span>
                      <span>•</span>
                      <span><strong>Cobertura:</strong> {os?.sigla || os?.nombre} {plan ? `(${plan.nombre_plan})` : ''}</span>
                    </div>

                    {/* Tiempo de espera */}
                    {t.estado === 'EN_ESPERA' && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mt-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                        <span>Tiempo en sala de espera: <strong>{minutosEspera} minutos</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección de Coseguro & Botones de Estado */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                  {/* Badge de Coseguro */}
                  <div className="text-right flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400">Coseguro</span>
                    {Number(t.monto_coseguro || 0) === 0 ? (
                      <span className="text-xs font-extrabold text-slate-500">Exento ($0)</span>
                    ) : t.estado_coseguro === 'COBRADO' ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md">
                        Cobrado (${Number(t.monto_coseguro).toLocaleString('es-AR')})
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedTurnoForCobro({ turno: t, paciente: pac, obraSocial: os, plan, practica })}
                        className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-black rounded-lg border border-rose-300 flex items-center gap-1 transition"
                      >
                        <DollarSign className="w-3 h-3" />
                        Cobrar ${Number(t.monto_coseguro).toLocaleString('es-AR')}
                      </button>
                    )}
                  </div>

                  {/* Acciones de Flujo de Atención */}
                  <div className="flex items-center gap-1.5">
                    {t.estado === 'PROGRAMADO' && (
                      <button
                        onClick={() => updateTurnoEstado(t.id, 'EN_ESPERA')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Marcar Presente</span>
                      </button>
                    )}

                    {t.estado === 'EN_ESPERA' && (
                      <button
                        onClick={() => updateTurnoEstado(t.id, 'EN_ATENCION')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Llamar a Consulta</span>
                      </button>
                    )}

                    {t.estado === 'EN_ATENCION' && (
                      <button
                        onClick={() => updateTurnoEstado(t.id, 'ATENDIDO')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Finalizar Atención</span>
                      </button>
                    )}

                    {t.estado === 'ATENDIDO' && (
                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Atendido
                      </span>
                    )}

                    {/* Ausente / Cancelar */}
                    {t.estado !== 'ATENDIDO' && t.estado !== 'CANCELADO' && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Marcar como Ausente a ${pac?.nombre} ${pac?.apellido}?`)) {
                            updateTurnoEstado(t.id, 'NO_ASISTIO');
                          }
                        }}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Marcar No Asistió / Ausente"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Cobro de Coseguro */}
      {selectedTurnoForCobro && (
        <CobroCoseguroModal
          turno={selectedTurnoForCobro.turno}
          paciente={selectedTurnoForCobro.paciente}
          obraSocial={selectedTurnoForCobro.obraSocial}
          plan={selectedTurnoForCobro.plan}
          practica={selectedTurnoForCobro.practica}
          onClose={() => setSelectedTurnoForCobro(null)}
        />
      )}
    </div>
  );
};
