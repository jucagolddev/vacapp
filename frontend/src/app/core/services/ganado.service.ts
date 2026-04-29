import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { FincaService } from './finca.service';
import { Bovino } from '../models/vacapp.models';
import * as VacaConst from '../constants/vaca.constants';
import { calculateAgeDesc } from '../../shared/utils/formatters';

/**
 * @class GanadoService
 * @description Servicio de dominio que encapsula toda la lógica de negocio y el estado
 * relacionado con el inventario principal de bovinos. 
 * Utiliza Angular Signals para exponer un estado reactivo unidireccional a los componentes.
 */
@Injectable({
  providedIn: 'root'
})
export class GanadoService {
  private supabase = inject(SupabaseService);
  private fincaService = inject(FincaService);

  // Exponer constantes para la UI
  // Exponer constantes para la UI
  readonly constants = {
    RAZAS_BOVINAS: VacaConst.RAZAS_BOVINAS,
    APTITUDES_BOVINAS: VacaConst.APTITUDES_BOVINAS,
    ESTADOS_PRODUCTIVOS: VacaConst.ESTADOS_PRODUCTIVOS,
    ESTADOS_REPRODUCTIVOS: VacaConst.ESTADOS_REPRODUCTIVOS,
    TIPOS_EVENTO_SANIDAD: VacaConst.TIPOS_EVENTO_SANIDAD,
    TIPOS_PESAJE: VacaConst.TIPOS_PESAJE,
    METODOS_REPRODUCCION: VacaConst.METODOS_REPRODUCCION,
    ESTADOS_GESTACION: VacaConst.ESTADOS_GESTACION
  };

