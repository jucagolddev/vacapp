import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, 
  IonLabel, IonBadge, IonIcon, IonNote, IonGrid, 
  IonRow, IonCol, IonButtons, IonMenuButton, IonFab, IonFabButton,
  IonModal, IonButton, IonInput, IonSelect, IonSelectOption, 
  IonSpinner, IonText
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';
import { Pesaje, Bovino } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { 
  fitness, scale, add, close, save, pencil, trash, 
  trendingUp, calendar, barChart, leaf, paw, speedometer,
  trendingDown
} from 'ionicons/icons';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertController, ToastController } from '@ionic/angular/standalone';

/**
 * Componente para el Módulo de Recría y Control de Pesaje - Edición Lujo.
 * Refactorizado: 100% Sincronización de colores con _variables.scss.
 */
@Component({
  selector: 'app-recria',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, 
    IonLabel, IonBadge, IonIcon, IonNote, IonGrid, 
    IonRow, IonCol, IonButtons, IonMenuButton, IonFab, IonFabButton,
    IonModal, IonButton, IonInput, IonSelect, IonSelectOption, 
    IonSpinner, IonText
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary" class="luxe-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="text-white"></ion-menu-button>
        </ion-buttons>
        <ion-title class="luxe-title">Recría & Rendimiento</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="luxe-bg-forest">
      <div class="luxe-container animate-fade-in">
        
        <!-- Cabecera de Sección -->
        <div class="luxe-header-content">
          <div class="luxe-icon-box bg-forest">
            <ion-icon name="speedometer"></ion-icon>
          </div>
          <div class="luxe-text-stack">
            <h1 class="luxe-h1-premium">Control de Pesaje</h1>
            <p class="luxe-p-premium">Monitoreo de crecimiento y ganancia de masa.</p>
          </div>
        </div>

        <div *ngIf="loading" class="luxe-loading-state">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>Sincronizando con báscula...</p>
        </div>

        <!-- Listado de Pesajes -->
        <ion-grid class="ion-no-padding" *ngIf="!loading && pesajes.length > 0">
          <ion-row>
            <ion-col size="12" size-md="6" size-xl="4" *ngFor="let p of pesajes">
              <div class="weight-card-body-luxe animate-slide-up">
                <div class="weight-header-luxe">
                  <div class="animal-ref-luxe">
                    <ion-badge color="secondary" mode="ios">
                      {{ p.bovino?.crotal || 'S/N' }}
                    </ion-badge>
                    <h3 class="animal-name-txt">{{ p.bovino?.nombre || 'Ejemplar S/N' }}</h3>
                  </div>
                  <div class="weight-date-luxe">
                    <ion-icon name="calendar" class="color-earth"></ion-icon>
                    <span>{{ p.fecha_pesaje | date:'dd MMM yyyy' }}</span>
                  </div>
                </div>

                <div class="luxe-details-panel">
                  <div class="detail-row">
                    <span class="detail-lbl">Masa Actual</span>
                    <div class="data-val-luxe">
                      <span class="num-txt">{{ p.peso_kg }}</span>
                      <span class="unit-txt">KG</span>
                    </div>
                  </div>
                  
                  <div class="detail-row" *ngIf="p.gain !== null">
                     <span class="detail-lbl">Ganancia / Pérdida</span>
                     <div class="gain-val-luxe" [ngClass]="p.gain >= 0 ? 'color-forest' : 'color-earth'">
                        <ion-icon [name]="p.gain >= 0 ? 'trending-up' : 'trending-down'"></ion-icon>
                        <span>{{ p.gain > 0 ? '+' : '' }}{{ p.gain | number:'1.1-2' }} kg</span>
                     </div>
                  </div>
                </div>

                <div class="luxe-card-footer">
                  <div class="tag-pesaje-luxe">
                    <ion-icon name="bar-chart" class="color-earth"></ion-icon>
                    <span>{{ p.tipo_pesaje }}</span>
                  </div>
                  <ion-button fill="clear" (click)="deletePesaje(p.id)" class="color-earth">
                    <ion-icon name="trash" slot="icon-only"></ion-icon>
                  </ion-button>
                </div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Estado Vacío -->
        <div *ngIf="!loading && pesajes.length === 0" class="luxe-empty-state">
          <div class="empty-icon-ring">
            <ion-icon name="scale"></ion-icon>
          </div>
          <h2>Báscula Lista</h2>
          <p>No se han registrado pesajes aún.</p>
          <ion-button fill="solid" (click)="setOpen(true)" class="btn-luxe-save">
            <ion-icon name="add" slot="start"></ion-icon> Registrar Pesaje
          </ion-button>
        </div>
      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="setOpen(true)" style="--background: var(--ion-color-primary)">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- MODAL DE PESAJE -->
      <ion-modal [isOpen]="isModalOpen" (didDismiss)="setOpen(false)" class="luxe-modal">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar color="primary">
              <ion-title>Ficha de Pesaje</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="setOpen(false)">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>

          <ion-content class="ion-padding luxe-modal-content">
            <div class="form-intro">
               <ion-icon name="scale" class="color-earth text-3xl"></ion-icon>
               <h3>Registro de Rendimiento</h3>
               <p>Introduce los datos capturados en báscula.</p>
            </div>

            <form [formGroup]="pesajeForm" (ngSubmit)="onSubmit()">
              <ion-item class="luxe-input">
                <ion-label position="stacked">Seleccionar Animal *</ion-label>
                <ion-select formControlName="bovino_id" placeholder="Ejemplar a pesar" interface="popover">
                  <ion-select-option *ngFor="let b of bovinos" [value]="b.id">
                    {{ b.crotal }} - {{ b.nombre }}
                  </ion-select-option>
                </ion-select>
              </ion-item>

              <div class="luxe-item-group">
                <ion-item class="luxe-input half">
                  <ion-label position="stacked">Fecha</ion-label>
                  <ion-input type="date" formControlName="fecha_pesaje"></ion-input>
                </ion-item>
                <ion-item class="luxe-input half">
                  <ion-label position="stacked">KG *</ion-label>
                  <ion-input type="number" formControlName="peso_kg" placeholder="0.00"></ion-input>
                </ion-item>
              </div>

              <ion-item class="luxe-input">
                 <ion-label position="stacked">Tipo Control</ion-label>
                 <ion-select formControlName="tipo_pesaje" interface="popover">
                   <ion-select-option value="Nacimiento">Nacimiento</ion-select-option>
                   <ion-select-option value="Destete">Destete</ion-select-option>
                   <ion-select-option value="Recría">Recría</ion-select-option>
                   <ion-select-option value="Finalización">Finalización</ion-select-option>
                 </ion-select>
              </ion-item>

              <div class="luxe-modal-footer">
                <ion-button type="submit" [disabled]="pesajeForm.invalid" class="btn-luxe-save w-full">
                  <ion-icon slot="start" name="save"></ion-icon>
                  Registrar Pesaje
                </ion-button>
              </div>
            </form>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    /* Recría: Estilos estructurales mínimos (Heredados de _luxe.scss) */
    .weight-header-luxe { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .animal-name-txt { font-size: 1.3rem; font-weight: 900; color: var(--ion-color-primary); margin: 5px 0 0; }
    .weight-date-luxe { display: flex; align-items: center; gap: 5px; color: var(--ion-color-tertiary); font-weight: 700; font-size: 0.8rem; }
    
    .detail-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
    .data-val-luxe { display: flex; align-items: baseline; gap: 4px; }
    .data-val-luxe .num-txt { font-size: 2rem; font-weight: 900; color: var(--ion-color-primary); }
    .data-val-luxe .unit-txt { font-size: 0.85rem; font-weight: 800; color: var(--ion-color-secondary); }

    .gain-val-luxe { display: flex; align-items: center; gap: 5px; font-size: 1.2rem; font-weight: 900; }
    .tag-pesaje-luxe { display: flex; align-items: center; gap: 6px; color: var(--ion-color-secondary); font-weight: 800; font-size: 0.85rem; }
    
    .luxe-loading-state { text-align: center; padding: 40px; color: var(--ion-color-primary); }
    .luxe-loading-state p { margin-top: 15px; font-weight: 600; font-size: 1.1rem; }
  `]
})
export class RecriaComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  pesajes: any[] = [];
  bovinos: Bovino[] = [];
  loading = true;
  isModalOpen = false;
  pesajeForm: FormGroup;

  constructor() {
    addIcons({ fitness, scale, add, close, save, pencil, trash, trendingUp, trendingDown, calendar, barChart, leaf, paw, speedometer });
    this.pesajeForm = this.fb.group({
      bovino_id: ['', Validators.required],
      fecha_pesaje: [new Date().toISOString().split('T')[0], Validators.required],
      peso_kg: ['', [Validators.required, Validators.min(0.1)]],
      tipo_pesaje: ['Recría', Validators.required]
    });
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      const [pesajesRes, bovinosRes] = await Promise.all([
        this.supabase.getPesajes(),
        this.supabase.getAll<Bovino>('bovinos')
      ]);

      this.bovinos = (bovinosRes.data || []).filter(b => b.estado === 'Activo');
      this.pesajes = this.processPesajes(pesajesRes.data || []);
    } catch (error) {
      this.showToast('Error de sincronización', 'danger');
    } finally {
      this.loading = false;
    }
  }

  processPesajes(data: any[]) {
    const sorted = [...data].sort((a, b) => 
      new Date(a.fecha_pesaje).getTime() - new Date(b.fecha_pesaje).getTime()
    );

    const lastWeightMap = new Map<string, number>();
    const withGains = sorted.map(p => {
      const previousWeight = lastWeightMap.get(p.bovino_id);
      const gain = previousWeight !== undefined ? p.peso_kg - previousWeight : null;
      lastWeightMap.set(p.bovino_id, p.peso_kg);
      return { ...p, gain };
    });

    return withGains.sort((a, b) => 
      new Date(b.fecha_pesaje).getTime() - new Date(a.fecha_pesaje).getTime()
    );
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    if (!isOpen) {
      this.pesajeForm.reset({
        fecha_pesaje: new Date().toISOString().split('T')[0],
        tipo_pesaje: 'Recría',
        bovino_id: '',
        peso_kg: ''
      });
    }
  }

  async onSubmit() {
    if (this.pesajeForm.invalid) return;

    try {
      const res = await this.supabase.createPesaje(this.pesajeForm.value);
      if (res.error) {
        this.showToast('Error al guardar: ' + res.error, 'danger');
      } else {
        this.showToast('Registro completado');
        this.setOpen(false);
        await this.loadData();
      }
    } catch (e) {
      this.showToast('Error técnico', 'danger');
    }
  }

  async deletePesaje(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Registro',
      message: '¿Confirma el borrado?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Eliminar', 
          role: 'destructive',
          handler: async () => {
            const res = await this.supabase.deletePesaje(id);
            if (res.error) {
              this.showToast('Error al eliminar: ' + res.error, 'danger');
            } else {
              this.showToast('Registro eliminado', 'warning');
              await this.loadData();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      mode: 'ios'
    });
    await toast.present();
  }
}
