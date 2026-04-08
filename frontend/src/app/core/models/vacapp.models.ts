export interface UserProfile {
  id: string; // Auth.uid
  email: string;
  rol: 'Propietario' | 'Veterinario' | 'Trabajador';
  empresa_id?: string;
  display_name?: string;
  created_at?: string;
}

export interface Empresa {
  id: string;
  nombre: string;
  nif?: string;
  telefono?: string;
  created_at?: string;
}

export interface Finca {
  id: string;
  empresa_id: string;
  nombre: string;
  ubicacion?: string;
  codigo_explotacion?: string;
  created_at?: string;
  empresa?: Empresa; // Relación
}

export interface Lote {
  id: string;
  finca_id: string;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  capacidad?: number;
  created_at?: string;
  finca?: Finca; // Relación
}

export interface Bovino {
  id: string;
  crotal: string;
  finca_id: string;
  nombre?: string;
  fecha_nacimiento: string;
  sexo: 'Macho' | 'Hembra';
  
  // ERP Attributes
  raza?: string;
  porcentaje_pureza?: number;
  aptitud?: 'Carne' | 'Leche' | 'Doble Propósito' | 'Trabajo/Lidia';
  estado_productivo: 'Alta' | 'Baja Venta' | 'Baja Muerte' | 'Baja Descarte';
  estado_reproductivo?: 'Vacía' | 'Gestante' | 'Lactante' | 'Seca';
  
  lote_id?: string;
  foto_url?: string;
  
  // Genealogía
  padre_id?: string;
  madre_id?: string;
  coeficiente_consanguinidad?: number;
  
  lote?: Lote; // Datos unidos
  created_at?: string;
}

export interface Semental {
  id: string;
  nombre: string;
  raza?: string;
  procedencia?: string;
  finca_id: string;
  finca?: Finca;
  created_at?: string;
}

export interface Reproduccion {
  id: string;
  bovino_id: string;
  semental_id?: string;
  semental?: Semental;
  fecha_celo?: string;
  fecha_cubricion?: string;
  tipo_cubricion?: 'Monta Natural' | 'Inseminación Artificial';
  fecha_parto_prevista?: string;
  estado_gestacion: 'Pendiente' | 'Confirmada' | 'Parido' | 'Fallida';
  observaciones_parto?: string;
  created_at?: string;
  bovino?: Bovino; // Útil para mostrar crotal/nombre en la lista
}

export interface Cruce {
  id: string;
  madre_id: string;
  padre_id: string;
  fecha_cruce: string;
  exito: boolean;
  observaciones?: string;
  created_at?: string;
}

export interface Sanidad {
  id: string;
  bovino_id: string;
  fecha: string;
  tipo: 'Vacunación' | 'Desparasitación' | 'Tratamiento' | 'Cirugía' | 'Test/Diagnóstico';
  producto: string;
  lote_medicamento?: string;
  dias_retiro_carne?: number;
  dias_retiro_leche?: number;
  observaciones?: string;
  costo_aplicacion?: number;
  created_at?: string;
  bovino?: Bovino; // Unido
}

export interface Pesaje {
  id: string;
  bovino_id: string;
  fecha_pesaje: string;
  peso_kg: number;
  tipo_pesaje: string;
  created_at?: string;
  bovino?: Bovino; // Unido
}

export interface Alimentacion {
  id: string;
  lote_id: string;
  tipo_racion: string;
  cantidad?: string;
  fecha: string;
  created_at?: string;
  lote?: Lote; // Unido
}

export interface Finanzas {
  id: string;
  tipo: 'Ingreso' | 'Gasto';
  categoria: string; // Venta, Alimentación, Veterinaria, Adquisición, Otros
  monto: number;
  fecha: string;
  descripcion?: string;
  bovino_id?: string;
  finca_id?: string;
  created_at?: string;
}

export interface Tarea {
  id: string;
  finca_id: string;
  bovino_id?: string;
  titulo: string;
  fecha_vencimiento: string;
  estado: 'Pendiente' | 'Completada' | 'Omitida';
  tipo_tarea?: string;
  creada_por_sistema: boolean;
  created_at?: string;
  bovino?: Bovino;
}
