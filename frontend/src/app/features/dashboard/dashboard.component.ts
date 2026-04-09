import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, 
  IonButtons, IonMenuButton, IonBadge, IonProgressBar
} from '@ionic/angular/standalone';
import { GanadoService } from '../../core/services/ganado.service';
import { FincaService } from '../../core/services/finca.service';
import { ReproduccionService } from '../../core/services/reproduccion.service';
import { SanidadService } from '../../core/services/sanidad.service';
import { OfflineSyncService } from '../../core/services/offline-sync.service';
import { 
  LucideAngularModule, PawPrint, Activity, Heart, ShieldAlert, Baby, ChevronDown
} from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, 
    IonButtons, IonMenuButton, IonBadge, IonProgressBar,
    LucideAngularModule
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Centro de Mando</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="luxe-bg-forest">
      <div class="luxe-container animate-fade-in pb-12">
        
        <!-- Header de Bienvenida -->
        <div class="dashboard-header-glass">
          <div class="header-flex">
            <div>
              <h1 class="text-3xl font-bold tracking-tight mb-1 color-dark">Resumen de mi Finca</h1>
              <p class="flex items-center gap-2 color-medium text-lg">
                <lucide-icon name="paw-print" size="18"></lucide-icon>
                Viendo la finca: <strong>{{ finca()?.nombre }}</strong>
              </p>
            </div>
            <div class="status-chips">
              <ion-badge *ngIf="!isOnline()" color="warning" class="glass-badge">
                <lucide-icon name="alert-circle" size="14" class="icon-inline-baseline icon-mr-sm"></lucide-icon> Sin Internet (Modo Offline)
              </ion-badge>
              <div class="online-dot" [class.offline]="!isOnline()"></div>
            </div>
          </div>
        </div>

        <ion-progress-bar *ngIf="cargando()" type="indeterminate" class="luxe-progress"></ion-progress-bar>

        <!-- KPI Grid Primario: Botones grandes y claros -->
        <div class="dashboard-grid mt-6">
          <div class="kpi-card-v2 animate-slide-up delay-100">
            <div class="kpi-icon bg-forest"><lucide-icon name="paw-print" size="32"></lucide-icon></div>
            <div class="kpi-data">
              <span class="kpi-label">Vacas Totales</span>
              <div class="kpi-value">{{ ganadoService.totalBovinos() }}</div>
              <div class="kpi-sub">Animales registrados</div>
            </div>
          </div>

          <div class="kpi-card-v2 animate-slide-up delay-200">
            <div class="kpi-icon bg-earth"><lucide-icon name="heart" size="32"></lucide-icon></div>
            <div class="kpi-data">
              <span class="kpi-label">Días Abiertos</span>
              <div class="kpi-value">{{ reproService.promedioDiasAbiertos() }}</div>
              <div class="kpi-sub">Media de fertilidad</div>
            </div>
          </div>

          <div class="kpi-card-v2 animate-slide-up delay-300" [class.alert-glow]="sanidadService.retirosActivos().length > 0">
            <div class="kpi-icon" [ngClass]="sanidadService.retirosActivos().length > 0 ? 'bg-danger' : 'bg-secondary'">
              <lucide-icon name="activity" size="32"></lucide-icon>
            </div>
            <div class="kpi-data">
              <span class="kpi-label">Avisos Médicos</span>
              <div class="kpi-value" [class.text-danger]="sanidadService.retirosActivos().length > 0">{{ sanidadService.retirosActivos().length }}</div>
              <div class="kpi-sub font-bold">Ver alertas abajo</div>
            </div>
          </div>
        </div>

        <!-- Feed de Alertas Críticas: EL CABALLO DE BATALLA DE LA UX PARA EL GANADERO -->
        <div class="action-center mt-12 animate-slide-up delay-400" *ngIf="sanidadService.retirosActivos().length > 0 || reproService.partosInminentes().length > 0">
           <h2 class="section-title-luxe text-3xl uppercase color-danger"><lucide-icon name="alert-circle" size="28" class="icon-inline icon-mr"></lucide-icon> Avisos Urgentes de Hoy</h2>
           
           <div class="luxe-alert-row bg-red-glass border-left-danger" *ngFor="let a of sanidadService.retirosActivos()">
              <lucide-icon name="shield-alert" class="text-danger" size="48"></lucide-icon>
              <div class="alert-info">
                <strong class="text-xl color-danger">PROHIBIDO ORDEÑAR/VENDER: {{ a.bovino?.nombre || 'Animal' }} ({{ a.bovino?.crotal }})</strong>
                <span class="text-lg color-dark">Todavía está bajo los efectos de: <strong>{{ a.producto }}</strong>.</span>
              </div>
           </div>

           <div class="luxe-alert-row bg-gold-glass border-left-tertiary" *ngFor="let p of reproService.partosInminentes()">
              <lucide-icon name="baby" class="text-earth" size="48"></lucide-icon>
              <div class="alert-info">
                <strong class="text-xl color-secondary">PARTO PRÓXIMO: {{ p.bovino?.nombre || 'Vaca' }}</strong>
                <span class="text-lg color-dark">Prepárate para el parto el día <strong>{{ p.fecha_parto_prevista | date:'dd de MMMM' }}</strong>.</span>
              </div>
           </div>
        </div>

        <!-- Mensaje de Bienvenida Rústico -->
        <div *ngIf="sanidadService.retirosActivos().length === 0 && reproService.partosInminentes().length === 0" class="luxe-empty-state mt-lg">
            <lucide-icon name="paw-print" size="64" class="color-muted opacity-80"></lucide-icon>
            <h2 class="text-2xl color-muted">Todo está en orden hoy.</h2>
            <p>No tienes alertas médicas ni partos previstos para esta semana.</p>
        </div>

      </div>
    </ion-content>
  `
})
export class DashboardComponent {
  fincaService = inject(FincaService);
  ganadoService = inject(GanadoService);
  reproService = inject(ReproduccionService);
  sanidadService = inject(SanidadService);
  offlineSync = inject(OfflineSyncService);
  
  finca = this.fincaService.currentFinca;
  isOnline = this.offlineSync.isOnline;
  
  cargando = computed(() => this.ganadoService.isLoading() || this.sanidadService.isLoading());

  constructor() {}
}
