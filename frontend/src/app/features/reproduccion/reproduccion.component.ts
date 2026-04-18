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
  IonRefresher, IonRefresherContent, IonSearchbar, IonSkeletonText
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
 * Componente para el Módulo de Reproducción y Ginecología - Versión Rústica.
 * Refactorizado: 100% Sincronización de colores con _variables.scss.
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
  
  // Gráfico de Fertilidad
  chartFertilidad = computed<ChartConfiguration<'bar'>['data']>(() => {
    const data = this.reproService.getEstadisticasConcepcion('Mensual');
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
  
  reproducciones: Reproduccion[] = [];
  gestacionesActivas: Reproduccion[] = [];
  
  filteredReproducciones = signal<Reproduccion[]>([]);
  filteredGestaciones = signal<Reproduccion[]>([]);
  isLoading = signal<boolean>(true);

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

  async loadData(event?: any) {
    this.isLoading.set(true);
    try {
      const { data: repros } = await this.supa.getReproduccion();
      this.reproducciones = repros || [];
      this.gestacionesActivas = this.reproducciones.filter(r => r.estado_gestacion === 'Confirmada');
      
      this.filteredReproducciones.set([...this.reproducciones]);
      this.filteredGestaciones.set([...this.gestacionesActivas]);
    } catch (e) {
      console.error('Error cargando datos reproductivos:', e);
    } finally {
      this.isLoading.set(false);
      if (event && event.target) {
        event.target.complete();
      }
    }
  }

  handleRefresh(event: any) {
    this.loadData(event);
  }

  goToDetail(bovinoId: string) {
    if (bovinoId) {
      this.router.navigate(['/animal-detail', bovinoId]);
    }
  }

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

  onSearch(event: any) {
    const term = event.target.value.toLowerCase();
    if (!term) {
      this.filteredReproducciones.set([...this.reproducciones]);
      this.filteredGestaciones.set([...this.gestacionesActivas]);
      return;
    }
    
    const reproFilter = this.reproducciones.filter(r => 
      r.bovino?.nombre?.toLowerCase().includes(term) ||
      r.bovino?.crotal?.toLowerCase().includes(term) ||
      r.tipo_cubricion?.toLowerCase().includes(term)
    );
    this.filteredReproducciones.set(reproFilter);

    const gestFilter = this.gestacionesActivas.filter(r => 
      r.bovino?.nombre?.toLowerCase().includes(term) ||
      r.bovino?.crotal?.toLowerCase().includes(term) ||
      r.tipo_cubricion?.toLowerCase().includes(term)
    );
    this.filteredGestaciones.set(gestFilter);
  }

  private calculateParto(fechaCubricion: string) {
    if (fechaCubricion) {
      const date = new Date(fechaCubricion);
      date.setDate(date.getDate() + 283);
      this.reproForm.get('fecha_parto_prevista')?.setValue(date.toISOString().split('T')[0], { emitEvent: false });
    }
  }

  getDaysToCalving(repro: Reproduccion): number {
    if (!repro.fecha_parto_prevista) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const calving = new Date(repro.fecha_parto_prevista);
    const diffTime = calving.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  getStatusColor(estado: string): string {
    switch (estado) {
      case 'Confirmada': return 'success';
      case 'Pendiente': return 'warning';
      case 'Parido': return 'secondary';
      case 'Fallida': return 'danger';
      default: return 'medium';
    }
  }

  openAddModal() {
    this.editingItem = null;
    this.reproForm.reset({
      tipo_cubricion: 'Monta Natural',
      estado_gestacion: 'Pendiente',
      fecha_cubricion: new Date().toISOString().split('T')[0]
    });
    this.isModalOpen = true;
  }

  openEditModal(item: Reproduccion) {
    this.editingItem = item;
    const { bovino, ...data } = item;
    this.reproForm.patchValue(data);
    this.isModalOpen = true;
  }

  closeModal() { this.isModalOpen = false; }

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

  async deleteRecord(id: string) {
    const res = await this.supa.deleteReproduccion(id);
    if (res.error) {
      this.presentToast('Error al eliminar: ' + res.error, 'danger');
    } else {
      this.presentToast('Registro eliminado', 'warning');
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
