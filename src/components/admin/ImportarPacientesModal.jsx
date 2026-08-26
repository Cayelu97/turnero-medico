import React, { useState } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  HeartHandshake, 
  Ambulance, 
  X, 
  Download, 
  RefreshCw, 
  Trash2, 
  Check, 
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Info
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { useApp } from '../../context/AppContext';

export const ImportarPacientesModal = ({ isOpen, onClose, onImportSuccess }) => {
  const { showToast, refreshData } = useApp();

  const [step, setStep] = useState(1); // 1: Pegar/Subir, 2: Previsualizar, 3: Éxito
  const [rawInputText, setRawInputText] = useState('');
  const [parsedPatients, setParsedPatients] = useState([]);
  const [onDuplicateOption, setOnDuplicateOption] = useState('update'); // 'update' | 'skip'
  const [importResult, setImportResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Plantilla de ejemplo con las columnas de Google Forms del usuario
  const SAMPLE_GOOGLE_FORMS_DATA = `Marca temporal\tDirección de correo electrónico\tNombre Completo:\tDNI:\tCELULAR:\tDomicilio donde reside actualmente:\tEn casos de ser necesario llamar a esta persona  (celular y nombre):\tPosee servicio de Emergencia? ,Cuál?\tEdad\tTiene Obra social?\tCon quien vive actualmente?\tAcepto los términos y condiciones del Consentimiento Informado.
2026/08/20 10:15:22\tcarolina.mendez@gmail.com\tCarolina Méndez Rossi\t37890123\t351 552-9900\tBv. Chacabuco 820, Nueva Córdoba\tMamá: Beatriz Rossi 351-4412233 / Papá: Roberto Méndez 351-6678899\tSí, ECCO Emergencias\t27\tAPROSS\tCon sus padres y hermana menor\tAcepto
2026/08/21 15:40:10\tjuaquin.perez@hotmail.com\tJoaquín Pérez\t34112233\t351 612-4455\tAv. Colón 2450, Alberdi\tEsposa: Laura Morales cel 351-9988771\tVittal\t32\tOSDE 210\tCon su pareja e hijo de 2 años\tAcepto
2026/08/22 09:12:00\tvaleria.sosa@yahoo.com.ar\tValeria Sosa\t40998877\t351 334-1122\tAv. Rafael Núñez 4100, Cerro\tTía: Sandra 351-7788990 y Hermano: Martín 351-2233445\tNo posee\t21\tParticular\tVive sola en departamento\tAcepto
2026/08/23 18:05:45\testeban.gonzalez@gmail.com\tEsteban González\t31456789\t351 778-9900\tOctavio Pinto 2100, Villa Cabrera\tMadre: Elena 351-5554433 (Urgencias)\tSí, Paravachasca\t39\tSwiss Medical\tCon su madre de 70 años\tAcepto`;

  const handleLoadSample = () => {
    setRawInputText(SAMPLE_GOOGLE_FORMS_DATA);
    showToast('Datos de ejemplo cargados en el editor.');
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      'Marca temporal,Dirección de correo electrónico,Nombre Completo:,DNI:,CELULAR:,Domicilio donde reside actualmente:,"En casos de ser necesario llamar a esta persona  (celular y nombre):","Posee servicio de Emergencia? ,Cuál?",Edad,Tiene Obra social?,Con quien vive actualmente?,Acepto los términos y condiciones del Consentimiento Informado.\n' +
      '2026/08/20 10:15:22,paciente.ejemplo@gmail.com,Nombre Apellido,35890123,3515501122,Av. Colón 1250,"Mamá: María 3514412233 / Papá: Juan 3516678899",Sí ECCO,28,APROSS,Con mis padres,Acepto';
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'plantilla_pacientes_psicologia.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      setRawInputText(content);
      showToast(`Archivo "${file.name}" cargado con éxito.`);
    };
    reader.readAsText(file);
  };

  const handleProcessText = () => {
    if (!rawInputText.trim()) {
      showToast('Por favor ingrese o pegue los datos a procesar.', 'error');
      return;
    }

    const parsed = StorageService.parseGoogleSheetsText(rawInputText);
    if (parsed.length === 0) {
      showToast('No se pudieron detectar registros válidos. Verifique el formato de los datos.', 'error');
      return;
    }

    setParsedPatients(parsed);
    setStep(2);
    showToast(`Se detectaron ${parsed.length} pacientes listos para importar.`);
  };

  const handleRemoveParsedRow = (idx) => {
    setParsedPatients(prev => prev.filter((_, i) => i !== idx));
  };

  const handleConfirmImport = () => {
    if (parsedPatients.length === 0) return;
    setIsProcessing(true);

    try {
      const result = StorageService.importarPacientesMasivo(parsedPatients, {
        onDuplicate: onDuplicateOption
      });

      setImportResult(result);
      setStep(3);
      if (onImportSuccess) onImportSuccess(result);
      if (refreshData) refreshData();
      showToast(`¡Importación completada! ${result.creados} creados, ${result.actualizados} actualizados.`);
    } catch (err) {
      console.error(err);
      showToast('Error al procesar la importación: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setRawInputText('');
    setParsedPatients([]);
    setImportResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-hidden animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 my-auto overflow-hidden animate-scaleIn">
        
        {/* HEADER STICKY */}
        <div className="px-5 sm:px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-medical-50 text-medical-700 rounded-2xl border border-medical-200 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                Importación y Migración de Pacientes (Google Forms / Excel)
              </h3>
              <p className="text-xs text-slate-500">
                Especial para consultorios de psicología: múltiples contactos familiares, convivientes y emergencias.
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY SCROLLABLE */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* PASO 1: PEGAR DATOS O SUBIR ARCHIVO */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-bold block flex items-center gap-1.5 text-blue-900">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    Instrucciones de Pegado Rápido:
                  </span>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Puedes copiar las celdas directamente desde tu planilla de <strong>Google Sheets o Excel</strong> y pegarlas en el recuadro de abajo. El sistema detectará automáticamente las columnas de familiares, teléfonos, servicio de emergencias y consentimiento.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-xl font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Cargar Ejemplo</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Plantilla CSV</span>
                  </button>
                </div>
              </div>

              {/* Input Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Pega aquí los datos copiados (o selecciona un archivo .csv / .tsv):
                  </label>
                  <label className="text-xs font-bold text-medical-700 hover:underline cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir archivo CSV / TXT</span>
                    <input type="file" accept=".csv,.tsv,.txt" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <textarea
                  rows={10}
                  value={rawInputText}
                  onChange={(e) => setRawInputText(e.target.value)}
                  placeholder="Marca temporal	Dirección de correo electrónico	Nombre Completo:	DNI:	CELULAR:	Domicilio donde reside actualmente:	En casos de ser necesario llamar a esta persona (celular y nombre):	Posee servicio de Emergencia? ,Cuál?	Edad	Tiene Obra social?	Con quien vive actualmente?	Acepto los términos y condiciones del Consentimiento Informado..."
                  className="w-full p-3.5 border border-slate-200 rounded-2xl text-xs font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-medical-500 outline-none leading-relaxed transition"
                />
                <span className="text-[11px] text-slate-400 block text-right">
                  {rawInputText ? `${rawInputText.split('\n').filter(l => l.trim()).length} líneas cargadas` : 'Recuadro vacío'}
                </span>
              </div>
            </div>
          )}

          {/* PASO 2: PREVISUALIZACIÓN Y VALIDACIÓN */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-extrabold text-slate-900">
                    {parsedPatients.length} pacientes procesados y listos para migrar
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-bold">Si el DNI ya existe en el sistema:</span>
                  <select
                    value={onDuplicateOption}
                    onChange={(e) => setOnDuplicateOption(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-medical-500 shadow-2xs"
                  >
                    <option value="update">✓ Actualizar datos del paciente</option>
                    <option value="skip">⏸️ Omitir (Mantener original)</option>
                  </select>
                </div>
              </div>

              {/* Tabla de Pacientes Previsualizados */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider sticky top-0 bg-slate-100 z-10">
                      <tr>
                        <th className="px-3 py-2.5">#</th>
                        <th className="px-3 py-2.5">Paciente / DNI</th>
                        <th className="px-3 py-2.5">Contacto Principal</th>
                        <th className="px-3 py-2.5">Contactos Familiares / Emergencia</th>
                        <th className="px-3 py-2.5">Con quién vive</th>
                        <th className="px-3 py-2.5">Emergencia / Obra Social</th>
                        <th className="px-3 py-2.5 text-center">Consentimiento</th>
                        <th className="px-3 py-2.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {parsedPatients.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          
                          {/* Paciente y DNI */}
                          <td className="px-3 py-2">
                            <strong className="text-slate-900 block font-black">
                              {p.apellido}, {p.nombre}
                            </strong>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                              <span>DNI {p.dni}</span>
                              {p.edad && <span>• {p.edad} años</span>}
                            </div>
                          </td>

                          {/* Contacto Directo */}
                          <td className="px-3 py-2">
                            <div className="space-y-0.5">
                              {p.telefono_whatsapp && (
                                <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                                  <Phone className="w-3 h-3 text-emerald-600" /> {p.telefono_whatsapp}
                                </span>
                              )}
                              {p.email && (
                                <span className="flex items-center gap-1 text-[10px] text-slate-500 truncate max-w-[150px]">
                                  <Mail className="w-3 h-3 text-slate-400" /> {p.email}
                                </span>
                              )}
                              {p.domicilio && (
                                <span className="flex items-center gap-1 text-[10px] text-slate-400 truncate max-w-[150px]">
                                  <MapPin className="w-3 h-3 text-slate-400" /> {p.domicilio}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Contactos Familiares */}
                          <td className="px-3 py-2">
                            {p.contactos_familiares.length === 0 ? (
                              <span className="text-[11px] text-slate-400 italic">Sin familiares registrados</span>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {p.contactos_familiares.map((fam, fIdx) => (
                                  <div key={fIdx} className="p-1 px-2 bg-purple-50 border border-purple-200/80 rounded-lg text-[10px] flex items-center justify-between gap-1.5 max-w-[240px]">
                                    <div className="truncate">
                                      <strong className="text-purple-950 font-bold">{fam.nombre}</strong>
                                      <span className="text-purple-700 ml-1">({fam.relacion})</span>
                                    </div>
                                    <span className="text-purple-800 font-mono font-black shrink-0">{fam.telefono}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Con quién vive */}
                          <td className="px-3 py-2 max-w-[160px]">
                            {p.con_quien_vive ? (
                              <span className="text-[11px] text-slate-800 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md inline-block font-semibold">
                                🏠 {p.con_quien_vive}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No especificado</span>
                            )}
                          </td>

                          {/* Servicio de Emergencia & Obra Social */}
                          <td className="px-3 py-2">
                            <div className="space-y-1">
                              {p.servicio_emergencia?.posee ? (
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-[10px] font-bold block truncate">
                                  🚑 {p.servicio_emergencia.nombre}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 block">Sin servicio emerg.</span>
                              )}
                              <span className="text-[10px] text-slate-600 block font-semibold">
                                🏥 {p.obra_social_nombre || 'Particular'}
                              </span>
                            </div>
                          </td>

                          {/* Consentimiento */}
                          <td className="px-3 py-2 text-center">
                            {p.consentimiento_informado?.aceptado ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase">
                                ✓ Firmado
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                                Pendiente
                              </span>
                            )}
                          </td>

                          {/* Eliminar Fila */}
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveParsedRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title="Quitar paciente de la lista a importar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: REPORTE DE ÉXITO */}
          {step === 3 && importResult && (
            <div className="space-y-5 text-center py-6 animate-fadeIn max-w-md mx-auto">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900">¡Migración Completada con Éxito!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Los pacientes y sus contactos familiares ya forman parte del padrón centralizado.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
                  <span className="text-[11px] text-slate-500 font-bold block">Pacientes Nuevos</span>
                  <strong className="text-2xl font-black text-emerald-600 block">{importResult.creados}</strong>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
                  <span className="text-[11px] text-slate-500 font-bold block">Actualizados</span>
                  <strong className="text-2xl font-black text-sky-600 block">{importResult.actualizados}</strong>
                </div>
              </div>

              {importResult.errores?.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs text-rose-800 space-y-1">
                  <span className="font-bold block">Filas omitidas por errores:</span>
                  {importResult.errores.map((err, i) => (
                    <p key={i} className="text-[11px]">• Fila {err.fila}: {err.error}</p>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* FOOTER STICKY */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between shrink-0">
          <div>
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Volver a Editar Texto</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            >
              {step === 3 ? 'Listo / Cerrar' : 'Cancelar'}
            </button>

            {step === 1 && (
              <button
                type="button"
                onClick={handleProcessText}
                className="px-5 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-bold shadow-md shadow-medical-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Procesar y Previsualizar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                disabled={isProcessing || parsedPatients.length === 0}
                onClick={handleConfirmImport}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isProcessing ? 'Guardando en Padrón...' : `Confirmar Importación (${parsedPatients.length})`}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
