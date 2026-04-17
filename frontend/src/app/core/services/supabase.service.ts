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
    if (environment.supabaseUrl && environment.supabaseKey && !environment.useMockData) {
      this.supabase = createClient(
        environment.supabaseUrl,
        environment.supabaseKey
      );
    } else {
      const mode = environment.useMockData ? 'MODO MOCK (Forzado)' : 'MODO MOCK (Por falta de credenciales)';
      console.warn(`Ejecutando en ${mode}. Almacenamiento local activo.`);
      this.seedTestData();
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
    if (!this.supabase || environment.useMockData) {
      const stored = localStorage.getItem(`mock_${table}`);
      let data = stored ? (JSON.parse(stored) as T[]) : [];
      // Enriquecemos los datos mock para que coincidan con los JOINS de Supabase real
      data = await this.enrichMockData(table, data);
      return { data, error: null };
    }
    
    // Consulta real a Supabase
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

    if (!this.supabase || environment.useMockData) {
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
    if (!this.supabase || environment.useMockData) {
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
    if (!this.supabase || environment.useMockData) {
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

  /**
   * Actualiza el lote de un bovino basándose en su peso (Lógica Determinista).
   */
  async updateBovinoLote(bovinoId: string, peso: number) {
    let nuevoLoteId = '';
    let nombreLote = '';

    if (peso < 150) {
      nuevoLoteId = 'UUID_LOTE_RECRIA_INICIAL';
      nombreLote = 'Recría Inicial';
    } else if (peso >= 150 && peso <= 300) {
      nuevoLoteId = 'UUID_LOTE_DESARROLLO';
      nombreLote = 'Desarrollo';
    } else {
      nuevoLoteId = 'UUID_LOTE_FINALIZACION';
      nombreLote = 'Finalización';
    }

    try {
      if (!this.supabase) {
        // Mock Update
        const { data: bovinos } = await this.getRawMock('bovinos');
        const index = bovinos.findIndex((b: any) => b.id === bovinoId);
        if (index !== -1) {
          const oldLoteId = bovinos[index].lote_id;
          bovinos[index].lote_id = nuevoLoteId;
          localStorage.setItem('mock_bovinos', JSON.stringify(bovinos));
          return { data: { id: nuevoLoteId, nombre: nombreLote, changed: oldLoteId !== nuevoLoteId }, error: null };
        }
        return { data: null, error: 'Animal no encontrado' };
      }

      // Supabase Update
      const { data: currentBovino } = await this.supabase
        .from('bovinos')
        .select('lote_id')
        .eq('id', bovinoId)
        .single();

      const { error } = await this.supabase
        .from('bovinos')
        .update({ lote_id: nuevoLoteId })
        .eq('id', bovinoId);

      if (error) throw error;

      return { 
        data: { 
          id: nuevoLoteId, 
          nombre: nombreLote, 
          changed: currentBovino?.lote_id !== nuevoLoteId 
        }, 
        error: null 
      };
    } catch (e: any) {
      console.error('Error en updateBovinoLote:', e);
      return { data: null, error: e.message || 'Error técnico al actualizar lote' };
    }
  }

  /**
   * Genera un set de datos masivo y realista para demostración.
   */
  private seedTestData() {
    if (localStorage.getItem('vacapp_seeded') === 'true') return;

    const mockData: any = {
      empresas: [
        { id: 'emp-1', nombre: 'Ganadería Luxe Forest SL', nif: 'B12345678', created_at: new Date().toISOString() }
      ],
      fincas: [
        { id: 'finca-1', empresa_id: 'emp-1', nombre: 'Hacienda Los Alcornocales', ubicacion: 'Sierra Gaditana', created_at: new Date().toISOString() },
        { id: 'finca-2', empresa_id: 'emp-1', nombre: 'Dehesa El Robledo', ubicacion: 'Valle Norte', created_at: new Date().toISOString() }
      ],
      lotes: [
        { id: 'lote-1', finca_id: 'finca-1', nombre: 'Prado de Engorde', ubicacion: 'Zona Sur', capacidad: 50 },
        { id: 'lote-2', finca_id: 'finca-1', nombre: 'Recría Hembras', ubicacion: 'Cercado Norte', capacidad: 30 },
        { id: 'lote-3', finca_id: 'finca-2', nombre: 'Maternidad', ubicacion: 'Corrales Centrales', capacidad: 20 },
        { id: 'lote-4', finca_id: 'finca-2', nombre: 'Sementales', ubicacion: 'Paddock A', capacidad: 5 }
      ],
      bovinos: [],
      recria_pesajes: [],
      finanzas: [],
      sanidad: [],
      reproduccion: [],
      tareas: []
    };

    // Generar 20 Bovinos
    const razas = ['Limousin', 'Charolais', 'Angus', 'Retinta'];
    for (let i = 1; i <= 20; i++) {
        const id = `bov-${i}`;
        const sexo = i % 2 === 0 ? 'Hembra' : 'Macho';
        const raza = razas[Math.floor(Math.random() * razas.length)];
        const lote_id = i <= 5 ? 'lote-1' : (i <= 10 ? 'lote-2' : (i <= 15 ? 'lote-3' : 'lote-4'));
        const finca_id = i <= 10 ? 'finca-1' : 'finca-2';
        
        mockData.bovinos.push({
            id,
            crotal: `ES0${i}98765432${i}`,
            nombre: `${sexo === 'Hembra' ? 'Vaca' : 'Toro'} ${i}`,
            raza,
            sexo,
            finca_id,
            lote_id,
            estado_productivo: 'Alta',
            estado_reproductivo: sexo === 'Hembra' ? 'Vacía' : null,
            fecha_nacimiento: new Date(2022, Math.floor(Math.random() * 12), 1).toISOString(),
            created_at: new Date().toISOString()
        });

        // Generar historial de pesajes para cada bovino (6 pesajes por animal)
        let pesoBase = 45; // Nacimiento
        for (let j = 0; j < 6; j++) {
            const fecha = new Date();
            fecha.setMonth(fecha.getMonth() - (6 - j));
            pesoBase += 25 + Math.random() * 10;
            mockData.recria_pesajes.push({
                id: `pes-${id}-${j}`,
                bovino_id: id,
                fecha_pesaje: fecha.toISOString().split('T')[0],
                peso_kg: Math.round(pesoBase),
                tipo_pesaje: j === 0 ? 'Nacimiento' : 'Control'
            });
        }
    }

    // Generar Finanzas (12 meses)
    for (let i = 0; i < 12; i++) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);
        const label = `${fecha.toLocaleString('default', { month: 'short' })} ${fecha.getFullYear()}`;
        
        mockData.finanzas.push({
            id: `fin-i-${i}`,
            tipo: 'Ingreso',
            categoria: 'Venta',
            monto: 5000 + Math.random() * 2000,
            fecha: fecha.toISOString().split('T')[0],
            descripcion: `Venta mensual ${label}`
        });
        mockData.finanzas.push({
            id: `fin-g-${i}`,
            tipo: 'Gasto',
            categoria: 'Alimentación',
            monto: 2500 + Math.random() * 1000,
            fecha: fecha.toISOString().split('T')[0],
            descripcion: `Gasto pienso ${label}`
        });
    }

    // Guardar todo en LocalStorage
    Object.keys(mockData).forEach(table => {
        localStorage.setItem(`mock_${table}`, JSON.stringify(mockData[table]));
    });

    localStorage.setItem('vacapp_seeded', 'true');
    console.log('✅ Base de datos simulada poblada correctamente con éxito.');
  }
}
