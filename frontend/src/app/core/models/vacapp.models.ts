export interface Lote {
  id: string;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  capacidad?: number;
  created_at?: string;
}

export interface Bovino {
  id: string;
  crotal: string;
  nombre?: string;
  fecha_nacimiento: string;
  sexo: 'Macho' | 'Hembra';
  raza?: string;
  estado: 'Activo' | 'Vendido' | 'Muerto';
  lote_id?: string;
  
  // Genealogía
  padre_id?: string;
  madre_id?: string;
  
  lote?: Lote; // Datos unidos
  created_at?: string;
}

export interface Semental {
  id: string;
  nombre: string;
  raza?: string;
  procedencia?: string;
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
  tipo: string; // Vacuna, Desparasitación, Tratamiento, Saneamiento
  producto: string;
  observaciones?: string;
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
  categoria: string; // Venta, Alimentación, Veterinaria, Otros
  monto: number;
  fecha: string;
  descripcion?: string;
  bovino_id?: string;
  created_at?: string;
}
