import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { 
  IonSplitPane, IonMenu, IonContent, IonList, 
  IonMenuToggle, IonItem, IonLabel, IonRouterOutlet,
  IonHeader, IonToolbar, IonIcon, IonButton, IonModal, IonTitle, IonButtons, IonFooter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  pieChartOutline, pawOutline, layersOutline, heartHalfOutline, 
  medkitOutline, scaleOutline, walletOutline, logOutOutline, chevronBackOutline, chevronForwardOutline, leafOutline,
  sunnyOutline, moonOutline, qrCodeOutline
} from 'ionicons/icons';
import { AlertController } from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';

/**
 * @class MainLayoutComponent
 * @description Estructura base de la interfaz de usuario.
 * Proporciona la navegación lateral (Sidebar), el sistema de menús responsivo
 * y el contenedor principal (RouterOutlet) para todos los módulos del ERP.
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive,
    IonSplitPane, IonMenu, IonContent, IonList, 
    IonMenuToggle, IonItem, IonLabel, IonRouterOutlet,
    IonHeader, IonToolbar, IonIcon, IonButton, IonModal, IonTitle, IonButtons, IonFooter
  ],
  template: `
      <ion-split-pane contentId="main-content" [when]="'md'" [class.collapsed]="isCollapsed">
        
        <!-- Sidebar "The Forest Craft" -->
        <ion-menu contentId="main-content" type="overlay" class="vac-sidebar">
          <ion-header class="ion-no-border">
            <ion-toolbar>
              <div class="vac-sidebar-header" *ngIf="!isCollapsed">
                <div class="brand-wrapper">
                  <div class="logo-circle">
                    <ion-icon name="leaf-outline" class="color-white"></ion-icon>
                  </div>
                  <div class="brand-text">
                    <span class="main-brand">VACAPP</span>
                    <span class="sub-brand">AGRITECH ERP</span>
                  </div>
                </div>
              </div>
              <div class="ion-padding ion-text-center" *ngIf="isCollapsed">
                 <ion-icon name="leaf-outline" color="tertiary" size="large"></ion-icon>
              </div>
            </ion-toolbar>
          </ion-header>

          <ion-content class="ion-no-padding">
            <div style="display: flex; flex-direction: column; min-height: 100%;">
              
              <!-- Menú (Crece para ocupar espacio) -->
              <div class="vac-nav-container" style="flex: 1;">
                <ion-list lines="none" class="ion-no-padding vac-nav-list">
                  <ion-menu-toggle auto-hide="false" *ngFor="let p of appPages">
                    <ion-item 
                      button
                      lines="none"
                      routerDirection="root" 
                      [routerLink]="p.url" 
                      routerLinkActive="active-link"
                      [title]="p.title"
                      class="vac-nav-item">
                      <div slot="start" class="icon-frame">
                        <ion-icon [name]="p.icon"></ion-icon>
                      </div>
                      <ion-label *ngIf="!isCollapsed" class="vac-label">{{ p.title }}</ion-label>
                    </ion-item>
                  </ion-menu-toggle>
                  <ion-menu-toggle auto-hide="false">
                    <ion-item class="vac-nav-item" lines="none" button (click)="mostrarQr()">
                      <div slot="start" class="icon-frame" style="color: var(--ion-color-secondary)">
                        <ion-icon name="qr-code-outline"></ion-icon>
                      </div>
                      <ion-label *ngIf="!isCollapsed" class="vac-label" style="color: var(--ion-color-secondary)">Mostrar QR</ion-label>
                    </ion-item>
                  </ion-menu-toggle>
                  
                  <div class="nav-separator"></div>

                  <ion-item class="vac-nav-item logout-item" lines="none" button (click)="logout()">
                    <div slot="start" class="icon-frame danger">
                      <ion-icon name="log-out-outline"></ion-icon>
                    </div>
                    <ion-label *ngIf="!isCollapsed" class="vac-label">Cerrar Sesión</ion-label>
                  </ion-item>
                </ion-list>
              </div>

              <!-- Footer integrado al final del scroll -->
              <div class="sidebar-bottom-badge flex-col items-center justify-center pb-lg gap-2" *ngIf="!isCollapsed" style="margin-top: auto; padding-bottom: 30px;">
                <div class="flex-row items-center gap-2" style="display: flex; justify-content: center;">
                  <ion-icon name="leaf-outline" size="small" class="color-medium"></ion-icon>
                  <span class="color-medium text-sm font-semibold">Gestión Ganadera</span>
                </div>
                <div style="text-align: center; margin-bottom: 10px;">
                  <span class="color-medium opacity-80 text-xs">{{ profile.email }}</span>
                </div>
                
                <!-- THEME TOGGLE BUTTON -->
                <div style="text-align: center;">
                  <ion-button fill="clear" color="medium" (click)="toggleTheme()" class="theme-toggle-btn">
                    <ion-icon [name]="isDarkMode ? 'sunny-outline' : 'moon-outline'" slot="start"></ion-icon>
                    <span class="text-xs font-bold">{{ isDarkMode ? 'MODO CLARO' : 'MODO OSCURO' }}</span>
                  </ion-button>
                </div>
              </div>

            </div>
          </ion-content>
        </ion-menu>
        
        <div class="main-container" id="main-content">
          <ion-router-outlet class="content-canvas"></ion-router-outlet>
        </div>
        
      </ion-split-pane>

      <!-- Modal para mostrar el QR con la URL correcta -->
      <ion-modal [isOpen]="isQrModalOpen" (didDismiss)="isQrModalOpen = false" cssClass="vac-modal" style="--height: 480px; --width: 350px; --border-radius: 20px;">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar color="primary">
              <ion-title>Acceso en Vivo</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="isQrModalOpen = false">
                  <ion-icon name="close-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding ion-text-center">
            <h2 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: #1b4332; margin-bottom: 5px;">Escanea este QR</h2>
            <p style="font-family: 'Outfit', sans-serif; font-size: 0.85rem; color: #582f0e; margin-bottom: 20px; word-break: break-all;">{{ qrUrlApp }}</p>
            <div style="background: white; padding: 15px; border-radius: 16px; display: inline-block; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
              <img [src]="qrImageUrl" style="width: 250px; height: 250px;" alt="QR Code">
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>
  `
})
export class MainLayoutComponent {
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  public isCollapsed = false;
  public profile = { email: 'Cargando...' }; // Podría leerse del session

  // Propiedades para el QR dinámico
  public isQrModalOpen = false;
  public qrUrlApp = '';
  public qrImageUrl = '';

  public appPages = [
    { title: 'Cuadro de Mando', url: '/dashboard', icon: 'pie-chart-outline' },
    { title: 'Registro Ganadero', url: '/manejo', icon: 'paw-outline' },
    { title: 'Recintos & Potreros', url: '/lotes', icon: 'layers-outline' },
    { title: 'Reproducción', url: '/reproduccion', icon: 'heart-half-outline' },
    { title: 'Sanidad Animal', url: '/sanidad', icon: 'medkit-outline' },
    { title: 'Recría & Pesaje', url: '/recria', icon: 'scale-outline' },
    { title: 'Finanzas & Contabilidad', url: '/finanzas', icon: 'wallet-outline' },
  ];

  public isDarkMode = false;

  constructor() {
    addIcons({ pieChartOutline, pawOutline, layersOutline, heartHalfOutline, medkitOutline, scaleOutline, walletOutline, logOutOutline, chevronBackOutline, chevronForwardOutline, leafOutline, sunnyOutline, moonOutline, qrCodeOutline });
    
    // Iniciar Tema desde LocalStorage
    const saved = localStorage.getItem('vacapp-dark-mode');
    if (saved === 'true') {
      this.isDarkMode = true;
      document.documentElement.classList.add('ion-palette-dark');
    }

    this.loadProfile();
  }

  async loadProfile() {
    const { data: { session } } = await this.supabase.getUserSession();
    if (session?.user?.email) {
      this.profile = { email: session.user.email };
    } else {
      this.profile = { email: 'propietario@finca.com' }; // Fallback para dev visual
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('vacapp-dark-mode', this.isDarkMode.toString());
    document.documentElement.classList.toggle('ion-palette-dark', this.isDarkMode);
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  async logout() {
    await this.supabase.signOut();
    this.router.navigate(['/auth/login'], { replaceUrl: true });
  }

  async mostrarQr() {
    let urlApp = window.location.origin;

    // Si está corriendo en localhost, el QR no le servirá al público.
    if (window.location.hostname === 'localhost') {
      const alertIp = await this.alertCtrl.create({
        header: 'Configurar QR Dinámico',
        message: 'Estás en localhost. Para que el público se conecte, introduce la IP local de tu ordenador en este WiFi (ej: 192.168.1.50):',
        inputs: [
          {
            name: 'ip',
            type: 'text',
            placeholder: '192.168.X.X'
          }
        ],
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { 
            text: 'Generar QR', 
            handler: async (data) => {
              if (data.ip) {
                // Limpiar input por si el usuario pone http:// o puerto
                let cleanIp = data.ip.replace(/^https?:\/\//, '').split(':')[0];
                const finalUrl = `http://${cleanIp}:${window.location.port || '4200'}`;
                this.presentarAlertaQR(finalUrl);
              }
            }
          }
        ]
      });
      await alertIp.present();
    } else {
      // Si ya entró usando su IP (ej: http://192.168.x.x:4200)
      this.presentarAlertaQR(urlApp);
    }
  }

  private presentarAlertaQR(url: string) {
    // Generar el QR y abrir el modal
    this.qrUrlApp = url;
    this.qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    this.isQrModalOpen = true;
  }
}
