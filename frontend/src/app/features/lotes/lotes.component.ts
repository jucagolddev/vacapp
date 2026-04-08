import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, 
  IonLabel, IonBadge, IonIcon, IonButtons, IonMenuButton, IonFab, IonFabButton,
  IonModal, IonButton, IonInput, IonSelect, IonSelectOption,
  IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';
import { Lote } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { 
  business, grid, add, close, save, location, 
  statsChart, pencil, trash, leaf, water, arrowForward
} from 'ionicons/icons';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController, AlertController } from '@ionic/angular/standalone';

/**
 * Componente para el Módulo de Lotes/Recintos - Edición Lujo.
 * Refactorizado: 100% Sincronización de colores con _variables.scss.
 */
@Component({
  selector: 'app-lotes',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonTitle, 
    IonList, IonItem, IonLabel, IonBadge, IonIcon, IonButtons, IonMenuButton, 
    IonFab, IonFabButton, IonModal, IonButton, IonInput, IonSelect, IonSelectOption,
    IonGrid, IonRow, IonCol
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary" class="luxe-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="text-white"></ion-menu-button>
        </ion-buttons>
        <ion-title class="luxe-title">Gestión de Lotes</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="luxe-bg-forest">
      <div class="luxe-container animate-fade-in">
        
        <!-- Cabecera de Sección -->
        <div class="luxe-header-content">
          <div class="luxe-icon-box bg-earth">
            <ion-icon name="grid"></ion-icon>
          </div>
          <div class="luxe-text-stack">
            <h1 class="luxe-h1-premium">Recintos & Potreros</h1>
            <p class="luxe-p-premium">Organización espacial y rotación de pastos.</p>
          </div>
        </div>

        <ion-grid class="ion-no-padding">
          <ion-row>
            <ion-col size="12" size-md="6" size-xl="4" *ngFor="let lote of lotes">
              <div class="field-card-body-luxe animate-slide-up">
                <div class="field-header-luxe">
                  <div class="field-icon-box">
                    <ion-icon name="leaf" class="color-forest"></ion-icon>
                  </div>
                  <div class="field-info-luxe">
                    <h3 class="animal-name-txt">{{ lote.nombre }}</h3>
                    <div class="field-loc-luxe">
                      <ion-icon name="location"></ion-icon>
                      <span>{{ lote.ubicacion || 'Ubicación no definida' }}</span>
                    </div>
                  </div>
                </div>

                <div class="luxe-details-panel">
                  <div class="detail-row">
                    <span class="detail-lbl">Ocupación Actual</span>
                    <strong class="detail-val">-- Animales</strong>
                  </div>
                  <div class="detail-row" *ngIf="lote.capacidad">
                    <span class="detail-lbl">Capacidad Máxima</span>
                    <strong class="detail-val">{{ lote.capacidad }} cabezas</strong>
                  </div>
                </div>

                <div class="luxe-card-footer">
                  <ion-button fill="clear" (click)="openEditModal(lote)" class="color-forest">
                    <ion-icon name="pencil" slot="start"></ion-icon> Editar
                  </ion-button>
                  <ion-button fill="clear" (click)="confirmDelete(lote.id)" class="color-earth">
                    <ion-icon name="trash" slot="start"></ion-icon> Purgar
                  </ion-button>
                </div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <div *ngIf="lotes.length === 0" class="luxe-empty-state">
          <div class="empty-icon-ring">
            <ion-icon name="grid"></ion-icon>
          </div>
          <h2>Sin lotes</h2>
          <p>Crea recintos para empezar a organizar tu ganado.</p>
          <ion-button fill="solid" (click)="openAddModal()" class="btn-luxe-save">
            <ion-icon name="add" slot="start"></ion-icon> Crear Nuevo Lote
          </ion-button>
        </div>

      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="openAddModal()" style="--background: var(--ion-color-secondary)">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- MODAL DE LOTE -->
      <ion-modal [isOpen]="isModalOpen" (didDismiss)="closeModal()" class="luxe-modal">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar color="primary">
              <ion-title>{{ editingItem ? 'Actualizar Recinto' : 'Nuevo Recinto' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeModal()">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          
          <ion-content class="ion-padding luxe-modal-content">
            <div class="form-intro">
               <ion-icon name="grid" class="color-earth text-3xl"></ion-icon>
               <h3>Configuración de Espacio</h3>
               <p>Define las características técnicas del potrero o recinto.</p>
            </div>

            <form [formGroup]="loteForm">
              <ion-item class="luxe-input">
                <ion-label position="stacked">Nombre del Lote *</ion-label>
                <ion-input formControlName="nombre" placeholder="Ej: Potrero El Roble"></ion-input>
              </ion-item>

              <ion-item class="luxe-input">
                <ion-label position="stacked">Ubicación / Coordenadas</ion-label>
                <ion-input formControlName="ubicacion" placeholder="Ej: Zona Norte - Sector A"></ion-input>
              </ion-item>

              <ion-item class="luxe-input">
                <ion-label position="stacked">Capacidad (Cabezas)</ion-label>
                <ion-input type="number" formControlName="capacidad" placeholder="0"></ion-input>
              </ion-item>
              
              <div class="luxe-modal-footer">
                <ion-button (click)="saveData()" [disabled]="loteForm.invalid" class="btn-luxe-save w-full">
                  <ion-icon name="save" slot="start"></ion-icon> Guardar Configuración
                </ion-button>
              </div>
            </form>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    /* Lotes: Estilos estructurales mínimos (Heredados de _luxe.scss) */
    .field-header-luxe { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
    .field-icon-box { 
      width: 48px; height: 48px; background: rgba(27, 67, 50, 0.05); 
      border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; 
    }
    .field-info-luxe { flex: 1; }
    .field-loc-luxe { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--ion-color-secondary); font-weight: 700; margin-top: 4px; }
    .detail-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
  `]
})
export class LotesComponent implements OnInit {
  private supa = inject(SupabaseService);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  
  lotes: Lote[] = [];
  isModalOpen = false;
  editingItem: Lote | null = null;
  loteForm: FormGroup;

  constructor() {
    addIcons({ business, grid, add, close, save, location, statsChart, pencil, trash, leaf, water, arrowForward });
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
