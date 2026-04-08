import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonGrid, IonRow, IonCol, 
  IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, 
  IonIcon, IonButtons, IonMenuButton, IonBadge, IonText, IonProgressBar
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';
import { addIcons } from 'ionicons';
import { 
  barChart, statsChart, pieChart, boat, leaf, 
  paw, water, flash, trendingUp, trendingDown, 
  calendar, alertCircle, checkmarkCircle, medkit, heart
} from 'ionicons/icons';

/**
 * Cuadro de Mando Principal - Edición Lujo Elite.
 * Refactorizado: 100% Sincronización de colores con _variables.scss.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonGrid, IonRow, IonCol, 
    IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, 
    IonIcon, IonButtons, IonMenuButton, IonBadge, IonText, IonProgressBar
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary" class="luxe-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="text-white"></ion-menu-button>
        </ion-buttons>
        <ion-title class="luxe-title">Vacapp Elite Premium</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="luxe-bg-forest">
      <div class="luxe-container animate-fade-in">
        
        <!-- Bienvenida -->
        <div class="luxe-welcome-section">
          <div class="welcome-header-main">
            <h1 class="luxe-h1-premium">Resumen de Explotación</h1>
            <span class="luxe-edition-badge">EDICIÓN LUXE</span>
          </div>
          <p class="luxe-p-premium">Estado crítico y rendimiento del ganado en tiempo real.</p>
        </div>

        <!-- KPIs Principales -->
        <ion-grid class="ion-no-padding">
          <ion-row>
            <ion-col size="12" size-md="4">
              <div class="luxe-stat-card">
                <div class="luxe-icon-box bg-forest">
                  <ion-icon name="paw"></ion-icon>
                </div>
                <div class="stat-content">
                  <span class="stat-label">Censo Total</span>
                  <h2 class="stat-value">{{ stats.totalAnimales }}</h2>
                  <div class="stat-trend color-forest">
                    <ion-icon name="trending-up"></ion-icon>
                    <span>+2% este mes</span>
                  </div>
                </div>
              </div>
            </ion-col>

            <ion-col size="12" size-md="4">
              <div class="luxe-stat-card">
                <div class="luxe-icon-box bg-earth">
                  <ion-icon name="medkit"></ion-icon>
                </div>
                <div class="stat-content">
                  <span class="stat-label">Alertas Salud</span>
                  <h2 class="stat-value">{{ stats.alertasSanitarias }}</h2>
                  <div class="stat-trend color-earth">
                    <ion-icon name="alert-circle"></ion-icon>
                    <span>Requiere atención</span>
                  </div>
                </div>
              </div>
            </ion-col>

            <ion-col size="12" size-md="4">
              <div class="luxe-stat-card">
                <div class="luxe-icon-box bg-forest">
                  <ion-icon name="heart"></ion-icon>
                </div>
                <div class="stat-content">
                  <span class="stat-label">Gestaciones</span>
                  <h2 class="stat-value">{{ stats.gestacionesActivas }}</h2>
                  <div class="stat-trend color-forest">
                     <ion-icon name="calendar"></ion-icon>
                     <span>4 próximos partos</span>
                  </div>
                </div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Paneles de Análisis -->
        <ion-row class="ion-margin-top">
          <ion-col size="12" size-lg="8">
            <div class="luxe-panel-glass">
              <div class="panel-header-luxe">
                <h3>Rendimiento por Pastizal</h3>
                <ion-icon name="leaf"></ion-icon>
              </div>
              
              <!-- Gráfico de barras simulado con clases variables -->
              <div class="luxe-chart-mock">
                <div class="chart-row-luxe" *ngFor="let i of [70, 45, 90, 30]">
                  <div class="graph-bar-luxe" [style.height.%]="i" [ngClass]="{'bar-accent-luxe': i > 60}"></div>
                </div>
              </div>

              <div class="panel-footer-luxe">
                Última actualización de báscula sincronizada hace 2 horas.
              </div>
            </div>
          </ion-col>

          <ion-col size="12" size-lg="4">
            <div class="luxe-panel-dark">
              <h3>Incidencias Críticas</h3>
              
              <div class="luxe-alert-item">
                <ion-icon name="alert-circle" class="icon-indicator-luxe"></ion-icon>
                <div class="alert-text">
                  <strong>Vacunación Pendiente</strong>
                  <p>Lote "El Roble" requiere refuerzo aftosa.</p>
                </div>
              </div>

              <div class="luxe-alert-item">
                <ion-icon name="trending-up" class="icon-indicator-luxe"></ion-icon>
                <div class="alert-text">
                  <strong>Crecimiento Óptimo</strong>
                  <p>Recría Sector B supera la media (+1.2kg/día).</p>
                </div>
              </div>

              <div class="luxe-progress-section">
                <div class="progress-info">
                  <span>Meta de Producción Anual</span>
                  <span>85%</span>
                </div>
                <div class="progress-track-luxe">
                  <div class="progress-fill-luxe" style="width: 85%"></div>
                </div>
              </div>
            </div>
          </ion-col>
        </ion-row>

      </div>
    </ion-content>
  `,
  styles: [`
    /* Dashboard: Estilos estructurales mínimos (Heredados de _luxe.scss) */
    .welcome-header-main { display: flex; align-items: center; gap: 15px; }
    .luxe-chart-mock { height: 200px; display: flex; align-items: flex-end; gap: 20px; padding: 20px 0; border-bottom: 2px solid var(--ion-color-light); }
    .chart-row-luxe { flex: 1; display: flex; align-items: flex-end; height: 100%; }
    
    .luxe-alert-item { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; background: rgba(0,0,0,0.1); padding: 15px; border-radius: 20px; }
    .alert-text strong { display: block; font-size: 0.95rem; }
    .alert-text p { font-size: 0.8rem; margin: 2px 0 0; opacity: 0.8; }
    
    .luxe-progress-section { margin-top: 30px; }
    .progress-info { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; }
  `]
})
export class DashboardComponent implements OnInit {
  private supa = inject(SupabaseService);
  
  stats = {
    totalAnimales: 0,
    alertasSanitarias: 3,
    gestacionesActivas: 0
  };

  constructor() {
    addIcons({ 
      barChart, statsChart, pieChart, boat, leaf, paw, water, flash, 
      trendingUp, trendingDown, calendar, alertCircle, checkmarkCircle, 
      medkit, heart 
    });
  }

  async ngOnInit() {
    await this.loadStats();
  }

  async loadStats() {
    try {
      const { data: bovinos } = await this.supa.getAll<any>('bovinos');
      const { data: repros } = await this.supa.getReproduccion();
      
      this.stats.totalAnimales = (bovinos || []).length;
      this.stats.gestacionesActivas = (repros || []).length;
    } catch (e) {
      console.error('Error cargando estadísticas:', e);
    }
  }
}
