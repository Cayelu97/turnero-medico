import React, { useRef } from 'react';
import { Printer, Download, X, CheckCircle2, ShieldCheck, QrCode, FileText } from 'lucide-react';
import { formatDateAR } from '../../utils/formatters';

export const ComprobanteArcaModal = ({ comprobante, onClose }) => {
  const printRef = useRef(null);

  if (!comprobante) return null;

  const handlePrint = () => {
    window.print();
  };

  const emisor = comprobante.emisor || {};
  const receptor = comprobante.receptor || {};
  const items = comprobante.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-6">
        
        {/* Barra superior de control (no visible en impresión) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                Comprobante Electrónico Oficial ARCA (AFIP)
              </h3>
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> CAE Aprobado: {comprobante.cae}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PLANTILLA OFICIAL FACTURA ELECTRÓNICA AFIP/ARCA (A4) */}
        <div ref={printRef} className="border-2 border-slate-800 rounded-2xl p-6 bg-white text-slate-900 text-xs font-sans space-y-5 print:border-none print:p-0">
          
          {/* HEADER FISCAL */}
          <div className="grid grid-cols-12 gap-2 border-b-2 border-slate-800 pb-4 relative">
            
            {/* Letra del Comprobante (A, B, C) */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-12 h-12 bg-white border-2 border-slate-800 rounded-xl flex flex-col items-center justify-center font-black shadow-xs z-10">
              <span className="text-xl leading-none">{comprobante.letra || 'C'}</span>
              <span className="text-[8px] uppercase tracking-tighter text-slate-500 font-bold">
                COD. {String(comprobante.tipo_comprobante_id || '11').padStart(3, '0')}
              </span>
            </div>

            {/* Datos del Emisor (Izquierda) */}
            <div className="col-span-6 pr-8 space-y-1">
              <h4 className="text-base font-black tracking-tight text-slate-900 uppercase">
                {emisor.razon_social || 'Centro de Salud y Psicología San Lucas'}
              </h4>
              <p className="text-[11px] text-slate-600 font-medium">
                {emisor.domicilio || 'Av. Colón 1250, Córdoba Capital, Córdoba'}
              </p>
              <p className="text-[11px] font-bold text-slate-700">
                Condición frente al IVA: <span className="font-extrabold">{emisor.condicion_iva === 'RI' ? 'IVA Responsable Inscripto' : 'Responsable Monotributo'}</span>
              </p>
            </div>

            {/* Datos del Comprobante (Derecha) */}
            <div className="col-span-6 pl-8 space-y-1 text-right">
              <h4 className="text-base font-black text-slate-900 uppercase">
                {comprobante.tipo_comprobante_nombre || 'FACTURA C'}
              </h4>
              <p className="text-sm font-black font-mono text-indigo-700">
                N° {comprobante.numero_completo || '00001-00000001'}
              </p>
              <p className="text-[11px] text-slate-700 font-bold">
                Fecha de Emisión: <span className="font-extrabold">{formatDateAR(comprobante.fecha_emision)}</span>
              </p>
              <p className="text-[10px] text-slate-600">
                CUIT: <span className="font-mono font-bold">{emisor.cuit || '30-71234567-9'}</span>
              </p>
              <p className="text-[10px] text-slate-600">
                Ingresos Brutos: <span className="font-mono font-bold">{emisor.iibb || '28490182-9'}</span>
              </p>
              <p className="text-[10px] text-slate-600">
                Inicio de Actividades: <span className="font-bold">{emisor.inicio_actividades || '01/03/2021'}</span>
              </p>
            </div>
          </div>

          {/* PERÍODO FACTURADO Y CONCEPTOS */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[10px] font-semibold text-slate-700">
            <div>
              <span className="text-slate-400 block font-bold">Período Facturado Desde:</span>
              <span>{formatDateAR(comprobante.periodo_desde || comprobante.fecha_emision)}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold">Hasta:</span>
              <span>{formatDateAR(comprobante.periodo_hasta || comprobante.fecha_emision)}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold">Fecha Vto. para el Pago:</span>
              <span className="font-bold text-slate-900">{formatDateAR(comprobante.fecha_vto_pago || comprobante.fecha_emision)}</span>
            </div>
          </div>

          {/* DATOS DEL RECEPTOR */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <p className="text-slate-500 font-medium">Receptor / Paciente:</p>
              <p className="font-black text-slate-900 text-xs">{receptor.nombre || 'Consumidor Final'}</p>
              <p className="text-slate-600">
                {receptor.doc_tipo || 'DNI'}: <span className="font-mono font-bold">{receptor.doc_nro || '0'}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-medium">Condición de Venta:</p>
              <p className="font-bold text-slate-900">{comprobante.condicion_venta || 'Contado / Efectivo'}</p>
              <p className="text-slate-600 font-medium">
                Condición IVA: <span className="font-bold">{receptor.condicion_iva || 'Consumidor Final'}</span>
              </p>
            </div>
          </div>

          {/* TABLA DE ÍTEMS */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] uppercase font-black text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Código / Descripción</th>
                  <th className="px-3 py-2 text-center">Cantidad</th>
                  <th className="px-3 py-2 text-right">Precio Unitario</th>
                  {comprobante.letra === 'A' && <th className="px-3 py-2 text-right">Alíc. IVA</th>}
                  <th className="px-3 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {items.length === 0 ? (
                  <tr>
                    <td className="px-3 py-2 text-slate-800 font-bold">
                      {comprobante.concepto || 'Servicios Profesionales de Psicología / Salud'}
                    </td>
                    <td className="px-3 py-2 text-center font-mono">1</td>
                    <td className="px-3 py-2 text-right font-mono font-bold">
                      ${Number(comprobante.importe_total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-indigo-900">
                      ${Number(comprobante.importe_total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-bold text-slate-800">
                        {it.descripcion}
                      </td>
                      <td className="px-3 py-2 text-center font-mono">{it.cantidad || 1}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        ${Number(it.precio_unitario || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      {comprobante.letra === 'A' && (
                        <td className="px-3 py-2 text-right font-mono text-[10px] text-slate-500">
                          {it.alicuota_iva || 21}%
                        </td>
                      )}
                      <td className="px-3 py-2 text-right font-mono font-bold text-indigo-900">
                        ${(Number(it.cantidad || 1) * Number(it.precio_unitario || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TOTALES */}
          <div className="flex justify-end pt-2">
            <div className="w-64 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              {comprobante.letra === 'A' && (
                <>
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Importe Neto Gravado:</span>
                    <span className="font-mono">${Number(comprobante.subtotal_neto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>IVA (21% / 10.5%):</span>
                    <span className="font-mono">${Number(comprobante.total_iva || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>Importe Total:</span>
                <span className="font-mono text-indigo-700">
                  ${Number(comprobante.importe_total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* PIE DE PÁGINA OFICIAL ARCA (AFIP) CON CAE Y QR REGLAMENTARIO */}
          <div className="border-t-2 border-slate-800 pt-4 grid grid-cols-12 gap-4 items-center">
            {/* QR Oficial Interactivo */}
            <div className="col-span-3 flex flex-col items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-200">
              <a 
                href={comprobante.qr_url || `https://www.afip.gob.ar/fe/qr/`} 
                target="_blank" 
                rel="noreferrer"
                className="flex flex-col items-center group cursor-pointer"
                title="Escanear o hacer clic para verificar en ARCA / AFIP"
              >
                <div className="w-20 h-20 bg-white border border-slate-300 rounded-lg flex items-center justify-center shadow-2xs group-hover:border-indigo-500 transition">
                  <QrCode className="w-16 h-16 text-slate-900 group-hover:text-indigo-600 transition" />
                </div>
                <span className="text-[9px] font-extrabold text-indigo-700 mt-1 uppercase tracking-tighter group-hover:underline">
                  Verificar en ARCA
                </span>
              </a>
            </div>

            {/* CAE y Vencimiento */}
            <div className="col-span-9 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-slate-900 tracking-wide">CAE N°:</span>
                <span className="font-mono font-black text-indigo-700 text-sm tracking-wider">
                  {comprobante.cae || '74192849018293'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Fecha de Vencimiento de CAE:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatDateAR(comprobante.cae_vto)}
                </span>
              </div>
              <div className="text-[9px] text-slate-400 leading-tight pt-1">
                Comprobante Electrónico emitido bajo normativa de la Agencia de Recaudación y Control Aduanero (ARCA / Ex-AFIP) - RG 4291 / 5003.
                {comprobante.entorno === 'SANDBOX' && (
                  <span className="block font-bold text-amber-700 mt-0.5">
                    [MODO HOMOLOGACIÓN / AMBIENTE DE PRUEBAS FISCALES]
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
