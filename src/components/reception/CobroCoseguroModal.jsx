import React, { useState } from 'react';
import { DollarSign, Printer, CheckCircle2, CreditCard, Banknote, Smartphone, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CobroCoseguroModal = ({ turno, paciente, obraSocial, plan, practica, onClose }) => {
  const { registrarCobroCoseguro } = useApp();

  const [medioPago, setMedioPago] = useState('EFECTIVO');
  const [comprobanteNro, setComprobanteNro] = useState(() => `REC-${Date.now().toString().slice(-6)}`);
  const [cobroExitoso, setCobroExitoso] = useState(false);

  const handleCobrar = (e) => {
    e.preventDefault();
    registrarCobroCoseguro(turno.id, medioPago, comprobanteNro);
    setCobroExitoso(true);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 no-print">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Cobro de Coseguro en Caja</h3>
              <span className="text-xs text-slate-500 font-mono">{turno.codigo_reserva}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!cobroExitoso ? (
          <form onSubmit={handleCobrar} className="space-y-4">
            {/* Detalle del Monto */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Paciente:</span>
                <strong className="text-slate-900">{paciente?.apellido}, {paciente?.nombre}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Cobertura:</span>
                <strong className="text-slate-900">{obraSocial?.nombre} {plan ? `(${plan.nombre_plan})` : ''}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Práctica:</span>
                <span className="text-slate-700 font-medium">{practica?.descripcion}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/80 pt-2">
                <span className="text-xs font-bold text-slate-800">Total a Cobrar:</span>
                <span className="text-2xl font-black text-emerald-700">
                  ${Number(turno.monto_coseguro || 0).toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Medio de Pago */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Seleccione Medio de Pago:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                  { id: 'DEBITO', label: 'Tarjeta Débito', icon: CreditCard },
                  { id: 'MERCADOPAGO', label: 'Mercado Pago / QR', icon: Smartphone },
                  { id: 'TRANSFERENCIA', label: 'Transferencia', icon: DollarSign }
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = medioPago === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMedioPago(m.id)}
                      className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition ${
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">N° de Recibo / Comprobante</label>
              <input
                type="text"
                required
                value={comprobanteNro}
                onChange={(e) => setComprobanteNro(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
              >
                Confirmar Cobro
              </button>
            </div>
          </form>
        ) : (
          /* Recibo Emitido */
          <div className="space-y-4 text-center">
            <div id="printable-area" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2">
              <div className="text-center pb-2 border-b border-slate-200">
                <h4 className="font-extrabold text-sm text-slate-900">RECIBO DE COSEGURO</h4>
                <p className="text-[10px] text-slate-500">Centro Médico San Lucas - CUIT: 30-71234567-9</p>
                <p className="font-mono font-bold text-slate-800 mt-1">{comprobanteNro}</p>
              </div>

              <div className="space-y-1 pt-1">
                <div><strong>Fecha:</strong> {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</div>
                <div><strong>Paciente:</strong> {paciente?.apellido}, {paciente?.nombre} (DNI: {paciente?.dni})</div>
                <div><strong>Cobertura:</strong> {obraSocial?.nombre} {plan ? `(${plan.nombre_plan})` : ''}</div>
                <div><strong>Práctica:</strong> {practica?.descripcion}</div>
                <div><strong>Medio de Pago:</strong> {medioPago}</div>
                <div className="text-base font-black text-emerald-800 pt-2 border-t border-slate-200">
                  Total Abonado: ${Number(turno.monto_coseguro || 0).toLocaleString('es-AR')}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 no-print">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Recibo</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
