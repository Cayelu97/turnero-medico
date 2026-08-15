import React, { useState, useMemo } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  Printer, 
  Layers, 
  Calendar, 
  DollarSign, 
  ShieldCheck,
  Building,
  UserCheck,
  Search
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateAR } from '../../utils/formatters';

export const LoteFacturacionModal = ({ onClose, onLoteCreado }) => {
  const { 
    turnos, 
    obrasSociales, 
    planes, 
    nomenclador, 
    profesionales, 
    pacientes, 
    activeClinica, 
    saveLoteFacturacion,
    emitirComprobanteArca
  } = useApp();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [periodoMes, setPeriodoMes] = useState(currentMonth);
  const [periodoAnio, setPeriodoAnio] = useState(currentYear);
  const [selectedOsId, setSelectedOsId] = useState(obrasSociales.find(o => o.sigla === 'APROSS' || o.sigla === 'CPPC')?.id || obrasSociales[1]?.id || '');
  const [selectedProfId, setSelectedProfId] = useState('TODOS');
  const [emitirFacturaArcaDirecta, setEmitirFacturaArcaDirecta] = useState(true);

  // Turnos atendidos elegibles para este lote
  const turnosElegibles = useMemo(() => {
    return turnos.filter(t => {
      if (t.estado !== 'ATENDIDO') return false;
      if (t.obra_social_id !== selectedOsId) return false;
      if (selectedProfId !== 'TODOS' && t.profesional_id !== selectedProfId) return false;

      // Filtro de mes y año
      if (t.fecha) {
        const [y, m] = t.fecha.split('-');
        if (Number(y) !== Number(periodoAnio) || Number(m) !== Number(periodoMes)) return false;
      }

      return true;
    });
  }, [turnos, selectedOsId, selectedProfId, periodoMes, periodoAnio]);

  const [selectedTurnoIds, setSelectedTurnoIds] = useState(() => turnosElegibles.map(t => t.id));

  // Actualizar seleccionados si cambian los elegibles
  React.useEffect(() => {
    setSelectedTurnoIds(turnosElegibles.map(t => t.id));
  }, [turnosElegibles]);

  const toggleSelectTurno = (id) => {
    setSelectedTurnoIds(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedTurnoIds.length === turnosElegibles.length) {
      setSelectedTurnoIds([]);
    } else {
      setSelectedTurnoIds(turnosElegibles.map(t => t.id));
    }
  };

  const selectedOs = obrasSociales.find(o => o.id === selectedOsId);

  // Cálculo de totales valorizados
  const resumenTotales = useMemo(() => {
    let totalBruto = 0;
    let totalCoseguros = 0;

    const items = turnosElegibles.filter(t => selectedTurnoIds.includes(t.id)).map(t => {
      const practica = nomenclador.find(p => p.id === t.practica_id);
      const valor = Number(practica?.valor_particular || 16000);
      const coseguro = Number(t.monto_coseguro || 0);
      const arancelOs = Math.max(0, valor - coseguro);

      totalBruto += arancelOs;
      totalCoseguros += coseguro;

      return {
        turno_id: t.id,
        fecha: t.fecha,
        paciente_dni: t.paciente?.dni || '',
        numero_afiliado: t.numero_afiliado || '',
        numero_bono: t.numero_bono || `AUT-${t.codigo_reserva}`,
        practica_codigo: practica?.codigo_pmo || '33.01.02',
        importe_arancel_os: arancelOs,
        coseguro
      };
    });

    return {
      cantidad_sesiones: items.length,
      total_arancel_os: totalBruto,
      total_coseguros: totalCoseguros,
      items
    };
  }, [turnosElegibles, selectedTurnoIds, nomenclador]);

  const handleCrearLote = async (e) => {
    e.preventDefault();
    if (selectedTurnoIds.length === 0) {
      alert('Debe seleccionar al menos una prestación para generar el lote.');
      return;
    }

    const nuevoLote = {
      clinica_id: activeClinica?.id,
      obra_social_id: selectedOsId,
      obra_social_nombre: selectedOs?.nombre || 'Obra Social',
      obra_social_sigla: selectedOs?.sigla || 'OS',
      periodo_mes: Number(periodoMes),
      periodo_anio: Number(periodoAnio),
      total_prestaciones: resumenTotales.cantidad_sesiones,
      monto_total_presentado: resumenTotales.total_arancel_os,
      estado: 'PRESENTADO', // 'PRESENTADO' | 'AUDITADO' | 'LIQUIDADO' | 'COBRADO'
      turnos_ids: selectedTurnoIds,
      items_detalle: resumenTotales.items,
      fecha_presentacion: new Date().toISOString().split('T')[0]
    };

    const savedLote = saveLoteFacturacion(nuevoLote);

    // Si se optó por emitir la Factura Electrónica ARCA correspondiente
    if (emitirFacturaArcaDirecta && selectedOs) {
      try {
        await emitirComprobanteArca({
          tipoComprobanteClave: selectedOs.cuit ? 'FACTURA_A' : 'FACTURA_B',
          receptor: {
            nombre: selectedOs.nombre,
            doc_tipo: selectedOs.cuit ? 'CUIT' : 'DNI',
            doc_nro: selectedOs.cuit ? selectedOs.cuit.replace(/[^0-9]/g, '') : '0',
            condicion_iva: selectedOs.cuit ? 'IVA Responsable Inscripto' : 'Consumidor Final',
            domicilio: 'Córdoba, Argentina'
          },
          concepto: `Prestaciones de Salud Mental / Médicas - Período ${periodoMes}/${periodoAnio} (${savedLote.numero_lote})`,
          items: [
            {
              descripcion: `Lote ${savedLote.numero_lote} - ${resumenTotales.cantidad_sesiones} prestaciones asistenciales a ${selectedOs.sigla}`,
              cantidad: 1,
              precio_unitario: resumenTotales.total_arancel_os,
              alicuota_iva: 0 // Exento o salud
            }
          ],
          obraSocialId: selectedOsId,
          loteId: savedLote.id
        });
      } catch (err) {
        console.error('Error emitiendo factura ARCA del lote:', err);
      }
    }

    if (onLoteCreado) onLoteCreado(savedLote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">
                Generar Lote de Presentación a Obra Social / CPPC
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Agrupación mensual de sesiones atendidas, auditoría de bonos y facturación formal
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FILTROS Y PARÁMETROS DEL LOTE */}
        <form onSubmit={handleCrearLote} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Obra Social / Entidad *</label>
              <select
                value={selectedOsId}
                onChange={(e) => setSelectedOsId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                {obrasSociales.filter(o => o.sigla !== 'PART').map(o => (
                  <option key={o.id} value={o.id}>{o.nombre} ({o.sigla})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mes del Período *</label>
              <select
                value={periodoMes}
                onChange={(e) => setPeriodoMes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <option key={m} value={m}>Mes {m} ({new Date(2026, m - 1).toLocaleString('es-AR', { month: 'long' })})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Año *</label>
              <input
                type="number"
                value={periodoAnio}
                onChange={(e) => setPeriodoAnio(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Profesional Prestador</label>
              <select
                value={selectedProfId}
                onChange={(e) => setSelectedProfId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TODOS">Todos los profesionales</option>
                {profesionales.map(p => (
                  <option key={p.id} value={p.id}>Lic./Dr. {p.apellido}, {p.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* TABLA DE PRESTACIONES DETALLADAS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Prestaciones Atendidas Encontradas ({turnosElegibles.length})
              </span>
              {turnosElegibles.length > 0 && (
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  {selectedTurnoIds.length === turnosElegibles.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                </button>
              )}
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 w-8">#</th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Paciente & DNI</th>
                    <th className="px-3 py-2">N° Afiliado</th>
                    <th className="px-3 py-2">Bono / Token</th>
                    <th className="px-3 py-2">Código Práctica</th>
                    <th className="px-3 py-2 text-right">Arancel OS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {turnosElegibles.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-slate-400 font-medium">
                        No se encontraron sesiones atendidas para {selectedOs?.nombre} en el período {periodoMes}/{periodoAnio}.
                      </td>
                    </tr>
                  ) : (
                    turnosElegibles.map((t, idx) => {
                      const pac = pacientes.find(p => p.id === t.paciente_id);
                      const practica = nomenclador.find(p => p.id === t.practica_id);
                      const isSelected = selectedTurnoIds.includes(t.id);
                      const valor = Number(practica?.valor_particular || 16000);
                      const coseguro = Number(t.monto_coseguro || 0);
                      const arancelOs = Math.max(0, valor - coseguro);

                      return (
                        <tr 
                          key={t.id} 
                          onClick={() => toggleSelectTurno(t.id)}
                          className={`hover:bg-slate-50 cursor-pointer transition ${isSelected ? 'bg-indigo-50/40' : ''}`}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectTurno(t.id)}
                              className="rounded text-indigo-600"
                            />
                          </td>
                          <td className="px-3 py-2 font-medium whitespace-nowrap">{formatDateAR(t.fecha)}</td>
                          <td className="px-3 py-2 font-bold text-slate-900">
                            {pac ? `${pac.apellido}, ${pac.nombre}` : 'Paciente'}
                            <span className="text-[10px] text-slate-400 block font-normal">DNI: {pac?.dni || 'S/D'}</span>
                          </td>
                          <td className="px-3 py-2 font-mono font-semibold">{t.numero_afiliado || pac?.numero_afiliado || 'S/D'}</td>
                          <td className="px-3 py-2 font-mono text-indigo-700 font-bold">{t.numero_bono || `AUT-${t.codigo_reserva}`}</td>
                          <td className="px-3 py-2 font-mono">{practica?.codigo_pmo || '33.01.02'}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                            ${arancelOs.toLocaleString('es-AR')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOTALES Y FACTURACIÓN ARCA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl">
            <div>
              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emitirFacturaArcaDirecta}
                  onChange={(e) => setEmitirFacturaArcaDirecta(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Emitir Factura Electrónica ARCA (AFIP) por el Lote</span>
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5 pl-6">
                Genera automáticamente el comprobante fiscal oficial con CAE y QR dirigido a {selectedOs?.nombre || 'la Obra Social'}.
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="text-xs text-slate-500 font-bold block">
                Total Presentación ({resumenTotales.cantidad_sesiones} prestaciones seleccionadas):
              </span>
              <span className="text-xl font-black text-indigo-700 font-mono block">
                ${resumenTotales.total_arancel_os.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={selectedTurnoIds.length === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              Confirmar y Presentar Lote
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
