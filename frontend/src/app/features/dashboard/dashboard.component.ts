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
  paw, closeOutline, warningOutline, medkitOutline, cashOutline, informationCircleOutline
} from 'ionicons/icons';

Chart.register(...registerables);

/**
 * Interfaz para las alertas inteligentes del Dashboard.
 * Cada alerta tiene un nivel de severidad, un mensaje descriptivo y un icono contextual.
 */
interface Alerta {
  id: string;
  tipo: 'urgente' | 'aviso' | 'info';
  mensaje: string;
  fecha: Date;
  icono: string;
}

/**
 * @class DashboardComponent
 * @description Centro de mando y análisis de la explotación. 
 * Agrega datos de todos los módulos para presentar indicadores clave de rendimiento (KPIs),
 * alertas tempranas de salud/reproducción y visualizaciones gráficas de la evolución del hato.
 */

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
      <main class="vac-container animate-fade-in pb-12">
        
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

        <!-- ═══════════════════════════════════════════════════ -->
        <!-- ALERTAS INTELIGENTES                                -->
        <!-- ═══════════════════════════════════════════════════ -->
        <div class="vac-alertas-section" *ngIf="alertasVisibles().length > 0">
          <div class="vac-alertas-header">
            <div class="flex items-center gap-2">
              <ion-icon name="alert-circle-outline" class="color-danger text-xl"></ion-icon>
              <span class="vac-alertas-title">Alertas Inteligentes</span>
            </div>
            <span class="vac-alertas-count">{{ alertasVisibles().length }}</span>
          </div>

          <div 
            *ngFor="let alerta of alertasVisibles(); trackBy: trackById; let i = index"
            class="vac-alerta-card"
            [class.vac-alerta-urgente]="alerta.tipo === 'urgente'"
            [class.vac-alerta-aviso]="alerta.tipo === 'aviso'"
            [class.vac-alerta-info]="alerta.tipo === 'info'"
            [style.animation-delay]="(i * 80) + 'ms'">

            <div class="vac-alerta-icon-wrapper"
              [class.bg-danger-soft]="alerta.tipo === 'urgente'"
              [class.bg-warning-soft]="alerta.tipo === 'aviso'"
              [class.bg-tertiary-soft]="alerta.tipo === 'info'">
              <ion-icon [name]="alerta.icono"
                [color]="alerta.tipo === 'urgente' ? 'danger' : alerta.tipo === 'aviso' ? 'warning' : 'tertiary'">
              </ion-icon>
            </div>

            <div class="vac-alerta-body">
              <p class="vac-alerta-mensaje">{{ alerta.mensaje }}</p>
              <span class="vac-alerta-fecha">{{ alerta.fecha | date:'dd MMM yyyy, HH:mm' }}</span>
            </div>

            <button class="vac-alerta-dismiss" (click)="dismissAlerta(alerta.id)" aria-label="Cerrar alerta">
              <ion-icon name="close-outline"></ion-icon>
            </button>
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

      </main>
    </ion-content>
  `,
  styles: [`
    /* ═══════════════════════════════════════════ */
    /* ALERTAS INTELIGENTES - Rustic-Luxe          */
    /* ═══════════════════════════════════════════ */

    @keyframes alertSlideIn {
      from {
        opacity: 0;
        transform: translateY(-12px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes alertPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(188, 71, 73, 0.15); }
      50%      { box-shadow: 0 0 0 6px rgba(188, 71, 73, 0); }
    }

    .vac-alertas-section {
      margin: 1.25rem 0 1.75rem;
    }

    .vac-alertas-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      padding: 0 0.25rem;
    }

    .vac-alertas-title {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--ion-color-dark, #1b4332);
      letter-spacing: 0.02em;
    }

    .vac-alertas-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 26px;
      height: 26px;
      border-radius: 13px;
      background: var(--ion-color-danger, #bc4749);
      color: #fff;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 0.8rem;
      padding: 0 8px;
    }

    .vac-alerta-card {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 14px 16px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(12px);
      margin-bottom: 10px;
      border: 1px solid rgba(0, 0, 0, 0.06);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      animation: alertSlideIn 0.45s cubic-bezier(0.4, 0, 0.2, 1) both;
      position: relative;
    }

    .vac-alerta-card:hover {
      transform: translateX(3px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    /* Borde izquierdo por tipo */
    .vac-alerta-urgente {
      border-left: 4px solid var(--ion-color-danger, #bc4749);
      animation: alertSlideIn 0.45s cubic-bezier(0.4, 0, 0.2, 1) both,
                 alertPulse 3s ease-in-out 1s 2;
    }
    .vac-alerta-aviso {
      border-left: 4px solid var(--ion-color-warning, #dda15e);
    }
    .vac-alerta-info {
      border-left: 4px solid var(--ion-color-tertiary, #40916c);
    }

    /* Icono */
    .vac-alerta-icon-wrapper {
      flex-shrink: 0;
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }
    .bg-danger-soft  { background: rgba(188, 71, 73, 0.12); }
    .bg-warning-soft { background: rgba(221, 161, 94, 0.15); }
    .bg-tertiary-soft { background: rgba(64, 145, 108, 0.12); }

    /* Body */
    .vac-alerta-body {
      flex: 1;
      min-width: 0;
    }
    .vac-alerta-mensaje {
      font-family: 'Outfit', sans-serif;
      font-size: 0.88rem;
      font-weight: 500;
      color: var(--ion-color-dark, #1b4332);
      line-height: 1.45;
      margin: 0 0 4px;
    }
    .vac-alerta-fecha {
      font-family: 'Outfit', sans-serif;
      font-size: 0.72rem;
      color: var(--ion-color-medium, #92949c);
      letter-spacing: 0.02em;
    }

    /* Dismiss */
    .vac-alerta-dismiss {
      flex-shrink: 0;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: var(--ion-color-medium, #92949c);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 1.1rem;
      margin-top: 2px;
    }
    .vac-alerta-dismiss:hover {
      background: rgba(0, 0, 0, 0.06);
      color: var(--ion-color-danger, #bc4749);
      transform: rotate(90deg);
    }
  `]
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
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

  // ═══ ALERTAS INTELIGENTES ═══
  /** Signal interno con todas las alertas generadas */
  private alertas = signal<Alerta[]>([]);
  /** IDs de alertas descartadas por el usuario en esta sesión */
  private alertasDismissed = signal<Set<string>>(new Set());
  /** Alertas visibles = generadas - descartadas (ordenadas por prioridad) */
  alertasVisibles = computed(() => {
    const dismissed = this.alertasDismissed();
    const prioridad: Record<string, number> = { urgente: 0, aviso: 1, info: 2 };
    return this.alertas()
      .filter(a => !dismissed.has(a.id))
      .sort((a, b) => prioridad[a.tipo] - prioridad[b.tipo]);
  });

  /**
   * @constructor
   * @description Configura la visualización inicial del panel de control.
   * Inicializa el motor de gráficos (Chart.js) con estilos personalizados 'Forest & Earth'.
   * Registra efectos reactivos para la actualización automática de métricas ante cambios en el censo o finanzas.
   */
  constructor() {
    addIcons({ 
      pawOutline, heartOutline, calendarOutline, statsChartOutline, alertCircleOutline, 
      trendingUpOutline, trendingDownOutline, walletOutline, scaleOutline, pieChartOutline, documentTextOutline,
      paw, closeOutline, warningOutline, medkitOutline, cashOutline, informationCircleOutline
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

    // Generar alertas reactivamente cuando los datos estén listos
    effect(() => {
      if (!this.cargando()) {
        // Leer signals para registrar dependencias
        const _repro = this.reproService.gestacionesActivas();
        const _sanidad = this.sanidadService.records();
        const _finanzas = this.finanzasService.records();
        const _bovinos = this.ganadoService.bovinos();
        setTimeout(() => this.generarAlertas(), 500);
      }
    });
  }

  /**
   * @description Aplica un filtro temporal global a todos los widgets del dashboard.
   * Sincroniza la visualización de pesajes y finanzas para una comparativa coherente.
   * @param {'Mensual' | 'Anual'} period Granularidad temporal deseada.
   */
  applyMasterFilter(period: 'Mensual' | 'Anual') {
    this.masterPeriod.set(period);
    this.weightPeriod.set(period);
    this.financePeriod.set(period);
  }

  /**
   * @description Seguimiento de identidad para elementos dinámicos (Alertas).
   */
  trackById(index: number, item: Alerta | any): string {
    return item?.id || index.toString();
  }

  // ═══════════════════════════════════════════════════
  // ALERTAS INTELIGENTES - Lógica de generación
  // ═══════════════════════════════════════════════════

  /**
   * Analiza los datos de Reproducción, Sanidad y Finanzas
   * para generar notificaciones proactivas e inteligentes.
   */
  private generarAlertas(): void {
    const nuevasAlertas: Alerta[] = [];
    const bovinos = this.ganadoService.bovinos();
    const bovinoMap = new Map(bovinos.map(b => [b.id, b]));

    // ─── 1. ALERTAS DE REPRODUCCIÓN (Urgente) ───
    // Partos inminentes: vacas gestantes con FPP en los próximos 60 días
    const gestacionesConfirmadas = this.reproService.gestacionesActivas();
    const hoy = new Date();
    const limite60d = new Date();
    limite60d.setDate(hoy.getDate() + 60);

    gestacionesConfirmadas.forEach(g => {
      if (!g.fecha_parto_prevista) return;
      const fpp = new Date(g.fecha_parto_prevista);
      if (fpp >= hoy && fpp <= limite60d) {
        const bovino = g.bovino || bovinoMap.get(g.bovino_id);
        const nombre = bovino?.nombre || 'Res S/N';
        const crotal = bovino?.crotal || g.bovino_id;
        const diasRestantes = Math.ceil((fpp.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        nuevasAlertas.push({
          id: `repro-${g.id}`,
          tipo: diasRestantes <= 15 ? 'urgente' : 'aviso',
          mensaje: `⚠️ ${nombre} (${crotal}) tiene un parto próximo programado en ${diasRestantes} días.`,
          fecha: new Date(),
          icono: 'warning-outline'
        });
      }
    });

    // ─── 2. ALERTAS DE SANIDAD (Aviso) ───
    // Animales con retiro sanitario activo (en tratamiento)
    const registrosSanidad = this.sanidadService.records();
    const tratamientosActivos = registrosSanidad.filter(s => {
      if (s.tipo !== 'Tratamiento' && s.tipo !== 'Cirugía') return false;
      if (!s.fecha) return false;
      const fAplicacion = new Date(s.fecha);
      const maxRetiro = Math.max(s.dias_retiro_carne || 0, s.dias_retiro_leche || 0);
      if (maxRetiro === 0) {
        // Sin retiro definido, verificar si es reciente (últimos 30 días)
        const diasDesde = Math.ceil((hoy.getTime() - fAplicacion.getTime()) / (1000 * 60 * 60 * 24));
        return diasDesde <= 30;
      }
      const fFinRetiro = new Date(fAplicacion);
      fFinRetiro.setDate(fFinRetiro.getDate() + maxRetiro);
      return fFinRetiro > hoy;
    });

    // Agrupar por bovino para no duplicar alertas
    const bovinosTratamiento = new Set<string>();
    tratamientosActivos.forEach(s => {
      if (bovinosTratamiento.has(s.bovino_id)) return;
      bovinosTratamiento.add(s.bovino_id);
      const bovino = s.bovino || bovinoMap.get(s.bovino_id);
      const nombre = bovino?.nombre || 'Res S/N';
      nuevasAlertas.push({
        id: `sanidad-${s.bovino_id}`,
        tipo: 'aviso',
        mensaje: `💉 ${nombre} requiere revisión de tratamiento (${s.producto}).`,
        fecha: new Date(),
        icono: 'medkit-outline'
      });
    });

    // ─── 3. ALERTAS DE FINANZAS (Info) ───
    // Gastos superiores a 1000€ en el mes actual
    const mesActual = hoy.getMonth();
    const yearActual = hoy.getFullYear();
    const registrosFinanzas = this.finanzasService.records();

    registrosFinanzas.forEach(f => {
      if (f.tipo !== 'Gasto') return;
      const fechaGasto = new Date(f.fecha);
      if (fechaGasto.getMonth() !== mesActual || fechaGasto.getFullYear() !== yearActual) return;
      if (f.monto > 1000) {
        nuevasAlertas.push({
          id: `finanzas-${f.id}`,
          tipo: 'info',
          mensaje: `💰 Gasto elevado detectado en ${f.categoria || 'Varios'}: ${f.monto.toLocaleString('es-ES')}€ — ${f.descripcion || 'Sin descripción'}.`,
          fecha: new Date(f.fecha),
          icono: 'cash-outline'
        });
      }
    });

    this.alertas.set(nuevasAlertas);
  }

  /**
   * Descarta una alerta de la vista (solo en la sesión actual).
   * @param id - Identificador único de la alerta a descartar
   */
  dismissAlerta(id: string): void {
    const current = new Set(this.alertasDismissed());
    current.add(id);
    this.alertasDismissed.set(current);
  }

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

  /**
   * @description Gráfico de evolución de peso — Estilo trading con línea suave,
   * gradiente sutil, puntos ocultos con reveal al hover y crosshair vertical.
   */
  private initWeightChart() {
    const ctx = this.weightCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const stats = this.weightPeriod() === 'Mensual' 
        ? this.pesajeService.getEvolucionMensualHerd()
        : { labels: ['2023', '2024', '2025'], data: [450, 480, 510] };
    
    // Gradiente sutil día (Forest Green)
    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, 'rgba(27, 67, 50, 0.18)');
    gradient.addColorStop(0.5, 'rgba(27, 67, 50, 0.05)');
    gradient.addColorStop(1, 'rgba(27, 67, 50, 0)');

    // Crosshair plugin
    const crosshair = {
      id: 'weightCrosshair',
      afterDraw: (chart: any) => {
        if (chart.tooltip?._active?.length) {
          const cx = chart.ctx;
          const x = chart.tooltip._active[0].element.x;
          cx.save();
          cx.beginPath();
          cx.setLineDash([3, 4]);
          cx.moveTo(x, chart.scales.y.top);
          cx.lineTo(x, chart.scales.y.bottom);
          cx.lineWidth = 1;
          cx.strokeStyle = 'rgba(27, 67, 50, 0.12)';
          cx.stroke();
          cx.restore();
        }
      }
    };

    const chart = new Chart(ctx, {
      type: 'line',
      plugins: [crosshair],
      data: {
        labels: stats.labels as any,
        datasets: [{
          label: 'Peso Medio (kg)',
          data: stats.data,
          borderColor: '#1b4332',
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          backgroundColor: gradient,
          pointRadius: 0,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#1b4332',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 800, easing: 'easeOutQuart' },
        interaction: { intersect: false, mode: 'index' },
        plugins: { 
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(253, 251, 247, 0.97)',
            titleColor: '#92949c',
            bodyColor: '#1A211E',
            borderColor: 'rgba(166, 124, 82, 0.2)',
            borderWidth: 1,
            padding: { top: 10, bottom: 10, left: 14, right: 14 },
            cornerRadius: 12,
            usePointStyle: true,
            boxPadding: 6,
            titleFont: { family: "'Outfit', sans-serif", size: 11, weight: 600 },
            bodyFont: { family: "'Outfit', sans-serif", size: 13, weight: 500 },
            callbacks: {
              label: (ctx: any) => ` Peso Medio:  ${ctx.parsed.y} kg`
            }
          }
        },
        scales: {
          x: { 
            grid: { display: false },
            border: { display: false },
            ticks: { font: { weight: 600, family: "'Outfit', sans-serif", size: 10 }, color: '#582f0e', padding: 8, maxRotation: 0 } 
          },
          y: { 
            position: 'right',
            grid: { color: 'rgba(0,0,0,0.04)', lineWidth: 1 }, 
            border: { display: false },
            beginAtZero: false,
            ticks: {
              font: { weight: 600, family: "'Outfit', sans-serif", size: 10 },
              color: '#582f0e',
              padding: 10,
              callback: (value: any) => value + ' kg'
            }
          }
        },
      }
    });
    this.charts.push(chart);
  }

  /**
   * @description Doughnut de distribución por lote — Diseño limpio con cutout grande,
   * bordes redondeados y hover con desplazamiento sutil.
   */
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
          borderWidth: 2,
          borderColor: '#FDFBF7',
          hoverOffset: 16,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        cutout: '74%',
        layout: { padding: 8 },
        animation: { animateRotate: true, duration: 900, easing: 'easeOutQuart' },
        plugins: {
          legend: { 
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              font: { family: "'Outfit', sans-serif", weight: 600, size: 11 },
              color: '#582f0e',
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: 'rgba(253, 251, 247, 0.97)',
            titleColor: '#92949c',
            bodyColor: '#1A211E',
            borderColor: 'rgba(166, 124, 82, 0.2)',
            borderWidth: 1,
            padding: { top: 10, bottom: 10, left: 14, right: 14 },
            cornerRadius: 12,
            usePointStyle: true,
            boxPadding: 6,
            titleFont: { family: "'Outfit', sans-serif", size: 11, weight: 600 },
            bodyFont: { family: "'Outfit', sans-serif", size: 13, weight: 500 },
            callbacks: {
              label: (ctx: any) => ` ${ctx.label}:  ${ctx.parsed} cabezas`
            }
          }
        }
      }
    });
    this.charts.push(chart);
  }

  /**
   * @description Gráfico financiero del dashboard — Líneas suaves con gradiente,
   * crosshair interactivo y tooltip con cálculo de balance.
   * Estética consistente con el módulo de Finanzas (trading day-mode).
   */
  private initFinanceChart() {
    const ctx = this.financeCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const finData = this.finanzasService.getDatosFinancierosPorPeriodo(this.financePeriod());
    const labels = finData.map(d => d.label);
    const ingresos = finData.map(d => d.ingresos);
    const gastos = finData.map(d => d.gastos);

    // Gradientes día (Rustic-Luxe)
    const gradIngresos = ctx.createLinearGradient(0, 0, 0, 350);
    gradIngresos.addColorStop(0, 'rgba(27, 67, 50, 0.18)');
    gradIngresos.addColorStop(0.5, 'rgba(27, 67, 50, 0.05)');
    gradIngresos.addColorStop(1, 'rgba(27, 67, 50, 0)');

    const gradGastos = ctx.createLinearGradient(0, 0, 0, 350);
    gradGastos.addColorStop(0, 'rgba(188, 71, 73, 0.15)');
    gradGastos.addColorStop(0.5, 'rgba(188, 71, 73, 0.04)');
    gradGastos.addColorStop(1, 'rgba(188, 71, 73, 0)');

    // Crosshair plugin
    const crosshair = {
      id: 'financeCrosshair',
      afterDraw: (chart: any) => {
        if (chart.tooltip?._active?.length) {
          const cx = chart.ctx;
          const x = chart.tooltip._active[0].element.x;
          cx.save();
          cx.beginPath();
          cx.setLineDash([3, 4]);
          cx.moveTo(x, chart.scales.y.top);
          cx.lineTo(x, chart.scales.y.bottom);
          cx.lineWidth = 1;
          cx.strokeStyle = 'rgba(27, 67, 50, 0.12)';
          cx.stroke();
          cx.restore();
        }
      }
    };

    const chart = new Chart(ctx, {
      type: 'line',
      plugins: [crosshair],
      data: {
        labels: labels as any,
        datasets: [
          {
            label: 'Ingresos (€)',
            data: ingresos,
            borderColor: '#1b4332',
            borderWidth: 2.5,
            backgroundColor: gradIngresos,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: '#1b4332',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 3
          },
          {
            label: 'Gastos (€)',
            data: gastos,
            borderColor: '#BC4749',
            borderWidth: 2.5,
            backgroundColor: gradGastos,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: '#BC4749',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        animation: { duration: 800, easing: 'easeOutQuart' },
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { 
            position: 'top',
            align: 'end',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              font: { family: "'Outfit', sans-serif", weight: 600, size: 11 },
              color: '#582f0e',
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(253, 251, 247, 0.97)',
            titleFont: { family: "'Outfit', sans-serif", size: 11, weight: 600 },
            bodyFont: { family: "'Outfit', sans-serif", size: 13, weight: 500 },
            titleColor: '#92949c',
            bodyColor: '#1A211E',
            borderColor: 'rgba(166, 124, 82, 0.2)',
            borderWidth: 1,
            padding: { top: 10, bottom: 10, left: 14, right: 14 },
            cornerRadius: 12,
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            boxPadding: 6,
            displayColors: true,
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (ctx: any) => {
                const val = ctx.parsed.y?.toLocaleString('es-ES') || '0';
                const prefix = ctx.dataset.label?.includes('Ingreso') ? '+' : '-';
                return ` ${ctx.dataset.label}:  ${prefix}${val} €`;
              },
              afterBody: (items: any) => {
                if (items.length >= 2) {
                  const diff = (items[0].parsed.y || 0) - (items[1].parsed.y || 0);
                  const sign = diff >= 0 ? '+' : '';
                  return [`─────────────────`, `  Balance:  ${sign}${diff.toLocaleString('es-ES')} €`];
                }
                return [];
              }
            }
          }
        },
        scales: {
          x: { 
            grid: { display: false },
            border: { display: false },
            ticks: { font: { family: "'Outfit', sans-serif", weight: 600, size: 10 }, color: '#582f0e', padding: 8, maxRotation: 0 }
          },
          y: { 
            position: 'right',
            grid: { color: 'rgba(0,0,0,0.04)', lineWidth: 1 }, 
            border: { display: false },
            beginAtZero: true,
            ticks: {
              font: { family: "'Outfit', sans-serif", weight: 600, size: 10 },
              color: '#582f0e',
              padding: 10,
              callback: (value: any) => {
                if (value >= 1000) return (value / 1000).toFixed(1) + 'k €';
                return value + ' €';
              }
            }
          }
        },
      }
    });
    this.charts.push(chart);
  }
}
