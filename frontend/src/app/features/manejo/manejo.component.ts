import { Component, inject, OnInit, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, 
  IonLabel, IonIcon, IonNote, IonGrid, 
  IonRow, IonCol, IonButtons, IonMenuButton, IonFab, IonFabButton,
  IonModal, IonButton, IonInput, IonSelect, IonSelectOption,
  IonBadge,
  IonSearchbar, IonRefresher, IonRefresherContent, IonSkeletonText
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';
import { Bovino, Lote } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { PdfService } from '../../core/services/pdf.service';
import { 
  pawOutline, listOutline, addCircle, closeOutline, checkmarkCircleOutline, personOutline, 
  maleOutline, femaleOutline, calendarOutline, barChartOutline, leafOutline,
  createOutline, trashOutline, arrowForwardOutline, chevronForwardOutline, megaphoneOutline,
  layersOutline, trendingUpOutline, filterOutline, searchOutline, documentTextOutline
} from 'ionicons/icons';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { GanadoService } from '../../core/services/ganado.service';
import { FincaService } from '../../core/services/finca.service';
import { StorageService } from '../../core/services/storage.service';
import { OfflineSyncService } from '../../core/services/offline-sync.service';
import { PesajeService } from '../../core/services/pesaje.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

/**
 * Componente para el Módulo de Manejo (Antiguo Ganado).
 * Actualizado con Búsqueda en tiempo real, Skeletons y Pull-to-refresh.
 */
@Component({
  selector: 'app-manejo',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, 
    IonContent, IonHeader, IonToolbar, IonTitle, IonItem, 
    IonLabel, IonIcon, IonNote, IonGrid, 
    IonRow, IonCol, IonButtons, IonMenuButton, IonFab, IonFabButton,
    IonModal, IonButton, IonInput, IonSelect, IonSelectOption,
    IonBadge,
    IonSearchbar, IonRefresher, IonRefresherContent, IonSkeletonText,
    BaseChartDirective
  ],
  templateUrl: './manejo.component.html',
  styleUrls: ['./manejo.component.scss']
})
export class ManejoComponent implements OnInit {
  public ganadoService = inject(GanadoService);
  private fincaService = inject(FincaService);
  private storageService = inject(StorageService);
  private offlineSync = inject(OfflineSyncService);
  private pesajeService = inject(PesajeService);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private pdfService = inject(PdfService);
  
  bovinos = this.ganadoService.bovinos;
  lotesArr: Lote[] = []; // Opcional, dependiendo de si quieres rellenarlo aquí.
  lotes = this.fincaService.fincas;
  
  // Estados de interfaz y búsqueda
  isLoading = signal<boolean>(true);
  searchTerm = signal<string>('');

