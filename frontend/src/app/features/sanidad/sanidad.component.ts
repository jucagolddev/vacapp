import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem,
  IonLabel, IonBadge, IonIcon, IonButtons, IonMenuButton, IonFab, IonFabButton,
  IonModal, IonButton, IonInput, IonSelect, IonSelectOption,
  IonGrid, IonRow, IonCol,
  IonRefresher, IonRefresherContent, IonSearchbar, IonSkeletonText,
  IonPopover, IonSegment, IonSegmentButton
} from '@ionic/angular/standalone';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { SupabaseService } from '../../core/services/supabase.service';
import { Sanidad, Bovino } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { 
  medkitOutline, flaskOutline, medicalOutline, addCircle, closeOutline, saveOutline, searchOutline, 
  calendarOutline, personOutline, createOutline, trashOutline, leafOutline, pulseOutline, waterOutline, 
  thermometerOutline, bandageOutline, warningOutline, filterOutline, arrowDownOutline, documentTextOutline, statsChartOutline
} from 'ionicons/icons';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PdfService } from '../../core/services/pdf.service';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { GanadoService } from '../../core/services/ganado.service';

/**
 * @class SanidadComponent
 * @description Gestiona el historial clínico, vacunaciones y tratamientos veterinarios del ganado.
 * Permite el seguimiento de periodos de retiro, análisis estadístico de intervenciones
 * y generación de reportes sanitarios oficiales en PDF.
 */
@Component({
  selector: 'app-sanidad',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonTitle, 
    IonItem, IonLabel, IonBadge, IonIcon, IonButtons, IonMenuButton, 
    IonFab, IonFabButton, IonModal, IonButton, IonInput, IonSelect, IonSelectOption,
    IonGrid, IonRow, IonCol,
    IonRefresher, IonRefresherContent, IonSearchbar, IonSkeletonText,
    IonPopover, IonSegment, IonSegmentButton,
    BaseChartDirective
  ],
  templateUrl: './sanidad.component.html'
})
export class SanidadComponent implements OnInit {
  private supa = inject(SupabaseService);
  public ganadoService = inject(GanadoService);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private pdfService = inject(PdfService);
  private router = inject(Router);
  
  sanidadRecords = signal<Sanidad[]>([]);
  isLoading = signal<boolean>(true);
  searchTerm = signal<string>('');
  
  // Filtros Avanzados
  filterTipo = signal<string>('Todos');
  filterLote = signal<string>('Todos');
  isFilterPopoverOpen = false;
  filterEvent: Event | null = null;

  // Computado Reactivo para Filtrado Multidimensional
  filteredSanidad = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const tipo = this.filterTipo();
    const loteId = this.filterLote();
    let list = this.sanidadRecords();

    // 1. Texto (Animal, Crotal, Producto, Tipo)
    if (term) {
      list = list.filter(s => 
        s.bovino?.nombre?.toLowerCase().includes(term) ||
        s.bovino?.crotal?.toLowerCase().includes(term) ||
        s.producto?.toLowerCase().includes(term) ||
        s.tipo?.toLowerCase().includes(term)
      );
    }

    // 2. Tipo de intervención
    if (tipo !== 'Todos') {
      list = list.filter(s => s.tipo === tipo);
    }

    // 3. Lote (Recinto)
    if (loteId !== 'Todos') {
      list = list.filter(s => s.bovino?.lote_id === loteId);
    }

