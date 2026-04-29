import { Component, OnInit, signal, computed, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonBackButton, IonGrid, IonRow, IonCol, IonIcon, 
  IonSegment, IonSegmentButton, IonLabel, IonBadge, IonSkeletonText,
  IonSpinner, ToastController
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { SupabaseService } from '../../core/services/supabase.service';
import { Bovino, Sanidad, Pesaje, Reproduccion, Finanzas } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { 
  paw, medical, scale, calendar, cash, 
  chevronForwardOutline, fitnessOutline, 
  timeOutline, alertCircleOutline, checkmarkCircleOutline,
  flaskOutline, gitBranchOutline, medkitOutline, cameraOutline, cashOutline
} from 'ionicons/icons';

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  icon: string;
  type: 'health' | 'repro' | 'weight' | 'cost';
  color: string;
}

interface AnimalData {
  bovino: Bovino;
  sanidad: Sanidad[];
  pesajes: Pesaje[];
  reproduccion: Reproduccion[];
  finanzas: Finanzas[];
}

@Component({
  selector: 'app-animal-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle, 
    IonButtons, IonBackButton, IonGrid, IonRow, IonCol, IonIcon,
    IonSegment, IonSegmentButton, IonLabel, IonBadge, IonSkeletonText,
    IonSpinner, BaseChartDirective
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/manejo"></ion-back-button>
        </ion-buttons>
        <ion-title class="ion-text-center">Inteligencia Animal</ion-title>
        <ion-buttons slot="end">
           <div style="width: 48px"></div>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-vertical">
      <main class="vac-container animate-fade-in" *ngIf="data()">
        
        <!-- CABECERA DE PERFIL (RUSTIC-LUXE) con BOTÓN CÁMARA -->
        <div class="animal-profile-header">
           <div class="animal-avatar-container">
              <div class="animal-avatar-wrapper">
                 <div class="animal-avatar">
                    <img *ngIf="data()?.bovino?.foto_url" [src]="data()?.bovino?.foto_url" class="img-full" alt="Perfil">
                    <ion-icon *ngIf="!data()?.bovino?.foto_url" name="paw"></ion-icon>
                 </div>
                 <!-- Botón Cámara sobre el Avatar -->
                 <button class="avatar-camera-btn" (click)="fileInput.click()" [disabled]="isUploading()" aria-label="Subir foto del animal">
                    <ion-icon *ngIf="!isUploading()" name="camera-outline"></ion-icon>
                    <ion-spinner *ngIf="isUploading()" name="crescent" color="light" style="width:18px;height:18px;"></ion-spinner>
                 </button>
                 <input #fileInput type="file" accept="image/*" hidden (change)="onPhotoSelected($event)">
              </div>
              <div class="animal-main-info">
                 <h1 class="crotal-id">{{ data()?.bovino?.crotal }}</h1>
                 <p class="animal-name">{{ data()?.bovino?.nombre || 'Res S/N' }} • {{ data()?.bovino?.raza }}</p>
                 <ion-badge [color]="getStatusColor(data()?.bovino?.estado_reproductivo)" class="status-badge" mode="ios">
                    {{ data()?.bovino?.estado_reproductivo || 'Activo' }}
                 </ion-badge>
              </div>
           </div>
        </div>

        <!-- KPI SUMMARY GRID (4 Cards) -->
        <ion-grid fixed class="ion-no-padding mt-4">
          <ion-row>
            <ion-col size="6" size-md="3">
              <div class="vac-kpi-card-square">
                <div class="vac-kpi-icon-minimal"><ion-icon name="fitness-outline" color="danger"></ion-icon></div>
                <div class="vac-kpi-data-minimal">
                  <span class="label">Salud</span>
                  <strong class="value">{{ lastHealth() }}</strong>
                </div>
              </div>
            </ion-col>
            <ion-col size="6" size-md="3">
              <div class="vac-kpi-card-square">
                <div class="vac-kpi-icon-minimal"><ion-icon name="scale" color="secondary"></ion-icon></div>
                <div class="vac-kpi-data-minimal">
                  <span class="label">Peso</span>
                  <strong class="value">{{ lastWeight() }} kg</strong>
                </div>
              </div>
            </ion-col>
            <ion-col size="6" size-md="3">
              <div class="vac-kpi-card-square">
                <div class="vac-kpi-icon-minimal"><ion-icon name="calendar" color="tertiary"></ion-icon></div>
                <div class="vac-kpi-data-minimal">
                  <span class="label">Últ. Parto</span>
                  <strong class="value">{{ lastParto() }}</strong>
                </div>
              </div>
            </ion-col>
            <ion-col size="6" size-md="3">
              <div class="vac-kpi-card-square">
                <div class="vac-kpi-icon-minimal"><ion-icon name="cash" color="success"></ion-icon></div>
                <div class="vac-kpi-data-minimal">
                  <span class="label">Inversión</span>
                  <strong class="value">{{ totalExpenses() | number:'1.0-0' }}€</strong>
                </div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- GRÁFICO DE EVOLUCIÓN DE PESO -->
        <section class="vac-main-card animate-slide-up mt-4 mb-4" *ngIf="chartPesajes().labels && chartPesajes().labels!.length > 0">
          <header class="vac-card-header">
            <div class="vac-card-header-flex">
              <div class="vac-card-title-group">
                <span>ANÁLISIS INDIVIDUAL</span>
                <strong>Curva de Peso (Kg)</strong>
              </div>
              <div class="vac-mini-stat bg-primary-soft">
                <ion-icon name="trending-up-outline"></ion-icon>
                <span>{{ (data()?.pesajes?.length || 0) }} pesajes</span>
              </div>
            </div>
          </header>
          <div class="vac-card-content">
            <div class="vac-chart-container chart-250px">
              <canvas baseChart [data]="chartPesajes()" [options]="chartOptionsPeso" [type]="'line'"></canvas>
            </div>
          </div>
        </section>

        <!-- NAVEGACIÓN INTERNA (ION-SEGMENT) -->
        <div class="vac-segment-container mt-4 mb-3">
          <ion-segment [value]="activeSegment()" (ionChange)="activeSegment.set($any($event).detail.value)" mode="ios">
            <ion-segment-button value="history">
              <ion-label>Historial</ion-label>
            </ion-segment-button>
            <ion-segment-button value="health">
              <ion-label>Salud</ion-label>
            </ion-segment-button>
            <ion-segment-button value="repro">
              <ion-label>Repro</ion-label>
            </ion-segment-button>
            <ion-segment-button value="expenses">
              <ion-label>Gastos</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>

        <!-- CONTENIDO DINÁMICO POR PESTAÑA -->
        <div [ngSwitch]="activeSegment()">
           
           <!-- PESTAÑA: HISTORIAL (TIMELINE VERTICAL) -->
           <div *ngSwitchCase="'history'" class="animate-fade-in">
              <div class="timeline-container">
                 <article class="timeline-item" *ngFor="let event of timeline(); trackBy: trackById">
                    <div class="timeline-dot" [style.background-color]="event.color">
                       <ion-icon [name]="event.icon"></ion-icon>
                    </div>
                    <div class="timeline-content vac-base-card">
                       <div class="timeline-header">
                          <span class="event-date">{{ event.date | date:'dd MMM yyyy' }}</span>
                          <span class="event-type" [style.color]="event.color">{{ event.type | uppercase }}</span>
                       </div>
                       <h3 class="event-title">{{ event.title }}</h3>
                       <p class="event-desc">{{ event.description }}</p>
                    </div>
                 </article>
              </div>
           </div>

           <!-- PESTAÑA: SALUD -->
           <div *ngSwitchCase="'health'" class="animate-fade-in">
              <article class="vac-card p-4 mb-4" *ngFor="let s of data()?.sanidad; trackBy: trackById">
                 <div class="vac-card-header-flex">
                     <div class="vac-icon-circle bg-success-soft"><ion-icon name="medkit-outline" color="success"></ion-icon></div>
                     <div class="vac-card-title-group ml-3">
                        <strong class="block text-lg">{{ s.producto }}</strong>
                        <span class="text-sm color-muted">{{ s.tipo }} • {{ s.fecha | date:'dd MMM yyyy' }}</span>
                     </div>
                 </div>
                 <div class="mt-3">
                    <p class="color-dark font-medium">{{ s.observaciones }}</p>
                    <div class="mt-2" *ngIf="s.dias_retiro_carne && s.dias_retiro_carne > 0">
                       <ion-badge color="warning" class="status-badge">Retiro: {{ s.dias_retiro_carne }} días</ion-badge>
                    </div>
                 </div>
              </article>
           </div>

           <!-- PESTAÑA: REPRODUCCIÓN -->
           <div *ngSwitchCase="'repro'" class="animate-fade-in">
              <article class="vac-card p-4 mb-4" *ngFor="let r of data()?.reproduccion; trackBy: trackById">
                 <div class="vac-card-header-flex">
                     <div class="vac-icon-circle bg-secondary-soft"><ion-icon name="git-branch-outline" color="secondary"></ion-icon></div>
                     <div class="vac-card-title-group ml-3">
                        <strong class="block text-lg">{{ r.estado_gestacion }}</strong>
                        <span class="text-sm color-muted">{{ r.tipo_cubricion || 'Evento Reproductivo' }}</span>
                     </div>
                 </div>
              </article>
           </div>

           <!-- PESTAÑA: GASTOS -->
           <div *ngSwitchCase="'expenses'" class="animate-fade-in">
              <article class="vac-card flex justify-between items-center p-4 mb-3" *ngFor="let f of data()?.finanzas; trackBy: trackById">
                 <div class="flex items-center gap-3">
                    <div class="vac-icon-circle bg-danger-soft"><ion-icon name="cash-outline" color="danger"></ion-icon></div>
                    <div>
                        <strong class="block text-lg">{{ f.categoria }}</strong>
                        <span class="text-sm color-muted font-medium">{{ f.fecha | date:'dd MMM yyyy' }}</span>
                    </div>
                 </div>
                 <h2 class="text-xl color-danger font-heavy">-{{ f.monto | number:'1.2-2' }}€</h2>
              </article>
           </div>

        </div>
      </main>

      <!-- SKELETON LOADING -->
      <div class="ion-padding" *ngIf="!data()">
         <ion-skeleton-text animated style="width: 100%; height: 200px; border-radius: 20px;"></ion-skeleton-text>
         <ion-skeleton-text animated style="width: 60%; height: 30px; margin-top: 20px;"></ion-skeleton-text>
         <div class="mt-4">
            <ion-skeleton-text animated style="width: 100%; height: 60px; margin-bottom: 10px;" *ngFor="let s of [1,2,3]; trackBy: trackById"></ion-skeleton-text>
         </div>
      </div>

    </ion-content>
  `,
  styleUrls: ['./animal-detail.component.scss']
})
export class AnimalDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private supabase = inject(SupabaseService);
  private toastCtrl = inject(ToastController);
  
  activeSegment = signal('history');
  data = signal<AnimalData | null>(null);
  isUploading = signal(false);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  trackById(index: number, item: any): string {
    return item?.id || index.toString();
  }

  constructor() {
    addIcons({ 
      paw, medical, scale, calendar, cash, 
      chevronForwardOutline, fitnessOutline, 
      timeOutline, alertCircleOutline, checkmarkCircleOutline,
      flaskOutline, gitBranchOutline, medkitOutline, cameraOutline, cashOutline
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadData(id);
    }
  }

  async loadData(id: string) {
    const res = await this.supabase.getAnimalCompleteData(id);
    this.data.set(res.data);
  }

  /** Selección y subida de foto del animal */
  async onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file || !this.data()?.bovino?.id) return;

    this.isUploading.set(true);
    try {
      const bovinoId = this.data()!.bovino.id;
      const fotoUrl = await this.supabase.uploadAnimalImage(bovinoId, file);
      await this.supabase.updateAnimalPhoto(bovinoId, fotoUrl);

      // Actualizar el data signal con la nueva foto
      const currentData = this.data()!;
      this.data.set({
        ...currentData,
        bovino: { ...currentData.bovino, foto_url: fotoUrl }
      });

      await this.showToast('📷 Foto actualizada correctamente', 'success');
    } catch (err) {
      console.error('Error subiendo foto:', err);
      await this.showToast('❌ Error al subir la foto', 'danger');
    } finally {
      this.isUploading.set(false);
      // Reset del input para permitir re-subir el mismo archivo
      if (input) input.value = '';
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom',
      color,
      cssClass: 'vac-toast',
      icon: color === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'
    });
    await toast.present();
  }

  getStatusColor(status?: string) {
    switch (status) {
      case 'Gestante': return 'tertiary';
      case 'Lactante': return 'success';
      case 'Seca': return 'medium';
      default: return 'primary';
    }
  }

  // KPIs
  lastHealth = computed(() => {
    const records = this.data()?.sanidad;
    return records && records.length > 0 ? records[0].tipo : 'N/A';
  });

  lastWeight = computed(() => {
    const records = this.data()?.pesajes;
    return records && records.length > 0 ? records[0].peso_kg : '---';
  });

  lastParto = computed(() => {
    const repro = this.data()?.reproduccion;
    const parido = repro?.find((r: Reproduccion) => r.estado_gestacion === 'Parido');
    return parido && parido.created_at ? new Date(parido.created_at).toLocaleDateString() : 'N/A';
  });

  totalExpenses = computed(() => {
    const fin = this.data()?.finanzas || [];
    const san = this.data()?.sanidad || [];
    const fromFinances = fin.reduce((acc: number, f: Finanzas) => acc + (f.tipo === 'Gasto' ? f.monto : 0), 0);
    const fromSanity = san.reduce((acc: number, s: Sanidad) => acc + (s.costo_aplicacion || 0), 0);
    return fromFinances + fromSanity;
  });

  /** Gráfico de Evolución de Peso — Rustic-Luxe Themed */
  chartPesajes = computed((): ChartData<'line'> => {
    const pesajes = this.data()?.pesajes || [];
    // Ordenar cronológicamente (ascendente) para la curva
    const sorted = [...pesajes].sort((a, b) => 
      new Date(a.fecha_pesaje).getTime() - new Date(b.fecha_pesaje).getTime()
    );
    return {
      labels: sorted.map(p => new Date(p.fecha_pesaje).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })),
      datasets: [{
        label: 'Peso (Kg)',
        data: sorted.map(p => p.peso_kg),
        borderColor: '#1B4332',
        backgroundColor: 'rgba(27, 67, 50, 0.12)',
        pointBackgroundColor: '#BC8A5F',
        pointBorderColor: '#1B4332',
        pointRadius: 5,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5
      }]
    };
  });

  chartOptionsPeso: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1B4332',
        titleColor: '#d4a373',
        bodyColor: '#ffffff',
        cornerRadius: 12,
        padding: 10
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { weight: 'bold', size: 10 }, color: '#666' }
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { weight: 'bold', size: 10 }, color: '#666', callback: (val) => val + ' kg' }
      }
    }
  };

  // TIMELINE LOGIC
  timeline = computed(() => {
    if (!this.data()) return [];
    const events: TimelineEvent[] = [];

    // Sanidad
    this.data()?.sanidad?.forEach((s: Sanidad) => {
      events.push({
        date: s.fecha,
        title: s.producto || 'Tratamiento',
        description: s.tipo + ': ' + (s.observaciones || 'Sin notas'),
        icon: 'medkit-outline',
        type: 'health',
        color: '#2d6a4f'
      });
    });

    // Pesajes
    this.data()?.pesajes?.forEach((p: Pesaje) => {
      events.push({
        date: p.fecha_pesaje,
        title: 'Control de Peso',
        description: `Peso registrado: ${p.peso_kg} kg (${p.tipo_pesaje || 'N/A'})`,
        icon: 'scale',
        type: 'weight',
        color: '#d4a373'
      });
    });

    // Reproducción
    this.data()?.reproduccion?.forEach((r: Reproduccion) => {
      if (!r.created_at) return;
      events.push({
        date: r.created_at,
        title: 'Evento Reproductivo',
        description: `Estado: ${r.estado_gestacion} (${r.tipo_cubricion || 'N/A'})`,
        icon: 'git-branch-outline',
        type: 'repro',
        color: '#582f0e'
      });
    });

    // Ordenar por fecha descendente
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });
}
