import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem,
  IonLabel, IonBadge, IonIcon, IonButtons, IonMenuButton, IonFab, IonFabButton,
  IonModal, IonButton, IonInput, IonSelect, IonSelectOption,
  IonCard, IonAvatar, IonCardContent, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';
import { Sanidad, Bovino } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { 
  medkitOutline, flaskOutline, medicalOutline, addCircle, closeOutline, saveOutline, searchOutline, 
  calendarOutline, personOutline, createOutline, trashOutline, leafOutline, pulseOutline, waterOutline, 
  thermometerOutline, bandageOutline, warningOutline, filterOutline
} from 'ionicons/icons';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { GanadoService } from '../../core/services/ganado.service';

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
    IonItem, IonLabel, IonBadge, IonIcon, IonButtons, IonMenuButton, 
    IonFab, IonFabButton, IonModal, IonButton, IonInput, IonSelect, IonSelectOption,
    IonCard, IonAvatar, IonCardContent, IonGrid, IonRow, IonCol
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title class="ion-text-center">Salud y Medicinas</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear">
            <ion-icon name="filter-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-vertical">
      <div class="luxe-container animate-fade-in">

        <!-- Buscador Premium -->
        <div class="rustic-search-wrapper glass animate-slide-up">
          <ion-icon name="search-outline" class="rustic-search-icon"></ion-icon>
          <input 
            type="text" 
            placeholder="Buscar por ejemplar o tratamiento..." 
            class="rustic-search-input-field"
            (input)="onSearch($event)">
          <div class="search-accent"></div>
        </div>

        <!-- LISTA ESTANDARIZADA -->
        <ion-grid class="ion-no-padding mt-4" *ngIf="filteredSanidad.length > 0">
          <ion-row>
            <ion-col size="12" size-md="6" size-xl="4" *ngFor="let s of filteredSanidad">
              <div class="tag-body-luxe">
                <div class="card-header-flex">
                  <div class="card-icon-box" [style.background-color]="'var(--ion-color-light)'">
                    <ion-icon [name]="getHealthIcon(s.tipo)" color="primary"></ion-icon>
                  </div>
                  <div class="card-title-stack">
                    <strong>{{ s.bovino?.nombre || 'Ejemplar' }}</strong>
                    <span>{{ s.bovino?.crotal || 'S/N' }}</span>
                  </div>
                  <div class="flex-1"></div>
                  <ion-badge [color]="getDiasRestantes(s) > 0 ? 'danger' : 'success'" mode="ios">
                    {{ getDiasRestantes(s) > 0 ? getDiasRestantes(s) + 'd' : 'Libre' }}
                  </ion-badge>
                </div>

                <div class="card-data-grid">
                  <div class="card-data-item">
                    <span class="label">Tratamiento</span>
                    <span class="value">{{ s.tipo }}: {{ s.producto }}</span>
                  </div>
                  <div class="card-data-item">
                    <span class="label">Fecha Aplicación</span>
                    <span class="value">{{ s.fecha | date:'dd MMM yyyy' }}</span>
                  </div>
                </div>

                <div class="card-footer-actions">
                  <ion-button fill="clear" color="medium" (click)="openEditModal(s)">
                    <ion-icon name="create-outline" slot="icon-only"></ion-icon>
                  </ion-button>
                  <ion-button fill="clear" color="danger" (click)="confirmDelete(s)">
                    <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                  </ion-button>
                </div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Estado Vacío -->
        <div *ngIf="filteredSanidad.length === 0" class="luxe-empty-state">
          <div class="empty-icon-ring">
            <ion-icon name="medkit-outline"></ion-icon>
          </div>
          <h2>Sin incidencias</h2>
          <p>No se encontraron registros sanitarios para esta búsqueda.</p>
        </div>

      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="openAddModal()" color="primary">
          <ion-icon name="add-circle"></ion-icon>
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
                  <ion-icon name="close-outline"></ion-icon>
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
                  <ion-select-option *ngFor="let b of ganadoService.bovinosAlta()" [value]="b.id">
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
                    <ion-select-option *ngFor="let tipo of ganadoService.constants.TIPOS_EVENTO_SANIDAD" [value]="tipo">
                      {{ tipo }}
                    </ion-select-option>
                  </ion-select>
                </ion-item>
              </div>

              <ion-item class="luxe-input">
                <ion-label position="stacked">Producto / Medicamento *</ion-label>
                <ion-input formControlName="producto" placeholder="Nombre comercial o principio activo"></ion-input>
              </ion-item>

              <ion-item class="luxe-input">
                <ion-label position="stacked">Lote del Medicamento / Lote Nº</ion-label>
                <ion-input formControlName="lote_medicamento" placeholder="L-XYZ-1234"></ion-input>
              </ion-item>

              <div class="luxe-item-group">
                <ion-item class="luxe-input half">
                  <ion-label position="stacked">Días Retiro (Carne)</ion-label>
                  <ion-input type="number" formControlName="dias_retiro_carne" placeholder="0"></ion-input>
                </ion-item>
                <ion-item class="luxe-input half">
                  <ion-label position="stacked">Días Retiro (Leche)</ion-label>
                  <ion-input type="number" formControlName="dias_retiro_leche" placeholder="0"></ion-input>
                </ion-item>
              </div>

              <ion-item class="luxe-input">
                <ion-label position="stacked">Coste Aplicación (€/$/£)</ion-label>
                <ion-input type="number" formControlName="costo_aplicacion" placeholder="0.00"></ion-input>
              </ion-item>

              <ion-item class="luxe-input">
                <ion-label position="stacked">Observaciones Veterinarias</ion-label>
                <ion-input formControlName="observaciones" placeholder="Dosis, vía, notas clínicas..."></ion-input>
              </ion-item>
              
              <div class="luxe-modal-footer">
                <ion-button expand="block" (click)="saveData()" [disabled]="healthForm.invalid" class="btn-luxe-save">
                  Guardar
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
  public ganadoService = inject(GanadoService);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  
  sanidadRecords: Sanidad[] = [];
  filteredSanidad: Sanidad[] = [];
  
  isModalOpen = false;
  editingItem: Sanidad | null = null;
  healthForm: FormGroup;

  constructor() {
    addIcons({ 
      medkitOutline, flaskOutline, medicalOutline, addCircle, closeOutline, saveOutline, searchOutline, calendarOutline, 
      personOutline, createOutline, trashOutline, leafOutline, pulseOutline, waterOutline, thermometerOutline, bandageOutline, warningOutline, filterOutline
    });
    
    this.healthForm = this.fb.group({
      bovino_id: ['', Validators.required],
      tipo: ['Vacunación', Validators.required],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      producto: ['', Validators.required],
      lote_medicamento: [''],
      dias_retiro_carne: [0],
      dias_retiro_leche: [0],
      costo_aplicacion: [0],
      observaciones: ['']
    });
  }

  async ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      const { data: records } = await this.supa.getSanidad();
      this.sanidadRecords = records || [];
      this.filteredSanidad = [...this.sanidadRecords];
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
      case 'Vacunación': return 'medical-outline';
      case 'Desparasitación': return 'flask-outline';
      case 'Saneamiento': return 'leaf-outline';
      case 'Enfermedad': return 'thermometer-outline';
      default: return 'medkit-outline';
    }
  }

  getBadgeColor(tipo: string): string {
    switch (tipo) {
      case 'Vacunación': return 'bg-success';
      case 'Desparasitación': return 'bg-secondary';
      case 'Enfermedad': return 'bg-danger';
      case 'Saneamiento': return 'bg-tertiary';
      default: return 'bg-primary';
    }
  }

  getDiasRestantes(s: Sanidad): number {
    if (!s.fecha) return 0;
    const maxRetiro = Math.max(s.dias_retiro_carne || 0, s.dias_retiro_leche || 0);
    if (maxRetiro === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const fechaAplicacion = new Date(s.fecha);
    const fechaFin = new Date(fechaAplicacion);
    fechaFin.setDate(fechaFin.getDate() + maxRetiro);

    const diffTime = fechaFin.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
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
