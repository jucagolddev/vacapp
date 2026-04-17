import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { addIcons } from 'ionicons';
import { warning } from 'ionicons/icons';

// Registrar iconos críticos globalmente para evitar errores en handlers globales
addIcons({ 'warning': warning });

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
