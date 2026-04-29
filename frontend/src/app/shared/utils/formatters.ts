/**
 * Utilidades puras y estáticas para formateo y cálculos en toda la aplicación.
 * Sigue el principio DRY para evitar duplicación en los componentes.
 */

/**
 * Formatea un número como moneda Euro.
 * @param {number} value - El monto a formatear.
 * @returns {string} El monto formateado como '1.200,50 €'.
 */
export function formatCurrency(value: number): string {
  if (value == null) return '0,00 €';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Calcula la edad en base a la fecha de nacimiento.
 * @param {string | Date} birthDate - La fecha de nacimiento.
 * @returns {string} La edad en formato amigable (ej. '2 años, 3 meses' o '4 meses').
 */
export function calculateAgeDesc(birthDate: string | Date): string {
  if (!birthDate) return 'Desconocida';
  
  const birth = new Date(birthDate);
  const now = new Date();
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  
  if (now.getDate() < birth.getDate()) {
    months--;
    if (months < 0) {
      months += 12;
    }
  }

  if (years > 0) {
    return `${years} año${years > 1 ? 's' : ''}${months > 0 ? `, ${months} mes${months > 1 ? 'es' : ''}` : ''}`;
  } else if (months > 0) {
    return `${months} mes${months > 1 ? 'es' : ''}`;
  } else {
    return 'Menos de 1 mes';
  }
}

/**
 * Parsea y formatea una fecha ISO a un formato local legible.
 * @param {string | Date} date - Fecha a formatear.
 * @returns {string} Fecha formateada (ej. '12 Ene 2024').
 */
export function formatDate(date: string | Date): string {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date));
}

/**
 * Obtiene el color de la clase de badge según el estado reproductivo.
 * @param {string} status - Estado reproductivo ('Gestante', 'Seca', etc).
 * @returns {string} El nombre del color de Ionic (ej. 'success', 'warning').
 */
export function getBadgeColorForReproStatus(status: string | undefined | null): string {
  if (!status) return 'medium';
  switch (status.toLowerCase()) {
    case 'confirmada':
    case 'gestante': return 'success';
    case 'fallida': return 'danger';
    case 'pendiente': return 'warning';
    default: return 'medium';
  }
}
