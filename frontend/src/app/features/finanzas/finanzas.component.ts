import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonMenuButton, IonFab, IonFabButton, IonIcon,
  IonModal, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton,
  IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { FinanzasService } from '../../core/services/finanzas.service';
import { Finanzas } from '../../core/models/vacapp.models';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { PdfService } from '../../core/services/pdf.service';
import { addCircle, closeOutline, saveOutline, createOutline, trashOutline, walletOutline, trendingUpOutline, trendingDownOutline, cashOutline, arrowDownOutline, arrowUpOutline, documentTextOutline } from 'ionicons/icons';

@Component({
  selector: 'app-finanzas',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonMenuButton, IonFab, IonFabButton, IonIcon,
    IonModal, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton,
    IonGrid, IonRow, IonCol,
    BaseChartDirective
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title class="ion-text-center">Gastos y Ganancias</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="exportarPDF()" color="primary">
            <ion-icon name="document-text-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-vertical">
      <div class="vac-container animate-fade-in pb-12">
        

        <!-- GRÁFICO DE ROI (Relocado) -->
        <div class="vac-main-card animate-slide-up mb-8">
          <div class="vac-card-header-flex">
            <div class="vac-card-title-group">
              <span>ESTADO DE CUENTAS</span>
              <strong>Ingresos vs Gastos Mensuales</strong>
            </div>
            <div class="vac-mini-stat bg-primary-soft">
              <ion-icon name="trending-up-outline"></ion-icon>
              <span>ROI en Crecimiento</span>
            </div>
          </div>
          <div class="p-4">
             <canvas baseChart class="chart-canvas-finance" [data]="chartFinanzas()" [options]="chartOptionsROI" [type]="'bar'"></canvas>
          </div>
        </div>

        <!-- Listado de Movimientos Recientes -->
        <h2 class="vac-section-title">Últimos Movimientos</h2>
        <ion-grid class="ion-no-padding">
          <ion-row>
            <ion-col size="12" size-md="6" size-xl="4" *ngFor="let r of finanzasService.records().slice(0, 20)">
              <div class="uniform-card" [class.clickable-card]="r.bovino_id" (click)="r.bovino_id ? goToDetail(r.bovino_id) : null">
                <div class="vac-card-header-flex">
                  <div class="vac-icon-circle" [ngClass]="r.tipo === 'Ingreso' ? 'bg-forest' : 'bg-warning-soft'">
                    <ion-icon [name]="r.tipo === 'Ingreso' ? 'arrow-up-outline' : 'arrow-down-outline'" [class.color-light]="r.tipo === 'Ingreso'" [class.color-warning]="r.tipo !== 'Ingreso'"></ion-icon>
                  </div>
                  <div class="vac-card-title-group">
                    <h3 class="vac-card-title">{{ r.categoria }}</h3>
                    <p class="vac-card-subtitle">{{ r.fecha | date:'dd MMM yyyy' }}</p>
                  </div>
                  <div class="flex-1"></div>
                  <div class="ion-text-right">
                    <div class="vac-kpi-value-small" [class.color-success]="r.tipo === 'Ingreso'" [class.color-danger]="r.tipo !== 'Ingreso'">
                      {{ r.tipo === 'Ingreso' ? '+' : '-' }}{{ r.monto | number:'1.0-0' }}€
                    </div>
                  </div>
                </div>

                <div class="vac-card-footer mt-4 pt-2 border-t-light flex justify-end gap-2">
                  <button class="vac-btn-icon bg-light" (click)="openEditModal(r)">
                    <ion-icon name="create-outline"></ion-icon>
                  </button>
                  <button class="vac-btn-icon bg-light color-danger" (click)="confirmDelete(r)">
                    <ion-icon name="trash-outline"></ion-icon>
                  </button>
                </div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>
        
        <div *ngIf="finanzasService.records().length === 0" class="vac-empty-state">
           <div class="empty-icon-ring">
              <ion-icon name="cash-outline"></ion-icon>
           </div>
           <h2>Cero Movimientos</h2>
           <p>Aún no has registrado ningún gasto o beneficio en tu cuenta.</p>
        </div>

      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="openAddModal()" color="primary">
          <ion-icon name="add-circle"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- MODAL DE MOVIMIENTO FINANCIERO -->
      <ion-modal [isOpen]="isModalOpen" (didDismiss)="closeModal()" class="vac-modal">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar color="primary">
              <ion-title>{{ editingItem ? 'Actualizar Registro' : 'Añadir Movimiento' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeModal()">
                  <ion-icon name="close-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>

          <ion-content class="ion-padding vac-modal-content">
            <div class="form-intro ion-text-center ion-padding-bottom">
               <div class="vac-icon-ring mb-4 mx-auto">
                  <ion-icon name="wallet-outline"></ion-icon>
               </div>
               <h3>Registro Contable</h3>
               <p class="color-medium">Anota cualquier venta, compra o gasto asociado a tu actividad ganadera.</p>
            </div>

            <form [formGroup]="finanzasForm">
              <ion-item class="vac-input">
                <ion-label position="stacked">Naturaleza de Movimiento *</ion-label>
                <ion-select formControlName="tipo" interface="popover" (ionChange)="onTipoChange()">
                  <ion-select-option value="Ingreso">Entrada (Ventas, Ayudas)</ion-select-option>
                  <ion-select-option value="Gasto">Salida (Compras, Salarios)</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item class="vac-input">
                <ion-label position="stacked">Categoría Principal *</ion-label>
                <ion-select formControlName="categoria" interface="popover">
                   <ion-select-option *ngFor="let cat of categoriasDisponibles" [value]="cat">
                     {{ cat }}
                   </ion-select-option>
                </ion-select>
              </ion-item>

              <div class="vac-item-group">
                <ion-item class="vac-input half">
                  <ion-label position="stacked">Fecha *</ion-label>
                  <ion-input type="date" formControlName="fecha"></ion-input>
                </ion-item>
                <ion-item class="vac-input half">
                  <ion-label position="stacked">Monto (€) *</ion-label>
                  <ion-input type="number" formControlName="monto" placeholder="0.00"></ion-input>
                </ion-item>
              </div>

              <div class="vac-modal-footer">
                <ion-button expand="block" (click)="saveData()" [disabled]="finanzasForm.invalid" class="btn-vac-save">
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
export class FinanzasComponent {
  public finanzasService = inject(FinanzasService);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private pdfService = inject(PdfService);
  private router = inject(Router);
  
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
        { 
          label: 'Ingresos (€)', 
          data: data.map(d => d.ingresos), 
          backgroundColor: '#1b4332', 
          borderColor: '#1b4332',
          borderWidth: 0,
          borderRadius: 4 
        },
        { 
          label: 'Gastos (€)', 
          data: data.map(d => -d.gastos), 
          backgroundColor: '#bc8a5f', 
          borderColor: '#bc8a5f',
          borderWidth: 0,
          borderRadius: 4 
        }
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

  goToDetail(id: string) {
    if (id) {
      this.router.navigate(['/animal-detail', id]);
    }
  }

  constructor() {
    addIcons({ addCircle, closeOutline, saveOutline, createOutline, trashOutline, walletOutline, trendingUpOutline, trendingDownOutline, cashOutline, arrowDownOutline, arrowUpOutline, documentTextOutline });
    this.finanzasForm = this.fb.group({
      tipo: ['Gasto', Validators.required],
      categoria: ['Alimentación y Pastos', Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01)]],
      fecha: [new Date().toISOString().split('T')[0], Validators.required]
    });
    this.categoriasDisponibles = [...this.categoriasGasto];
  }

  async exportarPDF() {
    const records = this.finanzasService.records();
    const headers = [['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto']];
    const body = records.map(r => [
      r.fecha ? new Date(r.fecha).toLocaleDateString() : 'N/A',
      r.tipo || '-',
      r.categoria || '-',
      r.descripcion || '-',
      (r.tipo === 'Ingreso' ? '+' : '-') + (r.monto || 0).toLocaleString() + '€'
    ]);

    const doc = await this.pdfService.getNewDoc();
    await this.pdfService.addTableToDoc(
      doc,
      'Balance Financiero - Vacapp ERP',
      headers,
      body,
      {
        startY: 25,
        columnStyles: {
          4: { halign: 'right', fontStyle: 'bold' }
        }
      }
    );

    // Agregar resumen al final
    const finalY = this.pdfService.getLastY(doc) + 10;
    const totalIngresos = records.filter(r => r.tipo === 'Ingreso').reduce((acc, r) => acc + (r.monto || 0), 0);
    const totalGastos = records.filter(r => r.tipo === 'Gasto').reduce((acc, r) => acc + (r.monto || 0), 0);
    const balance = totalIngresos - totalGastos;
    const now = new Date();
    
    doc.setFontSize(12);
    // Verde (#2B5329) si es positivo, Rojo (#BC4749) si es negativo
    doc.setTextColor(balance >= 0 ? 43 : 188, balance >= 0 ? 83 : 71, balance >= 0 ? 41 : 73); 
    doc.text(`Balance Neto: ${balance.toLocaleString()}€`, 14, finalY + 16);

    doc.save(`balance_financiero_vacapp_${now.getTime()}.pdf`);
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
