import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { FincaService } from './finca.service';
import { Bovino } from '../models/vacapp.models';
import * as VacaConst from '../constants/vaca.constants';

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

  getEdadDesc(b: Bovino): string {
    if (!b.fecha_nacimiento) return 'S/N';
    const birthDate = new Date(b.fecha_nacimiento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      age--;
      months += 12;
    }
    if (age > 0) {
      return age === 1 ? '1 año' : `${age} años`;
    }
    return months === 1 ? '1 mes' : `${months} meses`;
  }

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

  async loadBovinos(fincaId: string) {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const { data, error } = await this.supabase.client
        ? await this.fetchRemote(fincaId)
        : await this.fetchMock(fincaId); // Modo offline / mock

      if (error) throw error;
      
      this.bovinosSignal.set((data as Bovino[]) || []);
    } catch (e: any) {
      this.errorSignal.set(e.message || 'Error cargando bovinos');
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
