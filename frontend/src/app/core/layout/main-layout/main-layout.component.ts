import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { 
  IonApp, IonSplitPane, IonMenu, IonContent, IonList, 
  IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet,
  IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  homeOutline, homeSharp, 
  pawOutline, pawSharp, 
  businessOutline, businessSharp, 
  heartOutline, heartSharp, 
  medkitOutline, medkitSharp, 
  fitnessOutline, fitnessSharp,
  menuOutline, chevronBackOutline, chevronForwardOutline,
  leafOutline, leafSharp, paw
} from 'ionicons/icons';

/**
 * Componente de Diseño Principal (Layout) - Edición Lujo Bosque & Tierra.
 * Refactorizado: Estilos centralizados en _luxe.scss.
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive,
    IonApp, IonSplitPane, IonMenu, IonContent, IonList, 
    IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet,
    IonButton
  ],
  template: `
    <ion-app>
      <ion-split-pane contentId="main-content" [when]="'md'" [class.collapsed]="isCollapsed">
        
        <!-- Sidebar "The Forest Craft" -->
        <ion-menu contentId="main-content" type="overlay" class="premium-sidebar">
          <ion-content class="ion-no-padding">
            
            <div class="sidebar-header-luxe">
              <div class="brand-wrapper" *ngIf="!isCollapsed">
                <div class="logo-circle">
                  <ion-icon name="leaf" class="text-gold"></ion-icon>
                </div>
                <div class="brand-text">
                  <span class="main-brand">VACAPP</span>
                  <span class="sub-brand">PREMIUM EDITION</span>
                </div>
              </div>
              <ion-button fill="clear" (click)="toggleSidebar()" class="toggle-btn-luxe hide-on-mobile">
                <ion-icon [name]="isCollapsed ? 'chevron-forward-outline' : 'chevron-back-outline'"></ion-icon>
              </ion-button>
            </div>

            <div class="nav-container-luxe">
              <ion-list id="luxe-nav" lines="none" class="ion-no-padding">
                <ion-menu-toggle auto-hide="false" *ngFor="let p of appPages">
                  <ion-item 
                    routerDirection="forward" 
                    [routerLink]="[p.url]" 
                    routerLinkActive="selected"
                    [title]="p.title"
                    class="nav-item-luxe">
                    <div class="icon-frame" slot="start">
                      <ion-icon [ios]="p.icon + '-outline'" [md]="p.icon + '-sharp'"></ion-icon>
                    </div>
                    <ion-label *ngIf="!isCollapsed" class="label-luxe">{{ p.title }}</ion-label>
                  </ion-item>
                </ion-menu-toggle>
              </ion-list>
            </div>

            <div class="sidebar-bottom-badge" *ngIf="!isCollapsed">
              <div class="badge-content">
                <ion-icon name="paw"></ion-icon>
                <span>Gestión de Élite</span>
              </div>
            </div>

          </ion-content>
        </ion-menu>
        
        <ion-router-outlet id="main-content" class="content-canvas"></ion-router-outlet>
        
      </ion-split-pane>
    </ion-app>
  `,
  styles: [`
    /* Estilos estructurales mínimos (el resto en _luxe.scss) */
    .sidebar-bottom-badge {
      position: absolute;
      bottom: 30px;
      left: 15px;
      right: 15px;
    }

    .badge-content {
      background: rgba(156, 102, 68, 0.15);
      border: 1px solid rgba(156, 102, 68, 0.2);
      padding: 12px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #d4a373;
      font-size: 13px;
      font-weight: 700;
    }

    @media (max-width: 768px) {
      .hide-on-mobile { display: none; }
      ion-split-pane.collapsed { --side-width: 280px; }
    }
  `]
})
export class MainLayoutComponent {
  public isCollapsed = false;

  public appPages = [
    { title: 'Cuadro de Mando', url: '/dashboard', icon: 'home' },
    { title: 'Registro Ganadero', url: '/ganado', icon: 'paw' },
    { title: 'Gestión de Lotes', url: '/lotes', icon: 'business' },
    { title: 'Reproducción', url: '/reproduccion', icon: 'heart' },
    { title: 'Sanidad Animal', url: '/sanidad', icon: 'medkit' },
    { title: 'Recría & Pesaje', url: '/recria', icon: 'fitness' },
  ];

  constructor() {
    addIcons({
      homeOutline, homeSharp,
      pawOutline, pawSharp,
      businessOutline, businessSharp,
      heartOutline, heartSharp,
      medkitOutline, medkitSharp,
      fitnessOutline, fitnessSharp,
      menuOutline, chevronBackOutline, chevronForwardOutline,
      leafOutline, leafSharp, paw
    });
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}
