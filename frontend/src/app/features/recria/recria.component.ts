import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, 
  IonIcon, IonButton, IonGrid, IonRow, IonCol, IonCard, IonItem, 
  IonAvatar, IonBadge, IonFab, IonFabButton, IonModal, IonInput, 
  IonSelect, IonSelectOption, IonLabel, IonCardContent
} from '@ionic/angular/standalone';
import { 
  AlertController, 
  ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  speedometerOutline, trendingDownOutline, personOutline, searchOutline, maleOutline, 
  femaleOutline, chevronForwardOutline, trashOutline, addCircle, closeOutline, scaleOutline, 
  barChartOutline, fitnessOutline, saveOutline, createOutline, trendingUpOutline, calendarOutline, leafOutline, pawOutline, filterOutline 
} from 'ionicons/icons';

import { SupabaseService } from '../../core/services/supabase.service';
import { GanadoService } from '../../core/services/ganado.service';
import { PesajeService } from '../../core/services/pesaje.service';
import { Bovino } from '../../core/models/vacapp.models';

import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

/**
 * Componente para el Módulo de Recría y Control de Pesaje - Versión Rústica.
 * Refactorizado: 100% Sincronización de colores con _variables.scss.
 */
@Component({
  selector: 'app-recria',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, BaseChartDirective,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, 
    IonIcon, IonButton, IonGrid, IonRow, IonCol, IonCard, IonItem, 
    IonAvatar, IonBadge, IonFab, IonFabButton, IonModal, IonInput, 
    IonSelect, IonSelectOption, IonLabel, IonCardContent
  ],
  template: `
    <ion-header class="ion-no-border header-luxe">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button class="color-forest"></ion-menu-button>
        </ion-buttons>
        <ion-title>Recría & Rendimiento</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" class="color-forest">
            <ion-icon name="filter-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-vertical">
      <div class="luxe-container animate-fade-in">
        
        <!-- Cabecera de Selección -->
        <div *ngIf="selectedBovino" class="flex items-center justify-between mb-8 animate-fade-in">
          <div class="luxe-text-stack">
            <h1 class="page-h1-rustic">{{ selectedBovino.nombre }}</h1>
            <p class="page-p-rustic">Seguimiento de maduración y conversión</p>
          </div>
          <ion-button fill="outline" (click)="selectedBovino = null" color="dark" class="btn-luxe-outline">
             <ion-icon name="close" slot="start"></ion-icon> Cambiar
          </ion-button>
        </div>

        <!-- LISTADO DE ANIMALES PARA SELECCIÓN -->
        <div *ngIf="!selectedBovino" class="animate-fade-in">
           <div class="luxe-text-stack mb-6">
             <h1 class="page-h1-rustic">Seleccionar Animal</h1>
             <p class="page-p-rustic">Busca el ejemplar para registrar su pesaje</p>
           </div>

           <div class="rustic-search-wrapper mb-8">
              <ion-icon name="search" class="rustic-search-icon"></ion-icon>
              <input 
                type="text" 
                placeholder="Buscar por crotal o nombre..." 
                class="rustic-search-input-field"
                [(ngModel)]="searchTerm">
           </div>

           <!-- LISTA ESTANDARIZADA -->
           <ion-grid class="ion-no-padding">
             <ion-row>
               <ion-col size="12" size-md="6" size-xl="4" *ngFor="let b of filteredBovinos()">
                 <div class="tag-body-luxe mb-4" (click)="selectBovino(b)" style="cursor: pointer;">
                   <div class="luxe-item-header">
                     <div class="luxe-avatar-wrapper">
                       <div *ngIf="b.foto_url" class="luxe-avatar" [style.background-image]="'url(' + b.foto_url + ')'"></div>
                       <div *ngIf="!b.foto_url" class="luxe-avatar-placeholder">
                         <ion-icon [name]="b.sexo === 'Macho' ? 'male-outline' : 'female-outline'"></ion-icon>
                       </div>
                     </div>
                     <div class="luxe-title-stack">
                       <h3>{{ b.nombre }}</h3>
                       <p>{{ b.crotal }} • {{ b.raza || 'Mestizo' }}</p>
                     </div>
                     <div class="luxe-badge-status-simple">
                        <ion-icon name="chevron-forward-outline"></ion-icon>
                     </div>
                   </div>
                   <div class="luxe-item-footer mt-3 pt-3 border-t">
                     <span class="luxe-tag-mini">{{ ganadoService.calculateCategoria(b) }}</span>
                     <span class="luxe-info-label ml-auto">Consultar Ficha</span>
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
                    <div class="metric-card-luxe">
                       <div class="metric-icon-box bg-wheat">
                          <ion-icon name="scale-outline" class="color-earth"></ion-icon>
                       </div>
                       <div class="metric-content">
                          <span class="label">Último Peso</span>
                          <span class="value">{{ getUltimoPeso() }} <small>KG</small></span>
                       </div>
                    </div>
                 </ion-col>
                 <ion-col size="12" size-md="6">
                    <div class="metric-card-luxe">
                       <div class="metric-icon-box bg-forest-light">
                          <ion-icon name="trending-up-outline" class="color-forest"></ion-icon>
                       </div>
                       <div class="metric-content">
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
           <div class="bi-main-card mb-8">
              <div class="card-header-flex">
                 <div class="card-title-stack">
                    <h3 class="card-title-luxe">Curva de Crecimiento</h3>
                    <p class="card-subtitle-luxe">Evolución del peso en el tiempo</p>
                 </div>
                 <div class="luxe-icon-circle bg-wheat">
                    <ion-icon name="bar-chart-outline" class="color-earth"></ion-icon>
                 </div>
              </div>
              <div class="chart-wrapper mt-6" style="height: 300px;">
                 <canvas baseChart [data]="chartDataIndividual" [options]="chartOptions" [type]="'line'"></canvas>
              </div>
           </div>

           <!-- HISTORIAL -->
           <div class="flex items-center justify-between mb-6">
             <h2 class="luxe-section-title ion-no-margin">Historial de Pesadas</h2>
             <span class="luxe-badge-count">{{ pesajesFiltrados.length }} Registros</span>
           </div>
           
           <ion-grid class="ion-no-padding">
             <ion-row>
               <ion-col size="12" size-md="6" size-xl="4" *ngFor="let p of pesajesFiltrados">
                 <div class="tag-body-luxe mb-4">
                   <div class="luxe-item-header">
                     <div class="luxe-icon-avatar bg-light">
                        <ion-icon name="calendar-outline" class="color-medium"></ion-icon>
                     </div>
                     <div class="luxe-title-stack">
                       <h3 class="text-lg font-bold">{{ p.peso_kg }} KG</h3>
                       <p>{{ p.tipo_pesaje }}</p>
                     </div>
                     <button class="luxe-btn-icon color-danger ml-auto" (click)="deletePesaje(p.id)">
                        <ion-icon name="trash-outline"></ion-icon>
                     </button>
                   </div>
                   <div class="luxe-item-footer mt-3 pt-3 border-t">
                     <span class="luxe-date-label">
                       <ion-icon name="time-outline" class="mr-1"></ion-icon>
                       {{ p.fecha_pesaje | date:'dd MMM yyyy' }}
                     </span>
                     <ion-badge slot="end" class="badge-luxe bg-forest ml-auto">Completado</ion-badge>
                   </div>
                 </div>
               </ion-col>
             </ion-row>
           </ion-grid>

           <div *ngIf="pesajesFiltrados.length === 0" class="luxe-empty-state">
             <div class="empty-icon-ring">
               <ion-icon name="scale-outline"></ion-icon>
             </div>
             <h2>Sin pesajes registrados</h2>
             <p>Comienza capturando el primer peso para ver el rendimiento.</p>
           </div>
        </div>

      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="animate-jump-in">
        <ion-fab-button (click)="setOpen(true)" class="fab-luxe">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
         <!-- MODAL DE PESAJE -->
      <ion-modal [isOpen]="isModalOpen" (didDismiss)="setOpen(false)" class="luxe-modal">
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

          <ion-content class="ion-padding luxe-modal-content">
            <div class="form-intro mb-6">
               <div class="icon-ring-luxe bg-wheat mb-3">
                  <ion-icon name="scale-outline" class="color-earth text-3xl"></ion-icon>
               </div>
               <h3>Entrada de Datos</h3>
               <p>Registra el peso actual detectado en báscula.</p>
            </div>

            <form [formGroup]="pesajeForm" (ngSubmit)="onSubmit()" class="luxe-form-stack">
              <div class="luxe-input-group">
                <label class="luxe-label">Animal</label>
                <div class="luxe-readonly-input">
                   {{ selectedBovino?.nombre }} ({{ selectedBovino?.crotal }})
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="luxe-input-group">
                  <label class="luxe-label">Fecha del Pesaje</label>
                  <input type="date" formControlName="fecha_pesaje" class="luxe-input-field">
                </div>
                <div class="luxe-input-group">
                  <label class="luxe-label">KG *</label>
                  <input type="number" formControlName="peso_kg" placeholder="0.00" class="luxe-input-field">
                </div>
              </div>

              <div class="luxe-input-group">
                 <label class="luxe-label">Tipo de Control</label>
                 <select formControlName="tipo_pesaje" class="luxe-select-field">
                   <option *ngFor="let t of ganadoService.constants.TIPOS_PESAJE" [value]="t">
                     {{ t }}
                   </option>
                 </select>
              </div>

              <div class="mt-8 pt-6 border-t border-gray-100">
                <ion-button type="submit" expand="block" [disabled]="pesajeForm.invalid" class="btn-luxe-save">
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
      leafOutline, pawOutline, speedometerOutline, personOutline, searchOutline, maleOutline, femaleOutline, chevronForwardOutline, filterOutline 
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
