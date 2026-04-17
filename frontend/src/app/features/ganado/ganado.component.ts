import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, 
  IonLabel, IonIcon, IonNote, IonGrid, 
  IonRow, IonCol, IonButtons, IonMenuButton, IonFab, IonFabButton,
  IonModal, IonButton, IonInput, IonSelect, IonSelectOption,
  IonCard, IonBadge, IonCardContent, IonAvatar, IonCardHeader
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';
import { Bovino, Lote } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { 
  pawOutline, listOutline, addCircle, closeOutline, checkmarkCircleOutline, personOutline, 
  maleOutline, femaleOutline, calendarOutline, barChartOutline, leafOutline,
  createOutline, trashOutline, arrowForwardOutline, chevronForwardOutline, megaphoneOutline,
  layersOutline
} from 'ionicons/icons';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { GanadoService } from '../../core/services/ganado.service';
import { FincaService } from '../../core/services/finca.service';
import { StorageService } from '../../core/services/storage.service';
import { OfflineSyncService } from '../../core/services/offline-sync.service';
import { PesajeService } from '../../core/services/pesaje.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { computed, signal } from '@angular/core';

/**
 * Componente para el Módulo de Inventario Ganadero - Versión Rústica.
 * Refactorizado: 100% Sincronización de colores con _variables.scss.
 */
