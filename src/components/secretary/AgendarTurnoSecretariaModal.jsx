import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Search, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  MessageCircle, 
  Printer, 
  Plus, 
  UserPlus,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Stethoscope,
  Layers,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { WhatsAppService } from '../../services/whatsapp';
import { VoucherModal } from '../patient/VoucherModal';

export const AgendarTurnoSecretariaModal = ({ isOpen, onClose, defaultFecha = null, defaultProfId = null }) => {
  const { 
    profesionales, 
    servicios, 
    consultorios, 
    obrasSociales, 
    planes, 
    nomenclador, 
    pacientes,
    clinica,
    createTurno 
  } = useApp();

  const [step, setStep] = useState(1); // 1: Paciente y Fecha/Médico, 2: Confirmado
  
  // Fecha seleccionada
  const [fecha, setFecha] = useState(() => defaultFecha || new Date().toISOString().split('T')[0]);
  const [selectedProfId, setSelectedProfId] = useState(() => defaultProfId || '');
  const [selectedServicioId, setSelectedServicioId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [esSobreturno, setEsSobreturno] = useState(false);
  const [horaSobreturno, setHoraSobreturno] = useState('12:30');

  // Filtros de búsqueda
  const [profSearchFilter, setProfSearchFilter] = useState('');
  const [espFilter, setEspFilter] = useState('');

  // Paciente
  const [dniSearch, setDniSearch] = useState('');
  const [pacienteForm, setPacienteForm] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    telefono_whatsapp: '',
    obra_social_id: obrasSociales[0]?.id || '',
    plan_id: '',
    numero_afiliado: '',
    observaciones: 'Turno agendado en recepción'
  });

  // Práctica
  const [selectedPracticaId, setSelectedPracticaId] = useState(() => nomenclador[0]?.id || '');

  // Turno creado
  const [createdTurnoData, setCreatedTurnoData] = useState(null);

  useEffect(() => {
    if (defaultFecha) setFecha(defaultFecha);
    if (defaultProfId) setSelectedProfId(defaultProfId);
  }, [defaultFecha, defaultProfId]);

  if (!isOpen) return null;

  // Autocompletar datos del paciente por DNI
  const handleDniSearchBlur = () => {
    if (!dniSearch.trim()) return;
    const existing = StorageService.findPacienteByDni(dniSearch);
    if (existing) {
      setPacienteForm({
        dni: existing.dni,
        nombre: existing.nombre || '',
        apellido: existing.apellido || '',
        telefono_whatsapp: existing.telefono_whatsapp || '',
        obra_social_id: existing.obra_social_id || obrasSociales[0]?.id || '',
        plan_id: existing.plan_id || '',
        numero_afiliado: existing.numero_afiliado || '',
        observaciones: 'Paciente habitual'
      });
    } else {
      setPacienteForm(prev => ({ ...prev, dni: dniSearch }));
    }
  };

  // Calcular profesionales atendiendo en la fecha seleccionada
  const dateObj = new Date(fecha + 'T00:00:00');
  const diaSemana = dateObj.getDay();

  const medicosAtendiendoHoy = profesionales.filter(p => {
    if (p.activo === false) return false;
    if (espFilter && p.especialidad.toLowerCase() !== espFilter.toLowerCase()) return false;
    if (profSearchFilter.trim()) {
      const q = profSearchFilter.toLowerCase();
      const full = `${p.nombre} ${p.apellido}`.toLowerCase();
      if (!full.includes(q) && !p.especialidad.toLowerCase().includes(q)) return false;
    }
    
    // Verificar si tiene horario configurado para este día de la semana
    const horarios = StorageService.getHorariosByProfesional(p.id);
    return horarios.some(h => h.dia_semana === diaSemana);
  });

  // Obtener slots del médico seleccionado para la fecha
  const slotsDelMedico = selectedProfId 
    ? StorageService.getSlotsDisponibles(selectedProfId, fecha, selectedServicioId || null)
    : [];

  const handleConfirmarTurno = (e) => {
    e.preventDefault();
    if (!pacienteForm.dni || !pacienteForm.nombre || !pacienteForm.apellido || !selectedProfId) {
      alert('Por favor complete los datos obligatorios del paciente y profesional.');
      return;
    }

    const prof = profesionales.find(p => p.id === selectedProfId);
    const duracion = prof?.duracion_turno_minutos || 20;

    let hora_inicio = selectedSlot?.hora_inicio;
    let hora_fin = selectedSlot?.hora_fin;

    if (esSobreturno) {
      hora_inicio = horaSobreturno;
      const [h, m] = horaSobreturno.split(':').map(Number);
      const endM = h * 60 + m + duracion;
      hora_fin = `${String(Math.floor(endM / 60)).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`;
    }

    if (!hora_inicio) {
      alert('Por favor seleccione un horario disponible o active sobreturno.');
      return;
    }

    const horariosProf = StorageService.getHorariosByProfesional(selectedProfId);
    const horario = horariosProf.find(h => h.dia_semana === diaSemana);
    const consultorioId = selectedSlot?.consultorio_id || horario?.consultorio_id || consultorios[0]?.id;

    const { turno, paciente } = createTurno({
      pacienteData: {
        dni: pacienteForm.dni,
        nombre: pacienteForm.nombre,
        apellido: pacienteForm.apellido,
        telefono_whatsapp: pacienteForm.telefono_whatsapp,
        obra_social_id: pacienteForm.obra_social_id,
        plan_id: pacienteForm.plan_id || null,
        numero_afiliado: pacienteForm.numero_afiliado
      },
      turnoData: {
        profesional_id: selectedProfId,
        servicio_id: selectedServicioId || null,
        consultorio_id: consultorioId,
        practica_id: selectedPracticaId,
        obra_social_id: pacienteForm.obra_social_id,
        plan_id: pacienteForm.plan_id || null,
        numero_afiliado: pacienteForm.numero_afiliado,
        fecha: fecha,
        hora_inicio: hora_inicio,
        hora_fin: hora_fin,
        es_sobreturno: esSobreturno,
        observaciones: pacienteForm.observaciones
      }
    });

    const profObj = profesionales.find(p => p.id === selectedProfId);
    const consObj = consultorios.find(c => c.id === consultorioId);
    const osObj = obrasSociales.find(o => o.id === pacienteForm.obra_social_id);
    const planObj = planes.find(p => p.id === pacienteForm.plan_id);
    const pracObj = nomenclador.find(p => p.id === selectedPracticaId);

    setCreatedTurnoData({
      turno,
      paciente,
      profesional: profObj,
      consultorio: consObj,
      obraSocial: osObj,
      plan: planObj,
      practica: pracObj
    });

    setStep(2);
  };

  const handleSendWhatsApp = () => {
    if (!createdTurnoData) return;
    WhatsAppService.enviarMensaje({
      turno: createdTurnoData.turno,
      paciente: createdTurnoData.paciente,
      profesional: createdTurnoData.profesional,
      consultorio: createdTurnoData.consultorio,
      clinica,
      tipo: 'NUEVO'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
        {step === 1 ? (
          <div>
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-medical-50 text-medical-600 rounded-2xl border border-medical-200">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">Asistente Ágil de Agendamiento (Recepción)</h3>
                  <p className="text-xs text-slate-500">Busca el paciente, selecciona la fecha y asigna turno en 1 solo clic</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarTurno} className="space-y-4">
              {/* SECCIÓN 1: DATOS DEL PACIENTE (Búsqueda por DNI) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-medical-600" />
                    1. Datos del Paciente
                  </span>
                  {pacienteForm.nombre && pacienteForm.dni && StorageService.findPacienteByDni(pacienteForm.dni) ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ✓ Paciente registrado en padrón
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">Escriba el DNI para autocompletar</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">DNI Paciente *</label>
                    <input
                      type="text"
                      required
                      placeholder="sin puntos"
                      value={pacienteForm.dni}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPacienteForm(prev => ({ ...prev, dni: val }));
                        setDniSearch(val);
                        if (val.replace(/\D/g, '').length >= 7) {
                          const existing = StorageService.findPacienteByDni(val);
                          if (existing) {
                            setPacienteForm({
                              dni: existing.dni,
                              nombre: existing.nombre || '',
                              apellido: existing.apellido || '',
                              telefono_whatsapp: existing.telefono_whatsapp || '',
                              obra_social_id: existing.obra_social_id || obrasSociales[0]?.id || '',
                              plan_id: existing.plan_id || '',
                              numero_afiliado: existing.numero_afiliado || '',
                              observaciones: 'Paciente habitual'
                            });
                          }
                        }
                      }}
                      onBlur={handleDniSearchBlur}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-medical-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      required
                      placeholder="ej: Lucas"
                      value={pacienteForm.nombre}
                      onChange={(e) => setPacienteForm({ ...pacienteForm, nombre: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Apellido *</label>
                    <input
                      type="text"
                      required
                      placeholder="ej: Martínez"
                      value={pacienteForm.apellido}
                      onChange={(e) => setPacienteForm({ ...pacienteForm, apellido: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">WhatsApp / Celular *</label>
                    <input
                      type="tel"
                      required
                      placeholder="ej: 11 4829-1920"
                      value={pacienteForm.telefono_whatsapp}
                      onChange={(e) => setPacienteForm({ ...pacienteForm, telefono_whatsapp: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Obra Social / Prepaga</label>
                    <select
                      value={pacienteForm.obra_social_id}
                      onChange={(e) => setPacienteForm({ ...pacienteForm, obra_social_id: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    >
                      {obrasSociales.map(os => (
                        <option key={os.id} value={os.id}>{os.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Práctica / Motivo</label>
                    <select
                      value={selectedPracticaId}
                      onChange={(e) => setSelectedPracticaId(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    >
                      {nomenclador.map(nom => (
                        <option key={nom.id} value={nom.id}>{nom.codigo_pmo} - {nom.descripcion}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">N° Afiliado (opcional)</label>
                    <input
                      type="text"
                      placeholder="ej: 1098492019/01"
                      value={pacienteForm.numero_afiliado}
                      onChange={(e) => setPacienteForm({ ...pacienteForm, numero_afiliado: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: FECHA Y MÉDICOS DISPONIBLES */}
              <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    2. Fecha & Profesionales Atendiendo
                  </span>

                  {/* Selector de Fecha */}
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => {
                        setFecha(e.target.value);
                        setSelectedSlot(null);
                      }}
                      className="px-3 py-1 border border-slate-300 rounded-xl text-xs font-black bg-white shadow-xs"
                    />
                    <span className="text-[11px] font-bold text-sky-900 bg-white px-2 py-1 rounded-lg border border-sky-200">
                      {dateObj.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>

                {/* Filtro rápido por especialidad o médico */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Filtrar médico por nombre..."
                    value={profSearchFilter}
                    onChange={(e) => setProfSearchFilter(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                  />
                  <select
                    value={espFilter}
                    onChange={(e) => setEspFilter(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="">Todas las especialidades</option>
                    {Array.from(new Set(profesionales.map(p => p.especialidad))).map(esp => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                  </select>
                </div>

                {/* Lista de Médicos que atienden en esta fecha */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {medicosAtendiendoHoy.length === 0 ? (
                    <div className="p-4 bg-white border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                      Ningún profesional tiene agenda configurada para el día <strong>{dateObj.toLocaleDateString('es-AR', { weekday: 'long' })}</strong>. Pruebe otra fecha.
                    </div>
                  ) : (
                    medicosAtendiendoHoy.map(prof => {
                      const isSelectedProf = selectedProfId === prof.id;
                      const slots = StorageService.getSlotsDisponibles(prof.id, fecha, selectedServicioId || null);
                      const libres = slots.filter(s => s.disponible).length;

                      return (
                        <div
                          key={prof.id}
                          onClick={() => {
                            setSelectedProfId(prof.id);
                            setSelectedSlot(null);
                          }}
                          className={`p-3 rounded-2xl border-2 cursor-pointer transition space-y-2 ${
                            isSelectedProf
                              ? 'border-medical-600 bg-white shadow-sm ring-2 ring-medical-500/20'
                              : 'border-slate-200 bg-white/80 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div 
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs"
                                style={{ backgroundColor: prof.color_agenda || '#0284c7' }}
                              >
                                {prof.nombre[0]}{prof.apellido[0]}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-xs text-slate-900">
                                  Dr(a). {prof.nombre} {prof.apellido}
                                </h4>
                                <span className="text-[10px] text-medical-700 font-bold">{prof.especialidad}</span>
                              </div>
                            </div>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              libres > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {libres > 0 ? `${libres} horarios libres` : 'Sin turnos libres'}
                            </span>
                          </div>

                          {/* Si el médico está seleccionado, mostrar sus slots interactivos */}
                          {isSelectedProf && (
                            <div className="pt-2 border-t border-slate-100 space-y-2 animate-fadeIn">
                              <span className="text-[10px] font-black uppercase text-slate-600 block">
                                Seleccione horario para Dr(a). {prof.apellido}:
                              </span>

                              {slots.length === 0 ? (
                                <p className="text-xs text-slate-400">No hay slots configurados.</p>
                              ) : (
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                                  {slots.map((s, idx) => {
                                    const isSlotSelected = selectedSlot?.hora_inicio === s.hora_inicio;
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        disabled={!s.disponible}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedSlot(s);
                                          setEsSobreturno(false);
                                        }}
                                        className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center ${
                                          isSlotSelected
                                            ? 'bg-medical-600 text-white shadow-xs'
                                            : s.disponible
                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                                            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                        }`}
                                      >
                                        {s.hora_inicio}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Opción de Sobreturno */}
                              <div className="pt-2 flex items-center justify-between text-xs">
                                <label className="flex items-center gap-1.5 font-bold text-amber-900 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={esSobreturno}
                                    onChange={(e) => {
                                      setEsSobreturno(e.target.checked);
                                      if (e.target.checked) setSelectedSlot(null);
                                    }}
                                    className="rounded text-amber-600 focus:ring-amber-500"
                                  />
                                  <span>¿Otorgar como Sobreturno de Emergencia?</span>
                                </label>

                                {esSobreturno && (
                                  <input
                                    type="time"
                                    value={horaSobreturno}
                                    onChange={(e) => setHoraSobreturno(e.target.value)}
                                    className="px-2 py-1 border border-amber-300 rounded-lg text-xs font-bold bg-amber-50"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Botones de acción */}
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
                  disabled={!selectedSlot && !esSobreturno}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition ${
                    selectedSlot || esSobreturno
                      ? 'bg-medical-600 hover:bg-medical-700 text-white shadow-medical-600/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar y Agendar Turno</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* PASO 2: CONFIRMACIÓN CON BOTONES DE WHATSAPP E IMPRESIÓN */
          <div className="space-y-5 text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl mb-1 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">¡Turno Agendado con Éxito!</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Código de Reserva: <strong className="font-mono text-slate-900">{createdTurnoData?.turno.codigo_reserva}</strong>
              </p>
            </div>

            {/* Resumen */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Paciente:</span>
                <strong className="text-slate-900">{createdTurnoData?.paciente.nombre} {createdTurnoData?.paciente.apellido}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Médico:</span>
                <strong className="text-slate-900">Dr(a). {createdTurnoData?.profesional.nombre} {createdTurnoData?.profesional.apellido} ({createdTurnoData?.profesional.especialidad})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha y Hora:</span>
                <strong className="text-medical-800 font-bold">{createdTurnoData?.turno.fecha} a las {createdTurnoData?.turno.hora_inicio} hs</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ubicación:</span>
                <strong className="text-slate-900">{createdTurnoData?.consultorio.nombre}</strong>
              </div>
            </div>

            {/* Botones de Envío por WhatsApp e Impresión */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Resumen por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Comprobante A4</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition"
              >
                Listo / Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
