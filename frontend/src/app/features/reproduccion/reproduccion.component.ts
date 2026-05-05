import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, 
  IonLabel, IonBadge, IonIcon,
  IonButtons, IonMenuButton, IonFab, IonFabButton, IonModal,
  IonButton, IonInput, IonSelect, IonSelectOption,
  IonGrid, IonRow, IonCol,
  IonRefresher, IonRefresherContent, IonSearchbar, IonSkeletonText,
  IonPopover, IonSegment, IonSegmentButton
} from '@ionic/angular/standalone';
import { BaseChartDirective } from 'ng2-charts';
import { SupabaseService } from '../../core/services/supabase.service';
import { Reproduccion, Bovino } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { PdfService } from '../../core/services/pdf.service';
import { 
  calendarOutline, heartOutline, flaskOutline, hourglassOutline, addCircle, closeOutline, saveOutline, 
  timeOutline, createOutline, femaleOutline, trashOutline, statsChartOutline, ribbonOutline, pulseOutline, filterOutline, layersOutline, heartHalfOutline, arrowDownOutline, documentTextOutline
} from 'ionicons/icons';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { ReproduccionService } from '../../core/services/reproduccion.service';
import { GanadoService } from '../../core/services/ganado.service';
import { METODOS_REPRODUCCION, ESTADOS_GESTACION } from '../../core/constants/vaca.constants';
import { ChartConfiguration, ChartOptions } from 'chart.js';

/**
 * @class ReproduccionComponent
 * @description Módulo de gestión ginecológica y reproductiva.
 * Supervisa ciclos de celo, montas e inseminaciones, confirmaciones de gestación
 * y predicción automatizada de fechas de parto (gestación de 283 días).
 */
@Component({
  selector: 'app-reproduccion',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonTitle, 
    IonItem, IonLabel, IonBadge, IonIcon,
    IonButtons, IonMenuButton, IonFab, IonFabButton, IonModal, IonButton,
    IonInput, IonSelect, IonSelectOption, IonGrid, IonRow, IonCol,
    IonRefresher, IonRefresherContent, IonSearchbar, IonSkeletonText,
    IonPopover, IonSegment, IonSegmentButton,
    BaseChartDirective
  ],
  templateUrl: './reproduccion.component.html'
})
export class ReproduccionComponent implements OnInit {
  private supa = inject(SupabaseService);
  public ganadoService = inject(GanadoService);
  private reproService = inject(ReproduccionService);
  private router = inject(Router);

  public readonly METODOS = METODOS_REPRODUCCION;
  public readonly ESTADOS = ESTADOS_GESTACION;
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private pdfService = inject(PdfService);
  
  chartPeriodo = signal<'Mensual' | 'Anual'>('Mensual');
  filterGlobal = signal<'Mensual' | 'Anual'>('Mensual');

  // Gráfico de Fertilidad
  chartFertilidad = computed<ChartConfiguration<'bar'>['data']>(() => {
    const data = this.reproService.getEstadisticasConcepcion(this.chartPeriodo());
    return {
      labels: data.map(d => d.label),
      datasets: [
        { label: 'Gestación Exitosa', data: data.map(d => d.exitos), backgroundColor: '#52b788', borderRadius: 4 },
        { label: 'Fallo/Absorción', data: data.map(d => d.fallos), backgroundColor: '#ef4444', borderRadius: 4 }
      ]
    };
  });

