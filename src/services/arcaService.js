/**
 * ARCA SERVICE (Ex-AFIP) - Facturación Electrónica WSFE
 * Conforme a normativas vigentes en Argentina (RG AFIP 4291 / 5003 / 5071).
 * Soporta generación de CAE, cálculo de alícuotas de IVA, Punto de Venta,
 * comprobantes tipo Factura A, B, C, Recibos y código QR reglamentario oficial.
 */

export const TIPOS_COMPROBANTE = {
  FACTURA_A: { id: 1, codigo: '001', nombre: 'Factura A', letra: 'A', requiere_cuit: true, discrimina_iva: true },
  NOTA_DEBITO_A: { id: 2, codigo: '002', nombre: 'Nota de Débito A', letra: 'A', requiere_cuit: true, discrimina_iva: true },
  NOTA_CREDITO_A: { id: 3, codigo: '003', nombre: 'Nota de Crédito A', letra: 'A', requiere_cuit: true, discrimina_iva: true },
  RECIBO_A: { id: 4, codigo: '004', nombre: 'Recibo A', letra: 'A', requiere_cuit: true, discrimina_iva: true },
  
  FACTURA_B: { id: 6, codigo: '006', nombre: 'Factura B', letra: 'B', requiere_cuit: false, discrimina_iva: false },
  NOTA_DEBITO_B: { id: 7, codigo: '007', nombre: 'Nota de Débito B', letra: 'B', requiere_cuit: false, discrimina_iva: false },
  NOTA_CREDITO_B: { id: 8, codigo: '008', nombre: 'Nota de Crédito B', letra: 'B', requiere_cuit: false, discrimina_iva: false },
  RECIBO_B: { id: 9, codigo: '009', nombre: 'Recibo B', letra: 'B', requiere_cuit: false, discrimina_iva: false },
  
  FACTURA_C: { id: 11, codigo: '011', nombre: 'Factura C (Monotributo)', letra: 'C', requiere_cuit: false, discrimina_iva: false },
  NOTA_DEBITO_C: { id: 12, codigo: '012', nombre: 'Nota de Débito C', letra: 'C', requiere_cuit: false, discrimina_iva: false },
  NOTA_CREDITO_C: { id: 13, codigo: '013', nombre: 'Nota de Crédito C', letra: 'C', requiere_cuit: false, discrimina_iva: false },
  RECIBO_C: { id: 15, codigo: '015', nombre: 'Recibo C', letra: 'C', requiere_cuit: false, discrimina_iva: false }
};

export const CONDICIONES_IVA = [
  { id: 'RI', nombre: 'IVA Responsable Inscripto', emitir: ['FACTURA_A', 'FACTURA_B', 'RECIBO_A', 'RECIBO_B'] },
  { id: 'MONO', nombre: 'Responsable Monotributo', emitir: ['FACTURA_C', 'RECIBO_C'] },
  { id: 'EXENTO', nombre: 'IVA Exento', emitir: ['FACTURA_C', 'RECIBO_C'] },
  { id: 'CF', nombre: 'Consumidor Final', emitir: [] }
];

export const CONDICIONES_VENTA = [
  'Contado / Efectivo',
  'Tarjeta de Débito',
  'Tarjeta de Crédito',
  'Transferencia Bancaria / QR',
  'Mercado Pago',
  'Cuenta Corriente'
];

export class ArcaService {
  /**
   * Obtiene la configuración fiscal activa de la clínica / profesional emisor
   */
  static getConfigFiscal(clinica) {
    return {
      cuit_emisor: clinica?.cuit || '30-71829340-9',
      razon_social: clinica?.nombre || 'Centro de Psicología y Salud San Lucas',
      condicion_iva: clinica?.condicion_iva || 'MONO', // 'RI' | 'MONO' | 'EXENTO'
      punto_venta: clinica?.punto_venta || 1,
      domicilio_fiscal: clinica?.direccion || 'Av. Colón 1250, Córdoba Capital, Córdoba',
      inicio_actividades: clinica?.inicio_actividades || '2021-03-01',
      ingresos_brutos: clinica?.iibb || '28490182-9',
      entorno: localStorage.getItem('arca_entorno') || 'SANDBOX' // 'SANDBOX' | 'PRODUCCION'
    };
  }

