// ==============================================================================
// UTILIDADES DE FECHAS SEGURAS (Inmune a desfasajes de UTC y husos horarios)
// ==============================================================================

/**
 * Retorna fecha YYYY-MM-DD en hora local del usuario (sin desplazamientos de UTC).
 */
export const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene el día de la semana (0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb)
 * a partir de un string 'YYYY-MM-DD', de forma 100% segura.
 */
export const getDayOfWeekFromDateString = (dateStr) => {
  if (!dateStr) return 0;
  const parts = dateStr.split('T')[0].split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return 0;
  const [y, m, d] = parts;
  const dateObj = new Date(y, m - 1, d, 12, 0, 0); // Mediodía local
  return dateObj.getDay();
};

/**
 * Formatea un string 'YYYY-MM-DD' en formato legible 'Lun, 17 ago'
 */
export const getDayDetailsFromDateString = (dateStr) => {
  if (!dateStr) return { diaNombre: '', diaNumero: '', mesNombre: '', diaSemana: 0 };
  const parts = dateStr.split('T')[0].split('-').map(Number);
  const [y, m, d] = parts;
  const dateObj = new Date(y, m - 1, d, 12, 0, 0);
  
  return {
    diaNombre: dateObj.toLocaleDateString('es-AR', { weekday: 'short' }),
    diaNumero: dateObj.getDate(),
    mesNombre: dateObj.toLocaleDateString('es-AR', { month: 'short' }),
    diaSemana: dateObj.getDay()
  };
};

/**
 * Suma N días a una fecha base (dateStr YYYY-MM-DD o Date obj) de forma determinista
 */
export const addDaysToDateString = (startDate, daysToAdd) => {
  let baseDate;
  if (typeof startDate === 'string') {
    const parts = startDate.split('T')[0].split('-').map(Number);
    baseDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  } else {
    baseDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 12, 0, 0);
  }
  baseDate.setDate(baseDate.getDate() + daysToAdd);
  return getLocalDateString(baseDate);
};

export const DIAS_SEMANA_LABELS = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' }
];

export const formatDateAR = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return dateStr;
  const [y, m, d] = parts;
  const dateObj = new Date(y, m - 1, d, 12, 0, 0);
  return dateObj.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