  public chartOptionsPilarStacked: ChartOptions<'bar'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#6c757d' } } },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: '#6c757d' } },
      y: { stacked: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#6c757d' } }
    }
  };
  
  reproducciones = signal<Reproduccion[]>([]);
  gestacionesActivas = signal<Reproduccion[]>([]);
  
  isLoading = signal<boolean>(true);
  searchTerm = signal<string>('');

  // Filtros Avanzados
  filterEstado = signal<string>('Todos');
  filterMetodo = signal<string>('Todos');
  isFilterPopoverOpen = false;
  filterEvent: Event | null = null;

  // Computado para Historial Completo
  filteredReproducciones = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const estado = this.filterEstado();
    const metodo = this.filterMetodo();
    let list = this.reproducciones();

    if (term) {
      list = list.filter(r => 
        r.bovino?.nombre?.toLowerCase().includes(term) ||
        r.bovino?.crotal?.toLowerCase().includes(term) ||
        r.tipo_cubricion?.toLowerCase().includes(term)
      );
    }

    if (estado !== 'Todos') {
      list = list.filter(r => r.estado_gestacion === estado);
    }

    if (metodo !== 'Todos') {
      list = list.filter(r => r.tipo_cubricion === metodo);
    }

    return list;
  });

  // Computado para Gestaciones Activas (Solo 'Confirmada')
  filteredGestaciones = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const metodo = this.filterMetodo();
    let list = this.gestacionesActivas();

    if (term) {
      list = list.filter(r => 
        r.bovino?.nombre?.toLowerCase().includes(term) ||
        r.bovino?.crotal?.toLowerCase().includes(term)
      );
    }

    if (metodo !== 'Todos') {
      list = list.filter(r => r.tipo_cubricion === metodo);
    }

    return list;
  });

  isModalOpen = false;
  editingItem: Reproduccion | null = null;
  reproForm: FormGroup;

  constructor() {
    addIcons({ calendarOutline, heartOutline, flaskOutline, hourglassOutline, addCircle, closeOutline, saveOutline, timeOutline, createOutline, femaleOutline, trashOutline, statsChartOutline, ribbonOutline, pulseOutline, filterOutline, layersOutline, heartHalfOutline, arrowDownOutline, documentTextOutline });
    
    this.reproForm = this.fb.group({
      bovino_id: ['', Validators.required],
      fecha_celo: [''],
      fecha_cubricion: ['', Validators.required],
      tipo_cubricion: ['Monta Natural', Validators.required],
      estado_gestacion: ['Pendiente', Validators.required],
      fecha_parto_prevista: ['']
    });

    this.reproForm.get('fecha_cubricion')?.valueChanges.pipe(takeUntilDestroyed()).subscribe(val => {
      this.calculateParto(val);
    });
  }

  async ngOnInit() {
    this.loadData();
  }

  /**
   * Carga los datos reproductivos del sistema.
   * @param event Evento opcional de ion-refresher.
   */
  async loadData(event?: Event) {
    this.isLoading.set(true);
    try {
      const { data: repros } = await this.supa.getReproduccion();
      this.reproducciones.set(repros || []);
      this.gestacionesActivas.set((repros || []).filter(r => r.estado_gestacion === 'Confirmada'));
    } catch (e) {
      // Error silencioso para la UI, el estado isLoading gestiona la visualización
    } finally {
      this.isLoading.set(false);
      if (event && (event as any).target) {
        (event as any).target.complete();
      }
    }
  }

  /**
   * @description Maneja el evento de refresco deslizable.
   * @param event Evento del componente IonRefresher.
   */
  handleRefresh(event: Event) {
    this.loadData(event);
  }

  /**
   * @description Optimiza el renderizado de la lista.
   */
  trackById(index: number, item: Reproduccion | any): string {
    return item.id || index.toString();
  }

  /**
   * Navega a la ficha técnica de un animal.
   * @param bovinoId UUID del animal.
   */
  goToDetail(bovinoId: string) {
    if (bovinoId) {
      this.router.navigate(['/animal-detail', bovinoId]);
    }
  }

  /**
   * Genera un reporte PDF con el historial reproductivo actual.
   */
  async exportarPDF() {
    const headers = [['Vaca', 'Crotal', 'Fecha Cubrición', 'Método', 'Estado', 'FPP/Parto']];
    const body = this.filteredReproducciones().map(r => [
      r.bovino?.nombre || 'Res S/N',
      r.bovino?.crotal || 'S/N',
      r.fecha_cubricion ? new Date(r.fecha_cubricion).toLocaleDateString() : 'N/A',
      r.tipo_cubricion || '-',
      r.estado_gestacion || 'Pendiente',
      r.fecha_parto_prevista ? new Date(r.fecha_parto_prevista).toLocaleDateString() : 'Pendiente'
    ]);

    await this.pdfService.generateTablePDF(
      'Reporte de Reproducción y Ginecología - Vacapp',
      headers,
      body,
      'reporte_reproduccion_vacapp'
    );
  }

  /**
   * @description Actualiza el término de búsqueda al escribir.
   */
  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value || '');
  }

  // --- LÓGICA DE FILTROS ---
  /**
   * @description Aplica el filtro de periodo al gráfico.
   */
  applyGlobalFilter(periodo: 'Mensual' | 'Anual') {
    this.filterGlobal.set(periodo);
    this.chartPeriodo.set(periodo);
  }

  /**
   * @description Muestra el popover de filtros.
   */
  presentFilter(event: Event) {
    this.filterEvent = event;
    this.isFilterPopoverOpen = true;
  }

  /**
   * @description Limpia los filtros aplicados.
   */
  clearFilters() {
    this.filterEstado.set('Todos');
    this.filterMetodo.set('Todos');
    this.searchTerm.set('');
    this.isFilterPopoverOpen = false;
  }

  /**
   * Calcula automáticamente la fecha de parto prevista basada en la gestación bovina (283 días).
   * @param fechaCubricion Fecha en la que se realizó la monta o IA.
   */
  private calculateParto(fechaCubricion: string) {
    if (fechaCubricion) {
      const date = new Date(fechaCubricion);
      date.setDate(date.getDate() + 283);
      this.reproForm.get('fecha_parto_prevista')?.setValue(date.toISOString().split('T')[0], { emitEvent: false });
    }
  }

  /**
   * @description Calcula los días restantes para el parto.
   * @param repro Evento reproductivo.
   */
  getDaysToCalving(repro: Reproduccion): number {
    if (!repro.fecha_parto_prevista) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const calving = new Date(repro.fecha_parto_prevista);
    const diffTime = calving.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  /**
   * @description Devuelve el color del badge según el estado reproductivo.
   * @param estado Estado de la gestación.
   */
  getStatusColor(estado: string): string {
    switch (estado) {
      case 'Confirmada': return 'success';
      case 'Pendiente': return 'warning';
      case 'Parido': return 'secondary';
      case 'Fallida': return 'danger';
      default: return 'medium';
    }
  }

  /**
   * Abre el formulario para registrar un nuevo evento reproductivo.
   */
  openAddModal() {
    this.editingItem = null;
    this.reproForm.reset({
      tipo_cubricion: 'Monta Natural',
      estado_gestacion: 'Pendiente',
      fecha_cubricion: new Date().toISOString().split('T')[0]
    });
    this.isModalOpen = true;
  }

  /**
   * Abre el formulario en modo edición para un registro existente.
   * @param item Registro de reproducción a editar.
   */
  openEditModal(item: Reproduccion) {
    this.editingItem = item;
    const { bovino, ...data } = item;
    this.reproForm.patchValue(data);
    this.isModalOpen = true;
  }

  /**
   * Cierra los diálogos modales activos.
   */
  closeModal() { this.isModalOpen = false; }

  /**
   * @description Guarda un registro reproductivo.
   */
  async saveData() {
    if (this.reproForm.invalid) return;

    try {
      const payload = this.reproForm.value;
      const res = this.editingItem?.id 
        ? await this.supa.updateReproduccion(this.editingItem.id, payload)
        : await this.supa.createReproduccion(payload);

      if (res.error) {
        this.presentToast('Error al guardar: ' + res.error, 'danger');
      } else {
        this.presentToast('Registro reproductivo actualizado');
        this.isModalOpen = false;
        this.loadData();
      }
    } catch (e) {
      this.presentToast('Error de comunicación', 'danger');
    }
  }

  /**
   * @description Muestra una alerta de confirmación para eliminar.
   * @param item Registro a eliminar.
   */
  async confirmDelete(item: Reproduccion) {
    const alert = await this.alertCtrl.create({
      header: 'Auditoría de Linaje',
      message: '¿Confirma la eliminación permanente?',
      buttons: [
        { text: 'Conservar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.deleteRecord(item.id) }
      ]
    });
    await alert.present();
  }

  /**
   * @description Elimina el registro de la base de datos.
   * @param id Identificador del registro.
   */
  async deleteRecord(id: string) {
    const res = await this.supa.deleteReproduccion(id);
    if (res.error) {
      this.presentToast('Error al eliminar: ' + res.error, 'danger');
    } else {
      this.presentToast('Registro eliminado', 'warning');
      this.loadData();
    }
  }

  /**
   * @description Muestra un mensaje flotante en la parte inferior.
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
}
