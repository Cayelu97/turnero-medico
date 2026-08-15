import React, { useState } from 'react';
import { 
  X, 
  DollarSign, 
  Plus, 
  CreditCard, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  Building,
  TrendingDown,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { formatDateAR } from '../../utils/formatters';

export const CuentaCorrienteModal = ({ paciente, obraSocial, onClose }) => {
  const { 
    saveMovimientoCtaCtePaciente, 
    saveMovimientoCtaCteOs, 
    emitirComprobanteArca,
    activeClinica 
  } = useApp();

  const isPaciente = Boolean(paciente);
  const title = isPaciente 
    ? `Cuenta Corriente: ${paciente.apellido}, ${paciente.nombre} (DNI: ${paciente.dni})`
    : `Cuenta Corriente: ${obraSocial?.nombre} (${obraSocial?.sigla})`;

  // Movimientos actuales
  const [movimientos, setMovimientos] = useState(() => {
    if (isPaciente) {
      return StorageService.getMovimientosCtaCtePaciente(paciente.id);
    } else {
      return StorageService.getMovimientosCtaCteOs(obraSocial.id);
    }
  });

  const [showNuevoPagoForm, setShowNuevoPagoForm] = useState(false);
  const [form, setForm] = useState({
    tipo: 'PAGO', // 'CARGO' | 'PAGO'
    concepto: isPaciente ? 'Abono Mensual de 4 Sesiones de Psicoterapia' : 'Cobranza de Liquidación por Transferencia',
    monto: 60000,
    medio_pago: 'MERCADOPAGO', // 'EFECTIVO' | 'TRANSFERENCIA' | 'MERCADOPAGO' | 'DEBITO' | 'CREDITO'
    numero_comprobante: '',
    emitir_factura_arca: true,
    observaciones: ''
  });

  // Cálculo del saldo
  const saldoActual = movimientos.reduce((sum, m) => {
    if (m.tipo === 'CARGO') return sum + Number(m.monto || 0);
    if (m.tipo === 'PAGO') return sum - Number(m.monto || 0);
    return sum;
  }, 0);

  const handleRegistrarPago = async (e) => {
    e.preventDefault();
    const montoNum = Number(form.monto || 0);
    if (montoNum <= 0) return;

    let savedMov;
    if (isPaciente) {
      savedMov = saveMovimientoCtaCtePaciente({
        paciente_id: paciente.id,
        paciente_nombre: `${paciente.apellido}, ${paciente.nombre}`,
        tipo: form.tipo,
        concepto: form.concepto,
        monto: montoNum,
        medio_pago: form.medio_pago,
        numero_comprobante: form.numero_comprobante || `REC-${Date.now().toString().slice(-5)}`,
        observaciones: form.observaciones
      });
      setMovimientos(StorageService.getMovimientosCtaCtePaciente(paciente.id));
    } else {
      savedMov = saveMovimientoCtaCteOs({
        obra_social_id: obraSocial.id,
        obra_social_nombre: obraSocial.nombre,
        tipo: form.tipo,
        concepto: form.concepto,
        monto: montoNum,
        medio_pago: form.medio_pago,
        numero_comprobante: form.numero_comprobante || `TRANSF-${Date.now().toString().slice(-5)}`,
        observaciones: form.observaciones
      });
      setMovimientos(StorageService.getMovimientosCtaCteOs(obraSocial.id));
    }

    // Emisión de Factura ARCA si se solicitó
    if (form.emitir_factura_arca && form.tipo === 'PAGO') {
      try {
        await emitirComprobanteArca({
          tipoComprobanteClave: 'FACTURA_C',
          receptor: {
            nombre: isPaciente ? `${paciente.apellido}, ${paciente.nombre}` : obraSocial.nombre,
            doc_tipo: isPaciente ? 'DNI' : 'CUIT',
            doc_nro: isPaciente ? (paciente.dni || '0') : (obraSocial.cuit?.replace(/[^0-9]/g, '') || '0'),
            condicion_iva: isPaciente ? 'Consumidor Final' : 'IVA Responsable Inscripto',
            domicilio: 'Córdoba'
          },
          concepto: form.concepto,
          items: [
            {
              descripcion: form.concepto,
              cantidad: 1,
              precio_unitario: montoNum,
              alicuota_iva: 0
            }
          ],
          condicionVenta: form.medio_pago,
          pacienteId: isPaciente ? paciente.id : null,
          obraSocialId: !isPaciente ? obraSocial.id : null
        });
      } catch (err) {
        console.error('Error emitiendo factura ARCA del pago:', err);
      }
    }

    setShowNuevoPagoForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
              {isPaciente ? <User className="w-5 h-5" /> : <Building className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                {title}
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Estado de cuenta, historial de cobros y comprobantes fiscales
              </span>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TARJETA DE SALDO Y BOTÓN REGISTRAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div>
            <span className="text-xs font-bold text-slate-500">Saldo Corriente:</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-2xl font-black font-mono ${
                saldoActual > 0 ? 'text-rose-600' : saldoActual < 0 ? 'text-emerald-600' : 'text-slate-800'
              }`}>
                ${Math.abs(saldoActual).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                saldoActual > 0 ? 'bg-rose-100 text-rose-800' : saldoActual < 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {saldoActual > 0 ? 'Adeuda / Saldo Pendiente' : saldoActual < 0 ? 'Saldo a Favor' : 'Al Día ($0)'}
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowNuevoPagoForm(!showNuevoPagoForm)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showNuevoPagoForm ? 'Cerrar Formulario' : 'Registrar Pago / Cargo'}</span>
            </button>
          </div>
        </div>

        {/* FORMULARIO DE NUEVO PAGO / CARGO */}
        {showNuevoPagoForm && (
          <form onSubmit={handleRegistrarPago} className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-4 text-xs">
            <h4 className="font-black text-indigo-950 text-sm">Registrar Nuevo Movimiento</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Movimiento *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PAGO">🟢 PAGO / INGRESO (Resta de la deuda)</option>
                  <option value="CARGO">🔴 CARGO / PRESTACIÓN (Suma a la deuda)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Monto ($) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-indigo-700 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Medio de Pago</label>
                <select
                  value={form.medio_pago}
                  onChange={(e) => setForm({ ...form, medio_pago: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="MERCADOPAGO">Mercado Pago / QR</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="EFECTIVO">Efectivo en Mostrador</option>
                  <option value="DEBITO">Tarjeta de Débito</option>
                  <option value="CREDITO">Tarjeta de Crédito</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Concepto *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Abono mensual de 4 sesiones de psicología"
                  value={form.concepto}
                  onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.emitir_factura_arca}
                    onChange={(e) => setForm({ ...form, emitir_factura_arca: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Emitir Factura Electrónica ARCA (AFIP) con CAE</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNuevoPagoForm(false)}
                className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                Guardar Movimiento
              </button>
            </div>
          </form>
        )}

        {/* LISTADO DE MOVIMIENTOS HISTÓRICOS */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-slate-800">Historial de Transacciones</h4>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Concepto</th>
                  <th className="px-3 py-2">Medio</th>
                  <th className="px-3 py-2">N° Comprobante</th>
                  <th className="px-3 py-2 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-400 font-medium">
                      No hay movimientos registrados en la cuenta corriente.
                    </td>
                  </tr>
                ) : (
                  movimientos.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">{formatDateAR(m.fecha)}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">{m.concepto}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-600">{m.medio_pago || 'Efectivo'}</td>
                      <td className="px-3 py-2.5 font-mono text-indigo-700 font-semibold">{m.numero_comprobante || '-'}</td>
                      <td className={`px-3 py-2.5 text-right font-mono font-black ${
                        m.tipo === 'PAGO' ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {m.tipo === 'PAGO' ? '-' : '+'}${Number(m.monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
