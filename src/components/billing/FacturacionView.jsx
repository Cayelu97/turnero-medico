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
  AlertCircle,
  Plus,
  Eye,
  QrCode,
  Brain
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateAR } from '../../utils/formatters';
import { ComprobanteArcaModal } from './ComprobanteArcaModal';
import { LoteFacturacionModal } from './LoteFacturacionModal';
import { CuentaCorrienteModal } from './CuentaCorrienteModal';

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
    lotesFacturacion,
    comprobantesArca
  } = useApp();

  // Sub-módulos principales
  const [activeTab, setActiveTab] = useState('master'); // 'master' | 'lotes' | 'cta_cte' | 'arca'

  // Filtros del Master
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [fechaDesde, setFechaDesde] = useState(firstDayOfMonth);
  const [fechaHasta, setFechaHasta] = useState(lastDayOfMonth);
  const [selectedOsId, setSelectedOsId] = useState('');
  const [selectedProfId, setSelectedProfId] = useState('');
  const [selectedEstadoTurno, setSelectedEstadoTurno] = useState('ATENDIDO');
  const [searchQuery, setSearchQuery] = useState('');

  // Modales
  const [selectedCbteParaVer, setSelectedCbteParaVer] = useState(null);
  const [showLoteModal, setShowLoteModal] = useState(false);
  const [ctaCteSelectedPaciente, setCtaCteSelectedPaciente] = useState(null);
  const [ctaCteSelectedOs, setCtaCteSelectedOs] = useState(null);

  // Accesos rápidos de fechas
  const handleSetRango = (tipo) => {
    const now = new Date();
    if (tipo === 'este_mes') {
      setFechaDesde(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setFechaHasta(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
    } else if (tipo === 'mes_anterior') {
      setFechaDesde(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]);
      setFechaHasta(new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]);
    } else if (tipo === 'todos') {
      setFechaDesde('2020-01-01');
      setFechaHasta('2030-12-31');
    }
  };

  // Filtrado y cálculo valorizado del Master
  const masterData = useMemo(() => {
    return turnos.filter(t => {
      if (t.fecha < fechaDesde || t.fecha > fechaHasta) return false;
      if (selectedEstadoTurno === 'VALIDOS' && (t.estado === 'CANCELADO' || t.estado === 'NO_ASISTIO')) return false;
      if (selectedEstadoTurno === 'ATENDIDO' && t.estado !== 'ATENDIDO') return false;
      if (selectedOsId && t.obra_social_id !== selectedOsId) return false;
      if (selectedProfId && t.profesional_id !== selectedProfId) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pac = pacientes.find(p => p.id === t.paciente_id);
        const matchPac = pac && (`${pac.nombre} ${pac.apellido}`.toLowerCase().includes(q) || pac.dni.includes(q));
        const matchCode = t.codigo_reserva && t.codigo_reserva.toLowerCase().includes(q);
        if (!matchPac && !matchCode) return false;
      }

      return true;
    }).map((t, index) => {
      const pac = pacientes.find(p => p.id === t.paciente_id);
      const prof = profesionales.find(p => p.id === t.profesional_id);
      const os = obrasSociales.find(o => o.id === t.obra_social_id);
      const plan = planes.find(p => p.id === t.plan_id);
      const practica = nomenclador.find(p => p.id === t.practica_id);

      const esParticular = !os || os.sigla === 'PART';
      const valorBase = Number(practica?.valor_particular || 16000);
      const coseguroCobrado = Number(t.monto_coseguro || 0);

      const arancelObraSocial = esParticular ? 0 : Math.max(0, valorBase - coseguroCobrado);
      const totalLiquidacion = esParticular ? coseguroCobrado || valorBase : arancelObraSocial + coseguroCobrado;

      // Honorario profesional (80% para el psicólogo/médico, 20% retención clínica)
      const retencionClinica = totalLiquidacion * 0.20;
      const honorarioNetoMedico = totalLiquidacion * 0.80;

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
        profesionalNombre: prof ? `${prof.nombre} ${prof.apellido}` : 'Profesional',
        profesionalMatricula: prof?.matricula_provincial || prof?.matricula_nacional || 'M.P. S/D',
        profesionalEspecialidad: prof?.especialidad || 'Salud Mental',
        obraSocialNombre: os?.nombre || 'Particular',
        obraSocialSigla: os?.sigla || 'PART',
        planNombre: plan?.nombre_plan || 'Estándar',
        practicaCodigo: practica?.codigo_pmo || '33.01.02',
        practicaDescripcion: practica?.descripcion || 'Sesión de Psicoterapia Individual',
        estadoTurno: t.estado,
        estadoCoseguro: t.estado_coseguro || 'COBRADO',
        arancelObraSocial,
        coseguroCobrado,
        totalLiquidacion,
        retencionClinica,
        honorarioNetoMedico
      };
    });
  }, [turnos, fechaDesde, fechaHasta, selectedEstadoTurno, selectedOsId, selectedProfId, searchQuery, pacientes, profesionales, obrasSociales, planes, nomenclador]);

  // Totales Globales
  const totalSesiones = masterData.length;
  const totalArancelOS = masterData.reduce((acc, row) => acc + row.arancelObraSocial, 0);
  const totalCoseguros = masterData.reduce((acc, row) => acc + row.coseguroCobrado, 0);
  const totalBruto = totalArancelOS + totalCoseguros;
  const totalHonorariosNetos = masterData.reduce((acc, row) => acc + row.honorarioNetoMedico, 0);
  const totalRetencionClinica = masterData.reduce((acc, row) => acc + row.retencionClinica, 0);

  // Exportar a CSV / Excel
  const exportarCSV = () => {
    const headers = [
      'Nro',
      'Fecha',
      'Hora',
      'Codigo Reserva',
      'Paciente',
      'DNI',
      'Nro Afiliado',
      'Obra Social',
      'Plan',
      'Bono / Token',
      'Codigo PMO/CPPC',
      'Prestacion',
      'Profesional',
      'Matricula',
      'Arancel OS',
      'Coseguro Cobrado',
      'Total Bruto',
      'Retencion Clinica (20%)',
      'Neto Profesional (80%)',
      'Estado'
    ];

    const rows = masterData.map(r => [
      r.index,
      r.fecha,
      r.hora,
      r.codigo_reserva,
      `"${r.pacienteNombre}"`,
      r.pacienteDni,
      r.numero_afiliado,
      `"${r.obraSocialNombre}"`,
      `"${r.planNombre}"`,
      r.numero_bono,
      r.practicaCodigo,
      `"${r.practicaDescripcion}"`,
      `"${r.profesionalNombre}"`,
      r.profesionalMatricula,
      r.arancelObraSocial,
      r.coseguroCobrado,
      r.totalLiquidacion,
      r.retencionClinica,
      r.honorarioNetoMedico,
      r.estadoTurno
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Liquidacion_Prestaciones_${fechaDesde}_al_${fechaHasta}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-600/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Módulo de Facturación & Obras Sociales (APROSS / CPPC / ARCA)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Liquidación de prestaciones, presentación de lotes oficiales, cuentas corrientes y Factura Electrónica
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLoteModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Generar Lote de Presentación</span>
          </button>
        </div>
      </div>

      {/* TABS DE SUB-MÓDULOS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('master')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'master'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Master de Liquidación ({totalSesiones})</span>
        </button>

        <button
          onClick={() => setActiveTab('lotes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'lotes'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Lotes de Presentación OS / CPPC ({lotesFacturacion?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('cta_cte')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'cta_cte'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Cuentas Corrientes (Pacientes & OS)</span>
        </button>

        <button
          onClick={() => setActiveTab('arca')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'arca'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Factura Electrónica ARCA (AFIP) ({comprobantesArca?.length || 0})</span>
        </button>
      </div>

      {/* 1. SUB-MÓDULO: MASTER DE LIQUIDACIÓN */}
      {activeTab === 'master' && (
        <div className="space-y-6">
          
          {/* TARJETAS RESUMEN DE LIQUIDACIÓN */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">Total Prestaciones</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalSesiones}</p>
              <span className="text-[10px] text-indigo-600 font-semibold">Sesiones atendidas</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">A Facturar a Obras Soc.</span>
              <p className="text-xl font-black text-indigo-700 mt-1 font-mono">
                ${totalArancelOS.toLocaleString('es-AR')}
              </p>
              <span className="text-[10px] text-slate-400">Aranceles directos/convenios</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">Coseguros Cobrados</span>
              <p className="text-xl font-black text-emerald-700 mt-1 font-mono">
                ${totalCoseguros.toLocaleString('es-AR')}
              </p>
              <span className="text-[10px] text-slate-400">En mano / caja clínica</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">Honorarios Netos Médicos (80%)</span>
              <p className="text-xl font-black text-slate-900 mt-1 font-mono">
                ${totalHonorariosNetos.toLocaleString('es-AR')}
              </p>
              <span className="text-[10px] text-slate-400">A liquidar a terapeutas</span>
            </div>

            <div className="bg-indigo-900 text-white p-4 rounded-2xl shadow-xs col-span-2 lg:col-span-1">
              <span className="text-[11px] font-bold text-indigo-200 block">Retención Clínica (20%)</span>
              <p className="text-xl font-black text-white mt-1 font-mono">
                ${totalRetencionClinica.toLocaleString('es-AR')}
              </p>
              <span className="text-[10px] text-indigo-300">Margen institucional</span>
            </div>
          </div>

          {/* BARRA DE FILTROS */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => handleSetRango('este_mes')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Este Mes
                </button>
                <button
                  onClick={() => handleSetRango('mes_anterior')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Mes Anterior
                </button>
                <button
                  onClick={() => handleSetRango('todos')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Ver Todo
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportarCSV}
                  disabled={masterData.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Excel / CSV</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Obra Social</label>
                <select
                  value={selectedOsId}
                  onChange={(e) => setSelectedOsId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="">Todas las Obras Sociales</option>
                  {obrasSociales.map(os => (
                    <option key={os.id} value={os.id}>{os.nombre} ({os.sigla})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Profesional</label>
                <select
                  value={selectedProfId}
                  onChange={(e) => setSelectedProfId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="">Todos los Profesionales</option>
                  {profesionales.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* TABLA MASTER DE PRESTACIONES */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black text-slate-500">
                <tr>
                  <th className="px-3 py-3">Fecha / Hora</th>
                  <th className="px-3 py-3">Paciente & DNI</th>
                  <th className="px-3 py-3">Cobertura & Afiliado</th>
                  <th className="px-3 py-3">Bono / Token</th>
                  <th className="px-3 py-3">Práctica / Código</th>
                  <th className="px-3 py-3">Profesional (M.P.)</th>
                  <th className="px-3 py-3 text-right">Arancel OS</th>
                  <th className="px-3 py-3 text-right">Coseguro</th>
                  <th className="px-3 py-3 text-right">Neto Profesional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {masterData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center text-slate-400 font-medium">
                      No se encontraron prestaciones atendidas para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  masterData.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                        <span className="font-bold text-slate-900">{formatDateAR(r.fecha)}</span>
                        <span className="text-slate-400 block text-[10px]">{r.hora} hs</span>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">
                        {r.pacienteNombre}
                        <span className="text-[10px] text-slate-400 block font-normal">DNI: {r.pacienteDni}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-bold text-slate-800">{r.obraSocialSigla}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">Afil: {r.numero_afiliado}</span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-indigo-700 font-bold whitespace-nowrap">
                        {r.numero_bono}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono font-bold text-indigo-800 text-[11px] block">{r.practicaCodigo}</span>
                        <span className="text-[10px] text-slate-600 truncate max-w-[140px] block">{r.practicaDescripcion}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-bold text-slate-900">{r.profesionalNombre}</span>
                        <span className="text-[10px] text-slate-400 block">{r.profesionalMatricula}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                        ${r.arancelObraSocial.toLocaleString('es-AR')}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700">
                        ${r.coseguroCobrado.toLocaleString('es-AR')}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-black text-indigo-700">
                        ${r.honorarioNetoMedico.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* 2. SUB-MÓDULO: LOTES DE PRESENTACIÓN A OBRAS SOCIALES & CPPC */}
      {activeTab === 'lotes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-sm">Lotes de Presentación Generados</h3>
              <p className="text-xs text-slate-500">
                Padrón mensual de prestaciones agrupadas para APROSS, CPPC y prepagas con auditoría y débitos
              </p>
            </div>
            <button
              onClick={() => setShowLoteModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Lote</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(!lotesFacturacion || lotesFacturacion.length === 0) ? (
              <div className="col-span-full p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-400">
                Aún no has generado lotes de presentación para este centro. Haz clic en "Nuevo Lote" para crear uno.
              </div>
            ) : (
              lotesFacturacion.map(lote => (
                <div key={lote.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-indigo-700 text-xs px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-100">
                      {lote.numero_lote}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {lote.estado || 'PRESENTADO'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 text-sm">{lote.obra_social_nombre}</h4>
                    <span className="text-xs text-slate-500 font-medium">
                      Período: {lote.periodo_mes}/{lote.periodo_anio} • {lote.total_prestaciones} sesiones
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold">Total Presentado:</span>
                    <span className="font-black font-mono text-indigo-700 text-sm">
                      ${Number(lote.monto_total_presentado || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <span>Presentado: {formatDateAR(lote.fecha_presentacion)}</span>
                    <button
                      onClick={() => {
                        alert(`Planilla oficial para ${lote.obra_social_nombre} lista para descargar e imprimir con ${lote.total_prestaciones} prestaciones.`);
                      }}
                      className="font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      Planilla CPPC
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. SUB-MÓDULO: CUENTAS CORRIENTES (PACIENTES Y OBRAS SOCIALES) */}
      {activeTab === 'cta_cte' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Cuentas Corrientes de Pacientes */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Cuentas Corrientes de Pacientes</h3>
                  <p className="text-xs text-slate-500">Control de abonos mensuales, copagos y saldos</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {pacientes.map(pac => (
                  <div key={pac.id} className="py-3 flex items-center justify-between hover:bg-slate-50 p-2 rounded-xl transition">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{pac.apellido}, {pac.nombre}</p>
                      <span className="text-[10px] text-slate-400">DNI: {pac.dni} • Tel: {pac.telefono_whatsapp}</span>
                    </div>
                    <button
                      onClick={() => setCtaCteSelectedPaciente(pac)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Ver Estado
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cuentas Corrientes de Obras Sociales */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Cuentas Corrientes de Obras Sociales</h3>
                  <p className="text-xs text-slate-500">Facturación emitida vs cobranzas y débitos</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {obrasSociales.filter(o => o.sigla !== 'PART').map(os => (
                  <div key={os.id} className="py-3 flex items-center justify-between hover:bg-slate-50 p-2 rounded-xl transition">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{os.nombre} ({os.sigla})</p>
                      <span className="text-[10px] text-slate-400">CUIT: {os.cuit || 'S/D'}</span>
                    </div>
                    <button
                      onClick={() => setCtaCteSelectedOs(os)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Ver Estado
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. SUB-MÓDULO: FACTURACIÓN ELECTRÓNICA ARCA (AFIP) */}
      {activeTab === 'arca' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <h4 className="font-black text-emerald-950 text-xs sm:text-sm">
                  Facturación Electrónica ARCA (AFIP WSFE) Conectada
                </h4>
                <p className="text-[11px] text-emerald-800">
                  Punto de Venta {activeClinica?.punto_venta || 1} • CUIT: {activeClinica?.cuit || '30-71234567-9'} • Régimen: {activeClinica?.condicion_iva || 'Monotributo'}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-emerald-600 text-white rounded-lg shadow-xs">
              CAE Activo
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3">Fecha</th>
                  <th className="px-3 py-3">Tipo Comprobante</th>
                  <th className="px-3 py-3">Número</th>
                  <th className="px-3 py-3">Receptor / Paciente</th>
                  <th className="px-3 py-3">CAE / Vto</th>
                  <th className="px-3 py-3 text-right">Importe Total</th>
                  <th className="px-3 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(!comprobantesArca || comprobantesArca.length === 0) ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-slate-400 font-medium">
                      Aún no se han emitido facturas electrónicas ARCA en este período.
                    </td>
                  </tr>
                ) : (
                  comprobantesArca.map(cbte => (
                    <tr key={cbte.id} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">{formatDateAR(cbte.fecha_emision)}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-800">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono mr-1">
                          {cbte.letra}
                        </span>
                        {cbte.tipo_comprobante_nombre}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-indigo-700">{cbte.numero_completo}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-900">
                        {cbte.receptor?.nombre || 'Consumidor Final'}
                        <span className="text-[10px] text-slate-400 block font-normal">{cbte.receptor?.doc_tipo}: {cbte.receptor?.doc_nro}</span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px]">
                        <span className="font-bold text-emerald-700">{cbte.cae}</span>
                        <span className="text-slate-400 block text-[10px]">Vto: {formatDateAR(cbte.cae_vto)}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-black text-slate-900">
                        ${Number(cbte.importe_total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => setSelectedCbteParaVer(cbte)}
                          className="p-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Factura</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALES */}
      {selectedCbteParaVer && (
        <ComprobanteArcaModal
          comprobante={selectedCbteParaVer}
          onClose={() => setSelectedCbteParaVer(null)}
        />
      )}

      {showLoteModal && (
        <LoteFacturacionModal
          onClose={() => setShowLoteModal(false)}
          onLoteCreado={(lote) => {
            setActiveTab('lotes');
          }}
        />
      )}

      {ctaCteSelectedPaciente && (
        <CuentaCorrienteModal
          paciente={ctaCteSelectedPaciente}
          onClose={() => setCtaCteSelectedPaciente(null)}
        />
      )}

      {ctaCteSelectedOs && (
        <CuentaCorrienteModal
          obraSocial={ctaCteSelectedOs}
          onClose={() => setCtaCteSelectedOs(null)}
        />
      )}

    </div>
  );
};
