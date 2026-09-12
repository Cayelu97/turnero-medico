import React, { useState, useEffect, useRef } from 'react';
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
  Receipt, 
  Building2, 
  Calendar, 
  User, 
  Info,
  Edit3,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ArcaService } from '../../services/arcaService';
import { formatDateAR } from '../../utils/formatters';

export const CobroCoseguroModal = ({ 
  isOpen = true, 
  turno, 
  paciente, 
  obraSocial, 
  plan, 
  practica, 
  profesional,
  onClose,
  onCobrado 
}) => {
  const { 
    registrarCobroCoseguro, 
    emitirComprobanteArca, 
    clinicas, 
    activeClinica, 
    clinica, 
    currentUser 
  } = useApp();

  const printAreaRef = useRef(null);

  // Determinar la clínica / sede emisora
  const allClinicas = clinicas || [];
  const targetClinica = (turno?.clinica_id ? allClinicas.find(c => c.id === turno.clinica_id) : null) 
    || activeClinica 
    || clinica 
    || allClinicas[0] 
    || {
      nombre: 'Sede Central - Aipaa 355',
      cuit: '27-33445566-4',
      condicion_iva: 'MONO',
      punto_venta: 1,
      direccion: 'Aipaa 355, Córdoba Capital'
    };

  const emisorCondicionIva = targetClinica?.condicion_iva || 'MONO';

  // Monto a cobrar (inicialmente el coseguro del turno)
  const [montoACobrar, setMontoACobrar] = useState(() => Number(turno?.monto_coseguro || 0));

  // Medio de Pago
  const [medioPago, setMedioPago] = useState('EFECTIVO');

  // Tipo de Comprobante: 'FACTURA_ARCA' | 'RECIBO_X'
  const [tipoComprobanteSeleccionado, setTipoComprobanteSeleccionado] = useState('FACTURA_ARCA');

  // Modo de Receptor: Paciente o Tercero/Empresa (Padre, Tutor, Razón Social)
  const [isCustomReceptor, setIsCustomReceptor] = useState(false);
  const [receptorNombre, setReceptorNombre] = useState(() => `${paciente?.apellido || ''}, ${paciente?.nombre || ''}`.trim() || 'Consumidor Final');
  const [receptorDocTipo, setReceptorDocTipo] = useState(() => (paciente?.dni ? 'DNI' : 'DNI'));
  const [receptorDocNro, setReceptorDocNro] = useState(() => paciente?.dni || '');
  const [receptorCondicionIva, setReceptorCondicionIva] = useState('Consumidor Final');
  const [receptorDomicilio, setReceptorDomicilio] = useState(() => paciente?.domicilio || 'Córdoba Capital, Córdoba');

  // Tipo de Factura ARCA propuesta (FACTURA_C, FACTURA_B, FACTURA_A)
  const [tipoFacturaArca, setTipoFacturaArca] = useState('FACTURA_C');
  const [comprobanteNro, setComprobanteNro] = useState(() => `REC-X-${Date.now().toString().slice(-6)}`);

  // Formato de vista/impresión post-cobro: 'A4' | 'TICKET'
  const [formatoImpresion, setFormatoImpresion] = useState('A4');

  // Estados de resultado
  const [comprobanteFiscalEmitido, setComprobanteFiscalEmitido] = useState(null);
  const [reciboNoFiscalEmitido, setReciboNoFiscalEmitido] = useState(null);
  const [cobroExitoso, setCobroExitoso] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // LÓGICA DE PROPUESTA FISCAL AUTOMÁTICA SEGÚN CONDICIÓN ANTE EL IVA DE EMISOR Y RECEPTOR
  useEffect(() => {
    if (emisorCondicionIva === 'MONO') {
      // Monotributistas siempre emiten Factura C
      setTipoFacturaArca('FACTURA_C');
    } else if (emisorCondicionIva === 'RI') {
      // Responsable Inscripto
      if (receptorCondicionIva === 'IVA Responsable Inscripto') {
        setTipoFacturaArca('FACTURA_A');
        if (receptorDocTipo === 'DNI') setReceptorDocTipo('CUIT');
      } else {
        // Consumidor Final, Monotributista o Exento -> Factura B
        setTipoFacturaArca('FACTURA_B');
      }
    } else if (emisorCondicionIva === 'EXENTO') {
      setTipoFacturaArca('FACTURA_C');
    }
  }, [emisorCondicionIva, receptorCondicionIva]);

  // Si cambia el paciente seleccionado, rellenar valores por defecto si no es custom
  useEffect(() => {
    if (!isCustomReceptor && paciente) {
      setReceptorNombre(`${paciente.apellido || ''}, ${paciente.nombre || ''}`.trim() || 'Consumidor Final');
      setReceptorDocNro(paciente.dni || '');
      setReceptorDomicilio(paciente.domicilio || 'Córdoba Capital, Córdoba');
    }
  }, [paciente, isCustomReceptor]);

  const handleCobrar = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    const docNombre = profesional ? `Dr(a). ${profesional.apellido}, ${profesional.nombre}` : (turno?.profesional_nombre || 'Profesional de la Salud');
    const conceptoDetalle = `Coseguro de consulta / sesión médica - ${practica?.descripcion || 'Atención en Consultorio'} (${docNombre})`;

    try {
      if (tipoComprobanteSeleccionado === 'FACTURA_ARCA') {
        // 1. Emitir Comprobante Fiscal ARCA oficial con CAE y QR
        const cbte = await emitirComprobanteArca({
          clinica: targetClinica,
          tipoComprobanteClave: tipoFacturaArca,
          receptor: {
            nombre: receptorNombre.trim() || 'Consumidor Final',
            doc_tipo: receptorDocTipo,
            doc_nro: receptorDocNro || '0',
            condicion_iva: receptorCondicionIva,
            domicilio: receptorDomicilio || 'Córdoba'
          },
          concepto: conceptoDetalle,
          items: [
            {
              descripcion: `Coseguro ${practica?.codigo_pmo ? `[${practica.codigo_pmo}]` : ''} ${practica?.descripcion || 'Consulta Médica'}`,
              cantidad: 1,
              precio_unitario: Number(montoACobrar),
              alicuota_iva: tipoFacturaArca === 'FACTURA_A' ? 21 : 0
            }
          ],
          condicionVenta: medioPago,
          turnoId: turno?.id,
          pacienteId: paciente?.id,
          obraSocialId: obraSocial?.id || turno?.obra_social_id
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
          monto: Number(montoACobrar),
          medio_pago: medioPago,
          receptor_nombre: receptorNombre.trim(),
          receptor_doc_tipo: receptorDocTipo,
          receptor_doc_nro: receptorDocNro,
          receptor_condicion_iva: receptorCondicionIva,
          receptor_domicilio: receptorDomicilio,
          paciente_nombre: `${paciente?.apellido || ''}, ${paciente?.nombre || ''}`.trim(),
          paciente_dni: paciente?.dni || 'S/D',
          obra_social: obraSocial?.nombre || turno?.obra_social_nombre || 'Particular / Privado',
          plan_nombre: plan?.nombre_plan || turno?.plan_nombre || '',
          numero_afiliado: paciente?.numero_afiliado || '',
          practica_descripcion: practica?.descripcion || 'Consulta / Sesión Médica',
          profesional_nombre: docNombre,
          emisor_nombre: targetClinica?.nombre || 'Sede Central de Atención Médica',
          emisor_cuit: targetClinica?.cuit || '30-71829340-9',
          emisor_direccion: targetClinica?.direccion || 'Av. Colón 1250, Córdoba',
          emitido_por: currentUser?.nombre || 'Recepción y Secretaría'
        };

        registrarCobroCoseguro(turno?.id, medioPago, comprobanteNro);
        setReciboNoFiscalEmitido(reciboX);
      }

      setCobroExitoso(true);
      if (onCobrado) onCobrado();
    } catch (err) {
      console.error('Error procesando cobro:', err);
      // Fallback a cobro simple si falla el WS
      registrarCobroCoseguro(turno?.id, medioPago, comprobanteNro);
      setCobroExitoso(true);
      if (onCobrado) onCobrado();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función de impresión estándar
  const handlePrintDocument = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col p-4 sm:p-6 shadow-2xl border border-slate-200 overflow-y-auto my-auto animate-scaleIn">
        
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200 shadow-2xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 leading-tight">
                Cobro de Coseguro & Facturación
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="font-mono font-bold text-slate-700">
                  Reserva: {turno?.codigo_reserva || 'S/D'}
                </span>
                <span>•</span>
                <span className="font-semibold text-slate-600 truncate max-w-[200px]">
                  📍 {targetClinica?.nombre}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!cobroExitoso ? (
          /* =========================================================================
             FORMULARIO PREVIO AL COBRO: RECEPTOR, IVA, FACTURA ARCA Y MEDIO DE PAGO
             ========================================================================= */
          <form onSubmit={handleCobrar} className="space-y-4 text-xs">
            
            {/* RESUMEN DEL TURNO Y COBERTURA */}
            <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Paciente / Titular:</span>
                <strong className="text-slate-900 text-xs sm:text-sm">
                  {paciente?.apellido}, {paciente?.nombre}
                </strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">DNI / Credencial:</span>
                <span className="font-mono font-bold text-slate-700">
                  {paciente?.dni || 'S/D'} {paciente?.numero_afiliado ? `• Afiliado: ${paciente.numero_afiliado}` : ''}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Cobertura Médica:</span>
                <strong className="text-slate-900 bg-sky-50 text-sky-900 px-2 py-0.5 rounded-lg border border-sky-200 text-[11px]">
                  {obraSocial?.nombre || turno?.obra_social_nombre || 'Particular'} 
                  {(plan?.nombre_plan || turno?.plan_nombre) ? ` (${plan?.nombre_plan || turno?.plan_nombre})` : ''}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Práctica / Concepto:</span>
                <span className="text-slate-700 font-bold truncate max-w-[260px]">
                  {practica?.descripcion || 'Consulta Especializada'}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/80 pt-2">
                <div>
                  <span className="font-extrabold text-slate-800 text-xs block">Monto a Cobrar ($):</span>
                  <span className="text-[10px] text-slate-500 font-medium">Coseguro acordado en agenda</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={montoACobrar}
                    onChange={(e) => setMontoACobrar(Math.max(0, Number(e.target.value)))}
                    className="w-28 sm:w-32 px-2.5 py-1 text-right text-lg sm:text-xl font-black text-emerald-700 font-mono bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* SELECCIÓN DE MEDIO DE PAGO */}
            <div>
              <label className="block font-black text-slate-800 mb-1.5 uppercase text-[10px] tracking-wider">
                1. Medio de Pago
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold transition cursor-pointer text-center ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="text-[11px] leading-tight">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SELECCIÓN DE TIPO DE COMPROBANTE: FACTURA ARCA vs RECIBO X */}
            <div className="space-y-2">
              <label className="block font-black text-slate-800 uppercase text-[10px] tracking-wider">
                2. Tipo de Comprobante
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Opción Factura Electrónica ARCA */}
                <button
                  type="button"
                  onClick={() => setTipoComprobanteSeleccionado('FACTURA_ARCA')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    tipoComprobanteSeleccionado === 'FACTURA_ARCA'
                      ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-black text-xs text-indigo-900 mb-0.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Factura Electrónica Fiscal ARCA</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Comprobante fiscal con CAE, Punto de Venta y Código QR oficial AFIP / ARCA.
                  </p>
                </button>

                {/* Opción Recibo X No Fiscal */}
                <button
                  type="button"
                  onClick={() => setTipoComprobanteSeleccionado('RECIBO_X')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    tipoComprobanteSeleccionado === 'RECIBO_X'
                      ? 'bg-amber-50/90 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-black text-xs text-amber-900 mb-0.5">
                    <Receipt className="w-4 h-4 text-amber-600" />
                    <span>Recibo Provisorio X (No Fiscal)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Comprobante interno "No válido como factura" para cobros directos sin CAE.
                  </p>
                </button>
              </div>
            </div>

            {/* DATOS DEL RECEPTOR / CLIENTE ANTE EL IVA (EDITABLE PARA PADRE / CUIT / EMPRESA) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-600" />
                  <span className="font-black text-slate-800 text-[11px] uppercase tracking-wider">
                    3. Datos del Receptor / Cliente ante el IVA
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomReceptor(!isCustomReceptor)}
                  className="text-[10px] text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  {isCustomReceptor ? 'Restaurar paciente' : 'Facturar a padre / empresa'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Nombre / Razón Social */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Nombre / Razón Social:
                  </label>
                  <input
                    type="text"
                    value={receptorNombre}
                    onChange={(e) => {
                      setReceptorNombre(e.target.value);
                      setIsCustomReceptor(true);
                    }}
                    placeholder="Ej: Pérez Juan o Empresa SRL"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Condición Frente al IVA del Receptor */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Condición Frente al IVA:
                  </label>
                  <select
                    value={receptorCondicionIva}
                    onChange={(e) => setReceptorCondicionIva(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Consumidor Final">Consumidor Final</option>
                    <option value="IVA Responsable Inscripto">IVA Responsable Inscripto</option>
                    <option value="Responsable Monotributo">Responsable Monotributo</option>
                    <option value="IVA Exento">IVA Exento</option>
                  </select>
                </div>

                {/* Tipo de Documento y Número */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Tipo Doc:
                    </label>
                    <select
                      value={receptorDocTipo}
                      onChange={(e) => setReceptorDocTipo(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      <option value="DNI">DNI</option>
                      <option value="CUIT">CUIT</option>
                      <option value="CUIL">CUIL</option>
                      <option value="PASAPORTE">Pasap.</option>
                      <option value="SIN_DOC">S/Doc</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Nro. Documento / CUIT:
                    </label>
                    <input
                      type="text"
                      value={receptorDocNro}
                      onChange={(e) => {
                        setReceptorDocNro(e.target.value);
                        setIsCustomReceptor(true);
                      }}
                      placeholder="Ej: 30-12345678-9"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Domicilio */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Domicilio Fiscal:
                  </label>
                  <input
                    type="text"
                    value={receptorDomicilio}
                    onChange={(e) => setReceptorDomicilio(e.target.value)}
                    placeholder="Ej: Av. Colón 1250, Córdoba"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* PROPUESTA AUTOMÁTICA INTELIGENTE DE TIPO DE FACTURA */}
              {tipoComprobanteSeleccionado === 'FACTURA_ARCA' && (
                <div className="mt-2 p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-black text-indigo-950">
                      <span>Tipo de Factura Propuesta:</span>
                      <select
                        value={tipoFacturaArca}
                        onChange={(e) => setTipoFacturaArca(e.target.value)}
                        className="px-2 py-0.5 bg-white border border-indigo-400 rounded-lg text-xs font-black text-indigo-900"
                      >
                        <option value="FACTURA_C">Factura C (Monotributo / Salud)</option>
                        <option value="FACTURA_B">Factura B (Consumidor Final / Monotributo)</option>
                        <option value="FACTURA_A">Factura A (Resp. Inscripto con CUIT)</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-indigo-800 font-medium">
                      {emisorCondicionIva === 'MONO'
                        ? '💡 Emisor Monotributista: Propone Factura C a todo receptor conforme normativa AFIP/ARCA.'
                        : receptorCondicionIva === 'IVA Responsable Inscripto'
                          ? '💡 Emisor RI a Receptor RI: Propone Factura A discriminando alícuota de IVA.'
                          : '💡 Emisor RI a Consumidor Final / Monotributo: Propone Factura B.'}
                    </p>
                  </div>
                  <span className="text-[10px] text-indigo-900 font-mono font-bold bg-white px-2 py-1 rounded-lg border border-indigo-200 shrink-0 text-center">
                    PV: {String(targetClinica?.punto_venta || 1).padStart(4, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 no-print">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || montoACobrar < 0}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Emitiendo comprobante...' : 'Registrar Cobro e Imprimir'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* =========================================================================
             VISTA POST-COBRO: PREVISUALIZACIÓN DE FACTURA ARCA / RECIBO X Y PDF
             ========================================================================= */
          <div className="space-y-3.5 text-xs">
            {/* Banner de Éxito y Barra de Herramientas de Impresión */}
            <div className="no-print p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-emerald-950 text-sm">¡Cobro Registrado con Éxito!</h4>
                  <p className="text-[11px] text-emerald-800">
                    Monto: <strong>${montoACobrar.toLocaleString('es-AR')}</strong> ({medioPago}) • Comprobante Emitido
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Selector Formato A4 / Ticket */}
                <div className="flex items-center bg-white border border-emerald-300 rounded-xl p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setFormatoImpresion('A4')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                      formatoImpresion === 'A4'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Hoja A4
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormatoImpresion('TICKET')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                      formatoImpresion === 'TICKET'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Ticket 80mm
                  </button>
                </div>

                {/* Botón Imprimir / PDF */}
                <button
                  type="button"
                  onClick={handlePrintDocument}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition cursor-pointer"
                  title="Imprimir comprobante o guardar como PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / PDF</span>
                </button>
              </div>
            </div>

            {/* CONTENEDOR IMPRIMIBLE OFICIAL (#printable-area) */}
            <div 
              id="printable-area" 
              ref={printAreaRef}
              className={`printable-content bg-white text-slate-900 border-2 border-slate-900 rounded-2xl p-5 shadow-xs font-sans print:border-none print:p-0 print:m-0 ${
                formatoImpresion === 'TICKET' ? 'max-w-[340px] mx-auto text-[11px]' : 'w-full'
              }`}
            >
              
              {formatoImpresion === 'TICKET' ? (
                /* =========================================================================
                   PLANTILLA TICKET TÉRMICO 80MM
                   ========================================================================= */
                <div className="space-y-2 text-center font-mono">
                  <div className="border-b border-dashed border-slate-400 pb-2">
                    <h4 className="font-black text-xs uppercase">{targetClinica?.nombre || 'Centro Médico'}</h4>
                    <p className="text-[10px]">{targetClinica?.direccion}</p>
                    <p className="text-[10px]">CUIT: {targetClinica?.cuit}</p>
                    <p className="text-[10px]">IVA: {targetClinica?.condicion_iva === 'MONO' ? 'Responsable Monotributo' : 'Resp. Inscripto'}</p>
                    <p className="text-[10px] font-bold mt-1">
                      {comprobanteFiscalEmitido 
                        ? `${comprobanteFiscalEmitido.tipo_comprobante_nombre} N° ${comprobanteFiscalEmitido.numero_completo}`
                        : `RECIBO X N° ${reciboNoFiscalEmitido?.numero || comprobanteNro}`}
                    </p>
                    <p className="text-[9px]">Fecha: {formatDateAR(new Date().toISOString())}</p>
                  </div>

                  <div className="text-left text-[10px] border-b border-dashed border-slate-400 py-1.5 space-y-0.5">
                    <p><strong>Receptor:</strong> {receptorNombre}</p>
                    <p><strong>{receptorDocTipo}:</strong> {receptorDocNro || 'S/D'}</p>
                    <p><strong>Cond. IVA:</strong> {receptorCondicionIva}</p>
                    <p><strong>Medio Pago:</strong> {medioPago}</p>
                  </div>

                  <div className="text-left text-[10px] border-b border-dashed border-slate-400 py-1.5 space-y-1">
                    <div className="flex justify-between">
                      <span className="truncate max-w-[180px]">{practica?.descripcion || 'Coseguro Consulta'}</span>
                      <span className="font-black">${montoACobrar.toLocaleString('es-AR')}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs font-black py-1 border-b border-dashed border-slate-400">
                    <span>TOTAL ABONADO:</span>
                    <span>${montoACobrar.toLocaleString('es-AR')}</span>
                  </div>

                  {comprobanteFiscalEmitido ? (
                    <div className="py-2 text-[9px] space-y-1">
                      <div className="w-16 h-16 mx-auto bg-white border border-slate-300 rounded flex items-center justify-center">
                        <QrCode className="w-14 h-14 text-slate-900" />
                      </div>
                      <p className="font-bold">CAE: {comprobanteFiscalEmitido.cae}</p>
                      <p>Vto CAE: {formatDateAR(comprobanteFiscalEmitido.cae_vto)}</p>
                      <p className="text-[8px] text-slate-500">Comprobante Autorizado por ARCA</p>
                    </div>
                  ) : (
                    <div className="py-2 text-[9px]">
                      <p className="font-bold uppercase text-amber-800">DOCUMENTO NO VÁLIDO COMO FACTURA</p>
                      <p className="text-slate-500 mt-1">Firma / Sello de Recepción</p>
                    </div>
                  )}
                </div>
              ) : comprobanteFiscalEmitido ? (
                /* =========================================================================
                   PLANTILLA OFICIAL HOJA A4: FACTURA ELECTRÓNICA ARCA (AFIP)
                   ========================================================================= */
                <div className="space-y-4">
                  {/* ENCABEZADO CON CUADRO CENTRAL (A, B, C) */}
                  <div className="grid grid-cols-12 gap-2 border-b-2 border-slate-900 pb-3 relative">
                    
                    {/* Letra Central Oficial */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 w-11 h-11 bg-white border-2 border-slate-900 rounded-xl flex flex-col items-center justify-center font-black shadow-2xs z-10">
                      <span className="text-xl leading-none">{comprobanteFiscalEmitido.letra || 'C'}</span>
                      <span className="text-[7px] text-slate-600 font-bold uppercase tracking-tight">
                        COD. {String(comprobanteFiscalEmitido.tipo_comprobante_id || '11').padStart(3, '0')}
                      </span>
                    </div>

                    {/* Datos Emisor (Izquierda) */}
                    <div className="col-span-6 pr-6 space-y-0.5">
                      <h4 className="font-black text-sm uppercase text-slate-900">
                        {targetClinica?.nombre || 'Sede Central de Atención Médica'}
                      </h4>
                      <p className="text-[10px] text-slate-600">
                        {targetClinica?.direccion || 'Aipaa 355, Córdoba'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-800">
                        Condición IVA: <span className="font-black">{emisorCondicionIva === 'MONO' ? 'Responsable Monotributo' : 'IVA Responsable Inscripto'}</span>
                      </p>
                    </div>

                    {/* Datos Comprobante (Derecha) */}
                    <div className="col-span-6 pl-6 text-right space-y-0.5">
                      <h4 className="font-black text-sm uppercase text-indigo-900">
                        {comprobanteFiscalEmitido.tipo_comprobante_nombre || 'FACTURA C'}
                      </h4>
                      <p className="font-mono font-black text-xs text-slate-900">
                        N° {comprobanteFiscalEmitido.numero_completo}
                      </p>
                      <p className="text-[10px] text-slate-700 font-bold">
                        Fecha: <span>{formatDateAR(comprobanteFiscalEmitido.fecha_emision)}</span>
                      </p>
                      <p className="text-[10px] text-slate-600">
                        CUIT: <strong className="font-mono">{targetClinica?.cuit || '27-33445566-4'}</strong>
                      </p>
                      <p className="text-[9px] text-slate-500">
                        Punto de Venta: {String(targetClinica?.punto_venta || 1).padStart(4, '0')}
                      </p>
                    </div>
                  </div>

                  {/* PERÍODO Y RECEPTOR */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px]">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block font-bold text-[9px] uppercase">Receptor / Facturar a:</span>
                      <strong className="text-slate-900 text-xs block">{receptorNombre}</strong>
                      <span className="text-slate-700 font-medium">
                        {receptorDocTipo}: <strong className="font-mono">{receptorDocNro || 'S/D'}</strong>
                      </span>
                      <span className="text-slate-600 block text-[10px]">
                        Dom: {receptorDomicilio}
                      </span>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className="text-slate-400 block font-bold text-[9px] uppercase">Condición de Venta & IVA:</span>
                      <p className="font-black text-slate-900">{medioPago}</p>
                      <p className="text-slate-700 font-bold">
                        IVA: <span className="font-extrabold text-indigo-900">{receptorCondicionIva}</span>
                      </p>
                      {paciente && (
                        <p className="text-[10px] text-slate-500">
                          Paciente: {paciente.apellido}, {paciente.nombre}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* TABLA DE ÍTEMS Y DESGLOSE */}
                  <table className="w-full text-left text-[11px] border-collapse border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-black text-[10px] uppercase">
                      <tr>
                        <th className="p-2 border border-slate-200">Concepto / Servicio</th>
                        <th className="p-2 text-center border border-slate-200 w-16">Cant.</th>
                        <th className="p-2 text-right border border-slate-200 w-28">P. Unitario</th>
                        {comprobanteFiscalEmitido.letra === 'A' && (
                          <th className="p-2 text-right border border-slate-200 w-20">Alíc. IVA</th>
                        )}
                        <th className="p-2 text-right border border-slate-200 w-28">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      <tr>
                        <td className="p-2 border border-slate-200">
                          <p className="font-bold text-slate-900">
                            {practica?.descripcion || 'Coseguro de Consulta Médica / Sesión'}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Cobertura: {obraSocial?.nombre || turno?.obra_social_nombre || 'Particular'} 
                            {(plan?.nombre_plan || turno?.plan_nombre) ? ` - ${plan?.nombre_plan || turno?.plan_nombre}` : ''}
                          </p>
                        </td>
                        <td className="p-2 text-center font-mono border border-slate-200">1</td>
                        <td className="p-2 text-right font-mono font-bold border border-slate-200">
                          ${montoACobrar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        {comprobanteFiscalEmitido.letra === 'A' && (
                          <td className="p-2 text-right font-mono text-[10px] border border-slate-200">
                            21%
                          </td>
                        )}
                        <td className="p-2 text-right font-mono font-black text-indigo-900 border border-slate-200">
                          ${montoACobrar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* TOTALES */}
                  <div className="flex justify-end">
                    <div className="w-56 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                      {comprobanteFiscalEmitido.letra === 'A' && (
                        <>
                          <div className="flex justify-between text-slate-600">
                            <span>Neto Gravado:</span>
                            <span className="font-mono font-bold">
                              ${(montoACobrar / 1.21).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>IVA (21%):</span>
                            <span className="font-mono font-bold">
                              ${(montoACobrar - (montoACobrar / 1.21)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                        <span>Importe Total:</span>
                        <span className="font-mono text-emerald-700">
                          ${montoACobrar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PIE FISCAL ARCA: CAE + QR OFICIAL */}
                  <div className="border-t-2 border-slate-900 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <a 
                        href={comprobanteFiscalEmitido.qr_url || 'https://www.afip.gob.ar/fe/qr/'} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 bg-white border border-slate-300 rounded-xl text-center flex flex-col items-center"
                        title="Verificar comprobante en ARCA / AFIP"
                      >
                        <QrCode className="w-12 h-12 text-slate-900" />
                        <span className="text-[7px] font-black uppercase text-indigo-900 mt-0.5">ARCA AFIP QR</span>
                      </a>
                      <div className="text-[10px] space-y-0.5">
                        <p className="font-mono font-black text-slate-900 text-xs">
                          CAE N°: {comprobanteFiscalEmitido.cae}
                        </p>
                        <p className="text-slate-600 font-semibold">
                          Fecha Vto. CAE: {formatDateAR(comprobanteFiscalEmitido.cae_vto)}
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Comprobante Electrónico Autorizado por ARCA (AFIP) - RG 4291 / 5003
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Total Cancelado:</span>
                      <span className="text-lg font-black text-emerald-700 font-mono">
                        ${montoACobrar.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* =========================================================================
                   PLANTILLA OFICIAL HOJA A4: RECIBO X NO FISCAL (INTERNO)
                   ========================================================================= */
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-2 border-b-2 border-slate-900 pb-3 relative">
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 w-11 h-11 bg-white border-2 border-slate-900 rounded-xl flex flex-col items-center justify-center font-black shadow-2xs z-10">
                      <span className="text-xl leading-none">X</span>
                      <span className="text-[6px] text-slate-500 font-bold uppercase">NO FISCAL</span>
                    </div>

                    <div className="col-span-6 pr-6 space-y-0.5">
                      <h4 className="font-black text-sm uppercase text-slate-900">
                        {targetClinica?.nombre || 'Sede de Atención Médica'}
                      </h4>
                      <p className="text-[10px] text-slate-600">
                        {targetClinica?.direccion || 'Aipaa 355, Córdoba'}
                      </p>
                      <p className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded inline-block border border-amber-200">
                        DOCUMENTO NO VÁLIDO COMO FACTURA
                      </p>
                    </div>

                    <div className="col-span-6 pl-6 text-right space-y-0.5">
                      <h4 className="font-black text-sm uppercase text-amber-900">
                        RECIBO PROVISORIO X
                      </h4>
                      <p className="font-mono font-bold text-xs text-slate-800">
                        N° {reciboNoFiscalEmitido?.numero || comprobanteNro}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        Fecha: {formatDateAR(new Date().toISOString())}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Recibimos de:</span>
                      <strong className="text-slate-900">{receptorNombre} ({receptorDocTipo}: {receptorDocNro || 'S/D'})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">En concepto de:</span>
                      <span className="text-slate-800 font-bold">
                        {practica?.descripcion || 'Coseguro Consulta Médica'} ({obraSocial?.nombre || turno?.obra_social_nombre || 'Particular'})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Forma de Pago:</span>
                      <span className="font-bold text-slate-800">{medioPago}</span>
                    </div>
                    {paciente && (
                      <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                        <span>Paciente Atendido:</span>
                        <span>{paciente.apellido}, {paciente.nombre} (DNI: {paciente.dni})</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    <div className="text-[10px] text-slate-500 space-y-0.5">
                      <p>Emitido por: <strong>{currentUser?.nombre || 'Recepción y Secretaría'}</strong></p>
                      <p className="italic">Firma / Sello de Caja</p>
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

            {/* BOTÓN FINAL DE CIERRE */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 no-print">
              <button
                type="button"
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
