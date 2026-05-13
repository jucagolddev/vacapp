import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonMenuButton, IonFab, IonFabButton, IonIcon,
  IonModal, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton,
  IonGrid, IonRow, IonCol, IonPopover, IonSegment, IonSegmentButton,
  ToastController, AlertController, IonCard
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { PdfService } from '../../core/services/pdf.service';
import { Chart, registerables } from 'chart.js';
import { FinanzasService } from '../../core/services/finanzas.service';
import { Finanzas } from '../../core/models/vacapp.models';
import { addCircle, closeOutline, saveOutline, createOutline, trashOutline, walletOutline, trendingUpOutline, trendingDownOutline, cashOutline, arrowDownOutline, arrowUpOutline, documentTextOutline, filterOutline, statsChartOutline } from 'ionicons/icons';

/**
 * @class FinanzasComponent
 * @description Módulo de gestión económica de la explotación. 
 * Permite el seguimiento detallado de flujos de caja (ingresos y gastos),
 * análisis de retorno de inversión (ROI) mediante gráficos comparativos
 * y exportación de balances financieros a formato PDF.
 */

@Component({
  selector: 'app-finanzas',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonMenuButton, IonFab, IonFabButton, IonIcon,
    IonModal, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton,
    IonGrid, IonRow, IonCol, IonCard,
    IonPopover, IonSegment, IonSegmentButton
  ],
  styleUrls: ['./finanzas.component.scss'],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title class="ion-text-center">Gastos y Ganancias</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="presentFilter($event)" fill="clear" aria-label="Abrir filtros">
            <ion-icon name="filter-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-vertical">
      <main class="vac-container animate-fade-in pb-12">
        
        <!-- DASHBOARD METRICS -->
        <ion-grid class="finance-metrics mb-6">
          <ion-row>
            <ion-col size="12" size-md="4">
              <ion-card class="metric-card income">
                <div class="icon-box"><ion-icon name="trending-up-outline"></ion-icon></div>
                <div class="data-box">
                  <p>Ingresos Totales</p>
                  <h3>{{ totalIngresos | currency:'EUR' }}</h3>
                </div>
              </ion-card>
            </ion-col>
            <ion-col size="12" size-md="4">
              <ion-card class="metric-card expense">
                <div class="icon-box"><ion-icon name="trending-down-outline"></ion-icon></div>
                <div class="data-box">
                  <p>Gastos Totales</p>
                  <h3>{{ totalGastos | currency:'EUR' }}</h3>
                </div>
              </ion-card>
            </ion-col>
            <ion-col size="12" size-md="4">
              <ion-card class="metric-card balance">
                <div class="icon-box"><ion-icon name="wallet-outline"></ion-icon></div>
                <div class="data-box">
                  <p>Balance Neto</p>
                  <h3>{{ (totalIngresos - totalGastos) | currency:'EUR' }}</h3>
                </div>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- CONTROL MANDO COLECTIVO (NUEVO) -->
        <div class="vac-master-filter-bar mb-6 animate-fade-in">
           <div class="flex items-center gap-3">
              <ion-icon name="stats-chart-outline" class="color-primary text-xl"></ion-icon>
              <div class="vac-text-stack">
                 <span class="text-xs uppercase tracking-widest color-medium font-bold">Mando Colectivo</span>
                 <strong class="text-lg">Periodo de Análisis</strong>
              </div>
           </div>
           <ion-segment [value]="filterGlobal()" (ionChange)="applyGlobalFilter($any($event).detail.value)" mode="ios" class="vac-segment-earth mt-4">
              <ion-segment-button value="Mensual">
                <ion-label>Mensual</ion-label>
              </ion-segment-button>
              <ion-segment-button value="Anual">
                <ion-label>Anual</ion-label>
              </ion-segment-button>
           </ion-segment>
        </div>

        <!-- GRÁFICO DE ROI (Relocado) -->
        <section class="vac-main-card chart-card animate-slide-up mb-8">
          <header class="vac-card-header-flex">
            <div class="vac-card-title-group">
              <span>ESTADO DE CUENTAS</span>
              <strong>Ingresos vs Gastos</strong>
            </div>
            <!-- CONTROL INDIVIDUAL (NUEVO) -->
            <div class="flex items-center gap-2">
               <ion-segment [value]="chartPeriodo()" (ionChange)="chartPeriodo.set($any($event).detail.value)" mode="ios" class="vac-segment-mini">
                  <ion-segment-button value="Mensual">
                    <ion-label>M</ion-label>
                  </ion-segment-button>
                  <ion-segment-button value="Anual">
                    <ion-label>A</ion-label>
                  </ion-segment-button>
               </ion-segment>
               <div class="vac-mini-stat bg-primary-soft hidden-sm">
                 <ion-icon name="trending-up-outline"></ion-icon>
                 <span>ROI Dinámico</span>
               </div>
            </div>
          </header>
          <div class="chart-wrapper">
             <canvas id="financeChart"></canvas>
          </div>
        </section>

        <!-- Listado de Movimientos Recientes -->
        <h2 class="vac-section-title">Movimientos Filtrados</h2>
        <ion-grid fixed class="ion-no-padding">
          <ion-row>
            <ion-col size="12" size-sm="6" size-md="4" size-lg="3" *ngFor="let r of filteredRecords(); trackBy: trackById">
              <article class="uniform-card" [class.clickable-card]="r.bovino_id" (click)="r.bovino_id ? goToDetail(r.bovino_id) : null">
                <div class="vac-card-header-flex">
                  <div class="vac-icon-circle" [ngClass]="r.tipo === 'Ingreso' ? 'bg-forest' : 'bg-warning-soft'">
                    <ion-icon [name]="r.tipo === 'Ingreso' ? 'arrow-up-outline' : 'arrow-down-outline'" [class.color-light]="r.tipo === 'Ingreso'" [class.color-warning]="r.tipo !== 'Ingreso'"></ion-icon>
                  </div>
                  <div class="vac-card-title-group">
                    <h3 class="vac-card-title">{{ r.categoria }}</h3>
                    <p class="vac-card-subtitle">{{ r.fecha | date:'dd MMM yyyy' }}</p>
                  </div>
                  <div class="flex-1"></div>
                  <div class="ion-text-right">
                    <div class="vac-kpi-value-small" [class.color-success]="r.tipo === 'Ingreso'" [class.color-danger]="r.tipo !== 'Ingreso'">
                      {{ r.tipo === 'Ingreso' ? '+' : '-' }}{{ r.monto | number:'1.0-0' }}€
                    </div>
                  </div>
                </div>

                <div class="vac-card-footer mt-4 pt-2 border-t-light flex justify-end gap-2">
                  <button class="vac-btn-icon bg-light" (click)="openEditModal(r)" aria-label="Editar">
                    <ion-icon name="create-outline"></ion-icon>
                  </button>
                  <button class="vac-btn-icon bg-light color-danger" (click)="confirmDelete(r)" aria-label="Eliminar">
                    <ion-icon name="trash-outline"></ion-icon>
                  </button>
                </div>
              </article>
            </ion-col>
          </ion-row>
        </ion-grid>
        
        <div *ngIf="filteredRecords().length === 0" class="vac-empty-state">
           <div class="empty-icon-ring">
              <ion-icon name="cash-outline"></ion-icon>
           </div>
           <h2>Cero Movimientos</h2>
           <p>No se encontraron registros para los filtros aplicados.</p>
        </div>

      </main>

      <!-- POPOVER DE FILTROS (RUSTIC-LUXE) -->
      <ion-popover [isOpen]="isFilterPopoverOpen" [event]="filterEvent" (didDismiss)="isFilterPopoverOpen = false" class="vac-popover">
        <ng-template>
          <div class="vac-filter-panel ion-padding">
            <div class="vac-filter-header mb-4">
              <ion-icon name="filter-outline" class="color-primary align-middle"></ion-icon>
              <span class="ml-2 font-bold color-primary">Filtrar Finanzas</span>
            </div>

            <div class="filter-section mb-6">
              <ion-label class="vac-filter-label">Naturaleza</ion-label>
              <ion-segment [value]="filterTipo()" (ionChange)="filterTipo.set($any($event).detail.value)" mode="ios" class="vac-segment-earth">
                <ion-segment-button value="Todos">
                  <ion-label>Todos</ion-label>
                </ion-segment-button>
                <ion-segment-button value="Ingreso">
                  <ion-label>Ingresos</ion-label>
                </ion-segment-button>
                <ion-segment-button value="Gasto">
                  <ion-label>Gastos</ion-label>
                </ion-segment-button>
              </ion-segment>
            </div>

            <div class="filter-section mb-6">
              <ion-label class="vac-filter-label">Categoría Específica</ion-label>
              <ion-item lines="none" class="vac-input-select-mini">
                <ion-select [value]="filterCategoria()" (ionChange)="filterCategoria.set($event.detail.value)" interface="popover">
                  <ion-select-option value="Todos">Todas las categorías</ion-select-option>
                  <ion-select-option *ngFor="let c of todasLasCategorias" [value]="c">{{ c }}</ion-select-option>
                </ion-select>
              </ion-item>
            </div>

            <div class="vac-filter-footer pt-2 border-top-soft">
               <ion-button expand="block" fill="clear" color="danger" (click)="clearFilters()">
                 Limpiar Filtros
               </ion-button>
            </div>
          </div>
        </ng-template>
      </ion-popover>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="openAddModal()" color="primary" aria-label="Añadir movimiento">
          <ion-icon name="add-circle"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- MODAL DE MOVIMIENTO FINANCIERO -->
      <ion-modal [isOpen]="isModalOpen" (didDismiss)="closeModal()" class="vac-modal">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar color="primary">
              <ion-title>{{ editingItem ? 'Actualizar Registro' : 'Añadir Movimiento' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeModal()" aria-label="Cerrar modal">
                  <ion-icon name="close-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>

          <ion-content class="ion-padding vac-modal-content">
            <div class="form-intro ion-text-center ion-padding-bottom">
               <div class="vac-icon-ring mb-4 mx-auto">
                  <ion-icon name="wallet-outline"></ion-icon>
               </div>
               <h3>Registro Contable</h3>
               <p class="color-medium">Anota cualquier venta, compra o gasto asociado a tu actividad ganadera.</p>
            </div>

            <form [formGroup]="finanzasForm">
              <ion-item class="vac-input">
                <ion-label position="stacked">Naturaleza de Movimiento *</ion-label>
                <ion-select formControlName="tipo" interface="popover" (ionChange)="onTipoChange()">
                  <ion-select-option value="Ingreso">Entrada (Ventas, Ayudas)</ion-select-option>
                  <ion-select-option value="Gasto">Salida (Compras, Salarios)</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item class="vac-input">
                <ion-label position="stacked">Categoría Principal *</ion-label>
                <ion-select formControlName="categoria" interface="popover">
                   <ion-select-option *ngFor="let cat of categoriasDisponibles" [value]="cat">
                     {{ cat }}
                   </ion-select-option>
                </ion-select>
              </ion-item>

              <div class="vac-item-group">
                <ion-item class="vac-input half">
                  <ion-label position="stacked">Fecha *</ion-label>
                  <ion-input type="date" formControlName="fecha"></ion-input>
                </ion-item>
                <ion-item class="vac-input half">
                  <ion-label position="stacked">Monto (€) *</ion-label>
                  <ion-input type="number" formControlName="monto" placeholder="0.00"></ion-input>
                </ion-item>
              </div>

              <div class="vac-modal-footer">
                <ion-button expand="block" (click)="saveData()" [disabled]="finanzasForm.invalid" class="btn-vac-save">
                  Guardar
                </ion-button>
              </div>
            </form>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `
})
export class FinanzasComponent {
  public finanzasService = inject(FinanzasService);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private pdfService = inject(PdfService);
  private router = inject(Router);
  
  isModalOpen = false;
  editingItem: Finanzas | null = null;
  finanzasForm: FormGroup;
  chart: any = null; // Instancia de Chart.js

  get totalIngresos() {
    return this.finanzasService.records().filter(r => r.tipo === 'Ingreso').reduce((acc, r) => acc + (r.monto || 0), 0);
  }

  get totalGastos() {
    return this.finanzasService.records().filter(r => r.tipo === 'Gasto').reduce((acc, r) => acc + (r.monto || 0), 0);
  }

  // Filtros Avanzados
  filterTipo = signal<string>('Todos');
  filterCategoria = signal<string>('Todos');
  isFilterPopoverOpen = false;
  filterEvent: Event | null = null;

  todasLasCategorias = [
    'Venta Leche', 'Venta Carne', 'Venta Genética', 'Ayudas Gubernamentales', 'Otros Ingresos',
    'Alimentación y Pastos', 'Veterinaria y Semen', 'Mantenimiento y Equipos', 'Sueldos', 'Otros Gastos'
  ];

  filteredRecords = computed(() => {
    const tipo = this.filterTipo();
    const cat = this.filterCategoria();
    let list = this.finanzasService.records();

    if (tipo !== 'Todos') {
      list = list.filter(r => r.tipo === tipo);
    }
    if (cat !== 'Todos') {
      list = list.filter(r => r.categoria === cat);
    }

    return list.slice(0, 50); // Mostrar top 50 filtrados
  });

  categoriasIngreso = ['Venta Leche', 'Venta Carne', 'Venta Genética', 'Ayudas Gubernamentales', 'Otros Ingresos'];
  categoriasGasto = ['Alimentación y Pastos', 'Veterinaria y Semen', 'Mantenimiento y Equipos', 'Sueldos', 'Otros Gastos'];
  categoriasDisponibles: string[] = [];
  
  chartPeriodo = signal<'Mensual' | 'Anual'>('Mensual');
  filterGlobal = signal<'Mensual' | 'Anual'>('Mensual');

  goToDetail(id: string) {
    if (id) {
      this.router.navigate(['/animal-detail', id]);
    }
  }

  trackById(index: number, item: Finanzas | any): string {
    return item.id || index.toString();
  }

  constructor() {
    addIcons({ addCircle, closeOutline, saveOutline, createOutline, trashOutline, walletOutline, trendingUpOutline, trendingDownOutline, cashOutline, arrowDownOutline, arrowUpOutline, documentTextOutline, filterOutline, statsChartOutline });
    Chart.register(...registerables);
    this.finanzasForm = this.fb.group({
      tipo: ['Gasto', Validators.required],
      categoria: ['Alimentación y Pastos', Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01)]],
      fecha: [new Date().toISOString().split('T')[0], Validators.required]
    });
    this.categoriasDisponibles = [...this.categoriasGasto];

    // Efecto reactivo para dibujar el gráfico cuando cambia el periodo o los datos
    effect(() => {
      const data = this.finanzasService.getDatosFinancierosPorPeriodo(this.chartPeriodo());
      setTimeout(() => this.renderChart(data), 50); // Pequeño delay para asegurar que el canvas está en el DOM
    });
  }

  /**
   * @description Renderiza el gráfico financiero principal con estética de app de trading.
   * Utiliza gráficos de líneas suaves con relleno de gradiente, crosshair interactivo,
   * tooltips profesionales y marcadores animados estilo Bitget/TradingView.
   * @param data Array de datos financieros agrupados por periodo con {label, ingresos, gastos}.
   */
  renderChart(data: any[]) {
    if (this.chart) { this.chart.destroy(); }
    const labels = data.map(d => d.label);

    const canvas = document.getElementById('financeChart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Gradientes de relleno (Modo Día — Rustic-Luxe) ──
    const gradientIngresos = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight || 320);
    gradientIngresos.addColorStop(0, 'rgba(27, 67, 50, 0.18)');
    gradientIngresos.addColorStop(0.5, 'rgba(27, 67, 50, 0.05)');
    gradientIngresos.addColorStop(1, 'rgba(27, 67, 50, 0)');

    const gradientGastos = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight || 320);
    gradientGastos.addColorStop(0, 'rgba(188, 71, 73, 0.15)');
    gradientGastos.addColorStop(0.5, 'rgba(188, 71, 73, 0.04)');
    gradientGastos.addColorStop(1, 'rgba(188, 71, 73, 0)');

    // ── Plugin de crosshair vertical (estilo plataforma trading) ──
    const crosshairPlugin = {
      id: 'crosshairLine',
      afterDraw: (chart: any) => {
        if (chart.tooltip?._active?.length) {
          const activePoint = chart.tooltip._active[0];
          const chartCtx = chart.ctx;
          const x = activePoint.element.x;
          const topY = chart.scales.y.top;
          const bottomY = chart.scales.y.bottom;

          chartCtx.save();
          chartCtx.beginPath();
          chartCtx.setLineDash([3, 4]);
          chartCtx.moveTo(x, topY);
          chartCtx.lineTo(x, bottomY);
          chartCtx.lineWidth = 1;
          chartCtx.strokeStyle = 'rgba(27, 67, 50, 0.12)';
          chartCtx.stroke();
          chartCtx.restore();
        }
      }
    };

    this.chart = new Chart(ctx, {
      type: 'line',
      plugins: [crosshairPlugin],
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Ingresos',
            data: data.map(d => d.ingresos),
            borderColor: '#1B4332',
            borderWidth: 2.5,
            backgroundColor: gradientIngresos,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: '#1B4332',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 3
          },
          {
            label: 'Gastos',
            data: data.map(d => d.gastos),
            borderColor: '#BC4749',
            borderWidth: 2.5,
            backgroundColor: gradientGastos,
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
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20,
              color: '#582f0e',
              font: { family: "'Outfit', sans-serif", size: 11, weight: 600 }
            }
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(253, 251, 247, 0.97)',
            titleFont: { family: "'Outfit', sans-serif", size: 12, weight: 600 },
            bodyFont: { family: "'Outfit', sans-serif", size: 13, weight: 500 },
            titleColor: '#92949c',
            bodyColor: '#1A211E',
            borderColor: 'rgba(166, 124, 82, 0.2)',
            borderWidth: 1,
            padding: { top: 12, bottom: 12, left: 16, right: 16 },
            cornerRadius: 12,
            displayColors: true,
            boxWidth: 8,
            boxHeight: 8,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              title: (items) => items[0]?.label || '',
              label: (ctx) => {
                const value = ctx.parsed.y?.toLocaleString('es-ES') || '0';
                const prefix = ctx.dataset.label === 'Ingresos' ? '+' : '-';
                return ` ${ctx.dataset.label}:  ${prefix}${value} €`;
              },
              afterBody: (items) => {
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
            ticks: {
              color: '#582f0e',
              font: { family: "'Outfit', sans-serif", size: 10, weight: 600 },
              padding: 8,
              maxRotation: 0
            }
          },
          y: {
            position: 'right',
            grid: {
              color: 'rgba(0, 0, 0, 0.04)',
              lineWidth: 1
            },
            border: { display: false },
            ticks: {
              color: '#582f0e',
              font: { family: "'Outfit', sans-serif", size: 10, weight: 600 },
              padding: 12,
              callback: (value: any) => {
                if (value >= 1000) return (value / 1000).toFixed(1) + 'k €';
                return value + ' €';
              }
            }
          }
        }
      }
    });
  }

  async exportarPDF() {
    const records = this.finanzasService.records();
    const headers = [['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto']];
    const body = records.map(r => [
      r.fecha ? new Date(r.fecha).toLocaleDateString() : 'N/A',
      r.tipo || '-',
      r.categoria || '-',
      r.descripcion || '-',
      (r.tipo === 'Ingreso' ? '+' : '-') + (r.monto || 0).toLocaleString() + '€'
    ]);

    const doc = await this.pdfService.getNewDoc();
    await this.pdfService.addTableToDoc(
      doc,
      'Balance Financiero - Vacapp ERP',
      headers,
      body,
      {
        startY: 25,
        columnStyles: {
          4: { halign: 'right', fontStyle: 'bold' }
        }
      }
    );

    // Agregar resumen al final
    const finalY = this.pdfService.getLastY(doc) + 10;
    const totalIngresos = records.filter(r => r.tipo === 'Ingreso').reduce((acc, r) => acc + (r.monto || 0), 0);
    const totalGastos = records.filter(r => r.tipo === 'Gasto').reduce((acc, r) => acc + (r.monto || 0), 0);
    const balance = totalIngresos - totalGastos;
    const now = new Date();
    
    doc.setFontSize(12);
    // Verde (#2B5329) si es positivo, Rojo (#BC4749) si es negativo
    doc.setTextColor(balance >= 0 ? 43 : 188, balance >= 0 ? 83 : 71, balance >= 0 ? 41 : 73); 
    doc.text(`Balance Neto: ${balance.toLocaleString()}€`, 14, finalY + 16);

    doc.save(`balance_financiero_vacapp_${now.getTime()}.pdf`);
  }

  onTipoChange() {
    const tipo = this.finanzasForm.get('tipo')?.value;
    if (tipo === 'Ingreso') {
      this.categoriasDisponibles = [...this.categoriasIngreso];
      this.finanzasForm.patchValue({ categoria: this.categoriasIngreso[0] });
    } else {
      this.categoriasDisponibles = [...this.categoriasGasto];
      this.finanzasForm.patchValue({ categoria: this.categoriasGasto[0] });
    }
  }

  openAddModal() {
    this.editingItem = null;
    this.finanzasForm.reset({
      tipo: 'Gasto',
      categoria: 'Alimentación y Pastos',
      fecha: new Date().toISOString().split('T')[0]
    });
    this.categoriasDisponibles = [...this.categoriasGasto];
    this.isModalOpen = true;
  }

  openEditModal(item: Finanzas) {
    this.editingItem = item;
    const { id, finca_id, created_at, ...data } = item;
    
    // Set categorias primero
    if (data.tipo === 'Ingreso') {
        this.categoriasDisponibles = [...this.categoriasIngreso];
    } else {
        this.categoriasDisponibles = [...this.categoriasGasto];
    }
    
    // Si la categoria no existe en las listas base, añadirla temporalmente
    if (!this.categoriasDisponibles.includes(data.categoria)) {
        this.categoriasDisponibles.push(data.categoria);
    }
    
    this.finanzasForm.patchValue(data);
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async saveData() {
    if (this.finanzasForm.invalid) return;

    try {
      const payload = this.finanzasForm.value;
      const res = this.editingItem?.id 
        ? await this.finanzasService.updateFinanza(this.editingItem.id, payload)
        : await this.finanzasService.createFinanza(payload);

      if (res.error) {
        this.presentToast('Error al guardar: ' + res.error, 'danger');
      } else {
        this.presentToast(this.editingItem ? 'Movimiento actualizado' : 'Movimiento registrado');
        this.isModalOpen = false;
      }
    } catch (e) {
      this.presentToast('Error de comunicación', 'danger');
    }
  }

  async confirmDelete(item: Finanzas) {
    const alert = await this.alertCtrl.create({
      header: 'Purgar Registro',
      message: '¿Confirma que desea eliminar este movimiento económico de forma irreversible?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Eliminar', 
          role: 'destructive',
          handler: async () => {
            const res = await this.finanzasService.deleteFinanza(item.id);
            if (res.error) {
               this.presentToast('Error al eliminar: ' + res.error, 'danger');
            } else {
               this.presentToast('Registro eliminado con éxito', 'warning');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      mode: 'ios'
    });
    toast.present();
  }

  // --- LÓGICA DE FILTROS ---
  applyGlobalFilter(periodo: 'Mensual' | 'Anual') {
    this.filterGlobal.set(periodo);
    this.chartPeriodo.set(periodo);
    // Aquí se podrían sincronizar otros gráficos si los hubiera en esta vista
  }

  // --- LÓGICA DE FILTROS ---
  presentFilter(event: Event) {
    this.filterEvent = event;
    this.isFilterPopoverOpen = true;
  }

  clearFilters() {
    this.filterTipo.set('Todos');
    this.filterCategoria.set('Todos');
    this.isFilterPopoverOpen = false;
  }
}
