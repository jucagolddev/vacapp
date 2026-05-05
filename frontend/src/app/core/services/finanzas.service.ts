import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { FincaService } from './finca.service';
import { OfflineSyncService } from './offline-sync.service';
import { Finanzas } from '../models/vacapp.models';

/**
 * @class FinanzasService
 * @description Servicio de dominio encargado de la gestión contable y financiera.
 * Centraliza el registro de flujos de caja, orquesta la persistencia (Supabase/Mock)
 * y proporciona motores de agregación para análisis estadístico de rentabilidad.
 */
@Injectable({
  providedIn: 'root'
})
export class FinanzasService {
  private supabase = inject(SupabaseService);
  private fincaService = inject(FincaService);

  private finanzasSignal = signal<Finanzas[]>([]);
  private loadingSignal = signal<boolean>(false);

  /** Listado reactivo de todos los registros financieros filtrados por finca. */
  readonly records = computed(() => this.finanzasSignal());
  /** Indica si hay una operación de carga en curso. */
  readonly isLoading = computed(() => this.loadingSignal());

  constructor() {
    effect(() => {
      const fincaId = this.fincaService.selectedFincaId();
      if (fincaId) {
        this.loadFinanzas();
      } else {
        this.finanzasSignal.set([]);
      }
    });
  }

