import React, { useState } from 'react';
import { Plus, Edit, Trash2, CalendarOff, Palmtree, Flag, Wrench, Search, X, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AbmBloqueos = () => {
  const { bloqueos, profesionales, consultorios, saveBloqueo, deleteBloqueo } = useApp();

  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingBloqueo, setEditingBloqueo] = useState(null);

  const [form, setForm] = useState({
    tipo: 'FERIADO_NACIONAL',
    profesional_id: '',
    consultorio_id: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    motivo: ''
  });

  const handleOpenModal = (bloqueo = null) => {
    if (bloqueo) {
      setEditingBloqueo(bloqueo);
      setForm({
        ...bloqueo,
        profesional_id: bloqueo.profesional_id || '',
        consultorio_id: bloqueo.consultorio_id || ''
      });
    } else {
      setEditingBloqueo(null);
      const todayStr = new Date().toISOString().split('T')[0];
      setForm({
        tipo: 'VACACIONES',
        profesional_id: profesionales[0]?.id || '',
        consultorio_id: '',
        fecha_inicio: todayStr,
        fecha_fin: todayStr,
        motivo: 'Receso vacacional'
      });
    }
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.motivo.trim() || !form.fecha_inicio || !form.fecha_fin) return;

    saveBloqueo({
      ...(editingBloqueo ? { id: editingBloqueo.id } : {}),
      ...form,
      profesional_id: form.profesional_id || null,
      consultorio_id: form.consultorio_id || null
    });
    setShowModal(false);
  };

  const getTipoBadge = (tipo) => {
    switch (tipo) {
      case 'FERIADO_NACIONAL':
        return { label: 'Feriado Nacional', bg: 'bg-sky-100 text-sky-800 border-sky-200', icon: Flag };
      case 'VACACIONES':
        return { label: 'Vacaciones Profesional', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Palmtree };
      case 'LICENCIA_MEDICA':
        return { label: 'Licencia Médica', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: CalendarOff };
      case 'MANTENIMIENTO':
        return { label: 'Mantenimiento Consultorio', bg: 'bg-purple-100 text-purple-800 border-purple-200', icon: Wrench };
      default:
        return { label: tipo, bg: 'bg-slate-100 text-slate-800 border-slate-200', icon: CalendarOff };
    }
  };

  const filteredBloqueos = bloqueos.filter(b => {
    if (typeFilter === 'ALL') return true;
    return b.tipo === typeFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Bloqueos de Agenda, Vacaciones y Feriados</h2>
          <p className="text-xs text-slate-500">
            Días no laborables y licencias que inhabilitan automáticamente la reserva de turnos.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold text-sm shadow-md shadow-medical-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Bloqueo / Vacaciones</span>
        </button>
      </div>

      {/* Filtros rápidos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setTypeFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg border transition ${
            typeFilter === 'ALL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          Todos ({bloqueos.length})
        </button>
        <button
          onClick={() => setTypeFilter('FERIADO_NACIONAL')}
          className={`px-3 py-1.5 rounded-lg border transition ${
            typeFilter === 'FERIADO_NACIONAL' ? 'bg-sky-700 text-white border-sky-700' : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          Feriados Nacionales
        </button>
        <button
          onClick={() => setTypeFilter('VACACIONES')}
          className={`px-3 py-1.5 rounded-lg border transition ${
            typeFilter === 'VACACIONES' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          Vacaciones Médicos
        </button>
        <button
          onClick={() => setTypeFilter('LICENCIA_MEDICA')}
          className={`px-3 py-1.5 rounded-lg border transition ${
            typeFilter === 'LICENCIA_MEDICA' ? 'bg-amber-700 text-white border-amber-700' : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          Licencias Médicas
        </button>
      </div>

      {/* Lista de Bloqueos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredBloqueos.map((b) => {
          const badge = getTipoBadge(b.tipo);
          const Icon = badge.icon;
          const profObj = b.profesional_id ? profesionales.find(p => p.id === b.profesional_id) : null;
          const consObj = b.consultorio_id ? consultorios.find(c => c.id === b.consultorio_id) : null;

          return (
            <div key={b.id} className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border ${badge.bg}`}>
                    <Icon className="w-3 h-3" />
                    {badge.label}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(b)}
                      className="p-1 text-slate-400 hover:text-medical-600 rounded"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar bloqueo "${b.motivo}"?`)) {
                          deleteBloqueo(b.id);
                        }
                      }}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-2.5">
                  <h4 className="font-extrabold text-sm text-slate-900">{b.motivo}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {b.fecha_inicio === b.fecha_fin ? b.fecha_inicio : `${b.fecha_inicio} al ${b.fecha_fin}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detalle de profesional o consultorio */}
              <div className="border-t border-slate-200/80 pt-2 text-[11px] text-slate-500 font-medium">
                {profObj ? (
                  <span className="text-medical-700 font-bold">Afecta a: Dr(a). {profObj.nombre} {profObj.apellido}</span>
                ) : consObj ? (
                  <span className="text-purple-700 font-bold">Afecta a: {consObj.nombre}</span>
                ) : (
                  <span className="text-slate-500 font-bold">Afecta a: Toda la Clínica / Feriado General</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL BLOQUEO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingBloqueo ? 'Editar Bloqueo' : 'Registrar Bloqueo de Agenda'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Bloqueo *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500 bg-white"
                >
                  <option value="VACACIONES">Vacaciones de Profesional</option>
                  <option value="LICENCIA_MEDICA">Licencia Médica / Congreso</option>
                  <option value="FERIADO_NACIONAL">Feriado Nacional / Asueto</option>
                  <option value="MANTENIMIENTO">Mantenimiento de Consultorio</option>
                </select>
              </div>

              {/* Si es vacaciones o licencia, selector de profesional */}
              {(form.tipo === 'VACACIONES' || form.tipo === 'LICENCIA_MEDICA') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Profesional Afectado *</label>
                  <select
                    value={form.profesional_id}
                    onChange={(e) => setForm({ ...form, profesional_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500 bg-white"
                  >
                    <option value="">Seleccione profesional...</option>
                    {profesionales.map(p => (
                      <option key={p.id} value={p.id}>Dr(a). {p.nombre} {p.apellido} ({p.especialidad})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Si es mantenimiento, selector de consultorio */}
              {form.tipo === 'MANTENIMIENTO' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Consultorio Físico *</label>
                  <select
                    value={form.consultorio_id}
                    onChange={(e) => setForm({ ...form, consultorio_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500 bg-white"
                  >
                    <option value="">Seleccione consultorio...</option>
                    {consultorios.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Desde *</label>
                  <input
                    type="date"
                    required
                    value={form.fecha_inicio}
                    onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Hasta *</label>
                  <input
                    type="date"
                    required
                    value={form.fecha_fin}
                    onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo / Descripción *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Vacaciones de invierno, Feriado del Día del Trabajador"
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold shadow-md shadow-medical-600/20"
                >
                  Guardar Bloqueo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
