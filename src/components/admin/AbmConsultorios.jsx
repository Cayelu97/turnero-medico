import React, { useState } from 'react';
import { Plus, Edit, Trash2, DoorClosed, MapPin, Wrench, CheckCircle2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AbmConsultorios = () => {
  const { consultorios, horarios, profesionales, saveConsultorio, deleteConsultorio } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingCons, setEditingCons] = useState(null);

  const [form, setForm] = useState({
    nombre: '',
    piso_ubicacion: 'Planta Baja',
    equipamiento: '',
    activo: true
  });

  const handleOpenModal = (cons = null) => {
    if (cons) {
      setEditingCons(cons);
      setForm({ ...cons });
    } else {
      setEditingCons(null);
      setForm({
        nombre: `Consultorio ${consultorios.length + 1}`,
        piso_ubicacion: 'Planta Baja',
        equipamiento: 'Camilla de examen, Tensiómetro, Escritorio',
        activo: true
      });
    }
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;

    saveConsultorio({
      ...(editingCons ? { id: editingCons.id } : {}),
      ...form
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Gestión de Consultorios Físicos</h2>
          <p className="text-xs text-slate-500">
            Espacios físicos y equipamiento para evitar solapamientos en la asignación de turnos.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold text-sm shadow-md shadow-medical-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Consultorio Físico</span>
        </button>
      </div>

      {/* Grid de Consultorios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {consultorios.map((c) => {
          // Médicos que atienden en este consultorio
          const horariosEnCons = horarios.filter(h => h.consultorio_id === c.id);
          const profIds = Array.from(new Set(horariosEnCons.map(h => h.profesional_id)));
          const profNames = profIds.map(id => {
            const p = profesionales.find(prof => prof.id === id);
            return p ? `Dr(a). ${p.apellido}` : null;
          }).filter(Boolean);

          return (
            <div key={c.id} className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-medical-600 shadow-xs">
                      <DoorClosed className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">{c.nombre}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{c.piso_ubicacion || 'Ubicación no especificada'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(c)}
                      className="p-1.5 text-slate-500 hover:text-medical-600 hover:bg-white rounded-lg transition"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar ${c.nombre}?`)) {
                          deleteConsultorio(c.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Equipamiento */}
                {c.equipamiento && (
                  <div className="mt-3 p-2.5 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                    <Wrench className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{c.equipamiento}</span>
                  </div>
                )}
              </div>

              {/* Médicos asignados */}
              <div className="border-t border-slate-200/80 pt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{profNames.length} profesionales asignados</span>
                {profNames.length > 0 && (
                  <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                    {profNames.join(', ')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL CONSULTORIO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingCons ? 'Editar Consultorio' : 'Nuevo Consultorio Físico'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Consultorio *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Consultorio 1 - Cardiología"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Piso / Ubicación</label>
                <input
                  type="text"
                  placeholder="ej: Planta Baja, Piso 1 - Ala Sur"
                  value={form.piso_ubicacion}
                  onChange={(e) => setForm({ ...form, piso_ubicacion: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Equipamiento e Instrumental</label>
                <textarea
                  rows="2"
                  placeholder="ej: Electrocardiógrafo, Ecógrafo Doppler, Balanza..."
                  value={form.equipamiento}
                  onChange={(e) => setForm({ ...form, equipamiento: e.target.value })}
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
                  Guardar Consultorio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
