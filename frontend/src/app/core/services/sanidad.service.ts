import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { FincaService } from './finca.service';
import { Sanidad } from '../models/vacapp.models';

/**
 * @class SanidadService
 * @description Supervisor de salud y bioseguridad del hato.
 * Gestiona el historial clínico de intervenciones y monitoriza activamente 
 * los periodos de retiro de medicamentos para garantizar la seguridad alimentaria.
 */
@Injectable({
  providedIn: 'root'
})
export class SanidadService {
  private supabase = inject(SupabaseService);
  private fincaService = inject(FincaService);

  private sanidadSignal = signal<Sanidad[]>([]);
  private loadingSignal = signal<boolean>(false);

  /** Listado reactivo de todas las intervenciones sanitarias registradas. */
  readonly records = computed(() => this.sanidadSignal());
  /** Estado de carga del módulo de sanidad. */
  readonly isLoading = computed(() => this.loadingSignal());

  // Alerta de Retiros Activos
  readonly retirosActivos = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.sanidadSignal().filter(s => {
      if (!s.fecha) return false;
      const fAplicacion = new Date(s.fecha);
      
      const maxRetiro = Math.max(s.dias_retiro_carne || 0, s.dias_retiro_leche || 0);
      if (maxRetiro === 0) return false;

      const fFinRetiro = new Date(fAplicacion);
      fFinRetiro.setDate(fFinRetiro.getDate() + maxRetiro);
      
      return fFinRetiro > today;
    });
  });

  /**
   * @constructor
   * @description Configura un observador reactivo que recarga el historial sanitario
   * cada vez que se selecciona una finca diferente en el sistema.
   */
  constructor() {
    effect(() => {
      const fincaId = this.fincaService.selectedFincaId();
      if (fincaId) {
        this.loadSanidad();
      } else {
        this.sanidadSignal.set([]); // Limpieza de estado si no hay contexto de finca
      }
    });
  }

  /**
   * @description Carga las intervenciones sanitarias de la base de datos central.
   * @returns {Promise<void>}
   */
  async loadSanidad() {
    this.loadingSignal.set(true);
    try {
      const { data, error } = await this.supabase.getSanidad();
      if (data && !error) {
        this.sanidadSignal.set(data as Sanidad[]);
      }
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * @description Registra un nuevo evento sanitario (vacunación, tratamiento, diagnóstico).
   * @param {Partial<Sanidad>} payload Datos de la intervención.
   * @returns {Promise<any>}
   */
  async createSanidad(payload: Partial<Sanidad>) {
    const res = await this.supabase.createSanidad(payload);
    if (!res.error) await this.loadSanidad();
    return res;
  }

  /**
   * @description Actualiza una intervención sanitaria existente.
   * @param {string} id Identificador de la intervención.
   * @param {Partial<Sanidad>} payload Datos actualizados.
   * @returns {Promise<any>}
   */
  async updateSanidad(id: string, payload: Partial<Sanidad>) {
    const res = await this.supabase.updateSanidad(id, payload);
    if (!res.error) await this.loadSanidad();
    return res;
  }

  /**
   * @description Elimina de forma permanente un registro sanitario.
   * @param {string} id Identificador de la intervención.
   * @returns {Promise<any>}
   */
  async deleteSanidad(id: string) {
    const res = await this.supabase.deleteSanidad(id);
    if (!res.error) await this.loadSanidad();
    return res;
  }
}
