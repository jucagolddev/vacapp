import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { 
  IonSplitPane, IonMenu, IonContent, IonList, 
  IonMenuToggle, IonItem, IonLabel, IonRouterOutlet,
  IonButton
} from '@ionic/angular/standalone';
import { 
  LucideAngularModule, LayoutDashboard, ClipboardList, Map, 
  HeartPulse, Syringe, Scale, ChevronLeft, ChevronRight, Leaf, Wheat, LogOut, Wallet
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

/**
 * Componente de Diseño Principal (Layout) - UI Profesional con Lucide.
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive,
    IonSplitPane, IonMenu, IonContent, IonList, 
    IonMenuToggle, IonItem, IonLabel, IonRouterOutlet,
    IonButton,
    LucideAngularModule
  ],
  template: `
      <ion-split-pane contentId="main-content" [when]="'md'" [class.collapsed]="isCollapsed">
        
        <!-- Sidebar "The Forest Craft" -->
        <ion-menu contentId="main-content" type="overlay" class="rustic-sidebar">
          <ion-content class="ion-no-padding">
            
            <div class="sidebar-header-luxe">
              <div class="brand-wrapper" *ngIf="!isCollapsed">
                <div class="logo-circle brand-circle">
                  <lucide-icon name="wheat" class="color-tertiary" strokeWidth="2.5"></lucide-icon>
                </div>
                <div class="brand-text">
                  <span class="main-brand color-white">VACAPP</span>
                </div>
              </div>
              <ion-button fill="clear" (click)="toggleSidebar()" class="toggle-btn-luxe hide-on-mobile">
                <lucide-icon [name]="isCollapsed ? 'chevron-right' : 'chevron-left'" class="color-white"></lucide-icon>
              </ion-button>
            </div>

            <div class="nav-container-luxe flex-1">
              <ion-list id="luxe-nav" lines="none" class="ion-no-padding">
                <ion-menu-toggle auto-hide="false" *ngFor="let p of appPages">
                  <ion-item 
                    button
                    routerDirection="root" 
                    [routerLink]="p.url" 
                    routerLinkActive="active-link"
                    [title]="p.title"
                    class="nav-item-luxe">
                    <div class="icon-frame" slot="start">
                      <lucide-icon [name]="p.icon" size="22" strokeWidth="2.2"></lucide-icon>
                    </div>
                    <ion-label *ngIf="!isCollapsed" class="label-luxe">{{ p.title }}</ion-label>
                  </ion-item>
                </ion-menu-toggle>
                
                <ion-item class="nav-item-luxe mt-md" button (click)="logout()">
                  <div class="icon-frame icon-bg-danger-light" slot="start">
                    <lucide-icon name="log-out" size="22" strokeWidth="2.2" class="color-danger"></lucide-icon>
                  </div>
                  <ion-label *ngIf="!isCollapsed" class="label-luxe color-danger">Cerrar Sesión</ion-label>
                </ion-item>
              </ion-list>
            </div>

            <div class="sidebar-bottom-badge flex-col items-center justify-center pb-lg gap-1" *ngIf="!isCollapsed">
              <div class="flex-row items-center gap-2">
                <lucide-icon name="leaf" size="18" class="color-white opacity-80"></lucide-icon>
                <span class="color-white opacity-80 text-sm font-semibold">Gestión Ganadera</span>
              </div>
              <span class="color-white opacity-80 text-xs">{{ profile()?.email }}</span>
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
    { title: 'Cuadro de Mando', url: '/dashboard', icon: 'layout-dashboard' },
    { title: 'Registro Ganadero', url: '/ganado', icon: 'clipboard-list' },
    { title: 'Recintos & Potreros', url: '/lotes', icon: 'map' },
    { title: 'Reproducción', url: '/reproduccion', icon: 'heart-pulse' },
    { title: 'Sanidad Animal', url: '/sanidad', icon: 'syringe' },
    { title: 'Recría & Pesaje', url: '/recria', icon: 'scale' },
    { title: 'Finanzas & Contabilidad', url: '/finanzas', icon: 'wallet' },
  ];

  constructor() {}

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    this.auth.signOut();
  }
}
