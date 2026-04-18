import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, 
  IonIcon, IonButton, IonGrid, IonRow, IonCol, IonItem, 
  IonBadge, IonFab, IonFabButton, IonModal, IonInput, 
  IonSelect, IonSelectOption, IonLabel
} from '@ionic/angular/standalone';
import { 
  AlertController, 
  ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { PdfService } from '../../core/services/pdf.service';
import { 
  speedometerOutline, trendingDownOutline, personOutline, searchOutline, maleOutline, 
  femaleOutline, chevronForwardOutline, trashOutline, addCircle, closeOutline, scaleOutline, 
  barChartOutline, fitnessOutline, saveOutline, createOutline, trendingUpOutline, calendarOutline, leafOutline, pawOutline, filterOutline, documentTextOutline 
} from 'ionicons/icons';

import { SupabaseService } from '../../core/services/supabase.service';
import { GanadoService } from '../../core/services/ganado.service';
import { PesajeService } from '../../core/services/pesaje.service';
import { Bovino } from '../../core/models/vacapp.models';

import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

/**
 * Componente para el Módulo de Recría y Control de Pesaje - Versión Estándar.
 * Refactorizado: 100% Sincronización de colores y nombres vac-.
 */
@Component({
  selector: 'app-recria',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, BaseChartDirective,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, 
    IonIcon, IonButton, IonGrid, IonRow, IonCol, IonItem, 
    IonBadge, IonFab, IonFabButton, IonModal, IonInput, 
    IonSelect, IonSelectOption, IonLabel
  ],
  template: `
    <ion-header class="ion-no-border vac-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button class="color-forest"></ion-menu-button>
        </ion-buttons>
        <ion-title>Recría & Rendimiento</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="exportarPDF()" color="primary">
            <ion-icon name="document-text-outline"></ion-icon>
          </ion-button>
          <ion-button fill="clear" class="color-forest">
            <ion-icon name="filter-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-vertical">
      <div class="vac-container animate-fade-in">
        
        <!-- Cabecera de Selección -->
        <div *ngIf="selectedBovino" class="flex items-center justify-between mb-8 animate-fade-in">
          <div class="vac-text-stack">
            <h1 class="vac-page-title">{{ selectedBovino.nombre }}</h1>
            <p class="vac-page-subtitle">Seguimiento de maduración y conversión</p>
          </div>
          <ion-button fill="outline" (click)="selectedBovino = null" color="dark" class="btn-vac-outline">
             <ion-icon name="close" slot="start"></ion-icon> Cambiar
          </ion-button>
        </div>

        <!-- LISTADO DE ANIMALES PARA SELECCIÓN -->
        <div *ngIf="!selectedBovino" class="animate-fade-in">
           <div class="vac-text-stack mb-6">
             <h1 class="vac-page-title">Seleccionar Animal</h1>
             <p class="vac-page-subtitle">Busca el ejemplar para registrar su pesaje</p>
           </div>

           <div class="vac-search-wrapper mb-8">
              <ion-icon name="search" class="vac-search-icon"></ion-icon>
              <input 
                type="text" 
                placeholder="Buscar por crotal o nombre..." 
                class="vac-search-input-field"
                [(ngModel)]="searchTerm">
           </div>

           <!-- LISTA ESTANDARIZADA -->
           <ion-grid class="ion-no-padding">
             <ion-row>
               <ion-col size="12" size-md="6" size-xl="4" *ngFor="let b of filteredBovinos()">
                 <div class="uniform-card" (click)="selectBovino(b)">
                   <div class="vac-card-header-flex">
                     <div class="vac-avatar-wrapper">
                       <div *ngIf="b.foto_url" class="vac-avatar" [style.background-image]="'url(' + b.foto_url + ')'"></div>
                       <div *ngIf="!b.foto_url" class="vac-avatar-placeholder">
                         <ion-icon [name]="b.sexo === 'Macho' ? 'male-outline' : 'female-outline'"></ion-icon>
                       </div>
                     </div>
                     <div class="vac-card-title-group">
                       <h3>{{ b.nombre }}</h3>
                       <p>{{ b.crotal }} • {{ b.raza || 'Mestizo' }}</p>
                     </div>
                     <div class="vac-badge-status-simple">
                        <ion-icon name="chevron-forward-outline"></ion-icon>
                     </div>
                   </div>
                   <div class="vac-card-footer mt-6 pt-4 border-t-light flex items-center justify-between">
                     <span class="vac-tag-mini">{{ ganadoService.calculateCategoria(b) }}</span>
                     <span class="vac-info-label ml-auto">Consultar Ficha</span>
                   </div>
                 </div>
               </ion-col>
             </ion-row>
           </ion-grid>
        </div>

        <!-- VISTA DETALLE DEL ANIMAL SELECCIONADO -->
        <div *ngIf="selectedBovino" class="animate-fade-in">
           
           <!-- MÉTRICAS CLAVE -->
           <ion-grid class="ion-no-padding mb-8">
              <ion-row>
                 <ion-col size="12" size-md="6">
                    <div class="vac-metric-card">
                       <div class="vac-metric-icon bg-wheat">
                          <ion-icon name="scale-outline" class="color-earth"></ion-icon>
                       </div>
                       <div class="vac-metric-info">
                          <span class="label">Último Peso</span>
                          <span class="value">{{ getUltimoPeso() }} <small>KG</small></span>
                       </div>
                    </div>
                 </ion-col>
                 <ion-col size="12" size-md="6">
                    <div class="vac-metric-card">
                       <div class="vac-metric-icon bg-forest-light">
                          <ion-icon name="trending-up-outline" class="color-forest"></ion-icon>
                       </div>
                       <div class="vac-metric-info">
                          <span class="label">Ganancia Diaria (GMD)</span>
                          <span class="value" [ngClass]="getGMD() >= 0 ? 'color-forest' : 'color-danger'">
                             {{ getGMD() > 0 ? '+' : '' }}{{ getGMD() | number:'1.2-2' }} <small>kg/día</small>
                          </span>
                       </div>
                    </div>
                 </ion-col>
              </ion-row>
           </ion-grid>

           <!-- GRÁFICO INDIVIDUAL -->
           <div class="vac-main-card mb-8">
              <div class="vac-card-header-flex">
                 <div class="vac-card-title-group">
                    <h3 class="vac-card-title">Curva de Crecimiento</h3>
                    <p class="vac-card-subtitle">Evolución del peso en el tiempo</p>
                 </div>
                 <div class="vac-icon-circle bg-wheat">
                    <ion-icon name="bar-chart-outline" class="color-earth"></ion-icon>
                 </div>
              </div>
              <div class="vac-chart-container mt-6">
                 <canvas baseChart [data]="chartDataIndividual" [options]="chartOptions" [type]="'line'"></canvas>
              </div>
           </div>

           <!-- HISTORIAL -->
           <div class="flex items-center justify-between mb-6">
             <h2 class="vac-section-title ion-no-margin">Historial de Pesadas</h2>
             <span class="vac-badge-count">{{ pesajesFiltrados.length }} Registros</span>
           </div>
           
           <ion-grid class="ion-no-padding">
             <ion-row>
               <ion-col size="12" size-md="6" size-xl="4" *ngFor="let p of pesajesFiltrados">
                 <div class="uniform-card">
                   <div class="vac-card-header-flex">
                     <div class="vac-icon-avatar bg-light">
                        <ion-icon name="calendar-outline" class="color-medium"></ion-icon>
                     </div>
                     <div class="vac-card-title-group">
                       <h3 class="vac-card-title-lg">{{ p.peso_kg }} KG</h3>
                       <p>{{ p.tipo_pesaje }}</p>
                     </div>
                     <button class="vac-btn-icon color-danger ml-auto" (click)="deletePesaje(p.id)">
                        <ion-icon name="trash-outline"></ion-icon>
                     </button>
                   </div>
                   <div class="vac-card-footer mt-6 pt-4 border-t-light flex items-center justify-between">
                     <span class="vac-date-label">
                       <ion-icon name="time-outline" class="mr-1"></ion-icon>
                       {{ p.fecha_pesaje | date:'dd MMM yyyy' }}
                     </span>
                     <ion-badge slot="end" class="vac-badge-success ml-auto">Completado</ion-badge>
                   </div>
                 </div>
               </ion-col>
             </ion-row>
           </ion-grid>

           <div *ngIf="pesajesFiltrados.length === 0" class="vac-empty-state">
             <div class="vac-empty-icon">
               <ion-icon name="scale-outline"></ion-icon>
             </div>
             <h2>Sin pesajes registrados</h2>
             <p>Comienza capturando el primer peso para ver el rendimiento.</p>
           </div>
        </div>

      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="animate-jump-in">
        <ion-fab-button (click)="setOpen(true)" class="vac-fab">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
         <!-- MODAL DE PESAJE -->
      <ion-modal [isOpen]="isModalOpen" (didDismiss)="setOpen(false)" class="vac-modal">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar>
              <ion-title>Registrar Pesaje</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="setOpen(false)" class="color-medium">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>

           <ion-content class="ion-padding vac-modal-content">
            <div class="vac-modal-header ion-text-center ion-padding-vertical">
               <div class="vac-icon-ring ion-margin-bottom">
                  <ion-icon name="scale-outline"></ion-icon>
               </div>
               <h3 class="vac-modal-title">Entrada de Datos</h3>
               <p class="vac-modal-subtitle">Registra el peso actual detectado en báscula.</p>
            </div>

            <form [formGroup]="pesajeForm" (ngSubmit)="onSubmit()">
              <ion-item class="vac-input">
                <ion-label position="stacked">Animal</ion-label>
                <div class="vac-readonly-input mt-2">
                   {{ selectedBovino?.nombre }} ({{ selectedBovino?.crotal }})
                </div>
              </ion-item>

              <ion-row>
                <ion-col size="6">
                  <ion-item class="vac-input">
                    <ion-label position="stacked">Fecha del Pesaje</ion-label>
                    <ion-input type="date" formControlName="fecha_pesaje"></ion-input>
                  </ion-item>
                </ion-col>
                <ion-col size="6">
                  <ion-item class="vac-input">
                    <ion-label position="stacked">KG *</ion-label>
                    <ion-input type="number" formControlName="peso_kg" placeholder="0.00"></ion-input>
                  </ion-item>
                </ion-col>
              </ion-row>

              <ion-item class="vac-input">
                <ion-label position="stacked">Tipo de Control</ion-label>
                <ion-select formControlName="tipo_pesaje" interface="popover" placeholder="Seleccionar...">
                  <ion-select-option *ngFor="let t of ganadoService.constants.TIPOS_PESAJE" [value]="t">
                    {{ t }}
                  </ion-select-option>
                </ion-select>
              </ion-item>

              <div class="mt-8 pt-6 border-t border-gray-100">
                <ion-button type="submit" expand="block" [disabled]="pesajeForm.invalid" class="btn-vac-save">
                  <ion-icon name="save-outline" slot="start"></ion-icon>
                  Guardar Pesaje
                </ion-button>
              </div>
            </form>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-fab>
    </ion-content>
  `
})
export class RecriaComponent implements OnInit {
  private supa = inject(SupabaseService);
  public ganadoService = inject(GanadoService);
  private pesajeService = inject(PesajeService);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private pdfService = inject(PdfService);

