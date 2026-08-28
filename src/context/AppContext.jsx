import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageService, initLocalStorage } from '../services/storage';
import { CloudSyncService } from '../services/cloudSync';
import { ArcaService } from '../services/arcaService';
import { AiService } from '../services/aiService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  useEffect(() => {
    initLocalStorage();
    CloudSyncService.pullFromCloud(true).then(res => {
      refreshAll();
    });
  }, []);

  // Vistas principales: 'paciente' | 'agenda' | 'recepcion' | 'tv' | 'doctor' | 'admin' | 'hce' | 'facturacion'
  const [currentView, setCurrentView] = useState('agenda');
  const [adminTab, setAdminTab] = useState('especialidades');

  // Usuario y Clínica Activa (Multi-Tenant)
  const [activeClinica, setActiveClinicaState] = useState(() => StorageService.getClinicaActiva());
  const [allClinicas, setAllClinicas] = useState(() => StorageService.getClinicasList());
  const [currentUser, setCurrentUserState] = useState(() => StorageService.getCurrentUser());

  // Entidades principales (todas las colecciones maestras sincronizadas con Supabase)
  const [especialidades, setEspecialidades] = useState(() => StorageService.getEspecialidades());
  const [servicios, setServicios] = useState(() => StorageService.getServicios());
  const [consultorios, setConsultorios] = useState(() => StorageService.getConsultorios());
  const [obrasSociales, setObrasSociales] = useState(() => StorageService.getObrasSociales());
  const [planes, setPlanes] = useState(() => StorageService.getPlanes());
  const [nomenclador, setNomenclador] = useState(() => StorageService.getNomenclador());
  const [conveniosCoseguros, setConveniosCoseguros] = useState(() => StorageService.getConveniosCoseguros());
  const [profesionales, setProfesionales] = useState(() => StorageService.getProfesionales());
  const [horarios, setHorarios] = useState(() => StorageService.getHorarios());
  const [agendas, setAgendas] = useState(() => StorageService.getAgendas());
  const [bloqueos, setBloqueos] = useState(() => StorageService.getBloqueos());
  const [pacientes, setPacientes] = useState(() => StorageService.getPacientes());
  const [turnos, setTurnos] = useState(() => StorageService.getTurnos());
  const [motivos, setMotivos] = useState(() => StorageService.getMotivos());
  const [atencionesHce, setAtencionesHce] = useState(() => StorageService.getAtencionesHce());
  const [tvCalls, setTvCalls] = useState(() => StorageService.getTvCalls());
  const [users, setUsers] = useState(() => StorageService.getUsers());
  const [movimientosCaja, setMovimientosCaja] = useState(() => StorageService.getMovimientosCaja());
  const [lotesFacturacion, setLotesFacturacion] = useState(() => StorageService.getLotesFacturacion());
  const [comprobantesArca, setComprobantesArca] = useState(() => ArcaService.getComprobantes());
  const [consentimientos, setConsentimientos] = useState(() => StorageService.getConsentimientos());

  // Toasts
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  };

  // Refrescar todas las colecciones desde Storage / Supabase
  const refreshAll = () => {
    const clin = StorageService.getClinicaActiva();
    setActiveClinicaState(clin);
    setAllClinicas(StorageService.getClinicasList());
    setCurrentUserState(StorageService.getCurrentUser());
    setUsers(StorageService.getUsers());
    setEspecialidades(StorageService.getEspecialidades());
    setServicios(StorageService.getServicios());
    setConsultorios(StorageService.getConsultorios());
    setObrasSociales(StorageService.getObrasSociales());
    setPlanes(StorageService.getPlanes());
    setNomenclador(StorageService.getNomenclador());
    setConveniosCoseguros(StorageService.getConveniosCoseguros());
    setProfesionales(StorageService.getProfesionales());
    setAgendas(StorageService.getAgendas());
    setHorarios(StorageService.getHorarios());
    setBloqueos(StorageService.getBloqueos());
    setPacientes(StorageService.getPacientes());
    setTurnos(StorageService.getTurnos());
    setMotivos(StorageService.getMotivos());
    setAtencionesHce(StorageService.getAtencionesHce());
    setTvCalls(StorageService.getTvCalls());
    setMovimientosCaja(StorageService.getMovimientosCaja());
    setLotesFacturacion(StorageService.getLotesFacturacion());
    setComprobantesArca(ArcaService.getComprobantes());
    setConsentimientos(StorageService.getConsentimientos());
  };

  // ABM Motivos de Cancelación / Reprogramación
  const saveMotivo = (motivoData) => {
    const saved = StorageService.saveMotivo(motivoData);
    setMotivos(StorageService.getMotivos());
    showToast(`Motivo "${saved.descripcion}" guardado`);
    return saved;
  };

  const deleteMotivo = (id) => {
    StorageService.deleteMotivo(id);
    setMotivos(StorageService.getMotivos());
    showToast('Motivo eliminado', 'info');
  };

  // Cambiar de Clínica (Multi-Tenant Switcher)
  const switchClinica = (clinicaId) => {
    const list = StorageService.getClinicasList();
    const target = list.find(c => c.id === clinicaId);
    if (target) {
      StorageService.setClinicaActiva(target);
      setActiveClinicaState(target);
      // Refrescar entidades para la nueva clínica
      setConsultorios(StorageService.getConsultorios(target.id));
      setObrasSociales(StorageService.getObrasSociales(target.id));
      setNomenclador(StorageService.getNomenclador(target.id));
      setProfesionales(StorageService.getProfesionales(target.id));
      setBloqueos(StorageService.getBloqueos(target.id));
      setPacientes(StorageService.getPacientes(target.id));
      setTurnos(StorageService.getTurnos(target.id));
      showToast(`Cambiando a: ${target.nombre}`);
    }
  };

  // Cambiar de Usuario / Rol
  const switchUser = (user) => {
    StorageService.setCurrentUser(user);
    setCurrentUserState(user);
    if (user.clinica_id) {
      switchClinica(user.clinica_id);
    }
    if (user.rol === 'PROFESIONAL') {
      setCurrentView('doctor');
    } else if (user.rol === 'SECRETARIA') {
      setCurrentView('agenda');
    } else if (user.rol === 'SUPERADMIN' || user.rol === 'ADMIN_CLINICA') {
      setCurrentView('agenda');
    }
    showToast(`Sesión activa: ${user.nombre} (${user.rol})`);
  };

  const logoutUser = () => {
    StorageService.setCurrentUser(null);
    setCurrentUserState(null);
    setCurrentView('login');
    showToast('Sesión cerrada correctamente', 'info');
  };

  // ABM Usuarios & Accesos
  const saveUser = (userData) => {
    const saved = StorageService.saveUser(userData);
    setUsers(StorageService.getUsers());
    showToast(`Usuario "${saved.nombre}" guardado correctamente`);
    return saved;
  };

  const deleteUser = (id) => {
    StorageService.deleteUser(id);
    setUsers(StorageService.getUsers());
    showToast('Usuario eliminado', 'info');
  };

  const authenticateUser = (email, password) => {
    return StorageService.authenticateUser(email, password);
  };

  // Sincronización en la Nube (PC ↔ Celular)
  const syncWithCloud = async () => {
    showToast('Subiendo cambios a Supabase...', 'info');
    const res = await CloudSyncService.pushToCloud();
    if (res.success) {
      showToast('☁️ ¡Cambios sincronizados en la nube con éxito!');
    } else {
      showToast(`Nube: ${res.message || 'Guardado local'}`, 'info');
    }
  };

  const pullFromCloudNow = async () => {
    showToast('Descargando datos de la nube...', 'info');
    const res = await CloudSyncService.pullFromCloud();
    if (res.success) {
      refreshAll();
      showToast('☁️ ¡Datos actualizados desde la nube!');
    } else {
      showToast('Tu dispositivo ya está actualizado.', 'info');
    }
  };

  // Guardar Clínica
  const saveClinica = (clinicaData) => {
    const saved = StorageService.saveClinica(clinicaData);
    setAllClinicas(StorageService.getClinicasList());
    setActiveClinicaState(StorageService.getClinicaActiva());
    showToast(`Clínica "${saved.nombre}" guardada`);
    return saved;
  };

  // ABM Especialidades
  const saveEspecialidad = (espData) => {
    const saved = StorageService.saveEspecialidad(espData);
    setEspecialidades(StorageService.getEspecialidades());
    showToast(`Especialidad "${saved.nombre}" guardada`);
    return saved;
  };

  const deleteEspecialidad = (id) => {
    StorageService.deleteEspecialidad(id);
    setEspecialidades(StorageService.getEspecialidades());
    showToast('Especialidad eliminada', 'info');
  };

  // ABM Servicios Médicos (Líneas de Atención)
  const saveServicio = (servData) => {
    const saved = StorageService.saveServicio(servData);
    setServicios(StorageService.getServicios());
    showToast(`Servicio "${saved.nombre}" guardado`);
    return saved;
  };

  const deleteServicio = (id) => {
    StorageService.deleteServicio(id);
    setServicios(StorageService.getServicios());
    showToast('Servicio eliminado', 'info');
  };

  // ABM Obras Sociales y Planes
  const saveObraSocial = (osData) => {
    const saved = StorageService.saveObraSocial(osData);
    setObrasSociales(StorageService.getObrasSociales());
    showToast(`Obra Social "${saved.nombre}" guardada`);
    return saved;
  };

  const deleteObraSocial = (id) => {
    StorageService.deleteObraSocial(id);
    setObrasSociales(StorageService.getObrasSociales());
    setPlanes(StorageService.getPlanes());
    showToast('Obra Social eliminada', 'info');
  };

  const savePlan = (planData) => {
    const saved = StorageService.savePlan(planData);
    setPlanes(StorageService.getPlanes());
    showToast(`Plan "${saved.nombre_plan}" guardado`);
    return saved;
  };

  const deletePlan = (id) => {
    StorageService.deletePlan(id);
    setPlanes(StorageService.getPlanes());
    showToast('Plan eliminado', 'info');
  };

  // ABM Nomenclador
  const savePractica = (practicaData) => {
    const saved = StorageService.savePractica(practicaData);
    setNomenclador(StorageService.getNomenclador());
    showToast(`Práctica "${saved.codigo_pmo} - ${saved.descripcion}" guardada`);
    return saved;
  };

  const deletePractica = (id) => {
    StorageService.deletePractica(id);
    setNomenclador(StorageService.getNomenclador());
    showToast('Práctica eliminada', 'info');
  };

  // Coseguros
  const saveConvenioCoseguro = (convenioData) => {
    const saved = StorageService.saveConvenioCoseguro(convenioData);
    setConveniosCoseguros(StorageService.getConveniosCoseguros());
    showToast('Regla de Coseguro actualizada');
    return saved;
  };

  // Consultorios
  const saveConsultorio = (consData) => {
    const saved = StorageService.saveConsultorio(consData);
    setConsultorios(StorageService.getConsultorios());
    showToast(`Consultorio "${saved.nombre}" guardado`);
    return saved;
  };

  const deleteConsultorio = (id) => {
    StorageService.deleteConsultorio(id);
    setConsultorios(StorageService.getConsultorios());
    showToast('Consultorio eliminado', 'info');
  };

  // Profesionales
  const saveProfesional = (profData) => {
    const saved = StorageService.saveProfesional(profData);
    setProfesionales(StorageService.getProfesionales('TODAS'));
    setAgendas(StorageService.getAgendas());
    setHorarios(StorageService.getHorarios());
    showToast(`Profesional Dr(a). ${saved.apellido} guardado con éxito`);
    return saved;
  };

  const deleteProfesional = (id) => {
    StorageService.deleteProfesional(id);
    setProfesionales(StorageService.getProfesionales());
    setHorarios(StorageService.getHorarios());
    showToast('Profesional eliminado', 'info');
  };

  // Horarios / Agendas en Lote
  const saveHorario = (horarioData) => {
    const saved = StorageService.saveHorario(horarioData);
    setHorarios(StorageService.getHorarios());
    showToast('Horario guardado');
    return saved;
  };

  const deleteHorario = (id) => {
    StorageService.deleteHorario(id);
    setHorarios(StorageService.getHorarios());
    showToast('Horario eliminado', 'info');
  };

  // AGENDAS MÉDICAS PROFESIONALES (Vigencias, Cierre y Auditoría)
  const saveAgenda = (agendaData) => {
    const saved = StorageService.saveAgenda(agendaData);
    setAgendas(StorageService.getAgendas());
    setHorarios(StorageService.getHorarios());
    showToast(`Agenda "${saved.nombre}" guardada con éxito`);
    return saved;
  };

  const cerrarAgenda = (agendaId, motivo) => {
    const closed = StorageService.cerrarAgenda(agendaId, motivo);
    setAgendas(StorageService.getAgendas(null, null, true));
    setHorarios(StorageService.getHorarios());
    showToast('Agenda cerrada con éxito', 'info');
    return closed;
  };

  const reactivarAgenda = (agendaId) => {
    const reactivated = StorageService.reactivarAgenda(agendaId);
    setAgendas(StorageService.getAgendas(null, null, true));
    setHorarios(StorageService.getHorarios());
    showToast('Agenda reactivada con éxito');
    return reactivated;
  };

  const deleteAgenda = (agendaId) => {
    try {
      StorageService.deleteAgenda(agendaId);
      setAgendas(StorageService.getAgendas(null, null, true));
      setHorarios(StorageService.getHorarios());
      showToast('Agenda eliminada definitivamente', 'info');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const configurarAgendaSemanal = (agendaParams) => {
    const nuevasFranjas = StorageService.configurarAgendaSemanal(agendaParams);
    setAgendas(StorageService.getAgendas());
    setHorarios(StorageService.getHorarios());
    showToast(`Agenda configurada con éxito`);
    return nuevasFranjas;
  };

  // Bloqueos
  const saveBloqueo = (bloqueoData) => {
    const saved = StorageService.saveBloqueo(bloqueoData);
    setBloqueos(StorageService.getBloqueos());
    showToast(`Bloqueo "${saved.motivo}" registrado`);
    return saved;
  };

  const deleteBloqueo = (id) => {
    StorageService.deleteBloqueo(id);
    setBloqueos(StorageService.getBloqueos());
    showToast('Bloqueo eliminado', 'info');
  };

  // Pacientes (Padrón Central)
  const savePaciente = (pacienteData) => {
    const saved = StorageService.savePaciente(pacienteData);
    setPacientes(StorageService.getPacientes());
    showToast(`Paciente "${saved.nombre} ${saved.apellido}" guardado en padrón`);
    return saved;
  };

  const deletePaciente = (id) => {
    try {
      StorageService.deletePaciente(id);
      setPacientes(StorageService.getPacientes());
      showToast('Paciente eliminado del padrón', 'info');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const limpiarFacturacion = () => {
    StorageService.limpiarFacturacion();
    setMovimientosCaja([]);
    setComprobantesArca([]);
    setLotesFacturacion([]);
    showToast('Facturación y comprobantes reseteados a cero.', 'info');
  };

  const resetTurnosYFacturacion = () => {
    StorageService.resetTurnosYFacturacion();
    setTurnos([]);
    setAtencionesHce([]);
    setMovimientosCaja([]);
    setComprobantesArca([]);
    setLotesFacturacion([]);
    showToast('Turnos y facturación reseteados a CERO para pruebas limpias.', 'info');
  };

  // Turnos
  const createTurno = ({ pacienteData, turnoData }) => {
    // 1. Verificación clínica estricta (fechas pasadas, horas pasadas, colisiones y sobreturnos)
    const validacion = StorageService.validarTurno(turnoData);
    if (!validacion.valido) {
      showToast(`⚠️ ${validacion.mensaje}`, 'error');
      return { error: validacion.codigo, message: validacion.mensaje };
    }

    const pac = StorageService.savePaciente(pacienteData);
    const coseguroCalculado = StorageService.calcularCoseguro(
      turnoData.obra_social_id,
      turnoData.plan_id,
      turnoData.practica_id
    );

    const nuevoTurno = {
      ...turnoData,
      clinica_id: activeClinica.id,
      paciente_id: pac.id,
      monto_coseguro: turnoData.monto_coseguro !== undefined ? turnoData.monto_coseguro : coseguroCalculado,
      estado_coseguro: coseguroCalculado === 0 ? 'EXENTO' : 'PENDIENTE',
      confirmado_whatsapp: false,
      fecha_hora_inicio: `${turnoData.fecha}T${turnoData.hora_inicio}:00`,
      fecha_hora_fin: `${turnoData.fecha}T${turnoData.hora_fin}:00`,
      estado: turnoData.estado || 'PROGRAMADO'
    };

    const saved = StorageService.saveTurno(nuevoTurno);
    setPacientes(StorageService.getPacientes());
    setTurnos(StorageService.getTurnos());
    showToast(`¡Turno reservado exitosamente! Código: ${saved.codigo_reserva}`);
    return { turno: saved, paciente: pac };
  };

  const updateTurnoEstado = (turnoId, nuevoEstado, extraFields = {}) => {
    const turnosList = StorageService.getTurnos();
    const turno = turnosList.find(t => t.id === turnoId);
    if (!turno) return;

    const now = new Date().toISOString();
    const updates = { estado: nuevoEstado, ...extraFields };

    if (nuevoEstado === 'EN_ESPERA' && !turno.hora_llegada_recepcion) {
      updates.hora_llegada_recepcion = now;
    } else if (nuevoEstado === 'EN_ATENCION') {
      updates.hora_llamado_atencion = now;
      
      // Notificar al llamador de TV local y a Smart TVs en la nube por WebSocket
      const pac = pacientes.find(p => p.id === turno.paciente_id);
      const prof = profesionales.find(p => p.id === turno.profesional_id);
      const cons = consultorios.find(c => c.id === turno.consultorio_id);
      const newCall = StorageService.addTvCall(
        { ...turno, paciente: pac },
        cons?.nombre,
        prof ? `Dr(a). ${prof.nombre} ${prof.apellido}` : ''
      );
      setTvCalls(StorageService.getTvCalls());
      CloudSyncService.broadcastTvCall(newCall);
    } else if (nuevoEstado === 'ATENDIDO') {
      updates.hora_fin_atencion = now;
    }

    const updated = StorageService.saveTurno({ ...turno, ...updates });
    setTurnos(StorageService.getTurnos());
    return updated;
  };

  const confirmarTurnoPorPaciente = (turnoId) => {
    const turno = turnos.find(t => t.id === turnoId);
    if (!turno) return;

    const updated = StorageService.saveTurno({
      ...turno,
      confirmado_whatsapp: true,
      estado: turno.estado === 'PROGRAMADO' ? 'CONFIRMADO' : turno.estado
    });
    setTurnos(StorageService.getTurnos());
    showToast('¡Asistencia confirmada exitosamente!');
    return updated;
  };

  const registrarCobroCoseguro = (turnoId, medioPago, numeroComprobante) => {
    const turno = turnos.find(t => t.id === turnoId);
    if (!turno) return;

    const updated = StorageService.saveTurno({
      ...turno,
      estado_coseguro: 'COBRADO',
      medio_pago_coseguro: medioPago,
      comprobante_pago_nro: numeroComprobante || `REC-${Date.now().toString().slice(-6)}`
    });
    setTurnos(StorageService.getTurnos());

    // Registrar automáticamente el movimiento en la Caja Diaria
    const pacienteObj = pacientes.find(p => p.id === turno.paciente_id);
    const profObj = profesionales.find(p => p.id === turno.profesional_id);
    const osObj = obrasSociales.find(o => o.id === turno.obra_social_id);

    StorageService.saveMovimientoCaja({
      tipo: 'INGRESO',
      concepto: `Cobro Coseguro / Consulta (${turno.codigo_reserva})`,
      turno_id: turno.id,
      paciente_nombre: pacienteObj ? `${pacienteObj.nombre} ${pacienteObj.apellido}` : 'Paciente',
      paciente_dni: pacienteObj?.dni || '',
      profesional_nombre: profObj ? `Dr(a). ${profObj.nombre} ${profObj.apellido}` : 'Profesional',
      obra_social_nombre: osObj?.nombre || 'Particular',
      forma_pago: medioPago || 'EFECTIVO',
      monto: Number(turno.monto_coseguro || 0),
      usuario_nombre: currentUser?.nombre || 'Secretaría',
      comprobante: numeroComprobante || `REC-${Date.now().toString().slice(-6)}`,
      observaciones: 'Cobro de coseguro en recepción'
    });
    setMovimientosCaja(StorageService.getMovimientosCaja());

    showToast('Cobro de coseguro registrado e ingresado a Caja');
    return updated;
  };

  // Movimientos de Caja Manuales (Ingreso / Egreso)
  const saveMovimientoCaja = (movData) => {
    const saved = StorageService.saveMovimientoCaja({
      ...movData,
      usuario_nombre: currentUser?.nombre || 'Administrador'
    });
    setMovimientosCaja(StorageService.getMovimientosCaja());
    showToast(`Movimiento de caja "$${saved.monto}" registrado`);
    return saved;
  };

  const deleteMovimientoCaja = (id) => {
    StorageService.deleteMovimientoCaja(id);
    setMovimientosCaja(StorageService.getMovimientosCaja());
    showToast('Movimiento de caja eliminado', 'info');
  };

  const reprogramarTurno = ({
    turnoId,
    nuevaFecha,
    nuevoSlot,
    nuevoProfesionalId = null,
    motivoId = null,
    motivoDescripcion = '',
    observaciones = ''
  }) => {
    const turno = turnos.find(t => t.id === turnoId);
    if (!turno) return;

    const profId = nuevoProfesionalId || turno.profesional_id;

    const updated = StorageService.saveTurno({
      ...turno,
      profesional_id: profId,
      fecha: nuevaFecha,
      hora_inicio: nuevoSlot.hora_inicio,
      hora_fin: nuevoSlot.hora_fin,
      consultorio_id: nuevoSlot.consultorio_id || turno.consultorio_id,
      fecha_hora_inicio: `${nuevaFecha}T${nuevoSlot.hora_inicio}:00`,
      fecha_hora_fin: `${nuevaFecha}T${nuevoSlot.hora_fin}:00`,
      estado: 'PROGRAMADO',
      confirmado_whatsapp: false,
      motivo_reprogramacion_id: motivoId || null,
      motivo_reprogramacion: motivoDescripcion || 'Reprogramado por secretaría',
      observaciones_reprogramacion: observaciones || '',
      historial_reprogramaciones: [
        ...(turno.historial_reprogramaciones || []),
        {
          fecha_anterior: turno.fecha,
          hora_anterior: turno.hora_inicio,
          profesional_anterior_id: turno.profesional_id,
          fecha_cambio: new Date().toISOString(),
          motivo: motivoDescripcion,
          observaciones
        }
      ],
      hora_llegada_recepcion: null,
      hora_llamado_atencion: null,
      hora_fin_atencion: null
    });
    setTurnos(StorageService.getTurnos());
    showToast(`Turno reprogramado para el ${nuevaFecha} a las ${nuevoSlot.hora_inicio}`);
    return updated;
  };

  const cancelarTurno = ({
    turnoId,
    motivoId = null,
    motivoDescripcion = '',
    observaciones = '',
    canceladoPor = 'SECRETARIA'
  }) => {
    const turno = turnos.find(t => t.id === turnoId);
    if (!turno) return;

    const updated = StorageService.saveTurno({
      ...turno,
      estado: 'CANCELADO',
      motivo_cancelacion_id: motivoId || null,
      motivo_cancelacion: motivoDescripcion || 'Cancelación solicitada',
      observaciones_cancelacion: observaciones || '',
      fecha_cancelacion: new Date().toISOString(),
      cancelado_por: canceladoPor
    });
    setTurnos(StorageService.getTurnos());
    showToast('Turno cancelado', 'info');
    return updated;
  };

  // Crear Paquete de Sesiones Recurrentes (Kinesio, Psico, Fisioterapia)
  const crearPaqueteSesiones = (paqueteData) => {
    const result = StorageService.createPaqueteSesiones(paqueteData);
    setTurnos(StorageService.getTurnos());
    setPacientes(StorageService.getPacientes());
    showToast(`¡Paquete de ${result.total_sesiones} sesiones generado con éxito!`);
    return result;
  };

  // HCE
  const saveAtencionHce = (atencionData) => {
    const saved = StorageService.saveAtencionHce(atencionData);
    setAtencionesHce(StorageService.getAtencionesHce());
    showToast('Evolución guardada en Historia Clínica');
    return saved;
  };

  // LOTES DE FACTURACIÓN (PRESENTACIÓN A OBRAS SOCIALES & CPPC)
  const saveLoteFacturacion = (loteData) => {
    const saved = StorageService.saveLoteFacturacion(loteData);
    setLotesFacturacion(StorageService.getLotesFacturacion(activeClinica?.id));
    showToast(`Lote ${saved.numero_lote} guardado con éxito`);
    return saved;
  };

  const deleteLoteFacturacion = (id) => {
    StorageService.deleteLoteFacturacion(id);
    setLotesFacturacion(StorageService.getLotesFacturacion(activeClinica?.id));
    showToast('Lote eliminado', 'info');
  };

  // CUENTAS CORRIENTES
  const saveMovimientoCtaCtePaciente = (movData) => {
    const saved = StorageService.saveMovimientoCtaCtePaciente(movData);
    showToast('Movimiento de cuenta corriente registrado');
    return saved;
  };

  const saveMovimientoCtaCteOs = (movData) => {
    const saved = StorageService.saveMovimientoCtaCteOs(movData);
    showToast('Movimiento de cuenta corriente de obra social registrado');
    return saved;
  };

  // FACTURA ELECTRÓNICA ARCA (AFIP WSFE)
  const emitirComprobanteArca = async (params) => {
    try {
      const nuevoCbte = await ArcaService.emitirComprobante({
        clinica: activeClinica,
        ...params
      });
      setComprobantesArca(ArcaService.getComprobantes(activeClinica?.id));
      showToast(`Comprobante ${nuevoCbte.numero_completo} emitido ante ARCA (CAE: ${nuevoCbte.cae})`);
      return nuevoCbte;
    } catch (err) {
      showToast(`Error al emitir comprobante ARCA: ${err.message}`, 'error');
      throw err;
    }
  };

  // CONSENTIMIENTO INFORMADO DIGITAL
  const saveConsentimiento = (consentimientoData) => {
    const saved = StorageService.saveConsentimiento(consentimientoData);
    setConsentimientos(StorageService.getConsentimientos(activeClinica?.id));
    showToast('Consentimiento informado firmado y registrado digitalmente');
    return saved;
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        adminTab,
        setAdminTab,
        toast,
        showToast,
        activeClinica,
        clinica: activeClinica,
        allClinicas,
        switchClinica,
        saveClinica,
        currentUser,
        switchUser,
        logoutUser,
        especialidades,
        saveEspecialidad,
        deleteEspecialidad,
        servicios,
        saveServicio,
        deleteServicio,
        consultorios,
        obrasSociales,
        planes,
        nomenclador,
        conveniosCoseguros,
        profesionales,
        agendas,
        saveAgenda,
        cerrarAgenda,
        reactivarAgenda,
        deleteAgenda,
        horarios,
        bloqueos,
        pacientes,
        turnos,
        motivos,
        saveMotivo,
        deleteMotivo,
        atencionesHce,
        tvCalls,
        refreshAll,
        // ABMs & Operations
        saveObraSocial,
        deleteObraSocial,
        savePlan,
        deletePlan,
        savePractica,
        deletePractica,
        saveConvenioCoseguro,
        saveConsultorio,
        deleteConsultorio,
        saveProfesional,
        deleteProfesional,
        savePaciente,
        deletePaciente,
        saveHorario,
        deleteHorario,
        configurarAgendaSemanal,
        saveBloqueo,
        deleteBloqueo,
        createTurno,
        crearPaqueteSesiones,
        updateTurnoEstado,
        confirmarTurnoPorPaciente,
        registrarCobroCoseguro,
        reprogramarTurno,
        cancelarTurno,
        saveAtencionHce,
        // Lotes de Facturación
        lotesFacturacion,
        saveLoteFacturacion,
        deleteLoteFacturacion,
        // Cuentas Corrientes
        saveMovimientoCtaCtePaciente,
        saveMovimientoCtaCteOs,
        // Factura Electrónica ARCA
        comprobantesArca,
        emitirComprobanteArca,
        limpiarFacturacion,
        resetTurnosYFacturacion,
        // Consentimientos Informados
        consentimientos,
        saveConsentimiento,
        // Usuarios & Roles
        users,
        saveUser,
        deleteUser,
        authenticateUser,
        // Caja Recaudadora
        movimientosCaja,
        saveMovimientoCaja,
        deleteMovimientoCaja,
        // Nube & Supabase Sync
        syncWithCloud,
        pullFromCloudNow
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp debe usarse dentro de un AppProvider');
  return context;
};
