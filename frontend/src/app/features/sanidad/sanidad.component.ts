import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem,
  IonLabel, IonBadge, IonIcon, IonButtons, IonMenuButton, IonFab, IonFabButton,
  IonModal, IonButton, IonInput, IonSelect, IonSelectOption,
  IonGrid, IonRow, IonCol,
  IonRefresher, IonRefresherContent, IonSearchbar, IonSkeletonText
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';
import { Sanidad, Bovino } from '../../core/models/vacapp.models';
import { addIcons } from 'ionicons';
import { 
  medkitOutline, flaskOutline, medicalOutline, addCircle, closeOutline, saveOutline, searchOutline, 
  calendarOutline, personOutline, createOutline, trashOutline, leafOutline, pulseOutline, waterOutline, 
  thermometerOutline, bandageOutline, warningOutline, filterOutline, arrowDownOutline, documentTextOutline
} from 'ionicons/icons';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PdfService } from '../../core/services/pdf.service';
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
    IonGrid, IonRow, IonCol,
    IonRefresher, IonRefresherContent, IonSearchbar, IonSkeletonText
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
  
  sanidadRecords: Sanidad[] = [];
  filteredSanidad = signal<Sanidad[]>([]);
  isLoading = signal<boolean>(true);
  
  isModalOpen = false;
  editingItem: Sanidad | null = null;
  healthForm: FormGroup;

  constructor() {
    addIcons({ 
      medkitOutline, flaskOutline, medicalOutline, addCircle, closeOutline, saveOutline, searchOutline, calendarOutline, 
      personOutline, createOutline, trashOutline, leafOutline, pulseOutline, waterOutline, thermometerOutline, bandageOutline, warningOutline, filterOutline, arrowDownOutline,
      documentTextOutline
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

  async loadData(event?: any) {
    this.isLoading.set(true);
    try {
      const { data: records } = await this.supa.getSanidad();
      this.sanidadRecords = records || [];
      this.filteredSanidad.set([...this.sanidadRecords]);
    } catch (e) {
      console.error('Error cargando datos sanitarios:', e);
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

  async exportarPDF() {
    this.presentToast('Generando PDF...', 'primary');
    
    const headers = [['Fecha', 'Crotal', 'Tratamiento', 'Producto', 'Observaciones']];
    const body = this.filteredSanidad().map(s => [
      s.fecha ? new Date(s.fecha).toLocaleDateString() : 'N/A',
      s.bovino?.crotal || 'S/N',
      s.tipo || '-',
      s.producto || '-',
      s.observaciones || '-'
    ]);

    await this.pdfService.generateTablePDF(
      'Registro Oficial de Sanidad - Vacapp',
      headers,
      body,
      'registro_sanidad_vacapp'
    );
  }

  onSearch(event: any) {
    const term = event.target.value.toLowerCase();
    if (!term) {
      this.filteredSanidad.set([...this.sanidadRecords]);
      return;
    }
    
    const filtered = this.sanidadRecords.filter(s => 
      s.bovino?.nombre?.toLowerCase().includes(term) ||
      s.bovino?.crotal?.toLowerCase().includes(term) ||
      s.producto.toLowerCase().includes(term) ||
      s.tipo.toLowerCase().includes(term)
    );
    this.filteredSanidad.set(filtered);
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
