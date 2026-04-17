/**
 * CONSTANTES GLOBALES - MANEJO DE BOVINOS (VACAPP)
 * Centralización de opciones para formularios y etiquetas.
 */

export const RAZAS_BOVINAS = [
  'Angus',
  'Brahman',
  'Charolais',
  'Cruce / Mestizo',
  'Hereford',
  'Holstein',
  'Limousin',
  'Nelore',
  'Pardo Suizo',
  'Simmental',
  'Otro'
];

export const APTITUDES_BOVINAS = [
  'Carne',
  'Leche',
  'Doble Propósito',
  'Trabajo / Lidia',
  'Semental',
  'Cría'
];

export const ESTADOS_PRODUCTIVOS = [
  { value: 'Alta', label: 'Alta Confirmada (Finca)', color: 'success' },
  { value: 'Baja Venta', label: 'Baja por Venta', color: 'primary' },
  { value: 'Baja Muerte', label: 'Baja por Naturaleza/Muerte', color: 'danger' },
  { value: 'Baja Descarte', label: 'Baja por Descarte Sanitario', color: 'warning' }
];

export const ESTADOS_REPRODUCTIVOS = [
  { value: 'Vacía', label: 'Vacía / Abierta', color: 'medium' },
  { value: 'Gestante', label: 'Gestante Conf.', color: 'success' },
  { value: 'Lactante', label: 'Lactante (Parida)', color: 'primary' },
  { value: 'Seca', label: 'Seca', color: 'warning' }
];

export const TIPOS_EVENTO_SANIDAD = [
  'Vacunación',
  'Desparasitación',
  'Saneamiento',
  'Herida / Traumatismo',
  'Enfermedad Metabólica',
  'Infección',
  'Control Rutinario'
];

export const TIPOS_PESAJE = [
  'Nacimiento',
  'Destete',
  'Recría',
  'Finalización',
  'Peso Mensual',
  'Báscula Automática'
];

export const METODOS_REPRODUCCION = [
  'Monta Natural',
  'Inseminación Artificial',
  'Transferencia de Embriones'
];

export const ESTADOS_GESTACION = [
  'Pendiente',
  'Confirmada',
  'Parido',
  'Fallida'
];
