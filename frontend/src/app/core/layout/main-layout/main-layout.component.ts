import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { 
  IonApp, IonSplitPane, IonMenu, IonContent, IonList, 
  IonMenuToggle, IonItem, IonLabel, IonRouterOutlet,
  IonButton
} from '@ionic/angular/standalone';
import { 
  LucideAngularModule, LayoutDashboard, ClipboardList, Map, 
  HeartPulse, Syringe, Scale, ChevronLeft, ChevronRight, Leaf, Wheat
} from 'lucide-angular';

/**
 * Componente de Diseño Principal (Layout) - UI Profesional con Lucide.
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive,
    IonApp, IonSplitPane, IonMenu, IonContent, IonList, 
    IonMenuToggle, IonItem, IonLabel, IonRouterOutlet,
    IonButton,
    LucideAngularModule
  ],
  template: `
    <ion-app>
      <ion-split-pane contentId="main-content" [when]="'md'" [class.collapsed]="isCollapsed">
        
        <!-- Sidebar "The Forest Craft" -->
        <ion-menu contentId="main-content" type="overlay" class="rustic-sidebar">
          <ion-content class="ion-no-padding">
            
            <div class="sidebar-header-luxe">
              <div class="brand-wrapper" *ngIf="!isCollapsed">
                <div class="logo-circle" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);">
                  <lucide-icon name="wheat" style="color: #d4a373;" strokeWidth="2.5"></lucide-icon>
                </div>
                <div class="brand-text">
                  <span class="main-brand" style="color: #ffffff;">VACAPP</span>
                </div>
              </div>
              <ion-button fill="clear" (click)="toggleSidebar()" class="toggle-btn-luxe hide-on-mobile">
                <lucide-icon [name]="isCollapsed ? 'chevron-right' : 'chevron-left'" style="color: #ffffff"></lucide-icon>
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
                      <lucide-icon [name]="p.icon" size="22" strokeWidth="2.2"></lucide-icon>
                    </div>
                    <ion-label *ngIf="!isCollapsed" class="label-luxe">{{ p.title }}</ion-label>
                  </ion-item>
                </ion-menu-toggle>
              </ion-list>
            </div>

            <div class="sidebar-bottom-badge" *ngIf="!isCollapsed" style="display: flex; gap: 8px; align-items: center; justify-content: center; transform: translateY(-10px);">
              <lucide-icon name="leaf" size="18" style="color: rgba(255,255,255,0.6)"></lucide-icon>
              <span style="color: rgba(255,255,255,0.6); font-size: 0.9rem; font-weight: 600;">Gestión Ganadera</span>
            </div>

          </ion-content>
        </ion-menu>
        
        <ion-router-outlet id="main-content" class="content-canvas"></ion-router-outlet>
        
      </ion-split-pane>
    </ion-app>
  `
})
export class MainLayoutComponent {
  public isCollapsed = false;

  public appPages = [
    { title: 'Cuadro de Mando', url: '/dashboard', icon: 'layout-dashboard' },
    { title: 'Registro Ganadero', url: '/ganado', icon: 'clipboard-list' },
    { title: 'Gestión de Lotes', url: '/lotes', icon: 'map' },
    { title: 'Reproducción', url: '/reproduccion', icon: 'heart-pulse' },
    { title: 'Sanidad Animal', url: '/sanidad', icon: 'syringe' },
    { title: 'Recría & Pesaje', url: '/recria', icon: 'scale' },
  ];

  constructor() {}

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}