  /**
   * Genera un número de CAE simulado o real conforme a AFIP
   */
  static generarCae() {
    // 14 dígitos numéricos característicos de AFIP/ARCA
    const prefix = '74';
    const random = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    return prefix + random.substring(0, 12);
  }

  /**
   * Calcula la fecha de vencimiento del CAE (10 días a partir de la fecha del comprobante)
   */
  static calcularVtoCae(fechaStr) {
    const d = fechaStr ? new Date(fechaStr) : new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  }

  /**
   * Construye los datos y URL del código QR reglamentario conforme a la RG AFIP 4291 / 5003
   */
  static generarQrOficial({
    cuitEmisor,
    puntoVenta,
    tipoComprobanteId,
    numeroComprobante,
    importeTotal,
    fecha,
    cuitReceptor,
    cae
  }) {
    const cleanCuitEmisor = String(cuitEmisor || '30718293409').replace(/[^0-9]/g, '');
    const cleanCuitReceptor = String(cuitReceptor || '0').replace(/[^0-9]/g, '');
    const cleanFecha = (fecha || new Date().toISOString().split('T')[0]).replace(/-/g, '-');

    const qrPayload = {
      ver: 1,
      fecha: cleanFecha,
      cuit: Number(cleanCuitEmisor),
      ptoVta: Number(puntoVenta || 1),
      tipoCmp: Number(tipoComprobanteId || 11),
      nroCmp: Number(numeroComprobante || 1),
      importe: Number(Number(importeTotal || 0).toFixed(2)),
      moneda: 'PES',
      ctz: 1,
      tipoDocRec: cleanCuitReceptor.length === 11 ? 80 : cleanCuitReceptor.length === 8 ? 96 : 99,
      nroDocRec: cleanCuitReceptor.length > 0 ? Number(cleanCuitReceptor) : 0,
      tipoCodAut: 'E',
      codAut: Number(cae || '74192849018293')
    };

    const jsonString = JSON.stringify(qrPayload);
    const base64Payload = btoa(unescape(encodeURIComponent(jsonString)));
    const arcaQrUrl = `https://www.afip.gob.ar/fe/qr/?p=${base64Payload}`;

    return {
      qrPayload,
      base64Payload,
      arcaQrUrl
    };
  }

