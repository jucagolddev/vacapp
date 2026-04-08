import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { FincaService } from './finca.service';
import { Reproduccion } from '../models/vacapp.models';

@Injectable({
  providedIn: 'root'
})
export class ReproduccionService {
  private supabase = inject(SupabaseService);
  private fincaService = inject(FincaService);

  private reproduccionSignal = signal<Reproduccion[]>([]);

  readonly gestaciones = computed(() => this.reproduccionSignal());
  readonly gestacionesActivas = computed(() => 
    this.reproduccionSignal().filter(r => r.estado_gestacion === 'Confirmada')
  );

  // Métrica 360º: Promedio de Días Abiertos
  readonly promedioDiasAbiertos = computed(() => {
    const records = this.reproduccionSignal();
    const vacasEvaluadas = new Map<string, { ultParto: Date | null, nextCubricion: Date | null }>();

    // Ordenar cronológicamente ascendente
    const sorted = [...records].sort((a, b) => new Date(a.fecha_cubricion || 0).getTime() - new Date(b.fecha_cubricion || 0).getTime());

    sorted.forEach(r => {
      if (!vacasEvaluadas.has(r.bovino_id)) {
        vacasEvaluadas.set(r.bovino_id, { ultParto: null, nextCubricion: null });
      }
      const data = vacasEvaluadas.get(r.bovino_id)!;
      
      if (r.estado_gestacion === 'Parido' && r.fecha_parto_prevista) {
        data.ultParto = new Date(r.fecha_parto_prevista);
        data.nextCubricion = null; // Reset para el siguiente ciclo
      } else if ((r.estado_gestacion === 'Confirmada' || r.estado_gestacion === 'Pendiente') && r.fecha_cubricion) {
        if (data.ultParto && !data.nextCubricion) {
          data.nextCubricion = new Date(r.fecha_cubricion);
        }
      }
    });

    let sumaDias = 0;
    let vacasContadas = 0;

    vacasEvaluadas.forEach(val => {
      if (val.ultParto && val.nextCubricion) {
        const diffTime = Math.abs(val.nextCubricion.getTime() - val.ultParto.getTime());
        sumaDias += Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        vacasContadas++;
      } else if (val.ultParto) {
        // Vaca abierta actual (sin cubrir aún desde el último parto)
        const diffTime = Math.abs(new Date().getTime() - val.ultParto.getTime());
        sumaDias += Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        vacasContadas++;
      }
    });

    return vacasContadas > 0 ? Math.round(sumaDias / vacasContadas) : 0;
  });

  // Partos inminentes (en los próximos 30 días)
  readonly partosInminentes = computed(() => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    return this.reproduccionSignal().filter(r => {
      if (r.estado_gestacion !== 'Confirmada' || !r.fecha_parto_prevista) return false;
      const fParto = new Date(r.fecha_parto_prevista);
      return fParto >= today && fParto <= nextMonth;
    });
  });

  constructor() {
    effect(() => {
      const fincaId = this.fincaService.selectedFincaId();
      if (fincaId) {
        this.loadReproduccion();
      } else {
        this.reproduccionSignal.set([]);
      }
    });
  }

  async loadReproduccion() {
    const { data, error } = await this.supabase.getReproduccion();
    
    // Auto-generar Mocks si no hay historial
    if ((!data || data.length === 0) && !error) {
       const mockData = this.generateMockReproduccion();
       this.reproduccionSignal.set(mockData);
    } else if (data && !error) {
       this.reproduccionSignal.set(data as Reproduccion[]);
    }
  }

  getEstadisticasConcepcion(periodo: 'Diario' | 'Semanal' | 'Mensual' | 'Anual' | 'Total') {
    const records = this.reproduccionSignal();
    const map = new Map<string, { exitos: number, fallos: number }>();

    records.forEach(r => {
      if (!r.fecha_cubricion) return;
      if (r.estado_gestacion === 'Pendiente') return; // Aún no sabemos

      const date = new Date(r.fecha_cubricion);
      let key = '';

      if (periodo === 'Mensual') {
         key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      } else if (periodo === 'Anual') {
         key = `${date.getFullYear()}`;
      } else {
         key = `${date.getFullYear()}`; // Simplificación visual para gráficas
      }

      if (!map.has(key)) map.set(key, { exitos: 0, fallos: 0 });
      
      if (r.estado_gestacion === 'Confirmada' || r.estado_gestacion === 'Parido') {
        map.get(key)!.exitos += 1;
      } else if (r.estado_gestacion === 'Fallida') {
        map.get(key)!.fallos += 1;
      }
    });

    const sortedKeys = Array.from(map.keys()).sort();
    return sortedKeys.map(k => ({
      label: k,
      exitos: map.get(k)!.exitos,
      fallos: map.get(k)!.fallos
    }));
  }

  private generateMockReproduccion(): Reproduccion[] {
     const mocks: Reproduccion[] = [];
     const today = new Date();
     
     // Crear un par de vacas genéricas para simular el historial
     for(let v = 0; v < 8; v++) {
        // Hace 2 años (Parto)
        const d1 = new Date(today);
        d1.setDate(d1.getDate() - 700 - Math.floor(Math.random() * 50));
        
        mocks.push({
           id: `rep-mock-${v}-1`,
           bovino_id: `vaca-${v}`,
           fecha_cubricion: d1.toISOString().split('T')[0],
           estado_gestacion: 'Parido',
           fecha_parto_prevista: new Date(d1.getTime() + 283 * 86400000).toISOString().split('T')[0]
        });

        // Este año (Fallo y luego Éxito)
        const d2 = new Date(today);
        d2.setDate(d2.getDate() - 200 - Math.floor(Math.random() * 50));
        mocks.push({
           id: `rep-mock-${v}-2`,
           bovino_id: `vaca-${v}`,
           fecha_cubricion: d2.toISOString().split('T')[0],
           estado_gestacion: 'Fallida'
        });

        // Gestación actual (hace 100 días)
        const d3 = new Date(d2);
        d3.setDate(d3.getDate() + 45); // 45 días abiertos extra
        mocks.push({
           id: `rep-mock-${v}-3`,
           bovino_id: `vaca-${v}`,
           fecha_cubricion: d3.toISOString().split('T')[0],
           estado_gestacion: 'Confirmada',
           fecha_parto_prevista: new Date(d3.getTime() + 283 * 86400000).toISOString().split('T')[0]
        });
     }
     return mocks;
  }
}
