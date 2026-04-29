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
    const hasCredentials = !!(environment.supabaseUrl && environment.supabaseKey);
    const mockForced = !!environment.useMockData;

    if (hasCredentials && !mockForced) {
      try {
        this.supabase = createClient(
          environment.supabaseUrl, 
          environment.supabaseKey
        );
        console.log('%c✅ Vacapp: Conexión establecida con Supabase.', 'color: #2d6a4f; font-weight: bold;');
      } catch (error) {
        console.error('❌ Vacapp: Error crítico al inicializar el cliente de Supabase:', error);
      }
    } else {
      // Determinamos la razón del modo Mock
      const reason = mockForced 
        ? 'MODO MOCK (Forzado por configuración)' 
        : 'MODO MOCK (Fallback: Faltan credenciales)';
      
      console.warn(`%c🚀 Vacapp: Ejecutando en ${reason}.`, 'color: #d4a373; font-weight: bold;');
      console.info('Utilizando almacenamiento LocalStorage para persistencia temporal.');
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

  /** --- INTELIGENCIA DE DATOS (VISTA ÚNICA) --- **/

  /**
   * Obtiene toda la información relacionada de un animal en una sola carga.
   * Ideal para la Vista de Detalle Única.
   */
  async getAnimalCompleteData(id: string) {
    if (!this.supabase || environment.useMockData) {
      // Mock Aggregation
      const { data: bovinos } = await this.getAll<any>('bovinos');
      const bovino = bovinos.find(b => b.id === id);
      
      const { data: sanidad } = await this.getAll<any>('sanidad');
      const { data: repro } = await this.getAll<any>('reproduccion');
      const { data: pesajes } = await this.getAll<any>('recria_pesajes');
      const { data: finanzas } = await this.getAll<any>('finanzas');

      return {
        data: {
          bovino,
          sanidad: sanidad.filter((s: any) => s.bovino_id === id),
          reproduccion: repro.filter((r: any) => r.bovino_id === id),
          pesajes: pesajes.filter((p: any) => p.bovino_id === id),
          finanzas: finanzas.filter((f: any) => f.bovino_id === id)
        },
        error: null
      };
    }

    // Supabase Parallel Fetch
    const [bovinoRes, sanidadRes, reproRes, pesajesRes, finanzasRes] = await Promise.all([
      this.supabase.from('bovinos').select('*, lote:lote_id(*)').eq('id', id).single(),
      this.supabase.from('sanidad').select('*').eq('bovino_id', id).order('fecha', { ascending: false }),
      this.supabase.from('reproduccion').select('*, semental:semental_id(*)').eq('bovino_id', id).order('created_at', { ascending: false }),
      this.supabase.from('recria_pesajes').select('*').eq('bovino_id', id).order('fecha_pesaje', { ascending: false }),
      this.supabase.from('finanzas').select('*').eq('bovino_id', id).order('fecha', { ascending: false })
    ]);

    return {
      data: {
        bovino: bovinoRes.data,
        sanidad: sanidadRes.data || [],
        reproduccion: reproRes.data || [],
        pesajes: pesajesRes.data || [],
        finanzas: finanzasRes.data || []
      },
      error: bovinoRes.error
    };
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
   * Genera un set de datos masivo, relacional y coherente para demostración.
   */
  private seedTestData() {
    // Si ya existe la versión 2, no re-sembramos
    if (localStorage.getItem('vacapp_seeded_v2') === 'true') return;

    const now = new Date();
    const daysAgo = (d: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      return date.toISOString();
    };
    const monthsAgo = (m: number) => {
      const date = new Date(now);
      const days = Math.floor(m * 30);
      date.setDate(date.getDate() - days);
      return date.toISOString();
    };
    const yearsAgo = (y: number) => {
      const date = new Date(now);
      date.setFullYear(date.getFullYear() - y);
      return date.toISOString();
    };

    const mockData: any = {
      empresas: [
        { id: 'emp-1', nombre: 'Ganadería La Excelencia', nif: 'B12345678', created_at: yearsAgo(5) }
      ],
      fincas: [
        { id: 'finca-1', empresa_id: 'emp-1', nombre: 'Hacienda Los Alcornocales', ubicacion: 'Sierra Gaditana', created_at: yearsAgo(5) }
      ],
      lotes: [
        { id: 'lote-repro', finca_id: 'finca-1', nombre: 'Lote de Cría', ubicacion: 'Zona Norte', capacidad: 50 },
        { id: 'lote-engorde', finca_id: 'finca-1', nombre: 'Prado de Engorde', ubicacion: 'Zona Sur', capacidad: 50 },
        { id: 'lote-maternidad', finca_id: 'finca-1', nombre: 'Corral Maternidad', ubicacion: 'Centro', capacidad: 20 }
      ],
      sementales: [
        { id: 'sem-1', nombre: 'Titán', raza: 'Limousin', finca_id: 'finca-1' }
      ],
      bovinos: [],
      recria_pesajes: [],
      finanzas: [],
      sanidad: [],
      reproduccion: [],
      tareas: []
    };

    // 1. MARGARITA (La Productora Estrella)
    const idMargarita = 'bov-margarita';
    mockData.bovinos.push({
      id: idMargarita,
      crotal: 'ES123456789',
      nombre: 'Margarita',
      raza: 'Limousin',
      sexo: 'Hembra',
      finca_id: 'finca-1',
      lote_id: 'lote-maternidad',
      estado_productivo: 'Alta',
      estado_reproductivo: 'Lactante',
      fecha_nacimiento: yearsAgo(4),
      created_at: yearsAgo(4)
    });

    // Pesajes Margarita (500kg -> 620kg)
    [
      { d: 365, p: 500, t: 'Control Anual' },
      { d: 270, p: 530, t: 'Control Trimestral' },
      { d: 180, p: 560, t: 'Control Trimestral' },
      { d: 90, p: 590, t: 'Control Pre-parto' },
      { d: 30, p: 610, t: 'Control Post-parto' },
      { d: 0, p: 620, t: 'Actual' }
    ].forEach((w, i) => {
      mockData.recria_pesajes.push({
        id: `pes-marg-${i}`,
        bovino_id: idMargarita,
        fecha_pesaje: daysAgo(w.d).split('T')[0],
        peso_kg: w.p,
        tipo_pesaje: w.t
      });
    });

    // Reproducción Margarita
    mockData.reproduccion.push({
      id: 'rep-marg-1',
      bovino_id: idMargarita,
      tipo_cubricion: 'Monta Natural',
      fecha_parto_prevista: daysAgo(365).split('T')[0], 
      estado_gestacion: 'Parido',
      created_at: yearsAgo(1)
    });
    mockData.reproduccion.push({
      id: 'rep-marg-2',
      bovino_id: idMargarita,
      fecha_cubricion: monthsAgo(8).split('T')[0],
      tipo_cubricion: 'Inseminación Artificial',
      semental_id: 'sem-1',
      estado_gestacion: 'Confirmada',
      created_at: monthsAgo(8)
    });
    // Record de confirmación de preñez (6 meses hace)
    mockData.tareas.push({
      id: 'tar-marg-1',
      finca_id: 'finca-1',
      bovino_id: idMargarita,
      titulo: 'Confirmación Preñez (Eco)',
      fecha_vencimiento: monthsAgo(6).split('T')[0],
      estado: 'Completada',
      creada_por_sistema: true
    });
    // Parto reciente (hace 1 semana)
    mockData.reproduccion.push({
      id: 'rep-marg-3',
      bovino_id: idMargarita,
      fecha_cubricion: monthsAgo(9.5).split('T')[0],
      estado_gestacion: 'Parido',
      observaciones_parto: 'Parto natural sin complicaciones. Ternero sano.',
      created_at: daysAgo(7)
    });

    // Sanidad Margarita
    mockData.sanidad.push({
      id: 'san-marg-1',
      bovino_id: idMargarita,
      fecha: monthsAgo(11).split('T')[0],
      tipo: 'Vacunación',
      producto: 'Vacuna BVD/IBR',
      costo_aplicacion: 25,
      observaciones: 'Anual obligatoria'
    });
    mockData.sanidad.push({
      id: 'san-marg-2',
      bovino_id: idMargarita,
      fecha: daysAgo(4).split('T')[0],
      tipo: 'Test/Diagnóstico',
      producto: 'Revisión Post-parto',
      costo_aplicacion: 45,
      observaciones: 'Estado uterino perfecto'
    });

    // Finanzas Margarita
    mockData.finanzas.push({
      id: 'fin-marg-1',
      tipo: 'Gasto',
      categoria: 'Genética',
      monto: 60,
      fecha: monthsAgo(8).split('T')[0],
      descripcion: 'Pajuela Semen Limousin (Titán)',
      bovino_id: idMargarita
    });
    mockData.finanzas.push({
      id: 'fin-marg-2',
      tipo: 'Gasto',
      categoria: 'Veterinaria',
      monto: 45,
      fecha: daysAgo(4).split('T')[0],
      descripcion: 'Revisión Post-parto Margarita',
      bovino_id: idMargarita
    });

    // 2. TORO (El Ternero de Engorde)
    const idToro = 'bov-toro';
    mockData.bovinos.push({
      id: idToro,
      crotal: 'ES987654321',
      nombre: 'Toro',
      raza: 'Charolais',
      sexo: 'Macho',
      finca_id: 'finca-1',
      lote_id: 'lote-engorde',
      estado_productivo: 'Alta',
      aptitud: 'Carne',
      fecha_nacimiento: monthsAgo(8),
      created_at: monthsAgo(8)
    });

    // Pesajes Toro (Curva exponencial: 40 -> 120 -> 250)
    [
        { d: 240, p: 40, t: 'Nacimiento' },
        { d: 120, p: 135, t: 'Destete' },
        { d: 60, p: 190, t: 'Control Engorde' },
        { d: 0, p: 250, t: 'Actual' }
    ].forEach((w, i) => {
        mockData.recria_pesajes.push({
            id: `pes-toro-${i}`,
            bovino_id: idToro,
            fecha_pesaje: daysAgo(w.d).split('T')[0],
            peso_kg: w.p,
            tipo_pesaje: w.t
        });
    });

    // Sanidad Toro
    mockData.sanidad.push({
        id: 'san-toro-1',
        bovino_id: idToro,
        fecha: monthsAgo(7).split('T')[0],
        tipo: 'Desparasitación',
        producto: 'Ivermectina',
        costo_aplicacion: 12
    });
    mockData.sanidad.push({
        id: 'san-toro-2',
        bovino_id: idToro,
        fecha: monthsAgo(6).split('T')[0],
        tipo: 'Vacunación',
        producto: 'Clostridiosis Initial',
        costo_aplicacion: 15
    });

    // 3. PINTA (Vaca en Tratamiento)
    const idPinta = 'bov-pinta';
    mockData.bovinos.push({
        id: idPinta,
        crotal: 'ES555444333',
        nombre: 'Pinta',
        raza: 'Frisona',
        sexo: 'Hembra',
        finca_id: 'finca-1',
        lote_id: 'lote-maternidad',
        estado_productivo: 'Alta',
        estado_reproductivo: 'Gestante',
        fecha_nacimiento: yearsAgo(3),
        created_at: yearsAgo(3)
    });

    // Sanidad Pinta (Mastitis Cycle)
    mockData.sanidad.push({
        id: 'san-pinta-1',
        bovino_id: idPinta,
        fecha: daysAgo(60).split('T')[0],
        tipo: 'Test/Diagnóstico',
        producto: 'Test Mastitis California',
        costo_aplicacion: 10,
        observaciones: 'Positivo en cuarto posterior derecho'
    });
    mockData.sanidad.push({
        id: 'san-pinta-2',
        bovino_id: idPinta,
        fecha: daysAgo(58).split('T')[0],
        tipo: 'Tratamiento',
        producto: 'Cobactan Antibiótico',
        costo_aplicacion: 85,
        dias_retiro_leche: 5,
        observaciones: 'Tratamiento agresivo para salvar el cuarto'
    });
    mockData.sanidad.push({
        id: 'san-pinta-3',
        bovino_id: idPinta,
        fecha: daysAgo(50).split('T')[0],
        tipo: 'Test/Diagnóstico',
        producto: 'Alta Médica',
        costo_aplicacion: 20,
        observaciones: 'Animal recuperado completamente'
    });

    // Finanzas Pinta
    mockData.finanzas.push({
        id: 'fin-pinta-1',
        tipo: 'Gasto',
        categoria: 'Veterinaria',
        monto: 115,
        fecha: daysAgo(58).split('T')[0],
        descripcion: 'Tratamiento Mastitis Aguda Pinta',
        bovino_id: idPinta
    });

    // 4. DATOS GENERALES (Dashboard)
    const razasExtras = ['Limousin', 'Charolais', 'Angus', 'Retinta'];
    for (let i = 1; i <= 17; i++) {
        const id = `bov-extra-${i}`;
        const sexo = i % 2 === 0 ? 'Hembra' : 'Macho';
        mockData.bovinos.push({
            id,
            crotal: `ES000${100+i}98765`,
            nombre: `Res ${i}`,
            raza: razasExtras[i % 4],
            sexo,
            finca_id: 'finca-1',
            lote_id: i < 8 ? 'lote-repro' : 'lote-engorde',
            estado_productivo: 'Alta',
            fecha_nacimiento: yearsAgo(2 + (i % 3)),
            created_at: yearsAgo(2)
        });
    }

    // Finanzas Dashboard (15+ registros últimos 6 meses)
    const financialEvents = [
        { cat: 'Venta', tipo: 'Ingreso', min: 2000, max: 3000, desc: 'Liquidación mensual leche' },
        { cat: 'Alimentación', tipo: 'Gasto', min: 800, max: 1500, desc: 'Compra pienso concentrado' },
        { cat: 'Venta', tipo: 'Ingreso', min: 4000, max: 6000, desc: 'Venta lote destete' },
        { cat: 'Veterinaria', tipo: 'Gasto', min: 100, max: 300, desc: 'Suministros botiquín' },
        { cat: 'Otros', tipo: 'Gasto', min: 50, max: 200, desc: 'Reparación vallado' }
    ];

    for (let m = 0; m < 6; m++) {
        financialEvents.forEach((ev, i) => {
            if (Math.random() > 0.3) {
                mockData.finanzas.push({
                    id: `fin-gen-${m}-${i}`,
                    tipo: ev.tipo as 'Ingreso' | 'Gasto',
                    categoria: ev.cat,
                    monto: Math.round(ev.min + Math.random() * (ev.max - ev.min)),
                    fecha: monthsAgo(m).split('T')[0],
                    descripcion: `${ev.desc} - ${monthsAgo(m).split('T')[0]}`
                });
            }
        });
    }

    // Persistencia
    Object.keys(mockData).forEach(table => {
      localStorage.setItem(`mock_${table}`, JSON.stringify(mockData[table]));
    });

    localStorage.setItem('vacapp_seeded_v2', 'true');
    localStorage.setItem('vacapp_seeded', 'true');
    console.log('%c💎 Vacapp: Base de Datos Relacional inyectada con éxito.', 'color: #38b000; font-weight: bold;');
  }

}
