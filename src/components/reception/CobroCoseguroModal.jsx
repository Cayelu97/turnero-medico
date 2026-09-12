import React, { useState, useRef } from 'react';
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
  FileText,
  Receipt,
  FileCheck2,
  Building2,
  Calendar,
  User,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ArcaService } from '../../services/arcaService';
import { formatDateAR } from '../../utils/formatters';

export const CobroCoseguroModal = ({ turno, paciente, obraSocial, plan, practica, onClose }) => {
  const { registrarCobroCoseguro, emitirComprobanteArca, clinica, activeClinica, currentUser } = useApp();
  const printRef = useRef(null);

  const targetClinica = clinica || activeClinica || {};

  // 'FACTURA_ARCA' | 'RECIBO_X'
  const [tipoComprobanteSeleccionado, setTipoComprobanteSeleccionado] = useState('FACTURA_ARCA');
  const [tipoFacturaArca, setTipoFacturaArca] = useState('FACTURA_B'); // 'FACTURA_B' | 'FACTURA_C' | 'FACTURA_A'
  const [medioPago, setMedioPago] = useState('EFECTIVO');
  const [comprobanteNro, setComprobanteNro] = useState(() => `REC-X-${Date.now().toString().slice(-6)}`);
  
  const [comprobanteFiscalEmitido, setComprobanteFiscalEmitido] = useState(null);
  const [reciboNoFiscalEmitido, setReciboNoFiscalEmitido] = useState(null);
  const [cobroExitoso, setCobroExitoso] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const montoACobrar = Number(turno?.monto_coseguro || 0);

  const handleCobrar = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (tipoComprobanteSeleccionado === 'FACTURA_ARCA') {
        // 1. Emitir Comprobante Fiscal ARCA con CAE y QR
        const cbte = await emitirComprobanteArca({
          tipoComprobanteClave: tipoFacturaArca,
          receptor: {
            nombre: `${paciente?.apellido || 'Paciente'}, ${paciente?.nombre || ''}`.trim(),
            doc_tipo: 'DNI',
            doc_nro: paciente?.dni || '0',
            condicion_iva: 'Consumidor Final',
            domicilio: paciente?.domicilio || 'Córdoba Capital'
          },
          concepto: `Coseguro de consulta / sesión médica - ${practica?.descripcion || 'Atención en Consultorio'}`,
          items: [
            {
              descripcion: `Coseguro ${practica?.codigo_pmo ? `[${practica.codigo_pmo}]` : ''} ${practica?.descripcion || 'Consulta Médica'}`,
              cantidad: 1,
              precio_unitario: montoACobrar,
              alicuota_iva: 0
            }
          ],
          condicionVenta: medioPago,
          turnoId: turno?.id,
          pacienteId: paciente?.id
        });

        registrarCobroCoseguro(turno?.id, medioPago, cbte.numero_completo);
        setComprobanteFiscalEmitido(cbte);
      } else {
        // 2. Emitir Recibo X No Fiscal (Interno)
        const reciboX = {
          tipo: 'RECIBO_X',
          titulo: 'RECIBO OFICIAL PROVISORIO (NO FISCAL)',
          letra: 'X',
          numero: comprobanteNro,
          fecha: new Date().toISOString(),
          monto: montoACobrar,
          medio_pago: medioPago,
          paciente_nombre: `${paciente?.apellido || ''}, ${paciente?.nombre || ''}`.trim(),
          paciente_dni: paciente?.dni || 'S/D',
          obra_social: obraSocial?.nombre || 'Particular / Privado',
          plan_nombre: plan?.nombre_plan || '',
          numero_afiliado: paciente?.numero_afiliado || '',
          practica_descripcion: practica?.descripcion || 'Consulta / Sesión Médica',
          emisor_nombre: targetClinica?.nombre || 'Centro de Salud y Psicología San Lucas',
          emisor_cuit: targetClinica?.cuit || '30-71234567-9',
          emisor_direccion: targetClinica?.direccion || 'Av. Colón 1250, Córdoba',
          emitido_por: currentUser?.nombre || 'Recepción y Secretaría'
        };

        registrarCobroCoseguro(turno?.id, medioPago, comprobanteNro);
        setReciboNoFiscalEmitido(reciboX);
      }

      setCobroExitoso(true);
    } catch (err) {
      console.error('Error procesando cobro:', err);
      // Fallback a cobro simple si falla el WS
      registrarCobroCoseguro(turno?.id, medioPago, comprobanteNro);
      setCobroExitoso(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col p-5 sm:p-6 shadow-2xl border border-slate-200 overflow-y-auto my-auto animate-scaleIn">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 leading-tight">
                Cobro de Coseguro & Facturación
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Reserva: <strong className="text-slate-800">{turno?.codigo_reserva}</strong>
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!cobroExitoso ? (
          <form onSubmit={handleCobrar} className="space-y-4 text-xs">
            
            {/* RESUMEN DEL TURNO Y COBERTURA */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Paciente:</span>
                <strong className="text-slate-900 text-sm">{paciente?.apellido}, {paciente?.nombre}</strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">DNI / Afiliado:</span>
                <span className="font-mono font-bold text-slate-700">
                  {paciente?.dni} {paciente?.numero_afiliado ? `• Af: ${paciente.numero_afiliado}` : ''}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Cobertura Médica:</span>
                <strong className="text-slate-900">
                  {obraSocial?.nombre || 'Particular'} {plan?.nombre_plan ? `(${plan.nombre_plan})` : ''}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Práctica / Concepto:</span>
                <span className="text-slate-700 font-bold truncate max-w-[240px]">
                  {practica?.descripcion || 'Consulta Especializada'}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/80 pt-2.5">
                <span className="font-extrabold text-slate-800 text-sm">Monto a Cobrar:</span>
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  ${montoACobrar.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* SELECCIÓN DE MEDIO DE PAGO */}
            <div>
              <label className="block font-black text-slate-800 mb-2 uppercase text-[10px] tracking-wider">
                1. Medio de Pago
              </label>
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
                      className={`p-2.5 rounded-xl border flex items-center gap-2 font-bold transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
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

            {/* SELECCIÓN DE TIPO DE COMPROBANTE: FACTURA ARCA vs RECIBO NO FISCAL */}
            <div className="space-y-2">
              <label className="block font-black text-slate-800 uppercase text-[10px] tracking-wider">
                2. Tipo de Comprobante a Emitir
              </label>

              <div className="grid grid-cols-2 gap-2">
                {/* Opción Factura Electrónica ARCA */}
                <button
                  type="button"
                  onClick={() => setTipoComprobanteSeleccionado('FACTURA_ARCA')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    tipoComprobanteSeleccionado === 'FACTURA_ARCA'
                      ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-black text-xs text-indigo-900 mb-1">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Factura Fiscal ARCA</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Comprobante legal con CAE, Punto de Venta y Código QR reglamentario.
                  </p>
                </button>

                {/* Opción Recibo X No Fiscal */}
                <button
                  type="button"
                  onClick={() => setTipoComprobanteSeleccionado('RECIBO_X')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    tipoComprobanteSeleccionado === 'RECIBO_X'
                      ? 'bg-amber-50/80 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-black text-xs text-amber-900 mb-1">
                    <Receipt className="w-4 h-4 text-amber-600" />
                    <span>Recibo No Fiscal (X)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Comprobante interno "No válido como factura" para pacientes sin requerimiento fiscal.
                  </p>
                </button>
              </div>

              {/* Si se eligió Factura ARCA, mostrar selector de letra / tipo */}
              {tipoComprobanteSeleccionado === 'FACTURA_ARCA' && (
                <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-900">Tipo de Factura:</span>
                    <select
                      value={tipoFacturaArca}
                      onChange={(e) => setTipoFacturaArca(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-indigo-900"
                    >
                      <option value="FACTURA_B">Factura B (Consumidor Final)</option>
                      <option value="FACTURA_C">Factura C (Monotributo / Salud)</option>
                      <option value="FACTURA_A">Factura A (Responsable Inscripto con CUIT)</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-indigo-700 font-mono font-bold bg-white px-2 py-0.5 rounded border border-indigo-200">
                    PV: {String(targetClinica?.punto_venta || 1).padStart(4, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 no-print">
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
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Emitiendo comprobante...' : 'Registrar Cobro'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* =========================================================================
             VISTA POST-COBRO: IMPRESIÓN Y PREVISUALIZACIÓN DE FACTURA ARCA O RECIBO X
             ========================================================================= */
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between no-print p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-black text-emerald-950 text-sm">¡Cobro Registrado con Éxito!</h4>
                  <p className="text-[11px] text-emerald-800">
                    Ingresado a Caja Diaria • {medioPago}
                  </p>
                </div>
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar PDF</span>
              </button>
            </div>

            {/* DOCUMENTO IMPRIMIBLE (A4 / TICKET) */}
            <div ref={printRef} className="border-2 border-slate-800 rounded-2xl p-5 bg-white text-slate-900 space-y-4 print:border-none print:p-0">
              
              {/* ENCABEZADO FISCAL O RECIBO X */}
              {comprobanteFiscalEmitido ? (
                /* FACTURA FISCAL ARCA OFICIAL CON QR */
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 border-b-2 border-slate-800 pb-3 relative">
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 w-10 h-10 bg-white border-2 border-slate-800 rounded-xl flex flex-col items-center justify-center font-black z-10">
                      <span className="text-lg leading-none">{comprobanteFiscalEmitido.letra || 'B'}</span>
                      <span className="text-[7px] text-slate-500 font-bold">COD {String(comprobanteFiscalEmitido.tipo_comprobante_id || 6).padStart(3, '0')}</span>
                    </div>

                    <div className="col-span-6 pr-6 space-y-0.5">
                      <h4 className="font-black text-sm uppercase text-slate-900">{targetClinica?.nombre || 'Centro Médico San Lucas'}</h4>
                      <p className="text-[10px] text-slate-600">{targetClinica?.direccion || 'Av. Colón 1250, Córdoba'}</p>
                      <p className="text-[10px] font-bold text-slate-700">IVA: Responsable Monotributo / Inscripto</p>
                    </div>

                    <div className="col-span-6 pl-6 text-right space-y-0.5">
                      <h4 className="font-black text-sm uppercase text-indigo-900">{comprobanteFiscalEmitido.tipo_comprobante_nombre || 'FACTURA'}</h4>
                      <p className="font-mono font-bold text-xs text-slate-800">N° {comprobanteFiscalEmitido.numero_completo}</p>
                      <p className="text-[10px] text-slate-600">Fecha: {formatDateAR(comprobanteFiscalEmitido.fecha_emision)}</p>
                      <p className="text-[10px] text-slate-600">CUIT: {targetClinica?.cuit || '30-71234567-9'}</p>
                    </div>
                  </div>

                  {/* RECEPTOR */}
                  <div className="grid grid-cols-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px]">
                    <div>
                      <span className="text-slate-400 block font-bold">Receptor / Paciente:</span>
                      <strong className="text-slate-900 text-xs">{paciente?.apellido}, {paciente?.nombre}</strong>
                      <span className="text-slate-600 block">DNI: {paciente?.dni || '0'} • {obraSocial?.nombre || 'Particular'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block font-bold">Condición de Venta:</span>
                      <span className="font-bold text-slate-900">{medioPago}</span>
                    </div>
                  </div>

                  {/* TABLA ITEMS */}
                  <table className="w-full text-[11px] border-collapse border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-1.5 text-left border border-slate-200">Concepto</th>
                        <th className="p-1.5 text-center border border-slate-200">Cant.</th>
                        <th className="p-1.5 text-right border border-slate-200">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-1.5 border border-slate-200">
                          {practica?.descripcion || 'Coseguro / Sesión de Consulta'}
                        </td>
                        <td className="p-1.5 text-center border border-slate-200">1</td>
                        <td className="p-1.5 text-right font-mono font-bold border border-slate-200">
                          ${montoACobrar.toLocaleString('es-AR')}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* PIE FISCAL ARCA: CAE + QR */}
                  <div className="border-t-2 border-slate-800 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {comprobanteFiscalEmitido.qr?.arcaQrUrl ? (
                        <div className="p-1.5 bg-white border border-slate-300 rounded-xl text-center">
                          <QrCode className="w-12 h-12 text-slate-900 mx-auto" />
                          <span className="text-[7px] font-black uppercase text-indigo-900 block">ARCA AFIP QR</span>
                        </div>
                      ) : (
                        <QrCode className="w-10 h-10 text-slate-800" />
                      )}
                      <div className="text-[10px] space-y-0.5">
                        <p className="font-mono font-black text-slate-900">CAE N°: {comprobanteFiscalEmitido.cae}</p>
                        <p className="text-slate-600">Fecha Vto. CAE: {formatDateAR(comprobanteFiscalEmitido.cae_vto)}</p>
                        <p className="text-[9px] text-slate-500">Comprobante Autorizado por ARCA (AFIP)</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Pagado:</span>
                      <span className="text-xl font-black text-emerald-700 font-mono">
                        ${montoACobrar.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* RECIBO X NO FISCAL (INTERNO) */
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 border-b-2 border-slate-800 pb-3 relative">
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 w-10 h-10 bg-white border-2 border-slate-800 rounded-xl flex flex-col items-center justify-center font-black z-10">
                      <span className="text-lg leading-none">X</span>
                      <span className="text-[7px] text-slate-500 font-bold uppercase">NO FISCAL</span>
                    </div>

                    <div className="col-span-6 pr-6 space-y-0.5">
                      <h4 className="font-black text-sm uppercase text-slate-900">{targetClinica?.nombre || 'Centro Médico San Lucas'}</h4>
                      <p className="text-[10px] text-slate-600">{targetClinica?.direccion || 'Av. Colón 1250, Córdoba'}</p>
                      <p className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded inline-block border border-amber-200">
                        DOCUMENTO NO VÁLIDO COMO FACTURA
                      </p>
                    </div>

                    <div className="col-span-6 pl-6 text-right space-y-0.5">
                      <h4 className="font-black text-sm uppercase text-amber-900">RECIBO PROVISORIO X</h4>
                      <p className="font-mono font-bold text-xs text-slate-800">N° {reciboNoFiscalEmitido?.numero || comprobanteNro}</p>
                      <p className="text-[10px] text-slate-600">Fecha: {formatDateAR(new Date().toISOString())}</p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Recibimos de:</span>
                      <strong className="text-slate-900">{paciente?.apellido}, {paciente?.nombre} (DNI: {paciente?.dni})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">En concepto de:</span>
                      <span className="text-slate-800 font-bold">{practica?.descripcion || 'Coseguro de Consulta'} ({obraSocial?.nombre || 'Particular'})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Forma de Pago:</span>
                      <span className="font-bold text-slate-800">{medioPago}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    <div className="text-[10px] text-slate-500">
                      <p>Emitido por: <strong>{currentUser?.nombre || 'Recepción'}</strong></p>
                      <p>Firma / Sello de Caja</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Importe Abonado:</span>
                      <span className="text-xl font-black text-slate-900 font-mono">
                        ${montoACobrar.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BOTÓN FINAL DE CERRAR */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 no-print">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition cursor-pointer"
              >
                Listo / Finalizar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
