import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonMenuButton, IonFab, IonFabButton, IonIcon,
  IonModal, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton
} from '@ionic/angular/standalone';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { FinanzasService } from '../../core/services/finanzas.service';
import { Finanzas } from '../../core/models/vacapp.models';
import { LucideAngularModule } from 'lucide-angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, close, save, pencil, trash } from 'ionicons/icons';

@Component({
  selector: 'app-finanzas',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonMenuButton, IonFab, IonFabButton, IonIcon,
    IonModal, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton,
    LucideAngularModule, BaseChartDirective
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary" class="luxe-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="text-white"></ion-menu-button>
        </ion-buttons>
        <ion-title class="luxe-title">Gastos y Ganancias</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="luxe-bg-forest">
      <div class="luxe-container animate-fade-in pb-12">
        
        <!-- Cabecera de Sección -->
        <div class="luxe-header-content">
          <div class="luxe-icon-box bg-earth">
            <lucide-icon name="wallet" class="text-white"></lucide-icon>
          </div>
          <div class="luxe-text-stack">
            <h1 class="page-h1-rustic">Economía de la Finca</h1>
            <p class="page-p-rustic">Control de cuánto dinero entra y cuánto sale.</p>
          </div>
        </div>

        <!-- GRÁFICO DE ROI (Relocado) -->
        <div class="analytics-card-large animate-slide-up mb-8">
          <div class="card-header-flex">
            <div>
              <h3 class="card-title-luxe"><lucide-icon name="wallet" size="24" class="icon-inline icon-mr color-primary"></lucide-icon> Mi Dinero (Ingresos vs Gastos)</h3>
              <p class="card-subtitle-luxe">Las barras verdes son ventas. Las naranjas son gastos (comida, medicinas).</p>
            </div>
            <lucide-icon name="trending-up" class="text-forest/30" size="32"></lucide-icon>
          </div>
          <div class="chart-container-large">
             <canvas baseChart class="chart-canvas-finance" [data]="chartFinanzas()" [options]="chartOptionsROI" [type]="'bar'"></canvas>
          </div>
        </div>

        <!-- Listado de Movimientos Recientes -->
        <h2 class="luxe-section-title">Últimos Movimientos</h2>
        <div class="history-panel-luxe">
           <div class="history-row-luxe" *ngFor="let r of finanzasService.records().slice(0, 20)">
              <div class="history-avatar-luxe" [ngClass]="r.tipo === 'Ingreso' ? 'bg-forest' : 'bg-warning'">
                <lucide-icon [name]="r.tipo === 'Ingreso' ? 'arrow-up-circle' : 'arrow-down-circle'" class="text-white"></lucide-icon>
              </div>
              <div class="history-data-luxe">
                <h4 class="text-lg font-bold">{{ r.categoria }}</h4>
                <p>{{ r.fecha | date:'dd MMMM yyyy' }}</p>
              </div>
              <div class="history-actions-luxe">
                 <div class="text-xl font-heavy" [class.color-finance-up]="r.tipo === 'Ingreso'" [class.color-finance-down]="r.tipo !== 'Ingreso'">
                  {{ r.tipo === 'Ingreso' ? '+' : '-' }} {{ r.monto | number:'1.2-2' }}€
                </div>
                <div class="btn-group-history flex-row mt-xs">
                   <ion-button fill="clear" (click)="openEditModal(r)"><ion-icon name="pencil"></ion-icon></ion-button>
                   <ion-button fill="clear" (click)="confirmDelete(r)"><ion-icon name="trash" color="danger"></ion-icon></ion-button>
                </div>
              </div>
           </div>
        </div>

      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="openAddModal()" class="bg-var-secondary">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- MODAL DE MOVIMIENTO FINANCIERO -->
      <ion-modal [isOpen]="isModalOpen" (didDismiss)="closeModal()" class="luxe-modal">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar color="primary">
              <ion-title>{{ editingItem ? 'Actualizar Registro' : 'Añadir Movimiento' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeModal()">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>

          <ion-content class="ion-padding luxe-modal-content">
            <div class="form-intro">
               <lucide-icon name="wallet" class="color-earth" size="48"></lucide-icon>
               <h3>Registro Contable</h3>
               <p>Anota cualquier venta, compra o gasto asociado a tu actividad ganadera.</p>
            </div>

            <form [formGroup]="finanzasForm">
              <ion-item class="luxe-input">
                <ion-label position="stacked">Naturaleza de Movimiento *</ion-label>
                <ion-select formControlName="tipo" interface="popover" (ionChange)="onTipoChange()">
                  <ion-select-option value="Ingreso">Entrada (Ventas, Ayudas)</ion-select-option>
                  <ion-select-option value="Gasto">Salida (Compras, Salarios)</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item class="luxe-input">
                <ion-label position="stacked">Categoría Principal *</ion-label>
                <ion-select formControlName="categoria" interface="popover">
                   <ion-select-option *ngFor="let cat of categoriasDisponibles" [value]="cat">
                     {{ cat }}
                   </ion-select-option>
                </ion-select>
              </ion-item>

              <div class="luxe-item-group">
                <ion-item class="luxe-input half">
                  <ion-label position="stacked">Fecha *</ion-label>
                  <ion-input type="date" formControlName="fecha"></ion-input>
                </ion-item>
                <ion-item class="luxe-input half">
                  <ion-label position="stacked">Monto (€) *</ion-label>
                  <ion-input type="number" formControlName="monto" placeholder="0.00"></ion-input>
                </ion-item>
              </div>

              <div class="luxe-modal-footer">
                <ion-button (click)="saveData()" [disabled]="finanzasForm.invalid" class="btn-luxe-save w-full">
                  <ion-icon slot="start" name="save"></ion-icon> Guardar Registro
                </ion-button>
              </div>
            </form>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `
})
export class FinanzasComponent {
  public finanzasService = inject(FinanzasService);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  
  isModalOpen = false;
  editingItem: Finanzas | null = null;
  finanzasForm: FormGroup;

  categoriasIngreso = ['Venta Leche', 'Venta Carne', 'Venta Genética', 'Ayudas Gubernamentales', 'Otros Ingresos'];
  categoriasGasto = ['Alimentación y Pastos', 'Veterinaria y Semen', 'Mantenimiento y Equipos', 'Sueldos', 'Otros Gastos'];
  categoriasDisponibles: string[] = [];
  
  // Gráfico de Finanzas (ROI) - Agrupado Mensual por defecto
  chartFinanzas = computed<ChartConfiguration<'bar'>['data']>(() => {
    const data = this.finanzasService.getDatosFinancierosPorPeriodo('Mensual');
    return {
      labels: data.map(d => d.label),
      datasets: [
        { label: 'Ingresos (€)', data: data.map(d => d.ingresos), backgroundColor: '#2d6a4f', borderRadius: 6 },
        { label: 'Gastos (€)', data: data.map(d => -d.gastos), backgroundColor: '#bc6c25', borderRadius: 6 }
      ]
    };
  });

  public chartOptionsROI: ChartOptions<'bar'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#6c757d', font: { size: 12, weight: 'bold' } } } },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: '#6c757d' } },
      y: { 
        stacked: true, 
        grid: { color: 'rgba(0,0,0,0.05)' }, 
        ticks: { color: '#6c757d', callback: (val) => '€' + Math.abs(Number(val)) } 
      }
    }
  };

  constructor() {
    addIcons({ add, close, save, pencil, trash });
    this.finanzasForm = this.fb.group({
      tipo: ['Gasto', Validators.required],
      categoria: ['Alimentación y Pastos', Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01)]],
      fecha: [new Date().toISOString().split('T')[0], Validators.required]
    });
    this.categoriasDisponibles = [...this.categoriasGasto];
  }

  onTipoChange() {
    const tipo = this.finanzasForm.get('tipo')?.value;
    if (tipo === 'Ingreso') {
      this.categoriasDisponibles = [...this.categoriasIngreso];
      this.finanzasForm.patchValue({ categoria: this.categoriasIngreso[0] });
    } else {
      this.categoriasDisponibles = [...this.categoriasGasto];
      this.finanzasForm.patchValue({ categoria: this.categoriasGasto[0] });
    }
  }

  openAddModal() {
    this.editingItem = null;
    this.finanzasForm.reset({
      tipo: 'Gasto',
      categoria: 'Alimentación y Pastos',
      fecha: new Date().toISOString().split('T')[0]
    });
    this.categoriasDisponibles = [...this.categoriasGasto];
    this.isModalOpen = true;
  }

  openEditModal(item: Finanzas) {
    this.editingItem = item;
    const { id, finca_id, created_at, ...data } = item;
    
    // Set categorias primero
    if (data.tipo === 'Ingreso') {
        this.categoriasDisponibles = [...this.categoriasIngreso];
    } else {
        this.categoriasDisponibles = [...this.categoriasGasto];
    }
    
    // Si la categoria no existe en las listas base, añadirla temporalmente
    if (!this.categoriasDisponibles.includes(data.categoria)) {
        this.categoriasDisponibles.push(data.categoria);
    }
    
    this.finanzasForm.patchValue(data);
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async saveData() {
    if (this.finanzasForm.invalid) return;

    try {
      const payload = this.finanzasForm.value;
      const res = this.editingItem?.id 
        ? await this.finanzasService.updateFinanza(this.editingItem.id, payload)
        : await this.finanzasService.createFinanza(payload);

      if (res.error) {
        this.presentToast('Error al guardar: ' + res.error, 'danger');
      } else {
        this.presentToast(this.editingItem ? 'Movimiento actualizado' : 'Movimiento registrado');
        this.isModalOpen = false;
      }
    } catch (e) {
      this.presentToast('Error de comunicación', 'danger');
    }
  }

  async confirmDelete(item: Finanzas) {
    const alert = await this.alertCtrl.create({
      header: 'Purgar Registro',
      message: '¿Confirma que desea eliminar este movimiento económico de forma irreversible?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Eliminar', 
          role: 'destructive',
          handler: async () => {
            const res = await this.finanzasService.deleteFinanza(item.id);
            if (res.error) {
               this.presentToast('Error al eliminar: ' + res.error, 'danger');
            } else {
               this.presentToast('Registro eliminado con éxito', 'warning');
            }
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
