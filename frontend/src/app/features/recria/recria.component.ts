import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonicModule, 
  AlertController, 
  ToastController 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  speedometer, trendingDown, person, search, male, 
  female, chevronForward, trash, add, close, scale, 
  barChart, fitness, save, pencil, trendingUp, calendar, leaf, paw 
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
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, BaseChartDirective],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary" class="luxe-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="text-white"></ion-menu-button>
        </ion-buttons>
        <ion-title class="luxe-title">Recría & Rendimiento</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="luxe-bg-forest">
      <div class="luxe-container animate-fade-in">
        
        <!-- Cabecera de Sección -->
        <div class="luxe-header-content">
          <div class="luxe-icon-box bg-forest">
            <ion-icon name="speedometer"></ion-icon>
          </div>
          <div class="luxe-text-stack">
            <h1 class="page-h1-rustic">{{ selectedBovino ? selectedBovino.nombre : 'Control de Pesaje' }}</h1>
            <p class="page-p-rustic">
              {{ selectedBovino ? 'Evolución de peso: ' + selectedBovino.crotal : 'Selecciona un animal para gestionar su rendimiento.' }}
            </p>
          </div>
          <ion-button *ngIf="selectedBovino" fill="clear" (click)="selectedBovino = null" color="dark" slot="end" class="mt-4">
             <ion-icon name="close" slot="start"></ion-icon> Cambiar Animal
          </ion-button>
        </div>

        <!-- LISTADO DE ANIMALES PARA SELECCIÓN -->
        <div *ngIf="!selectedBovino" class="animate-fade-in">
           <div class="rustic-search-wrapper mb-6">
              <ion-icon name="search" class="rustic-search-icon"></ion-icon>
              <input 
                type="text" 
                placeholder="Buscar por crotal o nombre..." 
                class="rustic-search-input-field"
                [(ngModel)]="searchTerm">
           </div>

           <ion-grid class="ion-no-padding">
              <ion-row>
                 <ion-col size="12" size-md="6" size-xl="4" *ngFor="let b of filteredBovinos()">
                    <ion-card class="pro-card-luxe animate-slide-up cursor-pointer" (click)="selectBovino(b)" tabindex="0" (keydown.enter)="selectBovino(b)">
                       <ion-card-header>
                          <div class="card-header-flex">
                             <div *ngIf="b.foto_url" class="card-icon-box bg-earth card-icon-box-img" [style.background-image]="'url(' + b.foto_url + ')'"></div>
                             <div *ngIf="!b.foto_url" class="card-icon-box" [ngClass]="b.sexo === 'Macho' ? 'bg-secondary' : 'bg-primary'">
                                <ion-icon [name]="b.sexo === 'Macho' ? 'male' : 'female'"></ion-icon>
                             </div>
                             <div class="card-title-stack">
                                <strong>{{ b.nombre }}</strong>
                                <span>Crotal: {{ b.crotal }}</span>
                             </div>
                             <ion-icon name="chevron-forward" class="opacity-30" slot="end" style="margin-left:auto;"></ion-icon>
                          </div>
                       </ion-card-header>
                       <ion-card-content>
                          <div class="card-data-grid">
                            <div class="card-data-item">
                              <span class="label">Categoría</span>
                              <span class="value">{{ ganadoService.calculateCategoria(b) }}</span>
                            </div>
                            <div class="card-data-item">
                              <span class="label">Raza</span>
                              <span class="value">{{ b.raza || 'Mestizo' }}</span>
                            </div>
                          </div>
                       </ion-card-content>
                    </ion-card>
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
                    <div class="metric-card-luxe bg-white">
                       <span class="label">Último Peso</span>
                       <span class="value">{{ getUltimoPeso() }} <small>KG</small></span>
                    </div>
                 </ion-col>
                 <ion-col size="12" size-md="6">
                    <div class="metric-card-luxe bg-white">
                       <span class="label">GMD (Ganancia Diaria)</span>
                       <span class="value" [ngClass]="getGMD() >= 0 ? 'color-forest' : 'color-danger'">
                          {{ getGMD() > 0 ? '+' : '' }}{{ getGMD() | number:'1.2-2' }} <small>kg/día</small>
                       </span>
                    </div>
                 </ion-col>
              </ion-row>
           </ion-grid>

           <!-- GRÁFICO INDIVIDUAL -->
           <div class="analytics-card-large mb-8">
              <div class="card-header-flex">
                 <h3 class="card-title-luxe">Curva de Crecimiento Individual</h3>
              </div>
              <div class="chart-container-large">
                 <canvas baseChart [data]="chartDataIndividual" [options]="chartOptions" [type]="'line'"></canvas>
              </div>
           </div>

           <!-- HISTORIAL -->
           <h2 class="luxe-section-title">Historial de Pesadas</h2>
           <div class="history-panel-bi">
              <div *ngFor="let p of pesajesFiltrados" class="weight-card-row animate-slide-up">
                 <div class="card-content-flex">
                    <div class="date-box">
                       <strong>{{ p.fecha_pesaje | date:'dd' }}</strong>
                       <span>{{ p.fecha_pesaje | date:'MMM' }}</span>
                    </div>
                    <div class="data-box">
                       <span class="weight">{{ p.peso_kg }} KG</span>
                       <span class="type">{{ p.tipo_pesaje }}</span>
                    </div>
                    <ion-button fill="clear" color="danger" (click)="deletePesaje(p.id)" class="ml-auto">
                       <ion-icon name="trash" slot="icon-only"></ion-icon>
                    </ion-button>
                 </div>
              </div>
           </div>

           <div *ngIf="pesajesFiltrados.length === 0" class="luxe-empty-state">
              <p>No hay pesajes registrados para este animal.</p>
           </div>
        </div>

      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="setOpen(true)" class="bg-var-primary">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- MODAL DE PESAJE -->
      <ion-modal [isOpen]="isModalOpen" (didDismiss)="setOpen(false)" class="luxe-modal">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar color="primary">
              <ion-title>Ficha de Pesaje</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="setOpen(false)">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>

          <ion-content class="ion-padding luxe-modal-content">
            <div class="form-intro">
               <ion-icon name="scale" class="color-earth text-3xl"></ion-icon>
               <h3>Registro de Rendimiento</h3>
               <p>Introduce los datos capturados en báscula.</p>
            </div>

            <form [formGroup]="pesajeForm" (ngSubmit)="onSubmit()">
              <ion-item class="luxe-input">
                <ion-label position="stacked">Animal Seleccionado</ion-label>
                <ion-input [value]="selectedBovino?.nombre + ' (' + selectedBovino?.crotal + ')'" [readonly]="true"></ion-input>
              </ion-item>

              <div class="luxe-item-group">
                <ion-item class="luxe-input half">
                  <ion-label position="stacked">Fecha</ion-label>
                  <ion-input type="date" formControlName="fecha_pesaje"></ion-input>
                </ion-item>
                <ion-item class="luxe-input half">
                  <ion-label position="stacked">KG *</ion-label>
                  <ion-input type="number" formControlName="peso_kg" placeholder="0.00"></ion-input>
                </ion-item>
              </div>

              <ion-item class="luxe-input">
                 <ion-label position="stacked">Tipo Control</ion-label>
                 <ion-select formControlName="tipo_pesaje" interface="popover">
                   <ion-select-option *ngFor="let t of ganadoService.constants.TIPOS_PESAJE" [value]="t">
                     {{ t }}
                   </ion-select-option>
                 </ion-select>
              </ion-item>

              <div class="luxe-modal-footer">
                <ion-button type="submit" [disabled]="pesajeForm.invalid" class="btn-luxe-save w-full">
                  <ion-icon slot="start" name="save"></ion-icon>
                  Registrar Pesaje
                </ion-button>
              </div>
            </form>
          </ion-content>
        </ng-template>
      </ion-modal>
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
      fitness, scale, add, close, save, pencil, trash, 
      trendingUp, trendingDown, calendar, barChart, 
      leaf, paw, speedometer, person, search, male, female, chevronForward 
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
