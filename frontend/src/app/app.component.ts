import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

/**
 * Componente Raíz de la Aplicación (Vacapp).
 * Es el punto de entrada principal donde se carga el contenedor base y el router de Angular.
 */
@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  templateUrl: './app.html',
  standalone: true
})
export class AppComponent {
  // Este componente actúa como contenedor global y no requiere lógica compleja.
}
