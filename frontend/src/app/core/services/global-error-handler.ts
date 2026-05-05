import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular/standalone';

/**
 * @class GlobalErrorHandler
 * @description Interceptor global de excepciones no controladas.
 * Proporciona una capa de resiliencia capturando errores en tiempo de ejecución,
 * notificando al usuario mediante una interfaz no intrusiva y registrando el incidente
 * para análisis técnico posterior.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  /**
   * @description Procesa cualquier error no capturado en la aplicación.
   * Evita el colapso de la UI y ofrece un mensaje amigable.
   * @param {any} error El objeto de error capturado.
   */
  async handleError(error: any) {
    // Evita inyectar dependencias directamente en el constructor para evitar ciclos.
    const toastCtrl = this.injector.get(ToastController);
    
    // Loguear el error original en consola
    console.error('⚠️ [Global Error Handler] Capturado:', error);
    
    const message = error.message ? error.message : error.toString();
    
    // Mostrar Toast amigable al usuario en la UI
    try {
       const toast = await toastCtrl.create({
         message: 'Ha ocurrido un error inesperado. Por favor contácte a soporte o reintente.',
         duration: 4000,
         color: 'danger',
         position: 'top',
         icon: 'warning'
       });
       await toast.present();
    } catch(e) {
       console.error('Error presentando Toast de error global:', e);
    }
  }
}
