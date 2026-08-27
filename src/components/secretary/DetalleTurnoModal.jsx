import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Calendar, 
  Clock, 
  Stethoscope, 
  Building2, 
  ShieldCheck, 
  Phone, 
  MessageCircle, 
  ArrowRightLeft, 
  XCircle, 
  UserCheck, 
  FileText, 
  CheckCircle2, 
  Edit3, 
  Save, 
  AlertCircle 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { formatDateAR } from '../../utils/formatters';

export const DetalleTurnoModal = ({ 
  isOpen, 
  turno, 
  onClose, 
  onReprogramar, 
  onCancelar, 
  onVerVoucher 
}) => {
  const { 
    pacientes, 
    profesionales, 
    consultorios, 
    obrasSociales, 
    planes, 
    servicios, 
    nomenclador, 
    updateTurnoEstado, 
    savePaciente, 
    showToast 
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dni, setDni] = useState('');
  const [obraSocialId, setObraSocialId] = useState('');
  const [numeroAfiliado, setNumeroAfiliado] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const paciente = turno ? pacientes.find(p => p.id === turno.paciente_id) : null;
  const profesional = turno ? profesionales.find(p => p.id === turno.profesional_id) : null;
  const consultorio = turno ? consultorios.find(c => c.id === turno.consultorio_id) : null;
  const obraSocial = turno ? obrasSociales.find(os => os.id === turno.obra_social_id) : null;
  const servicio = turno ? servicios.find(s => s.id === turno.servicio_id) : null;
  const practica = turno ? nomenclador.find(n => n.id === turno.practica_id) : null;

  useEffect(() => {
    if (turno && paciente) {
      setNombre(paciente.nombre || '');
      setApellido(paciente.apellido || '');
      setTelefono(paciente.telefono_whatsapp || '');
      setDni(paciente.dni || '');
      setObraSocialId(turno.obra_social_id || paciente.obra_social_id || '');
      setNumeroAfiliado(paciente.numero_afiliado || '');
      setObservaciones(turno.observaciones || '');
      setIsEditing(false);
    }
  }, [turno, paciente, isOpen]);

  if (!isOpen || !turno) return null;

  // Guardar cambios en los datos del paciente y observaciones del turno
  const handleGuardarCambios = (e) => {
    e.preventDefault();
    if (!paciente) return;

    // Actualizar paciente
    const updatedPac = {
      ...paciente,
      nombre,
      apellido,
      dni,
      telefono_whatsapp: telefono,
      obra_social_id: obraSocialId,
      numero_afiliado: numeroAfiliado
    };
    savePaciente(updatedPac);

    // Actualizar observaciones y obra social del turno
    const turnosList = StorageService.getTurnos();
    const currentTurno = turnosList.find(t => t.id === turno.id);
    if (currentTurno) {
      StorageService.saveTurno({
        ...currentTurno,
        obra_social_id: obraSocialId,
        observaciones: observaciones
      });
    }

    setIsEditing(false);
    showToast('¡Datos del turno y paciente actualizados con éxito!');
  };

  const handleToggleConfirmar = () => {
    const nuevoConfirmado = !turno.confirmado_whatsapp;
    updateTurnoEstado(turno.id, turno.estado, { confirmado_whatsapp: nuevoConfirmado });
    showToast(
      nuevoConfirmado 
        ? '✓ Turno confirmado por el paciente (WhatsApp / Teléfono)' 
        : 'Confirmación de asistencia removida',
      nuevoConfirmado ? 'success' : 'info'
    );
    onClose();
  };

  const handleMarcarEnEspera = () => {
    updateTurnoEstado(turno.id, 'EN_ESPERA');
    showToast('Paciente marcado en Sala de Espera.');
    onClose();
  };

  const handleLlamarConsulta = () => {
    updateTurnoEstado(turno.id, 'EN_ATENCION');
    showToast('Paciente llamado a consultorio.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
      <div className="bg-white rounded-3xl max-w-3xl sm:max-w-4xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scaleIn my-auto">
        
        {/* HEADER */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 text-sky-700 rounded-2xl border border-sky-100 shadow-2xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-slate-900">
                  Detalle & Gestión del Turno
                </h3>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                  turno.confirmado_whatsapp ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                  turno.estado === 'CONFIRMADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  turno.estado === 'EN_ESPERA' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  turno.estado === 'EN_ATENCION' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {turno.confirmado_whatsapp ? '✓ CONFIRMADO' : turno.estado.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Código: <strong className="text-slate-800">{turno.codigo_reserva}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY SCROLLABLE */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TARJETA FECHA, HORA & SEDE */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl border border-slate-200 text-medical-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Cita Programada</span>
                <strong className="text-sm font-black text-slate-900">
                  {formatDateAR(turno.fecha)} a las {turno.hora_inicio} hs
                </strong>
                <span className="text-[11px] text-slate-600 font-bold block">
                  {turno.modalidad === 'ONLINE' ? '💻 Consulta Virtual / Online' : '🏢 Atención Presencial'}
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
              <span className="text-[10px] font-black uppercase text-medical-700 block">
                📍 {StorageService.getClinicasList().find(c => c.id === turno.clinica_id)?.nombre || 'Sede Central'}
              </span>
              <strong className="text-xs font-black text-slate-800 block">
                {consultorio?.nombre || 'Consultorio de Atención'}
              </strong>
              <span className="text-[10px] text-slate-500 font-medium">
                {StorageService.getClinicasList().find(c => c.id === turno.clinica_id)?.direccion || ''}
              </span>
            </div>
          </div>

          {/* TARJETA MÉDICO & SERVICIO */}
          <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">Profesional Tratante</span>
              <strong className="text-xs font-bold text-slate-900 block">
                Dr(a). {profesional?.nombre} {profesional?.apellido}
              </strong>
              <span className="text-[11px] text-slate-600">{profesional?.especialidad}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">Servicio</span>
              <span className="text-xs font-bold text-slate-800">{servicio?.nombre || 'Consulta'}</span>
            </div>
          </div>

          {/* DATOS DEL PACIENTE (EDICIÓN O LECTURA) */}
          <div className="p-4 bg-slate-50/90 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-sky-600" />
                Datos del Paciente
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-[11px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Cancelar Edición' : 'Editar Datos'}</span>
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleGuardarCambios} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Apellido</label>
                    <input
                      type="text"
                      required
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">DNI</label>
                    <input
                      type="text"
                      required
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">WhatsApp</label>
                    <input
                      type="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Obra Social</label>
                    <select
                      value={obraSocialId}
                      onChange={(e) => setObraSocialId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      {obrasSociales.map(os => (
                        <option key={os.id} value={os.id}>{os.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">N° Afiliado</label>
                    <input
                      type="text"
                      value={numeroAfiliado}
                      onChange={(e) => setNumeroAfiliado(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Observaciones</label>
                  <textarea
                    rows={2}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Modificaciones</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Paciente</span>
                  <strong className="text-slate-900 font-extrabold">{paciente?.nombre} {paciente?.apellido}</strong>
                  <span className="text-slate-500 font-mono block text-[11px]">DNI: {paciente?.dni}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">WhatsApp / Contacto</span>
                  <strong className="text-slate-900">{paciente?.telefono_whatsapp || 'Sin registrar'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Obra Social</span>
                  <span className="font-bold text-slate-800">{obraSocial?.nombre || 'Particular / Privado'}</span>
                  {paciente?.numero_afiliado && (
                    <span className="text-[10px] text-slate-500 block">Afiliado: {paciente.numero_afiliado}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Observaciones</span>
                  <span className="text-slate-700 italic text-[11px]">{turno.observaciones || 'Ninguna'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ACCIONES RÁPIDAS (FOOTER) */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Botón Acción Confirmar Asistencia */}
            <button
              onClick={handleToggleConfirmar}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-2xs cursor-pointer ${
                turno.confirmado_whatsapp 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
              title={turno.confirmado_whatsapp ? 'Turno confirmado. Clic para desmarcar.' : 'Confirmar asistencia del paciente (WhatsApp o Telefónico)'}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{turno.confirmado_whatsapp ? 'Asistencia Confirmada ✓' : 'Confirmar Asistencia'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onReprogramar(turno);
              }}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-medical-600" />
              <span>Reprogramar Fecha</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onCancelar(turno);
              }}
              className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelar Turno</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onVerVoucher(turno);
              }}
              className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Voucher / WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {turno.estado !== 'EN_ESPERA' && turno.estado !== 'EN_ATENCION' && turno.estado !== 'ATENDIDO' && (
              <button
                onClick={handleMarcarEnEspera}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Dar Presente (En Espera)</span>
              </button>
            )}

            {turno.estado === 'EN_ESPERA' && (
              <button
                onClick={handleLlamarConsulta}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Llamar a Consulta (TV)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
