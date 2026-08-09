import React, { useState } from 'react';
import { 
  AlertCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  Filter, 
  ArrowRightLeft, 
  XCircle,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AbmMotivos = () => {
  const { motivos, saveMotivo, deleteMotivo } = useApp();

  const [tipoFilter, setTipoFilter] = useState(''); // '' | 'CANCELACION' | 'REPROGRAMACION'
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMotivo, setEditingMotivo] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formState, setFormState] = useState({
    codigo: '',
    descripcion: '',
    tipo: 'CANCELACION', // 'CANCELACION' | 'REPROGRAMACION'
    aplica_a: 'AMBOS', // 'PACIENTE' | 'SECRETARIA' | 'AMBOS'
    activo: true
  });

  const handleOpenCreate = () => {
    setFormState({
      codigo: '',
      descripcion: '',
      tipo: tipoFilter || 'CANCELACION',
      aplica_a: 'AMBOS',
      activo: true
    });
    setEditingMotivo(null);
    setIsCreating(true);
  };

  const handleOpenEdit = (m) => {
    setFormState({
      codigo: m.codigo || '',
      descripcion: m.descripcion || '',
      tipo: m.tipo || 'CANCELACION',
      aplica_a: m.aplica_a || 'AMBOS',
      activo: m.activo !== false
    });
    setEditingMotivo(m);
    setIsCreating(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formState.descripcion.trim()) {
      alert('La descripción del motivo es obligatoria.');
      return;
    }

    saveMotivo({
      id: editingMotivo?.id,
      codigo: formState.codigo || formState.descripcion.substring(0, 15).toUpperCase().replace(/\s+/g, '_'),
      descripcion: formState.descripcion.trim(),
      tipo: formState.tipo,
      aplica_a: formState.aplica_a,
      activo: formState.activo
    });

    setIsCreating(false);
    setEditingMotivo(null);
  };

  const filteredMotivos = motivos.filter(m => {
    if (tipoFilter && m.tipo !== tipoFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchDesc = m.descripcion.toLowerCase().includes(q);
      const matchCod = m.codigo && m.codigo.toLowerCase().includes(q);
      if (!matchDesc && !matchCod) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-medical-600" />
            <span>Motivos de Cancelación y Reprogramación de Turnos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Catálogo institucional de justificaciones requeridas al cancelar o reprogramar citas
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-black shadow-md shadow-medical-600/20 transition transform hover:-translate-y-0.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Motivo</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            onClick={() => setTipoFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
              tipoFilter === '' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({motivos.length})
          </button>
          <button
            onClick={() => setTipoFilter('CANCELACION')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
              tipoFilter === 'CANCELACION' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelación ({motivos.filter(m => m.tipo === 'CANCELACION').length})</span>
          </button>
          <button
            onClick={() => setTipoFilter('REPROGRAMACION')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
              tipoFilter === 'REPROGRAMACION' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Reprogramación ({motivos.filter(m => m.tipo === 'REPROGRAMACION').length})</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold w-full sm:w-64 focus:ring-2 focus:ring-medical-500"
          />
        </div>
      </div>

      {/* Lista / Tabla de Motivos */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Descripción del Motivo</th>
                <th className="py-3 px-4">Aplica A</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredMotivos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No se encontraron motivos registrados.
                  </td>
                </tr>
              ) : (
                filteredMotivos.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                        m.tipo === 'CANCELACION' 
                          ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                          : 'bg-sky-100 text-sky-800 border border-sky-200'
                      }`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {m.codigo || '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {m.descripcion}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      <span className="text-[11px] font-semibold bg-slate-100 px-2 py-0.5 rounded">
                        {m.aplica_a === 'AMBOS' ? 'Paciente y Secretaría' : m.aplica_a === 'PACIENTE' ? 'Solo Paciente' : 'Solo Secretaría / Médico'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        m.activo !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {m.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="p-1.5 text-slate-500 hover:text-medical-600 hover:bg-slate-100 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar el motivo "${m.descripcion}"?`)) {
                              deleteMotivo(m.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Motivo */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingMotivo ? 'Editar Motivo' : 'Nuevo Motivo'}
              </h3>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Acción *</label>
                <select
                  value={formState.tipo}
                  onChange={(e) => setFormState({ ...formState, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-extrabold bg-slate-50"
                >
                  <option value="CANCELACION">Cancelación de Turno</option>
                  <option value="REPROGRAMACION">Reprogramación de Turno</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción del Motivo *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="ej: Solicitado por el paciente por motivos laborales"
                  value={formState.descripcion}
                  onChange={(e) => setFormState({ ...formState, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código Nemotécnico</label>
                  <input
                    type="text"
                    placeholder="ej: PAC_VIAJE"
                    value={formState.codigo}
                    onChange={(e) => setFormState({ ...formState, codigo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Aplica A</label>
                  <select
                    value={formState.aplica_a}
                    onChange={(e) => setFormState({ ...formState, aplica_a: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="AMBOS">Ambos (Paciente y Secretaría)</option>
                    <option value="PACIENTE">Solo Paciente (Portal)</option>
                    <option value="SECRETARIA">Solo Secretaría / Médico</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="motivo_activo"
                  checked={formState.activo}
                  onChange={(e) => setFormState({ ...formState, activo: e.target.checked })}
                  className="rounded text-medical-600 focus:ring-medical-500"
                />
                <label htmlFor="motivo_activo" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Motivo Activo y Visible en Formularios
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-medical-600 hover:bg-medical-700 text-white rounded-xl shadow-md shadow-medical-600/20"
                >
                  Guardar Motivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
