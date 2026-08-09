import React, { useState } from 'react';
import { 
  FileText, 
  User, 
  Search, 
  Plus, 
  Printer, 
  Calendar, 
  Stethoscope, 
  AlertCircle, 
  Pill, 
  CheckCircle2, 
  ShieldCheck,
  Save,
  Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const HistoriaClinicaView = () => {
  const { pacientes, profesionales, atencionesHce, saveAtencionHce, clinica } = useApp();

  const [selectedPacienteId, setSelectedPacienteId] = useState(() => pacientes[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewEvolucion, setShowNewEvolucion] = useState(false);

  // Form de nueva atención
  const [evolucionForm, setEvolucionForm] = useState({
    profesional_id: profesionales[0]?.id || '',
    motivo_consulta: '',
    anamnesis_examen_fisico: '',
    diagnostico_cie10: 'I10 - Hipertensión esencial (primaria)',
    diagnostico_descripcion: '',
    plan_tratamiento: '',
    receta_indicaciones: '',
    estudios_solicitados: ''
  });

  const [selectedEvolucionToPrint, setSelectedEvolucionToPrint] = useState(null);

  const CIE10_LIST = [
    { code: 'I10', desc: 'Hipertensión esencial (primaria)' },
    { code: 'E11', desc: 'Diabetes mellitus tipo 2' },
    { code: 'J00', desc: 'Rinofaringitis aguda (resfriado común)' },
    { code: 'J20', desc: 'Bronquitis aguda' },
    { code: 'M54.5', desc: 'Lumbago no especificado' },
    { code: 'R07.4', desc: 'Dolor en el pecho, no especificado' },
    { code: 'K21', desc: 'Enfermedad por reflujo gastroesofágico' },
    { code: 'N39.0', desc: 'Infección de vías urinarias' },
    { code: 'F41.1', desc: 'Trastorno de ansiedad generalizada' },
    { code: 'Z00.0', desc: 'Examen médico general de rutina' }
  ];

  const selectedPaciente = pacientes.find(p => p.id === selectedPacienteId);
  const pacienteEvoluciones = atencionesHce.filter(a => a.paciente_id === selectedPacienteId);

  const handleSaveEvolucion = (e) => {
    e.preventDefault();
    if (!selectedPacienteId || !evolucionForm.motivo_consulta.trim()) return;

    saveAtencionHce({
      paciente_id: selectedPacienteId,
      ...evolucionForm,
      fecha_atencion: new Date().toISOString()
    });

    setShowNewEvolucion(false);
    setEvolucionForm({
      profesional_id: profesionales[0]?.id || '',
      motivo_consulta: '',
      anamnesis_examen_fisico: '',
      diagnostico_cie10: 'I10 - Hipertensión esencial (primaria)',
      diagnostico_descripcion: '',
      plan_tratamiento: '',
      receta_indicaciones: '',
      estudios_solicitados: ''
    });
  };

  const handlePrintRecipe = (evolucion) => {
    setSelectedEvolucionToPrint(evolucion);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const filteredPacientes = pacientes.filter(p => 
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.dni.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header HCE */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Historia Clínica Electrónica (HCE)
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
              CIE-10 & Recetario
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro de evoluciones médicas, antecedentes, diagnósticos codificados y emisión de recetas digitales.
          </p>
        </div>

        {selectedPaciente && (
          <button
            onClick={() => setShowNewEvolucion(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Evolución / Receta</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Columna Izquierda: Buscador y Lista de Pacientes */}
        <div className="lg:col-span-1 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar paciente por DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {filteredPacientes.map((p) => {
              const isSelected = p.id === selectedPacienteId;

              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPacienteId(p.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition flex items-center gap-3 ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold shadow-xs'
                      : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {p.nombre[0]}{p.apellido[0]}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-extrabold text-slate-900 truncate">
                      {p.apellido}, {p.nombre}
                    </p>
                    <span className="text-[11px] text-slate-500 font-mono">DNI: {p.dni}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha: Ficha del Paciente y Evoluciones */}
        <div className="lg:col-span-3 space-y-6">
          {selectedPaciente ? (
            <>
              {/* Tarjeta Ficha Resumen del Paciente */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      {selectedPaciente.nombre} {selectedPaciente.apellido}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span>DNI: <strong>{selectedPaciente.dni}</strong></span>
                      <span>•</span>
                      <span>Tel: <strong>{selectedPaciente.telefono_whatsapp}</strong></span>
                      <span>•</span>
                      <span>Email: <strong>{selectedPaciente.email || 'No registrado'}</strong></span>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 self-start">
                    Historia Clínica N° {selectedPaciente.dni}
                  </span>
                </div>

                {/* Antecedentes y Alergias */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl">
                    <span className="font-extrabold text-rose-900 block mb-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Alergias Conocidas
                    </span>
                    <p className="text-rose-800 font-medium">{selectedPaciente.alergias || 'Sin alergias registradas'}</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="font-extrabold text-slate-800 block mb-0.5">
                      Antecedentes Médicos / Patologías
                    </span>
                    <p className="text-slate-600">{selectedPaciente.antecedentes || 'Sin antecedentes relevantes'}</p>
                  </div>
                </div>
              </div>

              {/* Lista de Evoluciones Médicas Históricas */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>Evoluciones Clínicas Registradas ({pacienteEvoluciones.length})</span>
                </h3>

                {pacienteEvoluciones.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No hay evoluciones médicas cargadas aún para este paciente. Haz clic en "Nueva Evolución" para redactar la primera consulta.
                  </div>
                ) : (
                  pacienteEvoluciones.map((ev) => {
                    const prof = profesionales.find(p => p.id === ev.profesional_id);

                    return (
                      <div key={ev.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                              {new Date(ev.fecha_atencion).toLocaleDateString('es-AR')} {new Date(ev.fecha_atencion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                            </span>
                            <span className="text-xs font-black text-indigo-700">
                              Dr(a). {prof?.nombre} {prof?.apellido} ({prof?.especialidad})
                            </span>
                          </div>

                          {ev.receta_indicaciones && (
                            <button
                              onClick={() => handlePrintRecipe(ev)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Imprimir Receta</span>
                            </button>
                          )}
                        </div>

                        {/* Contenido de la consulta */}
                        <div className="space-y-2 text-xs text-slate-700">
                          <div>
                            <strong className="text-slate-900 block font-bold">Motivo de Consulta:</strong>
                            <p className="mt-0.5">{ev.motivo_consulta}</p>
                          </div>

                          {ev.anamnesis_examen_fisico && (
                            <div>
                              <strong className="text-slate-900 block font-bold">Examen Físico / Anamnesis:</strong>
                              <p className="mt-0.5">{ev.anamnesis_examen_fisico}</p>
                            </div>
                          )}

                          {ev.diagnostico_cie10 && (
                            <div className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                              <strong className="text-indigo-900 block font-bold">Diagnóstico (CIE-10):</strong>
                              <span className="font-mono text-indigo-800 font-bold">{ev.diagnostico_cie10}</span>
                              {ev.diagnostico_descripcion && <p className="mt-0.5">{ev.diagnostico_descripcion}</p>}
                            </div>
                          )}

                          {ev.receta_indicaciones && (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                              <strong className="text-slate-900 block font-bold flex items-center gap-1.5">
                                <Pill className="w-3.5 h-3.5 text-indigo-600" /> Prescripción & Receta Médica:
                              </strong>
                              <pre className="mt-1 font-sans whitespace-pre-wrap text-slate-800 text-xs font-medium">
                                {ev.receta_indicaciones}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              Seleccione un paciente de la lista para ver su historia clínica.
            </div>
          )}
        </div>
      </div>

      {/* MODAL NUEVA EVOLUCIÓN */}
      {showNewEvolucion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Nueva Evolución Médica / Receta</h3>
                <span className="text-xs text-indigo-600 font-bold">
                  Paciente: {selectedPaciente?.nombre} {selectedPaciente?.apellido} (DNI {selectedPaciente?.dni})
                </span>
              </div>
              <button onClick={() => setShowNewEvolucion(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvolucion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Médico Firmante *</label>
                <select
                  value={evolucionForm.profesional_id}
                  onChange={(e) => setEvolucionForm({ ...evolucionForm, profesional_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                >
                  {profesionales.map(p => (
                    <option key={p.id} value={p.id}>Dr(a). {p.nombre} {p.apellido} ({p.especialidad})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo de Consulta *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Control rutinario de presión arterial, cefalea..."
                  value={evolucionForm.motivo_consulta}
                  onChange={(e) => setEvolucionForm({ ...evolucionForm, motivo_consulta: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Anamnesis y Examen Físico</label>
                <textarea
                  rows="3"
                  placeholder="ej: TA: 120/80 mmHg, FC: 72 lpm. Abdomen blando, depresible, no doloroso..."
                  value={evolucionForm.anamnesis_examen_fisico}
                  onChange={(e) => setEvolucionForm({ ...evolucionForm, anamnesis_examen_fisico: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Diagnóstico Codificado (CIE-10) *</label>
                <select
                  value={evolucionForm.diagnostico_cie10}
                  onChange={(e) => setEvolucionForm({ ...evolucionForm, diagnostico_cie10: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                >
                  {CIE10_LIST.map(c => (
                    <option key={c.code} value={`${c.code} - ${c.desc}`}>{c.code} - {c.desc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prescripción / Receta Médica e Indicaciones</label>
                <textarea
                  rows="4"
                  placeholder="ej: Enalapril 10mg: 1 comprimido cada 12 hs por 30 días. Dieta hiposódica..."
                  value={evolucionForm.receta_indicaciones}
                  onChange={(e) => setEvolucionForm({ ...evolucionForm, receta_indicaciones: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewEvolucion(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
                >
                  Guardar en Historia Clínica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ÁREA IMPRIMIBLE PARA RECETAS */}
      {selectedEvolucionToPrint && (
        <div id="printable-area" className="hidden print:block p-8 text-black bg-white space-y-6">
          <div className="border-b-2 border-black pb-4 text-center">
            <h2 className="text-xl font-bold">{clinica.nombre}</h2>
            <p className="text-xs">{clinica.direccion} • Tel: {clinica.telefono}</p>
            <h3 className="text-sm font-bold mt-2 uppercase tracking-widest">RECETARIO MÉDICO OFICIAL</h3>
          </div>

          <div className="text-xs space-y-1">
            <p><strong>Paciente:</strong> {selectedPaciente?.nombre} {selectedPaciente?.apellido}</p>
            <p><strong>DNI:</strong> {selectedPaciente?.dni}</p>
            <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-AR')}</p>
            <p><strong>Diagnóstico:</strong> {selectedEvolucionToPrint.diagnostico_cie10}</p>
          </div>

          <div className="my-8 border border-black p-6 rounded-lg min-h-[250px]">
            <span className="font-bold text-sm block mb-3">Rp/</span>
            <pre className="font-mono text-sm whitespace-pre-wrap leading-relaxed">
              {selectedEvolucionToPrint.receta_indicaciones}
            </pre>
          </div>

          <div className="pt-16 flex justify-end text-center">
            <div className="border-t border-black w-60 pt-2 text-xs">
              <p className="font-bold">Firma y Sello del Profesional</p>
              <p>Centro Médico San Lucas</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