    return list;
  });
  
  isModalOpen = false;
  editingItem: Sanidad | null = null;
  healthForm: FormGroup;

  chartPeriodo = signal<'3m' | '6m' | '12m'>('6m');
  filterGlobal = signal<'3m' | '6m' | '12m'>('6m');

  // Gráfico de Distribución Sanitaria
  chartSanidad = computed<ChartConfiguration<'bar'>['data']>(() => {
    const list = this.filteredSanidad();
    const period = this.chartPeriodo();
    
    // Filtro temporal real
    const months = period === '3m' ? 3 : period === '6m' ? 6 : 12;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    
    const recs = list.filter(s => s.fecha && new Date(s.fecha) >= cutoff);
    
    const stats: Record<string, number> = {};
    recs.forEach(r => {
      stats[r.tipo] = (stats[r.tipo] || 0) + 1;
    });

    return {
      labels: Object.keys(stats),
      datasets: [{
        label: 'Nº Intervenciones',
        data: Object.values(stats),
        backgroundColor: ['#1b4332', '#52b788', '#d4a373', '#bc4749', '#582f0e'],
        borderRadius: 8
      }]
    };
  });

  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6c757d' } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#6c757d', stepSize: 1 } }
    }
  };

  constructor() {
    addIcons({ 
      medkitOutline, flaskOutline, medicalOutline, addCircle, closeOutline, saveOutline, searchOutline, calendarOutline, 
      personOutline, createOutline, trashOutline, leafOutline, pulseOutline, waterOutline, thermometerOutline, bandageOutline, warningOutline, filterOutline, arrowDownOutline,
      documentTextOutline, statsChartOutline
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

  /**
   * @description Carga los registros sanitarios desde el servicio central.
   * Maneja estados de carga y errores de conexión.
   * @param {Event} [event] Evento opcional del componente IonRefresher.
   * @returns {Promise<void>}
   */
  /**
   * @description Carga los registros sanitarios desde el servicio central.
   * Maneja estados de carga y errores de conexión de forma silenciosa para la UI.
   * @param {Event} [event] Evento opcional del componente IonRefresher.
   * @returns {Promise<void>}
   */
  async loadData(event?: Event) {
    this.isLoading.set(true);
    try {
      const { data: records } = await this.supa.getSanidad();
      this.sanidadRecords.set(records || []);
    } catch (e) {
      // Error silencioso: la interfaz mostrará estado vacío o mensaje de error reactivo
    } finally {
      this.isLoading.set(false);
      if (event && (event as any).target) {
        (event as any).target.complete();
      }
    }
  }

  /**
   * @description Maneja el evento de refresco (Pull-to-refresh) de la lista.
   * @param {Event} event Evento emitido por el componente IonRefresher.
   */
  handleRefresh(event: Event) {
    this.loadData(event);
  }

  /**
   * @description Función de optimización para el renderizado de listas (ngFor).
   * @param {number} index Índice del elemento en la lista.
   * @param {any} item Objeto o identificador.
   * @returns {string} Identificador único.
   */
  trackById(index: number, item: Sanidad | any): string {
    return item.id || index.toString();
  }

  /**
   * @description Navega a la vista de detalle de un animal específico.
   * @param {string} bovinoId UUID del bovino a visualizar.
   */
  goToDetail(bovinoId: string) {
    if (bovinoId) {
      this.router.navigate(['/animal-detail', bovinoId]);
    }
  }

  /**
   * @description Genera un reporte PDF con el listado actual de intervenciones sanitarias filtradas.
   * Utiliza PdfService para la construcción del documento.
   * @returns {Promise<void>}
   */
  async exportarPDF() {
    const headers = [['Fecha', 'Crotal', 'Tratamiento', 'Producto']];
    const data = this.filteredSanidad().map((item: Sanidad) => [
      item.fecha ? new Date(item.fecha).toLocaleDateString() : 'N/A',
      item.bovino?.crotal || 'S/N',
      item.tipo || '-',
      item.producto || '-'
    ]);

    await this.pdfService.generateTablePDF(
      'Registro Oficial de Sanidad - Vacapp',
      headers,
      data,
      'registro_sanidad_vacapp'
    );
  }

  /**
   * @description Actualiza el término de búsqueda al escribir en la barra.
   * @param {Event} event Evento emitido por el searchbar.
   */
  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value || '');
  }

  // --- LÓGICA DE FILTROS ---
  
  /**
   * @description Aplica el filtro temporal global para el gráfico.
   * @param {'3m' | '6m' | '12m'} periodo Periodo de tiempo a evaluar.
   */
  applyGlobalFilter(periodo: '3m' | '6m' | '12m') {
    this.filterGlobal.set(periodo);
    this.chartPeriodo.set(periodo);
  }

  /**
   * @description Abre el popover de filtros avanzados.
   * @param {Event} event Evento de clic en el botón de filtros.
   */
  presentFilter(event: Event) {
    this.filterEvent = event;
    this.isFilterPopoverOpen = true;
  }

  /**
   * @description Restablece todos los filtros de búsqueda a sus valores por defecto.
   */
  clearFilters() {
    this.filterTipo.set('Todos');
    this.filterLote.set('Todos');
    this.searchTerm.set('');
    this.isFilterPopoverOpen = false;
  }

  /**
   * @description Obtiene el icono correspondiente al tipo de intervención sanitaria.
   * @param {string} tipo Tipo de intervención.
   * @returns {string} Nombre del icono.
   */
  getHealthIcon(tipo: string): string {
    switch (tipo) {
      case 'Vacunación': return 'medical-outline';
      case 'Desparasitación': return 'flask-outline';
      case 'Saneamiento': return 'leaf-outline';
      case 'Enfermedad': return 'thermometer-outline';
      default: return 'medkit-outline';
    }
  }

  /**
   * @description Obtiene la clase CSS de color del badge según el tipo de intervención.
   * @param {string} tipo Tipo de intervención.
   * @returns {string} Clase CSS.
   */
  getBadgeColor(tipo: string): string {
    switch (tipo) {
      case 'Vacunación': return 'bg-success';
      case 'Desparasitación': return 'bg-secondary';
      case 'Enfermedad': return 'bg-danger';
      case 'Saneamiento': return 'bg-tertiary';
      default: return 'bg-primary';
    }
  }

  /**
   * @description Calcula los días restantes de retiro en carne/leche tras un tratamiento.
   * @param {Sanidad} s Registro sanitario a evaluar.
   * @returns {number} Días restantes.
   */
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

  /**
   * @description Abre el modal para crear un nuevo registro clínico.
   */
  openAddModal() {
    this.editingItem = null;
    this.healthForm.reset({
      tipo: 'Vacunación',
      fecha: new Date().toISOString().split('T')[0]
    });
    this.isModalOpen = true;
  }

  /**
   * @description Abre el modal y carga los datos para editar un registro existente.
   * @param {Sanidad} item Registro sanitario a editar.
   */
  openEditModal(item: Sanidad) {
    this.editingItem = item;
    const { bovino, ...data } = item;
    this.healthForm.patchValue(data);
    this.isModalOpen = true;
  }

  /**
   * @description Cierra el modal de formulario clínico.
   */
  closeModal() { this.isModalOpen = false; }

  /**
   * @description Guarda el registro clínico, ya sea creando uno nuevo o actualizando.
   */
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

  /**
   * @description Solicita confirmación antes de eliminar permanentemente un registro.
   * @param {Sanidad} item Registro a eliminar.
   */
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

  /**
   * @description Ejecuta el borrado del registro tras su confirmación.
   * @param {string} id UUID del registro a purgar.
   */
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
