import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideIonicAngular } from '@ionic/angular/standalone';

/**
 * Configuración global de la Aplicación Angular.
 * Aquí se definen los proveedores de servicios, el sistema de rutas y la integración con Ionic.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Manejo global de errores en el navegador
    provideBrowserGlobalErrorListeners(),
    // Configuración del enrutamiento de la aplicación
    provideRouter(routes), 
    // Integración de Ionic Framework (Standalone)
    provideIonicAngular({})
  ],
};
