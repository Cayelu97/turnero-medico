import React, { useState } from 'react';
import { Plus, Edit, Trash2, Layers, Stethoscope, Search, X, Check, Activity, Clock, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AbmServicios = () => {
  const { servicios, especialidades, nomenclador, profesionales, saveServicio, deleteServicio } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingServ, setEditingServ] = useState(null);

  const [form, setForm] = useState({
    nombre: '',
    especialidad_id: '',
    tipo: 'CONSULTA',
    duracion_default_min: 20,
    color_etiqueta: '#0284c7',
    practicas_ids: [],
    practica_default_id: '',
    descripcion: '',
    activo: true
  });

  const handleOpenModal = (serv = null) => {
    if (serv) {
      setEditingServ(serv);
      setForm({
        ...serv,
        practicas_ids: serv.practicas_ids || [],
        practica_default_id: serv.practica_default_id || (serv.practicas_ids && serv.practicas_ids[0]) || ''
      });
    } else {
      setEditingServ(null);
      setForm({
        nombre: '',
        especialidad_id: especialidades[0]?.id || '',
        tipo: 'CONSULTA',
        duracion_default_min: 20,
        color_etiqueta: '#0284c7',
        practicas_ids: [],
        practica_default_id: '',
        descripcion: '',
        activo: true
      });
    }
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;

    saveServicio({
      ...(editingServ ? { id: editingServ.id } : {}),
      ...form,
      duracion_default_min: Number(form.duracion_default_min)
    });
    setShowModal(false);
  };

  const togglePractica = (id) => {
    setForm(prev => {
      const current = prev.practicas_ids || [];
      const updated = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
      return { ...prev, practicas_ids: updated };
    });
  };

  const filteredServicios = servicios.filter(s =>
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.descripcion && s.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTipoBadge = (tipo) => {
    switch (tipo) {
      case 'CONSULTA':
        return { label: 'Consulta Médica', bg: 'bg-sky-100 text-sky-800 border-sky-200' };
      case 'ESTUDIO_PRACTICA':
        return { label: 'Estudio / Práctica', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'PROCEDIMIENTO':
        return { label: 'Procedimiento / Terapia', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { label: tipo, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900">Servicios Médicos & Líneas de Atención ({servicios.length})</h2>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-900 rounded-md text-[10px] font-black uppercase">
              Diferenciador de Agendas
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Diferencia turneros de <strong>Consultas</strong> vs <strong>Prácticas / Estudios</strong> (ej. Cardiólogo en Consultas de 20 min vs Ecocardiogramas de 30 min).
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold text-sm shadow-md shadow-medical-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Servicio Médico</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar servicio médico..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
        />
      </div>

      {/* Grid de Servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServicios.map((serv) => {
          const esp = especialidades.find(e => e.id === serv.especialidad_id);
          const medicosEnServicio = profesionales.filter(p => p.servicios_ids && p.servicios_ids.includes(serv.id));
          const tipoBadge = getTipoBadge(serv.tipo);

          return (
            <div key={serv.id} className="bg-white border border-slate-200 rounded-3xl p-5 hover:border-slate-300 transition shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xs"
                      style={{ backgroundColor: serv.color_etiqueta || '#0284c7' }}
                    >
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{serv.nombre}</h4>
                      <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                        Especialidad: <strong>{esp?.nombre || 'General'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(serv)}
                      className="p-1 text-slate-400 hover:text-medical-600 rounded"
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar el servicio "${serv.nombre}"?`)) {
                          deleteServicio(serv.id);
                        }
                      }}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tipoBadge.bg}`}>
                    {tipoBadge.label}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    ⏱️ {serv.duracion_default_min} min
                  </span>
                  {serv.practica_default_id && (
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                      ⭐ PMO: {nomenclador.find(n => n.id === serv.practica_default_id)?.codigo_pmo || 'Sugerido'}
                    </span>
                  )}
                </div>

                {serv.descripcion && (
                  <p className="text-xs text-slate-500 mt-2.5 line-clamp-2">{serv.descripcion}</p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>{medicosEnServicio.length} profesionales asignados</span>
                {medicosEnServicio.length > 0 && (
                  <span className="font-bold text-medical-700 truncate max-w-[130px]">
                    {medicosEnServicio.map(m => `Dr(a). ${m.apellido}`).join(', ')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL SERVICIO MÉDICO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {editingServ ? 'Editar Servicio Médico' : 'Nuevo Servicio Médico / Línea de Turnos'}
                </h3>
                <span className="text-xs text-slate-500">Configura modalidad, duración y especialidad</span>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Servicio *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Consultas Cardiológicas, Prácticas y Ecocardiogramas..."
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Especialidad Médica *</label>
                  <select
                    value={form.especialidad_id}
                    onChange={(e) => setForm({ ...form, especialidad_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                  >
                    {especialidades.map(esp => (
                      <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Servicio *</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                  >
                    <option value="CONSULTA">Consulta Médica</option>
                    <option value="ESTUDIO_PRACTICA">Estudio / Práctica Diagnóstica</option>
                    <option value="PROCEDIMIENTO">Procedimiento / Terapia</option>
                    <option value="GUARDIA_DEMANDA">Demanda Espontánea</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duración por Turno (min)</label>
                  <select
                    value={form.duracion_default_min}
                    onChange={(e) => setForm({ ...form, duracion_default_min: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value={10}>10 minutos</option>
                    <option value={15}>15 minutos</option>
                    <option value={20}>20 minutos (Estándar consultas)</option>
                    <option value={30}>30 minutos (Estándar estudios)</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Color Distintivo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color_etiqueta}
                      onChange={(e) => setForm({ ...form, color_etiqueta: e.target.value })}
                      className="w-10 h-8 p-0.5 border border-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="font-mono text-xs text-slate-600">{form.color_etiqueta}</span>
                  </div>
                </div>
              </div>

              {/* Prácticas del Nomenclador asociadas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Prácticas del Nomenclador PMO admitidas en este servicio:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {nomenclador.map(nom => {
                    const isChecked = (form.practicas_ids || []).includes(nom.id);
                    return (
                      <label key={nom.id} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePractica(nom.id)}
                          className="rounded text-medical-600 focus:ring-medical-500"
                        />
                        <span className="truncate">{nom.codigo_pmo} - {nom.descripcion}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Código / Práctica por Defecto Sugerida */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ⭐ Código PMO / Práctica por Defecto (Sugerida automáticamente al agendar)
                </label>
                <select
                  value={form.practica_default_id || ''}
                  onChange={(e) => setForm({ ...form, practica_default_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                >
                  <option value="">-- Sin código por defecto (Elegir manualmente) --</option>
                  {nomenclador.map(nom => (
                    <option key={nom.id} value={nom.id}>
                      {nom.codigo_pmo} - {nom.descripcion} (Valor: ${nom.valor_particular?.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Al sacar un turno en este servicio, el sistema propondrá este código automáticamente sin tener que tipear.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción / Indicaciones</label>
                <textarea
                  rows="2"
                  placeholder="ej: Turnero exclusivo para estudios de diagnóstico..."
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-medical-600 hover:bg-medical-700 text-white rounded-xl shadow-md shadow-medical-600/20"
                >
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
