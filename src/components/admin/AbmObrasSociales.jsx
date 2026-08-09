import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ShieldCheck, 
  Layers, 
  DollarSign, 
  Check, 
  AlertCircle,
  FileCheck2,
  X,
  Search
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AbmObrasSociales = () => {
  const { 
    obrasSociales, 
    planes, 
    nomenclador, 
    conveniosCoseguros, 
    saveObraSocial, 
    deleteObraSocial, 
    savePlan, 
    deletePlan,
    saveConvenioCoseguro
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOsForPlanes, setSelectedOsForPlanes] = useState(null);
  const [selectedPlanForCoseguros, setSelectedPlanForCoseguros] = useState(null);

  // Modales
  const [showOsModal, setShowOsModal] = useState(false);
  const [editingOs, setEditingOs] = useState(null);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [showCoseguroModal, setShowCoseguroModal] = useState(false);
  const [editingCoseguro, setEditingCoseguro] = useState(null);

  // Form states Obra Social
  const [osForm, setOsForm] = useState({
    nombre: '',
    sigla: '',
    cuit: '',
    requiere_bono: false,
    requiere_autorizacion: false,
    instrucciones: '',
    activo: true
  });

  // Form states Plan
  const [planForm, setPlanForm] = useState({
    nombre_plan: '',
    codigo_plan: '',
    descripcion: '',
    activo: true
  });

  // Form states Coseguro
  const [coseguroForm, setCoseguroForm] = useState({
    practica_id: '',
    monto_coseguro: 0,
    cubierto_100: false,
    observaciones: ''
  });

  // Handlers Obra Social
  const handleOpenOsModal = (os = null) => {
    if (os) {
      setEditingOs(os);
      setOsForm({ ...os });
    } else {
      setEditingOs(null);
      setOsForm({
        nombre: '',
        sigla: '',
        cuit: '',
        requiere_bono: false,
        requiere_autorizacion: false,
        instrucciones: 'Presentar credencial y DNI al momento de la consulta.',
        activo: true
      });
    }
    setShowOsModal(true);
  };

  const handleSaveOs = (e) => {
    e.preventDefault();
    if (!osForm.nombre.trim()) return;
    saveObraSocial({
      ...(editingOs ? { id: editingOs.id } : {}),
      ...osForm
    });
    setShowOsModal(false);
  };

  // Handlers Plan
  const handleOpenPlanModal = (os, plan = null) => {
    setSelectedOsForPlanes(os);
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({ ...plan });
    } else {
      setEditingPlan(null);
      setPlanForm({
        nombre_plan: '',
        codigo_plan: '',
        descripcion: '',
        activo: true
      });
    }
    setShowPlanModal(true);
  };

  const handleSavePlan = (e) => {
    e.preventDefault();
    if (!planForm.nombre_plan.trim() || !selectedOsForPlanes) return;
    savePlan({
      ...(editingPlan ? { id: editingPlan.id } : {}),
      obra_social_id: selectedOsForPlanes.id,
      ...planForm
    });
    setShowPlanModal(false);
  };

  // Handlers Coseguro por Plan
  const handleOpenCoseguroModal = (plan) => {
    setSelectedPlanForCoseguros(plan);
    setCoseguroForm({
      practica_id: nomenclador[0]?.id || '',
      monto_coseguro: 0,
      cubierto_100: false,
      observaciones: ''
    });
    setShowCoseguroModal(true);
  };

  const handleSaveCoseguro = (e) => {
    e.preventDefault();
    if (!coseguroForm.practica_id || !selectedPlanForCoseguros) return;
    saveConvenioCoseguro({
      plan_id: selectedPlanForCoseguros.id,
      ...coseguroForm,
      monto_coseguro: coseguroForm.cubierto_100 ? 0 : Number(coseguroForm.monto_coseguro)
    });
    setShowCoseguroModal(false);
  };

  const filteredObras = obrasSociales.filter(os => 
    os.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (os.sigla && os.sigla.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Barra de Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar obra social o prepaga..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-medical-500"
          />
        </div>

        <button
          onClick={() => handleOpenOsModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold text-sm shadow-md shadow-medical-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Obra Social / Prepaga</span>
        </button>
      </div>

      {/* Listado de Obras Sociales con sus Planes y Coseguros */}
      <div className="space-y-4">
        {filteredObras.map((os) => {
          const osPlanes = planes.filter(p => p.obra_social_id === os.id);

          return (
            <div key={os.id} className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs text-medical-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-base text-slate-900">{os.nombre}</h3>
                      {os.sigla && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-slate-200/80 text-slate-700 rounded-md">
                          {os.sigla}
                        </span>
                      )}
                      {os.sigla === 'PART' ? (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-md">
                          Particular / Privado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-sky-100 text-sky-800 rounded-md">
                          Convenio Financiador
                        </span>
                      )}
                    </div>
                    {os.cuit && <p className="text-xs text-slate-500 mt-0.5">CUIT: {os.cuit}</p>}
                    <p className="text-xs text-slate-600 mt-1 italic">
                      {os.instrucciones || 'Sin instrucciones adicionales'}
                    </p>
                  </div>
                </div>

                {/* Badges de Requisitos & Acciones */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {os.requiere_bono && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
                      <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
                      Requiere Bono
                    </span>
                  )}
                  {os.requiere_autorizacion && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
                      Autorización Previa
                    </span>
                  )}

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleOpenPlanModal(os)}
                      className="px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Plan</span>
                    </button>
                    <button
                      onClick={() => handleOpenOsModal(os)}
                      className="p-1.5 text-slate-600 hover:text-medical-600 hover:bg-white rounded-lg transition"
                      title="Editar Obra Social"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {os.sigla !== 'PART' && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la obra social "${os.nombre}" y todos sus planes?`)) {
                            deleteObraSocial(os.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
                        title="Eliminar Obra Social"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Subtabla de Planes */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    Planes de Cobertura Registrados ({osPlanes.length})
                  </span>
                </div>

                {osPlanes.length === 0 ? (
                  <div className="bg-white/80 border border-dashed border-slate-200 rounded-xl p-3 text-center text-xs text-slate-500">
                    No hay planes registrados para {os.nombre}. Haz clic en "Agregar Plan" para crear uno.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {osPlanes.map((plan) => {
                      // Obtener coseguros específicos de este plan
                      const planCoseguros = conveniosCoseguros.filter(c => c.plan_id === plan.id);

                      return (
                        <div key={plan.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-slate-900">{plan.nombre_plan}</span>
                                {plan.codigo_plan && (
                                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                    {plan.codigo_plan}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{plan.descripcion || 'Sin descripción'}</p>
                            </div>

                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => handleOpenPlanModal(os, plan)}
                                className="p-1 text-slate-400 hover:text-sky-600 rounded"
                                title="Editar Plan"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`¿Eliminar plan "${plan.nombre_plan}"?`)) {
                                    deletePlan(plan.id);
                                  }
                                }}
                                className="p-1 text-slate-300 hover:text-rose-600 rounded"
                                title="Eliminar Plan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Coseguros asociados */}
                          <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                            <span className="text-[11px] text-slate-500">
                              {planCoseguros.length > 0 
                                ? `${planCoseguros.length} reglas de coseguro` 
                                : 'Coseguro por defecto'}
                            </span>
                            <button
                              onClick={() => handleOpenCoseguroModal(plan)}
                              className="text-[11px] font-bold text-medical-600 hover:text-medical-800 flex items-center gap-1"
                            >
                              <DollarSign className="w-3 h-3" />
                              Configurar Coseguro
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

      {/* MODAL OBRA SOCIAL */}
      {showOsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingOs ? 'Editar Obra Social / Prepaga' : 'Nueva Obra Social / Prepaga'}
              </h3>
              <button onClick={() => setShowOsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOs} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: OSDE, Swiss Medical"
                    value={osForm.nombre}
                    onChange={(e) => setOsForm({ ...osForm, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sigla / Abreviatura</label>
                  <input
                    type="text"
                    placeholder="ej: OSDE, SMG, IOMA"
                    value={osForm.sigla}
                    onChange={(e) => setOsForm({ ...osForm, sigla: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CUIT (Opcional para facturación)</label>
                <input
                  type="text"
                  placeholder="ej: 30-54674125-3"
                  value={osForm.cuit}
                  onChange={(e) => setOsForm({ ...osForm, cuit: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                />
              </div>

              {/* Requisitos */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="block text-xs font-bold text-slate-800">Requisitos de atención para el afiliado:</span>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={osForm.requiere_bono}
                    onChange={(e) => setOsForm({ ...osForm, requiere_bono: e.target.checked })}
                    className="rounded text-medical-600 focus:ring-medical-500"
                  />
                  <span>Requiere Bono de Consulta / Orden impresa</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={osForm.requiere_autorizacion}
                    onChange={(e) => setOsForm({ ...osForm, requiere_autorizacion: e.target.checked })}
                    className="rounded text-medical-600 focus:ring-medical-500"
                  />
                  <span>Requiere Autorización previa online</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instrucciones para el comprobante de turno</label>
                <textarea
                  rows="2"
                  placeholder="ej: Traer credencial física o digital y último recibo..."
                  value={osForm.instrucciones}
                  onChange={(e) => setOsForm({ ...osForm, instrucciones: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOsModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold shadow-md shadow-medical-600/20"
                >
                  Guardar Obra Social
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PLAN */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {editingPlan ? 'Editar Plan' : 'Nuevo Plan de Cobertura'}
                </h3>
                <p className="text-xs text-medical-600 font-bold">{selectedOsForPlanes?.nombre}</p>
              </div>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Plan *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Plan 210, SMG20, Oro"
                  value={planForm.nombre_plan}
                  onChange={(e) => setPlanForm({ ...planForm, nombre_plan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Código Interno / Sigla</label>
                <input
                  type="text"
                  placeholder="ej: OSDE-210, SMG-20"
                  value={planForm.codigo_plan}
                  onChange={(e) => setPlanForm({ ...planForm, codigo_plan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción / Cobertura</label>
                <input
                  type="text"
                  placeholder="ej: Sin coseguro en consultas ambulatorias"
                  value={planForm.descripcion}
                  onChange={(e) => setPlanForm({ ...planForm, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold shadow-md shadow-medical-600/20"
                >
                  Guardar Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL COSEGURO POR PLAN Y PRÁCTICA */}
      {showCoseguroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  Regla de Coseguro / Copago
                </h3>
                <p className="text-xs text-medical-600 font-bold">Plan: {selectedPlanForCoseguros?.nombre_plan}</p>
              </div>
              <button onClick={() => setShowCoseguroModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoseguro} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Práctica Médica (PMO) *</label>
                <select
                  value={coseguroForm.practica_id}
                  onChange={(e) => setCoseguroForm({ ...coseguroForm, practica_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500 bg-white"
                >
                  {nomenclador.map(nom => (
                    <option key={nom.id} value={nom.id}>
                      {nom.codigo_pmo} - {nom.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={coseguroForm.cubierto_100}
                    onChange={(e) => setCoseguroForm({ ...coseguroForm, cubierto_100: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Cubierto al 100% (Sin coseguro / $0)</span>
                </label>
              </div>

              {!coseguroForm.cubierto_100 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monto Coseguro a Cobrar ($ ARS) *</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={coseguroForm.monto_coseguro}
                    onChange={(e) => setCoseguroForm({ ...coseguroForm, monto_coseguro: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500 font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones / Requisitos</label>
                <input
                  type="text"
                  placeholder="ej: Con orden firmada, bono digital"
                  value={coseguroForm.observaciones}
                  onChange={(e) => setCoseguroForm({ ...coseguroForm, observaciones: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCoseguroModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold shadow-md shadow-medical-600/20"
                >
                  Guardar Coseguro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
