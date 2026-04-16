import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom, ErrorHandler, isDevMode } from '@angular/core';
import { GlobalErrorHandler } from './core/services/global-error-handler';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { 
  LucideAngularModule, LayoutDashboard, ClipboardList, Map, 
  HeartPulse, Syringe, Scale, ChevronLeft, ChevronRight, Leaf, 
  Wheat, PawPrint, Activity, Heart, TrendingUp, AlertCircle, Calendar,
  LogOut, Wallet, ArrowDownCircle, ArrowUpCircle, Baby, ShieldAlert
} from 'lucide-angular';
import { provideServiceWorker } from '@angular/service-worker';

/**
 * Configuración global de la Aplicación Angular.
 * Aquí se definen los proveedores de servicios, el sistema de rutas y la integración con Ionic.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Manejo global de errores en el navegador
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    // Configuración del enrutamiento de la aplicación
    provideRouter(routes), 
    // Integración de Ionic Framework (Standalone)
    provideIonicAngular({}),
    // Proveedor para ng2-charts
    provideCharts(withDefaultRegisterables()),
    // Proveedor Global para el Sistema Ultra-Profesional de Iconos Lucide
    importProvidersFrom(LucideAngularModule.pick({ 
      LayoutDashboard, ClipboardList, Map, HeartPulse, Syringe, Scale, 
      ChevronLeft, ChevronRight, Leaf, Wheat, PawPrint, Activity, Heart, 
      TrendingUp, AlertCircle, Calendar, LogOut, Wallet, ArrowDownCircle, 
      ArrowUpCircle, Baby, ShieldAlert
    })), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
  ],
};
