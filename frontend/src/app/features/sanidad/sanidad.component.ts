import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, 
  IonLabel, IonBadge, IonIcon, IonButtons, IonMenuButton, IonFab, IonFabButton,
  IonModal, IonButton, IonInput, IonSelect, IonSelectOption,
  IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';
import { Sanidad, Bovino } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { 
  medkit, flask, medical, add, close, save, search, 
  calendar, person, pencil, trash, leaf, pulse, water, 
  thermometer, bandage
} from 'ionicons/icons';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastController, AlertController } from '@ionic/angular/standalone';

/**
 * Componente para el Módulo de Sanidad Animal - Versión Rústica.
 * Refactorizado: 100% Sincronización de colores con _variables.scss.
 * Corregido: Nombres de propiedades sincronizados con Interfaz Sanidad (fecha, tipo).
 */
@Component({
  selector: 'app-sanidad',
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
        <ion-title class="luxe-title">Bioseguridad & Salud</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="luxe-bg-forest">
      <div class="luxe-container animate-fade-in">
        
        <!-- Cabecera de Sección -->
        <div class="luxe-header-content">
          <div class="luxe-icon-box bg-earth">
            <ion-icon name="medkit"></ion-icon>
          </div>
          <div class="luxe-text-stack">
            <h1 class="page-h1-rustic">Historial Clínico</h1>
            <p class="page-p-rustic">Registro de tratamientos y protocolos sanitarios.</p>
          </div>
        </div>

        <!-- Buscador -->
        <div class="rustic-search-wrapper">
          <ion-icon name="search" class="rustic-search-icon"></ion-icon>
          <input 
            type="text" 
            placeholder="Buscar por crotal o tratamiento..." 
            class="rustic-search-input-field"
            (input)="onSearch($event)">
        </div>

        <ion-grid class="ion-no-padding">
          <ion-row>
            <ion-col size="12" size-md="6" size-xl="4" *ngFor="let s of filteredSanidad">
              <div class="health-card-body-luxe animate-slide-up">
                <div class="card-header-flex">
                  <div class="card-icon-box bg-primary">
                     <ion-icon [name]="getHealthIcon(s.tipo)"></ion-icon>
                  </div>
                  <div class="card-title-stack">
                    <strong>{{ s.bovino?.nombre || 'Ejemplar' }}</strong>
                    <span>ID: {{ s.bovino?.crotal || 'S/N' }} - {{ s.tipo }}</span>
                  </div>
                </div>

                <div class="card-data-grid" style="grid-template-columns: 1fr;">
                  <div class="card-data-item">
                    <span class="label">Producto</span>
                    <span class="value">{{ s.producto }}</span>
                  </div>
                  <div class="card-data-item">
                    <span class="label">Fecha Aplicación</span>
                    <span class="value">{{ s.fecha | date:'dd MMM yyyy' }}</span>
                  </div>
                  <div class="card-data-item" *ngIf="s.observaciones">
                    <span class="label">Prescripción</span>
                    <span class="value" style="font-style: italic;">"{{ s.observaciones }}"</span>
                  </div>
                </div>

                <div class="card-footer-actions">
                  <ion-button fill="clear" (click)="openEditModal(s)" color="dark">
                    <ion-icon name="pencil" slot="start"></ion-icon> Editar
                  </ion-button>
                  <ion-button fill="clear" (click)="confirmDelete(s)" color="danger">
                    <ion-icon name="trash" slot="start"></ion-icon> Borrar
                  </ion-button>
                </div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Estado Vacío -->
        <div *ngIf="filteredSanidad.length === 0" class="luxe-empty-state">
          <div class="empty-icon-ring">
            <ion-icon name="bandage"></ion-icon>
          </div>
          <h2>Sin incidencias</h2>
          <p>No se encontraron registros sanitarios para esta búsqueda.</p>
          <ion-button fill="solid" (click)="openAddModal()" class="btn-luxe-save">
            <ion-icon name="add" slot="start"></ion-icon> Registrar Intervención
          </ion-button>
        </div>

      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="openAddModal()" style="--background: var(--ion-color-secondary)">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- MODAL DE FICHA CLÍNICA -->
      <ion-modal [isOpen]="isModalOpen" (didDismiss)="closeModal()" class="luxe-modal">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar color="primary">
              <ion-title>{{ editingItem ? 'Actualizar Ficha' : 'Nueva Intervención' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeModal()">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          
          <ion-content class="ion-padding luxe-modal-content">
            <div class="form-intro">
               <ion-icon name="medkit" class="color-earth text-3xl"></ion-icon>
               <h3>Protocolo Veterinario</h3>
               <p>Registra la intervención para mantener la trazabilidad sanitaria de la explotación.</p>
            </div>

            <form [formGroup]="healthForm">
              <ion-item class="luxe-input">
                <ion-label position="stacked">Identificar Ejemplar *</ion-label>
                <ion-select formControlName="bovino_id" placeholder="Seleccionar animal" interface="popover">
                  <ion-select-option *ngFor="let b of bovinos" [value]="b.id">
                    {{ b.nombre }} ({{ b.crotal }})
                  </ion-select-option>
                </ion-select>
              </ion-item>

              <div class="luxe-item-group">
                <ion-item class="luxe-input half">
                  <ion-label position="stacked">Fecha Tratamiento *</ion-label>
                  <ion-input type="date" formControlName="fecha"></ion-input>
                </ion-item>
                <ion-item class="luxe-input half">
                  <ion-label position="stacked">Tipo de Evento</ion-label>
                  <ion-select formControlName="tipo" interface="popover">
                    <ion-select-option value="Vacunación">Vacunación</ion-select-option>
                    <ion-select-option value="Desparasitación">Desparasitación</ion-select-option>
                    <ion-select-option value="Saneamiento">Saneamiento</ion-select-option>
                    <ion-select-option value="Enfermedad">Enfermedad</ion-select-option>
                  </ion-select>
                </ion-item>
              </div>

              <ion-item class="luxe-input">
                <ion-label position="stacked">Producto / Medicamento *</ion-label>
                <ion-input formControlName="producto" placeholder="Nombre comercial o principio activo"></ion-input>
              </ion-item>

              <ion-item class="luxe-input">
                <ion-label position="stacked">Observaciones Veterinarias</ion-label>
                <ion-input formControlName="observaciones" placeholder="Dosis, vía, notas clínicas..."></ion-input>
              </ion-item>
              
              <div class="luxe-modal-footer">
                <ion-button (click)="saveData()" [disabled]="healthForm.invalid" class="btn-luxe-save w-full">
                  <ion-icon name="save" slot="start"></ion-icon> Archivar Ficha Clínica
                </ion-button>
              </div>
            </form>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `
})
export class SanidadComponent implements OnInit {
  private supa = inject(SupabaseService);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  
  sanidadRecords: Sanidad[] = [];
  filteredSanidad: Sanidad[] = [];
  bovinos: Bovino[] = [];
  
  isModalOpen = false;
  editingItem: Sanidad | null = null;
  healthForm: FormGroup;

  constructor() {
    addIcons({ 
      medkit, flask, medical, add, close, save, search, calendar, 
      person, pencil, trash, leaf, pulse, water, thermometer, bandage 
    });
    
    this.healthForm = this.fb.group({
      bovino_id: ['', Validators.required],
      tipo: ['Vacunación', Validators.required],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      producto: ['', Validators.required],
      observaciones: ['']
    });
  }

  async ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      const { data: records } = await this.supa.getSanidad();
      const { data: bovs } = await this.supa.getAll<Bovino>('bovinos');
      
      this.sanidadRecords = records || [];
      this.filteredSanidad = [...this.sanidadRecords];
      this.bovinos = (bovs || []).filter(b => b.estado === 'Activo');
    } catch (e) {
      console.error('Error cargando datos sanitarios:', e);
    }
  }

  onSearch(event: any) {
    const term = event.target.value.toLowerCase();
    if (!term) {
      this.filteredSanidad = [...this.sanidadRecords];
      return;
    }
    
    this.filteredSanidad = this.sanidadRecords.filter(s => 
      s.bovino?.nombre?.toLowerCase().includes(term) ||
      s.bovino?.crotal?.toLowerCase().includes(term) ||
      s.producto.toLowerCase().includes(term) ||
      s.tipo.toLowerCase().includes(term)
    );
  }

  getHealthIcon(tipo: string): string {
    switch (tipo) {
      case 'Vacunación': return 'medical';
      case 'Desparasitación': return 'flask';
      case 'Saneamiento': return 'leaf';
      case 'Enfermedad': return 'thermometer';
      default: return 'medkit';
    }
  }

  openAddModal() {
    this.editingItem = null;
    this.healthForm.reset({
      tipo: 'Vacunación',
      fecha: new Date().toISOString().split('T')[0]
    });
    this.isModalOpen = true;
  }

  openEditModal(item: Sanidad) {
    this.editingItem = item;
    const { bovino, ...data } = item;
    this.healthForm.patchValue(data);
    this.isModalOpen = true;
  }

  closeModal() { this.isModalOpen = false; }

  async saveData() {
    if (this.healthForm.invalid) return;

    try {
      const payload = this.healthForm.value;
      const res = this.editingItem?.id 
        ? await this.supa.updateSanidad(this.editingItem.id, payload)
        : await this.supa.createSanidad(payload);

      if (res.error) {
        this.presentToast('Error al guardar: ' + res.error, 'danger');
      } else {
        this.presentToast('Registro clínico actualizado correctamente');
        this.isModalOpen = false;
        this.loadData();
      }
    } catch (e) {
      this.presentToast('Error de comunicación con el servidor', 'danger');
    }
  }

  async confirmDelete(item: Sanidad) {
    const alert = await this.alertCtrl.create({
      header: 'Seguridad Sanitaria',
      message: '¿Confirma que desea eliminar este registro clínico permanentemente?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.deleteRecord(item.id) }
      ]
    });
    await alert.present();
  }

  async deleteRecord(id: string) {
    const res = await this.supa.deleteSanidad(id);
    if (res.error) {
      this.presentToast('Error al eliminar: ' + res.error, 'danger');
    } else {
      this.presentToast('Registro sanitario eliminado', 'warning');
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
