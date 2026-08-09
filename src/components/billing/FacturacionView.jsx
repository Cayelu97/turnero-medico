import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  DollarSign, 
  Printer, 
  Download, 
  UserCheck, 
  ShieldCheck, 
  Calendar, 
  FileSpreadsheet, 
  Filter, 
  CheckCircle2, 
  Building, 
  FileText, 
  Search, 
  TrendingUp, 
  CreditCard, 
  Stethoscope, 
  ChevronRight, 
  Layers, 
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FacturacionView = () => {
  const { 
    turnos, 
    profesionales, 
    obrasSociales, 
    planes, 
    nomenclador, 
    pacientes, 
    allClinicas, 
    activeClinica,
    updateTurnoEstado 
  } = useApp();

  // Filtros principales
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [fechaDesde, setFechaDesde] = useState(firstDayOfMonth);
  const [fechaHasta, setFechaHasta] = useState(lastDayOfMonth);
  const [selectedOsId, setSelectedOsId] = useState('');
  const [selectedProfId, setSelectedProfId] = useState('');
  const [selectedClinicaId, setSelectedClinicaId] = useState('TODAS');
  const [selectedEstadoTurno, setSelectedEstadoTurno] = useState('VALIDOS'); // 'VALIDOS' | 'TODOS' | 'ATENDIDO'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('master'); // 'master' | 'por_medico' | 'por_pmo'

  // Accesos rápidos de rango de fechas
  const handleSetRango = (tipo) => {
    const now = new Date();
    if (tipo === 'este_mes') {
      setFechaDesde(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setFechaHasta(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
    } else if (tipo === 'mes_anterior') {
      setFechaDesde(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]);
      setFechaHasta(new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]);
    } else if (tipo === 'quincena_1') {
      setFechaDesde(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setFechaHasta(new Date(now.getFullYear(), now.getMonth(), 15).toISOString().split('T')[0]);
    } else if (tipo === 'quincena_2') {
      setFechaDesde(new Date(now.getFullYear(), now.getMonth(), 16).toISOString().split('T')[0]);
      setFechaHasta(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
    } else if (tipo === 'todos') {
      setFechaDesde('2020-01-01');
      setFechaHasta('2030-12-31');
    }
  };

  // Filtrado y cálculo valorizado del Master de Facturación
  const masterData = useMemo(() => {
    return turnos.filter(t => {
      // Filtro de Fechas
      if (t.fecha < fechaDesde || t.fecha > fechaHasta) return false;

      // Filtro de Estado
      if (selectedEstadoTurno === 'VALIDOS' && (t.estado === 'CANCELADO' || t.estado === 'NO_ASISTIO')) return false;
      if (selectedEstadoTurno === 'ATENDIDO' && t.estado !== 'ATENDIDO') return false;

      // Filtro de Obra Social
      if (selectedOsId && t.obra_social_id !== selectedOsId) return false;

      // Filtro de Profesional
      if (selectedProfId && t.profesional_id !== selectedProfId) return false;

      // Filtro de Clínica / Sede
      if (selectedClinicaId !== 'TODAS' && t.clinica_id && t.clinica_id !== selectedClinicaId) return false;

      // Buscador
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pac = pacientes.find(p => p.id === t.paciente_id);
        const matchPac = pac && (`${pac.nombre} ${pac.apellido}`.toLowerCase().includes(q) || pac.dni.includes(q));
        const matchCode = t.codigo_reserva && t.codigo_reserva.toLowerCase().includes(q);
        const matchBono = t.numero_bono && t.numero_bono.toLowerCase().includes(q);
        if (!matchPac && !matchCode && !matchBono) return false;
      }

      return true;
    }).map((t, index) => {
      const pac = pacientes.find(p => p.id === t.paciente_id);
      const prof = profesionales.find(p => p.id === t.profesional_id);
      const os = obrasSociales.find(o => o.id === t.obra_social_id);
      const plan = planes.find(p => p.id === t.plan_id);
      const practica = nomenclador.find(p => p.id === t.practica_id);
      const clin = allClinicas.find(c => c.id === t.clinica_id) || activeClinica;

      // Cálculo de Aranceles
      const esParticular = !os || os.sigla === 'PART';
      const valorParticularPractica = Number(practica?.valor_particular || 18000);
      const coseguroCobrado = Number(t.monto_coseguro || 0);

      // Si es Particular, el arancel de la OS es 0 y el total se cobró al paciente.
      // Si es Obra Social, la OS cubre el arancel menos el coseguro o arancel neto.
      const arancelObraSocial = esParticular ? 0 : Math.max(0, valorParticularPractica - coseguroCobrado);
      const totalLiquidacionPrestacion = esParticular ? coseguroCobrado || valorParticularPractica : arancelObraSocial + coseguroCobrado;

      // Honorario profesional (80% para el médico, 20% retención clínica)
      const retencionClinica = totalLiquidacionPrestacion * 0.20;
      const honorarioNetoMedico = totalLiquidacionPrestacion * 0.80;

      return {
        id: t.id,
        index: index + 1,
        turno: t,
        fecha: t.fecha,
        hora: t.hora_inicio,
        codigo_reserva: t.codigo_reserva,
        numero_bono: t.numero_bono || `AUT-${t.codigo_reserva.replace('TRN-', '')}`,
        numero_afiliado: t.numero_afiliado || pac?.numero_afiliado || 'S/D',
        pacienteNombre: pac ? `${pac.apellido}, ${pac.nombre}` : 'Paciente',
        pacienteDni: pac?.dni || 'S/D',
        profesionalNombre: prof ? `Dr(a). ${prof.apellido}` : 'Profesional',
        profesionalMatricula: prof?.matricula_nacional || prof?.matricula_provincial || 'MN S/D',
        profesionalEspecialidad: prof?.especialidad || 'Especialidad',
        obraSocialNombre: os?.nombre || 'Particular / Privado',
        obraSocialSigla: os?.sigla || 'PART',
        planNombre: plan?.nombre_plan || 'Estándar',
        practicaCodigo: practica?.codigo_pmo || '42.01.01',
        practicaDescripcion: practica?.descripcion || 'Consulta Médica Especializada',
        clinicaNombre: clin?.nombre || 'Centro Médico',
        estadoTurno: t.estado,
        estadoCoseguro: t.estado_coseguro || 'COBRADO',
        arancelObraSocial,
        coseguroCobrado,
        totalLiquidacionPrestacion,
        honorarioNetoMedico,
        retencionClinica
      };
    });
  }, [turnos, fechaDesde, fechaHasta, selectedOsId, selectedProfId, selectedClinicaId, selectedEstadoTurno, searchQuery, pacientes, profesionales, obrasSociales, planes, nomenclador, allClinicas, activeClinica]);

  // Totales Globales
  const totalRegistros = masterData.length;
  const totalFacturadoOS = masterData.reduce((acc, r) => acc + r.arancelObraSocial, 0);
  const totalCosegurosCaja = masterData.reduce((acc, r) => acc + r.coseguroCobrado, 0);
  const totalGlobalValorizado = masterData.reduce((acc, r) => acc + r.totalLiquidacionPrestacion, 0);
  const totalNetoMedicos = masterData.reduce((acc, r) => acc + r.honorarioNetoMedico, 0);
  const totalRetencionClinica = masterData.reduce((acc, r) => acc + r.retencionClinica, 0);

  // Resumen Agrupado por Obra Social
  const resumenPorOS = useMemo(() => {
    const grouped = {};
    masterData.forEach(r => {
      const key = r.obraSocialNombre;
      if (!grouped[key]) {
        grouped[key] = {
          nombre: r.obraSocialNombre,
          sigla: r.obraSocialSigla,
          cantPrestaciones: 0,
          totalOS: 0,
          totalCoseguros: 0,
          totalGeneral: 0
        };
      }
      grouped[key].cantPrestaciones += 1;
      grouped[key].totalOS += r.arancelObraSocial;
      grouped[key].totalCoseguros += r.coseguroCobrado;
      grouped[key].totalGeneral += r.totalLiquidacionPrestacion;
    });
    return Object.values(grouped);
  }, [masterData]);

  // Resumen Agrupado por Profesional
  const resumenPorMedico = useMemo(() => {
    const grouped = {};
    masterData.forEach(r => {
      const key = r.profesionalNombre;
      if (!grouped[key]) {
        grouped[key] = {
          profesional: r.profesionalNombre,
          matricula: r.profesionalMatricula,
          especialidad: r.profesionalEspecialidad,
          cantConsultas: 0,
          totalFacturado: 0,
          retencionClinica: 0,
          netoMedico: 0
        };
      }
      grouped[key].cantConsultas += 1;
      grouped[key].totalFacturado += r.totalLiquidacionPrestacion;
      grouped[key].retencionClinica += r.retencionClinica;
      grouped[key].netoMedico += r.honorarioNetoMedico;
    });
    return Object.values(grouped);
  }, [masterData]);

  // Resumen Agrupado por Código PMO
  const resumenPorPMO = useMemo(() => {
    const grouped = {};
    masterData.forEach(r => {
      const key = r.practicaCodigo;
      if (!grouped[key]) {
        grouped[key] = {
          codigo: r.practicaCodigo,
          descripcion: r.practicaDescripcion,
          cantidad: 0,
          totalOS: 0,
          totalCoseguros: 0,
          totalGeneral: 0
        };
      }
      grouped[key].cantidad += 1;
      grouped[key].totalOS += r.arancelObraSocial;
      grouped[key].totalCoseguros += r.coseguroCobrado;
      grouped[key].totalGeneral += r.totalLiquidacionPrestacion;
    });
    return Object.values(grouped);
  }, [masterData]);

  // Exportar Master a CSV / Excel
  const exportMasterCsv = () => {
    const headers = [
      'Nro Orden',
      'Fecha Atencion',
      'Hora',
      'Nro Bono / Token',
      'Paciente',
      'DNI Paciente',
      'Obra Social',
      'Plan',
      'Nro Afiliado',
      'Profesional Prestador',
      'Matricula',
      'Especialidad',
      'Codigo PMO',
      'Practica / Prestacion',
      'Sede / Centro',
      'Arancel Obra Social ($)',
      'Coseguro Afiliado ($)',
      'Total Facturado ($)',
      'Neto Profesional ($)',
      'Estado Turno'
    ];

    const rows = masterData.map(r => [
      r.index,
      `"${r.fecha}"`,
      `"${r.hora}"`,
      `"${r.numero_bono}"`,
      `"${r.pacienteNombre}"`,
      r.pacienteDni,
      `"${r.obraSocialNombre}"`,
      `"${r.planNombre}"`,
      `"${r.numero_afiliado}"`,
      `"${r.profesionalNombre}"`,
      `"${r.profesionalMatricula}"`,
      `"${r.profesionalEspecialidad}"`,
      `"${r.practicaCodigo}"`,
      `"${r.practicaDescripcion}"`,
      `"${r.clinicaNombre}"`,
      r.arancelObraSocial,
      r.coseguroCobrado,
      r.totalLiquidacionPrestacion,
      r.honorarioNetoMedico,
      `"${r.estadoTurno}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Master_Facturacion_OS_${fechaDesde}_al_${fechaHasta}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* HEADER DE FACTURACIÓN */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Master de Facturación & Liquidación Obras Sociales
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-medical-100 text-medical-800 rounded-lg border border-medical-200">
              Argentina PMO
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Listados valorizados por Obra Social, rendición de coseguros, detalle por código nomenclador y liquidación de honorarios a prestadores.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportMasterCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-600/20 transition"
            title="Descargar planilla compatible con Excel"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel (CSV)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md transition"
            title="Imprimir carátula y detalle de facturación"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Master Oficial</span>
          </button>
        </div>
      </div>

      {/* PANEL DE FILTROS AVANZADOS DE FACTURACIÓN (NO PRINT) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 no-print">
        {/* Fila 1: Accesos Rápidos de Rango */}
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-medical-600" /> Periodo:
            </span>
            {[
              { id: 'este_mes', label: 'Mes Actual' },
              { id: 'quincena_1', label: '1ra Quincena' },
              { id: 'quincena_2', label: '2da Quincena' },
              { id: 'mes_anterior', label: 'Mes Anterior' },
              { id: 'todos', label: 'Histórico Completo' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => handleSetRango(r.id)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Desde:</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50"
            />
            <label className="text-xs font-bold text-slate-600">Hasta:</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50"
            />
          </div>
        </div>

        {/* Fila 2: Selectores de Financiador, Profesional, Sede y Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Obra Social / Prepaga</label>
            <select
              value={selectedOsId}
              onChange={(e) => setSelectedOsId(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-medical-500"
            >
              <option value="">Todas las Coberturas ({obrasSociales.length})</option>
              {obrasSociales.map(os => (
                <option key={os.id} value={os.id}>{os.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Profesional Prestador</label>
            <select
              value={selectedProfId}
              onChange={(e) => setSelectedProfId(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-medical-500"
            >
              <option value="">Todos los Médicos ({profesionales.length})</option>
              {profesionales.map(p => (
                <option key={p.id} value={p.id}>Dr(a). {p.nombre} {p.apellido} ({p.especialidad})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Sede / Centro</label>
            <select
              value={selectedClinicaId}
              onChange={(e) => setSelectedClinicaId(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-medical-500"
            >
              <option value="TODAS">Todas las Sedes ({allClinicas.length})</option>
              {allClinicas.map(c => (
                <option key={c.id} value={c.id}>🏥 {c.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Estado Prestación</label>
            <select
              value={selectedEstadoTurno}
              onChange={(e) => setSelectedEstadoTurno(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-medical-500"
            >
              <option value="VALIDOS">Válidos (Sin Cancelados)</option>
              <option value="ATENDIDO">Solo Atendidos</option>
              <option value="TODOS">Todos los Estados</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Buscar Paciente / Bono</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="DNI, Nombre o Bono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-medical-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ÁREA IMPRIMIBLE / REPORTE OFICIAL */}
      <div id="printable-area" className="space-y-6">
        
        {/* CARÁTULA MEMBRETADA PARA PRESENTACIÓN (Visible en Impresión) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building className="w-6 h-6 text-medical-600" />
                <h2 className="text-xl font-black text-slate-900">{activeClinica?.nombre || 'Centro Médico San Lucas'}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                CUIT: {activeClinica?.cuit || '30-71234567-9'} • {activeClinica?.direccion || 'Av. Santa Fe 2450, CABA'} • Tel: {activeClinica?.telefono || '+54 11 4821-9000'}
              </p>
            </div>

            <div className="text-left sm:text-right bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Periodo de Facturación</span>
              <span className="text-sm font-black text-slate-900">
                {fechaDesde} al {fechaHasta}
              </span>
              <span className="text-[11px] text-medical-700 font-bold block mt-0.5">
                {selectedOsId ? obrasSociales.find(o => o.id === selectedOsId)?.nombre : 'Consolidado Todas las Coberturas'}
              </span>
            </div>
          </div>

          {/* TARJETAS DE MÉTRICAS FINANCIERAS (KPIs) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Bonos / Prestaciones</span>
              <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{totalRegistros}</p>
              <span className="text-[10px] text-slate-500 font-medium">Órdenes registradas</span>
            </div>

            <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200">
              <span className="text-[10px] font-black uppercase text-sky-800 block">A Facturar a Obra Social</span>
              <p className="text-2xl font-black text-sky-900 mt-0.5 font-mono">${totalFacturadoOS.toLocaleString('es-AR')}</p>
              <span className="text-[10px] text-sky-700 font-medium">Aranceles a liquidar</span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
              <span className="text-[10px] font-black uppercase text-emerald-800 block">Coseguros en Caja</span>
              <p className="text-2xl font-black text-emerald-900 mt-0.5 font-mono">${totalCosegurosCaja.toLocaleString('es-AR')}</p>
              <span className="text-[10px] text-emerald-700 font-medium">Recaudación directa</span>
            </div>

            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
              <span className="text-[10px] font-black uppercase text-purple-800 block">Total Valorizado Global</span>
              <p className="text-2xl font-black text-purple-900 mt-0.5 font-mono">${totalGlobalValorizado.toLocaleString('es-AR')}</p>
              <span className="text-[10px] text-purple-700 font-medium">Bruto prestacional</span>
            </div>
          </div>
        </div>

        {/* TABS DE VISTA: MASTER DETALLADO / RESUMEN POR OBRA SOCIAL / LIQUIDACIÓN MÉDICOS (NO PRINT) */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit no-print">
          <button
            onClick={() => setActiveTab('master')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'master'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-medical-600" />
            <span>Master Detallado por Orden ({masterData.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('por_os')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'por_os'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Resumen por Obra Social ({resumenPorOS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('por_medico')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'por_medico'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-purple-600" />
            <span>Liquidación Médicos ({resumenPorMedico.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('por_pmo')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'por_pmo'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Por Código PMO ({resumenPorPMO.length})</span>
          </button>
        </div>

        {/* TABLA 1: MASTER DETALLADO POR ORDEN / PRESTACIÓN */}
        {activeTab === 'master' && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Planilla Master de Prestaciones Médicas Realizadas
                </h3>
                <span className="text-xs text-slate-500">
                  Desglose individual por paciente, bono, profesional y arancel pactado.
                </span>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-xl">
                {masterData.length} registros
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3">N°</th>
                    <th className="px-3 py-3">Fecha & Hora</th>
                    <th className="px-3 py-3">N° Bono / Token</th>
                    <th className="px-3 py-3">Paciente (DNI)</th>
                    <th className="px-3 py-3">Obra Social & Plan</th>
                    <th className="px-3 py-3">N° Afiliado</th>
                    <th className="px-3 py-3">Médico Prestador</th>
                    <th className="px-3 py-3">Cód. PMO & Práctica</th>
                    <th className="px-3 py-3 text-right">Arancel OS ($)</th>
                    <th className="px-3 py-3 text-right">Coseguro ($)</th>
                    <th className="px-3 py-3 text-right font-black text-slate-900">Total ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {masterData.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="text-center py-10 text-slate-400">
                        No hay prestaciones registradas en el periodo y filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    masterData.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-3 py-2.5 font-mono text-slate-400">{r.index}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap font-bold text-slate-900">
                          {r.fecha} <span className="text-[11px] text-slate-500 font-normal">{r.hora} hs</span>
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-medical-800">
                          {r.numero_bono}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-extrabold text-slate-900 block">{r.pacienteNombre}</span>
                          <span className="text-[11px] text-slate-500 font-mono">DNI {r.pacienteDni}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-bold text-slate-900 block">{r.obraSocialSigla || r.obraSocialNombre}</span>
                          <span className="text-[10px] text-slate-500">{r.planNombre}</span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-600">
                          {r.numero_afiliado}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-bold text-slate-900 block">{r.profesionalNombre}</span>
                          <span className="text-[10px] text-slate-500">{r.profesionalMatricula}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] mr-1">
                            {r.practicaCodigo}
                          </span>
                          <span className="text-slate-700 text-[11px]">{r.practicaDescripcion}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-sky-800">
                          ${r.arancelObraSocial.toLocaleString('es-AR')}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-emerald-700">
                          ${r.coseguroCobrado.toLocaleString('es-AR')}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-black text-slate-900">
                          ${r.totalLiquidacionPrestacion.toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {masterData.length > 0 && (
                  <tfoot className="bg-slate-100/80 font-black text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan="8" className="px-3 py-3 text-right uppercase text-[11px]">
                        Totales Facturación del Periodo:
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sky-900 text-sm">
                        ${totalFacturadoOS.toLocaleString('es-AR')}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-emerald-900 text-sm">
                        ${totalCosegurosCaja.toLocaleString('es-AR')}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-purple-900 text-sm">
                        ${totalGlobalValorizado.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* TABLA 2: RESUMEN POR OBRA SOCIAL */}
        {activeTab === 'por_os' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
              <span>Resumen y Lotes Agrupados por Financiador / Obra Social</span>
            </h3>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase">
                  <tr>
                    <th className="px-4 py-3">Obra Social / Financiador</th>
                    <th className="px-4 py-3 text-center">Cant. Órdenes / Bonos</th>
                    <th className="px-4 py-3 text-right">A Cobrar de la OS ($)</th>
                    <th className="px-4 py-3 text-right">Coseguros Pacientes ($)</th>
                    <th className="px-4 py-3 text-right font-black text-slate-900">Total Facturado ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {resumenPorOS.map((os, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-extrabold text-slate-900">
                        {os.nombre} {os.sigla && `(${os.sigla})`}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold">{os.cantPrestaciones}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-sky-800">
                        ${os.totalOS.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700">
                        ${os.totalCoseguros.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-900 text-sm">
                        ${os.totalGeneral.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABLA 3: LIQUIDACIÓN POR PROFESIONAL */}
        {activeTab === 'por_medico' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-600" />
              <span>Liquidación de Honorarios Médicos a Prestadores</span>
            </h3>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase">
                  <tr>
                    <th className="px-4 py-3">Profesional</th>
                    <th className="px-4 py-3">Especialidad & Matrícula</th>
                    <th className="px-4 py-3 text-center">Consultas Atendidas</th>
                    <th className="px-4 py-3 text-right">Monto Bruto Facturado</th>
                    <th className="px-4 py-3 text-right">Retención Centro (20%)</th>
                    <th className="px-4 py-3 text-right font-black text-emerald-900">Neto a Liquidar Médico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {resumenPorMedico.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-extrabold text-slate-900">{m.profesional}</td>
                      <td className="px-4 py-3 text-slate-600">{m.especialidad} • {m.matricula}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold">{m.cantConsultas}</td>
                      <td className="px-4 py-3 text-right font-mono">${m.totalFacturado.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">-${m.retencionClinica.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-right font-mono font-black text-emerald-700 text-sm">
                        ${m.netoMedico.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABLA 4: RESUMEN POR CÓDIGO PMO */}
        {activeTab === 'por_pmo' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>Rendición por Código Nomenclador PMO</span>
            </h3>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase">
                  <tr>
                    <th className="px-4 py-3">Código PMO</th>
                    <th className="px-4 py-3">Descripción de la Práctica</th>
                    <th className="px-4 py-3 text-center">Cantidad</th>
                    <th className="px-4 py-3 text-right">Total OS ($)</th>
                    <th className="px-4 py-3 text-right">Total Coseguros ($)</th>
                    <th className="px-4 py-3 text-right font-black text-slate-900">Total ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {resumenPorPMO.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 bg-slate-50">{p.codigo}</td>
                      <td className="px-4 py-3 text-slate-800 font-bold">{p.descripcion}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold">{p.cantidad}</td>
                      <td className="px-4 py-3 text-right font-mono text-sky-800">${p.totalOS.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700">${p.totalCoseguros.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-900 text-sm">
                        ${p.totalGeneral.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PIE DE IMPRESIÓN OFICIAL: FIRMAS DE AUDITORÍA (SOLO PRINT) */}
        <div className="hidden print:grid grid-cols-2 gap-12 pt-16 text-center text-xs">
          <div className="border-t border-slate-400 pt-2">
            <p className="font-bold text-slate-900">Firma Auditor Médico / Dirección</p>
            <p className="text-[10px] text-slate-500">Sello y Matrícula Profesional</p>
          </div>
          <div className="border-t border-slate-400 pt-2">
            <p className="font-bold text-slate-900">Recepción Obra Social / Auditoría</p>
            <p className="text-[10px] text-slate-500">Fecha de Conformidad y Firma</p>
          </div>
        </div>
      </div>
    </div>
  );
};
