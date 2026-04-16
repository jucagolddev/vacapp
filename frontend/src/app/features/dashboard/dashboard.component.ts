import { Component, computed, inject, signal, OnInit, effect, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, 
  IonButtons, IonMenuButton, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
  IonIcon, IonSkeletonText
} from '@ionic/angular/standalone';
import { GanadoService } from '../../core/services/ganado.service';
import { FincaService } from '../../core/services/finca.service';
import { ReproduccionService } from '../../core/services/reproduccion.service';
import { SanidadService } from '../../core/services/sanidad.service';
import { PesajeService } from '../../core/services/pesaje.service';
import { FinanzasService } from '../../core/services/finanzas.service';
import { OfflineSyncService } from '../../core/services/offline-sync.service';
import { 
  Chart, registerables
} from 'chart.js';
import { addIcons } from 'ionicons';
import { 
  paw, heart, calendar, statsChart, alertCircle, 
  trendingUp, trendingDown, wallet, scale, pieChart 
} from 'ionicons/icons';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, 
    IonButtons, IonMenuButton, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
    IonIcon, IonSkeletonText
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary" class="luxe-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="text-white"></ion-menu-button>
        </ion-buttons>
        <ion-title class="luxe-title">Centro de Inteligencia</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="luxe-bg-forest">
      <div class="luxe-container animate-fade-in pb-12">
        
        <!-- Header con Identidad -->
        <div class="dashboard-header-bi mt-4">
          <div class="header-flex-bi">
            <div>
              <h1 class="bi-title">Resumen Ejecutivo</h1>
              <p class="bi-subtitle">
                <ion-icon name="paw" class="icon-mr-sm"></ion-icon>
                Finca actual: <strong>{{ finca()?.nombre || 'Cargando...' }}</strong>
              </p>
            </div>
            <div class="bi-status">
              <div class="online-indicator" [class.offline]="!isOnline()">
                <span>{{ isOnline() ? 'Sincronizado' : 'Modo Offline' }}</span>
                <div class="dot shadow-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- KPI GRID PRINCIPAL -->
        <ion-grid class="ion-no-padding mt-4">
          <ion-row>
            <ion-col size="6" size-md="3">
              <ion-card class="bi-kpi-card glass animate-slide-up">
                <div class="kpi-mini-icon color-primary"><ion-icon name="paw"></ion-icon></div>
                <div class="kpi-content">
                  <span class="kpi-label">Hato Total</span>
                  <h2 class="kpi-value" *ngIf="!cargando()">{{ totalBovinos() }}</h2>
                  <ion-skeleton-text *ngIf="cargando()" animated style="width: 60%; height: 24px; border-radius: 4px; margin-top: 4px;"></ion-skeleton-text>
                </div>
              </ion-card>
            </ion-col>
            <ion-col size="6" size-md="3">
              <ion-card class="bi-kpi-card glass animate-slide-up delay-100">
                <div class="kpi-mini-icon color-danger"><ion-icon name="heart"></ion-icon></div>
                <div class="kpi-content">
                  <span class="kpi-label">Gestantes</span>
                  <h2 class="kpi-value" *ngIf="!cargando()">{{ gestacionesActivas().length }}</h2>
                  <ion-skeleton-text *ngIf="cargando()" animated style="width: 60%; height: 24px; border-radius: 4px; margin-top: 4px;"></ion-skeleton-text>
                </div>
              </ion-card>
            </ion-col>
            <ion-col size="6" size-md="3">
              <ion-card class="bi-kpi-card glass animate-slide-up delay-200">
                <div class="kpi-mini-icon color-tertiary"><ion-icon name="wallet"></ion-icon></div>
                <div class="kpi-content">
                  <span class="kpi-label">Margen Bruto</span>
                  <h2 class="kpi-value" *ngIf="!cargando()">{{ saldoMensual() | number:'1.0-0' }}€</h2>
                  <ion-skeleton-text *ngIf="cargando()" animated style="width: 60%; height: 24px; border-radius: 4px; margin-top: 4px;"></ion-skeleton-text>
                </div>
              </ion-card>
            </ion-col>
            <ion-col size="6" size-md="3">
              <ion-card class="bi-kpi-card glass animate-slide-up delay-300">
                <div class="kpi-mini-icon color-secondary"><ion-icon name="scale"></ion-icon></div>
                <div class="kpi-content">
                  <span class="kpi-label">Peso Medio</span>
                  <h2 class="kpi-value" *ngIf="!cargando()">{{ pesoMedio() }} kg</h2>
                  <ion-skeleton-text *ngIf="cargando()" animated style="width: 60%; height: 24px; border-radius: 4px; margin-top: 4px;"></ion-skeleton-text>
                </div>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- DASHBOARD DE GRÁFICOS -->
        <ion-grid class="ion-no-padding mt-4">
          <ion-row>
            <!-- ÁREA CHART: EVOLUCIÓN PESO -->
            <ion-col size="12" size-lg="8">
              <ion-card class="bi-main-card animate-slide-up delay-400">
                <ion-card-header>
                  <div class="bi-card-head">
                    <div>
                      <ion-card-subtitle class="font-bold uppercase tracking-widest opacity-80">Evolución Ponderada</ion-card-subtitle>
                      <ion-card-title class="text-2xl font-bold color-dark">Control de Masa Total</ion-card-title>
                    </div>
                    <div class="bi-mini-stat bg-primary-soft">
                      <ion-icon name="trending-up"></ion-icon>
                      <span>+8.2% este mes</span>
                    </div>
                  </div>
                </ion-card-header>
                <ion-card-content class="relative">
                  <div *ngIf="cargando()" class="chart-skeleton">
                    <ion-skeleton-text animated style="width: 100%; height: 300px; border-radius: 8px;"></ion-skeleton-text>
                  </div>
                  <canvas #weightChart style="width: 100%; height: 300px;" [hidden]="cargando()"></canvas>
                </ion-card-content>
              </ion-card>
            </ion-col>

            <!-- DONUT CHART: DISTRIBUCIÓN -->
            <ion-col size="12" size-lg="4">
              <ion-card class="bi-main-card animate-slide-up delay-500">
                <ion-card-header>
                  <ion-card-subtitle class="font-bold uppercase tracking-widest opacity-80">Distribución</ion-card-subtitle>
                  <ion-card-title class="text-2xl font-bold color-dark">Población por Lote</ion-card-title>
                </ion-card-header>
                <ion-card-content class="chart-container-donut">
                  <div *ngIf="cargando()" class="chart-skeleton flex justify-center items-center">
                    <ion-skeleton-text animated style="width: 200px; height: 200px; border-radius: 50%;"></ion-skeleton-text>
                  </div>
                  <canvas #lotesChart [hidden]="cargando()"></canvas>
                </ion-card-content>
              </ion-card>
            </ion-col>

            <!-- BAR CHART: FINANZAS -->
            <ion-col size="12">
              <ion-card class="bi-main-card animate-slide-up delay-600">
                <ion-card-header>
                  <ion-card-subtitle class="font-bold uppercase tracking-widest opacity-80">Gestión Económica</ion-card-subtitle>
                  <ion-card-title class="text-2xl font-bold color-dark">Balance Mensual Comparativo</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <div *ngIf="cargando()" class="chart-skeleton">
                    <ion-skeleton-text animated style="width: 100%; height: 250px; border-radius: 8px;"></ion-skeleton-text>
                  </div>
                  <canvas #financeChart style="width: 100%; height: 250px;" [hidden]="cargando()"></canvas>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

      </div>
    </ion-content>
  `,
  styles: [`
    .luxe-toolbar { --background: #1b4332; }
    .bi-title { font-family: 'Outfit', sans-serif; font-size: 2.2rem; font-weight: 800; color: #2b3a32; margin-bottom: 0px; letter-spacing: -0.5px; }
    .bi-subtitle { font-family: 'Outfit', sans-serif; font-size: 1.1rem; color: #476759; margin-top: 4px; }
    
    .bi-kpi-card { border-radius: 16px; margin: 6px; border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 4px 16px rgba(0,0,0,0.06); padding: 16px; display: flex; align-items: center; gap: 12px; }
    .kpi-mini-icon { font-size: 2rem; }
    .kpi-label { font-size: 0.85rem; font-weight: 700; color: #8d99ae; text-transform: uppercase; letter-spacing: 1px; }
    .kpi-value { margin: 0; font-size: 1.6rem; font-weight: 800; color: #2b2d42; }

    .bi-main-card { border-radius: 20px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); border: 1px solid rgba(255,255,255,0.4); margin: 8px; overflow: hidden; }
    .bi-card-head { display: flex; justify-content: space-between; align-items: flex-start; }
    .bi-mini-stat { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 30px; font-size: 0.8rem; font-weight: 700; color: #1b4332; }
    .bg-primary-soft { background: rgba(27, 67, 50, 0.1); }
    
    .chart-container-donut { height: 300px; display: flex; align-items: center; justify-content: center; position: relative; }
    .chart-skeleton { height: 100%; width: 100%; min-height: 250px; }
    
    .online-indicator { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 700; color: #40916c; background: rgba(255,255,255,0.5); padding: 6px 14px; border-radius: 20px; }
    .dot { width: 8px; height: 8px; background: #2dd55b; border-radius: 50%; }
    .offline { color: #bc4749; }
    .offline .dot { background: #bc4749; }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  fincaService = inject(FincaService);
  ganadoService = inject(GanadoService);
  reproService = inject(ReproduccionService);
  sanidadService = inject(SanidadService);
  pesajeService = inject(PesajeService);
  finanzasService = inject(FinanzasService);
  offlineSync = inject(OfflineSyncService);
  
  finca = this.fincaService.currentFinca;
  isOnline = this.offlineSync.isOnline;
  
  totalBovinos = this.ganadoService.totalBovinos;
  gestacionesActivas = this.reproService.gestacionesActivas;
  
  cargando = computed(() => 
    this.ganadoService.isLoading() || 
    this.pesajeService.isLoading() || 
    this.finanzasService.isLoading()
  );

  saldoMensual = computed(() => {
    const fin = this.finanzasService.getDatosFinancierosPorPeriodo('Mensual');
    if (fin.length === 0) return 3450; // Mock si no hay datos para el KPI
    const last = fin[fin.length - 1];
    return last.ingresos - last.gastos;
  });

  pesoMedio = computed(() => {
    const weights = this.pesajeService.records();
    if (weights.length === 0) return 425;
    const sum = weights.reduce((acc, p) => acc + p.peso_kg, 0);
    return Math.round(sum / weights.length);
  });

  @ViewChild('weightChart') weightCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lotesChart') lotesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('financeChart') financeCanvas!: ElementRef<HTMLCanvasElement>;

  private charts: any[] = [];

  constructor() {
    addIcons({ 
      paw, heart, calendar, statsChart, alertCircle, 
      trendingUp, trendingDown, wallet, scale, pieChart 
    });

    // Configuración Global de Chart.js
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    Chart.defaults.plugins.tooltip.titleColor = '#1b4332';
    Chart.defaults.plugins.tooltip.bodyColor = '#2b2d42';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(0,0,0,0.05)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 20;

    // Reactividad a datos
    effect(() => {
      if (!this.cargando()) {
        setTimeout(() => this.updateCharts(), 300);
      }
    });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.initCharts();
  }

  ngOnDestroy() {
    this.charts.forEach(c => c.destroy());
  }

  private initCharts() {
    this.initWeightChart();
    this.initLotesChart();
    this.initFinanceChart();
  }

  private updateCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    this.initCharts();
  }

  private initWeightChart() {
    const ctx = this.weightCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const stats = this.pesajeService.getEvolucionMensualHerd();
    
    // Degradado "Apple style"
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(71, 103, 89, 0.4)');
    gradient.addColorStop(1, 'rgba(71, 103, 89, 0)');

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: stats.labels as any,
        datasets: [{
          label: 'Peso Medio (kg)',
          data: stats.data,
          borderColor: 'rgba(71, 103, 89, 1)',
          borderWidth: 4,
          tension: 0.4,
          fill: true,
          backgroundColor: gradient,
          pointBackgroundColor: 'rgba(71, 103, 89, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { weight: 600 } } },
          y: { 
            grid: { display: false }, 
            beginAtZero: false,
            ticks: { font: { weight: 600 } }
          }
        }
      }
    });
    this.charts.push(chart);
  }

  private initLotesChart() {
    const ctx = this.lotesCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const dataMap = this.ganadoService.distLotes();
    const labels = Object.keys(dataMap);
    const data = Object.values(dataMap);

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels as any,
        datasets: [{
          data: data,
          backgroundColor: [
            'rgba(71, 103, 89, 1)', 
            'rgba(212, 163, 115, 1)', 
            '#e9edc9', 
            '#bc6c25', 
            '#8d99ae'
          ],
          borderWidth: 4,
          borderColor: '#fff',
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        cutout: '75%',
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
    this.charts.push(chart);
  }

  private initFinanceChart() {
    const ctx = this.financeCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const finData = this.finanzasService.getDatosFinancierosPorPeriodo('Mensual');
    const labels = finData.map(d => d.label);
    const ingresos = finData.map(d => d.ingresos);
    const gastos = finData.map(d => d.gastos);

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels as any,
        datasets: [
          {
            label: 'Ingresos (€)',
            data: ingresos,
            backgroundColor: 'rgba(71, 103, 89, 0.9)',
            borderRadius: 6,
            stack: 'Stack 0',
          },
          {
            label: 'Gastos (€)',
            data: gastos,
            backgroundColor: 'rgba(188, 71, 73, 0.9)',
            borderRadius: 6,
            stack: 'Stack 0',
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(0,0,0,0.03)' }, beginAtZero: true }
        }
      }
    });
    this.charts.push(chart);
  }
}
