import React, { useState } from 'react';
import { Settings, Calendar, Clock, DoorClosed, Check, X, Sparkles, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ConfigurarAgendaModal = ({ isOpen, onClose, defaultProfId = null }) => {
  const { profesionales, servicios, consultorios, configurarAgendaSemanal } = useApp();

  const [profesionalId, setProfesionalId] = useState(() => defaultProfId || profesionales[0]?.id || '');
  const [servicioId, setServicioId] = useState('');
  const [diasSeleccionados, setDiasSeleccionados] = useState([1, 2, 3, 4, 5]); // Lunes a Viernes por defecto
  const [duracionSlot, setDuracionSlot] = useState(20);
  const [consultorioId, setConsultorioId] = useState(() => consultorios[0]?.id || '');

  // Horarios de turnos
  const [habilitarManana, setHabilitarManana] = useState(true);
  const [mananaInicio, setMananaInicio] = useState('08:00');
  const [mananaFin, setMananaFin] = useState('13:00');

  const [habilitarTarde, setHabilitarTarde] = useState(true);
  const [tardeInicio, setTardeInicio] = useState('14:00');
  const [tardeFin, setTardeFin] = useState('19:00');

  if (!isOpen) return null;

  const selectedProf = profesionales.find(p => p.id === profesionalId);

  // Servicios aplicables a este médico
  const serviciosDelMedico = servicios.filter(s => 
    (selectedProf?.servicios_ids && selectedProf.servicios_ids.includes(s.id)) ||
    s.especialidad_id === selectedProf?.especialidad_id ||
    s.nombre.toLowerCase().includes(selectedProf?.especialidad?.toLowerCase() || '')
  );

  const DIAS = [
    { id: 1, label: 'Lun', full: 'Lunes' },
    { id: 2, label: 'Mar', full: 'Martes' },
    { id: 3, label: 'Mié', full: 'Miércoles' },
    { id: 4, label: 'Jue', full: 'Jueves' },
    { id: 5, label: 'Vie', full: 'Viernes' },
    { id: 6, label: 'Sáb', full: 'Sábado' },
    { id: 0, label: 'Dom', full: 'Domingo' }
  ];

  const toggleDia = (diaId) => {
    setDiasSeleccionados(prev => 
      prev.includes(diaId) ? prev.filter(d => d !== diaId) : [...prev, diaId]
    );
  };

  const selectLunesAViernes = () => {
    setDiasSeleccionados([1, 2, 3, 4, 5]);
  };

  const selectTodosLosDias = () => {
    setDiasSeleccionados([1, 2, 3, 4, 5, 6]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!profesionalId || diasSeleccionados.length === 0) {
      alert('Por favor seleccione al menos un día de atención.');
      return;
    }

    const turnos_horarios = [];
    if (habilitarManana && mananaInicio && mananaFin) {
      turnos_horarios.push({ hora_inicio: mananaInicio, hora_fin: mananaFin });
    }
    if (habilitarTarde && tardeInicio && tardeFin) {
      turnos_horarios.push({ hora_inicio: tardeInicio, hora_fin: tardeFin });
    }

    if (turnos_horarios.length === 0) {
      alert('Debe habilitar al menos una franja horaria (Mañana o Tarde).');
      return;
    }

    configurarAgendaSemanal({
      profesional_id: profesionalId,
      servicio_id: servicioId || null,
      dias_semana: diasSeleccionados,
      turnos_horarios,
      consultorio_id: consultorioId,
      duracion_slot_min: Number(duracionSlot)
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-medical-50 text-medical-600 rounded-2xl border border-medical-200">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Configurador de Agendas Semanales</h3>
              <p className="text-xs text-slate-500">Crea o actualiza los días, horarios y duración de turnos</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Seleccionar Profesional y Servicio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Profesional Médico *</label>
              <select
                value={profesionalId}
                onChange={(e) => {
                  setProfesionalId(e.target.value);
                  setServicioId('');
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
              >
                {profesionales.map(p => (
                  <option key={p.id} value={p.id}>
                    Dr(a). {p.nombre} {p.apellido} ({p.especialidad})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Servicio Médico / Tipo de Turnero</label>
              <select
                value={servicioId}
                onChange={(e) => {
                  const sId = e.target.value;
                  setServicioId(sId);
                  const serv = servicios.find(s => s.id === sId);
                  if (serv?.duracion_default_min) {
                    setDuracionSlot(serv.duracion_default_min);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
              >
                <option value="">Servicio General / Consultas</option>
                {serviciosDelMedico.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.duracion_default_min} min)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Días de la Semana */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">Días de Atención Semanal *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectLunesAViernes}
                  className="text-[11px] font-bold text-medical-600 hover:underline"
                >
                  Lun a Vie
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={selectTodosLosDias}
                  className="text-[11px] font-bold text-medical-600 hover:underline"
                >
                  Lun a Sáb
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {DIAS.map(d => {
                const isSelected = diasSeleccionados.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDia(d.id)}
                    className={`py-2.5 rounded-xl border text-xs font-extrabold transition flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'bg-medical-600 text-white border-medical-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{d.label}</span>
                    {isSelected && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Franjas Horarias (Mañana y Tarde) */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="block text-xs font-extrabold text-slate-800">Franjas Horarias de Atención:</span>

            {/* Turno Mañana */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={habilitarManana}
                  onChange={(e) => setHabilitarManana(e.target.checked)}
                  className="rounded text-medical-600 focus:ring-medical-500"
                />
                <span>Turno Mañana</span>
              </label>

              {habilitarManana && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block mb-0.5">Desde:</span>
                    <input
                      type="time"
                      value={mananaInicio}
                      onChange={(e) => setMananaInicio(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block mb-0.5">Hasta:</span>
                    <input
                      type="time"
                      value={mananaFin}
                      onChange={(e) => setMananaFin(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Turno Tarde */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={habilitarTarde}
                  onChange={(e) => setHabilitarTarde(e.target.checked)}
                  className="rounded text-medical-600 focus:ring-medical-500"
                />
                <span>Turno Tarde</span>
              </label>

              {habilitarTarde && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block mb-0.5">Desde:</span>
                    <input
                      type="time"
                      value={tardeInicio}
                      onChange={(e) => setTardeInicio(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block mb-0.5">Hasta:</span>
                    <input
                      type="time"
                      value={tardeFin}
                      onChange={(e) => setTardeFin(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Duración de Turno / Intervalo de tiempo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fracción de Tiempo (Slot) *</label>
              <select
                value={duracionSlot}
                onChange={(e) => setDuracionSlot(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
              >
                <option value={10}>Cada 10 minutos (6 turnos/hora)</option>
                <option value={15}>Cada 15 minutos (4 turnos/hora)</option>
                <option value={20}>Cada 20 minutos (3 turnos/hora)</option>
                <option value={30}>Cada 30 minutos (2 turnos/hora)</option>
                <option value={45}>Cada 45 minutos</option>
                <option value={60}>Cada 60 minutos (1 turno/hora)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Consultorio Físico Asignado</label>
              <select
                value={consultorioId}
                onChange={(e) => setConsultorioId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
              >
                {consultorios.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-bold shadow-md shadow-medical-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generar y Guardar Agenda</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
