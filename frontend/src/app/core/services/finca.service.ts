import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Finca, Empresa } from '../models/vacapp.models';

@Injectable({
  providedIn: 'root'
})
export class FincaService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  // Estado reactivo (Signals)
  private fincasSignal = signal<Finca[]>([]);
  private selectedFincaIdSignal = signal<string | null>(null);

  // Selectores computados listos para usarse en componentes
  readonly fincas = computed(() => this.fincasSignal());
  readonly selectedFincaId = computed(() => this.selectedFincaIdSignal());
  
  readonly currentFinca = computed(() => {
    const fincas = this.fincasSignal();
    const selectedId = this.selectedFincaIdSignal();
    if (!fincas || !selectedId) return null;
    return fincas.find(f => f.id === selectedId) || null;
  });

  constructor() {
    // Reaccionar a cambios en el perfil del usuario para cargar sus fincas
    effect(() => {
      const profile = this.auth.profile();
      if (profile?.empresa_id) {
        this.loadInitialData(profile.empresa_id);
      } else {
        this.fincasSignal.set([]);
        this.selectedFincaIdSignal.set(null);
      }
    });
  }

  async loadInitialData(empresaId: string) {
    let { data, error } = await this.supabase.getAll<Finca>('fincas');
    if (data && !error) {
      // Filtrar a nivel cliente por ahora si es el mock
      data = data.filter(f => f.empresa_id === empresaId);
      this.fincasSignal.set(data);
      
      // Auto-seleccionar la primera finca disponible si no hay ninguna
      const savedFincaId = localStorage.getItem('vacapp_current_finca');
      if (savedFincaId && data.some(f => f.id === savedFincaId)) {
        this.selectedFincaIdSignal.set(savedFincaId);
      } else if (data.length > 0) {
        this.selectFinca(data[0].id);
      }
    }
  }

  selectFinca(fincaId: string) {
    this.selectedFincaIdSignal.set(fincaId);
    localStorage.setItem('vacapp_current_finca', fincaId);
  }

  // Futuras implementaciones (Crear Finca, Editar Finca)
  async createFinca(finca: Partial<Finca>) {
    const { data, error } = await this.supabase.create<Finca>('fincas', finca);
    if (data && !error) {
      this.fincasSignal.update(fincas => [...fincas, data]);
    }
    return { data, error };
  }
}
