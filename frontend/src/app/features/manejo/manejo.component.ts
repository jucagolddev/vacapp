import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, 
  IonLabel, IonBadge, IonFab, IonFabButton, IonIcon, IonSegment, 
  IonSegmentButton, IonModal, IonButton, IonButtons, IonInput,
  IonSelect, IonSelectOption, IonItemSliding, IonItemOptions, IonItemOption,
  AlertController, IonMenuButton, ToastController, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonText
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';
import { Bovino, Lote } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { 
  add, pencil, trash, close, save, list, business, 
  paw, checkmark, chevronForward, chevronBack, location
} from 'ionicons/icons';

/**
 * Componente para la gestión de Bovinos y Lotes (Módulo de Manejo).
 */
@Component({
  selector: 'app-manejo',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonTitle, 
    IonList, IonItem, IonLabel, IonBadge, IonFab, IonFabButton, IonIcon,
    IonSegment, IonSegmentButton, IonModal, IonButton, IonButtons, IonInput,
    IonSelect, IonSelectOption, IonItemSliding, IonItemOptions, IonItemOption,
    IonMenuButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonText
  ],
  template: `
    <!-- Cabecera de la Página: Manejo -->
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Gestión de Ganado</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding manejo-content">
      <!-- Selector de pestañas: Diseño Premium -->
      <ion-segment [value]="selectedSegment" (ionChange)="segmentChanged($event)" class="premium-segment">
        <ion-segment-button value="bovinos">
          <ion-icon name="list"></ion-icon>
          <ion-label>Bovinos</ion-label>
        </ion-segment-button>
        <ion-segment-button value="lotes">
          <ion-icon name="business"></ion-icon>
          <ion-label>Lotes / Recintos</ion-label>
        </ion-segment-button>
      </ion-segment>

      <!-- VISTA DE BOVINOS -->
      <div *ngIf="selectedSegment === 'bovinos'" class="fade-in">
        <div class="list-container">
          <ion-item-sliding *ngFor="let b of bovinos" class="vibrante-item">
            <ion-item lines="full" class="cow-card">
              <ion-icon slot="start" name="paw" class="cow-icon"></ion-icon>
              <ion-label>
                <h2 class="cow-name">{{ b.nombre || 'Sin nombre' }}</h2>
                <p class="cow-id">Crotal: <strong>{{ b.crotal }}</strong></p>
                <p class="cow-details">{{ b.raza }} · {{ b.sexo }}</p>
                <p class="cow-lote" *ngIf="b.lote_id">Lote: {{ getLoteName(b.lote_id) }}</p>
              </ion-label>
              <ion-badge slot="end" [color]="b.estado === 'Activo' ? 'success' : 'medium'" class="premium-badge">
                {{ b.estado }}
              </ion-badge>
            </ion-item>

            <ion-item-options side="end">
              <ion-item-option color="primary" (click)="openBovinoModal(b)" class="option-btn">
                <ion-icon slot="icon-only" name="pencil"></ion-icon>
              </ion-item-option>
              <ion-item-option color="danger" (click)="confirmDeleteBovino(b)" class="option-btn">
                <ion-icon slot="icon-only" name="trash"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </div>

        <!-- Botón Flotante Bovinos -->
        <ion-fab slot="fixed" vertical="bottom" horizontal="end">
          <ion-fab-button (click)="openBovinoModal()" color="primary">
            <ion-icon name="add"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      </div>

      <!-- VISTA DE LOTES -->
      <div *ngIf="selectedSegment === 'lotes'" class="fade-in">
        <div class="list-container">
          <ion-card *ngFor="let l of lotes" class="premium-lote-card">
            <ion-item-sliding>
              <ion-item lines="none" class="lote-item">
                <ion-icon slot="start" name="business" color="primary"></ion-icon>
                <ion-label>
                  <h2 class="lote-name">{{ l.nombre }}</h2>
                  <p class="lote-desc">{{ l.ubicacion || 'Sin ubicación' }}</p>
                </ion-label>
              </ion-item>
              <ion-item-options side="end">
                <ion-item-option color="primary" (click)="openLoteModal(l)">
                  <ion-icon slot="icon-only" name="pencil"></ion-icon>
                </ion-item-option>
                <ion-item-option color="danger" (click)="confirmDeleteLote(l)">
                  <ion-icon slot="icon-only" name="trash"></ion-icon>
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          </ion-card>
        </div>

        <!-- Botón Flotante Lotes -->
        <ion-fab slot="fixed" vertical="bottom" horizontal="end">
          <ion-fab-button (click)="openLoteModal()" color="secondary">
            <ion-icon name="add"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      </div>

      <!-- RECUADRO PARA ESTADOS VACÍOS -->
      <div *ngIf="(selectedSegment === 'bovinos' && bovinos.length === 0) || (selectedSegment === 'lotes' && lotes.length === 0)" class="empty-state">
        <ion-icon name="paw" class="faded-icon"></ion-icon>
        <p>No hay registros disponibles en esta sección.</p>
      </div>

      <!-- MODAL BOVINOS (WIZARD REACTIVO) -->
      <ion-modal [isOpen]="isBovinoModalOpen" (didDismiss)="isBovinoModalOpen = false" class="premium-modal">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar class="modal-toolbar">
              <ion-title>{{ editingBovino ? 'Editar' : 'Nueva' }} Vaca</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="isBovinoModalOpen = false">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
            <div class="step-indicator">
              <div [class.active]="currentStep === 1">1</div>
              <div [class.active]="currentStep === 2">2</div>
              <div [class.active]="currentStep === 3">3</div>
            </div>
          </ion-header>

          <ion-content class="ion-padding wizard-content">
            <form [formGroup]="bovinoForm">
              <!-- PASO 1 -->
              <div *ngIf="currentStep === 1" class="step-container">
                <h2 class="step-title">Identificación</h2>
                <ion-item class="premium-input">
                  <ion-label position="stacked">Crotal / Identificación *</ion-label>
                  <ion-input formControlName="crotal" placeholder="ES0123..."></ion-input>
                </ion-item>
                <ion-item class="premium-input">
                  <ion-label position="stacked">Nombre o Apodo</ion-label>
                  <ion-input formControlName="nombre" placeholder="Parda, Estrella..."></ion-input>
                </ion-item>
                <ion-item class="premium-input">
                  <ion-label position="stacked">Sexo</ion-label>
                  <ion-select formControlName="sexo">
                    <ion-select-option value="Hembra">Hembra</ion-select-option>
                    <ion-select-option value="Macho">Macho</ion-select-option>
                  </ion-select>
                </ion-item>
              </div>

              <!-- PASO 2 -->
              <div *ngIf="currentStep === 2" class="step-container">
                <h2 class="step-title">Genealogía</h2>
                <ion-item class="premium-input">
                  <ion-label position="stacked">Madre</ion-label>
                  <ion-select formControlName="madre_id" placeholder="Ninguna">
                    <ion-select-option *ngFor="let m of selectMadres" [value]="m.id">{{ m.nombre }} ({{ m.crotal }})</ion-select-option>
                  </ion-select>
                </ion-item>
                <ion-item class="premium-input">
                  <ion-label position="stacked">Padre</ion-label>
                  <ion-select formControlName="padre_id" placeholder="Ninguno">
                    <ion-select-option *ngFor="let p of selectPadres" [value]="p.id">{{ p.nombre }} ({{ p.crotal }})</ion-select-option>
                  </ion-select>
                </ion-item>
              </div>

              <!-- PASO 3 -->
              <div *ngIf="currentStep === 3" class="step-container">
                <h2 class="step-title">Ubicación y Raza</h2>
                <ion-item class="premium-input">
                  <ion-label position="stacked">Raza</ion-label>
                  <ion-input formControlName="raza" placeholder="Limousin, Angus..."></ion-input>
                </ion-item>
                <ion-item class="premium-input">
                  <ion-label position="stacked">Asignar a Lote</ion-label>
                  <ion-select formControlName="lote_id" placeholder="Seleccionar lote">
                    <ion-select-option *ngFor="let l of lotes" [value]="l.id">{{ l.nombre }}</ion-select-option>
                  </ion-select>
                </ion-item>
                <ion-item class="premium-input">
                  <ion-label position="stacked">Estado</ion-label>
                  <ion-select formControlName="estado">
                    <ion-select-option value="Activo">Activo</ion-select-option>
                    <ion-select-option value="Vendido">Vendido</ion-select-option>
                    <ion-select-option value="Muerto">Muerto</ion-select-option>
                  </ion-select>
                </ion-item>
              </div>
            </form>

            <div class="wizard-buttons">
              <ion-button fill="outline" (click)="prevStep()" *ngIf="currentStep > 1" class="nav-btn">Atrás</ion-button>
              <ion-button expand="block" (click)="nextStep()" *ngIf="currentStep < 3" class="nav-btn next-btn">Siguiente</ion-button>
              <ion-button expand="block" color="success" (click)="saveBovino()" *ngIf="currentStep === 3" [disabled]="!bovinoForm.valid" class="nav-btn save-btn">
                <ion-icon name="checkmark" slot="start"></ion-icon> Guardar Registro
              </ion-button>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>

      <!-- MODAL LOTES (REACTIVO) -->
      <ion-modal [isOpen]="isLoteModalOpen" (didDismiss)="isLoteModalOpen = false">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>{{ editingLote ? 'Editar' : 'Nuevo' }} Lote</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="isLoteModalOpen = false">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <form [formGroup]="loteForm">
              <ion-item class="premium-input">
                <ion-label position="stacked">Nombre del Lote / Recinto *</ion-label>
                <ion-input formControlName="nombre" placeholder="Ej: Prado Sur"></ion-input>
              </ion-item>
              <ion-item class="premium-input">
                <ion-label position="stacked">Descripción / Ubicación</ion-label>
                <ion-input formControlName="ubicacion" placeholder="Ej: Junto al río"></ion-input>
              </ion-item>
              <ion-button expand="block" color="success" (click)="saveLote()" [disabled]="!loteForm.valid" class="ion-margin-top btn-grande">
                <ion-icon name="save" slot="start"></ion-icon> Guardar Lote
              </ion-button>
            </form>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `
})
export class ManejoComponent implements OnInit {
  private supa = inject(SupabaseService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private fb = inject(FormBuilder);

  selectedSegment = 'bovinos';
  bovinos: Bovino[] = [];
  lotes: Lote[] = [];
  selectMadres: Bovino[] = [];
  selectPadres: Bovino[] = [];

  // Modales
  isBovinoModalOpen = false;
  isLoteModalOpen = false;
  currentStep = 1;
  editingBovino: Bovino | null = null;
  editingLote: Lote | null = null;

  // Formularios Reactivos
  bovinoForm: FormGroup = this.fb.group({
    crotal: ['', [Validators.required, Validators.minLength(4)]],
    nombre: [''],
    sexo: ['Hembra', Validators.required],
    fecha_nacimiento: [new Date().toISOString().split('T')[0]],
    raza: [''],
    estado: ['Activo', Validators.required],
    lote_id: [null],
    madre_id: [null],
    padre_id: [null]
  });

  loteForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    ubicacion: ['']
  });

  constructor() {
    addIcons({ add, pencil, trash, close, save, list, business, paw, checkmark, chevronForward, chevronBack, location });
  }

  async ngOnInit() {
    this.loadData();
  }

  async loadData() {
    const { data: b } = await this.supa.getAll<Bovino>('bovinos');
    const { data: l } = await this.supa.getAll<Lote>('lotes');
    this.bovinos = b || [];
    this.lotes = l || [];
    this.updateParentSelectors();
  }

  updateParentSelectors() {
    this.selectMadres = this.bovinos.filter(b => b.sexo === 'Hembra');
    this.selectPadres = this.bovinos.filter(b => b.sexo === 'Macho');
  }

  getLoteName(id: string): string {
    return this.lotes.find(l => l.id === id)?.nombre || 'Desconocido';
  }

  segmentChanged(ev: any) {
    this.selectedSegment = ev.detail.value;
  }

  // --- BOVINOS ---
  openBovinoModal(bovino?: Bovino) {
    this.editingBovino = bovino || null;
    this.currentStep = 1;
    if (bovino) {
      this.bovinoForm.patchValue(bovino);
    } else {
      this.bovinoForm.reset({
        sexo: 'Hembra',
        estado: 'Activo',
        fecha_nacimiento: new Date().toISOString().split('T')[0]
      });
    }
    this.isBovinoModalOpen = true;
  }

  async saveBovino() {
    if (this.bovinoForm.invalid) return;
    const payload = this.bovinoForm.value;

    try {
      const res = this.editingBovino 
        ? await this.supa.update('bovinos', this.editingBovino.id, payload)
        : await this.supa.create('bovinos', payload);

      if (res.error) {
        this.presentToast('Error al guardar: ' + res.error, 'danger');
      } else {
        this.presentToast('Bovino guardado correctamente');
        this.isBovinoModalOpen = false;
        this.loadData();
      }
    } catch (e) {
      this.presentToast('Excepción al guardar bovino', 'danger');
    }
  }

  async confirmDeleteBovino(b: Bovino) {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar animal?',
      message: `¿Seguro que quieres borrar a ${b.nombre || b.crotal}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.deleteBovino(b.id) }
      ]
    });
    alert.present();
  }

  async deleteBovino(id: string) {
    const res = await this.supa.delete('bovinos', id);
    if (res.error) {
      this.presentToast('Error al eliminar: ' + res.error, 'danger');
    } else {
      this.presentToast('Animal eliminado');
      this.loadData();
    }
  }

  // --- LOTES ---
  openLoteModal(lote?: Lote) {
    this.editingLote = lote || null;
    if (lote) {
      this.loteForm.patchValue(lote);
    } else {
      this.loteForm.reset();
    }
    this.isLoteModalOpen = true;
  }

  async saveLote() {
    if (this.loteForm.invalid) return;
    const payload = this.loteForm.value;

    try {
      const res = this.editingLote
        ? await this.supa.update('lotes', this.editingLote.id, payload)
        : await this.supa.create('lotes', payload);

      if (res.error) {
        this.presentToast('Error al guardar lote: ' + res.error, 'danger');
      } else {
        this.presentToast('Lote guardado correctamente');
        this.isLoteModalOpen = false;
        this.loadData();
      }
    } catch (e) {
      this.presentToast('Excepción al guardar lote', 'danger');
    }
  }

  async confirmDeleteLote(l: Lote) {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar Lote?',
      message: `Borrar el lote ${l.nombre} no borrará los animales en él, pero quedarán sin lote asignado.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.deleteLote(l.id) }
      ]
    });
    alert.present();
  }

  async deleteLote(id: string) {
    const res = await this.supa.delete('lotes', id);
    if (res.error) {
      this.presentToast('Error al eliminar lote: ' + res.error, 'danger');
    } else {
      this.presentToast('Lote eliminado');
      this.loadData();
    }
  }

  // --- UTILS ---
  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    toast.present();
  }

  nextStep() { if (this.currentStep < 3) this.currentStep++; }
  prevStep() { if (this.currentStep > 1) this.currentStep--; }
}
