import React, { useState } from 'react';
import { Repeat, Calendar, Clock, User, ShieldCheck, CheckCircle2, X, AlertCircle, Printer, Sparkles, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';

export const TurnoRecurrenteModal = ({ isOpen, onClose }) => {
  const { 
    profesionales, 
    servicios, 
    consultorios, 
    obrasSociales, 
    planes, 
    nomenclador, 
    crearPaqueteSesiones 
  } = useApp();

  const [profesionalId, setProfesionalId] = useState(() => profesionales[0]?.id || '');
  const [servicioId, setServicioId] = useState('');
  const [practicaId, setPracticaId] = useState(() => nomenclador[0]?.id || '');
  const [obraSocialId, setObraSocialId] = useState(() => obrasSociales[0]?.id || '');
  const [planId, setPlanId] = useState('');

  // Paciente
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [numeroAfiliado, setNumeroAfiliado] = useState('');

  // Parámetros de Recurrencia
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [horaInicio, setHoraInicio] = useState('10:00');
  const [duracionMin, setDuracionMin] = useState(40);
  const [frecuenciaTipo, setFrecuenciaTipo] = useState('L_M_V'); // 'SEMANAL' | 'L_M_V' | 'M_J' | 'DIARIO'
  const [cantidadSesiones, setCantidadSesiones] = useState(10);
  const [montoCoseguroSesion, setMontoCoseguroSesion] = useState(0);
  const [observaciones, setObservaciones] = useState('Tratamiento de Kinesiología y Fisioterapia');

  // Resultado generado
  const [paqueteGenerado, setPaqueteGenerado] = useState(null);

  if (!isOpen) return null;

  const handleDniBlur = () => {
    if (!dni.trim()) return;
    const existing = StorageService.findPacienteByDni(dni);
    if (existing) {
      setNombre(existing.nombre || '');
      setApellido(existing.apellido || '');
      setTelefono(existing.telefono_whatsapp || '');
      setNumeroAfiliado(existing.numero_afiliado || '');
      if (existing.obra_social_id) setObraSocialId(existing.obra_social_id);
      if (existing.plan_id) setPlanId(existing.plan_id);
    }
  };

  const getDiasSemanaArray = () => {
    switch (frecuenciaTipo) {
      case 'SEMANAL': {
        const d = new Date(fechaInicio + 'T00:00:00').getDay();
        return [d];
      }
      case 'L_M_V':
        return [1, 3, 5]; // Lun, Mié, Vie
      case 'M_J':
        return [2, 4]; // Mar, Jue
      case 'DIARIO':
        return [1, 2, 3, 4, 5]; // Lun a Vie
      default:
        return [1, 3, 5];
    }
  };

  const calculateHoraFin = (start, dur) => {
    const [h, m] = start.split(':').map(Number);
    const total = h * 60 + m + dur;
    const endH = Math.floor(total / 60);
    const endM = total % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dni || !nombre || !apellido || !profesionalId || !fechaInicio || !horaInicio) {
      alert('Por favor complete los datos obligatorios.');
      return;
    }

    const dias_semana = getDiasSemanaArray();
    const hora_fin = calculateHoraFin(horaInicio, Number(duracionMin));

    const result = crearPaqueteSesiones({
      pacienteData: {
        dni,
        nombre,
        apellido,
        telefono_whatsapp: telefono,
        numero_afiliado: numeroAfiliado,
        obra_social_id: obraSocialId,
        plan_id: planId || null
      },
      profesional_id: profesionalId,
      servicio_id: servicioId || null,
      practica_id: practicaId || null,
      obra_social_id: obraSocialId || null,
      plan_id: planId || null,
      fecha_inicio: fechaInicio,
      hora_inicio: horaInicio,
      hora_fin: hora_fin,
      dias_semana: dias_semana,
      cantidad_sesiones: Number(cantidadSesiones),
      monto_coseguro_sesion: Number(montoCoseguroSesion),
      observaciones: observaciones
    });

    setPaqueteGenerado(result);
  };

  const selectedProf = profesionales.find(p => p.id === profesionalId);
  const selectedOS = obrasSociales.find(o => o.id === obraSocialId);
  const availablePlanes = planes.filter(p => p.obra_social_id === obraSocialId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
        {!paqueteGenerado ? (
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Agendar Paquete de Sesiones Recurrentes</h3>
                  <p className="text-xs text-slate-500">Ideal para Kinesiología, Fisioterapia, Psicología o Fonoaudiología</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Datos del Paciente */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider">1. Datos del Paciente</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">DNI *</label>
                    <input
                      type="text"
                      required
                      placeholder="sin puntos"
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      onBlur={handleDniBlur}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Apellido *</label>
                    <input
                      type="text"
                      required
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">WhatsApp / Teléfono</label>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Obra Social / Prepaga</label>
                    <select
                      value={obraSocialId}
                      onChange={(e) => {
                        setObraSocialId(e.target.value);
                        setPlanId('');
                      }}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    >
                      {obrasSociales.map(os => (
                        <option key={os.id} value={os.id}>{os.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Profesional y Especialidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Profesional *</label>
                  <select
                    value={profesionalId}
                    onChange={(e) => setProfesionalId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                  >
                    {profesionales.map(p => (
                      <option key={p.id} value={p.id}>
                        Dr(a). {p.nombre} {p.apellido} ({p.especialidad})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Práctica a Realizar</label>
                  <select
                    value={practicaId}
                    onChange={(e) => setPracticaId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                  >
                    {nomenclador.map(nom => (
                      <option key={nom.id} value={nom.id}>
                        {nom.codigo_pmo} - {nom.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Parámetros de las Sesiones */}
              <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-3">
                <span className="block text-xs font-bold text-purple-900 uppercase tracking-wider">2. Parámetros del Tratamiento</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Cantidad de Sesiones *</label>
                    <select
                      value={cantidadSesiones}
                      onChange={(e) => setCantidadSesiones(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-black bg-white"
                    >
                      <option value={5}>5 Sesiones</option>
                      <option value={8}>8 Sesiones</option>
                      <option value={10}>10 Sesiones (Estándar)</option>
                      <option value={12}>12 Sesiones</option>
                      <option value={15}>15 Sesiones</option>
                      <option value={20}>20 Sesiones</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Frecuencia *</label>
                    <select
                      value={frecuenciaTipo}
                      onChange={(e) => setFrecuenciaTipo(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    >
                      <option value="L_M_V">Lunes, Miércoles y Viernes (3x/sem)</option>
                      <option value="M_J">Martes y Jueves (2x/sem)</option>
                      <option value="SEMANAL">1 vez por semana (mismo día)</option>
                      <option value="DIARIO">Todos los días hábiles (Lun a Vie)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Duración por sesión</label>
                    <select
                      value={duracionMin}
                      onChange={(e) => setDuracionMin(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    >
                      <option value={30}>30 minutos</option>
                      <option value={40}>40 minutos (Kinesio)</option>
                      <option value={45}>45 minutos (Psico)</option>
                      <option value={60}>60 minutos</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha de la 1° Sesión *</label>
                    <input
                      type="date"
                      required
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Hora de Atención *</label>
                    <input
                      type="time"
                      required
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
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
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-black bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md shadow-purple-600/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generar Paquete de {cantidadSesiones} Sesiones</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* RESULTADO: CARNET Y CRONOGRAMA DE SESIONES GENERADO */
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="font-extrabold text-base text-slate-900">¡Tratamiento Agendado Exitosamente!</h3>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="printable-area" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 print:bg-white print:border-none print:p-0">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h4 className="font-black text-base text-slate-900 uppercase">Carnet / Cronograma de Tratamiento</h4>
                <p className="text-xs text-slate-600">
                  Paciente: <strong>{paqueteGenerado.paciente.nombre} {paqueteGenerado.paciente.apellido}</strong> (DNI {paqueteGenerado.paciente.dni})
                </p>
                <p className="text-xs text-purple-700 font-bold">
                  Dr(a). {selectedProf?.nombre} {selectedProf?.apellido} • Código: {paqueteGenerado.codigo_paquete}
                </p>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {paqueteGenerado.turnos.map((t, idx) => (
                  <div key={t.id} className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-black">
                        #{idx + 1}
                      </span>
                      <span>{new Date(t.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    </div>
                    <span className="font-mono text-slate-800">{t.hora_inicio} hs</span>
                    <span className="text-[10px] text-slate-400 font-mono">{t.codigo_reserva}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Carnet de Sesiones</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 rounded-xl"
              >
                Listo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
