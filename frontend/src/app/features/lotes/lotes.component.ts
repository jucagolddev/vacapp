import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, 
  IonLabel, IonIcon, IonButtons, IonMenuButton, IonFab, IonFabButton,
  IonModal, IonButton, IonInput,
  IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonAvatar
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';
import { GanadoService } from '../../core/services/ganado.service';
import { Lote } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { 
  businessOutline, gridOutline, addCircle, closeOutline, saveOutline, locationOutline, 
  statsChartOutline, createOutline, trashOutline, leafOutline, waterOutline, arrowForwardOutline, filterOutline, layersOutline
} from 'ionicons/icons';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController, AlertController } from '@ionic/angular/standalone';

/**
 * Componente para el Módulo de Lotes/Recintos - Versión Rústica.
 * Refactorizado: 100% Sincronización de colores con _variables.scss.
 */
@Component({
  selector: 'app-lotes',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonTitle, 
    IonItem, IonLabel, IonIcon, IonButtons, IonMenuButton, 
    IonFab, IonFabButton, IonModal, IonButton, IonInput, 
    IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonAvatar
  ],
  template: `
    <ion-header class="ion-no-border header-luxe">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button class="color-forest"></ion-menu-button>
        </ion-buttons>
        <ion-title>Potreros y Recintos</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" class="color-forest">
            <ion-icon name="filter-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-vertical">
      <div class="luxe-container animate-fade-in">
        
        <div class="luxe-text-stack mb-8">
          <h1 class="page-h1-rustic">Gestión de Potreros</h1>
          <p class="page-p-rustic">Organiza y monitorea la carga animal por recinto</p>
        </div>

        <ion-grid class="ion-no-padding">
          <ion-row>
            <ion-col size="12" size-md="6" size-xl="4" *ngFor="let lote of lotes">
              <div class="bi-main-card mb-6 animate-fade-in">
                <div class="card-header-flex">
                  <div class="card-title-stack">
                    <h3 class="card-title-luxe">{{ lote.nombre }}</h3>
                    <p class="card-subtitle-luxe">
                      <ion-icon name="location-outline" class="mr-1"></ion-icon>
                      {{ lote.ubicacion || 'Sector General' }}
                    </p>
                  </div>
                  <div class="luxe-icon-circle bg-forest-light">
                    <ion-icon name="layers-outline" class="color-forest"></ion-icon>
                  </div>
                </div>

                <div class="mt-6 flex items-center justify-between">
                  <div class="luxe-info-item">
                    <span class="luxe-label-mini">Animales</span>
                    <span class="luxe-value-sm">{{ getAnimalCount(lote.id) }} <small>Cabezas</small></span>
                  </div>
                  <div class="luxe-info-item text-right">
                    <span class="luxe-label-mini">Carga Total</span>
                    <span class="luxe-value-sm color-forest">{{ getUgbForLote(lote.id) }} <small>UGB</small></span>
                  </div>
                </div>

                <div class="luxe-card-footer mt-6 pt-4 border-t flex justify-end gap-2">
                   <button class="luxe-btn-icon bg-light" (click)="openEditModal(lote)">
                      <ion-icon name="create-outline"></ion-icon>
                   </button>
                   <button class="luxe-btn-icon bg-light color-danger" (click)="confirmDelete(lote.id)">
                      <ion-icon name="trash-outline"></ion-icon>
                   </button>
                </div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <div *ngIf="lotes.length === 0" class="luxe-empty-state">
          <div class="empty-icon-ring">
            <ion-icon name="layers-outline"></ion-icon>
          </div>
          <h2>Sin lotes configurados</h2>
          <p>Crea recintos o potreros para empezar a organizar tu ganado.</p>
          <ion-button fill="solid" (click)="openAddModal()" class="btn-luxe-primary mt-4">
            <ion-icon name="add" slot="start"></ion-icon> Crear Nuevo Lote
          </ion-button>
        </div>

      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="animate-jump-in">
        <ion-fab-button (click)="openAddModal()" class="fab-luxe">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- MODAL DE LOTE -->
      <ion-modal [isOpen]="isModalOpen" (didDismiss)="closeModal()" class="luxe-modal">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar>
              <ion-title>{{ editingItem ? 'Actualizar Recinto' : 'Nuevo Recinto' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeModal()" class="color-medium">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          
          <ion-content class="ion-padding luxe-modal-content">
            <div class="form-intro mb-6">
               <div class="icon-ring-luxe bg-wheat mb-3">
                  <ion-icon name="layers-outline" class="color-earth text-3xl"></ion-icon>
               </div>
               <h3>Configuración de Espacio</h3>
               <p>Define las características del potrero o recinto.</p>
            </div>

            <form [formGroup]="loteForm" class="luxe-form-stack">
              <div class="luxe-input-group">
                <label class="luxe-label">Nombre del Lote *</label>
                <input type="text" formControlName="nombre" placeholder="Ej: Potrero El Roble" class="luxe-input-field">
              </div>

              <div class="luxe-input-group">
                <label class="luxe-label">Ubicación / Coordenadas</label>
                <input type="text" formControlName="ubicacion" placeholder="Ej: Zona Norte - Sector A" class="luxe-input-field">
              </div>

              <div class="luxe-input-group">
                <label class="luxe-label">Capacidad Estimada (Cabezas)</label>
                <input type="number" formControlName="capacidad" placeholder="0" class="luxe-input-field">
              </div>
              
              <div class="mt-8 pt-6 border-t border-gray-100">
                <ion-button (click)="saveData()" [disabled]="loteForm.invalid" class="btn-luxe-save" expand="block">
                  <ion-icon name="save-outline" slot="start"></ion-icon> 
                  Guardar Configuración
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
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  
  lotes: Lote[] = [];
  isModalOpen = false;
  editingItem: Lote | null = null;
  loteForm: FormGroup;

  constructor() {
    addIcons({ businessOutline, gridOutline, addCircle, closeOutline, saveOutline, locationOutline, statsChartOutline, createOutline, trashOutline, leafOutline, waterOutline, arrowForwardOutline, filterOutline, layersOutline });
    this.loteForm = this.fb.group({
      nombre: ['', Validators.required],
      ubicacion: [''],
      capacidad: [null]
    });
  }

  async ngOnInit() {
    this.loadData();
  }

  async loadData() {
    const { data } = await this.supa.getAll<Lote>('lotes');
    this.lotes = data || [];
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
    this.loteForm.reset();
    this.isModalOpen = true;
  }

  openEditModal(lote: Lote) {
    this.editingItem = lote;
    this.loteForm.patchValue(lote);
    this.isModalOpen = true;
  }

  closeModal() { this.isModalOpen = false; }

  async saveData() {
    if (this.loteForm.invalid) return;
    const payload = this.loteForm.value;

    const res = this.editingItem?.id 
      ? await this.supa.update('lotes', this.editingItem.id, payload)
      : await this.supa.create('lotes', payload);

    if (res.error) {
      this.presentToast('Error al guardar: ' + res.error, 'danger');
    } else {
      this.presentToast('Configuración de lote salvaguardada');
      this.isModalOpen = false;
      this.loadData();
    }
  }

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
}
