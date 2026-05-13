import { Component, inject, OnInit, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, 
  IonLabel, IonIcon, IonNote, IonGrid, 
  IonRow, IonCol, IonButtons, IonMenuButton, IonFab, IonFabButton,
  IonModal, IonButton, IonInput, IonSelect, IonSelectOption,
  IonBadge,
  IonSearchbar, IonRefresher, IonRefresherContent, IonSkeletonText,
  IonPopover, IonSegment, IonSegmentButton
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';
import { Bovino, Lote } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { PdfService } from '../../core/services/pdf.service';
import { 
  pawOutline, listOutline, addCircle, closeOutline, checkmarkCircleOutline, personOutline, 
  maleOutline, femaleOutline, calendarOutline, barChartOutline, leafOutline,
  createOutline, trashOutline, arrowForwardOutline, chevronForwardOutline, megaphoneOutline,
  layersOutline, trendingUpOutline, filterOutline, searchOutline, documentTextOutline,
  qrCodeOutline, scanOutline
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
 * @class ManejoComponent
 * @description Gestiona el inventario principal y el censo ganadero de la finca.
 * Proporciona herramientas de búsqueda avanzada, filtros por estado productivo/lote,
 * y acceso rápido a la ficha técnica individual de cada animal.
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
    IonPopover, IonSegment, IonSegmentButton,
    BaseChartDirective
  ],
  templateUrl: './manejo.component.html',
  styleUrls: ['./manejo.component.scss']
})
export class ManejoComponent {
  public ganadoService = inject(GanadoService);
  private fincaService = inject(FincaService);
  private storageService = inject(StorageService);
  private offlineSync = inject(OfflineSyncService);
  private pesajeService = inject(PesajeService);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private pdfService = inject(PdfService);
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);
  
  bovinos = this.ganadoService.bovinos;
  lotes = this.fincaService.lotes;
  abrevaderos = signal<any[]>([]);
  
  // Estados de interfaz reactivos (Signals)
  /** Estado de carga asíncrona del servicio. */
  isLoading = signal<boolean>(true);
  /** Término actual introducido en la barra de búsqueda. */
  searchTerm = signal<string>('');
  
  // Filtros Avanzados
  filterEstado = signal<string>('Todos');
  filterLote = signal<string>('Todos');
  isFilterPopoverOpen = false;
  filterEvent: Event | null = null;

  /**
   * @description Computado maestro que devuelve la lista de bovinos procesada.
   * Aplica en cascada: Búsqueda de texto -> Filtro por Estado -> Filtro por Lote.
   * Se actualiza automáticamente (sin Zone.js explícito) cuando cambia cualquier signal dependiente.
   */
  filteredBovinos = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const estado = this.filterEstado();
    const loteId = this.filterLote();
    let list = this.bovinos();

    // 1. Filtro por búsqueda
    if (term) {
      list = list.filter(b => 
        (b.nombre?.toLowerCase() || '').includes(term) || 
        (b.crotal?.toLowerCase() || '').includes(term)
      );
    }

    // 2. Filtro por Estado (Mapeo a datos reales)
    if (estado !== 'Todos') {
      list = list.filter(b => {
        if (estado === 'Producción') return b.estado_reproductivo === 'Lactante';
        if (estado === 'Gestación') return b.estado_reproductivo === 'Gestante';
        if (estado === 'Seca') return b.estado_reproductivo === 'Seca';
        if (estado === 'Engorde') return b.aptitud === 'Carne';
        return true;
      });
    }

    // 3. Filtro por Lote
    if (loteId !== 'Todos') {
      list = list.filter(b => b.lote_id === loteId);
    }

    return list;
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
  isScannerOpen = false;
  editingItem: Bovino | null = null;
  currentStep = 1;
  isUploadingFile = false;

  razasOficiales = [
    { id: 'retinta', label: 'Retinta (Autóctona - Madres)' },
    { id: 'limousin', label: 'Limousin (Sementales)' },
    { id: 'f1_cross', label: 'Cruce F1 (Cebo)' }
  ];
  categoriasAnimal = ['Vaca Reproductora', 'Semental', 'Ternero/a', 'Novilla de Reposición', 'Descarte'];

  bovinoForm: FormGroup;

  /**
   * @constructor
   * @description Inicializa el componente de gestión ganadera.
   * Configura los iconos de sistema y el formulario reactivo de alta/edición.
   * Establece observadores reactivos para el estado de carga del servicio.
   */
  constructor() {
    addIcons({ pawOutline, listOutline, addCircle, closeOutline, checkmarkCircleOutline, personOutline, maleOutline, femaleOutline, calendarOutline, barChartOutline, leafOutline, createOutline, trashOutline, arrowForwardOutline, chevronForwardOutline, megaphoneOutline, layersOutline, trendingUpOutline, 'filter-outline': filterOutline, searchOutline, documentTextOutline, 'qr-code-outline': qrCodeOutline, 'scan-outline': scanOutline });
    this.bovinoForm = this.fb.group({
      nombre: ['', Validators.required],
      crotal: ['', [Validators.required, Validators.pattern(/^ES\d{12}$/)]],
      sexo: ['Hembra', Validators.required],
      raza: ['retinta', Validators.required],
      porcentaje_pureza: [100.0],
      aptitud: ['Carne', Validators.required],
      categoria: ['Vaca Reproductora', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      lote_id: ['', Validators.required],
      abrevadero_id: ['', Validators.required],
      estado_productivo: ['Alta', Validators.required],
      estado_reproductivo: ['Vacía'],
      foto_url: ['']
    });

    this.cargarAbrevaderos();

    // Enlazamos el estado de carga del servicio de ganado (sync service effect)
    effect(() => {
      this.isLoading.set(this.ganadoService.isLoading());
    }, { allowSignalWrites: true });
  }

  /**
   * @description Función de optimización para el renderizado de listas (ngFor).
   * @param {number} index Índice del elemento en la lista.
   * @param {any} item Objeto bovino o identificador.
   * @returns {string} Identificador único para el seguimiento de cambios.
   */
  trackById(index: number, item: any): string {
    return item?.id || item || index.toString();
  }

  /**
   * @description Retorna la clase CSS de borde según el estado reproductivo/salud del animal.
   */
  getStatusBorderClass(bovino: any): string {
    const estado = (bovino.estado_reproductivo || '').toLowerCase();
    if (estado.includes('gestante') || estado.includes('gestación')) return 'border-status-gestante';
    if (estado.includes('lactante') || estado.includes('producción')) return 'border-status-produccion';
    if (estado.includes('enferma') || estado.includes('urgente')) return 'border-status-enferma';
    if (estado.includes('seca')) return 'border-status-seca';
    if (estado.includes('engorde') || estado.includes('ceba')) return 'border-status-engorde';
    return 'border-status-sano';
  }

  /**
   * @description Actualiza el Signal de búsqueda en base a la entrada del usuario.
   * @param {Event} event Evento emitido por el componente ion-searchbar.
   */
  handleSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value || '');
  }

  goToDetail(id: string) {
    if (id) {
      this.router.navigate(['/animal-detail', id]);
    }
  }

  // --- LÓGICA DEL ESCÁNER QR ---

  /**
   * Abre el modal del escáner e inicializa la cámara tras un breve retardo
   * para asegurar que el elemento DOM #reader esté disponible.
   */
  async abrirScanner() {
    this.isScannerOpen = true;
    // Retardo para asegurar que el modal se ha renderizado y el div #reader existe
    setTimeout(() => {
      this.iniciarCamara();
    }, 200);
  }

  /**
   * Inicializa la librería de escaneo (html5-qrcode).
   * En un entorno real, aquí se instanciaría el escáner.
   */
  private iniciarCamara() {
    this.presentToast('Cámara inicializada', 'primary');
    
    // Simulación de detección exitosa para demostración
    setTimeout(() => {
      // Supongamos que detectamos un ID de animal
      const list = this.bovinos();
      if (list.length > 0) {
        const randomAnimal = list[Math.floor(Math.random() * list.length)];
        this.handleQrSuccess(randomAnimal.id);
      }
    }, 3000);
  }

  /**
   * Detiene la cámara y cierra el modal.
   */
  cerrarScanner() {
    this.isScannerOpen = false;
    // Aquí se llamaría a qrScanner.stop() si se usara la librería
  }

  /**
   * Procesa el resultado del escaneo, cierra el visor y navega al detalle.
   * @param animalId ID del animal detectado.
   */
  private handleQrSuccess(animalId: string) {
    this.cerrarScanner();
    this.presentToast('Animal identificado correctamente');
    this.goToDetail(animalId);
  }

  // --- LÓGICA DE FILTROS ---
  presentFilter(event: Event) {
    this.filterEvent = event;
    this.isFilterPopoverOpen = true;
  }

  clearFilters() {
    this.filterEstado.set('Todos');
    this.filterLote.set('Todos');
    this.searchTerm.set('');
    this.isFilterPopoverOpen = false;
  }

  async handleRefresh(event: Event) {
    const fincaId = this.fincaService.selectedFincaId();
    if (fincaId) {
      await this.ganadoService.loadBovinos(fincaId);
    }
    (event.target as any).complete();
  }

  /**
   * @description Exporta el censo actual filtrado a formato PDF utilizando `PdfService`.
   */
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
      raza: 'retinta',
      porcentaje_pureza: 100,
      aptitud: 'Carne',
      categoria: 'Vaca Reproductora',
      lote_id: '',
      abrevadero_id: '',
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

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
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

  /**
   * @description Persiste los cambios de la ficha del animal (Creación o Edición).
   * Gestiona automáticamente el modo offline delegando en OfflineSyncService si es necesario.
   */
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
       if (!res?.error) {
         // Generar log de trazabilidad
         const ubicacion = this.abrevaderos().find(a => a.id === payload.abrevadero_id)?.nombre || 'Desconocida';
         const logText = `Alta de animal ${payload.crotal} - Raza ${payload.raza} - Ubicación Inicial ${ubicacion}`;
         await this.supabaseService.logTrazabilidad(logText, (res as any).data?.id || (res as any).data?.[0]?.id);
       }
    }

    if (res?.error) {
      this.presentToast('Error al guardar: ' + res.error, 'danger');
    } else {
      this.presentToast('Ficha de animal actualizada con éxito');
      this.isModalOpen = false;
    }
  }

  /**
   * @description Inicia el proceso de baja definitiva (purga) de un animal.
   * Requiere confirmación doble (Alerta nativa destructiva) y soporta cola offline.
   * @param {string} id UUID del bovino a purgar.
   */
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

  /**
   * Muestra un mensaje flotante (Toast) al usuario.
   * @param message Texto a mostrar.
   * @param color Tono visual (success, danger, warning, primary).
   */
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

  async cargarAbrevaderos() {
    const { data } = await this.supabaseService.getWaterTroughs();
    if (data) {
      this.abrevaderos.set(data);
    }
  }
}