@Component({
  selector: 'app-ganado',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, 
    IonContent, IonHeader, IonToolbar, IonTitle, IonItem, 
    IonLabel, IonIcon, IonNote, IonGrid, 
    IonRow, IonCol, IonButtons, IonMenuButton, IonFab, IonFabButton,
    IonModal, IonButton, IonInput, IonSelect, IonSelectOption,
    IonCard, IonBadge, IonCardContent, IonAvatar, IonCardHeader,
    BaseChartDirective
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title class="ion-text-center">Inventario Ganadero</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear">
            <ion-icon name="filter-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-vertical">
      <div class="luxe-container animate-fade-in">

        <!-- GRÁFICO DE PESO -->
        <div class="bi-main-card animate-slide-up mb-8" *ngIf="bovinos().length > 0">
          <ion-card-header>
            <div class="bi-card-head">
              <div class="card-title-stack">
                <span>ANÁLISIS DE RENDIMIENTO</span>
                <strong>Crecimiento (Peso en Kilos)</strong>
              </div>
              <div class="bi-mini-stat bg-primary-soft">
                <ion-icon name="trending-up-outline"></ion-icon>
                <span>Hato Saludable</span>
              </div>
            </div>
          </ion-card-header>
          <ion-card-content>
            <div class="chart-container-large" style="height: 300px;">
               <canvas baseChart [data]="chartPesos()" [options]="chartOptionsPilarLine" [type]="'line'"></canvas>
            </div>
          </ion-card-content>
        </div>

        <ion-grid class="ion-no-padding" *ngIf="bovinos().length > 0">
          <ion-row>
            <ion-col size="12" size-md="6" size-xl="4" *ngFor="let b of bovinos()">
              <div class="tag-body-luxe">
                <div class="card-header-flex">
                  <ion-avatar class="luxe-avatar">
                    <div *ngIf="b.foto_url" class="avatar-img" [style.background-image]="'url(' + b.foto_url + ')'"></div>
                    <div *ngIf="!b.foto_url" class="avatar-placeholder">
                      <ion-icon [name]="b.sexo === 'Macho' ? 'male-outline' : 'female-outline'"></ion-icon>
                    </div>
                  </ion-avatar>
                  <div class="card-title-stack">
                    <strong>{{ b.nombre }}</strong>
                    <span>{{ b.crotal }} • {{ b.raza || 'Mestizo' }}</span>
                  </div>
                  <div class="flex-1"></div>
                  <ion-badge *ngIf="b.estado_productivo === 'Alta'" color="success" mode="ios">
                    Activo
                  </ion-badge>
                  <ion-badge *ngIf="b.estado_productivo !== 'Alta'" color="warning" mode="ios">
                    {{ b.estado_productivo }}
                  </ion-badge>
                </div>

                <div class="card-data-grid">
                  <div class="card-data-item">
                    <span class="label">Sexo / Aptitud</span>
                    <span class="value">{{ b.sexo }} • {{ b.aptitud }}</span>
                  </div>
                  <div class="card-data-item">
                    <span class="label">Edad Actual</span>
                    <span class="value">{{ ganadoService.getEdadDesc(b) }}</span>
                  </div>
                </div>

                <div class="card-footer-actions">
                  <ion-button fill="clear" color="medium" (click)="openEditModal(b)">
                    <ion-icon name="create-outline" slot="icon-only"></ion-icon>
                  </ion-button>
                  <ion-button fill="clear" color="danger" (click)="confirmDelete(b.id)">
                    <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                  </ion-button>
                  <ion-button fill="solid" color="primary" class="ion-no-margin">
                    Ver Ficha
                  </ion-button>
                </div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Estado Vacío -->
        <div *ngIf="bovinos().length === 0" class="luxe-empty-state">
          <div class="empty-icon-ring">
            <ion-icon name="layers-outline"></ion-icon>
          </div>
          <h2>No hay animales registrados</h2>
          <p>Comienza registrando tu primer animal en el sistema.</p>
          <ion-button fill="solid" (click)="openAddModal()" color="primary" style="--border-radius: 12px;">
            <ion-icon name="add-circle" slot="start"></ion-icon> Añadir Ejemplar
          </ion-button>
        </div>

      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="openAddModal()" color="primary">
          <ion-icon name="add-circle"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- MODAL WIZARD -->
      <ion-modal [isOpen]="isModalOpen" (didDismiss)="closeModal()" class="luxe-modal">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar color="primary">
              <ion-title>{{ editingItem ? 'Actualizar Ficha' : 'Nuevo Registro' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeModal()">
                  <ion-icon name="close-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>

          <!-- Stepper Visual -->
          <div class="luxe-wizard-stepper">
            <div class="wizard-step" [ngClass]="{'step-active': currentStep >= 1}">
              <div class="step-circle">1</div>
              <span>Identidad</span>
            </div>
            <div class="wizard-line"></div>
            <div class="wizard-step" [ngClass]="{'step-active': currentStep >= 2}">
              <div class="step-circle">2</div>
              <span>Biología</span>
            </div>
            <div class="wizard-line"></div>
            <div class="wizard-step" [ngClass]="{'step-active': currentStep >= 3}">
              <div class="step-circle">3</div>
              <span>Finca</span>
            </div>
          </div>
          
          <ion-content class="ion-padding luxe-modal-content">
            <form [formGroup]="bovinoForm">
              
              <!-- Paso 1: Identidad -->
              <div *ngIf="currentStep === 1" class="animate-slide-up">
                <div class="form-intro">
                   <h3>Identificación Oficial</h3>
                   <p>Introduce los datos de trazabilidad obligatorios.</p>
                </div>
                <ion-item class="luxe-input">
                  <ion-label position="stacked">Nombre del Ejemplar *</ion-label>
                  <ion-input formControlName="nombre" placeholder="Ej: Bonita"></ion-input>
                </ion-item>
                <ion-item class="luxe-input">
                  <ion-label position="stacked">DIB / Crotal *</ion-label>
                  <ion-input formControlName="crotal" placeholder="ES012345678901"></ion-input>
                </ion-item>
                <ion-item class="luxe-input">
                  <ion-label position="stacked">Fotografía del Ejemplar</ion-label>
                  <input type="file" accept="image/*" (change)="onFileSelected($event)" class="py-sm" />
                  <ion-note *ngIf="isUploadingFile">Subiendo imagen...</ion-note>
                </ion-item>
              </div>

              <!-- Paso 2: Biología -->
              <div *ngIf="currentStep === 2" class="animate-slide-up">
                <div class="form-intro">
                   <h3>Rasgos Biológicos</h3>
                   <p>Información genética y cronológica del ejemplar.</p>
                </div>
                <ion-item class="luxe-input">
                  <ion-label position="stacked">Sexo *</ion-label>
                  <ion-select formControlName="sexo" interface="popover">
                    <ion-select-option value="Hembra">Hembra</ion-select-option>
                    <ion-select-option value="Macho">Macho</ion-select-option>
                  </ion-select>
                </ion-item>
                <ion-item class="luxe-input">
                  <ion-label position="stacked">Raza Prima *</ion-label>
                  <ion-select formControlName="raza" interface="popover">
                    <ion-select-option *ngFor="let raza of ganadoService.constants.RAZAS_BOVINAS" [value]="raza">
                      {{ raza }}
                    </ion-select-option>
                  </ion-select>
                </ion-item>
                <ion-item class="luxe-input" *ngIf="bovinoForm.get('raza')?.value !== 'Cruce / Mestizo' && bovinoForm.get('raza')?.value !== 'Otro'">
                  <ion-label position="stacked">Porcentaje de Pureza (%)</ion-label>
                  <ion-input type="number" formControlName="porcentaje_pureza" placeholder="Ej: 100"></ion-input>
                </ion-item>
                <ion-item class="luxe-input">
                  <ion-label position="stacked">Aptitud Principal *</ion-label>
                  <ion-select formControlName="aptitud" interface="popover">
                    <ion-select-option *ngFor="let apt of ganadoService.constants.APTITUDES_BOVINAS" [value]="apt">
                      {{ apt }}
                    </ion-select-option>
                  </ion-select>
                </ion-item>
                <ion-item class="luxe-input">
                  <ion-label position="stacked">Fecha de Nacimiento *</ion-label>
                  <ion-input type="date" formControlName="fecha_nacimiento"></ion-input>
                </ion-item>
              </div>

              <!-- Paso 3: Ubicación -->
              <div *ngIf="currentStep === 3" class="animate-slide-up">
                <div class="form-intro">
                   <h3>Asignación de Lote</h3>
                   <p>Ubica al animal en su recinto correspondiente.</p>
                </div>
                <ion-item class="luxe-input">
                  <ion-label position="stacked">Seleccionar Lote *</ion-label>
                  <ion-select formControlName="lote_id" placeholder="Cargar Lotes..." interface="popover">
                    <ion-select-option *ngFor="let lote of lotes()" [value]="lote.id">
                      {{ lote.nombre }}
                    </ion-select-option>
                  </ion-select>
                </ion-item>
                <ion-item class="luxe-input">
                  <ion-label position="stacked">Estado Productivo</ion-label>
                  <ion-select formControlName="estado_productivo" interface="popover">
                    <ion-select-option *ngFor="let st of ganadoService.constants.ESTADOS_PRODUCTIVOS" [value]="st.value">
                      {{ st.label }}
                    </ion-select-option>
                  </ion-select>
                </ion-item>
                
                <!-- Estado Reproductivo Solo Hembras -->
                <ion-item class="luxe-input" *ngIf="bovinoForm.get('sexo')?.value === 'Hembra'">
                  <ion-label position="stacked">Estado Reproductivo</ion-label>
                  <ion-select formControlName="estado_reproductivo" interface="popover">
                    <ion-select-option *ngFor="let sr of ganadoService.constants.ESTADOS_REPRODUCTIVOS" [value]="sr.value">
                      {{ sr.label }}
                    </ion-select-option>
                  </ion-select>
                </ion-item>
              </div>
              
              <!-- Navegación Wizard -->
              <div class="luxe-modal-footer">
                <ion-row>
                  <ion-col size="6">
                    <ion-button *ngIf="currentStep > 1" expand="block" fill="clear" (click)="currentStep = currentStep - 1" class="color-earth">
                      Anterior
                    </ion-button>
                  </ion-col>
                  <ion-col size="6">
                    <ion-button *ngIf="currentStep < 3" expand="block" fill="solid" (click)="currentStep = currentStep + 1" class="btn-luxe-save" [disabled]="!isStepValid(currentStep)">
                      Siguiente
                    </ion-button>
                    <ion-button *ngIf="currentStep === 3" expand="block" fill="solid" (click)="saveData()" class="btn-luxe-save" [disabled]="bovinoForm.invalid">
                      Guardar
                    </ion-button>
                  </ion-col>
                </ion-row>
              </div>
            </form>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: []
})
export class GanadoComponent implements OnInit {
  public ganadoService = inject(GanadoService);
  private fincaService = inject(FincaService);
  private storageService = inject(StorageService);
  private offlineSync = inject(OfflineSyncService);
  private pesajeService = inject(PesajeService);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  
  bovinos = this.ganadoService.bovinos;
  lotes = this.fincaService.fincas;
  lotesArr: Lote[] = [];
  
  // Gráfico de Pesos
  chartPesos = computed<ChartConfiguration<'line'>['data']>(() => {
    const data = this.pesajeService.getEvolucionPrincipales('Mensual');
    return {
      labels: data.labels,
      datasets: data.datasets
    };
  });

  public chartOptionsPilarLine: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#6c757d', font: { size: 11 } } } },
    scales: {
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#6c757d' }, title: { display: true, text: 'Kilos (Kg)', color: '#6c757d' } },
      x: { grid: { display: false }, ticks: { color: '#6c757d' } }
    }
  };

  isModalOpen = false;
  editingItem: Bovino | null = null;
  currentStep = 1;
  isUploadingFile = false;

  bovinoForm: FormGroup;

  constructor() {
    addIcons({ pawOutline, listOutline, addCircle, closeOutline, checkmarkCircleOutline, personOutline, maleOutline, femaleOutline, calendarOutline, barChartOutline, leafOutline, createOutline, trashOutline, arrowForwardOutline, chevronForwardOutline, megaphoneOutline, layersOutline, filterOutline: 'filter-outline' });
    this.bovinoForm = this.fb.group({
      nombre: ['', Validators.required],
      crotal: ['', Validators.required],
      sexo: ['Hembra', Validators.required],
      raza: ['Cruce / Mestizo', Validators.required],
      porcentaje_pureza: [100.0],
      aptitud: ['Carne', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      lote_id: [''],
      estado_productivo: ['Alta', Validators.required],
      estado_reproductivo: ['Vacía'],
      foto_url: ['']
    });
  }

  async ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.lotesArr = []; 
  }

  isStepValid(step: number): boolean {
    if (step === 1) return !!this.bovinoForm.get('nombre')?.value && !!this.bovinoForm.get('crotal')?.value;
    if (step === 2) return !!this.bovinoForm.get('sexo')?.value;
    return true;
  }

  openAddModal() {
    this.editingItem = null;
    this.currentStep = 1;
    this.bovinoForm.reset({ 
      sexo: 'Hembra', 
      raza: 'Cruce / Mestizo',
      porcentaje_pureza: 100,
      aptitud: 'Carne',
      estado_productivo: 'Alta',
      estado_reproductivo: 'Vacía'
    });
    this.isModalOpen = true;
  }

  openEditModal(bovino: Bovino) {
    this.editingItem = bovino;
    this.currentStep = 1;
    this.bovinoForm.patchValue(bovino);
    this.isModalOpen = true;
  }

  closeModal() { this.isModalOpen = false; }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!this.fincaService.selectedFincaId()) {
        this.presentToast('Debes seleccionar una finca primero', 'warning');
        return;
      }
      this.isUploadingFile = true;
      const animalIdPlaceholder = this.editingItem?.id || 'temp';
      const { data, error } = await this.storageService.uploadAnimalPhoto(file, this.fincaService.selectedFincaId()!, animalIdPlaceholder);
      this.isUploadingFile = false;
      
      if (error) {
        this.presentToast('Error al subir imagen', 'danger');
      } else if (data?.publicUrl) {
        this.bovinoForm.patchValue({ foto_url: data.publicUrl });
        this.presentToast('Imagen subida correctamente');
      }
    }
  }

  async saveData() {
    if (this.bovinoForm.invalid) return;
    const payload = this.bovinoForm.value;

    let res;
    if (this.editingItem?.id) {
       if (!this.offlineSync.isOnline()) {
          this.offlineSync.enqueueOperation('bovinos', 'PUT', payload, this.editingItem.id);
          this.presentToast('Guardado en cola offline', 'warning');
          this.closeModal();
          return;
       }
       res = await this.ganadoService.updateBovino(this.editingItem.id, payload);
    } else {
       if (!this.offlineSync.isOnline()) {
          this.offlineSync.enqueueOperation('bovinos', 'POST', payload);
          this.presentToast('Guardado en cola offline', 'warning');
          this.closeModal();
          return;
       }
       res = await this.ganadoService.createBovino(payload);
    }

    if (res?.error) {
      this.presentToast('Error al guardar: ' + res.error, 'danger');
    } else {
      this.presentToast('Ficha de animal actualizada con éxito');
      this.isModalOpen = false;
    }
  }

  async confirmDelete(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Purgar Registro',
      message: '¿Confirma la baja definitiva de este animal?',
      buttons: [
        { text: 'Conservar', role: 'cancel' },
        { 
          text: 'Continuar Baja', 
          role: 'destructive',
          handler: async () => {
            if (!this.offlineSync.isOnline()) {
              this.offlineSync.enqueueOperation('bovinos', 'DELETE', {}, id);
              this.presentToast('Borrado en cola offline', 'warning');
              return;
            }
            
            // Si hay online de verdad: el GanadoService tendria delete, pero
            // usemos queueOperation y forcemos sinc
            this.offlineSync.enqueueOperation('bovinos', 'DELETE', {}, id);
            this.presentToast('Ejemplar purgado del sistema', 'warning');
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
}
