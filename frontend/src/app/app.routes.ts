import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';

/**
 * Configuración de las rutas principales de la aplicación.
 * Define la jerarquía de navegación y la carga perezosa (lazy-loading) de los módulos.
 */
export const routes: Routes = [
  // Módulo de Autenticación Público
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      // Ruta por defecto: Redirige al Dashboard
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      // Módulo de Cuadro de Mando
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      // Gestión de Ganado (Inventario de Bovinos)
      {
        path: 'ganado',
        loadComponent: () => import('./features/ganado/ganado.component').then(m => m.GanadoComponent)
      },
      // Gestión de Lotes y Recintos
      {
        path: 'lotes',
        loadComponent: () => import('./features/lotes/lotes.component').then(m => m.LotesComponent)
      },
      // Módulo de Reproducción (Gestaciones y Partos)
      {
        path: 'reproduccion',
        loadComponent: () => import('./features/reproduccion/reproduccion.component').then(m => m.ReproduccionComponent)
      },
      // Módulo de Sanidad (Historial Clínico)
      {
        path: 'sanidad',
        loadComponent: () => import('./features/sanidad/sanidad.component').then(m => m.SanidadComponent)
      },
      // Módulo de Recría (Pesajes y Alimentación)
      {
        path: 'recria',
        loadComponent: () => import('./features/recria/recria.component').then(m => m.RecriaComponent)
      },
      // Módulo de Finanzas (Economía)
      {
        path: 'finanzas',
        loadComponent: () => import('./features/finanzas/finanzas.component').then(m => m.FinanzasComponent)
      }
    ]
  },
  // Captura de rutas no existentes: Redirige al Dashboard
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