  /**
   * @description Carga la colección completa de movimientos financieros.
   * Si la colección está vacía, activa el motor de generación de datos mock para fines demostrativos.
   * @returns {Promise<void>}
   */
  async loadFinanzas() {
    this.loadingSignal.set(true);
    try {
      let { data, error } = await this.supabase.getAll<Finanzas>('finanzas');
      
      // Auto-generación de Mock Premium si está vacío (Para efectos de UI/UX)
      if ((!data || data.length === 0) && !error) {
        const storedMock = localStorage.getItem('mock_finanzas');
        if (storedMock) {
            data = JSON.parse(storedMock);
        } else {
            data = this.generateMockFinanzas();
            localStorage.setItem('mock_finanzas', JSON.stringify(data));
        }
      }

      const fincaId = this.fincaService.selectedFincaId();
      // Filtrar por finca (Para el MVP local mock)
      const filtered = (data || []).filter(f => !f.finca_id || f.finca_id === fincaId);
      
      // Ordenamos por fecha descendente
      this.finanzasSignal.set(filtered.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));

    } finally {
      this.loadingSignal.set(false);
    }
  }

  // Operaciones CRUD Sincrónicas con Reactividad Inmediata

  /**
   * @description Registra un nuevo movimiento financiero asociado a la finca activa.
   * @param {Partial<Finanzas>} payload Datos del movimiento (tipo, categoría, monto, fecha).
   * @returns {Promise<{data: Finanzas | null, error: any}>}
   */
  async createFinanza(payload: Partial<Finanzas>) {
    payload.finca_id = this.fincaService.selectedFincaId() || undefined;
    
    // Si estamos en modo "sólo mocks" (por ejemplo si la base de datos devuelve vacío):
    let { data, error } = await this.supabase.create('finanzas', payload);
    
    // Fallback Mock System si falla supabase o no hay tabla
    if (error && error.message && error.message.includes('does not exist')) {
       const storedMock = JSON.parse(localStorage.getItem('mock_finanzas') || '[]');
       const newRecord = { ...payload, id: `fin-mock-${Date.now()}` } as Finanzas;
       storedMock.unshift(newRecord);
       localStorage.setItem('mock_finanzas', JSON.stringify(storedMock));
       error = null;
    }
    
    if (!error) await this.loadFinanzas();
    return { data, error };
  }

  /**
   * @description Actualiza un registro contable existente.
   * @param {string} id Identificador del registro.
   * @param {Partial<Finanzas>} payload Campos modificados.
   * @returns {Promise<{data: Finanzas | null, error: any}>}
   */
  async updateFinanza(id: string, payload: Partial<Finanzas>) {
    let { data, error } = await this.supabase.update('finanzas', id, payload);
    
    // Fallback Mock System
    if (id.startsWith('fin-mock-')) {
       const storedMock = JSON.parse(localStorage.getItem('mock_finanzas') || '[]');
       const index = storedMock.findIndex((m: Record<string, unknown>) => m['id'] === id);
       if (index > -1) {
          storedMock[index] = { ...storedMock[index], ...payload };
          localStorage.setItem('mock_finanzas', JSON.stringify(storedMock));
          error = null;
       }
    }
    
    if (!error) await this.loadFinanzas();
    return { data, error };
  }

  /**
   * @description Elimina permanentemente un registro financiero.
   * @param {string} id Identificador único.
   * @returns {Promise<{data: null, error: any}>}
   */
  async deleteFinanza(id: string) {
    let { error } = await this.supabase.delete('finanzas', id);
    
    // Fallback Mock System
    if (id.startsWith('fin-mock-')) {
       const storedMock = JSON.parse(localStorage.getItem('mock_finanzas') || '[]') as Finanzas[];
       const filtered = storedMock.filter(m => m.id !== id);
       localStorage.setItem('mock_finanzas', JSON.stringify(filtered));
       error = null;
    }
    
    if (!error) await this.loadFinanzas();
    return { data: null, error };
  }

  // Motor para graficar: Agrupar por periodo
  /**
   * @description Agrega los flujos de caja agrupándolos por un periodo temporal específico.
   * Utilizado para alimentar gráficos de barras e indicadores de rendimiento (ROI).
   * @param {'Diario' | 'Semanal' | 'Mensual' | 'Anual' | 'Total'} periodo Granularidad del agrupamiento.
   * @returns {Array<{label: string, ingresos: number, gastos: number}>} Datos agregados listos para visualización.
   */
  getDatosFinancierosPorPeriodo(periodo: 'Diario' | 'Semanal' | 'Mensual' | 'Anual' | 'Total') {
    const records = this.finanzasSignal();
    const map = new Map<string, { ingresos: number, gastos: number }>();

    records.forEach(r => {
      const date = new Date(r.fecha);
      let key = '';

      if (periodo === 'Diario') {
         key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      } else if (periodo === 'Semanal') {
         // Simplificación: Año-Semana (Aproximada)
         const firstDay = new Date(date.getFullYear(), 0, 1);
         const pastDaysOfYear = (date.getTime() - firstDay.getTime()) / 86400000;
         const week = Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
         key = `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
      } else if (periodo === 'Mensual') {
         key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      } else if (periodo === 'Anual') {
         key = `${date.getFullYear()}`;
      } else {
         key = 'Total Histórico';
      }

      if (!map.has(key)) map.set(key, { ingresos: 0, gastos: 0 });
      
      if (r.tipo === 'Ingreso') {
        map.get(key)!.ingresos += Number(r.monto);
      } else {
        map.get(key)!.gastos += Number(r.monto);
      }
    });

    // Ordenar cronológicamente
    const sortedKeys = Array.from(map.keys()).sort();
    return sortedKeys.map(k => ({
      label: k,
      ingresos: map.get(k)!.ingresos,
      gastos: map.get(k)!.gastos
    }));
  }

  private generateMockFinanzas(): Finanzas[] {
    const mocks: Finanzas[] = [];
    const today = new Date();
    const baseFinca = this.fincaService.selectedFincaId();
    
    // Generamos 3 años de historia hacia atrás (~150 registros)
    for (let i = 0; i < 150; i++) {
        const randomDays = Math.floor(Math.random() * 1095); // 3 años
        const date = new Date(today);
        date.setDate(date.getDate() - randomDays);
        
        const isIngreso = Math.random() > 0.6; // 40% Ingresos, 60% Gastos
        const categoria = isIngreso 
            ? (Math.random() > 0.5 ? 'Venta Carne' : 'Venta Leche')
            : (Math.random() > 0.3 ? 'Alimentación' : 'Veterinaria');

        const monto = isIngreso 
            ? Math.floor(Math.random() * 2000) + 500  // Ingresos 500-2500
            : Math.floor(Math.random() * 800) + 50;   // Gastos 50-850

        mocks.push({
            id: `fin-mock-${i}`,
            tipo: isIngreso ? 'Ingreso' : 'Gasto',
            categoria,
            monto,
            fecha: date.toISOString().split('T')[0],
            finca_id: baseFinca || undefined
        });
    }
    return mocks;
  }
}
