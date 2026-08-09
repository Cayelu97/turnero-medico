import React, { useState } from 'react';
import { Plus, Edit, Trash2, BookOpen, Clock, DollarSign, AlertCircle, FileCheck2, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AbmNomenclador = () => {
  const { nomenclador, savePractica, deletePractica } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPractica, setEditingPractica] = useState(null);

  const [form, setForm] = useState({
    codigo_pmo: '',
    descripcion: '',
    duracion_minutos: 20,
    valor_particular: 15000,
    coseguro_defecto: 0,
    requiere_orden: false,
    requiere_autorizacion: false,
    instrucciones_preparacion: '',
    activo: true
  });

  const handleOpenModal = (practica = null) => {
    if (practica) {
      setEditingPractica(practica);
      setForm({ ...practica });
    } else {
      setEditingPractica(null);
      setForm({
        codigo_pmo: '',
        descripcion: '',
        duracion_minutos: 20,
        valor_particular: 15000,
        coseguro_defecto: 0,
        requiere_orden: false,
        requiere_autorizacion: false,
        instrucciones_preparacion: '',
        activo: true
      });
    }
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.codigo_pmo.trim() || !form.descripcion.trim()) return;

    savePractica({
      ...(editingPractica ? { id: editingPractica.id } : {}),
      ...form,
      duracion_minutos: Number(form.duracion_minutos),
      valor_particular: Number(form.valor_particular),
      coseguro_defecto: Number(form.coseguro_defecto)
    });
    setShowModal(false);
  };

  const filteredPracticas = nomenclador.filter(p => 
    p.codigo_pmo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código PMO o práctica..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-medical-500"
          />
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold text-sm shadow-md shadow-medical-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Práctica / Código PMO</span>
        </button>
      </div>

      {/* Tabla de Prácticas */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-extrabold">
            <tr>
              <th className="px-4 py-3.5">Código PMO</th>
              <th className="px-4 py-3.5">Descripción de la Prestación</th>
              <th className="px-4 py-3.5">Duración</th>
              <th className="px-4 py-3.5">Arancel Particular</th>
              <th className="px-4 py-3.5">Coseguro Base</th>
              <th className="px-4 py-3.5">Requisitos</th>
              <th className="px-4 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPracticas.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80 transition">
                <td className="px-4 py-3.5 font-mono font-bold text-medical-700 text-xs">
                  {p.codigo_pmo}
                </td>
                <td className="px-4 py-3.5 font-bold text-slate-900">
                  <div>{p.descripcion}</div>
                  {p.instrucciones_preparacion && (
                    <div className="text-[11px] text-slate-500 font-normal italic mt-0.5">
                      Prep: {p.instrucciones_preparacion}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-600 font-medium whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {p.duracion_minutos} min
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs font-bold text-slate-900 whitespace-nowrap">
                  ${Number(p.valor_particular || 0).toLocaleString('es-AR')}
                </td>
                <td className="px-4 py-3.5 text-xs font-bold text-emerald-700 whitespace-nowrap">
                  {Number(p.coseguro_defecto || 0) === 0 ? 'Sin Coseguro ($0)' : `$${Number(p.coseguro_defecto).toLocaleString('es-AR')}`}
                </td>
                <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {p.requiere_orden && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                        Orden Médica
                      </span>
                    )}
                    {p.requiere_autorizacion && (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded">
                        Autorización
                      </span>
                    )}
                    {!p.requiere_orden && !p.requiere_autorizacion && (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleOpenModal(p)}
                      className="p-1.5 text-slate-500 hover:text-medical-600 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar práctica "${p.codigo_pmo} - ${p.descripcion}"?`)) {
                          deletePractica(p.id);
                        }
                      }}
                      className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL PRÁCTICA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingPractica ? 'Editar Práctica Médica' : 'Nueva Práctica Médica (PMO)'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código PMO *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: 42.01.01"
                    value={form.codigo_pmo}
                    onChange={(e) => setForm({ ...form, codigo_pmo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-medical-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descripción de la Prestación *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Consulta Médica Especializada"
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duración (min)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    step="5"
                    value={form.duracion_minutos}
                    onChange={(e) => setForm({ ...form, duracion_minutos: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valor Particular ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={form.valor_particular}
                    onChange={(e) => setForm({ ...form, valor_particular: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Coseguro Base ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={form.coseguro_defecto}
                    onChange={(e) => setForm({ ...form, coseguro_defecto: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500 font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="block text-xs font-bold text-slate-800">Requisitos para el turno:</span>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiere_orden}
                    onChange={(e) => setForm({ ...form, requiere_orden: e.target.checked })}
                    className="rounded text-medical-600 focus:ring-medical-500"
                  />
                  <span>Requiere Orden Médica Previa / Pedido de estudio</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiere_autorizacion}
                    onChange={(e) => setForm({ ...form, requiere_autorizacion: e.target.checked })}
                    className="rounded text-medical-600 focus:ring-medical-500"
                  />
                  <span>Requiere Autorización previa de la obra social</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instrucciones de preparación (ayuno, vestimenta, etc.)</label>
                <textarea
                  rows="2"
                  placeholder="ej: Ayuno de 8 horas. No suspender medicación habitual..."
                  value={form.instrucciones_preparacion}
                  onChange={(e) => setForm({ ...form, instrucciones_preparacion: e.target.value })}
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
                  Guardar Práctica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
