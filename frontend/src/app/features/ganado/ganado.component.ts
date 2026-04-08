import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, 
  IonLabel, IonBadge, IonIcon, IonNote, IonGrid, 
  IonRow, IonCol, IonButtons, IonMenuButton, IonFab, IonFabButton,
  IonModal, IonButton, IonInput, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';
import { Bovino, Lote } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { 
  paw, list, add, close, save, person, 
  male, female, calendar, barChart, leaf,
  pencil, trash, arrowForward, chevronForward, megaphone
} from 'ionicons/icons';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastController, AlertController } from '@ionic/angular/standalone';

/**
 * Componente para el Módulo de Inventario Ganadero - Versión Rústica.
 * Refactorizado: 100% Sincronización de colores con _variables.scss.
 */
@Component({
  selector: 'app-ganado',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, 
    IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, 
    IonLabel, IonBadge, IonIcon, IonNote, IonGrid, 
    IonRow, IonCol, IonButtons, IonMenuButton, IonFab, IonFabButton,
    IonModal, IonButton, IonInput, IonSelect, IonSelectOption
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary" class="luxe-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="text-white"></ion-menu-button>
        </ion-buttons>
        <ion-title class="luxe-title">Inventario Ganadero</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="luxe-bg-forest">
      <div class="luxe-container animate-fade-in">
        
        <!-- Cabecera de Sección -->
        <div class="luxe-header-content">
          <div class="luxe-icon-box bg-earth">
            <ion-icon name="paw"></ion-icon>
          </div>
          <div class="luxe-text-stack">
            <h1 class="page-h1-rustic">Ganado Registrado</h1>
            <p class="page-p-rustic">Gestión de identidad y trazabilidad individual.</p>
          </div>
        </div>

        <ion-grid class="ion-no-padding">
          <ion-row>
            <ion-col size="12" size-md="6" size-xl="4" *ngFor="let b of bovinos">
              <div class="tag-body-luxe animate-slide-up">
                <div class="card-header-flex">
                  <div class="card-icon-box" [ngClass]="b.sexo === 'Macho' ? 'bg-secondary' : 'bg-primary'">
                    <ion-icon [name]="b.sexo === 'Macho' ? 'male' : 'female'"></ion-icon>
                  </div>
                  <div class="card-title-stack">
                    <strong>{{ b.nombre }}</strong>
                    <span>ID CROTAL: {{ b.crotal }}</span>
                  </div>
                </div>

                <div class="card-data-grid">
                  <div class="card-data-item">
                    <span class="label">Raza</span>
                    <span class="value">{{ b.raza || 'No asig.' }}</span>
                  </div>
                  <div class="card-data-item">
                    <span class="label">Edad</span>
                    <span class="value highlight">{{ getEdadDesc(b) }}</span>
                  </div>
                </div>

                <div class="card-footer-actions">
                  <ion-button fill="clear" (click)="openEditModal(b)" color="dark">
                    <ion-icon name="pencil" slot="start"></ion-icon> Editar
                  </ion-button>
                  <ion-button fill="clear" (click)="confirmDelete(b.id)" color="danger">
                    <ion-icon name="trash" slot="start"></ion-icon> Borrar
                  </ion-button>
                </div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Estado Vacío -->
        <div *ngIf="bovinos.length === 0" class="luxe-empty-state">
          <div class="empty-icon-ring">
            <ion-icon name="paw"></ion-icon>
          </div>
          <h2>Sin ejemplares</h2>
          <p>Comienza registrando tu primer animal en el sistema.</p>
          <ion-button fill="solid" (click)="openAddModal()" class="btn-luxe-save">
            <ion-icon name="add" slot="start"></ion-icon> Añadir Ejemplar
          </ion-button>
        </div>

      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="openAddModal()" style="--background: var(--ion-color-secondary)">
          <ion-icon name="add"></ion-icon>
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
                  <ion-icon name="close"></ion-icon>
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
                  <ion-label position="stacked">Raza</ion-label>
                  <ion-input formControlName="raza" placeholder="Ej: Limusín"></ion-input>
                </ion-item>
                <ion-item class="luxe-input">
                  <ion-label position="stacked">Fecha de Nacimiento</ion-label>
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
                    <ion-select-option *ngFor="let lote of lotes" [value]="lote.id">
                      {{ lote.nombre }}
                    </ion-select-option>
                  </ion-select>
                </ion-item>
                <ion-item class="luxe-input">
                  <ion-label position="stacked">Estado</ion-label>
                  <ion-select formControlName="estado" interface="popover">
                    <ion-select-option value="Activo">Activo</ion-select-option>
                    <ion-select-option value="Vendido">Vendido</ion-select-option>
                    <ion-select-option value="Baja">Baja / Muerto</ion-select-option>
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
  `
})
export class GanadoComponent implements OnInit {
  private supa = inject(SupabaseService);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  
  bovinos: Bovino[] = [];
  lotes: Lote[] = [];
  isModalOpen = false;
  editingItem: Bovino | null = null;
  currentStep = 1;

  bovinoForm: FormGroup;

  constructor() {
    addIcons({ paw, list, add, close, save, person, male, female, calendar, barChart, leaf, pencil, trash, arrowForward, chevronForward, megaphone });
    this.bovinoForm = this.fb.group({
      nombre: ['', Validators.required],
      crotal: ['', Validators.required],
      sexo: ['Hembra', Validators.required],
      raza: [''],
      fecha_nacimiento: [''],
      lote_id: ['', Validators.required],
      estado: ['Activo', Validators.required]
    });
  }

  async ngOnInit() {
    this.loadData();
  }

  async loadData() {
    const { data: bovs } = await this.supa.getAll<Bovino>('bovinos');
    const { data: lots } = await this.supa.getAll<Lote>('lotes');
    this.bovinos = bovs || [];
    this.lotes = lots || [];
  }

  getEdadDesc(b: Bovino): string {
    if (!b.fecha_nacimiento) return 'S/N';
    const birthDate = new Date(b.fecha_nacimiento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const months = today.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? `${age} años` : `${months + (age < 0 ? 12 : 0)} m`;
  }

  isStepValid(step: number): boolean {
    if (step === 1) return !!this.bovinoForm.get('nombre')?.value && !!this.bovinoForm.get('crotal')?.value;
    if (step === 2) return !!this.bovinoForm.get('sexo')?.value;
    return true;
  }

  openAddModal() {
    this.editingItem = null;
    this.currentStep = 1;
    this.bovinoForm.reset({ sexo: 'Hembra', estado: 'Activo' });
    this.isModalOpen = true;
  }

  openEditModal(bovino: Bovino) {
    this.editingItem = bovino;
    this.currentStep = 1;
    this.bovinoForm.patchValue(bovino);
    this.isModalOpen = true;
  }

  closeModal() { this.isModalOpen = false; }

  async saveData() {
    if (this.bovinoForm.invalid) return;
    const payload = this.bovinoForm.value;

    const res = this.editingItem?.id 
      ? await this.supa.update('bovinos', this.editingItem.id, payload)
      : await this.supa.create('bovinos', payload);

    if (res.error) {
      this.presentToast('Error al guardar: ' + res.error, 'danger');
    } else {
      this.presentToast('Ficha de animal actualizada con éxito');
      this.isModalOpen = false;
      this.loadData();
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
            await this.supa.delete('bovinos', id);
            this.presentToast('Ejemplar purgado del sistema', 'warning');
            this.loadData();
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
