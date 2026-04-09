import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, 
  IonLabel, IonIcon, IonButtons, IonMenuButton, IonFab, IonFabButton,
  IonModal, IonButton, IonInput,
  IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';
import { GanadoService } from '../../core/services/ganado.service';
import { Lote } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { 
  business, grid, add, close, save, location, 
  statsChart, pencil, trash, leaf, water, arrowForward
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
    IonGrid, IonRow, IonCol
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary" class="luxe-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="text-white"></ion-menu-button>
        </ion-buttons>
        <ion-title class="luxe-title">Potreros y Recintos</ion-title>
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
            <h1 class="page-h1-rustic">Recintos & Potreros</h1>
            <p class="page-p-rustic">Organización espacial y rotación de pastos.</p>
          </div>
        </div>

        <ion-grid class="ion-no-padding">
          <ion-row>
            <ion-col size="12" size-md="6" size-xl="4" *ngFor="let lote of lotes">
              <div class="field-card-body-luxe animate-slide-up">
                <div class="card-header-flex">
                  <div class="card-icon-box bg-secondary">
                    <ion-icon name="leaf"></ion-icon>
                  </div>
                  <div class="card-title-stack">
                    <strong>{{ lote.nombre }}</strong>
                    <span>{{ lote.ubicacion || 'Sin ubicación' }}</span>
                  </div>
                </div>

                <div class="card-data-grid">
                  <div class="card-data-item">
                    <span class="label">Animales hoy</span>
                    <span class="value highlight text-xl">{{ getAnimalCount(lote.id) }} Cabezas</span>
                  </div>
                  <div class="card-data-item">
                    <span class="label">Carga de Pasto (UGB)</span>
                    <span class="value color-success font-bold">{{ getUgbForLote(lote.id) }}</span>
                  </div>
                </div>

                <div class="card-footer-actions">
                  <ion-button fill="clear" (click)="openEditModal(lote)" color="dark">
                    <ion-icon name="pencil" slot="start"></ion-icon> Editar
                  </ion-button>
                  <ion-button fill="clear" (click)="confirmDelete(lote.id)" color="danger">
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
        <ion-fab-button (click)="openAddModal()" class="bg-var-secondary">
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
