import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { GanadoService } from './ganado.service';
import { Pesaje } from '../models/vacapp.models';

@Injectable({
  providedIn: 'root'
})
export class PesajeService {
  private supabase = inject(SupabaseService);
  private ganadoService = inject(GanadoService);

  private pesajesSignal = signal<Pesaje[]>([]);
  private loadingSignal = signal<boolean>(false);

  readonly records = computed(() => this.pesajesSignal());
  readonly isLoading = computed(() => this.loadingSignal());

  constructor() {
    effect(() => {
      // Dependemos sutilmente de los bovinos cargados para generar sus pesos
      const bovinosCount = this.ganadoService.bovinos().length;
      if (bovinosCount > 0) {
        this.loadPesajes();
      } else {
        this.pesajesSignal.set([]);
      }
    });
  }

  async loadPesajes() {
    this.loadingSignal.set(true);
    try {
      let { data, error } = await this.supabase.getPesajes();
      
      // Auto-generación de Mock Premium si está vacío (Para efectos de UI/UX)
      if ((!data || data.length === 0) && !error) {
        data = this.generateMockPesajes();
        localStorage.setItem('mock_recria_pesajes', JSON.stringify(data));
      }

      this.pesajesSignal.set(data as Pesaje[]);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // Extrae la evolución de peso para los animales más relevantes
  getEvolucionPrincipales(periodo: 'Diario' | 'Semanal' | 'Mensual' | 'Anual' | 'Total') {
    const records = this.pesajesSignal();
    const bovinos = this.ganadoService.bovinos();
    if (bovinos.length === 0 || records.length === 0) return { labels: [], datasets: [] };

    // 1. Identificar a los 5 animales con mayor cantidad de registros
    const conteo = new Map<string, number>();
    records.forEach(r => conteo.set(r.bovino_id, (conteo.get(r.bovino_id) || 0) + 1));
    const topIds = Array.from(conteo.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(e => e[0]);

    const labelsSet = new Set<string>();
    const datasetsMap = new Map<string, Map<string, number>>();

    topIds.forEach(id => datasetsMap.set(id, new Map()));

    records.forEach(r => {
        if (!topIds.includes(r.bovino_id)) return;
        
        const date = new Date(r.fecha_pesaje);
        let key = '';

        if (periodo === 'Diario') {
           key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        } else if (periodo === 'Semanal') {
           const firstDay = new Date(date.getFullYear(), 0, 1);
           const week = Math.ceil((((date.getTime() - firstDay.getTime()) / 86400000) + firstDay.getDay() + 1) / 7);
           key = `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
        } else if (periodo === 'Mensual') {
           key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        } else if (periodo === 'Anual') {
           key = `${date.getFullYear()}`;
        } else {
           key = `${date.getFullYear()}`; // Total suele no aplicar bien a Liniers, lo tratamos como anual
        }

        labelsSet.add(key);
        const bMap = datasetsMap.get(r.bovino_id)!;
        
        // Si hay varios pesos en ese mes, nos quedamos con el máximo o promediamos (aquí promediamos fácil tomando el último o max)
        bMap.set(key, Math.max(bMap.get(key) || 0, r.peso_kg));
    });

    const sortedLabels = Array.from(labelsSet).sort();
    
    const datasets = topIds.map((id, index) => {
        const animal = bovinos.find(b => b.id === id);
        const data = sortedLabels.map(label => {
            const bMap = datasetsMap.get(id)!;
            return bMap.get(label) || null; // Null para que Chart.js rompa la línea si no hay medida, o spanGaps: true
        });

        // Colores premium fijos para los Top 5
        const colors = ['#bc6c25', '#52796f', '#e9edc9', '#d4a373', '#2d6a4f'];

        return {
            label: animal?.nombre || animal?.crotal || 'Desconocido',
            data: data,
            borderColor: colors[index],
            backgroundColor: colors[index] + '33', // Translúcido
            tension: 0.4,
            spanGaps: true,
            pointRadius: 4
        };
    });

    return {
        labels: sortedLabels,
        datasets: datasets
    };
  }

  private generateMockPesajes(): Pesaje[] {
    const mocks: Pesaje[] = [];
    const today = new Date();
    // Tomamos los 10 primeros animales para generarles curvas de crecimiento
    const targetBovinos = this.ganadoService.bovinos().slice(0, 10);
    
    targetBovinos.forEach(b => {
        // Asumiendo que el peso inicial de un ternero es ~40kg y adulto ~600kg
        let currentWeight = 80 + Math.random() * 50; 
        
        // Rellenaremos de atrás hacia adelante (24 meses de registros / mensual)
        for (let mesesAtras = 24; mesesAtras >= 0; mesesAtras--) {
            // Saltarnos algunos meses aleatoriamente aporta realismo (nadie pesa perfecto)
            if (Math.random() > 0.8) continue;

            const date = new Date(today);
            date.setMonth(date.getMonth() - mesesAtras);
            date.setDate(date.getDate() - Math.floor(Math.random() * 15)); // Un día aleatorio del mes
            
            // Crecimiento mensual pseudo-realista (15 a 45kg)
            const growth = Math.random() * 30 + 15; 
            currentWeight += growth;
            if (currentWeight > 1100) currentWeight = 1100; // Cap
            
            mocks.push({
                id: `pesaje-mock-${b.id}-${mesesAtras}`,
                bovino_id: b.id,
                fecha_pesaje: date.toISOString().split('T')[0],
                peso_kg: Math.floor(currentWeight),
                tipo_pesaje: 'Báscula Automática'
            });
        }
    });

    return mocks;
  }
}
