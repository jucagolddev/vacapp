import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { FincaService } from './finca.service';
import { Sanidad } from '../models/vacapp.models';

@Injectable({
  providedIn: 'root'
})
export class SanidadService {
  private supabase = inject(SupabaseService);
  private fincaService = inject(FincaService);

  private sanidadSignal = signal<Sanidad[]>([]);
  private loadingSignal = signal<boolean>(false);

  readonly records = computed(() => this.sanidadSignal());
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

  constructor() {
    effect(() => {
      const fincaId = this.fincaService.selectedFincaId();
      if (fincaId) {
        this.loadSanidad();
      } else {
        this.sanidadSignal.set([]);
      }
    });
  }

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

  async createSanidad(payload: any) {
    const res = await this.supabase.createSanidad(payload);
    if (!res.error) await this.loadSanidad();
    return res;
  }

  async updateSanidad(id: string, payload: any) {
    const res = await this.supabase.updateSanidad(id, payload);
    if (!res.error) await this.loadSanidad();
    return res;
  }

  async deleteSanidad(id: string) {
    const res = await this.supabase.deleteSanidad(id);
    if (!res.error) await this.loadSanidad();
    return res;
  }
}
