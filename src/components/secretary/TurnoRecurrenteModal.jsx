import React, { useState, useEffect, useMemo } from 'react';
import { 
  Repeat, 
  Calendar, 
  Clock, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Printer, 
  Sparkles, 
  Layers,
  MessageCircle,
  Stethoscope,
  CalendarRange,
  ChevronRight,
  Info,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { formatDateAR } from '../../utils/formatters';

const DIAS_SEMANA_INFO = [
  { dia: 0, corto: 'D', nombre: 'Domingo' },
  { dia: 1, corto: 'L', nombre: 'Lunes' },
  { dia: 2, corto: 'M', nombre: 'Martes' },
  { dia: 3, corto: 'M', nombre: 'Miércoles' },
  { dia: 4, corto: 'J', nombre: 'Jueves' },
  { dia: 5, corto: 'V', nombre: 'Viernes' },
  { dia: 6, corto: 'S', nombre: 'Sábado' }
];

export const TurnoRecurrenteModal = ({ isOpen, onClose }) => {
  const { 
    profesionales = [], 
    servicios = [], 
    consultorios = [], 
    obrasSociales = [], 
    planes = [], 
    nomenclador = [], 
    clinica,
    crearPaqueteSesiones,
    showToast 
  } = useApp();

  const [step, setStep] = useState(1); // 1: Configurar Serie, 2: Confirmado / Cronograma

  // Profesional y Servicio
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

  // Parámetros de Recurrencia estilo Google Calendar
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().split('T')[0]);
  const [frecuenciaTipo, setFrecuenciaTipo] = useState('SEMANAL'); // 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'
  const [intervaloSemanal, setIntervaloSemanal] = useState(1); // Repetir cada 1 semana, 2 semanas...
  const [diasSeleccionados, setDiasSeleccionados] = useState([1, 3, 5]); // Lun, Mié, Vie por defecto
  const [horaInicio, setHoraInicio] = useState('10:00');
  const [duracionMin, setDuracionMin] = useState(40);
  
  // Condición de Fin
  const [tipoFin, setTipoFin] = useState('SESIONES'); // 'SESIONES' | 'FECHA'
  const [cantidadSesiones, setCantidadSesiones] = useState(10);
  const [fechaFin, setFechaFin] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().split('T')[0];
  });

  const [montoCoseguroSesion, setMontoCoseguroSesion] = useState(0);
  const [observaciones, setObservaciones] = useState('Tratamiento de Kinesiología y Fisioterapia');

  // Resultado generado
  const [paqueteGenerado, setPaqueteGenerado] = useState(null);

  // RESET ESTRICTO AL ABRIR
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPaqueteGenerado(null);
      if (profesionales.length > 0 && !profesionalId) {
        setProfesionalId(profesionales[0].id);
      }
    }
  }, [isOpen, profesionales]);

  const handleModalClose = () => {
    setStep(1);
    setPaqueteGenerado(null);
    onClose();
  };

  const selectedProf = profesionales.find(p => p.id === profesionalId);

  // Servicios del médico
  const serviciosDelProf = useMemo(() => {
    if (!selectedProf) return [];
    if (selectedProf.servicios_ids && selectedProf.servicios_ids.length > 0) {
      return servicios.filter(s => selectedProf.servicios_ids.includes(s.id));
    }
    const match = servicios.filter(s => 
      s.especialidad_id === selectedProf.especialidad_id ||
      (selectedProf.especialidad && s.nombre.toLowerCase().includes(selectedProf.especialidad.toLowerCase()))
    );
    if (match.length > 0) return match;
    return servicios;
  }, [selectedProf, servicios]);

  // Autoseleccionar servicio y práctica
  useEffect(() => {
    if (serviciosDelProf.length > 0) {
      if (!servicioId || !serviciosDelProf.some(s => s.id === servicioId)) {
        setServicioId(serviciosDelProf[0].id);
      }
    }
  }, [profesionalId, serviciosDelProf]);

  const selectedServicio = servicios.find(s => s.id === servicioId);
  useEffect(() => {
    if (selectedServicio?.practica_default_id) {
      setPracticaId(selectedServicio.practica_default_id);
    }
  }, [servicioId, selectedServicio]);

  // Horarios de atención del médico
  const horariosDelMedico = useMemo(() => {
    if (!profesionalId) return [];
    return StorageService.getHorariosByProfesional(profesionalId);
  }, [profesionalId]);

  const diasQueAtiendeElMedico = useMemo(() => {
    return new Set(horariosDelMedico.map(h => h.dia_semana));
  }, [horariosDelMedico]);

  // Autocompletar datos del paciente por DNI
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
      showToast(`Paciente encontrado: ${existing.nombre} ${existing.apellido}`);
    }
  };

  // Toggle día de la semana (Google Calendar Style)
  const toggleDiaSemana = (diaNum) => {
    setDiasSeleccionados(prev => {
      if (prev.includes(diaNum)) {
        if (prev.length === 1) return prev; // Al menos 1 día seleccionado
        return prev.filter(d => d !== diaNum);
      } else {
        return [...prev, diaNum].sort();
      }
    });
  };

  // MOTOR DE CÁLCULO Y PREVISUALIZACIÓN DE FECHAS EN VIVO
  const previewSesiones = useMemo(() => {
    if (!fechaInicio || diasSeleccionados.length === 0 || !profesionalId) return [];

    const bloqueos = StorageService.getBloqueos();
    const result = [];
    let currentDate = new Date(fechaInicio + 'T00:00:00');
    let sessionsFound = 0;
    let safetyCounter = 0;
    const maxTarget = tipoFin === 'SESIONES' ? Number(cantidadSesiones) : 60;
    const dateLimit = tipoFin === 'FECHA' ? new Date(fechaFin + 'T23:59:59') : null;

    while (sessionsFound < maxTarget && safetyCounter < 180) {
      safetyCounter++;
      const diaSemana = currentDate.getDay();
      const dateStr = currentDate.toISOString().split('T')[0];

      if (dateLimit && currentDate > dateLimit) break;

      if (diasSeleccionados.includes(diaSemana)) {
        // Verificar si la fecha está bloqueada
        const isBlocked = bloqueos.some(b => {
          const matchFecha = dateStr >= b.fecha_inicio && dateStr <= b.fecha_fin;
          if (!matchFecha) return false;
          if (!b.profesional_id || b.profesional_id === profesionalId) return true;
          return false;
        });

        // Verificar si el médico atiende este día de la semana
        const atiendeEsteDia = diasQueAtiendeElMedico.has(diaSemana);

        sessionsFound++;
        result.push({
          nro: sessionsFound,
          fecha: dateStr,
          diaNombre: currentDate.toLocaleDateString('es-AR', { weekday: 'short' }),
          diaNumero: currentDate.getDate(),
          mesNombre: currentDate.toLocaleDateString('es-AR', { month: 'short' }),
          año: currentDate.getFullYear(),
          isBlocked,
          atiendeEsteDia
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }, [fechaInicio, diasSeleccionados, tipoFin, cantidadSesiones, fechaFin, profesionalId, diasQueAtiendeElMedico]);

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
      showToast('Por favor complete los datos obligatorios.', 'error');
      return;
    }

    const hora_fin = calculateHoraFin(horaInicio, Number(duracionMin));
    const finalCount = previewSesiones.length;

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
      dias_semana: diasSeleccionados,
      cantidad_sesiones: finalCount,
      monto_coseguro_sesion: Number(montoCoseguroSesion),
      observaciones: observaciones
    });

    setPaqueteGenerado(result);
    setStep(2);
    showToast(`¡Paquete de ${finalCount} sesiones agendado con éxito!`);
  };

  // Enviar Cronograma Completo por WhatsApp
  const handleSendWhatsAppCronograma = () => {
    if (!paqueteGenerado || !telefono) return;
    
    const profObj = profesionales.find(p => p.id === profesionalId);
    const lineasFechas = paqueteGenerado.turnos.map(t => 
      `• Sesión ${t.nro_sesion}: ${formatDateAR(t.fecha)} a las ${t.hora_inicio} hs`
    ).join('\n');

    const mensaje = `Hola *${nombre}*, confirmamos tu tratamiento de *${finalPracticaNombre}* en *${clinica.nombre}*:\n\n👨‍⚕️ *Profesional:* Dr(a). ${profObj?.nombre} ${profObj?.apellido}\n📅 *Cronograma de ${paqueteGenerado.total_sesiones} Sesiones:*\n${lineasFechas}\n\n📍 *Lugar:* ${clinica.direccion}\nPor favor concurrir 10 min antes con DNI y credencial. ¡Muchas gracias!`;

    const cleanPhone = telefono.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const finalPractica = nomenclador.find(p => p.id === practicaId);
  const finalPracticaNombre = finalPractica ? `[${finalPractica.codigo_pmo}] ${finalPractica.descripcion}` : 'Tratamiento Médico';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-6 animate-scaleIn">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl border border-purple-200">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">
                {step === 1 ? 'Agendar Turnos Recurrentes / Paquete de Sesiones' : '¡Tratamiento Agendado con Éxito!'}
              </h3>
              <p className="text-xs text-slate-500">
                Programación de terapias, kinesiología, psicología y sesiones seriadas estilo Google Calendar
              </p>
            </div>
          </div>
          <button onClick={handleModalClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* SECCIÓN 1: DATOS DEL PACIENTE */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-purple-600" />
                1. Datos del Paciente
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">DNI (sin puntos) *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: 34123456"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    onBlur={handleDniBlur}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre"
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
                    placeholder="Apellido"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="ej: 11 4829-1920"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Obra Social / Prepaga</label>
                  <select
                    value={obraSocialId}
                    onChange={(e) => setObraSocialId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                  >
                    {obrasSociales.map(os => (
                      <option key={os.id} value={os.id}>{os.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">N° Afiliado</label>
                  <input
                    type="text"
                    placeholder="ej: 1098492019/01"
                    value={numeroAfiliado}
                    onChange={(e) => setNumeroAfiliado(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Coseguro / Sesión ($)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={montoCoseguroSesion}
                    onChange={(e) => setMontoCoseguroSesion(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-emerald-800"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: PROFESIONAL Y PRÁCTICA */}
            <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-purple-600" />
                2. Profesional & Práctica a Realizar
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Profesional Tratante *</label>
                  <select
                    value={profesionalId}
                    onChange={(e) => setProfesionalId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                  >
                    {profesionales.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido} — {p.especialidad}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Servicio</label>
                  <select
                    value={servicioId}
                    onChange={(e) => setServicioId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                  >
                    {serviciosDelProf.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre} ({s.duracion_default_min} min)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Práctica Nomenclador PMO</label>
                  <select
                    value={practicaId}
                    onChange={(e) => setPracticaId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                  >
                    {nomenclador.map(nom => (
                      <option key={nom.id} value={nom.id}>{nom.codigo_pmo} - {nom.descripcion}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: REPETICIÓN & RECURRENCIA ESTILO GOOGLE CALENDAR */}
            <div className="p-4.5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  3. Patrón de Repetición (Google Calendar Engine)
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {previewSesiones.length} sesiones calculadas
                </span>
              </div>

              {/* SELECTOR DE DÍAS CIRCULARES (ESTILO GOOGLE CALENDAR) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Repetir los días de la semana:
                </label>
                <div className="flex items-center gap-2 sm:gap-3 justify-start flex-wrap">
                  {DIAS_SEMANA_INFO.map(item => {
                    const isSelected = diasSeleccionados.includes(item.dia);
                    const atiende = diasQueAtiendeElMedico.has(item.dia);

                    return (
                      <button
                        key={item.dia}
                        type="button"
                        onClick={() => toggleDiaSemana(item.dia)}
                        className={`w-10 h-10 rounded-full font-black text-xs transition flex flex-col items-center justify-center border cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20 scale-105'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                        }`}
                        title={`${item.nombre} ${!atiende ? '(El médico no tiene horario habitual este día)' : ''}`}
                      >
                        <span>{item.corto}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* HORARIO Y FECHA DE INICIO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Fecha de Inicio *</label>
                  <input
                    type="date"
                    required
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Hora de Sesión *</label>
                  <input
                    type="time"
                    required
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Duración (min)</label>
                  <input
                    type="number"
                    min="15"
                    step="5"
                    value={duracionMin}
                    onChange={(e) => setDuracionMin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white"
                  />
                </div>
              </div>

              {/* CONDICIÓN DE FINALIZACIÓN DE LA SERIE */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-300">
                  Finalización de la Serie:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div 
                    onClick={() => setTipoFin('SESIONES')}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      tipoFin === 'SESIONES' ? 'bg-slate-800 border-sky-500 ring-1 ring-sky-500' : 'bg-slate-950 border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="tipoFin" 
                        checked={tipoFin === 'SESIONES'} 
                        onChange={() => setTipoFin('SESIONES')} 
                        className="text-sky-500"
                      />
                      <span className="text-xs font-bold">Tras N Sesiones:</span>
                    </div>
                    <input
                      type="number"
                      min="2"
                      max="40"
                      disabled={tipoFin !== 'SESIONES'}
                      value={cantidadSesiones}
                      onChange={(e) => setCantidadSesiones(e.target.value)}
                      className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-black text-sky-400 text-center"
                    />
                  </div>

                  <div 
                    onClick={() => setTipoFin('FECHA')}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      tipoFin === 'FECHA' ? 'bg-slate-800 border-sky-500 ring-1 ring-sky-500' : 'bg-slate-950 border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="tipoFin" 
                        checked={tipoFin === 'FECHA'} 
                        onChange={() => setTipoFin('FECHA')} 
                        className="text-sky-500"
                      />
                      <span className="text-xs font-bold">Termina el:</span>
                    </div>
                    <input
                      type="date"
                      disabled={tipoFin !== 'FECHA'}
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-sky-400"
                    />
                  </div>
                </div>
              </div>

              {/* PREVISUALIZACIÓN DE TODAS LAS FECHAS CALCULADAS */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block">
                  Vista Previa del Cronograma ({previewSesiones.length} sesiones a agendar):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-950 rounded-2xl border border-slate-800">
                  {previewSesiones.map((s) => (
                    <div 
                      key={s.nro}
                      className={`p-2 rounded-xl text-left text-[11px] border ${
                        s.isBlocked 
                          ? 'bg-rose-950/40 border-rose-800 text-rose-300' 
                          : 'bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    >
                      <strong className="block text-sky-400 font-black">Sesión #{s.nro}</strong>
                      <span>{s.diaNombre} {s.diaNumero} {s.mesNombre}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{horaInicio} hs</span>
                      {s.isBlocked && <span className="text-[9px] text-rose-400 font-bold block">⚠️ Feriado/Bloqueo</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
              >
                Agendar las {previewSesiones.length} Sesiones
              </button>
            </div>
          </form>
        ) : (
          /* PASO 2: CRONOGRAMA DE SESIONES GENERADO */
          <div className="space-y-5 text-center animate-fadeIn py-3">
            <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-black text-slate-900">¡Tratamiento Agendado con Éxito!</h4>
              <p className="text-xs text-slate-500">
                Código del Paquete: <strong className="font-mono text-slate-900">{paqueteGenerado?.codigo_paquete}</strong> • {paqueteGenerado?.total_sesiones} Sesiones Programadas
              </p>
            </div>

            {/* CRONOGRAMA DETALLADO */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-3 max-w-xl mx-auto">
              <div className="border-b border-slate-200 pb-2">
                <p><strong>Paciente:</strong> {nombre} {apellido} (DNI: {dni})</p>
                <p><strong>Profesional:</strong> Dr(a). {selectedProf?.nombre} {selectedProf?.apellido}</p>
                <p><strong>Tratamiento:</strong> {finalPracticaNombre}</p>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                <strong className="text-[11px] uppercase tracking-wider text-slate-500 block mb-1">Fechas Confirmadas:</strong>
                {paqueteGenerado?.turnos?.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200 text-xs">
                    <span className="font-black text-purple-700">Sesión #{t.nro_sesion}</span>
                    <span>{formatDateAR(t.fecha)} a las {t.hora_inicio} hs</span>
                    <span className="font-mono text-[10px] text-slate-400">{t.codigo_reserva}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSendWhatsAppCronograma}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Cronograma por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleModalClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
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
