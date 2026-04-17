import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, 
  IonLabel, IonBadge, IonIcon,
  IonButtons, IonMenuButton, IonFab, IonFabButton, IonModal,
  IonButton, IonInput, IonSelect, IonSelectOption,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardContent
} from '@ionic/angular/standalone';
import { BaseChartDirective } from 'ng2-charts';
import { SupabaseService } from '../../core/services/supabase.service';
import { Reproduccion, Bovino } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { 
  calendar, heart, flask, hourglass, add, close, save, 
  time, pencil, female, trash, statsChart, ribbon, pulse, paw
} from 'ionicons/icons';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { ReproduccionService } from '../../core/services/reproduccion.service';
import { GanadoService } from '../../core/services/ganado.service';
import { METODOS_REPRODUCCION, ESTADOS_GESTACION } from '../../core/constants/vaca.constants';
import { ChartConfiguration, ChartOptions } from 'chart.js';

/**
 * Componente para el Módulo de Reproducción y Ginecología - Versión Rústica.
 * Refactorizado: 100% Sincronización de colores con _variables.scss.
 */
@Component({
  selector: 'app-reproduccion',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonTitle, 
    IonItem, IonLabel, IonBadge, IonIcon,
    IonButtons, IonMenuButton, IonFab, IonFabButton, IonModal, IonButton,
    IonInput, IonSelect, IonSelectOption, IonGrid, IonRow, IonCol, IonCard, 
    IonCardHeader, IonCardContent, BaseChartDirective
  ],
  template: `
    <ion-header class="ion-no-border" [translucent]="true">
      <ion-toolbar color="primary" class="luxe-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="text-white"></ion-menu-button>
        </ion-buttons>
        <ion-title class="luxe-title">Montas y Cría</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="luxe-bg-forest">
      <div class="luxe-container animate-fade-in">
        
        <!-- Cabecera de Sección -->
        <div class="luxe-header-content">
          <div class="luxe-icon-box bg-earth">
            <ion-icon name="heart"></ion-icon>
          </div>
          <div class="luxe-text-stack">
            <h1 class="page-h1-rustic">Control de Vacas Preñadas</h1>
            <p class="page-p-rustic">Seguimiento de partos y efectividad de las montas.</p>
          </div>
        </div>

        <!-- GRÁFICO DE FERTILIDAD -->
        <div class="analytics-card-large animate-slide-up mb-8">
          <div class="card-header-flex">
            <div>
              <h3 class="card-title-luxe"><ion-icon name="heart" class="icon-inline-baseline icon-mr color-danger"></ion-icon> Preñeces con éxito</h3>
              <p class="card-subtitle-luxe">Análisis de efectividad en ciclos reproductivos.</p>
            </div>
          </div>
          <div class="chart-container-large">
             <canvas baseChart [data]="chartFertilidad()" [options]="chartOptionsPilarStacked" [type]="'bar'"></canvas>
          </div>
        </div>

        <h2 class="luxe-section-title">Próximos Partos</h2>
        
        <!-- Estado Vacío -->
        <div *ngIf="gestacionesActivas.length === 0" class="luxe-empty-state">
          <div class="empty-icon-ring">
            <ion-icon name="logo-buffer"></ion-icon>
          </div>
          <h2>No hay animales registrados</h2>
          <p>La lista de gestaciones confirmadas está vacía.</p>
        </div>

        <ion-grid class="ion-no-padding" *ngIf="gestacionesActivas.length > 0">
          <ion-row>
            <ion-col size="12" size-md="6" size-xl="4" *ngFor="let r of gestacionesActivas">
              <ion-card class="pro-card-luxe animate-slide-up">
                <ion-card-header>
                  <div class="card-header-flex">
                    <div class="card-icon-box bg-danger">
                      <ion-icon name="pulse"></ion-icon>
                    </div>
                    <div class="card-title-stack">
                      <strong>{{ r.bovino?.nombre || 'Res S/N' }}</strong>
                      <span>Parto: {{ getDaysToCalving(r) }} d restantes</span>
                    </div>
                    <ion-badge color="success" slot="end" mode="ios">Gestante</ion-badge>
                  </div>
                </ion-card-header>

                <ion-card-content>
                  <div class="card-data-grid">
                    <div class="card-data-item">
                      <span class="label">Parto Previsto</span>
                      <span class="value highlight">{{ r.fecha_parto_prevista | date:'dd MMM yyyy' }}</span>
                    </div>
                    <div class="card-data-item">
                      <span class="label">Método</span>
                      <span class="value">{{ r.tipo_cubricion }}</span>
                    </div>
                  </div>

                  <div class="card-footer-actions-bi mt-4">
                    <ion-button fill="clear" (click)="openEditModal(r)" color="dark" size="small">
                      <ion-icon name="pencil" slot="start"></ion-icon> Editar
                    </ion-button>
                    <ion-button fill="clear" (click)="confirmDelete(r)" color="danger" size="small">
                      <ion-icon name="trash" slot="start"></ion-icon> Borrar
                    </ion-button>
                  </div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <h2 class="luxe-section-title mt-8">Historial Reproductivo</h2>
        
        <!-- Historial en Tarjetas Pro -->
        <div class="history-panel-bi" *ngIf="reproducciones.length > 0">
           <ion-card class="pro-card-row animate-slide-up" *ngFor="let r of reproducciones">
              <ion-item lines="none" class="item-card-pro">
                <div class="history-avatar-bi bg-earth-soft" slot="start">
                  <ion-icon name="female"></ion-icon>
                </div>
                <ion-label>
                  <h3 class="font-bold">{{ r.bovino?.nombre }} <small class="opacity-60">({{ r.bovino?.crotal }})</small></h3>
                  <p>{{ r.tipo_cubricion }} • {{ r.fecha_cubricion | date:'dd/MM/yyyy' }}</p>
                </ion-label>
                <div slot="end" class="flex flex-col items-end gap-2">
                  <ion-badge [color]="getStatusColor(r.estado_gestacion)" mode="ios">
                    {{ r.estado_gestacion }}
                  </ion-badge>
                  <div class="action-buttons-mini">
                    <ion-button fill="clear" (click)="openEditModal(r)" size="small"><ion-icon name="pencil" slot="icon-only"></ion-icon></ion-button>
                    <ion-button fill="clear" (click)="confirmDelete(r)" size="small" color="danger"><ion-icon name="trash" slot="icon-only"></ion-icon></ion-button>
                  </div>
                </div>
              </ion-item>
           </ion-card>
        </div>

        <div *ngIf="reproducciones.length === 0" class="luxe-empty-state">
           <ion-icon name="logo-buffer" class="text-6xl opacity-20"></ion-icon>
           <p>No hay historial registrado.</p>
        </div>

      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="openAddModal()" class="bg-var-secondary">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- MODAL DE FICHA REPRODUCTIVA -->
      <ion-modal [isOpen]="isModalOpen" (didDismiss)="closeModal()" class="luxe-modal">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar color="primary">
              <ion-title>{{ editingItem ? 'Actualizar Ficha' : 'Nuevo Evento' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeModal()">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          
          <ion-content class="ion-padding luxe-modal-content">
            <div class="form-intro">
               <ion-icon name="heart" class="color-earth text-3xl"></ion-icon>
               <h3>Protocolo de Cría</h3>
               <p>Registra eventos de monta e inseminación.</p>
            </div>

            <form [formGroup]="reproForm">
              <ion-item class="luxe-input">
                <ion-label position="stacked">Identificar Hembra *</ion-label>
                <ion-select formControlName="bovino_id" placeholder="Seleccionar hembra" interface="popover">
                  <ion-select-option *ngFor="let b of ganadoService.hembrasActivas()" [value]="b.id">
                    {{ b.nombre }} ({{ b.crotal }})
                  </ion-select-option>
                </ion-select>
              </ion-item>

              <div class="luxe-item-group">
                <ion-item class="luxe-input half">
                  <ion-label position="stacked">Detección Celo</ion-label>
                  <ion-input type="date" formControlName="fecha_celo"></ion-input>
                </ion-item>
                <ion-item class="luxe-input half">
                  <ion-label position="stacked">Cubrición *</ion-label>
                  <ion-input type="date" formControlName="fecha_cubricion"></ion-input>
                </ion-item>
              </div>

              <ion-item class="luxe-input">
                <ion-label position="stacked">Metodología</ion-label>
                <ion-select formControlName="tipo_cubricion" interface="popover">
                  <ion-select-option *ngFor="let m of METODOS" [value]="m">
                    {{ m }}
                  </ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item class="luxe-input">
                <ion-label position="stacked">Estado Gestación</ion-label>
                <ion-select formControlName="estado_gestacion" interface="popover">
                  <ion-select-option *ngFor="let eg of ESTADOS" [value]="eg">
                    {{ eg }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
              
              <div class="luxe-modal-footer">
                <ion-button (click)="saveData()" [disabled]="reproForm.invalid" class="btn-luxe-save w-full">
                  <ion-icon name="save" slot="start"></ion-icon> Archivar Evento
                </ion-button>
              </div>
            </form>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `
})
export class ReproduccionComponent implements OnInit {
  private supa = inject(SupabaseService);
  public ganadoService = inject(GanadoService);
  private reproService = inject(ReproduccionService);

