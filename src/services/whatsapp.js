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

  // Generar mensaje de confirmación de turno
  generarMensajeTurno: ({ turno, paciente, profesional, consultorio, clinica, tipo = 'NUEVO' }) => {
    const clinicaNombre = clinica?.nombre || 'Centro Médico San Lucas';
    const clinicaDir = clinica?.direccion || 'Av. Santa Fe 2450';
    const docNombre = profesional ? `Dr(a). ${profesional.nombre} ${profesional.apellido} (${profesional.especialidad})` : 'Profesional Médico';
    const pacNombre = paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Estimado/a paciente';
    const consultorioNombre = consultorio?.nombre || 'Consultorio';

    if (tipo === 'CANCELADO') {
      return (
        `Hola ${pacNombre}, te informamos que tu turno en *${clinicaNombre}* ha sido *CANCELADO*.\n\n` +
        `❌ *Detalles del turno cancelado:*\n` +
        `• Código: ${turno.codigo_reserva}\n` +
        `• Médico: ${docNombre}\n` +
        `• Fecha: ${turno.fecha} a las ${turno.hora_inicio} hs\n\n` +
        `Si deseas reprogramarlo, puedes ingresar a nuestro turnero online o comunicarte con recepción.`
      );
    }

    if (tipo === 'REPROGRAMADO') {
      return (
        `Hola ${pacNombre}, tu turno en *${clinicaNombre}* ha sido *REPROGRAMADO* exitosamente.\n\n` +
        `🗓️ *NUEVA FECHA Y HORA:*\n` +
        `• Fecha: *${turno.fecha}*\n` +
        `• Horario: *${turno.hora_inicio} hs*\n` +
        `• Profesional: ${docNombre}\n` +
        `• Lugar: ${consultorioNombre} (${clinicaDir})\n` +
        `• Código de reserva: *${turno.codigo_reserva}*\n\n` +
        `Por favor presentarse 10 minutos antes con DNI y credencial médica.`
      );
    }

    // Tipo NUEVO
    return (
      `Hola ${pacNombre}, confirmamos tu turno en *${clinicaNombre}*.\n\n` +
      `🩺 *DETALLES DE TU TURNO:*\n` +
      `• Código de Reserva: *${turno.codigo_reserva}*\n` +
      `• Fecha: *${turno.fecha}*\n` +
      `• Horario: *${turno.hora_inicio} hs*\n` +
      `• Profesional: *${docNombre}*\n` +
      `• Ubicación: ${consultorioNombre} (${clinicaDir})\n` +
      `${turno.monto_coseguro > 0 ? `• Coseguro estimado en recepción: $${Number(turno.monto_coseguro).toLocaleString('es-AR')}\n` : ''}\n` +
      `⚠️ *Requisitos:* Presentarse 10 minutos antes en recepción con DNI y credencial médica.\n\n` +
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