  // Estado interno
  private bovinosSignal = signal<Bovino[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Selectores expuestos
  readonly bovinos = computed(() => this.bovinosSignal());
  readonly isLoading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  // Métricas derivadas
  readonly totalBovinos = computed(() => this.bovinosSignal().length);
  readonly totalHembras = computed(() => this.bovinosSignal().filter(b => b.sexo === 'Hembra').length);
  readonly totalMachos = computed(() => this.bovinosSignal().filter(b => b.sexo === 'Macho').length);

  // Listas filtradas reactivas
  readonly bovinosAlta = computed(() => this.bovinosSignal().filter(b => b.estado_productivo === 'Alta'));
  readonly hembrasActivas = computed(() => this.bovinosSignal().filter(b => b.sexo === 'Hembra' && b.estado_productivo === 'Alta'));
  readonly machosActivos = computed(() => this.bovinosSignal().filter(b => b.sexo === 'Macho' && b.estado_productivo === 'Alta'));

  // Distribución por Aptitud
  readonly distAptitud = computed(() => {
    const map: Record<string, number> = {};
    this.bovinosSignal().forEach(b => {
      const val = b.aptitud || 'No definida';
      map[val] = (map[val] || 0) + 1;
    });
    return map;
  });

  // Distribución por Categoría Zootécnica (Auto-calculada)
  readonly distCategoria = computed(() => {
    const map: Record<string, number> = {};
    this.bovinosSignal().forEach(b => {
      const cat = this.calculateCategoria(b);
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  });

  // Distribución por Lotes
  readonly distLotes = computed(() => {
    const map: Record<string, number> = {};
    this.bovinosSignal().forEach(b => {
      const loteName = b.lote?.nombre || 'Sin Lote';
      map[loteName] = (map[loteName] || 0) + 1;
    });
    return map;
  });

  // Lógica de cálculo centralizada
  
  /**
   * @description Determina la categoría zootécnica de un animal en función de su edad y sexo.
   * Útil para segmentación de lotes, planes de alimentación o análisis económico.
   * @param {Bovino} b El registro del bovino a evaluar.
   * @returns {string} Categoría calculada (ej. 'Ternera', 'Novilla', 'Vaca').
   */
  calculateCategoria(b: Bovino): string {
    if (!b.fecha_nacimiento) return 'Sin Categoría';
    const birthDate = new Date(b.fecha_nacimiento);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - birthDate.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));

    if (b.sexo === 'Hembra') {
       if (diffMonths <= 12) return 'Ternera';
       if (diffMonths > 12 && diffMonths <= 36) return 'Novilla';
       return 'Vaca';
    } else {
       if (diffMonths <= 12) return 'Ternero';
       if (diffMonths > 12 && diffMonths <= 24) return 'Añojo';
       if (diffMonths > 24 && diffMonths <= 36) return 'Novillo';
       return 'Toro';
    }
  }

  /**
   * @description Convierte la fecha de nacimiento en una cadena legible de edad.
   * Maneja tanto años como meses para animales jóvenes.
   * @param {Bovino} b El registro del bovino.
   * @returns {string} Edad legible (ej. "3 años", "8 meses").
   */
  getEdadDesc(b: Bovino): string {
    return calculateAgeDesc(b.fecha_nacimiento);
  }

  /**
   * @description Calcula la Unidad de Ganado Mayor (UGM o UGB) basada en la edad.
   * Fundamental para estudios de carga ganadera y capacidad de carga de los pastos.
   * @param {Bovino} b El registro del bovino.
   * @returns {number} Valor UGB (0.4 para terneros, 0.6 novillos, 1.0 adultos).
   */
  getUgb(b: Bovino): number {
    if (!b.fecha_nacimiento) return 1.0;
    const birthDate = new Date(b.fecha_nacimiento);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - birthDate.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    
    if (diffMonths <= 12) return 0.4; // Ternero/a
    if (diffMonths > 12 && diffMonths <= 36) return 0.6; // Novillo/a
    return 1.0; // Adulto
  }

  constructor() {
    // Reacciona automáticamente cada vez que la Finca cambia
    effect(() => {
      const fincaId = this.fincaService.selectedFincaId();
      if (fincaId) {
        this.loadBovinos(fincaId);
      } else {
        this.bovinosSignal.set([]); // Si no hay finca, limpiamos
      }
    });
  }

  /**
   * @description Inicia la carga principal del censo ganadero para la finca activa.
   * Se orquesta de forma transparente consultando la base de datos o el fallback offline.
   * @param {string} fincaId Identificador de la Finca.
   */
  async loadBovinos(fincaId: string) {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const { data, error } = await this.supabase.client
        ? await this.fetchRemote(fincaId)
        : await this.fetchMock(fincaId); // Modo offline / mock

      if (error) throw error;
      
      this.bovinosSignal.set((data as Bovino[]) || []);
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'Error cargando bovinos';
      this.errorSignal.set(errorMsg);
      console.error(e);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  private async fetchRemote(fincaId: string) {
    return await this.supabase.client!
      .from('bovinos')
      .select('*')
      .eq('finca_id', fincaId)
      .eq('estado_productivo', 'Alta')
      .order('created_at', { ascending: false });
  }

  private async fetchMock(fincaId: string) {
    const { data, error } = await this.supabase.getAll<Bovino>('bovinos');
    if (data) {
      return { 
        data: data.filter(b => b.finca_id === fincaId && b.estado_productivo === 'Alta'), 
        error: null 
      };
    }
    return { data: [], error };
  }

  /**
   * @description Da de alta un nuevo animal en el sistema asociándolo a la finca activa.
   * @param {Partial<Bovino>} bovino Datos del nuevo animal recolectados del formulario.
   * @returns {Promise<{data: Bovino | null, error: any}>}
   */
  async createBovino(bovino: Partial<Bovino>) {
    const fincaId = this.fincaService.selectedFincaId();
    if (!fincaId) return { error: 'No hay finca seleccionada' };

    const payload = { ...bovino, finca_id: fincaId };
    const { data, error } = await this.supabase.create<Bovino>('bovinos', payload);
    
    if (data && !error) {
      this.bovinosSignal.update(bovinos => [data, ...bovinos]);
    }
    return { data, error };
  }

  /**
   * @description Modifica la ficha de un animal existente y propaga el cambio al estado local (Signal).
   * @param {string} id UUID del animal.
   * @param {Partial<Bovino>} payload Objeto con los campos modificados.
   * @returns {Promise<{data: Bovino | null, error: any}>}
   */
  async updateBovino(id: string, payload: Partial<Bovino>) {
    const { data, error } = await this.supabase.update<Bovino>('bovinos', id, payload);
    if (data && !error) {
      this.bovinosSignal.update(bovinos => 
        bovinos.map(b => b.id === id ? data : b)
      );
    }
    return { data, error };
  }
}