  public readonly METODOS = METODOS_REPRODUCCION;
  public readonly ESTADOS = ESTADOS_GESTACION;
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  
  // Gráfico de Fertilidad
  chartFertilidad = computed<ChartConfiguration<'bar'>['data']>(() => {
    const data = this.reproService.getEstadisticasConcepcion('Mensual');
    return {
      labels: data.map(d => d.label),
      datasets: [
        { label: 'Gestación Exitosa', data: data.map(d => d.exitos), backgroundColor: '#52b788', borderRadius: 4 },
        { label: 'Fallo/Absorción', data: data.map(d => d.fallos), backgroundColor: '#ef4444', borderRadius: 4 }
      ]
    };
  });

  public chartOptionsPilarStacked: ChartOptions<'bar'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#6c757d' } } },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: '#6c757d' } },
      y: { stacked: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#6c757d' } }
    }
  };
  
  reproducciones: Reproduccion[] = [];
  gestacionesActivas: Reproduccion[] = [];
  
  isModalOpen = false;
  editingItem: Reproduccion | null = null;
  reproForm: FormGroup;

  constructor() {
    addIcons({ calendar, heart, flask, hourglass, add, close, save, time, pencil, female, trash, statsChart, ribbon, pulse, paw });
    
    this.reproForm = this.fb.group({
      bovino_id: ['', Validators.required],
      fecha_celo: [''],
      fecha_cubricion: ['', Validators.required],
      tipo_cubricion: ['Monta Natural', Validators.required],
      estado_gestacion: ['Pendiente', Validators.required],
      fecha_parto_prevista: ['']
    });

    this.reproForm.get('fecha_cubricion')?.valueChanges.pipe(takeUntilDestroyed()).subscribe(val => {
      this.calculateParto(val);
    });
  }

  async ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      const { data: repros } = await this.supa.getReproduccion();
      this.reproducciones = repros || [];
      this.gestacionesActivas = this.reproducciones.filter(r => r.estado_gestacion === 'Confirmada');
    } catch (e) {
      console.error('Error cargando datos reproductivos:', e);
    }
  }

  private calculateParto(fechaCubricion: string) {
    if (fechaCubricion) {
      const date = new Date(fechaCubricion);
      date.setDate(date.getDate() + 283);
      this.reproForm.get('fecha_parto_prevista')?.setValue(date.toISOString().split('T')[0], { emitEvent: false });
    }
  }

  getDaysToCalving(repro: Reproduccion): number {
    if (!repro.fecha_parto_prevista) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const calving = new Date(repro.fecha_parto_prevista);
    const diffTime = calving.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  getStatusColor(estado: string): string {
    switch (estado) {
      case 'Confirmada': return 'success';
      case 'Pendiente': return 'warning';
      case 'Parido': return 'secondary';
      case 'Fallida': return 'danger';
      default: return 'medium';
    }
  }

  openAddModal() {
    this.editingItem = null;
    this.reproForm.reset({
      tipo_cubricion: 'Monta Natural',
      estado_gestacion: 'Pendiente',
      fecha_cubricion: new Date().toISOString().split('T')[0]
    });
    this.isModalOpen = true;
  }

  openEditModal(item: Reproduccion) {
    this.editingItem = item;
    const { bovino, ...data } = item;
    this.reproForm.patchValue(data);
    this.isModalOpen = true;
  }

  closeModal() { this.isModalOpen = false; }

  async saveData() {
    if (this.reproForm.invalid) return;

    try {
      const payload = this.reproForm.value;
      const res = this.editingItem?.id 
        ? await this.supa.updateReproduccion(this.editingItem.id, payload)
        : await this.supa.createReproduccion(payload);

      if (res.error) {
        this.presentToast('Error al guardar: ' + res.error, 'danger');
      } else {
        this.presentToast('Registro reproductivo actualizado');
        this.isModalOpen = false;
        this.loadData();
      }
    } catch (e) {
      this.presentToast('Error de comunicación', 'danger');
    }
  }

  async confirmDelete(item: Reproduccion) {
    const alert = await this.alertCtrl.create({
      header: 'Auditoría de Linaje',
      message: '¿Confirma la eliminación permanente?',
      buttons: [
        { text: 'Conservar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.deleteRecord(item.id) }
      ]
    });
    await alert.present();
  }

  async deleteRecord(id: string) {
    const res = await this.supa.deleteReproduccion(id);
    if (res.error) {
      this.presentToast('Error al eliminar: ' + res.error, 'danger');
    } else {
      this.presentToast('Registro eliminado', 'warning');
      this.loadData();
    }
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
}
