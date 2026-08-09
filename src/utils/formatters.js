/**
 * Formateador de fechas a estándar argentino DD/MM/YYYY
 */
export const formatDateAR = (dateStr) => {
  if (!dateStr) return '';
  // Si ya viene con barras o formato ISO con T
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return dateStr;
};

/**
 * Formateador de moneda en pesos argentinos ($)
 */
export const formatCurrencyAR = (amount) => {
  const num = Number(amount) || 0;
  return `$${num.toLocaleString('es-AR')}`;
};