  selectedBovino: Bovino | null = null;
  searchTerm: string = '';
  
  pesajesFiltrados: any[] = [];
  loading = false;
  isModalOpen = false;
  pesajeForm: FormGroup;

  // Datos para el gráfico individual
  chartDataIndividual: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, title: { display: true, text: 'KG' } },
      x: { grid: { display: false } }
    }
  };

  constructor() {
    addIcons({ 
      fitnessOutline, scaleOutline, addCircle, closeOutline, saveOutline, createOutline, trashOutline, 
      trendingUpOutline, trendingDownOutline, calendarOutline, barChartOutline, 
      leafOutline, pawOutline, speedometerOutline, personOutline, searchOutline, maleOutline, femaleOutline, chevronForwardOutline, filterOutline, documentTextOutline 
    });
    this.pesajeForm = this.fb.group({
      bovino_id: ['', Validators.required],
      peso_kg: ['', [Validators.required, Validators.min(1)]],
      fecha_pesaje: [new Date().toISOString().split('T')[0], Validators.required],
      tipo_pesaje: ['Recría', Validators.required],
      notas: ['']
    });
  }

  async ngOnInit() {
    // No necesitamos cargar nada aquí ya que GanadoService ya tiene los bovinos
  }

  async exportarPDF() {
    this.showToast('Generando Reporte de Rendimiento...', 'primary');
    
    if (this.selectedBovino) {
      // REPORTE INDIVIDUAL
      const headers = [['Fecha', 'Peso', 'Tipo Control', 'Notas']];
      const body = this.pesajesFiltrados.map(p => [
        p.fecha_pesaje ? new Date(p.fecha_pesaje).toLocaleDateString() : 'N/A',
        (p.peso_kg || 0) + ' KG',
        p.tipo_pesaje || '-',
        p.notes || '-'
      ]);

      await this.pdfService.generateTablePDF(
        `Historia de Pesaje: ${this.selectedBovino.nombre}`,
        headers,
        body,
        `rendimiento_${this.selectedBovino.crotal}`,
        {
          didDrawPage: (data: any) => {
            // Aquí podríamos agregar una cabecera personalizada si fuera necesario
          }
        }
      );
    } else {
      // REPORTE GENERAL DE HATO (RESUMEN DE RECRÍA)
      const headers = [['Crotal', 'Nombre', 'Último Peso', 'Ganancia Reciente']];
      const body = this.ganadoService.bovinosAlta().map(b => {
        const hist = this.pesajeService.records().filter(p => p.bovino_id === b.id)
          .sort((x, y) => new Date(y.fecha_pesaje).getTime() - new Date(x.fecha_pesaje).getTime());
        return [
          b.crotal || '-',
          b.nombre || '-',
          hist[0]?.peso_kg ? hist[0].peso_kg + ' KG' : 'N/R',
          (hist[0]?.peso_kg && hist[1]?.peso_kg) ? (hist[0].peso_kg - hist[1].peso_kg).toFixed(1) + ' KG' : '-'
        ];
      });

      await this.pdfService.generateTablePDF(
        'Censo de Rendimiento y Pesaje - Vacapp',
        headers,
        body,
        'censo_rendimiento_vacapp'
      );
    }
  }

  filteredBovinos() {
    const term = this.searchTerm.toLowerCase();
    return this.ganadoService.bovinosAlta().filter(b => 
      b.nombre?.toLowerCase().includes(term) || 
      b.crotal?.toLowerCase().includes(term)
    );
  }

  selectBovino(b: Bovino) {
    this.selectedBovino = b;
    this.updateIndividualHistory();
  }

  updateIndividualHistory() {
    if (!this.selectedBovino) return;
    
    // Filtrar pesajes para este animal
    const hist = this.pesajeService.records().filter(p => p.bovino_id === this.selectedBovino?.id)
      .sort((a, b) => new Date(b.fecha_pesaje).getTime() - new Date(a.fecha_pesaje).getTime());
    
    this.pesajesFiltrados = hist;

    // Actualizar Gráfico
    const plotData = [...hist].sort((a, b) => new Date(a.fecha_pesaje).getTime() - new Date(b.fecha_pesaje).getTime());
    this.chartDataIndividual = {
      labels: plotData.map(p => new Date(p.fecha_pesaje).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })),
      datasets: [{
        label: 'Peso (KG)',
        data: plotData.map(p => p.peso_kg),
        borderColor: '#bc6c25',
        backgroundColor: 'rgba(188, 108, 37, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };
  }

  getUltimoPeso(): string {
    return this.pesajesFiltrados[0]?.peso_kg || '0';
  }

  getGMD(): number {
    if (this.pesajesFiltrados.length < 2) return 0;
    const last = this.pesajesFiltrados[0];
    const prev = this.pesajesFiltrados[1];
    
    const d1 = new Date(last.fecha_pesaje);
    const d2 = new Date(prev.fecha_pesaje);
    const diffDays = (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays <= 0) return 0;
    return (last.peso_kg - prev.peso_kg) / diffDays;
  }

  processPesajes(data: any[]) {
    const sorted = [...data].sort((a, b) => 
      new Date(a.fecha_pesaje).getTime() - new Date(b.fecha_pesaje).getTime()
    );

    const lastWeightMap = new Map<string, number>();
    const withGains = sorted.map(p => {
      const previousWeight = lastWeightMap.get(p.bovino_id);
      const gain = previousWeight !== undefined ? p.peso_kg - previousWeight : null;
      lastWeightMap.set(p.bovino_id, p.peso_kg);
      return { ...p, gain };
    });

    return withGains.sort((a, b) => 
      new Date(b.fecha_pesaje).getTime() - new Date(a.fecha_pesaje).getTime()
    );
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    if (isOpen && this.selectedBovino) {
      this.pesajeForm.patchValue({
        bovino_id: this.selectedBovino.id,
        fecha_pesaje: new Date().toISOString().split('T')[0],
        tipo_pesaje: 'Recría'
      });
    }
  }

  async onSubmit() {
    if (this.pesajeForm.invalid) return;

    try {
      const pesajeData = this.pesajeForm.value;
      const { error } = await this.supa.createPesaje(pesajeData);
      
      if (error) {
        this.showToast('Error al guardar: ' + error, 'danger');
      } else {
        this.showToast('Peso registrado correctamente');
        this.setOpen(false);
        await this.pesajeService.loadPesajes();
        this.updateIndividualHistory();
      }
    } catch (e) {
      this.showToast('Error técnico al procesar el pesaje', 'danger');
    }
  }

  async deletePesaje(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas borrar este pesaje?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            const { error } = await this.supa.delete('pesajes_individuales', id);
            if (error) {
              this.showToast('Error al eliminar', 'danger');
            } else {
              this.showToast('Pesaje eliminado');
              await this.pesajeService.loadPesajes();
              this.updateIndividualHistory();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      mode: 'ios'
    });
    await toast.present();
  }
}