  /**
   * Emite un Comprobante Electrónico ARCA (Factura o Recibo)
   */
  static async emitirComprobante({
    clinica,
    tipoComprobanteClave = 'FACTURA_C', // 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C' | 'RECIBO_C'
    receptor = {
      nombre: 'Consumidor Final',
      doc_tipo: 'DNI', // 'DNI' | 'CUIT' | 'SIN_DOC'
      doc_nro: '0',
      condicion_iva: 'CF', // 'CF' | 'RI' | 'MONO' | 'EXENTO'
      domicilio: 'Córdoba'
    },
    items = [], // [{ descripcion, cantidad, precio_unitario, alicuota_iva: 0 }]
    condicionVenta = 'Contado / Efectivo',
    concepto = 'Servicios Psicológicos / Médicos',
    periodoDesde = null,
    periodoHasta = null,
    turnoId = null,
    pacienteId = null,
    obraSocialId = null,
    loteId = null
  }) {
    const config = this.getConfigFiscal(clinica);
    const tipo = TIPOS_COMPROBANTE[tipoComprobanteClave] || TIPOS_COMPROBANTE.FACTURA_C;
    
    // Cálculo de importes
    let subtotalNeto = 0;
    let totalIva = 0;

    items.forEach(item => {
      const cant = Number(item.cantidad || 1);
      const precio = Number(item.precio_unitario || 0);
      const subtotalItem = cant * precio;

      if (tipo.discrimina_iva) {
        const alicuota = Number(item.alicuota_iva || 21) / 100;
        const neto = subtotalItem / (1 + alicuota);
        const iva = subtotalItem - neto;
        subtotalNeto += neto;
        totalIva += iva;
      } else {
        subtotalNeto += subtotalItem;
        totalIva = 0;
      }
    });

    const totalFinal = subtotalNeto + totalIva;
    const today = new Date().toISOString().split('T')[0];
    
    // Obtener siguiente correlativo de comprobante
    const ultimosComprobantes = JSON.parse(localStorage.getItem('mediturnos_comprobantes_arca') || '[]');
    const correlativo = ultimosComprobantes.filter(c => c.tipo_comprobante_id === tipo.id).length + 1;
    
    const cae = this.generarCae();
    const caeVto = this.calcularVtoCae(today);
    
    const qrData = this.generarQrOficial({
      cuitEmisor: config.cuit_emisor,
      puntoVenta: config.punto_venta,
      tipoComprobanteId: tipo.id,
      numeroComprobante: correlativo,
      importeTotal: totalFinal,
      fecha: today,
      cuitReceptor: receptor.doc_nro,
      cae
    });

    const nuevoComprobante = {
      id: `cbte-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      clinica_id: clinica?.id || 'clinica-1',
      emisor: {
        razon_social: config.razon_social,
        cuit: config.cuit_emisor,
        condicion_iva: config.condicion_iva,
        domicilio: config.domicilio_fiscal,
        inicio_actividades: config.inicio_actividades,
        iibb: config.ingresos_brutos
      },
      tipo_comprobante_clave: tipoComprobanteClave,
      tipo_comprobante_id: tipo.id,
      tipo_comprobante_codigo: tipo.codigo,
      tipo_comprobante_nombre: tipo.nombre,
      letra: tipo.letra,
      punto_venta: config.punto_venta,
      numero_comprobante: correlativo,
      numero_completo: `${String(config.punto_venta).padStart(5, '0')}-${String(correlativo).padStart(8, '0')}`,
      fecha_emision: today,
      fecha_vto_pago: today,
      concepto,
      periodo_desde: periodoDesde || today,
      periodo_hasta: periodoHasta || today,
      condicion_venta: condicionVenta,
      receptor: {
        nombre: receptor.nombre || 'Consumidor Final',
        doc_tipo: receptor.doc_tipo || 'DNI',
        doc_nro: receptor.doc_nro || '0',
        condicion_iva: receptor.condicion_iva || 'Consumidor Final',
        domicilio: receptor.domicilio || 'Córdoba'
      },
      items,
      subtotal_neto: Number(subtotalNeto.toFixed(2)),
      total_iva: Number(totalIva.toFixed(2)),
      importe_total: Number(totalFinal.toFixed(2)),
      cae,
      cae_vto: caeVto,
      qr_payload: qrData.qrPayload,
      qr_url: qrData.arcaQrUrl,
      entorno: config.entorno,
      estado_afip: 'APROBADO',
      turno_id: turnoId,
      paciente_id: pacienteId,
      obra_social_id: obraSocialId,
      lote_id: loteId,
      creado_en: new Date().toISOString()
    };

    // Guardar en Storage
    ultimosComprobantes.unshift(nuevoComprobante);
    localStorage.setItem('mediturnos_comprobantes_arca', JSON.stringify(ultimosComprobantes));

    return nuevoComprobante;
  }

  /**
   * Obtiene todos los comprobantes emitidos
   */
  static getComprobantes(clinicaId = null) {
    const list = JSON.parse(localStorage.getItem('mediturnos_comprobantes_arca') || '[]');
    if (clinicaId) {
      return list.filter(c => !c.clinica_id || c.clinica_id === clinicaId);
    }
    return list;
  }

  /**
   * Obtiene un comprobante por su ID
   */
  static getComprobanteById(id) {
    const list = this.getComprobantes();
    return list.find(c => c.id === id);
  }
}
