import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonGrid, IonRow, IonCol, 
  IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, 
  IonButtons, IonMenuButton, IonBadge, IonText, IonProgressBar
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';
import { 
  LucideAngularModule, PawPrint, Activity, Heart, TrendingUp, AlertCircle, Calendar
} from 'lucide-angular';

/**
 * Cuadro de Mando Principal - Versión Rústica Elite.
 * Refactorizado: 100% Sincronización de colores con _variables.scss.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonGrid, IonRow, IonCol, 
    IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, 
    IonButtons, IonMenuButton, IonBadge, IonText, IonProgressBar,
    LucideAngularModule
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Vacapp</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="container" style="padding-top: 2rem;">
        
        <!-- Bienvenida -->
        <div>
          <h1 class="dashboard-title">Resumen de Explotación</h1>
          <p style="color: var(--ion-color-medium); margin-bottom: 2rem; font-size: 1.1rem;">Estado del ganado y notificaciones en tiempo real.</p>
        </div>

        <div class="dashboard-grid">
          
          <!-- Card de Censo -->
          <div class="dashboard-card">
            <div class="card-header">
              <span style="font-weight: 700;">Censo Total</span>
              <lucide-icon name="paw-print" size="24"></lucide-icon>
            </div>
            <div class="card-content">
              <h3>Cabezas de Ganado</h3>
              <div class="card-value">{{ stats.totalAnimales }}</div>
              <p style="display:flex; align-items:center; gap: 6px;">
                <lucide-icon name="trending-up" size="18"></lucide-icon>
                <span>Crecimiento estable</span>
              </p>
            </div>
          </div>

          <!-- Card de Alertas (Marrón Rústico) -->
          <div class="dashboard-card card-brown">
            <div class="card-header">
              <span style="font-weight: 700;">Alertas de Salud</span>
              <lucide-icon name="activity" size="24"></lucide-icon>
            </div>
            <div class="card-content">
              <h3>Incidencias Activas</h3>
              <div class="card-value">{{ stats.alertasSanitarias }}</div>
              <p style="display:flex; align-items:center; gap: 6px;">
                <lucide-icon name="alert-circle" size="18"></lucide-icon>
                <span>Requiere supervisión veterinaria</span>
              </p>
            </div>
          </div>

          <!-- Card de Gestación -->
          <div class="dashboard-card">
            <div class="card-header">
              <span style="font-weight: 700;">Reproducción</span>
              <lucide-icon name="heart" size="24"></lucide-icon>
            </div>
            <div class="card-content">
              <h3>Gestaciones Activas</h3>
              <div class="card-value">{{ stats.gestacionesActivas }}</div>
              <p style="display:flex; align-items:center; gap: 6px;">
                <lucide-icon name="calendar" size="18"></lucide-icon>
                <span>Programación en curso</span>
              </p>
            </div>
          </div>
          
        </div>

      </div>
    </ion-content>
  `
})
export class DashboardComponent implements OnInit {
  private supa = inject(SupabaseService);
  
  stats = {
    totalAnimales: 0,
    alertasSanitarias: 3,
    gestacionesActivas: 0
  };

  constructor() {}

  async ngOnInit() {
    await this.loadStats();
  }

  async loadStats() {
    try {
      const { data: bovinos } = await this.supa.getAll<any>('bovinos');
      const { data: repros } = await this.supa.getReproduccion();
      
      this.stats.totalAnimales = (bovinos || []).length;
      this.stats.gestacionesActivas = (repros || []).length;
    } catch (e) {
      console.error('Error cargando estadísticas:', e);
    }
  }
}
