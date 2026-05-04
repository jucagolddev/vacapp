import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonInput, IonButton, IonSpinner, ToastController, IonIcon
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';
import { addIcons } from 'ionicons';
import { leafOutline, logInOutline, personAddOutline, scanOutline, qrCodeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonInput, IonButton, IonSpinner, IonIcon],
  template: `
    <ion-content>
      <!-- Fondo de pantalla completa con imagen de Unsplash -->
      <div class="login-background">
        <div class="overlay-gradient"></div>
        <div class="login-container">
          
          <!-- Contenedor Glassmorphism -->
          <div class="glass-card">
            
            <div class="brand-header">
              <div class="brand-circle-large">
                <ion-icon name="leaf-outline"></ion-icon>
              </div>
              <h1 class="brand-title">VACAPP</h1>
              <p class="brand-subtitle">AGRITECH ERP</p>
            </div>
            
            <h2 class="form-title">Bienvenido a la Finca</h2>
            <p class="form-subtitle">Ingresa tus credenciales para continuar</p>
            
            <div class="form-group">
              <ion-input
                [(ngModel)]="email"
                type="email"
                placeholder="correo@ejemplo.com"
                fill="outline"
                labelPlacement="floating"
                label="Correo Electrónico"
                class="vac-input"
                [disabled]="loading()"
              ></ion-input>

              <ion-input
                [(ngModel)]="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                fill="outline"
                labelPlacement="floating"
                label="Contraseña"
                class="vac-input mt-sm"
                [disabled]="loading()"
                (keyup.enter)="signIn()"
              ></ion-input>
            </div>

            <div class="action-buttons">
              <ion-button expand="block" (click)="signIn()" [disabled]="!isValid() || loading()" class="btn-primary-gradient">
                <ion-spinner *ngIf="loading()" name="crescent" slot="start"></ion-spinner>
                <ion-icon *ngIf="!loading()" name="log-in-outline" slot="start"></ion-icon>
                {{ loading() ? 'Entrando...' : 'Iniciar Sesión' }}
              </ion-button>

              <ion-button expand="block" fill="clear" (click)="signUp()" [disabled]="!isValid() || loading()" class="btn-secondary">
                <ion-icon name="person-add-outline" slot="start"></ion-icon>
                Crear nueva cuenta
              </ion-button>
            </div>

            <!-- Sección de Acceso Rápido con QR -->
            <div class="qr-login-section animate-fade-in">
              <div class="divider">
                <span>O accede con</span>
              </div>
              <div class="qr-container" (click)="quickLogin()" [class.scanning]="loading()">
                <img src="assets/imagenes/qr-code.png" alt="QR Login" class="qr-image">
                <div class="qr-overlay">
                  <ion-icon name="scan-outline"></ion-icon>
                  <span>Escanear Acceso</span>
                </div>
              </div>
              <p class="qr-note">Usa tu código de acceso rápido</p>
            </div>

          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-background {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 100vh;
      background: url('https://images.unsplash.com/photo-1595166927357-d3da081ec999?auto=format&fit=crop&q=80&w=2000') no-repeat center center / cover;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Outfit', sans-serif;
    }
    .overlay-gradient {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(135deg, rgba(88, 47, 14, 0.85) 0%, rgba(45, 106, 79, 0.7) 100%);
      z-index: 1;
    }
    .login-container {
      position: relative;
      z-index: 2;
      width: 100%;
      padding: 20px;
      display: flex;
      justify-content: center;
    }
    .glass-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 24px;
      padding: 40px 30px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
      text-align: center;
      color: white;
    }
    .brand-header {
      margin-bottom: 30px;
    }
    .brand-circle-large {
      width: 72px;
      height: 72px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 15px;
      font-size: 36px;
      color: #fff;
      border: 2px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
    }
    .brand-title {
      font-size: 2rem;
      font-weight: 900;
      margin: 0;
      letter-spacing: 2px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .brand-subtitle {
      font-size: 0.85rem;
      font-weight: 600;
      margin: 5px 0 0;
      letter-spacing: 3px;
      opacity: 0.8;
      text-transform: uppercase;
    }
    .form-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 5px;
    }
    .form-subtitle {
      font-size: 0.9rem;
      opacity: 0.8;
      margin: 0 0 25px;
      font-weight: 300;
    }
    .form-group {
      margin-bottom: 30px;
    }
    .vac-input {
      --background: rgba(255, 255, 255, 0.9);
      --color: #333;
      --placeholder-color: #666;
      --border-color: transparent;
      --border-radius: 12px;
      --highlight-color-focused: var(--ion-color-secondary);
      font-family: 'Outfit', sans-serif;
      font-weight: 500;
    }
    .mt-sm { margin-top: 15px; }
    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .btn-primary-gradient {
      --background: linear-gradient(to right, #bc6c25, #dda15e);
      --background-activated: linear-gradient(to right, #a05c1f, #c78f4f);
      --border-radius: 12px;
      --box-shadow: 0 10px 20px rgba(188, 108, 37, 0.4);
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      letter-spacing: 1px;
      height: 50px;
    }
    .btn-secondary {
      --color: #ffffff;
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      opacity: 0.9;
    }
    
    /* QR Section Styles */
    .qr-login-section {
      margin-top: 25px;
      padding-top: 15px;
    }
    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin-bottom: 20px;
      opacity: 0.6;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid rgba(255,255,255,0.3);
    }
    .divider:not(:empty)::before { margin-right: .5em; }
    .divider:not(:empty)::after { margin-left: .5em; }
    .divider span { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }

    .qr-container {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto 10px;
      background: white;
      padding: 10px;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }
    .qr-container:hover {
      transform: scale(1.05) translateY(-5px);
      box-shadow: 0 15px 35px rgba(0,0,0,0.3);
    }
    .qr-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .qr-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(27, 67, 50, 0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 16px;
      opacity: 0;
      transition: opacity 0.3s ease;
      color: white;
    }
    .qr-container:hover .qr-overlay {
      opacity: 1;
    }
    .qr-overlay ion-icon { font-size: 32px; margin-bottom: 5px; }
    .qr-overlay span { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }

    .qr-note {
      font-size: 0.75rem;
      opacity: 0.7;
      margin: 0;
    }

    .scanning {
      pointer-events: none;
      filter: grayscale(1);
      opacity: 0.5;
    }
  `]
})
export class LoginComponent {
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  email = signal('');
  password = signal('');
  loading = signal(false);

