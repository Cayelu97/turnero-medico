import React, { useState } from 'react';
import { 
  DollarSign, 
  Printer, 
  CheckCircle2, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  X, 
  ShieldCheck, 
  QrCode,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateAR } from '../../utils/formatters';

export const CobroCoseguroModal = ({ turno, paciente, obraSocial, plan, practica, onClose }) => {
  const { registrarCobroCoseguro, emitirComprobanteArca, clinica } = useApp();

  const [medioPago, setMedioPago] = useState('EFECTIVO');
  const [comprobanteNro, setComprobanteNro] = useState(() => `REC-${Date.now().toString().slice(-6)}`);
  const [emitirFacturaArca, setEmitirFacturaArca] = useState(true);
  const [comprobanteEmitido, setComprobanteEmitido] = useState(null);
  const [cobroExitoso, setCobroExitoso] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCobrar = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      registrarCobroCoseguro(turno.id, medioPago, comprobanteNro);

      if (emitirFacturaArca) {
        const cbte = await emitirComprobanteArca({
          tipoComprobanteClave: 'FACTURA_B',
          receptor: {
            nombre: `${paciente?.apellido}, ${paciente?.nombre}`,
            doc_tipo: 'DNI',
            doc_nro: paciente?.dni || '0',
            condicion_iva: 'Consumidor Final',
            domicilio: 'Córdoba'
          },
          concepto: `Coseguro de consulta / sesión - ${practica?.descripcion || 'Atención en Consultorio'}`,
          items: [
            {
              descripcion: `Coseguro ${practica?.codigo_pmo || ''} - ${practica?.descripcion || 'Consulta'}`,
              cantidad: 1,
              precio_unitario: Number(turno.monto_coseguro || 0),
              alicuota_iva: 0
            }
          ],
          condicionVenta: medioPago,
          turnoId: turno.id,
          pacienteId: paciente?.id
        });
        setComprobanteEmitido(cbte);
      }

      setCobroExitoso(true);
    } catch (err) {
      console.error(err);
      setCobroExitoso(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 no-print">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Cobro de Coseguro / Sesión en Caja</h3>
              <span className="text-xs text-slate-500 font-mono">{turno.codigo_reserva}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!cobroExitoso ? (
          <form onSubmit={handleCobrar} className="space-y-4 text-xs">
            {/* Detalle del Monto */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Paciente:</span>
                <strong className="text-slate-900">{paciente?.apellido}, {paciente?.nombre}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Cobertura:</span>
                <strong className="text-slate-900">{obraSocial?.nombre} {plan ? `(${plan.nombre_plan})` : ''}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Práctica:</span>
                <span className="text-slate-700 font-medium truncate max-w-[200px]">{practica?.descripcion}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/80 pt-2">
                <span className="font-bold text-slate-800">Total a Cobrar:</span>
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  ${Number(turno.monto_coseguro || 0).toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Medio de Pago */}
            <div>
              <label className="block font-bold text-slate-700 mb-2">Seleccione Medio de Pago:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                  { id: 'MERCADOPAGO', label: 'Mercado Pago / QR', icon: Smartphone },
                  { id: 'DEBITO', label: 'Tarjeta Débito', icon: CreditCard },
                  { id: 'TRANSFERENCIA', label: 'Transferencia', icon: DollarSign }
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = medioPago === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMedioPago(m.id)}
                      className={`p-3 rounded-xl border flex items-center gap-2 font-bold transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Facturación Electrónica ARCA */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
              <label className="flex items-center gap-2 font-bold text-indigo-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emitirFacturaArca}
                  onChange={(e) => setEmitirFacturaArca(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Emitir Factura Electrónica ARCA (AFIP) con CAE
                </span>
              </label>
              <p className="text-[10px] text-indigo-700 pl-6">
                Genera comprobante fiscal legal oficial con código QR y validación fiscal en tiempo real.
              </p>
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                {isSubmitting ? 'Emitiendo en ARCA...' : 'Confirmar Cobro'}
              </button>
            </div>
          </form>
        ) : (
          /* RECIBO / FACTURA EMITIDA */
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900">¡Cobro Registrado con Éxito!</h4>
              {comprobanteEmitido ? (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-left text-xs space-y-1">
                  <div className="flex justify-between font-bold text-emerald-950">
                    <span>{comprobanteEmitido.tipo_comprobante_nombre}:</span>
                    <span className="font-mono">{comprobanteEmitido.numero_completo}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-800">
                    <span>CAE ARCA:</span>
                    <span className="font-mono font-bold">{comprobanteEmitido.cae}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Vencimiento CAE:</span>
                    <span>{formatDateAR(comprobanteEmitido.cae_vto)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-1">Comprobante N° {comprobanteNro}</p>
              )}
            </div>

            <div className="flex justify-center gap-2 pt-2 border-t border-slate-100 no-print">
              <button
                onClick={handlePrintReceipt}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Recibo</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Listo / Cerrar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
