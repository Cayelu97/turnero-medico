import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Download, 
  Upload,
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
  History,
  Home,
  HeartHandshake,
  Ambulance,
  MessageCircle,
  FileSpreadsheet,
  Check,
  UserCheck,
  UserPlus,
  Power
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ImportarPacientesModal } from './ImportarPacientesModal';

export const AbmPacientes = () => {
  const { 
    pacientes = [], 
    obrasSociales = [], 
    planes = [], 
    turnos = [], 
    profesionales = [], 
    nomenclador = [], 
    savePaciente, 
    deletePaciente,
    showToast 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOsFilter, setSelectedOsFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVOS'); // 'ACTIVOS' | 'INACTIVOS' | 'TODOS'
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState(null);
  const [historyModalPaciente, setHistoryModalPaciente] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState('DATOS'); // 'DATOS' | 'FAMILIA' | 'COBERTURA' | 'CLINICA'

  const [form, setForm] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    edad: '',
    fecha_nacimiento: '',
    genero: 'No especifica',
    telefono_whatsapp: '',
    email: '',
    domicilio: '',
    con_quien_vive: '',
    contactos_familiares: [],
    servicio_emergencia: { posee: false, nombre: '' },
    obra_social_id: '',
    plan_id: '',
    numero_afiliado: '',
    consentimiento_informado: { aceptado: true, fecha_firma: '' },
    marca_temporal_registro: '',
    alergias: '',
    antecedentes: '',
    medicacion_habitual: '',
    observaciones: '',
    activo: true
  });

  const handleOpenModal = (pac = null) => {
    setActiveFormTab('DATOS');
    if (pac) {
      setEditingPaciente(pac);
      setForm({
        ...pac,
        edad: pac.edad || '',
        fecha_nacimiento: pac.fecha_nacimiento || '',
        genero: pac.genero || 'No especifica',
        email: pac.email || '',
        domicilio: pac.domicilio || '',
        con_quien_vive: pac.con_quien_vive || '',
        contactos_familiares: Array.isArray(pac.contactos_familiares) ? [...pac.contactos_familiares] : [],
        servicio_emergencia: pac.servicio_emergencia ? { ...pac.servicio_emergencia } : { posee: false, nombre: '' },
        consentimiento_informado: pac.consentimiento_informado ? { ...pac.consentimiento_informado } : { aceptado: true, fecha_firma: '' },
        marca_temporal_registro: pac.marca_temporal_registro || '',
        alergias: pac.alergias || '',
        antecedentes: pac.antecedentes || '',
        medicacion_habitual: pac.medicacion_habitual || '',
        observaciones: pac.observaciones || '',
        plan_id: pac.plan_id || '',
        numero_afiliado: pac.numero_afiliado || '',
        activo: pac.activo !== false
      });
    } else {
      setEditingPaciente(null);
      setForm({
        dni: '',
        nombre: '',
        apellido: '',
        edad: '',
        fecha_nacimiento: '',
        genero: 'No especifica',
        telefono_whatsapp: '',
        email: '',
        domicilio: '',
        con_quien_vive: '',
        contactos_familiares: [
          { id: `fam-${Date.now()}`, nombre: '', relacion: 'Madre', telefono: '', es_principal: true, notas: '' }
        ],
        servicio_emergencia: { posee: false, nombre: '' },
        obra_social_id: obrasSociales[0]?.id || 'os-1',
        plan_id: '',
        numero_afiliado: '',
        consentimiento_informado: { aceptado: true, fecha_firma: new Date().toISOString() },
        marca_temporal_registro: new Date().toLocaleString('es-AR'),
        alergias: '',
        antecedentes: '',
        medicacion_habitual: '',
        observaciones: '',
        activo: true
      });
    }
    setShowModal(true);
  };

  // Manejo dinámico de contactos familiares
  const handleAddFamiliar = () => {
    setForm(prev => ({
      ...prev,
      contactos_familiares: [
        ...prev.contactos_familiares,
        {
          id: `fam-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          nombre: '',
          relacion: 'Familiar',
          telefono: '',
          es_principal: prev.contactos_familiares.length === 0,
          notas: ''
        }
      ]
    }));
  };

  const handleUpdateFamiliar = (idx, field, val) => {
    setForm(prev => {
      const updated = [...prev.contactos_familiares];
      if (field === 'es_principal' && val === true) {
        updated.forEach((f, i) => {
          f.es_principal = (i === idx);
        });
      } else {
        updated[idx] = { ...updated[idx], [field]: val };
      }
      return { ...prev, contactos_familiares: updated };
    });
  };

  const handleRemoveFamiliar = (idx) => {
    setForm(prev => ({
      ...prev,
      contactos_familiares: prev.contactos_familiares.filter((_, i) => i !== idx)
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.dni.trim() || !form.nombre.trim() || !form.apellido.trim()) {
      showToast('Por favor complete DNI, Nombre y Apellido.', 'error');
      return;
    }

    // Filtrar contactos familiares vacíos
    const cleanFamiliares = form.contactos_familiares.filter(f => f.nombre.trim() || f.telefono.trim());

    savePaciente({
      ...(editingPaciente ? { id: editingPaciente.id } : {}),
      ...form,
      dni: form.dni.replace(/\D/g, ''),
      contactos_familiares: cleanFamiliares
    });

    setShowModal(false);
    showToast(editingPaciente ? 'Ficha de paciente actualizada.' : 'Paciente registrado con éxito.');
  };

  // Eliminar paciente con protección de integridad médico-legal
  const handleDeletePacienteSafe = (pac) => {
    const cleanDni = String(pac.dni || '').replace(/\D/g, '');
    const turnosDelPac = turnos.filter(t => 
      t.paciente_id === pac.id || 
      (cleanDni && String(t.dni || t.paciente_dni || '').replace(/\D/g, '') === cleanDni)
    );

    if (turnosDelPac.length > 0) {
      if (confirm(`🔒 ACCIÓN BLOQUEADA POR SEGURIDAD CLÍNICA:\n\nEl paciente "${pac.nombre} ${pac.apellido}" registra ${turnosDelPac.length} turno(s) en su historial clínico.\n\nPara no alterar la trazabilidad médico-legal, no puede eliminarse definitivamente de la base de datos.\n\n¿Desea cambiar su estado a "INACTIVO" para ocultarlo de nuevas búsquedas y turneros?`)) {
        savePaciente({ ...pac, activo: false });
        showToast(`Paciente "${pac.nombre} ${pac.apellido}" marcado como INACTIVO.`);
      }
      return;
    }

    if (confirm(`¿Eliminar definitivamente al paciente "${pac.nombre} ${pac.apellido}" del padrón?`)) {
      const res = deletePaciente(pac.id);
      if (res && !res.success && res.error) {
        alert(res.error);
      }
    }
  };

  // Alternar estado activo / inactivo
  const handleToggleActivo = (pac) => {
    const nuevoEstado = pac.activo === false;
    savePaciente({ ...pac, activo: nuevoEstado });
    showToast(`Paciente "${pac.nombre} ${pac.apellido}" ${nuevoEstado ? 'activado' : 'desactivado'}.`);
  };

  // Filtrado de pacientes
  const filteredPacientes = pacientes.filter(p => {
    if (statusFilter === 'ACTIVOS' && p.activo === false) return false;
    if (statusFilter === 'INACTIVOS' && p.activo !== false) return false;
    if (selectedOsFilter && p.obra_social_id !== selectedOsFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = `${p.nombre} ${p.apellido}`.toLowerCase().includes(q);
      const matchDni = p.dni && p.dni.includes(q);
      const matchTel = p.telefono_whatsapp && p.telefono_whatsapp.includes(q);
      const matchEmail = p.email && p.email.toLowerCase().includes(q);
      const matchVive = p.con_quien_vive && p.con_quien_vive.toLowerCase().includes(q);
      const matchFam = Array.isArray(p.contactos_familiares) && p.contactos_familiares.some(f => 
        (f.nombre && f.nombre.toLowerCase().includes(q)) || (f.telefono && f.telefono.includes(q))
      );
      if (!matchName && !matchDni && !matchTel && !matchEmail && !matchVive && !matchFam) return false;
    }
    return true;
  });

  // Exportar a CSV
  const exportToCsv = () => {
    const headers = [
      'Marca Temporal',
      'DNI',
      'Apellido',
      'Nombre',
      'Edad',
      'Teléfono / WhatsApp',
      'Email',
      'Domicilio',
      'Con quién vive',
      'Contactos Familiares / Urgencias',
      'Servicio de Emergencias',
      'Obra Social',
      'Plan',
      'N° Afiliado',
      'Consentimiento Informado',
      'Alergias',
      'Antecedentes'
    ];

    const rows = filteredPacientes.map(p => {
      const os = obrasSociales.find(o => o.id === p.obra_social_id);
      const pl = planes.find(x => x.id === p.plan_id);
      const familiaresTexto = Array.isArray(p.contactos_familiares) 
        ? p.contactos_familiares.map(f => `${f.nombre} (${f.relacion}: ${f.telefono})`).join('; ')
        : '';
      const emergenciaTexto = p.servicio_emergencia?.posee ? p.servicio_emergencia.nombre : 'No posee';
      const consentimientoTexto = p.consentimiento_informado?.aceptado ? 'Aceptado' : 'Pendiente';

      return [
        `"${p.marca_temporal_registro || ''}"`,
        p.dni,
        `"${p.apellido}"`,
        `"${p.nombre}"`,
        p.edad || '',
        `"${p.telefono_whatsapp || ''}"`,
        `"${p.email || ''}"`,
        `"${p.domicilio || ''}"`,
        `"${p.con_quien_vive || ''}"`,
        `"${familiaresTexto}"`,
        `"${emergenciaTexto}"`,
        `"${os?.nombre || p.obra_social_nombre || 'Particular'}"`,
        `"${pl?.nombre_plan || ''}"`,
        `"${p.numero_afiliado || ''}"`,
        `"${consentimientoTexto}"`,
        `"${p.alergias || 'Ninguna'}"`,
        `"${p.antecedentes || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `padron_pacientes_psicologia_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Turnos históricos del paciente seleccionado
  const turnosDelPaciente = historyModalPaciente
    ? turnos.filter(t => t.paciente_id === historyModalPaciente.id || (t.dni && t.dni === historyModalPaciente.dni))
    : [];

  const handleOpenWhatsApp = (tel, nombre = '') => {
    if (!tel) return;
    const cleanTel = tel.replace(/\D/g, '');
    const fullTel = cleanTel.startsWith('54') ? cleanTel : `549${cleanTel}`;
    const url = `https://wa.me/${fullTel}?text=${encodeURIComponent(`Hola ${nombre}, nos comunicamos desde los Consultorios.`)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              Padrón General de Pacientes ({pacientes.length})
            </h2>
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-md text-[10px] font-black uppercase">
              Especial Psicología & Salud Mental
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black uppercase">
              Auto-Completado Activo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro con red de contactos familiares, convivientes, emergencias médicas y consentimiento informado.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* BOTÓN MIGRACIÓN / IMPORTACIÓN */}
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="Importar pacientes masivamente desde Google Forms o Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>Importar (Forms / Excel)</span>
          </button>

          <button
            onClick={exportToCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="Exportar padrón a Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-medical-600/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Paciente</span>
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Selector de Estado Activo/Inactivo */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVOS')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                statusFilter === 'ACTIVOS' 
                  ? 'bg-white text-emerald-700 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ✓ Activos ({pacientes.filter(p => p.activo !== false).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INACTIVOS')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                statusFilter === 'INACTIVOS' 
                  ? 'bg-white text-rose-700 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ⏸️ Inactivos ({pacientes.filter(p => p.activo === false).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('TODOS')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                statusFilter === 'TODOS' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos ({pacientes.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-1 justify-end">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por DNI, Nombre, Familiar, Tel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500 bg-slate-50"
            />
          </div>

          <select
            value={selectedOsFilter}
            onChange={(e) => setSelectedOsFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500 w-full sm:w-auto"
          >
            <option value="">Todas las Coberturas</option>
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
                <th className="px-4 py-3.5">Contacto Paciente</th>
                <th className="px-4 py-3.5">Contactos Familiares / Urgencias</th>
                <th className="px-4 py-3.5">Contexto Psicología & Emergencia</th>
                <th className="px-4 py-3.5">Obra Social & Plan</th>
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
                  const familiares = Array.isArray(pac.contactos_familiares) ? pac.contactos_familiares : [];

                  return (
                    <tr key={pac.id} className="hover:bg-slate-50/80 transition">
                      {/* Paciente, DNI y Edad */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-800 font-black text-xs">
                            {pac.nombre?.[0] || 'P'}{pac.apellido?.[0] || ''}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`font-extrabold block leading-tight ${pac.activo === false ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                {pac.apellido}, {pac.nombre}
                              </span>
                              {pac.activo === false && (
                                <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded text-[9px] font-black uppercase">
                                  Inactivo
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                              <span>DNI {pac.dni}</span>
                              {pac.edad && <span className="font-sans font-bold text-slate-700">• {pac.edad} años</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contacto Directo Paciente */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {pac.telefono_whatsapp && (
                            <button
                              onClick={() => handleOpenWhatsApp(pac.telefono_whatsapp, pac.nombre)}
                              className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline font-bold cursor-pointer"
                              title="Contactar al paciente por WhatsApp"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{pac.telefono_whatsapp}</span>
                            </button>
                          )}
                          {pac.email && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-[150px]">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {pac.email}
                            </span>
                          )}
                          {pac.domicilio && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[150px] block">
                              📍 {pac.domicilio}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contactos Familiares Múltiples */}
                      <td className="px-4 py-3">
                        {familiares.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">Sin familiares registrados</span>
                        ) : (
                          <div className="space-y-1">
                            {familiares.map((fam, fIdx) => (
                              <div key={fIdx} className="flex items-center gap-1.5 text-[11px]">
                                <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                                  fam.es_principal ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {fam.relacion || 'Familiar'}
                                </span>
                                <span className="text-slate-800 font-medium truncate max-w-[100px]">{fam.nombre}</span>
                                {fam.telefono && (
                                  <button
                                    onClick={() => handleOpenWhatsApp(fam.telefono, fam.nombre)}
                                    className="text-emerald-700 hover:text-emerald-900 font-mono font-bold flex items-center gap-0.5 cursor-pointer bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                                    title={`Llamar / WhatsApp a ${fam.nombre} (${fam.relacion})`}
                                  >
                                    <MessageCircle className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>{fam.telefono}</span>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Contexto Psicología: Con quién vive & Emergencia */}
                      <td className="px-4 py-3 max-w-[180px]">
                        <div className="space-y-1">
                          {pac.con_quien_vive && (
                            <span className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md inline-block font-semibold truncate max-w-[170px]" title={`Con quién vive: ${pac.con_quien_vive}`}>
                              🏠 {pac.con_quien_vive}
                            </span>
                          )}
                          {pac.servicio_emergencia?.posee ? (
                            <span className="text-[10px] text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-bold block truncate max-w-[170px]">
                              🚑 {pac.servicio_emergencia.nombre}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 block italic">Sin emerg. médica</span>
                          )}
                        </div>
                      </td>

                      {/* Obra Social y Plan */}
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {os?.sigla || os?.nombre || pac.obra_social_nombre || 'Particular / Privado'}
                          </span>
                          {plan && (
                            <span className="text-[11px] text-slate-500 block">
                              Plan: {plan.nombre_plan}
                            </span>
                          )}
                          {pac.numero_afiliado && (
                            <span className="font-mono text-[10px] text-slate-400 block">
                              N° {pac.numero_afiliado}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Historial */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setHistoryModalPaciente(pac)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <History className="w-3 h-3 text-medical-600" />
                          <span>{cantTurnos} turnos</span>
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleActivo(pac)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              pac.activo === false 
                                ? 'text-emerald-600 hover:bg-emerald-50' 
                                : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                            }`}
                            title={pac.activo === false ? 'Reactivar paciente' : 'Desactivar paciente (ocultar de turneros)'}
                          >
                            {pac.activo === false ? <CheckCircle2 className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleOpenModal(pac)}
                            className="p-1.5 text-slate-400 hover:text-medical-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Editar Ficha de Paciente"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePacienteSafe(pac)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Eliminar Paciente definitivamente"
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
      {/* MODAL ALTA / EDICIÓN DE PACIENTE (CON TABS Y CONTEXTO PSICOLÓGICO) */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 my-auto overflow-hidden animate-scaleIn">
            
            {/* HEADER STICKY */}
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 text-purple-700 rounded-2xl border border-purple-200">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                    {editingPaciente ? `Ficha Clínica: ${editingPaciente.nombre} ${editingPaciente.apellido}` : 'Alta de Paciente en Padrón'}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Registro integral para atención en psicología, salud mental y consultorios.
                  </span>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="px-6 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0 py-2">
              <button
                type="button"
                onClick={() => setActiveFormTab('DATOS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeFormTab === 'DATOS' ? 'bg-white text-medical-700 shadow-2xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>👤 1. Datos Personales</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('FAMILIA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeFormTab === 'FAMILIA' ? 'bg-white text-purple-700 shadow-2xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>👥 2. Familia & Convivientes ({form.contactos_familiares.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('COBERTURA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeFormTab === 'COBERTURA' ? 'bg-white text-sky-700 shadow-2xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🚑 3. Cobertura & Emergencias</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('CLINICA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeFormTab === 'CLINICA' ? 'bg-white text-emerald-700 shadow-2xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📋 4. Consentimiento & Clínica</span>
              </button>
            </div>

            {/* FORM BODY SCROLLABLE */}
            <form id="form-paciente-abm" onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-5">
              
              {/* TAB 1: DATOS PERSONALES */}
              {activeFormTab === 'DATOS' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">DNI / Documento *</label>
                      <input
                        type="text"
                        required
                        placeholder="ej: 35890123"
                        value={form.dni}
                        onChange={(e) => setForm({ ...form, dni: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-medical-500 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Apellido(s) *</label>
                      <input
                        type="text"
                        required
                        placeholder="ej: Gómez Rossi"
                        value={form.apellido}
                        onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nombre(s) *</label>
                      <input
                        type="text"
                        required
                        placeholder="ej: Lucas Martín"
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Edad Actual</label>
                      <input
                        type="number"
                        placeholder="ej: 28"
                        value={form.edad}
                        onChange={(e) => setForm({ ...form, edad: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Celular / WhatsApp *</label>
                      <input
                        type="text"
                        required
                        placeholder="ej: +54 9 351 550-1122"
                        value={form.telefono_whatsapp}
                        onChange={(e) => setForm({ ...form, telefono_whatsapp: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="ej: paciente@email.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Domicilio donde reside actualmente</label>
                      <input
                        type="text"
                        placeholder="ej: Bv. Chacabuco 820 Piso 4, Córdoba"
                        value={form.domicilio}
                        onChange={(e) => setForm({ ...form, domicilio: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        value={form.fecha_nacimiento}
                        onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTEXTO FAMILIAR Y CONVIVIENTES (PSICOLOGÍA) */}
              {activeFormTab === 'FAMILIA' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Con quién vive */}
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
                    <label className="block text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                      <Home className="w-4 h-4 text-amber-700" />
                      ¿Con quién vive actualmente? (Contexto Habitacional y Convivencia)
                    </label>
                    <input
                      type="text"
                      placeholder="ej: Vive con sus padres y hermana menor / Vive solo/a / Con su pareja e hijos..."
                      value={form.con_quien_vive}
                      onChange={(e) => setForm({ ...form, con_quien_vive: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-amber-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[11px] text-amber-800">
                      Dato fundamental en psicología y salud mental para conocer la red de contención inmediata.
                    </p>
                  </div>

                  {/* Contactos Familiares y Urgencias */}
                  <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                          <HeartHandshake className="w-4 h-4 text-purple-700" />
                          Red de Contactos Familiares / Referentes de Urgencia
                        </span>
                        <p className="text-[11px] text-purple-800">
                          Personas a contactar en caso de ser necesario (padres, tutores, pareja, terapeutas).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddFamiliar}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Agregar Familiar</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {form.contactos_familiares.length === 0 ? (
                        <div className="text-center py-6 bg-white border border-purple-100 rounded-xl text-slate-400 text-xs">
                          No hay contactos familiares agregados. Haz clic en <strong>+ Agregar Familiar</strong>.
                        </div>
                      ) : (
                        form.contactos_familiares.map((fam, idx) => (
                          <div key={fam.id || idx} className="p-3 bg-white border border-purple-200/80 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center shadow-2xs">
                            {/* Nombre del Familiar */}
                            <div className="sm:col-span-4">
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nombre Completo</label>
                              <input
                                type="text"
                                placeholder="ej: Beatriz Rossi"
                                value={fam.nombre}
                                onChange={(e) => handleUpdateFamiliar(idx, 'nombre', e.target.value)}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50"
                              />
                            </div>

                            {/* Vínculo / Relación */}
                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Vínculo / Parentesco</label>
                              <select
                                value={fam.relacion}
                                onChange={(e) => handleUpdateFamiliar(idx, 'relacion', e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50"
                              >
                                <option value="Madre">Madre</option>
                                <option value="Padre">Padre</option>
                                <option value="Pareja">Pareja / Cónyuge</option>
                                <option value="Tutor/a">Tutor / Representante Legal</option>
                                <option value="Hermano/a">Hermano/a</option>
                                <option value="Hijo/a">Hijo/a</option>
                                <option value="Tío/a">Tío/a</option>
                                <option value="Abuelo/a">Abuelo/a</option>
                                <option value="Amigo/a de confianza">Amigo/a de confianza</option>
                                <option value="Profesional tratante">Psiquiatra / Médico tratante</option>
                                <option value="Otro">Otro vínculo</option>
                              </select>
                            </div>

                            {/* Celular / WhatsApp */}
                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Celular / WhatsApp</label>
                              <input
                                type="text"
                                placeholder="ej: 351 441-2233"
                                value={fam.telefono}
                                onChange={(e) => handleUpdateFamiliar(idx, 'telefono', e.target.value)}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-slate-50 text-emerald-800"
                              />
                            </div>

                            {/* Acciones */}
                            <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2 sm:pt-0">
                              <label className="flex items-center gap-1 text-[10px] font-bold text-purple-900 cursor-pointer" title="Marcar como contacto de emergencia principal">
                                <input
                                  type="checkbox"
                                  checked={Boolean(fam.es_principal)}
                                  onChange={(e) => handleUpdateFamiliar(idx, 'es_principal', e.target.checked)}
                                  className="w-3.5 h-3.5 text-purple-600 rounded"
                                />
                                <span>Principal</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => handleRemoveFamiliar(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                title="Eliminar este contacto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: COBERTURA Y EMERGENCIAS */}
              {activeFormTab === 'COBERTURA' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Servicio de Emergencias */}
                  <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3">
                    <span className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                      <Ambulance className="w-4 h-4 text-rose-700" />
                      Servicio de Emergencia Médica (Ambulancia / Urgencias Domiciliarias)
                    </span>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.servicio_emergencia.posee}
                          onChange={(e) => setForm({
                            ...form,
                            servicio_emergencia: {
                              ...form.servicio_emergencia,
                              posee: e.target.checked,
                              nombre: e.target.checked ? (form.servicio_emergencia.nombre || 'ECCO Emergencias') : 'No posee'
                            }
                          })}
                          className="w-4 h-4 text-rose-600 rounded"
                        />
                        <span>Posee servicio de emergencia médica activo</span>
                      </label>
                    </div>

                    {form.servicio_emergencia.posee && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          ¿Cuál es la empresa o servicio de emergencia?
                        </label>
                        <input
                          type="text"
                          placeholder="ej: ECCO Emergencias / Vittal / AMI / Paravachasca..."
                          value={form.servicio_emergencia.nombre}
                          onChange={(e) => setForm({
                            ...form,
                            servicio_emergencia: { ...form.servicio_emergencia, nombre: e.target.value }
                          })}
                          className="w-full px-3.5 py-2 border border-rose-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Cobertura Médica */}
                  <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-2xl space-y-3">
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
                </div>
              )}

              {/* TAB 4: CONSENTIMIENTO Y CLÍNICA */}
              {activeFormTab === 'CLINICA' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Consentimiento Informado */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                    <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Consentimiento Informado y Registro
                    </span>
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.consentimiento_informado?.aceptado}
                        onChange={(e) => setForm({
                          ...form,
                          consentimiento_informado: {
                            ...form.consentimiento_informado,
                            aceptado: e.target.checked,
                            fecha_firma: e.target.checked ? new Date().toISOString() : ''
                          }
                        })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span>Aceptó los términos y condiciones del Consentimiento Informado</span>
                    </label>
                    {form.marca_temporal_registro && (
                      <p className="text-[11px] text-slate-500 font-mono">
                        Marca Temporal Original: <strong>{form.marca_temporal_registro}</strong>
                      </p>
                    )}
                  </div>

                  {/* Alertas Médicas / Antecedentes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Alergias Conocidas</label>
                      <input
                        type="text"
                        placeholder="ej: Penicilina, Látex, Ninguna..."
                        value={form.alergias}
                        onChange={(e) => setForm({ ...form, alergias: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Antecedentes Clínicos / Psicológicos</label>
                      <input
                        type="text"
                        placeholder="ej: Trastorno de ansiedad, hipotiroidismo..."
                        value={form.antecedentes}
                        onChange={(e) => setForm({ ...form, antecedentes: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Medicación Habitual</label>
                    <input
                      type="text"
                      placeholder="ej: Sertralina 50mg, Clonazepam 0.5mg..."
                      value={form.medicacion_habitual}
                      onChange={(e) => setForm({ ...form, medicacion_habitual: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500 bg-slate-50"
                    />
                  </div>
                </div>
              )}

            </form>

            {/* FOOTER STICKY */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {activeFormTab !== 'DATOS' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeFormTab === 'CLINICA') setActiveFormTab('COBERTURA');
                      else if (activeFormTab === 'COBERTURA') setActiveFormTab('FAMILIA');
                      else if (activeFormTab === 'FAMILIA') setActiveFormTab('DATOS');
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                  >
                    Anterior
                  </button>
                )}
                {activeFormTab !== 'CLINICA' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeFormTab === 'DATOS') setActiveFormTab('FAMILIA');
                      else if (activeFormTab === 'FAMILIA') setActiveFormTab('COBERTURA');
                      else if (activeFormTab === 'COBERTURA') setActiveFormTab('CLINICA');
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                  >
                    Siguiente pestaña →
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="form-paciente-abm"
                  className="px-5 py-2 text-xs font-black bg-medical-600 hover:bg-medical-700 text-white rounded-xl shadow-md shadow-medical-600/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingPaciente ? 'Guardar Ficha' : 'Registrar en Padrón'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL HISTORIAL DE TURNOS Y FICHA DETALLADA DEL PACIENTE */}
      {/* ========================================================================= */}
      {historyModalPaciente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col p-6 shadow-2xl border border-slate-100 my-auto overflow-hidden animate-scaleIn">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-black">
                  {historyModalPaciente.nombre?.[0]}{historyModalPaciente.apellido?.[0]}
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                    Ficha & Historial: {historyModalPaciente.nombre} {historyModalPaciente.apellido}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>DNI {historyModalPaciente.dni}</span>
                    {historyModalPaciente.edad && <span className="font-sans font-bold text-slate-700">• {historyModalPaciente.edad} años</span>}
                    {historyModalPaciente.con_quien_vive && (
                      <span className="font-sans font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        🏠 {historyModalPaciente.con_quien_vive}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setHistoryModalPaciente(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Scrollable */}
            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              
              {/* Contactos Familiares */}
              {Array.isArray(historyModalPaciente.contactos_familiares) && historyModalPaciente.contactos_familiares.length > 0 && (
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                  <span className="text-xs font-black text-purple-950 block">
                    👥 Red de Contactos Familiares / Referentes:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {historyModalPaciente.contactos_familiares.map((fam, i) => (
                      <div key={i} className="p-2.5 bg-white border border-purple-200 rounded-xl text-xs flex items-center justify-between gap-2 shadow-2xs">
                        <div>
                          <strong className="text-slate-900 block">{fam.nombre}</strong>
                          <span className="text-[11px] text-purple-800 font-bold">{fam.relacion} {fam.es_principal && '• (Principal)'}</span>
                        </div>
                        {fam.telefono && (
                          <button
                            onClick={() => handleOpenWhatsApp(fam.telefono, fam.nombre)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition shadow-2xs cursor-pointer"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>{fam.telefono}</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Turnos Históricos */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                  Historial de Citas y Turnos ({turnosDelPaciente.length}):
                </span>

                {turnosDelPaciente.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-2xl">
                    Este paciente aún no registra turnos en el sistema.
                  </div>
                ) : (
                  turnosDelPaciente.map(t => {
                    const prof = profesionales.find(p => p.id === t.profesional_id);
                    const practica = nomenclador.find(p => p.id === t.practica_id);

                    return (
                      <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
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
                            {practica?.descripcion || 'Consulta en Consultorio'}
                          </p>
                        </div>
                        <div className="text-right font-mono font-bold text-slate-700">
                          {t.monto_coseguro > 0 ? `$${t.monto_coseguro.toLocaleString('es-AR')}` : 'Sin Coseguro'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setHistoryModalPaciente(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL IMPORTACIÓN / MIGRACIÓN MASIVA DESDE GOOGLE FORMS / EXCEL */}
      {/* ========================================================================= */}
      <ImportarPacientesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={() => {
          // Callback al importar con éxito
        }}
      />
    </div>
  );
};