  constructor() {
    addIcons({ leafOutline, logInOutline, personAddOutline, scanOutline, qrCodeOutline });
  }

  isValid() {
    return this.email().length > 3 && this.password().length >= 6;
  }

  async signIn() {
    if (!this.isValid()) return;
    this.loading.set(true);

    try {
      const { error } = await this.supabase.signIn(this.email(), this.password());
      if (error) {
        throw error;
      }
      this.router.navigate(['/']); // El auth.guard validará en la redirección
    } catch (e: any) {
      this.showToast(e.message || 'Error de credenciales. Por favor, verifica tu correo y contraseña.', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  async signUp() {
    if (!this.isValid()) return;
    this.loading.set(true);

    try {
      const { error } = await this.supabase.signUp(this.email(), this.password());
      if (error) {
        throw error;
      }
      this.showToast('Cuenta creada exitosamente. Por favor verifica tu correo.', 'success');
    } catch (e: any) {
      this.showToast(e.message || 'Error al crear la cuenta. Inténtalo de nuevo.', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Simulación de acceso rápido mediante QR.
   * Utiliza las credenciales maestras del sistema mock.
   */
  async quickLogin() {
    this.loading.set(true);
    this.showToast('Escaneando código de acceso...', 'success');
    
    // Pequeño delay para simular procesamiento
    setTimeout(async () => {
      try {
        const { error } = await this.supabase.signIn('jucagolddev@gmail.com', 'Juca2452');
        if (error) throw error;
        this.router.navigate(['/']);
      } catch (e: any) {
        this.showToast('Código inválido o caducado.', 'danger');
      } finally {
        this.loading.set(false);
      }
    }, 1500);
  }

  async showToast(message: string, color: 'danger' | 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: color,
      icon: color === 'danger' ? 'warning-outline' : 'checkmark-circle-outline',
      cssClass: 'vac-toast'
    });
    await toast.present();
  }
}
