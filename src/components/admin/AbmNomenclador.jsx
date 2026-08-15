import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Clock, 
  DollarSign, 
  AlertCircle, 
  FileCheck2, 
  Search, 
  X, 
  Brain, 
  Stethoscope, 
  FlaskConical, 
  Smile, 
  Activity, 
  Layers, 
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TIPOS_NOMENCLADOR = [
  { id: 'TODOS', label: 'Todos los Nomencladores', icon: Layers, color: 'text-slate-700 bg-slate-100' },
  { id: 'PSICOLOGIA', label: 'Psicología (CPPC / PMO)', icon: Brain, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  { id: 'PMO_MEDICO', label: 'Médico (PMO Nacional)', icon: Stethoscope, color: 'text-sky-700 bg-sky-50 border-sky-200' },
  { id: 'NBU_BIOQUIMICO', label: 'Bioquímico (NBU - UB/UG)', icon: FlaskConical, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'ODONTOLOGICO', label: 'Odontológico (Capítulos 01-10)', icon: Smile, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'KINESICO', label: 'Kinesiología & Fisioterapia', icon: Activity, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  { id: 'IMAGENES', label: 'Diagnóstico por Imágenes', icon: Activity, color: 'text-purple-700 bg-purple-50 border-purple-200' }
];

export const CAPITULOS_ODONTOLOGIA = [
  '01 - Consultas y Diagnóstico',
  '02 - Operatoria Dental (Restauraciones)',
  '03 - Endodoncia (Tratamientos de Conducto)',
  '04 - Prótesis Fija y Removible',
  '05 - Cirugía Bucomaxilofacial',
  '06 - Periodoncia',
  '07 - Ortodoncia y Ortopedia Funcional',
  '08 - Radiología Dental',
  '09 - Odontopediatría',
  '10 - Prevención y Sellantes'
];

export const AbmNomenclador = () => {
  const { nomenclador, savePractica, deletePractica, obrasSociales, conveniosCoseguros, saveConvenioCoseguro } = useApp();

  const [selectedTipoTab, setSelectedTipoTab] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPractica, setEditingPractica] = useState(null);
  
  // Modal de convenios / valorizador por obra social
  const [showConveniosModal, setShowConveniosModal] = useState(false);
  const [selectedPracticaForConvenio, setSelectedPracticaForConvenio] = useState(null);

  const [form, setForm] = useState({
    tipo_nomenclador: 'PSICOLOGIA',
    codigo_pmo: '',
    descripcion: '',
    duracion_minutos: 45,
    valor_particular: 16000,
    coseguro_defecto: 0,
    requiere_orden: false,
    requiere_autorizacion: false,
    instrucciones_preparacion: '',
    // Campos específicos según tipo
    unidades_bioquimicas: 0,
    unidades_gastos: 0,
    capitulo_odontologia: '01 - Consultas y Diagnóstico',
    dientes_aplicables: 'TODOS',
    modalidad_atencion: 'AMBAS', // 'PRESENCIAL' | 'ONLINE' | 'AMBAS'
    activo: true
  });

  const handleOpenModal = (practica = null) => {
    if (practica) {
      setEditingPractica(practica);
      setForm({
        tipo_nomenclador: practica.tipo_nomenclador || 'PSICOLOGIA',
        codigo_pmo: practica.codigo_pmo || '',
        descripcion: practica.descripcion || '',
        duracion_minutos: practica.duracion_minutos || 45,
        valor_particular: practica.valor_particular || 16000,
        coseguro_defecto: practica.coseguro_defecto || 0,
        requiere_orden: Boolean(practica.requiere_orden),
        requiere_autorizacion: Boolean(practica.requiere_autorizacion),
        instrucciones_preparacion: practica.instrucciones_preparacion || '',
        unidades_bioquimicas: practica.unidades_bioquimicas || 0,
        unidades_gastos: practica.unidades_gastos || 0,
        capitulo_odontologia: practica.capitulo_odontologia || '01 - Consultas y Diagnóstico',
        dientes_aplicables: practica.dientes_aplicables || 'TODOS',
        modalidad_atencion: practica.modalidad_atencion || 'AMBAS',
        activo: practica.activo !== false
      });
    } else {
      setEditingPractica(null);
      setForm({
        tipo_nomenclador: selectedTipoTab !== 'TODOS' ? selectedTipoTab : 'PSICOLOGIA',
        codigo_pmo: '',
        descripcion: '',
        duracion_minutos: 45,
        valor_particular: 16000,
        coseguro_defecto: 0,
        requiere_orden: false,
        requiere_autorizacion: false,
        instrucciones_preparacion: '',
        unidades_bioquimicas: 0,
        unidades_gastos: 0,
        capitulo_odontologia: '01 - Consultas y Diagnóstico',
        dientes_aplicables: 'TODOS',
        modalidad_atencion: 'AMBAS',
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
      duracion_minutos: Number(form.duracion_minutos || 20),
      valor_particular: Number(form.valor_particular || 0),
      coseguro_defecto: Number(form.coseguro_defecto || 0),
      unidades_bioquimicas: Number(form.unidades_bioquimicas || 0),
      unidades_gastos: Number(form.unidades_gastos || 0)
    });
    setShowModal(false);
  };

  const filteredPracticas = nomenclador.filter(p => {
    // Filtro por pestaña de tipo
    if (selectedTipoTab !== 'TODOS' && p.tipo_nomenclador !== selectedTipoTab) {
      // Compatibilidad con registros previos sin tipo_nomenclador
      if (!p.tipo_nomenclador && selectedTipoTab !== 'PMO_MEDICO') return false;
    }

    // Buscador
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchCodigo = p.codigo_pmo?.toLowerCase().includes(q);
      const matchDesc = p.descripcion?.toLowerCase().includes(q);
      const matchTipo = p.tipo_nomenclador?.toLowerCase().includes(q);
      if (!matchCodigo && !matchDesc && !matchTipo) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* HEADER DE MÓDULO & ACCIONES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900">Catálogo y Nomencladores Oficiales</h2>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
              Salud Mental & Médico
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de códigos arancelarios éticos referenciales (CPPC, PMO Nacional, NBU Bioquímico, Odontológico y Prestaciones).
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Práctica / Código</span>
        </button>
      </div>

      {/* PESTAÑAS DE TIPOS DE NOMENCLADOR */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {TIPOS_NOMENCLADOR.map(tab => {
          const Icon = tab.icon;
          const isActive = selectedTipoTab === tab.id;
          const count = tab.id === 'TODOS' 
            ? nomenclador.length 
            : nomenclador.filter(p => p.tipo_nomenclador === tab.id || (!p.tipo_nomenclador && tab.id === 'PMO_MEDICO')).length;

          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTipoTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-300' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* BUSCADOR */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por código (ej: 33.01.02 o 42.01.01) o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        />
      </div>

      {/* TABLA DE PRÁCTICAS */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-extrabold">
            <tr>
              <th className="px-4 py-3.5">Código</th>
              <th className="px-4 py-3.5">Tipo / Nomenclador</th>
              <th className="px-4 py-3.5">Descripción de la Prestación</th>
              <th className="px-4 py-3.5">Duración</th>
              <th className="px-4 py-3.5">Arancel Particular</th>
              <th className="px-4 py-3.5">Coseguro Base</th>
              <th className="px-4 py-3.5">Requisitos</th>
              <th className="px-4 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredPracticas.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                  No se encontraron prácticas cargadas para este criterio de búsqueda.
                </td>
              </tr>
            ) : (
              filteredPracticas.map((p) => {
                const tipoObj = TIPOS_NOMENCLADOR.find(t => t.id === (p.tipo_nomenclador || 'PMO_MEDICO')) || TIPOS_NOMENCLADOR[1];

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-mono font-black text-indigo-700 whitespace-nowrap">
                      {p.codigo_pmo}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${tipoObj.color}`}>
                        {tipoObj.label.split(' ')[0]}
                      </span>
                      {p.capitulo_odontologia && (
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                          {p.capitulo_odontologia}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      <div>{p.descripcion}</div>
                      {p.tipo_nomenclador === 'NBU_BIOQUIMICO' && (p.unidades_bioquimicas > 0 || p.unidades_gastos > 0) && (
                        <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                          UB: {p.unidades_bioquimicas || 0} • UG: {p.unidades_gastos || 0}
                        </div>
                      )}
                      {p.instrucciones_preparacion && (
                        <div className="text-[10px] text-slate-400 font-normal italic mt-0.5 truncate max-w-sm">
                          Prep: {p.instrucciones_preparacion}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {p.duracion_minutos} min
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                      ${Number(p.valor_particular || 0).toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-700 whitespace-nowrap">
                      {Number(p.coseguro_defecto || 0) === 0 ? 'Sin Coseguro ($0)' : `$${Number(p.coseguro_defecto).toLocaleString('es-AR')}`}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 flex-wrap">
                        {p.requiere_orden && (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded border border-amber-200">
                            Orden
                          </span>
                        )}
                        {p.requiere_autorizacion && (
                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-800 text-[10px] font-bold rounded border border-purple-200">
                            Autoriz.
                          </span>
                        )}
                        {!p.requiere_orden && !p.requiere_autorizacion && (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(p)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar práctica "${p.codigo_pmo} - ${p.descripcion}"?`)) {
                              deletePractica(p.id);
                            }
                          }}
                          className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR / EDITAR PRÁCTICA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {editingPractica ? 'Editar Práctica / Prestación' : 'Nueva Práctica en Nomenclador'}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Salud mental, consultas médicas, NBU, odontología e imágenes
                </span>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Selector de Tipo de Nomenclador */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Nomenclador *</label>
                <select
                  value={form.tipo_nomenclador}
                  onChange={(e) => setForm({ ...form, tipo_nomenclador: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PSICOLOGIA">🧠 Psicología y Salud Mental (CPPC / FEPRA / PMO)</option>
                  <option value="PMO_MEDICO">🩺 Médico (PMO Nacional / Consultas y Cirugías)</option>
                  <option value="NBU_BIOQUIMICO">🧪 Bioquímico (Nomenclador Bioquímico Único NBU)</option>
                  <option value="ODONTOLOGICO">🦷 Odontológico (Capítulos 01 al 10)</option>
                  <option value="KINESICO">🏃 Kinesiología y Fisioterapia</option>
                  <option value="IMAGENES">📡 Diagnóstico por Imágenes / Ecografías</option>
                </select>
              </div>

              {/* Código y Descripción */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Código Oficial *</label>
                  <input
                    type="text"
                    required
                    placeholder={form.tipo_nomenclador === 'PSICOLOGIA' ? 'ej: 33.01.02' : 'ej: 42.01.01'}
                    value={form.codigo_pmo}
                    onChange={(e) => setForm({ ...form, codigo_pmo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Descripción de la Prestación *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Sesión de Psicoterapia Individual"
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Campos específicos Odontología */}
              {form.tipo_nomenclador === 'ODONTOLOGICO' && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                  <label className="block font-bold text-amber-900">Capítulo Odontológico</label>
                  <select
                    value={form.capitulo_odontologia}
                    onChange={(e) => setForm({ ...form, capitulo_odontologia: e.target.value })}
                    className="w-full px-3 py-2 border border-amber-200 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  >
                    {CAPITULOS_ODONTOLOGIA.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Campos específicos NBU Bioquímico */}
              {form.tipo_nomenclador === 'NBU_BIOQUIMICO' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                  <div>
                    <label className="block font-bold text-emerald-900 mb-1">Unidades Bioquímicas (UB)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.unidades_bioquimicas}
                      onChange={(e) => setForm({ ...form, unidades_bioquimicas: e.target.value })}
                      className="w-full px-3 py-2 border border-emerald-200 bg-white rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-emerald-900 mb-1">Unidades de Gastos (UG)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.unidades_gastos}
                      onChange={(e) => setForm({ ...form, unidades_gastos: e.target.value })}
                      className="w-full px-3 py-2 border border-emerald-200 bg-white rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Duración y Valores Arancelarios */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duración (min)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    step="5"
                    value={form.duracion_minutos}
                    onChange={(e) => setForm({ ...form, duracion_minutos: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Arancel Ético / Part. ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={form.valor_particular}
                    onChange={(e) => setForm({ ...form, valor_particular: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Coseguro Base ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={form.coseguro_defecto}
                    onChange={(e) => setForm({ ...form, coseguro_defecto: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 text-emerald-700"
                  />
                </div>
              </div>

              {/* Requisitos y Checkboxes */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="block font-bold text-slate-800">Requisitos para la prestación:</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.requiere_orden}
                      onChange={(e) => setForm({ ...form, requiere_orden: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Requiere Orden / Derivación</span>
                  </label>
                  <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.requiere_autorizacion}
                      onChange={(e) => setForm({ ...form, requiere_autorizacion: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Requiere Autorización Previa</span>
                  </label>
                </div>
              </div>

              {/* Instrucciones de Preparación */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Instrucciones de preparación / Encuadre</label>
                <textarea
                  rows="2"
                  placeholder="ej: Asistir 5 minutos antes. En sesiones online, contar con espacio privado y auriculares."
                  value={form.instrucciones_preparacion}
                  onChange={(e) => setForm({ ...form, instrucciones_preparacion: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
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
