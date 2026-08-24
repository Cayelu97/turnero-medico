import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  UserCheck, 
  Clock, 
  Calendar, 
  DoorClosed, 
  Search, 
  X,
  Stethoscope,
  Shield,
  Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AbmProfesionales = () => {
  const { 
    profesionales, 
    especialidades,
    servicios,
    consultorios, 
    horarios, 
    obrasSociales,
    nomenclador,
    saveProfesional, 
    deleteProfesional, 
    saveHorario, 
    deleteHorario 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfForHorarios, setSelectedProfForHorarios] = useState(null);

  // Modales
  const [showProfModal, setShowProfModal] = useState(false);
  const [editingProf, setEditingProf] = useState(null);

  const [showHorarioModal, setShowHorarioModal] = useState(false);
  const [editingHorario, setEditingHorario] = useState(null);

  // Form states Profesional
  const [profForm, setProfForm] = useState({
    nombre: '',
    apellido: '',
    matricula_nacional: '',
    matricula_provincial: '',
    especialidad: 'Clínica Médica',
    email: '',
    telefono: '',
    duracion_turno_minutos: 20,
    max_sobreturnos_dia: 3,
    color_agenda: '#0284c7',
    atiende_particular: true,
    obras_sociales_ids: [],
    practicas_habilitadas_ids: [],
    activo: true
  });

  // Form states Horario
  const [horarioForm, setHorarioForm] = useState({
    dia_semana: 1, // 1=Lunes
    hora_inicio: '08:00',
    hora_fin: '13:00',
    consultorio_id: '',
    duracion_slot_min: 20,
    modalidad: 'PRESENCIAL', // 'PRESENCIAL' | 'ONLINE' | 'AMBAS'
    activo: true
  });

  const diasSemana = [
    { id: 1, label: 'Lunes' },
    { id: 2, label: 'Martes' },
    { id: 3, label: 'Miércoles' },
    { id: 4, label: 'Jueves' },
    { id: 5, label: 'Viernes' },
    { id: 6, label: 'Sábado' },
    { id: 0, label: 'Domingo' }
  ];

  const handleOpenProfModal = (prof = null) => {
    if (prof) {
      setEditingProf(prof);
      setProfForm({
        ...prof,
        obras_sociales_ids: prof.obras_sociales_ids || [],
        servicios_ids: prof.servicios_ids || [],
        practicas_habilitadas_ids: prof.practicas_habilitadas_ids || []
      });
    } else {
      setEditingProf(null);
      const defaultEsp = especialidades[0]?.nombre || 'Cardiología';
      const defaultEspObj = especialidades[0];
      setProfForm({
        nombre: '',
        apellido: '',
        matricula_nacional: '',
        matricula_provincial: '',
        especialidad: defaultEsp,
        especialidad_id: defaultEspObj?.id || null,
        email: '',
        telefono: '',
        duracion_turno_minutos: 20,
        max_sobreturnos_dia: 3,
        color_agenda: '#0284c7',
        atiende_particular: true,
        obras_sociales_ids: obrasSociales.map(os => os.id),
        servicios_ids: servicios.filter(s => s.especialidad_id === defaultEspObj?.id).map(s => s.id),
        practicas_habilitadas_ids: nomenclador.map(nom => nom.id),
        activo: true
      });
    }
    setShowProfModal(true);
  };

  const handleSaveProf = (e) => {
    e.preventDefault();
    if (!profForm.nombre.trim() || !profForm.apellido.trim() || !profForm.especialidad) return;

    saveProfesional({
      ...(editingProf ? { id: editingProf.id } : {}),
      ...profForm,
      duracion_turno_minutos: Number(profForm.duracion_turno_minutos),
      max_sobreturnos_dia: Number(profForm.max_sobreturnos_dia)
    });
    setShowProfModal(false);
  };

  // Handlers Horario
  const handleOpenHorarioModal = (prof, horario = null) => {
    setSelectedProfForHorarios(prof);
    const profServicios = servicios.filter(s => 
      (prof.servicios_ids && prof.servicios_ids.includes(s.id)) || 
      s.especialidad_id === prof.especialidad_id ||
      s.nombre.toLowerCase().includes(prof.especialidad.toLowerCase())
    );

    if (horario) {
      setEditingHorario(horario);
      setHorarioForm({
        ...horario,
        modalidad: horario.modalidad || 'PRESENCIAL'
      });
    } else {
      setEditingHorario(null);
      setHorarioForm({
        dia_semana: 1,
        hora_inicio: '08:00',
        hora_fin: '13:00',
        servicio_id: profServicios[0]?.id || '',
        consultorio_id: consultorios[0]?.id || '',
        duracion_slot_min: prof.duracion_turno_minutos || 20,
        modalidad: 'PRESENCIAL',
        activo: true
      });
    }
    setShowHorarioModal(true);
  };

  const handleSaveHorario = (e) => {
    e.preventDefault();
    if (!selectedProfForHorarios) return;

    saveHorario({
      ...(editingHorario ? { id: editingHorario.id } : {}),
      profesional_id: selectedProfForHorarios.id,
      ...horarioForm,
      dia_semana: Number(horarioForm.dia_semana),
      duracion_slot_min: Number(horarioForm.duracion_slot_min)
    });
    setShowHorarioModal(false);
  };

  const toggleServicio = (id) => {
    setProfForm(prev => {
      const current = prev.servicios_ids || [];
      const updated = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
      return { ...prev, servicios_ids: updated };
    });
  };

  const toggleObraSocial = (id) => {
    setProfForm(prev => {
      const current = prev.obras_sociales_ids || [];
      const updated = current.includes(id) 
        ? current.filter(x => x !== id) 
        : [...current, id];
      return { ...prev, obras_sociales_ids: updated };
    });
  };

  const filteredProfesionales = profesionales.filter(p => 
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.especialidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.matricula_nacional && p.matricula_nacional.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Barra superior de búsqueda y botón nuevo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por médico, especialidad, matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-medical-500"
          />
        </div>

        <button
          onClick={() => handleOpenProfModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold text-sm shadow-md shadow-medical-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Profesional Médico</span>
        </button>
      </div>

      {/* Listado de Médicos */}
      <div className="space-y-4">
        {filteredProfesionales.map((prof) => {
          const profHorarios = horarios.filter(h => h.profesional_id === prof.id);

          return (
            <div key={prof.id} className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div className="flex items-start gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm flex-shrink-0"
                    style={{ backgroundColor: prof.color_agenda || '#0284c7' }}
                  >
                    {prof.nombre[0]}{prof.apellido[0]}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-base text-slate-900">
                        Dr(a). {prof.nombre} {prof.apellido}
                      </h3>
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-sky-100 text-sky-800 rounded-md">
                        {prof.especialidad}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap font-medium">
                      {prof.matricula_nacional && <span>{prof.matricula_nacional}</span>}
                      {prof.matricula_provincial && <span>{prof.matricula_provincial}</span>}
                      <span>•</span>
                      <span>Turno estándar: {prof.duracion_turno_minutos || 20} min</span>
                      <span>•</span>
                      <span>Máx. sobreturnos/día: {prof.max_sobreturnos_dia || 3}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => handleOpenHorarioModal(prof)}
                    className="px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Asignar Horario / Consultorio</span>
                  </button>
                  <button
                    onClick={() => handleOpenProfModal(prof)}
                    className="p-1.5 text-slate-600 hover:text-medical-600 hover:bg-white rounded-lg transition"
                    title="Editar Profesional"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar al profesional Dr(a). ${prof.nombre} ${prof.apellido}?`)) {
                        deleteProfesional(prof.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
                    title="Eliminar Profesional"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grilla de Días y Horarios asignados */}
              <div className="mt-4">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Días y Horarios de Atención Semanal ({profHorarios.length} franjas)
                </span>

                {profHorarios.length === 0 ? (
                  <div className="bg-white/80 border border-dashed border-slate-200 rounded-xl p-3 text-center text-xs text-slate-500">
                    Este profesional aún no tiene horarios asignados. Haz clic en "Asignar Horario" para configurar los días y consultorio físico.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {profHorarios.map((h) => {
                      const diaObj = diasSemana.find(d => d.id === h.dia_semana);
                      const consObj = consultorios.find(c => c.id === h.consultorio_id);

                      return (
                        <div key={h.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                {diaObj?.label || 'Día'}
                              </span>
                              <span className="font-extrabold text-xs text-medical-700">
                                {h.hora_inicio} a {h.hora_fin}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                                h.modalidad === 'ONLINE' 
                                  ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                                  : h.modalidad === 'AMBAS' 
                                  ? 'bg-indigo-100 text-indigo-900 border border-indigo-200' 
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              }`}>
                                {h.modalidad === 'ONLINE' ? '💻 Online' : h.modalidad === 'AMBAS' ? '🔄 Híbrido' : '🏢 Presencial'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                              <DoorClosed className="w-3 h-3 text-slate-400" />
                              <span>{consObj ? consObj.nombre : 'Consultorio no asignado'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenHorarioModal(prof, h)}
                              className="p-1 text-slate-400 hover:text-sky-600 rounded"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('¿Eliminar esta franja horaria?')) {
                                  deleteHorario(h.id);
                                }
                              }}
                              className="p-1 text-slate-300 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL PROFESIONAL */}
      {showProfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingProf ? 'Editar Profesional Médico' : 'Nuevo Profesional Médico'}
              </h3>
              <button onClick={() => setShowProfModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProf} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Martín"
                    value={profForm.nombre}
                    onChange={(e) => setProfForm({ ...profForm, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Pérez Rossi"
                    value={profForm.apellido}
                    onChange={(e) => setProfForm({ ...profForm, apellido: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Especialidad Médica *</label>
                  <select
                    required
                    value={profForm.especialidad}
                    onChange={(e) => {
                      const espName = e.target.value;
                      const espObj = especialidades.find(esp => esp.nombre === espName);
                      const matchingServicios = servicios.filter(s => s.especialidad_id === espObj?.id || s.nombre.toLowerCase().includes(espName.toLowerCase())).map(s => s.id);
                      setProfForm(prev => ({ 
                        ...prev, 
                        especialidad: espName,
                        especialidad_id: espObj?.id || null,
                        servicios_ids: matchingServicios.length > 0 ? matchingServicios : prev.servicios_ids
                      }));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                  >
                    <option value="">-- Seleccionar Especialidad --</option>
                    {especialidades.map(esp => (
                      <option key={esp.id} value={esp.nombre}>
                        {esp.nombre} {esp.codigo ? `(${esp.codigo})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Matrícula Nacional</label>
                  <input
                    type="text"
                    placeholder="ej: MN 114.829"
                    value={profForm.matricula_nacional}
                    onChange={(e) => setProfForm({ ...profForm, matricula_nacional: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                  />
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Matrícula Provincial</label>
                  <input
                    type="text"
                    placeholder="ej: MP 45.291"
                    value={profForm.matricula_provincial}
                    onChange={(e) => setProfForm({ ...profForm, matricula_provincial: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Máx. Sobreturnos / día</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={profForm.max_sobreturnos_dia}
                    onChange={(e) => setProfForm({ ...profForm, max_sobreturnos_dia: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Color en Agenda</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={profForm.color_agenda}
                      onChange={(e) => setProfForm({ ...profForm, color_agenda: e.target.value })}
                      className="w-10 h-9 p-1 border border-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-600">{profForm.color_agenda}</span>
                  </div>
                </div>
              </div>

              {/* Aviso de configuración de horarios y duración en Agendas */}
              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  <strong>Configuración de Turnos y Fracciones:</strong> Los días de atención, franjas horarias y duración de consulta (ej. 15m, 20m, 30m) se configuran y administran desde el <strong>Gestor de Agendas Médicas</strong> para mantener la uniformidad del sistema.
                </span>
              </div>

              {/* Servicios Médicos que presta */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Servicios Médicos / Líneas de Atención que realiza este profesional:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {servicios.map(serv => {
                    const isChecked = (profForm.servicios_ids || []).includes(serv.id);
                    return (
                      <label key={serv.id} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleServicio(serv.id)}
                          className="rounded text-medical-600 focus:ring-medical-500"
                        />
                        <span className="truncate font-semibold">{serv.nombre}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Obras Sociales habilitadas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Obras Sociales / Prepagas que atiende este profesional:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {obrasSociales.map(os => {
                    const isChecked = (profForm.obras_sociales_ids || []).includes(os.id);
                    return (
                      <label key={os.id} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleObraSocial(os.id)}
                          className="rounded text-medical-600 focus:ring-medical-500"
                        />
                        <span className="truncate">{os.nombre}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProfModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold shadow-md shadow-medical-600/20"
                >
                  Guardar Profesional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HORARIO */}
      {showHorarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {editingHorario ? 'Editar Horario' : 'Asignar Horario de Atención'}
                </h3>
                <p className="text-xs text-medical-600 font-bold">
                  Dr(a). {selectedProfForHorarios?.nombre} {selectedProfForHorarios?.apellido}
                </p>
              </div>
              <button onClick={() => setShowHorarioModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHorario} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Día de la Semana *</label>
                  <select
                    value={horarioForm.dia_semana}
                    onChange={(e) => setHorarioForm({ ...horarioForm, dia_semana: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                  >
                    {diasSemana.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Servicio Médico</label>
                  <select
                    value={horarioForm.servicio_id}
                    onChange={(e) => setHorarioForm({ ...horarioForm, servicio_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="">Servicio General</option>
                    {servicios.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora Inicio *</label>
                  <input
                    type="time"
                    required
                    value={horarioForm.hora_inicio}
                    onChange={(e) => setHorarioForm({ ...horarioForm, hora_inicio: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora Fin *</label>
                  <input
                    type="time"
                    required
                    value={horarioForm.hora_fin}
                    onChange={(e) => setHorarioForm({ ...horarioForm, hora_fin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Modalidad de Atención de la Franja *</label>
                <select
                  value={horarioForm.modalidad || 'PRESENCIAL'}
                  onChange={(e) => setHorarioForm({ ...horarioForm, modalidad: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                >
                  <option value="PRESENCIAL">🏢 Solo Presencial (En Consultorio Físico)</option>
                  <option value="ONLINE">💻 Solo Online / Teleconsulta (Videollamada)</option>
                  <option value="AMBAS">🔄 Ambas Modalidades (Híbrido - El paciente puede elegir)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Consultorio Físico Asignado</label>
                <select
                  value={horarioForm.consultorio_id}
                  onChange={(e) => setHorarioForm({ ...horarioForm, consultorio_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                >
                  {consultorios.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Duración por slot (minutos)</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  step="5"
                  value={horarioForm.duracion_slot_min}
                  onChange={(e) => setHorarioForm({ ...horarioForm, duracion_slot_min: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowHorarioModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold shadow-md shadow-medical-600/20"
                >
                  Guardar Horario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
