import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Wallet, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Building,
  Sparkles,
  QrCode,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateAR, formatMoneda } from '../../utils/formatters';
import { getLocalDateString } from '../../utils/dateUtils';

export const CajaView = () => {
  const { 
    movimientosCaja = [], 
    profesionales, 
    turnos, 
    pacientes, 
    saveMovimientoCaja, 
    deleteMovimientoCaja, 
    clinica,
    currentUser,
    showToast 
  } = useApp();

  const todayStr = getLocalDateString(new Date());

  // Filtros
  const [selectedFecha, setSelectedFecha] = useState(todayStr);
  const [filtroTipo, setFiltroTipo] = useState('TODOS'); // 'TODOS' | 'INGRESO' | 'EGRESO'
  const [filtroMedio, setFiltroMedio] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal nuevo movimiento manual
  const [showModal, setShowModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    tipo: 'INGRESO',
    concepto: '',
    monto: '',
    forma_pago: 'EFECTIVO',
    paciente_nombre: '',
    paciente_dni: '',
    profesional_nombre: '',
    obra_social_nombre: 'Particular',
    comprobante: '',
    observaciones: ''
  });

  // Movimientos filtrados
  const filteredMovimientos = useMemo(() => {
    return movimientosCaja.filter(m => {
      if (selectedFecha && m.fecha !== selectedFecha) return false;
      if (filtroTipo !== 'TODOS' && m.tipo !== filtroTipo) return false;
      if (filtroMedio !== 'TODOS' && m.forma_pago !== filtroMedio) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${m.concepto} ${m.paciente_nombre} ${m.paciente_dni} ${m.profesional_nombre} ${m.comprobante} ${m.usuario_nombre}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [movimientosCaja, selectedFecha, filtroTipo, filtroMedio, searchQuery]);

  // Cálculos de Totales para el día seleccionado
  const resumen = useMemo(() => {
    const list = movimientosCaja.filter(m => !selectedFecha || m.fecha === selectedFecha);
    
    let totalEfectivo = 0;
    let totalMercadoPago = 0;
    let totalTransferencia = 0;
    let totalTarjeta = 0;
    let totalIngresos = 0;
    let totalEgresos = 0;

    list.forEach(m => {
      const monto = Number(m.monto || 0);
      if (m.tipo === 'EGRESO') {
        totalEgresos += monto;
      } else {
        totalIngresos += monto;
        if (m.forma_pago === 'EFECTIVO') totalEfectivo += monto;
        else if (m.forma_pago === 'MERCADOPAGO') totalMercadoPago += monto;
        else if (m.forma_pago === 'TRANSFERENCIA') totalTransferencia += monto;
        else if (m.forma_pago === 'TARJETA' || m.forma_pago === 'DEBITO' || m.forma_pago === 'CREDITO') totalTarjeta += monto;
        else totalEfectivo += monto;
      }
    });

    const totalNetoCaja = totalIngresos - totalEgresos;

    return {
      totalIngresos,
      totalEgresos,
      totalNetoCaja,
      totalEfectivo,
      totalMercadoPago,
      totalTransferencia,
      totalTarjeta,
      cantidadMovimientos: list.length
    };
  }, [movimientosCaja, selectedFecha]);

  const handleCrearMovimiento = (e) => {
    e.preventDefault();
    if (!modalForm.concepto || !modalForm.monto) {
      showToast('Por favor ingrese el concepto y el monto.', 'error');
      return;
    }

    saveMovimientoCaja({
      tipo: modalForm.tipo,
      concepto: modalForm.concepto,
      monto: Number(modalForm.monto),
      forma_pago: modalForm.forma_pago,
      paciente_nombre: modalForm.paciente_nombre || 'Particular / Sin registrar',
      paciente_dni: modalForm.paciente_dni || '-',
      profesional_nombre: modalForm.profesional_nombre || '-',
      obra_social_nombre: modalForm.obra_social_nombre || 'Particular',
      comprobante: modalForm.comprobante || `REC-${Date.now().toString().slice(-6)}`,
      observaciones: modalForm.observaciones,
      fecha: selectedFecha || todayStr,
      hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    });

    setShowModal(false);
    setModalForm({
      tipo: 'INGRESO',
      concepto: '',
      monto: '',
      forma_pago: 'EFECTIVO',
      paciente_nombre: '',
      paciente_dni: '',
      profesional_nombre: '',
      obra_social_nombre: 'Particular',
      comprobante: '',
      observaciones: ''
    });
  };

  const handleImprimirCierre = () => {
    window.print();
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      
      {/* CABECERA PRINCIPAL */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200 shadow-2xs">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Caja Recaudadora & Arqueo Diario
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-black bg-emerald-100 text-emerald-900 rounded-lg">
                Cobranzas
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Control en tiempo real de ingresos por coseguros, consultas particulares y medios de pago
            </p>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Movimiento</span>
          </button>

          <button
            onClick={handleImprimirCierre}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>Imprimir Cierre de Caja</span>
          </button>
        </div>
      </div>

      {/* TARJETAS DE TOTALES Y ARQUEO */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* TOTAL NETO EN CAJA */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-5 rounded-3xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Neto en Caja</span>
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ${resumen.totalNetoCaja.toLocaleString('es-AR')}
            </h3>
            <span className="text-[11px] text-emerald-400 font-bold mt-1 block">
              {resumen.cantidadMovimientos} movimientos registrados
            </span>
          </div>
        </div>

        {/* EFECTIVO */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-emerald-800">Efectivo Físico</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-xl font-black text-slate-900">
              ${resumen.totalEfectivo.toLocaleString('es-AR')}
            </h4>
            <span className="text-[10px] text-slate-500 font-medium">Billetes en mostrador</span>
          </div>
        </div>

        {/* MERCADO PAGO */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-sky-800">Mercado Pago / QR</span>
            <div className="p-2 bg-sky-50 text-sky-700 rounded-xl">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-xl font-black text-slate-900">
              ${resumen.totalMercadoPago.toLocaleString('es-AR')}
            </h4>
            <span className="text-[10px] text-slate-500 font-medium">Cobros QR / Link</span>
          </div>
        </div>

        {/* TRANSFERENCIA */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-purple-800">Transferencias</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-xl font-black text-slate-900">
              ${resumen.totalTransferencia.toLocaleString('es-AR')}
            </h4>
            <span className="text-[10px] text-slate-500 font-medium">Depósitos y CBU</span>
          </div>
        </div>

        {/* TARJETAS DÉBITO / CRÉDITO */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-orange-800">Tarjetas Posnet</span>
            <div className="p-2 bg-orange-50 text-orange-700 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-xl font-black text-slate-900">
              ${resumen.totalTarjeta.toLocaleString('es-AR')}
            </h4>
            <span className="text-[10px] text-slate-500 font-medium">Débito / Crédito</span>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Selector de Fecha */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedFecha}
              onChange={(e) => setSelectedFecha(e.target.value)}
              className="text-xs font-bold bg-transparent focus:outline-none"
            />
          </div>

          {/* Filtro Medio de Pago */}
          <select
            value={filtroMedio}
            onChange={(e) => setFiltroMedio(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="TODOS">Todos los Medios de Pago</option>
            <option value="EFECTIVO">💵 Solo Efectivo</option>
            <option value="MERCADOPAGO">📱 Solo Mercado Pago</option>
            <option value="TRANSFERENCIA">🏦 Solo Transferencia</option>
            <option value="TARJETA">💳 Solo Tarjetas</option>
          </select>

          {/* Filtro Tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="TODOS">Ingresos y Egresos</option>
            <option value="INGRESO">🟢 Solo Ingresos</option>
            <option value="EGRESO">🔴 Solo Egresos</option>
          </select>
        </div>

        {/* Buscador de texto */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por paciente, DNI, comprobante..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* TABLA DE MOVIMIENTOS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Detalle de Movimientos del Día ({filteredMovimientos.length})
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Fecha: {formatDateAR(selectedFecha)}
          </span>
        </div>

        {filteredMovimientos.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No hay movimientos registrados para los filtros seleccionados.</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
            >
              + Cargar Primer Movimiento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Hora / Comprobante</th>
                  <th className="px-4 py-3">Concepto & Paciente</th>
                  <th className="px-4 py-3">Profesional / Cobertura</th>
                  <th className="px-4 py-3">Forma de Pago</th>
                  <th className="px-4 py-3">Cobrado Por</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-3 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovimientos.map((m) => {
                  const isIngreso = m.tipo !== 'EGRESO';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 block">{m.hora || '10:00'} hs</span>
                        <span className="font-mono text-[10px] text-slate-400 block">{m.comprobante || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <strong className="text-slate-900 block font-bold">{m.concepto}</strong>
                        {m.paciente_nombre && m.paciente_nombre !== '-' && (
                          <span className="text-[11px] text-slate-500">
                            {m.paciente_nombre} {m.paciente_dni ? `(DNI: ${m.paciente_dni})` : ''}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-800 font-medium block">{m.profesional_nombre || '-'}</span>
                        <span className="text-[10px] text-sky-800 font-bold">{m.obra_social_nombre || 'Particular'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1 ${
                          m.forma_pago === 'EFECTIVO' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                          m.forma_pago === 'MERCADOPAGO' ? 'bg-sky-100 text-sky-900 border border-sky-200' :
                          m.forma_pago === 'TRANSFERENCIA' ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                          'bg-orange-100 text-orange-900 border border-orange-200'
                        }`}>
                          {m.forma_pago === 'EFECTIVO' ? '💵 Efectivo' :
                           m.forma_pago === 'MERCADOPAGO' ? '📱 Mercado Pago' :
                           m.forma_pago === 'TRANSFERENCIA' ? '🏦 Transferencia' : '💳 Tarjeta'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {m.usuario_nombre || 'Secretaría'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className={`font-black text-sm ${isIngreso ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {isIngreso ? '+' : '-'}${Number(m.monto).toLocaleString('es-AR')}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar movimiento de caja por $${m.monto}?`)) {
                              deleteMovimientoCaja(m.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="Eliminar movimiento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REPORTE OFICIAL DE IMPRESIÓN (SOLO VISIBLE EN WINDOW.PRINT) */}
      <div className="hidden print:block p-8 space-y-6 text-black">
        <div className="text-center border-b pb-4">
          <h1 className="text-xl font-bold">{clinica.nombre}</h1>
          <p className="text-xs">{clinica.direccion} • Tel: {clinica.telefono}</p>
          <h2 className="text-sm font-bold uppercase tracking-widest mt-2">CIERRE Y ARQUEO DIARIO DE CAJA</h2>
          <p className="text-xs">Fecha: {formatDateAR(selectedFecha)} • Emitido por: {currentUser?.nombre || 'Administrador'}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="border p-3 rounded">
            <p><strong>Total Efectivo:</strong> ${resumen.totalEfectivo.toLocaleString('es-AR')}</p>
            <p><strong>Total Mercado Pago / QR:</strong> ${resumen.totalMercadoPago.toLocaleString('es-AR')}</p>
            <p><strong>Total Transferencias:</strong> ${resumen.totalTransferencia.toLocaleString('es-AR')}</p>
            <p><strong>Total Tarjetas:</strong> ${resumen.totalTarjeta.toLocaleString('es-AR')}</p>
          </div>
          <div className="border p-3 rounded bg-slate-50">
            <p className="text-sm"><strong>TOTAL RECAUDADO:</strong> ${resumen.totalNetoCaja.toLocaleString('es-AR')}</p>
            <p><strong>Cantidad de Operaciones:</strong> {resumen.cantidadMovimientos}</p>
          </div>
        </div>

        <div className="pt-20 flex justify-between text-center text-xs">
          <div className="border-t w-48 pt-1">
            <p>Firma de Secretaría / Cajero</p>
          </div>
          <div className="border-t w-48 pt-1">
            <p>Firma de Administración / Auditoría</p>
          </div>
        </div>
      </div>

      {/* MODAL DE NUEVO MOVIMIENTO MANUAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-black text-base text-slate-900">Registrar Movimiento en Caja</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearMovimiento} className="space-y-4">
              {/* Selector Tipo */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModalForm({ ...modalForm, tipo: 'INGRESO' })}
                  className={`py-2 rounded-xl text-xs font-black border transition ${
                    modalForm.tipo === 'INGRESO'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  🟢 Ingreso de Dinero
                </button>
                <button
                  type="button"
                  onClick={() => setModalForm({ ...modalForm, tipo: 'EGRESO' })}
                  className={`py-2 rounded-xl text-xs font-black border transition ${
                    modalForm.tipo === 'EGRESO'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  🔴 Egreso / Gasto Menor
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Concepto / Motivo *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Cobro Consulta Particular / Compra Insumos..."
                  value={modalForm.concepto}
                  onChange={(e) => setModalForm({ ...modalForm, concepto: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monto ($) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="ej: 5000"
                    value={modalForm.monto}
                    onChange={(e) => setModalForm({ ...modalForm, monto: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-black text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Medio de Pago *</label>
                  <select
                    value={modalForm.forma_pago}
                    onChange={(e) => setModalForm({ ...modalForm, forma_pago: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="EFECTIVO">💵 Efectivo</option>
                    <option value="MERCADOPAGO">📱 Mercado Pago</option>
                    <option value="TRANSFERENCIA">🏦 Transferencia</option>
                    <option value="TARJETA">💳 Tarjeta Débito/Crédito</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Paciente (opcional)</label>
                  <input
                    type="text"
                    placeholder="ej: Juan Pérez"
                    value={modalForm.paciente_nombre}
                    onChange={(e) => setModalForm({ ...modalForm, paciente_nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">DNI (opcional)</label>
                  <input
                    type="text"
                    placeholder="ej: 34123456"
                    value={modalForm.paciente_dni}
                    onChange={(e) => setModalForm({ ...modalForm, paciente_dni: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md transition"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
