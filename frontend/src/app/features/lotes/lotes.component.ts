import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, 
  IonLabel, IonIcon, IonButtons, IonMenuButton, IonFab, IonFabButton,
  IonModal, IonButton, IonInput, IonSelect, IonSelectOption,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonCheckbox, ActionSheetController, ToastController, AlertController,
  IonProgressBar
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';
import { GanadoService } from '../../core/services/ganado.service';
import { Lote, Bovino } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { 
  businessOutline, gridOutline, addCircle, closeOutline, saveOutline, locationOutline, 
  statsChartOutline, createOutline, trashOutline, leafOutline, waterOutline, arrowForwardOutline, filterOutline, layersOutline, documentTextOutline, ellipsisVertical, medicalOutline, moveOutline, listOutline
} from 'ionicons/icons';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PdfService } from '../../core/services/pdf.service';

/**
 * @class LotesComponent
 * @description Módulo de gestión territorial y sanitaria del hato.
 * Permite organizar los animales en lotes, asignar tratamientos masivos
 * y asegurar la trazabilidad exigida por REGA.
 */
@Component({
  selector: 'app-lotes',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonTitle, 
    IonItem, IonLabel, IonIcon, IonButtons, IonMenuButton, 
    IonModal, IonButton, IonInput, IonSelect, IonSelectOption,
    IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonList, IonCheckbox, IonProgressBar
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title class="ion-text-center">Manejo por Lotes</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="openAddModal()" fill="clear" color="primary">
            <ion-icon name="add-circle" slot="start"></ion-icon>
            Nuevo Lote
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-vertical">
      <main class="vac-container animate-fade-in">
        
        <div class="vac-text-stack mb-8">
          <h1 class="vac-page-title">Gestión de Lotes</h1>
          <p class="vac-page-subtitle">Trazabilidad sanitaria y agrupamiento estratégico</p>
        </div>

        <!-- SECCIÓN: ESTADO HÍDRICO (ABREVADEROS) -->
        <div class="water-section mb-8" *ngIf="waterTroughs.length > 0">
           <h2 class="vac-section-title" style="font-size: 1.1rem; font-weight: 700; color: var(--ion-color-dark); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
             <ion-icon name="water-outline" color="primary"></ion-icon> Estado Hídrico
           </h2>
           <ion-grid fixed class="ion-no-padding">
             <ion-row>
               <ion-col size="12" size-sm="6" size-md="4" size-lg="3" *ngFor="let w of waterTroughs; trackBy: trackById">
                 <ion-card class="uniform-card" style="--border-radius: 12px; font-size: 14px; box-shadow: none; border: 1px solid var(--ion-color-light-shade);">
                   <ion-card-header class="pb-0 pt-3">
                     <ion-card-title style="font-size: 1rem; font-weight: 700; color: var(--ion-color-dark);">
                       {{ w.nombre }}
                     </ion-card-title>
                     <p class="text-xs mt-1 uppercase font-semibold" 
                        [class.color-danger]="w.nivel_llenado < 20" 
                        [class.color-warning]="w.nivel_llenado >= 20 && w.nivel_llenado <= 50" 
                        [class.color-primary]="w.nivel_llenado > 50">
                       Nivel: {{ w.nivel_llenado }}%
                     </p>
                   </ion-card-header>
                   <ion-card-content class="pt-2 pb-2">
                     <ion-progress-bar [value]="w.nivel_llenado / 100" [color]="getWaterColor(w.nivel_llenado)" class="mb-3" style="height: 6px; border-radius: 4px;"></ion-progress-bar>
                     <div class="flex justify-between items-center mt-2">
                       <ion-button fill="clear" size="small" (click)="cleanTrough(w.id)" color="medium" style="font-size: 12px; text-transform: none; --padding-start: 0; --padding-end: 0;">
                         <ion-icon name="water-outline" slot="start"></ion-icon> Registrar Limpieza
                       </ion-button>
                       <ion-button fill="clear" size="small" (click)="updateTroughLevel(w)" color="primary" style="font-size: 12px; text-transform: none; --padding-start: 0; --padding-end: 0;">
                         Actualizar Nivel
                       </ion-button>
                     </div>
                   </ion-card-content>
                 </ion-card>
               </ion-col>
             </ion-row>
           </ion-grid>
        </div>

        <ion-grid fixed class="ion-no-padding">
          <ion-row>
            <ion-col size="12" size-sm="6" size-md="4" size-lg="3" *ngFor="let lote of lotes; trackBy: trackById">
              <ion-card class="uniform-card" style="--border-radius: 12px; font-size: 14px; box-shadow: none; border: 1px solid var(--ion-color-light-shade);">
                <ion-card-header class="pb-0">
                  <div class="flex justify-between items-start">
                    <div>
                      <ion-card-title style="font-size: 1.1rem; font-weight: 700; color: var(--ion-color-dark);">
                        {{ lote.nombre }}
                      </ion-card-title>
                      <p class="text-xs color-medium mt-1 uppercase font-semibold tracking-wide">
                        {{ lote['tipo'] || 'General' }}
                      </p>
                    </div>
                    <div class="vac-icon-circle bg-forest-light">
                      <ion-icon name="layers-outline" class="color-forest"></ion-icon>
                    </div>
                  </div>
                </ion-card-header>

                <ion-card-content class="pt-4">
                  <div class="flex items-center justify-between mb-4">
                    <div class="vac-info-item">
                      <span class="vac-label-mini">Cabezas</span>
                      <span class="vac-value-sm">{{ getAnimalCount(lote.id) }}</span>
                    </div>
                    <div class="vac-info-item text-right">
                      <span class="vac-label-mini">Carga (UGB)</span>
                      <span class="vac-value-sm color-forest">{{ getUgbForLote(lote.id) }}</span>
                    </div>
                  </div>

                  <ion-button expand="block" fill="outline" color="primary" class="mt-2" (click)="openAcciones(lote)">
                    Acciones <ion-icon name="ellipsis-vertical" slot="end"></ion-icon>
                  </ion-button>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <div *ngIf="lotes.length === 0" class="vac-empty-state">
          <div class="vac-empty-icon">
            <ion-icon name="layers-outline"></ion-icon>
          </div>
          <h2>Sin lotes configurados</h2>
          <p>Crea recintos o potreros para empezar a organizar tu ganado.</p>
        </div>

      </main>

      <!-- MODAL DE CREACIÓN/EDICIÓN DE LOTE -->
      <ion-modal [isOpen]="isModalOpen" (didDismiss)="closeModal()" class="vac-modal">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar>
              <ion-title>{{ editingItem ? 'Actualizar Lote' : 'Nuevo Lote' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeModal()" class="color-medium">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          
          <ion-content class="ion-padding vac-modal-content">
            <form [formGroup]="loteForm">
              <ion-item class="vac-input">
                <ion-label position="stacked">Nombre del Lote *</ion-label>
                <ion-input type="text" formControlName="nombre" placeholder="Ej: Lote Engorde 1"></ion-input>
              </ion-item>

              <ion-item class="vac-input">
                <ion-label position="stacked">Tipo de Lote *</ion-label>
                <ion-select formControlName="tipo" interface="action-sheet" placeholder="Selecciona el propósito">
                  <ion-select-option value="Cebo">Cebo</ion-select-option>
                  <ion-select-option value="Reposición">Reposición</ion-select-option>
                  <ion-select-option value="Venta">Venta</ion-select-option>
                  <ion-select-option value="Sanitario">Sanitario (Cuarentena)</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item class="vac-input">
                <ion-label position="stacked">Ubicación / Coordenadas</ion-label>
                <ion-input type="text" formControlName="ubicacion" placeholder="Ej: Zona Norte"></ion-input>
              </ion-item>

              <ion-item class="vac-input">
                <ion-label position="stacked">Capacidad Estimada (Cabezas)</ion-label>
                <ion-input type="number" formControlName="capacidad" placeholder="0"></ion-input>
              </ion-item>
              
              <div class="mt-8 pt-6 border-t border-gray-100">
                <ion-button (click)="saveData()" [disabled]="loteForm.invalid" class="btn-vac-save" expand="block">
                  <ion-icon name="save-outline" slot="start"></ion-icon> 
                  Guardar Configuración
                </ion-button>
              </div>
            </form>
          </ion-content>
        </ng-template>
      </ion-modal>

      <!-- MODAL AÑADIR ANIMALES -->
      <ion-modal [isOpen]="isAddAnimalsModalOpen" (didDismiss)="closeAddAnimalsModal()" class="vac-modal">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar>
              <ion-title>Asignar a: {{ currentLote?.nombre }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeAddAnimalsModal()" class="color-medium">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <p class="text-sm color-medium mb-4">Selecciona los animales para moverlos a este lote.</p>
            <ion-list>
              <ion-item *ngFor="let bovino of availableAnimals">
                <ion-checkbox slot="start" (ionChange)="toggleAnimalSelection(bovino.id, $event)"></ion-checkbox>
                <ion-label>
                  <h2>{{ bovino.crotal }} - {{ bovino.nombre || 'Sin Nombre' }}</h2>
                  <p>{{ bovino.raza }} | Peso actual: {{ $any(bovino).peso || 'N/D' }} kg</p>
                </ion-label>
              </ion-item>
            </ion-list>
            
            <div class="mt-6" *ngIf="availableAnimals.length === 0">
              <p class="text-center color-medium">No hay animales disponibles para asignar.</p>
            </div>

            <div class="mt-8">
              <ion-button (click)="confirmAddAnimals()" expand="block" [disabled]="selectedAnimalIds.length === 0">
                Asignar {{ selectedAnimalIds.length }} Animales
              </ion-button>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>

      <!-- MODAL TRATAMIENTO MASIVO -->
      <ion-modal [isOpen]="isTreatmentModalOpen" (didDismiss)="closeTreatmentModal()" class="vac-modal">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar>
              <ion-title>Tratamiento Sanitario</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeTreatmentModal()" class="color-medium">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <div class="vac-icon-ring ion-text-center mb-4">
              <ion-icon name="medical-outline" color="danger"></ion-icon>
            </div>
            <h3 class="text-center font-bold mb-2">Tratamiento para: {{ currentLote?.nombre }}</h3>
            <p class="text-center text-sm color-medium mb-6">Aplica medicación a todos los animales del lote cumpliendo con la normativa REGA.</p>
            
            <form [formGroup]="treatmentForm">
              <ion-item class="vac-input">
                <ion-label position="stacked">Producto / Medicamento *</ion-label>
                <ion-input type="text" formControlName="producto" placeholder="Ej: Ivermectina"></ion-input>
              </ion-item>

              <ion-item class="vac-input">
                <ion-label position="stacked">Tipo de Tratamiento *</ion-label>
                <ion-select formControlName="tipo" interface="popover">
                  <ion-select-option value="Vacunación">Vacunación</ion-select-option>
                  <ion-select-option value="Desparasitación">Desparasitación</ion-select-option>
                  <ion-select-option value="Tratamiento">Tratamiento Curativo</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item class="vac-input">
                <ion-label position="stacked">Días de Retiro (Espera Carne/Leche) *</ion-label>
                <ion-input type="number" formControlName="dias_retiro" placeholder="Ej: 21"></ion-input>
              </ion-item>
              <p class="text-xs color-danger mt-1 ml-4">* Fundamental para seguridad alimentaria.</p>

              <div class="mt-8">
                <ion-button (click)="confirmMassTreatment()" [disabled]="treatmentForm.invalid" color="danger" expand="block">
                  <ion-icon name="medical-outline" slot="start"></ion-icon>
                  Aplicar a todo el Lote
                </ion-button>
              </div>
            </form>
          </ion-content>
        </ng-template>
      </ion-modal>

    </ion-content>
  `
})
export class LotesComponent implements OnInit {
  private supa = inject(SupabaseService);
  public ganadoService = inject(GanadoService);
  private fb = inject(FormBuilder);
  private actionSheetCtrl = inject(ActionSheetController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  
  lotes: any[] = []; // Usamos any o interfaz extendida para incluir tipo y estado
  waterTroughs: any[] = []; // Para el Estado Hídrico
  
  // Modals state
  isModalOpen = false;
  isAddAnimalsModalOpen = false;
  isTreatmentModalOpen = false;
  
  editingItem: any | null = null;
  currentLote: any | null = null;
  
  loteForm: FormGroup;
  treatmentForm: FormGroup;
  
  // Selection
  availableAnimals: Bovino[] = [];
  selectedAnimalIds: string[] = [];

  constructor() {
    addIcons({ businessOutline, gridOutline, addCircle, closeOutline, saveOutline, locationOutline, statsChartOutline, createOutline, trashOutline, leafOutline, waterOutline, arrowForwardOutline, filterOutline, layersOutline, documentTextOutline, ellipsisVertical, medicalOutline, moveOutline, listOutline });
    
    this.loteForm = this.fb.group({
      nombre: ['', Validators.required],
      tipo: ['Cebo', Validators.required],
      ubicacion: [''],
      capacidad: [null]
    });

    this.treatmentForm = this.fb.group({
      producto: ['', Validators.required],
      tipo: ['Vacunación', Validators.required],
      dias_retiro: [0, [Validators.required, Validators.min(0)]]
    });
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    // Usamos el nuevo método optimizado REGA
    const { data, error } = await this.supa.getBatches();
    if (!error) {
      this.lotes = data || [];
    } else {
      this.presentToast('Error al cargar lotes', 'danger');
    }

    // Cargar estado hídrico
    const { data: wData } = await this.supa.getWaterTroughs();
    if (wData) {
      this.waterTroughs = wData;
    }
  }

  trackById(index: number, item: any): string {
    return item?.id || index.toString();
  }

  getAnimalCount(loteId: string): number {
    return this.ganadoService.bovinos().filter(b => b.lote_id === loteId).length;
  }

  getUgbForLote(loteId: string): number {
    const animals = this.ganadoService.bovinos().filter(b => b.lote_id === loteId);
    const total = animals.reduce((acc, b) => acc + this.ganadoService.getUgb(b), 0);
    return Number(total.toFixed(1));
  }

  openAddModal() {
    this.editingItem = null;
    this.loteForm.reset({ tipo: 'Cebo' });
    this.isModalOpen = true;
  }

  closeModal() { this.isModalOpen = false; }

  async saveData() {
    if (this.loteForm.invalid) return;
    const payload = this.loteForm.value;

    const res = this.editingItem?.id 
      ? await this.supa.update('lotes', this.editingItem.id, payload)
      : await this.supa.createBatch(payload.nombre, payload.tipo);

    if (res.error) {
      this.presentToast('Error al guardar: ' + res.error, 'danger');
    } else {
      this.presentToast('Lote configurado exitosamente');
      this.isModalOpen = false;
      this.loadData();
    }
  }

  // =========================================================================
  // ACTION SHEET Y OPERACIONES REGA
  // =========================================================================

  async openAcciones(lote: any) {
    this.currentLote = lote;
    const actionSheet = await this.actionSheetCtrl.create({
      header: `Opciones: ${lote.nombre}`,
      subHeader: 'Trazabilidad y Manejo',
      buttons: [
        {
          text: 'Añadir Animales',
          icon: 'list-outline',
          handler: () => {
            this.openAddAnimalsModal();
          }
        },
        {
          text: 'Aplicar Tratamiento Masivo',
          icon: 'medical-outline',
          handler: () => {
            this.openTreatmentModal();
          }
        },
        {
          text: 'Editar Lote',
          icon: 'create-outline',
          handler: () => {
            this.editingItem = lote;
            this.loteForm.patchValue(lote);
            this.isModalOpen = true;
          }
        },
        {
          text: 'Eliminar / Purgar',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.confirmDelete(lote.id);
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  // AÑADIR ANIMALES
  openAddAnimalsModal() {
    // Buscar animales que no están en este lote
    this.availableAnimals = this.ganadoService.bovinos().filter(b => b.lote_id !== this.currentLote.id);
    this.selectedAnimalIds = [];
    this.isAddAnimalsModalOpen = true;
  }

  closeAddAnimalsModal() {
    this.isAddAnimalsModalOpen = false;
  }

  toggleAnimalSelection(id: string, event: any) {
    if (event.detail.checked) {
      this.selectedAnimalIds.push(id);
    } else {
      this.selectedAnimalIds = this.selectedAnimalIds.filter(aid => aid !== id);
    }
  }

  async confirmAddAnimals() {
    if (this.selectedAnimalIds.length === 0) return;
    
    const { error } = await this.supa.assignAnimalsToBatch(this.selectedAnimalIds, this.currentLote.id);
    
    if (error) {
      this.presentToast('Error al asignar animales', 'danger');
    } else {
      this.presentToast(`${this.selectedAnimalIds.length} animales asignados a ${this.currentLote.nombre}`);
      this.closeAddAnimalsModal();
    }
  }

  // TRATAMIENTO MASIVO
  openTreatmentModal() {
    this.treatmentForm.reset({ tipo: 'Vacunación', dias_retiro: 0 });
    this.isTreatmentModalOpen = true;
  }

  closeTreatmentModal() {
    this.isTreatmentModalOpen = false;
  }

  async confirmMassTreatment() {
    if (this.treatmentForm.invalid) return;
    
    const formData = this.treatmentForm.value;
    const { dias_retiro, ...treatmentData } = formData;
    
    const { error } = await this.supa.applyMassTreatment(this.currentLote.id, treatmentData, dias_retiro);
    
    if (error) {
      this.presentToast('Error en el tratamiento masivo: ' + error.message, 'danger');
    } else {
      this.presentToast('Tratamiento registrado. Tiempo de retiro aplicado.', 'success');
      this.closeTreatmentModal();
    }
  }

  // ELIMINAR LOTE
  async confirmDelete(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Purgar Lote',
      message: '¿Confirma la eliminación permanente de este recinto?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Eliminar', 
          role: 'destructive',
          handler: async () => {
            await this.supa.delete('lotes', id);
            this.presentToast('Lote purgado del sistema', 'warning');
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

  // =========================================================================
  // GESTIÓN HÍDRICA (Abrevaderos)
  // =========================================================================
  
  getWaterColor(level: number): string {
    if (level > 50) return 'primary';
    if (level >= 20) return 'warning';
    return 'danger';
  }

  async cleanTrough(id: string) {
    const { error } = await this.supa.registerTroughCleaning(id);
    if (!error) {
      this.presentToast('Limpieza registrada con éxito. Estado: Operativo', 'success');
      this.loadData();
    } else {
      this.presentToast('Error al registrar limpieza de bioseguridad', 'danger');
    }
  }

  async updateTroughLevel(w: any) {
    const alert = await this.alertCtrl.create({
      header: 'Actualizar Nivel',
      message: `Introduce el porcentaje de agua actual para ${w.nombre} (0 - 100%).`,
      inputs: [
        {
          name: 'level',
          type: 'number',
          min: 0,
          max: 100,
          value: w.nivel_llenado,
          placeholder: '%'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'color-medium' },
        {
          text: 'Guardar',
          handler: async (data) => {
            const num = parseInt(data.level, 10);
            if (!isNaN(num)) {
              const { error } = await this.supa.updateWaterLevel(w.id, num);
              if (!error) {
                this.presentToast(`Nivel actualizado a ${num}%`, 'success');
                this.loadData();
              } else {
                this.presentToast('Error al actualizar nivel', 'danger');
              }
            }
          }
        }
      ],
      mode: 'ios',
      cssClass: 'vac-alert'
    });
    await alert.present();
  }
}

