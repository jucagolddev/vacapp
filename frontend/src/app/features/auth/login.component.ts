import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonCard, IonCardContent, IonInput, IonButton, IonSpinner, IonText
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonCard, IonCardContent, IonInput, IonButton, IonSpinner, IonText],
  template: `
    <ion-content color="light">
      <div class="flex-center" style="height: 100%; justify-content: center;">
        <ion-card style="width: 100%; max-width: 400px; border-radius: 12px; padding: 20px;">
          <ion-card-content>
            <h2 class="font-bold text-lg mb-8 text-center" style="color: var(--ion-color-primary)">
              Bienvenido a Vacapp
            </h2>
            
            <p class="text-medium text-center mb-8">Ingresa tu correo comercial para comenzar la sesión en tu explotacion.</p>
            
            <ion-input
              [(ngModel)]="email"
              type="email"
              placeholder="correo@ejemplo.com"
              fill="outline"
              labelPlacement="floating"
              label="Correo Electrónico"
              class="mb-8"
              [disabled]="loading()"
            ></ion-input>

            <ion-button expand="block" (click)="signIn()" [disabled]="!email() || loading()">
              <ion-spinner *ngIf="loading()" name="crescent" slot="start"></ion-spinner>
              {{ loading() ? 'Enviando...' : 'Iniciar Sesión (OTP)' }}
            </ion-button>

            <ion-text color="danger" *ngIf="error()">
              <p class="text-center" style="margin-top: 15px;">{{ error() }}</p>
            </ion-text>
            
            <ion-text color="success" *ngIf="success()">
              <p class="text-center" style="margin-top: 15px;">Hemos enviado un enlace mágico a tu correo.</p>
            </ion-text>

          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  loading = signal(false);
  error = signal('');
  success = signal(false);

  async signIn() {
    this.loading.set(true);
    this.error.set('');
    this.success.set(false);

    try {
      const { error } = await this.auth.signInWithOtp(this.email());
      if (error) {
        if (error.message.includes('Mock mode')) {
          // Si estamos en mock mode, el auto login del constructor de AuthService ya 
          // habra seteado el perfil. Simulamos navegacion.
          this.router.navigate(['/']);
          return;
        }
        throw error;
      }
      this.success.set(true);
    } catch (e: any) {
      this.error.set(e.message || 'Error al iniciar sesión');
    } finally {
      this.loading.set(false);
    }
  }
}
