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
import { PdfService } from '../../core/services/pdf.service';
import { 
  businessOutline, gridOutline, addCircle, closeOutline, saveOutline, locationOutline, 
  statsChartOutline, createOutline, trashOutline, leafOutline, waterOutline, arrowForwardOutline, filterOutline, layersOutline, documentTextOutline
} from 'ionicons/icons';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController, AlertController } from '@ionic/angular/standalone';

/**
 * Componente para el Módulo de Lotes/Recintos - Versión Estándar.
 * Refactorizado: 100% Sincronización de colores y nombres vac-.
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
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title class="ion-text-center">Potreros y Recintos</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="exportarPDF()" fill="clear" aria-label="Exportar PDF">
            <ion-icon name="document-text-outline"></ion-icon>
          </ion-button>
          <ion-button fill="clear" aria-label="Filtrar">
            <ion-icon name="filter-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-vertical">
      <main class="vac-container animate-fade-in">
        
        <div class="vac-text-stack mb-8">
          <h1 class="vac-page-title">Gestión de Potreros</h1>
          <p class="vac-page-subtitle">Organiza y monitorea la carga animal por recinto</p>
        </div>

        <ion-grid fixed class="ion-no-padding">
          <ion-row>
            <ion-col size="12" size-md="6" size-lg="4" *ngFor="let lote of lotes; trackBy: trackById">
              <article class="uniform-card">
                <div class="vac-card-header-flex">
                  <div class="vac-card-title-group">
                    <h3 class="vac-card-title">{{ lote.nombre }}</h3>
                    <p class="vac-card-subtitle">
                      <ion-icon name="location-outline" class="mr-1"></ion-icon>
                      {{ lote.ubicacion || 'Sector General' }}
                    </p>
                  </div>
                  <div class="vac-icon-circle bg-forest-light">
                    <ion-icon name="layers-outline" class="color-forest"></ion-icon>
                  </div>
                </div>

                <div class="mt-6 flex items-center justify-between">
                  <div class="vac-info-item">
                    <span class="vac-label-mini">Animales</span>
                    <span class="vac-value-sm">{{ getAnimalCount(lote.id) }} <small>Cabezas</small></span>
                  </div>
                  <div class="vac-info-item text-right">
                    <span class="vac-label-mini">Carga Total</span>
                    <span class="vac-value-sm color-forest">{{ getUgbForLote(lote.id) }} <small>UGB</small></span>
                  </div>
                </div>

                <div class="vac-card-footer mt-6 pt-4 border-t-light flex justify-end gap-2">
                   <button class="vac-btn-icon bg-light" (click)="openEditModal(lote)" aria-label="Editar">
                      <ion-icon name="create-outline"></ion-icon>
                   </button>
                   <button class="vac-btn-icon bg-light color-danger" (click)="confirmDelete(lote.id)" aria-label="Eliminar">
                      <ion-icon name="trash-outline"></ion-icon>
                   </button>
                </div>
              </article>
            </ion-col>
          </ion-row>
        </ion-grid>

        <div *ngIf="lotes.length === 0" class="vac-empty-state">
          <div class="vac-empty-icon">
            <ion-icon name="layers-outline"></ion-icon>
          </div>
          <h2>Sin lotes configurados</h2>
          <p>Crea recintos o potreros para empezar a organizar tu ganado.</p>
          <ion-button fill="solid" (click)="openAddModal()" class="btn-vac-primary mt-4">
            <ion-icon name="add" slot="start"></ion-icon> Crear Nuevo Lote
          </ion-button>
        </div>

      </main>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="animate-jump-in">
        <ion-fab-button (click)="openAddModal()" class="vac-fab" aria-label="Añadir lote">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- MODAL DE LOTE -->
      <ion-modal [isOpen]="isModalOpen" (didDismiss)="closeModal()" class="vac-modal">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar>
              <ion-title>{{ editingItem ? 'Actualizar Recinto' : 'Nuevo Recinto' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeModal()" class="color-medium" aria-label="Cerrar modal">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          
           <ion-content class="ion-padding vac-modal-content">
            <div class="vac-modal-header ion-text-center ion-padding-vertical">
               <div class="vac-icon-ring ion-margin-bottom">
                  <ion-icon name="layers-outline"></ion-icon>
               </div>
               <h3 class="vac-modal-title">Configuración de Espacio</h3>
               <p class="vac-modal-subtitle">Define las características del potrero o recinto.</p>
            </div>

            <form [formGroup]="loteForm">
              <ion-item class="vac-input">
                <ion-label position="stacked">Nombre del Lote *</ion-label>
                <ion-input type="text" formControlName="nombre" placeholder="Ej: Potrero El Roble"></ion-input>
              </ion-item>

              <ion-item class="vac-input">
                <ion-label position="stacked">Ubicación / Coordenadas</ion-label>
                <ion-input type="text" formControlName="ubicacion" placeholder="Ej: Zona Norte - Sector A"></ion-input>
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
    </ion-content>
  `
})
export class LotesComponent implements OnInit {
  private supa = inject(SupabaseService);
  public ganadoService = inject(GanadoService);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private pdfService = inject(PdfService);
  
  lotes: Lote[] = [];
  isModalOpen = false;
  editingItem: Lote | null = null;
  loteForm: FormGroup;

  constructor() {
    addIcons({ businessOutline, gridOutline, addCircle, closeOutline, saveOutline, locationOutline, statsChartOutline, createOutline, trashOutline, leafOutline, waterOutline, arrowForwardOutline, filterOutline, layersOutline, documentTextOutline });
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

  trackById(index: number, item: any): string {
    return item?.id || index.toString();
  }

  async exportarPDF() {
    const headers = [['Código/Nombre', 'Capacidad', 'Ubicación', 'Bovinos']];
    const body = this.lotes.map(l => [
      l.nombre || 'S/N',
      l.capacidad || '0',
      l.ubicacion || '-',
      (this.ganadoService.bovinos().filter(b => b.lote_id === l.id).length) + ' Cabezas'
    ]);

    await this.pdfService.generateTablePDF(
      'Inventario de Potreros y Recintos - Vacapp',
      headers,
      body,
      'inventario_lotes_vacapp'
    );
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
