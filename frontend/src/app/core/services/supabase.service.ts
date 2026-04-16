import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Servicio central para la comunicación con Supabase.
 * Proporciona métodos genéricos para operaciones CRUD y un administrador de datos Mock (simulados).
 * El modo Mock se activa automáticamente si no se detectan credenciales en environment.ts.
 */
@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase?: SupabaseClient;

  constructor() {
    // Inicialización del cliente Supabase
    if (environment.supabaseUrl && environment.supabaseKey) {
      this.supabase = createClient(
        environment.supabaseUrl,
        environment.supabaseKey
      );
    } else {
      console.warn('Credenciales de Supabase no encontradas. Ejecutando en MODO MOCK (Local Storage).');
    }
  }

  /**
   * Retorna el cliente nativo para consultas personalizadas.
   */
  get client() {
    return this.supabase;
  }

  /**
   * Obtiene todos los registros de una tabla, con soporte para simulación Mock.
   */
  async getAll<T>(table: string) {
    if (!this.supabase) {
      const stored = localStorage.getItem(`mock_${table}`);
      if (stored) {
        let data = JSON.parse(stored) as T[];
        // Enriquecemos los datos mock para que coincidan con los JOINS de Supabase real
        data = await this.enrichMockData(table, data);
        return { data, error: null };
      }

      const mockInitial: any = {
        empresas: [
          { id: 'emp-1', nombre: 'Ganadería Premium SL', nif: 'B12345678', created_at: new Date().toISOString() }
        ],
        fincas: [
          { id: 'finca-1', empresa_id: 'emp-1', nombre: 'Finca Principal', ubicacion: 'Valle Central', created_at: new Date().toISOString() }
        ],
        bovinos: [
          { id: '1', crotal: 'ES0123456789', nombre: 'Vaca Lola', raza: 'Limousin', sexo: 'Hembra', estado: 'Activo', fecha_nacimiento: '2023-01-01', finca_id: 'finca-1', created_at: new Date().toISOString() },
          { id: '2', crotal: 'ES9876543210', nombre: 'Toro Gitano', raza: 'Charolais', sexo: 'Macho', estado: 'Activo', fecha_nacimiento: '2022-05-15', finca_id: 'finca-1', created_at: new Date().toISOString() },
          { id: '3', crotal: 'ES4455667788', nombre: 'Ternera Linda', raza: 'Limousin Cross', sexo: 'Hembra', estado: 'Activo', fecha_nacimiento: '2024-02-10', finca_id: 'finca-1', created_at: new Date().toISOString() }
        ],
        lotes: [
          { id: '1', finca_id: 'finca-1', nombre: 'Prado Alto', ubicacion: 'Zona Norte', created_at: new Date().toISOString() },
          { id: '2', finca_id: 'finca-1', nombre: 'Recría Hembras', ubicacion: 'Cercado Central', created_at: new Date().toISOString() }
        ],
        reproduccion: [
          { id: '1', bovino_id: '1', fecha_cubricion: '2026-01-15', tipo_cubricion: 'Monta Natural', fecha_parto_prevista: '2026-10-25', estado_gestacion: 'Confirmada' }
        ],
        sanidad: [
          { id: '1', bovino_id: '1', fecha: '2026-03-20', tipo: 'Vacunación', producto: 'Bovilis Blue Tongue', observaciones: 'Anual obligatoria' }
        ],
        recria_pesajes: [
          { id: '1', bovino_id: '1', fecha_pesaje: '2024-03-01', peso_kg: 45.0, tipo_pesaje: 'Nacimiento' },
          { id: '2', bovino_id: '1', fecha_pesaje: '2024-04-10', peso_kg: 62.5, tipo_pesaje: 'Recría' }
        ]
      };
      
      const data = mockInitial[table] || [];
      localStorage.setItem(`mock_${table}`, JSON.stringify(data));
      const enriched = await this.enrichMockData(table, data);
      return { data: enriched as T[], error: null };
    }
    
    // Consulta real a Supabase con ordenamiento por fecha de creación (Paginado para rendimiento)
    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, 49);
    return { data: data as T[], error };
  }

  /**
   * Simula los JOINs de base de datos para el modo Mock.
   */
  private async enrichMockData(table: string, data: any[]): Promise<any[]> {
    if (table === 'bovinos' || table === 'lotes') return data;

    // Si la tabla requiere información del bovino o lote, la "inyectamos" manualmente
    const { data: bovinos } = await this.getAll<any>('bovinos');
    
    return data.map(item => {
      if (item.bovino_id) {
        item.bovino = bovinos?.find(b => b.id === item.bovino_id);
      }
      return item;
    });
  }

  /**
   * Crea un nuevo registro en la base de datos (o modo Mock).
   */
  async create<T>(table: string, payload: Partial<T>) {
    // Inyectamos ID y timestamp para el modo Mock local
    const newRecord = { 
      id: Math.random().toString(36).substr(2, 9), 
      created_at: new Date().toISOString(),
      ...payload 
    };

    if (!this.supabase) {
      const { data } = await this.getRawMock(table);
      const updated = [newRecord, ...data];
      localStorage.setItem(`mock_${table}`, JSON.stringify(updated));
      // Retornamos el objeto enriquecido
      const enriched = await this.enrichMockData(table, [newRecord]);
      return { data: enriched[0] as T, error: null };
    }

    const { data, error } = await this.supabase
      .from(table)
      .insert(payload as any)
      .select()
      .single();
    return { data: data as T, error };
  }

  /**
   * Retorna los datos mock sin enriquecer para operaciones de escritura.
   */
  private async getRawMock(table: string) {
    const stored = localStorage.getItem(`mock_${table}`);
    return { data: stored ? JSON.parse(stored) : [], error: null };
  }

  /**
   * Actualiza un registro existente mediante su ID.
   */
  async update<T>(table: string, id: string, payload: Partial<T>) {
    if (!this.supabase) {
      const { data } = await this.getRawMock(table);
      const index = data.findIndex((item: any) => item.id === id);
      if (index !== -1) {
        data[index] = { ...data[index], ...payload };
        localStorage.setItem(`mock_${table}`, JSON.stringify(data));
        const enriched = await this.enrichMockData(table, [data[index]]);
        return { data: enriched[0] as T, error: null };
      }
      return { data: null as any, error: 'Error: Registro no localizado en almacenamiento local.' };
    }

    const { data, error } = await this.supabase
      .from(table)
      .update(payload as any)
      .eq('id', id)
      .select()
      .single();
    return { data: data as T, error };
  }

  /**
   * Elimina un registro físicamente.
   */
  async delete(table: string, id: string) {
    if (!this.supabase) {
      const { data } = await this.getRawMock(table);
      const updated = data.filter((item: any) => item.id !== id);
      localStorage.setItem(`mock_${table}`, JSON.stringify(updated));
      return { error: null };
    }

    const { error } = await this.supabase
      .from(table)
      .delete()
      .eq('id', id);
    return { error };
  }

  /** --- REALTIME Y SUSCRIPCIONES --- **/

  /**
   * Suscribirse a cambios en tiempo real en una tabla específica.
   */
  subscribeToTableChanges(table: string, callback: (payload: any) => void) {
    if (!this.supabase) return null;
    return this.supabase.channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: table }, payload => {
        callback(payload);
      })
      .subscribe();
  }

  /** --- MÉTODOS DE ABSTRACCIÓN POR MÓDULO --- **/

  async getSanidad() {
    if (!this.supabase) return this.getAll<any>('sanidad');
    const { data, error } = await this.supabase
      .from('sanidad')
      .select('*, bovino:bovino_id(crotal, nombre)')
      .order('fecha', { ascending: false });
    return { data, error };
  }

  async createSanidad(payload: any) {
    return this.create('sanidad', payload);
  }

  async updateSanidad(id: string, payload: any) {
    return this.update('sanidad', id, payload);
  }

  async deleteSanidad(id: string) {
    return this.delete('sanidad', id);
  }

  async getFemales() {
    const { data, error } = await this.getAll<any>('bovinos');
    return { 
      data: (data || []).filter(b => b.sexo === 'Hembra' && b.estado === 'Activo'), 
      error 
    };
  }

  async getReproduccion() {
    if (!this.supabase) return this.getAll<any>('reproduccion');
    const { data, error } = await this.supabase
      .from('reproduccion')
      .select('*, bovino:bovino_id(crotal, nombre)')
      .order('fecha_cubricion', { ascending: false });
    return { data, error };
  }

  async createReproduccion(payload: any) {
    return this.create('reproduccion', payload);
  }

  async updateReproduccion(id: string, payload: any) {
    return this.update('reproduccion', id, payload);
  }

  async deleteReproduccion(id: string) {
    return this.delete('reproduccion', id);
  }

  async getPesajes() {
    if (!this.supabase) return this.getAll<any>('recria_pesajes');
    const { data, error } = await this.supabase
      .from('recria_pesajes')
      .select('*, bovino:bovino_id(crotal, nombre)')
      .order('fecha_pesaje', { ascending: false });
    return { data, error };
  }

  async createPesaje(payload: any) {
    return this.create('recria_pesajes', payload);
  }

  async updatePesaje(id: string, payload: any) {
    return this.update('recria_pesajes', id, payload);
  }

  async deletePesaje(id: string) {
    return this.delete('recria_pesajes', id);
  }
}
