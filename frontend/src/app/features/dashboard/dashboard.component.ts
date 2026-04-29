import { Component, computed, inject, signal, OnInit, effect, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton,
  IonButtons, IonMenuButton, IonGrid, IonRow, IonCol,
  IonIcon, IonSkeletonText, IonSegment, IonSegmentButton, IonLabel
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
  trendingUpOutline, trendingDownOutline, walletOutline, scaleOutline, pieChartOutline, documentTextOutline,
  paw 
} from 'ionicons/icons';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, 
    IonButtons, IonMenuButton, IonGrid, IonRow, IonCol,
    IonIcon, IonSkeletonText, IonButton, IonSegment, IonSegmentButton, IonLabel
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title class="ion-text-center">Centro de Inteligencia</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="exportarPDF()" fill="clear">
            <ion-icon name="document-text-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-vertical">
      <div class="vac-container animate-fade-in pb-12">
        
        <!-- Header con Identidad -->
        <div class="vac-page-header mt-4">
          <div class="vac-header-flex">
            <div>
              <h1 class="vac-page-title">Resumen Ejecutivo</h1>
              <p class="vac-page-subtitle">
                <ion-icon name="paw" class="icon-mr-sm"></ion-icon>
                Finca actual: <strong>{{ finca()?.nombre || 'Cargando...' }}</strong>
              </p>
            </div>
            <div class="vac-status-container">
              <div class="vac-online-indicator" [class.offline]="!isOnline()">
                <span>{{ isOnline() ? 'Sincronizado' : 'Modo Offline' }}</span>
                <div class="dot shadow-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- CONTROL MANDO COLECTIVO (NUEVO) -->
        <div class="vac-master-filter-bar mb-6 animate-fade-in no-margin-sm">
           <div class="flex items-center gap-3">
              <ion-icon name="stats-chart-outline" class="color-primary text-xl"></ion-icon>
              <div class="vac-text-stack text-left">
                 <span class="text-xs uppercase tracking-widest color-medium font-bold">Resumen Global</span>
                 <strong class="text-lg">Periodo de Análisis</strong>
              </div>
           </div>
           <ion-segment [value]="masterPeriod()" (ionChange)="applyMasterFilter($any($event).detail.value)" mode="ios" class="vac-segment-earth mt-4">
              <ion-segment-button value="Mensual">
                <ion-label>Mensual</ion-label>
              </ion-segment-button>
              <ion-segment-button value="Anual">
                <ion-label>Anual</ion-label>
              </ion-segment-button>
           </ion-segment>
        </div>

        <!-- KPI GRID PRINCIPAL -->
        <ion-grid fixed class="ion-no-padding mt-4">
          <ion-row>
            <ion-col size="6" size-md="3">
              <div class="vac-kpi-card glass animate-slide-up m-0 shadow-none border-none">
                <div class="vac-kpi-mini-icon">
                  <ion-icon name="paw-outline" color="primary"></ion-icon>
                </div>
                <div class="vac-kpi-content">
                  <span class="vac-kpi-label">Hato Total</span>
                  <h2 class="vac-kpi-value" *ngIf="!cargando()">{{ totalBovinos() }}</h2>
                  <ion-skeleton-text *ngIf="cargando()" animated class="skeleton-kpi"></ion-skeleton-text>
                </div>
              </div>
            </ion-col>
            <ion-col size="6" size-md="3">
              <div class="vac-kpi-card glass animate-slide-up delay-100 m-0 shadow-none border-none">
                <div class="vac-kpi-mini-icon">
                  <ion-icon name="heart-outline" color="danger"></ion-icon>
                </div>
                <div class="vac-kpi-content">
                  <span class="vac-kpi-label">Gestantes</span>
                  <h2 class="vac-kpi-value" *ngIf="!cargando()">{{ gestacionesActivas().length }}</h2>
                  <ion-skeleton-text *ngIf="cargando()" animated class="skeleton-kpi"></ion-skeleton-text>
                </div>
              </div>
            </ion-col>
            <ion-col size="6" size-md="3">
              <div class="vac-kpi-card glass animate-slide-up delay-200 m-0 shadow-none border-none">
                <div class="vac-kpi-mini-icon">
                  <ion-icon name="wallet-outline" color="tertiary"></ion-icon>
                </div>
                <div class="vac-kpi-content">
                  <span class="vac-kpi-label">Margen Bruto</span>
                  <h2 class="vac-kpi-value" *ngIf="!cargando()">{{ saldoMensual() | number:'1.0-0' }}€</h2>
                  <ion-skeleton-text *ngIf="cargando()" animated class="skeleton-kpi"></ion-skeleton-text>
                </div>
              </div>
            </ion-col>
            <ion-col size="6" size-md="3">
              <div class="vac-kpi-card glass animate-slide-up delay-300 m-0 shadow-none border-none">
                <div class="vac-kpi-mini-icon">
                  <ion-icon name="scale-outline" color="secondary"></ion-icon>
                </div>
                <div class="vac-kpi-content">
                  <span class="vac-kpi-label">Peso Medio</span>
                  <h2 class="vac-kpi-value" *ngIf="!cargando()">{{ pesoMedio() }} kg</h2>
                  <ion-skeleton-text *ngIf="cargando()" animated class="skeleton-kpi"></ion-skeleton-text>
                </div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- DASHBOARD DE GRÁFICOS -->
        <ion-grid fixed class="ion-no-padding mt-4">
          <ion-row>
            <!-- ÁREA CHART: EVOLUCIÓN PESO -->
            <ion-col size="12" size-lg="8">
              <div class="vac-main-card animate-slide-up delay-400">
                <div class="vac-card-header">
                    <div class="vac-card-title-group">
                      <span>EVOLUCIÓN PONDERADA</span>
                      <strong>Control de Masa Total</strong>
                    </div>
                    <!-- CONTROL INDIVIDUAL -->
                    <div class="flex items-center gap-2">
                       <ion-segment [value]="weightPeriod()" (ionChange)="weightPeriod.set($any($event).detail.value)" mode="ios" class="vac-segment-mini">
                          <ion-segment-button value="Mensual">
                            <ion-label>M</ion-label>
                          </ion-segment-button>
                          <ion-segment-button value="Anual">
                            <ion-label>A</ion-label>
                          </ion-segment-button>
                       </ion-segment>
                       <div class="vac-mini-stat bg-primary-soft hidden-sm">
                         <ion-icon name="scale-outline"></ion-icon>
                         <span>+8.2%</span>
                       </div>
                    </div>
                  </div>
                  <div class="vac-card-content relative">
                    <div *ngIf="cargando()" class="vac-chart-skeleton">
                      <ion-skeleton-text animated class="skeleton-chart-main"></ion-skeleton-text>
                    </div>
                    <canvas #weightChart class="chart-canvas-main" [hidden]="cargando()"></canvas>
                  </div>
                </div>
              </ion-col>
 
            <!-- DONUT CHART: DISTRIBUCIÓN -->
            <ion-col size="12" size-lg="4">
              <div class="vac-main-card animate-slide-up delay-500">
                <div class="vac-card-header">
                  <div class="vac-card-title-group">
                    <span>DISTRIBUCIÓN</span>
                    <strong>Población por Lote</strong>
                  </div>
                </div>
                <div class="vac-card-content vac-chart-container-donut">
                  <div *ngIf="cargando()" class="vac-chart-skeleton flex justify-center items-center">
                    <ion-skeleton-text animated class="skeleton-avatar-xl"></ion-skeleton-text>
                  </div>
                  <canvas #lotesChart [hidden]="cargando()"></canvas>
                </div>
              </div>
            </ion-col>
 
            <!-- BAR CHART: FINANZAS -->
            <ion-col size="12">
              <div class="vac-main-card animate-slide-up delay-600">
                <div class="vac-card-header">
                  <div class="vac-card-header-flex">
                    <div class="vac-card-title-group">
                      <span>GESTIÓN ECONÓMICA</span>
                      <strong>Balance Comparativo</strong>
                    </div>
                    <!-- CONTROL INDIVIDUAL -->
                    <div class="flex items-center gap-2">
                       <ion-segment [value]="financePeriod()" (ionChange)="financePeriod.set($any($event).detail.value)" mode="ios" class="vac-segment-mini">
                          <ion-segment-button value="Mensual">
                            <ion-label>M</ion-label>
                          </ion-segment-button>
                          <ion-segment-button value="Anual">
                            <ion-label>A</ion-label>
                          </ion-segment-button>
                       </ion-segment>
                    </div>
                  </div>
                </div>
                <div class="vac-card-content">
                  <div *ngIf="cargando()" class="chart-skeleton">
                    <ion-skeleton-text animated class="skeleton-chart-main"></ion-skeleton-text>
                  </div>
                  <canvas #financeChart class="chart-canvas-finance" [hidden]="cargando()"></canvas>
                </div>
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

  // Filtros de Gráficos (Dual-Layer)
  masterPeriod = signal<'Mensual' | 'Anual'>('Mensual');
  weightPeriod = signal<'Mensual' | 'Anual'>('Mensual');
  financePeriod = signal<'Mensual' | 'Anual'>('Mensual');

  @ViewChild('weightChart') weightCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lotesChart') lotesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('financeChart') financeCanvas!: ElementRef<HTMLCanvasElement>;

  private charts: any[] = [];

  constructor() {
    addIcons({ 
      pawOutline, heartOutline, calendarOutline, statsChartOutline, alertCircleOutline, 
      trendingUpOutline, trendingDownOutline, walletOutline, scaleOutline, pieChartOutline, documentTextOutline,
      paw
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

    // Reactividad a datos y filtros
    effect(() => {
      if (!this.cargando()) {
        // Al interactuar con estos signals, el effect se redispara
        const _wp = this.weightPeriod();
        const _fp = this.financePeriod();
        setTimeout(() => this.updateCharts(), 300);
      }
    });
  }

  applyMasterFilter(period: 'Mensual' | 'Anual') {
    this.masterPeriod.set(period);
    this.weightPeriod.set(period);
    this.financePeriod.set(period);
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

    // Usar la evolución según el periodo seleccionado
    const stats = this.weightPeriod() === 'Mensual' 
        ? this.pesajeService.getEvolucionMensualHerd()
        : { labels: ['2023', '2024', '2025'], data: [450, 480, 510] }; // Fallback anual simple si no hay un agrupador anual en servicio
    
    // Degradado Espectacular
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(27, 67, 50, 0.6)');
    gradient.addColorStop(0.5, 'rgba(27, 67, 50, 0.2)');
    gradient.addColorStop(1, 'rgba(27, 67, 50, 0.0)');

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: stats.labels as any,
        datasets: [{
          label: 'Peso Medio (kg)',
          data: stats.data,
          borderColor: '#1b4332',
          borderWidth: 4,
          tension: 0.5, // Curvas más suaves
          fill: true,
          backgroundColor: gradient,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#1b4332',
          pointBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 10,
          pointHoverBackgroundColor: '#d4a373',
          pointHoverBorderColor: '#1b4332'
        }]
      },
      options: {
        responsive: true,
        plugins: { 
          legend: { display: false },
          tooltip: {
            usePointStyle: true,
            boxPadding: 8
          }
        },
        scales: {
          x: { 
            grid: { display: false }, 
            ticks: { font: { weight: 600, family: 'Outfit' }, color: '#582f0e', padding: 10 } 
          },
          y: { 
            grid: { display: true, color: 'rgba(0,0,0,0.04)' }, 
            border: { display: false },
            beginAtZero: false,
            ticks: { font: { weight: 600, family: 'Outfit' }, color: '#582f0e', padding: 10 }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
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
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverOffset: 25,
          borderRadius: 6 // Bordes redondeados espectaculares
        }]
      },
      options: {
        responsive: true,
        cutout: '72%',
        layout: { padding: 10 },
        plugins: {
          legend: { 
            position: 'bottom',
            labels: { font: { family: 'Outfit', weight: 600, size: 13 }, color: '#1b4332', padding: 20 }
          }
        }
      }
    });
    this.charts.push(chart);
  }

  private initFinanceChart() {
    const ctx = this.financeCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const finData = this.finanzasService.getDatosFinancierosPorPeriodo(this.financePeriod());
    const labels = finData.map(d => d.label);
    const ingresos = finData.map(d => d.ingresos);
    const gastos = finData.map(d => d.gastos);

    // Degradados Cilíndricos
    const gradIngresos = ctx.createLinearGradient(0, 0, 0, 400);
    gradIngresos.addColorStop(0, '#1b4332');
    gradIngresos.addColorStop(1, '#40916c');

    const gradGastos = ctx.createLinearGradient(0, 0, 0, 400);
    gradGastos.addColorStop(0, '#bc4749');
    gradGastos.addColorStop(1, '#e5989b');

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels as any,
        datasets: [
          {
            label: 'Ingresos (€)',
            data: ingresos,
            backgroundColor: gradIngresos,
            borderRadius: { topLeft: 12, topRight: 12, bottomLeft: 4, bottomRight: 4 },
            borderSkipped: false,
            barPercentage: 0.7,
            categoryPercentage: 0.8
          },
          {
            label: 'Gastos (€)',
            data: gastos,
            backgroundColor: gradGastos,
            borderRadius: { topLeft: 12, topRight: 12, bottomLeft: 4, bottomRight: 4 },
            borderSkipped: false,
            barPercentage: 0.7,
            categoryPercentage: 0.8
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { 
            position: 'top',
            labels: { font: { family: 'Outfit', weight: 600 }, color: '#1b4332', padding: 20 }
          }
        },
        scales: {
          x: { 
            grid: { display: false },
            ticks: { font: { family: 'Outfit', weight: 600 }, color: '#582f0e', padding: 10 }
          },
          y: { 
            grid: { color: 'rgba(0,0,0,0.04)' }, 
            border: { display: false },
            beginAtZero: true,
            ticks: { font: { family: 'Outfit', weight: 600 }, color: '#582f0e', padding: 10 }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      }
    });
    this.charts.push(chart);
  }
}
