import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, 
  IonLabel, IonBadge, IonIcon,
  IonButtons, IonMenuButton, IonFab, IonFabButton, IonModal,
  IonButton, IonInput, IonSelect, IonSelectOption,
  IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';
import { Reproduccion, Bovino } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { 
  calendar, heart, flask, hourglass, add, close, save, 
  time, pencil, female, trash, statsChart, ribbon, pulse, paw
} from 'ionicons/icons';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController, AlertController } from '@ionic/angular/standalone';

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
    IonInput, IonSelect, IonSelectOption, IonGrid, IonRow, IonCol
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary" class="luxe-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="text-white"></ion-menu-button>
        </ion-buttons>
        <ion-title class="luxe-title">Reproducción & Linaje</ion-title>
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
            <h1 class="page-h1-rustic">Control de Gestación</h1>
            <p class="page-p-rustic">Seguimiento exhaustivo del ciclo reproductivo.</p>
          </div>
        </div>

        <h2 class="luxe-section-title">Gestaciones Confirmadas</h2>
        <ion-grid class="ion-no-padding">
          <ion-row>
            <ion-col size="12" size-md="6" size-xl="4" *ngFor="let r of gestacionesActivas">
              <div class="repro-card-body-luxe animate-slide-up">
                <div class="card-header-flex">
                  <div class="card-icon-box bg-danger">
                    <ion-icon name="pulse"></ion-icon>
                  </div>
                  <div class="card-title-stack">
                    <strong>{{ r.bovino?.nombre || 'Res S/N' }}</strong>
                    <span>ID: {{ r.bovino?.crotal }} - Parto: {{ getDaysToCalving(r) }} d</span>
                  </div>
                </div>

                <div class="card-data-grid">
                  <div class="card-data-item">
                    <span class="label">Parto Previsto</span>
                    <span class="value highlight">{{ r.fecha_parto_prevista | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="card-data-item">
                    <span class="label">Método</span>
                    <span class="value">{{ r.tipo_cubricion }}</span>
                  </div>
                </div>

                <div class="card-footer-actions">
                  <ion-button fill="clear" (click)="openEditModal(r)" color="dark">
                    <ion-icon name="pencil" slot="start"></ion-icon> Gestionar
                  </ion-button>
                  <ion-button fill="clear" (click)="confirmDelete(r)" color="danger">
                    <ion-icon name="trash" slot="start"></ion-icon> Borrar
                  </ion-button>
                </div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <h2 class="luxe-section-title">Historial Reproductivo</h2>
        <div class="history-panel-luxe">
           <div class="history-row-luxe" *ngFor="let r of reproducciones">
              <div class="history-avatar-luxe">
                <ion-icon name="female"></ion-icon>
              </div>
              <div class="history-data-luxe">
                <h4>{{ r.bovino?.nombre }} <small>({{ r.bovino?.crotal }})</small></h4>
                <p>{{ r.tipo_cubricion }} - {{ r.fecha_cubricion | date:'dd/MM/yyyy' }}</p>
              </div>
              <div class="history-actions-luxe">
                <ion-badge [color]="getStatusColor(r.estado_gestacion)" mode="ios">
                  {{ r.estado_gestacion }}
                </ion-badge>
                <div class="btn-group-history">
                   <ion-button fill="clear" (click)="openEditModal(r)"><ion-icon name="pencil"></ion-icon></ion-button>
                   <ion-button fill="clear" (click)="confirmDelete(r)"><ion-icon name="trash" color="danger"></ion-icon></ion-button>
                </div>
              </div>
           </div>
        </div>

      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="openAddModal()" style="--background: var(--ion-color-secondary)">
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
                  <ion-select-option *ngFor="let b of vacas" [value]="b.id">
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
                  <ion-select-option value="Monta Natural">Monta Natural</ion-select-option>
                  <ion-select-option value="Inseminación Artificial">Inseminación Artificial</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item class="luxe-input">
                <ion-label position="stacked">Estado Gestación</ion-label>
                <ion-select formControlName="estado_gestacion" interface="popover">
                  <ion-select-option value="Pendiente">Pendiente</ion-select-option>
                  <ion-select-option value="Confirmada">Confirmada</ion-select-option>
                  <ion-select-option value="Parido">Parido</ion-select-option>
                  <ion-select-option value="Fallida">Fallida</ion-select-option>
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
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  
  reproducciones: Reproduccion[] = [];
  gestacionesActivas: Reproduccion[] = [];
  vacas: Bovino[] = [];
  
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

    this.reproForm.get('fecha_cubricion')?.valueChanges.subscribe(val => {
      this.calculateParto(val);
    });
  }

  async ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      const { data: repros } = await this.supa.getReproduccion();
      const { data: females } = await this.supa.getFemales();
      
      this.reproducciones = repros || [];
      this.vacas = females || [];
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