  // Computado que retorna la lista filtrada de bovinos basada en el searchbar
  filteredBovinos = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.bovinos();
    if (!term) return list;
    return list.filter(b => 
      (b.nombre?.toLowerCase() || '').includes(term) || 
      (b.crotal?.toLowerCase() || '').includes(term)
    );
  });

  // Gráfico de Pesos
  chartPesos = computed<ChartConfiguration<'line'>['data']>(() => {
    const data = this.pesajeService.getEvolucionPrincipales('Mensual');
    return {
      labels: data.labels,
      datasets: data.datasets
    };
  });

  public chartOptionsPilarLine: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#6c757d', font: { size: 11 } } } },
    scales: {
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#6c757d' }, title: { display: true, text: 'Kilos (Kg)', color: '#6c757d' } },
      x: { grid: { display: false }, ticks: { color: '#6c757d' } }
    }
  };

  isModalOpen = false;
  editingItem: Bovino | null = null;
  currentStep = 1;
  isUploadingFile = false;

  bovinoForm: FormGroup;

  constructor() {
    addIcons({ pawOutline, listOutline, addCircle, closeOutline, checkmarkCircleOutline, personOutline, maleOutline, femaleOutline, calendarOutline, barChartOutline, leafOutline, createOutline, trashOutline, arrowForwardOutline, chevronForwardOutline, megaphoneOutline, layersOutline, trendingUpOutline, filterOutline: 'filter-outline', searchOutline, documentTextOutline });
    this.bovinoForm = this.fb.group({
      nombre: ['', Validators.required],
      crotal: ['', Validators.required],
      sexo: ['Hembra', Validators.required],
      raza: ['Cruce / Mestizo', Validators.required],
      porcentaje_pureza: [100.0],
      aptitud: ['Carne', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      lote_id: [''],
      estado_productivo: ['Alta', Validators.required],
      estado_reproductivo: ['Vacía'],
      foto_url: ['']
    });

    // Enlazamos el estado de carga del servicio de ganado (sync service effect)
    effect(() => {
      this.isLoading.set(this.ganadoService.isLoading());
    }, { allowSignalWrites: true });
  }

  async ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.lotesArr = []; 
  }

  handleSearch(event: any) {
    this.searchTerm.set(event.detail.value || '');
  }

  async handleRefresh(event: any) {
    const fincaId = this.fincaService.selectedFincaId();
    if (fincaId) {
      await this.ganadoService.loadBovinos(fincaId);
    }
    event.target.complete();
  }

  async exportarPDF() {
    this.presentToast('Generando Censo de Animales...', 'primary');
    
    const headers = [['Crotal', 'Nombre', 'Sexo', 'Raza', 'Aptitud', 'Lote']];
    const body = this.filteredBovinos().map(b => [
      b.crotal || '-',
      b.nombre || '-',
      b.sexo || '-',
      b.raza || 'N/A',
      b.aptitud || 'N/A',
      b.lote?.nombre || 'Sin Lote'
    ]);

    await this.pdfService.generateTablePDF(
      'Censo de Bovinos - Vacapp ERP',
      headers,
      body,
      'censo_bovinos_vacapp'
    );
  }

  isStepValid(step: number): boolean {
    if (step === 1) return !!this.bovinoForm.get('nombre')?.value && !!this.bovinoForm.get('crotal')?.value;
    if (step === 2) return !!this.bovinoForm.get('sexo')?.value;
    return true;
  }

  openAddModal() {
    this.editingItem = null;
    this.currentStep = 1;
    this.bovinoForm.reset({ 
      sexo: 'Hembra', 
      raza: 'Cruce / Mestizo',
      porcentaje_pureza: 100,
      aptitud: 'Carne',
      estado_productivo: 'Alta',
      estado_reproductivo: 'Vacía'
    });
    this.isModalOpen = true;
  }

  openEditModal(bovino: Bovino) {
    this.editingItem = bovino;
    this.currentStep = 1;
    this.bovinoForm.patchValue(bovino);
    this.isModalOpen = true;
  }

  closeModal() { this.isModalOpen = false; }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!this.fincaService.selectedFincaId()) {
        this.presentToast('Debes seleccionar una finca primero', 'warning');
        return;
      }
      this.isUploadingFile = true;
      const animalIdPlaceholder = this.editingItem?.id || 'temp';
      const { data, error } = await this.storageService.uploadAnimalPhoto(file, this.fincaService.selectedFincaId()!, animalIdPlaceholder);
      this.isUploadingFile = false;
      
      if (error) {
        this.presentToast('Error al subir imagen', 'danger');
      } else if (data?.publicUrl) {
        this.bovinoForm.patchValue({ foto_url: data.publicUrl });
        this.presentToast('Imagen subida correctamente');
      }
    }
  }

  async saveData() {
    if (this.bovinoForm.invalid) return;
    const payload = this.bovinoForm.value;

    let res;
    if (this.editingItem?.id) {
       if (!this.offlineSync.isOnline()) {
          this.offlineSync.enqueueOperation('bovinos', 'PUT', payload, this.editingItem.id);
          this.presentToast('Guardado en cola offline', 'warning');
          this.closeModal();
          return;
       }
       res = await this.ganadoService.updateBovino(this.editingItem.id, payload);
    } else {
       if (!this.offlineSync.isOnline()) {
          this.offlineSync.enqueueOperation('bovinos', 'POST', payload);
          this.presentToast('Guardado en cola offline', 'warning');
          this.closeModal();
          return;
       }
       res = await this.ganadoService.createBovino(payload);
    }

    if (res?.error) {
      this.presentToast('Error al guardar: ' + res.error, 'danger');
    } else {
      this.presentToast('Ficha de animal actualizada con éxito');
      this.isModalOpen = false;
    }
  }

  async confirmDelete(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Purgar Registro',
      message: '¿Confirma la baja definitiva de este animal?',
      buttons: [
        { text: 'Conservar', role: 'cancel' },
        { 
          text: 'Continuar Baja', 
          role: 'destructive',
          handler: async () => {
            if (!this.offlineSync.isOnline()) {
              this.offlineSync.enqueueOperation('bovinos', 'DELETE', {}, id);
              this.presentToast('Borrado en cola offline', 'warning');
              return;
            }
            
            // Forzamos operación en cola
            this.offlineSync.enqueueOperation('bovinos', 'DELETE', {}, id);
            this.presentToast('Ejemplar purgado del sistema', 'warning');
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
