import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { 
  IonSplitPane, IonMenu, IonContent, IonList, 
  IonMenuToggle, IonItem, IonLabel, IonRouterOutlet,
  IonHeader, IonToolbar, IonIcon, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  pieChartOutline, pawOutline, layersOutline, heartHalfOutline, 
  medkitOutline, scaleOutline, walletOutline, logOutOutline, chevronBackOutline, chevronForwardOutline, leafOutline,
  sunnyOutline, moonOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

/**
 * Componente de Diseño Principal (Layout) - UI Profesional.
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive,
    IonSplitPane, IonMenu, IonContent, IonList, 
    IonMenuToggle, IonItem, IonLabel, IonRouterOutlet,
    IonHeader, IonToolbar, IonIcon, IonButton
  ],
  template: `
      <ion-split-pane contentId="main-content" [when]="'md'" [class.collapsed]="isCollapsed">
        
        <!-- Sidebar "The Forest Craft" -->
        <ion-menu contentId="main-content" type="overlay" class="rustic-sidebar">
          <ion-header class="ion-no-border">
            <ion-toolbar>
              <div class="sidebar-header-luxe" *ngIf="!isCollapsed">
                <div class="brand-wrapper">
                  <div class="logo-circle">
                    <ion-icon name="leaf-outline" style="color: white;"></ion-icon>
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
            <div class="nav-container-luxe">
              <ion-list lines="none" class="ion-no-padding">
                <ion-menu-toggle auto-hide="false" *ngFor="let p of appPages">
                  <ion-item 
                    button
                    lines="none"
                    routerDirection="root" 
                    [routerLink]="p.url" 
                    routerLinkActive="active-link"
                    [title]="p.title"
                    class="nav-item-luxe">
                    <div slot="start" class="icon-frame">
                      <ion-icon [name]="p.icon"></ion-icon>
                    </div>
                    <ion-label *ngIf="!isCollapsed" class="label-luxe">{{ p.title }}</ion-label>
                  </ion-item>
                </ion-menu-toggle>
                
                <div class="nav-separator"></div>

                <ion-item class="nav-item-luxe logout-item" lines="none" button (click)="logout()">
                  <div slot="start" class="icon-frame danger">
                    <ion-icon name="log-out-outline"></ion-icon>
                  </div>
                  <ion-label *ngIf="!isCollapsed" class="label-luxe">Cerrar Sesión</ion-label>
                </ion-item>
              </ion-list>
            </div>

            <div class="sidebar-bottom-badge flex-col items-center justify-center pb-lg gap-2" *ngIf="!isCollapsed">
              <div class="flex-row items-center gap-2">
                <ion-icon name="leaf-outline" size="small" class="color-medium"></ion-icon>
                <span class="color-medium text-sm font-semibold">Gestión Ganadera</span>
              </div>
              <span class="color-medium opacity-80 text-xs mb-2">{{ profile()?.email }}</span>
              
              <!-- THEME TOGGLE BUTTON -->
              <ion-button fill="clear" color="medium" (click)="toggleTheme()" class="theme-toggle-btn">
                <ion-icon [name]="isDarkMode ? 'sunny-outline' : 'moon-outline'" slot="start"></ion-icon>
                <span class="text-xs font-bold">{{ isDarkMode ? 'MODO CLARO' : 'MODO OSCURO' }}</span>
              </ion-button>
            </div>
          </ion-content>

        </ion-menu>
        
        <ion-router-outlet id="main-content" class="content-canvas"></ion-router-outlet>
        
      </ion-split-pane>
  `
})
export class MainLayoutComponent {
  private auth = inject(AuthService);
  public isCollapsed = false;
  public profile = this.auth.profile;

  public appPages = [
    { title: 'Cuadro de Mando', url: '/dashboard', icon: 'pie-chart-outline' },
    { title: 'Registro Ganadero', url: '/ganado', icon: 'paw-outline' },
    { title: 'Recintos & Potreros', url: '/lotes', icon: 'layers-outline' },
    { title: 'Reproducción', url: '/reproduccion', icon: 'heart-half-outline' },
    { title: 'Sanidad Animal', url: '/sanidad', icon: 'medkit-outline' },
    { title: 'Recría & Pesaje', url: '/recria', icon: 'scale-outline' },
    { title: 'Finanzas & Contabilidad', url: '/finanzas', icon: 'wallet-outline' },
  ];

  public isDarkMode = false;

  constructor() {
    addIcons({ pieChartOutline, pawOutline, layersOutline, heartHalfOutline, medkitOutline, scaleOutline, walletOutline, logOutOutline, chevronBackOutline, chevronForwardOutline, leafOutline, sunnyOutline, moonOutline });
    
    // Iniciar Tema desde LocalStorage
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark-theme');
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    const theme = this.isDarkMode ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    this.auth.signOut();
  }
}
