import { Component, computed, inject, signal, OnInit, effect, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton,
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
import { PdfService } from '../../core/services/pdf.service';
import { addIcons } from 'ionicons';
import { 
  pawOutline, heartOutline, calendarOutline, statsChartOutline, alertCircleOutline, 
  trendingUpOutline, trendingDownOutline, walletOutline, scaleOutline, pieChartOutline, documentTextOutline 
} from 'ionicons/icons';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, 
    IonButtons, IonMenuButton, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
    IonIcon, IonSkeletonText, IonButton
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title class="ion-text-center">Centro de Inteligencia</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="exportarPDF()" color="primary">
            <ion-icon name="document-text-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-vertical">
      <div class="vac-container animate-fade-in pb-12">
        
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
              <div class="bi-kpi-card glass animate-slide-up">
                <div class="kpi-mini-icon" style="color: var(--ion-color-primary);">
                  <ion-icon name="paw-outline"></ion-icon>
                </div>
                <div class="kpi-content">
                  <span class="kpi-label">Hato Total</span>
                  <h2 class="kpi-value" *ngIf="!cargando()">{{ totalBovinos() }}</h2>
                  <ion-skeleton-text *ngIf="cargando()" animated style="width: 60%; height: 30px;"></ion-skeleton-text>
                </div>
              </div>
            </ion-col>
            <ion-col size="6" size-md="3">
              <div class="bi-kpi-card glass animate-slide-up delay-100">
                <div class="kpi-mini-icon" style="color: var(--ion-color-danger);">
                  <ion-icon name="heart-outline"></ion-icon>
                </div>
                <div class="kpi-content">
                  <span class="kpi-label">Gestantes</span>
                  <h2 class="kpi-value" *ngIf="!cargando()">{{ gestacionesActivas().length }}</h2>
                  <ion-skeleton-text *ngIf="cargando()" animated style="width: 60%; height: 30px;"></ion-skeleton-text>
                </div>
              </div>
            </ion-col>
            <ion-col size="6" size-md="3">
              <div class="bi-kpi-card glass animate-slide-up delay-200">
                <div class="kpi-mini-icon" style="color: var(--ion-color-tertiary);">
                  <ion-icon name="wallet-outline"></ion-icon>
                </div>
                <div class="kpi-content">
                  <span class="kpi-label">Margen Bruto</span>
                  <h2 class="kpi-value" *ngIf="!cargando()">{{ saldoMensual() | number:'1.0-0' }}€</h2>
                  <ion-skeleton-text *ngIf="cargando()" animated style="width: 60%; height: 30px;"></ion-skeleton-text>
                </div>
              </div>
            </ion-col>
            <ion-col size="6" size-md="3">
              <div class="bi-kpi-card glass animate-slide-up delay-300">
                <div class="kpi-mini-icon" style="color: var(--ion-color-secondary);">
                  <ion-icon name="scale-outline"></ion-icon>
                </div>
                <div class="kpi-content">
                  <span class="kpi-label">Peso Medio</span>
                  <h2 class="kpi-value" *ngIf="!cargando()">{{ pesoMedio() }} kg</h2>
                  <ion-skeleton-text *ngIf="cargando()" animated style="width: 60%; height: 30px;"></ion-skeleton-text>
                </div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- DASHBOARD DE GRÁFICOS -->
        <ion-grid class="ion-no-padding mt-4">
          <ion-row>
            <!-- ÁREA CHART: EVOLUCIÓN PESO -->
            <ion-col size="12" size-lg="8">
              <div class="bi-main-card animate-slide-up delay-400">
                <ion-card-header>
                  <div class="bi-card-head">
                    <div class="card-title-stack">
                      <span>EVOLUCIÓN PONDERADA</span>
                      <strong>Control de Masa Total</strong>
                    </div>
                    <div class="bi-mini-stat bg-primary-soft">
                      <ion-icon name="trending-up-outline"></ion-icon>
                      <span>+8.2% este mes</span>
                    </div>
                  </div>
                </ion-card-header>
                <ion-card-content class="relative">
                  <div *ngIf="cargando()" class="chart-skeleton">
                    <ion-skeleton-text animated class="skeleton-chart-main"></ion-skeleton-text>
                  </div>
                  <canvas #weightChart class="chart-canvas-main" [hidden]="cargando()"></canvas>
                </ion-card-content>
              </div>
            </ion-col>

            <!-- DONUT CHART: DISTRIBUCIÓN -->
            <ion-col size="12" size-lg="4">
              <div class="bi-main-card animate-slide-up delay-500">
                <ion-card-header>
                  <div class="card-title-stack">
                    <span>DISTRIBUCIÓN</span>
                    <strong>Población por Lote</strong>
                  </div>
                </ion-card-header>
                <ion-card-content class="chart-container-donut">
                  <div *ngIf="cargando()" class="chart-skeleton flex justify-center items-center">
                    <ion-skeleton-text animated style="width: 200px; height: 200px; border-radius: 50%;"></ion-skeleton-text>
                  </div>
                  <canvas #lotesChart [hidden]="cargando()"></canvas>
                </ion-card-content>
              </div>
            </ion-col>

            <!-- BAR CHART: FINANZAS -->
            <ion-col size="12">
              <div class="bi-main-card animate-slide-up delay-600">
                <ion-card-header>
                  <div class="card-title-stack">
                    <span>GESTIÓN ECONÓMICA</span>
                    <strong>Balance Mensual Comparativo</strong>
                  </div>
                </ion-card-header>
                <ion-card-content>
                  <div *ngIf="cargando()" class="chart-skeleton">
                    <ion-skeleton-text animated style="width: 100%; height: 250px;"></ion-skeleton-text>
                  </div>
                  <canvas #financeChart class="chart-canvas-finance" [hidden]="cargando()"></canvas>
                </ion-card-content>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

      </div>
    </ion-content>
  `,
  styles: []
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  fincaService = inject(FincaService);
  ganadoService = inject(GanadoService);
  reproService = inject(ReproduccionService);
  sanidadService = inject(SanidadService);
  pesajeService = inject(PesajeService);
  finanzasService = inject(FinanzasService);
  offlineSync = inject(OfflineSyncService);
  pdfService = inject(PdfService);
  
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
      pawOutline, heartOutline, calendarOutline, statsChartOutline, alertCircleOutline, 
      trendingUpOutline, trendingDownOutline, walletOutline, scaleOutline, pieChartOutline, documentTextOutline 
    });

    // Configuración Global de Chart.js
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(255, 255, 255, 0.98)';
    Chart.defaults.plugins.tooltip.titleColor = '#1b4332';
    Chart.defaults.plugins.tooltip.bodyColor = '#582f0e';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(27, 67, 50, 0.1)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 16;
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

  async exportarPDF() {
    const doc = await this.pdfService.getNewDoc();
    const now = new Date();
    const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

    // Estilo Rustic-Luxe
    const forestGreen: [number, number, number] = [27, 67, 50];

    // Encabezado
    doc.setFillColor(forestGreen[0], forestGreen[1], forestGreen[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('REPORTE EJECUTIVO - VACAPP', 14, 25);
    
    doc.setFontSize(10);
    doc.text(`FINCA: ${this.finca()?.nombre || 'General'} | EMISIÓN: ${dateStr}`, 14, 34);

    // KPI Section
    await this.pdfService.addTableToDoc(
      doc,
      'Indicadores Clave de Rendimiento (KPIs)',
      [['KPI', 'Valor Total', 'Estado']],
      [
        ['Censo Total Bovinos', (this.totalBovinos() || 0) + ' Cabezas', 'Estable'],
        ['Gestaciones Activas', (this.gestacionesActivas()?.length || 0) + ' Vacas', 'Controlado'],
        ['Peso Medio del Hato', (this.pesoMedio() || 0) + ' KG', 'En Rango'],
        ['Balance Financiero (Mes)', (this.saldoMensual() || 0) + ' €', 'Positivo']
      ],
      { 
        startY: 55,
        headStyles: { fillColor: forestGreen }
      }
    );

    // Distribución por Lote
    const lastY = this.pdfService.getLastY(doc);
    const distData = this.ganadoService.distLotes();
    const distBody = Object.entries(distData).map(([lote, count]) => [lote, count + ' Cabezas']);

    await this.pdfService.addTableToDoc(
      doc,
      'Distribución de Población por Lote',
      [['Lote / Potrero', 'Población']],
      distBody,
      { 
        startY: lastY + 15,
        headStyles: { fillColor: [88, 47, 14] as [number, number, number] } // Earth-brown
      }
    );

    // Pie de página
    const totalPages = doc.getNumberOfPages();
    for(let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Documento generado automáticamente por Vacapp AgriTech ERP', 105, 285, { align: 'center' });
    }

    doc.save(`reporte_ejecutivo_vacapp_${now.getTime()}.pdf`);
  }

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
    
    // Degradado "Rustic-Luxe"
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(27, 67, 50, 0.3)');
    gradient.addColorStop(1, 'rgba(27, 67, 50, 0)');

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: stats.labels as any,
        datasets: [{
          label: 'Peso Medio (kg)',
          data: stats.data,
          borderColor: '#1b4332',
          borderWidth: 4,
          tension: 0.4,
          fill: true,
          backgroundColor: gradient,
          pointBackgroundColor: '#1b4332',
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
          x: { grid: { display: false }, ticks: { font: { weight: 600 }, color: '#582f0e' } },
          y: { 
            grid: { display: true, color: 'rgba(0,0,0,0.03)' }, 
            beginAtZero: false,
            ticks: { font: { weight: 600 }, color: '#582f0e' }
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
            '#1b4332', // Forest
            '#582f0e', // Earth
            '#d4a373', // Wheat
            '#a3b18a', // Sage
            '#dda15e'  // Harvest
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
            backgroundColor: '#1b4332',
            borderRadius: 8,
            stack: 'Stack 0',
          },
          {
            label: 'Gastos (€)',
            data: gastos,
            backgroundColor: '#bc4749',
            borderRadius: 8,
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
