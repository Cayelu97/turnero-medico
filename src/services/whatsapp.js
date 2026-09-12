import { StorageService } from './storage';

// Helper para generar y disparar enlaces de WhatsApp oficiales con mensajes preformateados

export const WhatsAppService = {
  // Limpiar número a formato internacional (Argentina: 549...)
  formatPhoneNumber: (phone) => {
    if (!phone) return '';
    let clean = phone.replace(/\D/g, '');
    
    // Si empieza con 0, removerlo (ej. 011 -> 11)
    if (clean.startsWith('0')) clean = clean.substring(1);
    
    // Si empieza con 15 (móvil arg), remover el 15
    if (clean.startsWith('15')) clean = clean.substring(2);

    // Si no tiene código de país, agregar +54 9 (Argentina móvil)
    if (!clean.startsWith('549') && !clean.startsWith('54')) {
      clean = `549${clean}`;
    } else if (clean.startsWith('54') && !clean.startsWith('549')) {
      clean = `549${clean.substring(2)}`;
    }
    return clean;
  },

  // Generar token compacto codificado en Base64 para hidratación y confirmación instantánea cross-device
  generarTokenTurno: ({ turno, paciente, profesional, consultorio, clinica }) => {
    try {
      const allClinicas = StorageService.getClinicasList();
      const targetClinica = clinica || allClinicas.find(c => c.id === turno?.clinica_id) || allClinicas[0];
      const payload = {
        c: turno?.codigo_reserva || '',
        id: turno?.id || '',
        f: turno?.fecha || '',
        hi: turno?.hora_inicio || '',
        hf: turno?.hora_fin || '',
        m: turno?.modalidad || 'PRESENCIAL',
        pid: paciente?.id || turno?.paciente_id || '',
        pn: paciente?.nombre || turno?.paciente_nombre || '',
        pa: paciente?.apellido || turno?.paciente_apellido || '',
        pd: paciente?.dni || turno?.paciente_dni || '',
        pt: paciente?.telefono_whatsapp || turno?.paciente_telefono || '',
        paf: paciente?.numero_afiliado || turno?.numero_afiliado || '',
        doc: profesional ? `${profesional.apellido || ''}, ${profesional.nombre || ''}`.trim() : (turno?.profesional_nombre || ''),
        esp: profesional?.especialidad || turno?.especialidad_nombre || '',
        docId: profesional?.id || turno?.profesional_id || '',
        cliId: targetClinica?.id || turno?.clinica_id || '',
        cliNom: targetClinica?.nombre || 'Sede Central',
        cliDir: targetClinica?.direccion || 'Av. Colón 1250, Córdoba',
        conNom: consultorio?.nombre || turno?.consultorio_nombre || 'Consultorio',
        osId: turno?.obra_social_id || paciente?.obra_social_id || '',
        osNom: turno?.obra_social_nombre || paciente?.obra_social_nombre || 'Particular / Privado',
        plId: turno?.plan_id || paciente?.plan_id || '',
        plNom: turno?.plan_nombre || paciente?.plan_nombre || '',
        cos: Number(turno?.monto_coseguro || 0),
        est: turno?.estado || 'PROGRAMADO'
      };
      return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    } catch {
      return '';
    }
  },

  // Generar mensaje de confirmación / recordatorio de turno con Sede y Dirección exactas
  generarMensajeTurno: ({ turno, paciente, profesional, consultorio, clinica, tipo = 'NUEVO' }) => {
    const allClinicas = StorageService.getClinicasList();
    const targetClinica = clinica || allClinicas.find(c => c.id === turno?.clinica_id) || allClinicas[0];
    const clinicaNombre = targetClinica?.nombre || 'Sede Central';
    const clinicaDir = targetClinica?.direccion || 'Av. Colón 1250, Córdoba';
    const esOnline = turno?.modalidad === 'ONLINE' || targetClinica?.id === 'clinica-4';

    const docNombre = profesional ? `Dr(a). ${profesional.nombre} ${profesional.apellido} (${profesional.especialidad})` : (turno?.profesional_nombre || 'Profesional');
    const pacNombre = paciente ? `${paciente.nombre} ${paciente.apellido}` : (turno?.paciente_nombre || 'Estimado/a paciente');
    const consultorioNombre = consultorio?.nombre || (esOnline ? 'Consultorio Virtual' : 'Consultorio de Atención');

    const osNombre = turno?.obra_social_nombre || paciente?.obra_social_nombre || 'Particular / Privado';
    const planNombre = turno?.plan_nombre || paciente?.plan_nombre || '';
    const coberturaDetalle = `${osNombre}${planNombre ? ` (${planNombre})` : ''}`;
    const coseguroTexto = turno?.monto_coseguro > 0 
      ? `• Coseguro a abonar en recepción: *$${Number(turno.monto_coseguro).toLocaleString('es-AR')}* (Efectivo / Transferencia / Débito)\n`
      : `• Coseguro: *Sin cargo / Cobertura 100%*\n`;

    const token = WhatsAppService.generarTokenTurno({ turno, paciente, profesional, consultorio, clinica: targetClinica });
    const baseUrl = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'https://saludnetar.vercel.app';
    const linkConfirmacion = turno?.codigo_reserva 
      ? `${baseUrl}/?confirmar=${turno.codigo_reserva}${token ? `&t=${token}` : ''}` 
      : `${baseUrl}/?view=mis_turnos`;

    if (tipo === 'CANCELADO') {
      return (
        `Hola ${pacNombre}, te informamos que tu turno para *${clinicaNombre}* ha sido *CANCELADO*.\n\n` +
        `❌ *Detalles del turno cancelado:*\n` +
        `• Código de Reserva: ${turno?.codigo_reserva || 'S/D'}\n` +
        `• Profesional: ${docNombre}\n` +
        `• Sede: ${clinicaNombre}\n` +
        `• Fecha y Hora: ${turno?.fecha} a las ${turno?.hora_inicio} hs\n` +
        `• Cobertura: ${coberturaDetalle}\n\n` +
        `Si deseas solicitar un nuevo turno, podés ingresar a:\n` +
        `👉 ${baseUrl}`
      );
    }

    if (tipo === 'REPROGRAMADO') {
      return (
        `Hola ${pacNombre}, tu turno en *${clinicaNombre}* ha sido *REPROGRAMADO* exitosamente.\n\n` +
        `🗓️ *NUEVOS DETALLES DEL TURNO:*\n` +
        `• Código de Reserva: *${turno?.codigo_reserva}*\n` +
        `• Profesional: *${docNombre}*\n` +
        `• Fecha: *${turno?.fecha}*\n` +
        `• Horario: *${turno?.hora_inicio} hs*\n` +
        `• Modalidad: ${esOnline ? '💻 Consulta Online / Videollamada' : '🏢 Presencial'}\n` +
        `• Sede de Atención: *📍 ${clinicaNombre}*\n` +
        `• Dirección: *${clinicaDir}*\n` +
        `• Consultorio: ${consultorioNombre}\n` +
        `• Cobertura Médica: ${coberturaDetalle}\n` +
        coseguroTexto + `\n` +
        (esOnline 
          ? `🔗 Te enviaremos el enlace de la videollamada previo al inicio del turno.\n\n`
          : `⚠️ Por favor presentarse 10 minutos antes en recepción con DNI y carnet de cobertura.\n\n`) +
        `📲 *CONFIRMAR O CANCELAR TU ASISTENCIA (1 Clic):*\n` +
        `👉 ${linkConfirmacion}\n\n` +
        `¡Te esperamos!`
      );
    }

    if (tipo === 'RECORDATORIO') {
      return (
        `Hola ${pacNombre}, te recordamos tu próximo turno médico en *${clinicaNombre}*:\n\n` +
        `⏰ *RECORDATORIO DE CITA:*\n` +
        `• Código de Reserva: *${turno?.codigo_reserva}*\n` +
        `• Profesional: *${docNombre}*\n` +
        `• Fecha: *${turno?.fecha}*\n` +
        `• Horario: *${turno?.hora_inicio} hs*\n` +
        `• Modalidad: ${esOnline ? '💻 Consulta Online / Videollamada' : '🏢 Presencial'}\n` +
        `• Sede de Atención: *📍 ${clinicaNombre}*\n` +
        `• Dirección: *${clinicaDir}*\n` +
        `• Consultorio: ${consultorioNombre}\n` +
        `• Cobertura Médica: ${coberturaDetalle}\n` +
        coseguroTexto + `\n` +
        (esOnline 
          ? `🔗 Ten lista la conexión para la videollamada a la hora pactada.\n\n`
          : `⚠️ Presentarse 10 minutos antes con DNI y credencial médica.\n\n`) +
        `📲 *CONFIRMAR O CANCELAR TU ASISTENCIA (1 Clic):*\n` +
        `Por favor confirmá si vas a asistir o cancelá tu turno con un clic en:\n` +
        `👉 ${linkConfirmacion}\n\n` +
        `¡Muchas gracias!`
      );
    }

    // Tipo NUEVO / CONFIRMACIÓN
    return (
      `Hola ${pacNombre}, confirmamos tu turno en *${clinicaNombre}*.\n\n` +
      `🩺 *DETALLES DE TU TURNO:*\n` +
      `• Código de Reserva: *${turno?.codigo_reserva}*\n` +
      `• Profesional: *${docNombre}*\n` +
      `• Fecha: *${turno?.fecha}*\n` +
      `• Horario: *${turno?.hora_inicio} hs*\n` +
      `• Modalidad: ${esOnline ? '💻 Consulta Online / Videollamada' : '🏢 Presencial'}\n` +
      `• Sede de Atención: *📍 ${clinicaNombre}*\n` +
      `• Dirección: *${clinicaDir}*\n` +
      `• Consultorio: ${consultorioNombre}\n` +
      `• Cobertura Médica: ${coberturaDetalle}\n` +
      coseguroTexto + `\n` +
      (esOnline 
        ? `🔗 *Instrucciones:* El enlace de videollamada se habilitará en tu portal antes de la consulta.\n\n`
        : `⚠️ *Requisitos:* Presentarse 10 minutos antes en recepción con DNI y credencial médica.\n\n`) +
      `📲 *CONFIRMAR O GESTIONAR TU TURNO (1 Clic):*\n` +
      `👉 ${linkConfirmacion}\n\n` +
      `¡Te esperamos!`
    );
  },

  // Abrir ventana de WhatsApp Web / App
  enviarMensaje: ({ telefono, turno, paciente, profesional, consultorio, clinica, tipo = 'NUEVO' }) => {
    const phone = telefono || paciente?.telefono_whatsapp;
    const formattedPhone = WhatsAppService.formatPhoneNumber(phone);
    const text = WhatsAppService.generarMensajeTurno({ turno, paciente, profesional, consultorio, clinica, tipo });
    const encodedText = encodeURIComponent(text);
    
    const url = formattedPhone 
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(url, '_blank');
  }
};
