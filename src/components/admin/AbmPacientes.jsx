import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Download, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Calendar, 
  HeartPulse, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Clock,
  Activity,
  History
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AbmPacientes = () => {
  const { 
    pacientes = [], 
    obrasSociales = [], 
    planes = [], 
    turnos = [], 
    profesionales = [], 
    nomenclador = [], 
    savePaciente, 
    deletePaciente 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOsFilter, setSelectedOsFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState(null);
  const [historyModalPaciente, setHistoryModalPaciente] = useState(null);

  const [form, setForm] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    genero: 'No especifica',
    telefono_whatsapp: '',
    email: '',
    obra_social_id: '',
    plan_id: '',
    numero_afiliado: '',
    domicilio: '',
    alergias: '',
    antecedentes: '',
    medicacion_habitual: '',
    observaciones: '',
    activo: true
  });

  const handleOpenModal = (pac = null) => {
    if (pac) {
      setEditingPaciente(pac);
      setForm({
        ...pac,
        fecha_nacimiento: pac.fecha_nacimiento || '',
        genero: pac.genero || 'No especifica',
        email: pac.email || '',
        domicilio: pac.domicilio || '',
        alergias: pac.alergias || '',
        antecedentes: pac.antecedentes || '',
        medicacion_habitual: pac.medicacion_habitual || '',
        observaciones: pac.observaciones || '',
        plan_id: pac.plan_id || '',
        numero_afiliado: pac.numero_afiliado || ''
      });
    } else {
      setEditingPaciente(null);
      setForm({
        dni: '',
        nombre: '',
        apellido: '',
        fecha_nacimiento: '',
        genero: 'No especifica',
        telefono_whatsapp: '',
        email: '',
        obra_social_id: obrasSociales[0]?.id || '',
        plan_id: '',
        numero_afiliado: '',
        domicilio: '',
        alergias: '',
        antecedentes: '',
        medicacion_habitual: '',
        observaciones: '',
        activo: true
      });
    }
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.dni.trim() || !form.nombre.trim() || !form.apellido.trim()) return;

    savePaciente({
      ...(editingPaciente ? { id: editingPaciente.id } : {}),
      ...form,
      dni: form.dni.replace(/\D/g, '')
    });
    setShowModal(false);
  };

  // Filtrado de pacientes
  const filteredPacientes = pacientes.filter(p => {
    if (selectedOsFilter && p.obra_social_id !== selectedOsFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = `${p.nombre} ${p.apellido}`.toLowerCase().includes(q);
      const matchDni = p.dni && p.dni.includes(q);
      const matchTel = p.telefono_whatsapp && p.telefono_whatsapp.includes(q);
      const matchEmail = p.email && p.email.toLowerCase().includes(q);
      if (!matchName && !matchDni && !matchTel && !matchEmail) return false;
    }
    return true;
  });

  // Exportar a CSV
  const exportToCsv = () => {
    const headers = ['DNI', 'Apellido', 'Nombre', 'Teléfono / WhatsApp', 'Email', 'Obra Social', 'Plan', 'N° Afiliado', 'Alergias', 'Antecedentes'];
    const rows = filteredPacientes.map(p => {
      const os = obrasSociales.find(o => o.id === p.obra_social_id);
      const pl = planes.find(x => x.id === p.plan_id);
      return [
        p.dni,
        `"${p.apellido}"`,
        `"${p.nombre}"`,
        `"${p.telefono_whatsapp || ''}"`,
        `"${p.email || ''}"`,
        `"${os?.nombre || 'Particular'}"`,
        `"${pl?.nombre_plan || ''}"`,
        `"${p.numero_afiliado || ''}"`,
        `"${p.alergias || 'Ninguna'}"`,
        `"${p.antecedentes || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `padron_pacientes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Turnos históricos del paciente seleccionado
  const turnosDelPaciente = historyModalPaciente
    ? turnos.filter(t => t.paciente_id === historyModalPaciente.id || (t.dni && t.dni === historyModalPaciente.dni))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900">
              Padrón General de Pacientes ({pacientes.length})
            </h2>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black uppercase">
              Auto-Completado Activo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro centralizado de pacientes. Al escribir el DNI en cualquier pantalla, el sistema completa automáticamente sus datos y cobertura.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs"
            title="Exportar padrón a Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-medical-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Paciente</span>
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por DNI, Nombre, Teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedOsFilter}
            onChange={(e) => setSelectedOsFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500 w-full sm:w-auto"
          >
            <option value="">Todas las Coberturas ({obrasSociales.length})</option>
            {obrasSociales.map(os => (
              <option key={os.id} value={os.id}>{os.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLA DE PACIENTES */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Paciente / DNI</th>
                <th className="px-4 py-3.5">Contacto (WhatsApp / Email)</th>
                <th className="px-4 py-3.5">Obra Social & Plan</th>
                <th className="px-4 py-3.5">N° Afiliado</th>
                <th className="px-4 py-3.5">Alertas Médicas</th>
                <th className="px-4 py-3.5 text-center">Historial</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {filteredPacientes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No se encontraron pacientes en el padrón con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredPacientes.map((pac) => {
                  const os = obrasSociales.find(o => o.id === pac.obra_social_id);
                  const plan = planes.find(p => p.id === pac.plan_id);
                  const cantTurnos = turnos.filter(t => t.paciente_id === pac.id || (t.dni && t.dni === pac.dni)).length;

                  return (
                    <tr key={pac.id} className="hover:bg-slate-50/80 transition">
                      {/* Paciente y DNI */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-medical-50 border border-medical-200 flex items-center justify-center text-medical-800 font-black text-xs">
                            {pac.nombre?.[0] || 'P'}{pac.apellido?.[0] || ''}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block leading-tight">
                              {pac.apellido}, {pac.nombre}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500">
                              DNI {pac.dni}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {pac.telefono_whatsapp && (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              {pac.telefono_whatsapp}
                            </span>
                          )}
                          {pac.email && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {pac.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Obra Social y Plan */}
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {os?.sigla || os?.nombre || 'Particular / Privado'}
                          </span>
                          {plan && (
                            <span className="text-[11px] text-slate-500 block">
                              Plan: {plan.nombre_plan}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* N° Afiliado */}
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {pac.numero_afiliado || <span className="text-slate-400 italic">Sin cargar</span>}
                      </td>

                      {/* Alertas Médicas */}
                      <td className="px-4 py-3">
                        {pac.alergias && pac.alergias !== 'Ninguna' && pac.alergias !== 'Ninguna conocida' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            Alergia: {pac.alergias}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Sin alertas</span>
                        )}
                      </td>

                      {/* Historial */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setHistoryModalPaciente(pac)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1"
                        >
                          <History className="w-3 h-3 text-medical-600" />
                          <span>{cantTurnos} turnos</span>
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenModal(pac)}
                            className="p-1.5 text-slate-400 hover:text-medical-600 hover:bg-slate-100 rounded-lg transition"
                            title="Editar Paciente"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar paciente "${pac.nombre} ${pac.apellido}" del padrón?`)) {
                                deletePaciente(pac.id);
                              }
                            }}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar Paciente"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* ========================================================================= */}
      {/* MODAL ALTA / EDICIÓN DE PACIENTE */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {editingPaciente ? 'Editar Ficha del Paciente' : 'Alta de Paciente en Padrón'}
                </h3>
                <span className="text-xs text-slate-500">
                  Los datos quedarán guardados y se autocompletarán al ingresar el DNI.
                </span>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Bloque 1: Identificación */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">DNI / Documento *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: 35890123"
                    value={form.dni}
                    onChange={(e) => setForm({ ...form, dni: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-medical-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Gómez"
                    value={form.apellido}
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Carlos Alberto"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500"
                  />
                </div>
              </div>

              {/* Bloque 2: Contacto y Datos Personales */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Celular / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: +54 9 11 5500-1122"
                    value={form.telefono_whatsapp}
                    onChange={(e) => setForm({ ...form, telefono_whatsapp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="ej: paciente@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={form.fecha_nacimiento}
                    onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              {/* Bloque 3: Cobertura Médica */}
              <div className="p-3.5 bg-sky-50/60 border border-sky-200 rounded-2xl space-y-3">
                <span className="text-xs font-black text-sky-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  Cobertura Médica & Obra Social
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Obra Social / Financiador</label>
                    <select
                      value={form.obra_social_id}
                      onChange={(e) => setForm({ ...form, obra_social_id: e.target.value, plan_id: '' })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                    >
                      {obrasSociales.map(os => (
                        <option key={os.id} value={os.id}>{os.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Plan</label>
                    <select
                      value={form.plan_id}
                      onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500"
                    >
                      <option value="">-- Sin plan específico --</option>
                      {planes
                        .filter(pl => !form.obra_social_id || pl.obra_social_id === form.obra_social_id)
                        .map(pl => (
                          <option key={pl.id} value={pl.id}>{pl.nombre_plan}</option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">N° de Afiliado / Credencial</label>
                    <input
                      type="text"
                      placeholder="ej: 1098492019/01"
                      value={form.numero_afiliado}
                      onChange={(e) => setForm({ ...form, numero_afiliado: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono bg-white focus:ring-2 focus:ring-medical-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 4: Alertas Clínicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alergias Conocidas</label>
                  <input
                    type="text"
                    placeholder="ej: Penicilina, Sulfas, Látex..."
                    value={form.alergias}
                    onChange={(e) => setForm({ ...form, alergias: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Antecedentes Médicos / Patologías</label>
                  <input
                    type="text"
                    placeholder="ej: Hipertensión, Diabetes Tipo 2..."
                    value={form.antecedentes}
                    onChange={(e) => setForm({ ...form, antecedentes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medicación Habitual</label>
                <input
                  type="text"
                  placeholder="ej: Losartán 50mg, Levotiroxina 75mcg..."
                  value={form.medicacion_habitual}
                  onChange={(e) => setForm({ ...form, medicacion_habitual: e.target.value })}
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
                  {editingPaciente ? 'Guardar Cambios' : 'Registrar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL HISTORIAL DE TURNOS DEL PACIENTE */}
      {/* ========================================================================= */}
      {historyModalPaciente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-medical-100 text-medical-800 flex items-center justify-center font-black">
                  {historyModalPaciente.nombre?.[0]}{historyModalPaciente.apellido?.[0]}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Historial Clínico de {historyModalPaciente.nombre} {historyModalPaciente.apellido}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">DNI {historyModalPaciente.dni}</span>
                </div>
              </div>
              <button onClick={() => setHistoryModalPaciente(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {turnosDelPaciente.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Este paciente aún no registra turnos en el sistema.
                </div>
              ) : (
                turnosDelPaciente.map(t => {
                  const prof = profesionales.find(p => p.id === t.profesional_id);
                  const practica = nomenclador.find(p => p.id === t.practica_id);

                  return (
                    <div key={t.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{t.fecha} • {t.hora_inicio} hs</span>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">
                            {t.estado}
                          </span>
                        </div>
                        <p className="font-extrabold text-slate-800 mt-1">
                          Dr(a). {prof?.nombre} {prof?.apellido} ({prof?.especialidad})
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {practica?.descripcion || 'Consulta Médica'}
                        </p>
                        {t.observaciones && (
                          <p className="text-[11px] text-slate-600 italic mt-0.5">
                            Obs: {t.observaciones}
                          </p>
                        )}
                      </div>
                      <div className="text-right font-mono font-bold text-slate-700">
                        {t.monto_coseguro > 0 ? `$${t.monto_coseguro.toLocaleString('es-AR')}` : 'Sin Coseguro'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setHistoryModalPaciente(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl"
              >
                Cerrar Historial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
