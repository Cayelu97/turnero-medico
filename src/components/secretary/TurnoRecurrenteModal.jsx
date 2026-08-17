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
  Check,
  DollarSign,
  CalendarDays
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { formatDateAR } from '../../utils/formatters';
import { addDaysToDateString, getDayDetailsFromDateString } from '../../utils/dateUtils';

const DIAS_SEMANA_INFO = [
  { dia: 1, corto: 'L', nombre: 'Lunes' },
  { dia: 2, corto: 'M', nombre: 'Martes' },
  { dia: 3, corto: 'M', nombre: 'Miércoles' },
  { dia: 4, corto: 'J', nombre: 'Jueves' },
  { dia: 5, corto: 'V', nombre: 'Viernes' },
  { dia: 6, corto: 'S', nombre: 'Sábado' },
  { dia: 0, corto: 'D', nombre: 'Domingo' }
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

  const [step, setStep] = useState(1); // 1: Configuración, 2: Cronograma Confirmado

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

  // Parámetros de Recurrencia
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().split('T')[0]);
  const [diasSeleccionados, setDiasSeleccionados] = useState([1, 3, 5]); // Lun, Mié, Vie
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
    return new Set(horariosDelMedico.map(h => Number(h.dia_semana)));
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
      showToast(`Paciente: ${existing.nombre} ${existing.apellido}`);
    }
  };

  // Toggle día de la semana (Google Calendar Style)
  const toggleDiaSemana = (diaNum) => {
    setDiasSeleccionados(prev => {
      if (prev.includes(diaNum)) {
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== diaNum);
      } else {
        return [...prev, diaNum].sort();
      }
    });
  };

  // Previsualización de fechas calculadas en tiempo real de forma segura
  const previewSesiones = useMemo(() => {
    if (!fechaInicio || diasSeleccionados.length === 0 || !profesionalId) return [];

    const bloqueos = StorageService.getBloqueos();
    const result = [];
    let sessionsFound = 0;
    const maxTarget = tipoFin === 'SESIONES' ? Number(cantidadSesiones) : 60;
    const diasNorm = diasSeleccionados.map(Number);

    for (let i = 0; i < 180 && sessionsFound < maxTarget; i++) {
      const dateStr = addDaysToDateString(fechaInicio, i);
      const dayDetails = getDayDetailsFromDateString(dateStr);

      if (tipoFin === 'FECHA' && fechaFin && dateStr > fechaFin) break;

      if (diasNorm.includes(dayDetails.diaSemana)) {
        const isBlocked = bloqueos.some(b => {
          const matchFecha = dateStr >= b.fecha_inicio && dateStr <= b.fecha_fin;
          if (!matchFecha) return false;
          if (!b.profesional_id || b.profesional_id === profesionalId) return true;
          return false;
        });

        const atiendeEsteDia = diasQueAtiendeElMedico.has(dayDetails.diaSemana);

        sessionsFound++;
        result.push({
          nro: sessionsFound,
          fecha: dateStr,
          diaNombre: dayDetails.diaNombre,
          diaNumero: dayDetails.diaNumero,
          mesNombre: dayDetails.mesNombre,
          isBlocked,
          atiendeEsteDia
        });
      }
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

  const handleSendWhatsAppCronograma = () => {
    if (!paqueteGenerado || !telefono) return;
    
    const profObj = profesionales.find(p => p.id === profesionalId);
    const lineasFechas = paqueteGenerado.turnos.map(t => 
      `• Sesión ${t.nro_sesion}: ${formatDateAR(t.fecha)} a las ${t.hora_inicio} hs`
    ).join('\n');

    const mensaje = `Hola *${nombre}*, confirmamos tu tratamiento en *${clinica.nombre}*:\n\n👨‍⚕️ *Profesional:* Dr(a). ${profObj?.nombre} ${profObj?.apellido}\n📅 *Cronograma de ${paqueteGenerado.total_sesiones} Sesiones:*\n${lineasFechas}\n\n📍 *Lugar:* ${clinica.direccion}\nPor favor concurrir 10 min antes con DNI. ¡Muchas gracias!`;

    const cleanPhone = telefono.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const finalPractica = nomenclador.find(p => p.id === practicaId);
  const totalCoseguroAcumulado = Number(montoCoseguroSesion || 0) * previewSesiones.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 my-auto overflow-hidden animate-scaleIn flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4.5 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-2xs">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                  {step === 1 ? 'Agendar Tratamiento / Paquete de Sesiones' : '¡Tratamiento Confirmado con Éxito!'}
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                  Recurrente
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {step === 1 
                  ? 'Programación seriada para kinesiología, psicología, fonoaudiología y rehabilitación' 
                  : 'Cronograma completo generado y listo para enviar al paciente'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleModalClose} 
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === 1 ? (
            <form id="form-paquete-sesiones" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* COLUMNA IZQUIERDA (7 COLS): CONFIGURACIÓN */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* CARD 1: DATOS DEL PACIENTE */}
                  <div className="p-4 bg-slate-50/90 border border-slate-200/80 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-indigo-600" />
                        1. Paciente & Cobertura
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Escriba DNI para autocompletar
                      </span>
                    </div>

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
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-indigo-500"
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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

                  {/* CARD 2: PROFESIONAL & SERVICIO */}
                  <div className="p-4 bg-slate-50/90 border border-slate-200/80 rounded-2xl space-y-3">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-indigo-600" />
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
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Servicio / Especialidad</label>
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

                  {/* CARD 3: PATRÓN DE REPETICIÓN GOOGLE CALENDAR */}
                  <div className="p-4.5 bg-indigo-50/50 border border-indigo-200/80 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                        <Repeat className="w-4 h-4 text-indigo-600" />
                        3. Patrón de Repetición Semanal
                      </span>
                      <span className="text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
                        {previewSesiones.length} sesiones a programar
                      </span>
                    </div>

                    {/* SELECTOR DE DÍAS (GOOGLE CALENDAR STYLE) */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Seleccionar días de atención:
                      </label>
                      <div className="flex items-center gap-2">
                        {DIAS_SEMANA_INFO.map(item => {
                          const isSelected = diasSeleccionados.includes(item.dia);
                          const atiende = diasQueAtiendeElMedico.has(item.dia);

                          return (
                            <button
                              key={item.dia}
                              type="button"
                              onClick={() => toggleDiaSemana(item.dia)}
                              className={`w-9 h-9 rounded-xl font-black text-xs transition flex items-center justify-center border cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-500/20'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                              title={`${item.nombre} ${!atiende ? '(Atención fuera de horario habitual)' : ''}`}
                            >
                              {item.corto}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* HORARIO Y FECHA INICIO */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha de Inicio *</label>
                        <input
                          type="date"
                          required
                          value={fechaInicio}
                          onChange={(e) => setFechaInicio(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Hora de Sesión *</label>
                        <input
                          type="time"
                          required
                          value={horaInicio}
                          onChange={(e) => setHoraInicio(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Duración (min)</label>
                        <input
                          type="number"
                          min="15"
                          step="5"
                          value={duracionMin}
                          onChange={(e) => setDuracionMin(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    {/* CONDICIÓN DE FIN */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div 
                        onClick={() => setTipoFin('SESIONES')}
                        className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          tipoFin === 'SESIONES' ? 'bg-white border-indigo-500 shadow-xs ring-1 ring-indigo-500/20' : 'bg-slate-50 border-slate-200 opacity-70'
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                          <input 
                            type="radio" 
                            name="tipoFin" 
                            checked={tipoFin === 'SESIONES'} 
                            onChange={() => setTipoFin('SESIONES')} 
                            className="text-indigo-600"
                          />
                          <span>Total de Sesiones:</span>
                        </label>
                        <input
                          type="number"
                          min="2"
                          max="40"
                          disabled={tipoFin !== 'SESIONES'}
                          value={cantidadSesiones}
                          onChange={(e) => setCantidadSesiones(e.target.value)}
                          className="w-14 px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-black text-indigo-700 text-center"
                        />
                      </div>

                      <div 
                        onClick={() => setTipoFin('FECHA')}
                        className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          tipoFin === 'FECHA' ? 'bg-white border-indigo-500 shadow-xs ring-1 ring-indigo-500/20' : 'bg-slate-50 border-slate-200 opacity-70'
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                          <input 
                            type="radio" 
                            name="tipoFin" 
                            checked={tipoFin === 'FECHA'} 
                            onChange={() => setTipoFin('FECHA')} 
                            className="text-indigo-600"
                          />
                          <span>Termina el:</span>
                        </label>
                        <input
                          type="date"
                          disabled={tipoFin !== 'FECHA'}
                          value={fechaFin}
                          onChange={(e) => setFechaFin(e.target.value)}
                          className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-indigo-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA (5 COLS): CRONOGRAMA & PREVIEW */}
                <div className="lg:col-span-5 bg-slate-50/80 border border-slate-200 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4 text-indigo-600" />
                        Vista Previa del Calendario
                      </h4>
                      <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                        {previewSesiones.length} Fechas
                      </span>
                    </div>

                    {/* RESUMEN FINANCIERO DEL PAQUETE */}
                    {totalCoseguroAcumulado > 0 && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-emerald-800 block">Coseguro Total Estimado</span>
                          <span className="text-[10px] text-emerald-600">${montoCoseguroSesion} por cada sesión</span>
                        </div>
                        <strong className="text-base font-black text-emerald-900">
                          ${totalCoseguroAcumulado.toLocaleString('es-AR')}
                        </strong>
                      </div>
                    )}

                    {/* LISTA DE SESIONES GENERADAS */}
                    <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                      {previewSesiones.map((s) => (
                        <div 
                          key={s.nro}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                            s.isBlocked 
                              ? 'bg-rose-50 border-rose-200 text-rose-900' 
                              : 'bg-white border-slate-200 text-slate-800 shadow-2xs hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-black text-[11px] flex items-center justify-center flex-shrink-0">
                              #{s.nro}
                            </span>
                            <div>
                              <strong className="block font-extrabold text-slate-900">
                                {s.diaNombre} {s.diaNumero} {s.mesNombre}
                              </strong>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {horaInicio} hs ({duracionMin} min)
                              </span>
                            </div>
                          </div>

                          {s.isBlocked ? (
                            <span className="text-[10px] font-extrabold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                              ⚠️ Feriado
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                              ✓ Disponible
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-[11px] text-slate-500 text-center">
                      Al confirmar, se reservarán automáticamente las <strong>{previewSesiones.length} citas</strong> en la agenda del profesional.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* PASO 2: CRONOGRAMA EXITOSO */
            <div className="space-y-6 text-center animate-fadeIn py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900">¡Tratamiento Programado Exitosamente!</h4>
                <p className="text-xs text-slate-500">
                  Código del Tratamiento: <strong className="font-mono text-slate-900">{paqueteGenerado?.codigo_paquete}</strong> • {paqueteGenerado?.total_sesiones} Sesiones Agendadas
                </p>
              </div>

              {/* CRONOGRAMA DETALLADO */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl text-left text-xs space-y-3 max-w-xl mx-auto">
                <div className="border-b border-slate-200 pb-2.5">
                  <p><strong>Paciente:</strong> {nombre} {apellido} (DNI: {dni})</p>
                  <p><strong>Profesional:</strong> Dr(a). {selectedProf?.nombre} {selectedProf?.apellido}</p>
                  <p><strong>Práctica:</strong> {finalPractica ? `[${finalPractica.codigo_pmo}] ${finalPractica.descripcion}` : 'Tratamiento Médico'}</p>
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  <strong className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                    Fechas y Horarios Reservados:
                  </strong>
                  {paqueteGenerado?.turnos?.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-indigo-700">Sesión #{t.nro_sesion}</span>
                        <span>{formatDateAR(t.fecha)} a las {t.hora_inicio} hs</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{t.codigo_reserva}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSendWhatsAppCronograma}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Cronograma por WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleModalClose}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Listo / Cerrar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER CON BOTONES FIJOS */}
        {step === 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="form-paquete-sesiones"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              Confirmar y Agendar las {previewSesiones.length} Sesiones
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
