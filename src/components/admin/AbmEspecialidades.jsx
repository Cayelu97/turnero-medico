import React, { useState } from 'react';
import { Plus, Edit, Trash2, Stethoscope, Search, Check, X, BookOpen, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AbmEspecialidades = () => {
  const { especialidades, saveEspecialidad, deleteEspecialidad, profesionales } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEsp, setEditingEsp] = useState(null);

  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    activa: true
  });

  const handleOpenModal = (esp = null) => {
    if (esp) {
      setEditingEsp(esp);
      setForm({ ...esp });
    } else {
      setEditingEsp(null);
      setForm({
        nombre: '',
        codigo: '',
        descripcion: '',
        activa: true
      });
    }
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;

    saveEspecialidad({
      ...(editingEsp ? { id: editingEsp.id } : {}),
      ...form
    });
    setShowModal(false);
  };

  const filteredEspecialidades = especialidades.filter(e => 
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.codigo && e.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Especialidades Médicas ({especialidades.length})</h2>
          <p className="text-xs text-slate-500">
            Catálogo oficial de especialidades médicas precargado con los estándares de salud en Argentina.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold text-sm shadow-md shadow-medical-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Especialidad</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar especialidad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
        />
      </div>

      {/* Grid de Especialidades */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredEspecialidades.map((esp) => {
          const medicosEnEsp = profesionales.filter(p => p.especialidad === esp.nombre || p.especialidad_id === esp.id);

          return (
            <div key={esp.id} className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-medical-600 shadow-xs">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900">{esp.nombre}</h4>
                        {esp.codigo && (
                          <span className="font-mono text-[10px] bg-slate-200/80 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                            {esp.codigo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(esp)}
                      className="p-1 text-slate-400 hover:text-medical-600 rounded"
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la especialidad "${esp.nombre}"?`)) {
                          deleteEspecialidad(esp.id);
                        }
                      }}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {esp.descripcion && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{esp.descripcion}</p>
                )}
              </div>

              <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>{medicosEnEsp.length} médicos asignados</span>
                {medicosEnEsp.length > 0 && (
                  <span className="font-bold text-medical-700 truncate max-w-[140px]">
                    {medicosEnEsp.map(m => `Dr(a). ${m.apellido}`).join(', ')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL ESPECIALIDAD */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingEsp ? 'Editar Especialidad Médica' : 'Nueva Especialidad Médica'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Especialidad *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Cardiología, Dermatología..."
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Código / Sigla</label>
                <input
                  type="text"
                  placeholder="ej: CARD, DERM, PED"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción / Alcance</label>
                <textarea
                  rows="2"
                  placeholder="ej: Diagnóstico y tratamiento de patologías..."
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
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
                  Guardar Especialidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
