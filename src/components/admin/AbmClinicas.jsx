import React, { useState } from 'react';
import { Plus, Edit, Building2, MapPin, Phone, Mail, Check, X, Shield, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AbmClinicas = () => {
  const { allClinicas, activeClinica, switchClinica, saveClinica } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingClinica, setEditingClinica] = useState(null);

  const [form, setForm] = useState({
    nombre: '',
    cuit: '',
    direccion: '',
    telefono: '',
    whatsapp: '',
    email: '',
    mensaje_bienvenida: 'Bienvenido al turnero online.',
    color_primario: '#0284c7',
    activa: true
  });

  const handleOpenModal = (clinica = null) => {
    if (clinica) {
      setEditingClinica(clinica);
      setForm({ ...clinica });
    } else {
      setEditingClinica(null);
      setForm({
        nombre: '',
        cuit: '',
        direccion: '',
        telefono: '',
        whatsapp: '',
        email: '',
        mensaje_bienvenida: 'Bienvenido a nuestro centro médico. Elija su turno online.',
        color_primario: '#0284c7',
        activa: true
      });
    }
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;

    saveClinica({
      ...(editingClinica ? { id: editingClinica.id } : {}),
      ...form
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900">Centros Médicos & Consultorios (Multi-Tenant)</h2>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md text-[10px] font-black uppercase">
              SaaS Multi-Cliente
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Cada consultorio o centro médico opera con aislamiento 100% independiente de datos, pacientes, obras sociales y turnos.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold text-sm shadow-md shadow-medical-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Dar de Alta Nuevo Consultorio / Centro</span>
        </button>
      </div>

      {/* Grid de Clínicas Registradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allClinicas.map((clin) => {
          const isActive = activeClinica?.id === clin.id;

          return (
            <div 
              key={clin.id}
              className={`p-6 rounded-3xl border transition shadow-sm flex flex-col justify-between space-y-4 ${
                isActive
                  ? 'bg-gradient-to-b from-medical-50/50 to-white border-medical-500 ring-2 ring-medical-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                      style={{ backgroundColor: clin.color_primario || '#0284c7' }}
                    >
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-slate-900">{clin.nombre}</h3>
                        {isActive && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md">
                            Activo Ahora
                          </span>
                        )}
                      </div>
                      {clin.cuit && <span className="text-xs text-slate-500 font-mono">CUIT: {clin.cuit}</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenModal(clin)}
                    className="p-1.5 text-slate-400 hover:text-medical-600 rounded-lg"
                    title="Editar datos del centro"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  {clin.direccion && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{clin.direccion}</span>
                    </div>
                  )}
                  {clin.telefono && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{clin.telefono}</span>
                    </div>
                  )}
                  {clin.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{clin.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  ID: <code className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">{clin.id}</code>
                </span>

                {!isActive ? (
                  <button
                    onClick={() => switchClinica(clin.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                  >
                    <span>Cambiar a esta Clínica</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Espacio de trabajo activo
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL ALTA / EDICIÓN CLÍNICA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingClinica ? 'Editar Centro / Consultorio' : 'Alta de Nuevo Centro Médico Cliente'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Centro *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Policonsultorios Belgrano"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">CUIT</label>
                  <input
                    type="text"
                    placeholder="ej: 30-79812345-1"
                    value={form.cuit}
                    onChange={(e) => setForm({ ...form, cuit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dirección Física</label>
                <input
                  type="text"
                  placeholder="ej: Av. Cabildo 1850, CABA"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp de Turnos</label>
                  <input
                    type="text"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Color Institucional</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color_primario}
                    onChange={(e) => setForm({ ...form, color_primario: e.target.value })}
                    className="w-10 h-8 p-0.5 border border-slate-200 rounded-lg cursor-pointer"
                  />
                  <span className="font-mono text-xs text-slate-600">{form.color_primario}</span>
                </div>
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
                  Guardar Centro Médico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
