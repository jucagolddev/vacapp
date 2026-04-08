import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { UserProfile } from '../models/vacapp.models';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  private currentUserSignal = signal<User | null>(null);
  private currentProfileSignal = signal<UserProfile | null>(null);

  readonly user = computed(() => this.currentUserSignal());
  readonly profile = computed(() => this.currentProfileSignal());
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly hasCompany = computed(() => !!this.currentProfileSignal()?.empresa_id);

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    if (!this.supabase.client) {
      // MODO MOCK: Auto-login
      this.currentUserSignal.set({ id: 'mock-uuid', email: 'propietario@vacapp.mock' } as User);
      this.currentProfileSignal.set({
        id: 'mock-uuid',
        email: 'propietario@vacapp.mock',
        rol: 'Propietario',
        empresa_id: 'emp-1', // Link al mock setup
        display_name: 'Propietario Demo'
      });
      return;
    }

    // Escuchar cambios reales de sesión
    this.supabase.client.auth.onAuthStateChange(async (event, session) => {
      this.currentUserSignal.set(session?.user ?? null);
      if (session?.user) {
        await this.loadProfile(session.user.id);
      } else {
        this.currentProfileSignal.set(null);
        this.router.navigate(['/auth/login']);
      }
    });

    // Estado inicial
    const { data: { session } } = await this.supabase.client.auth.getSession();
    this.currentUserSignal.set(session?.user ?? null);
    if (session?.user) {
      await this.loadProfile(session.user.id);
    }
  }

  private async loadProfile(userId: string) {
    if (!this.supabase.client) return;
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (data && !error) {
      this.currentProfileSignal.set(data as UserProfile);
    }
  }

  // Métodos expuestos para UI de Login
  async signInWithOtp(email: string) {
    if (!this.supabase.client) return { error: { message: 'Mock mode no soporta OTP real' } };
    return await this.supabase.client.auth.signInWithOtp({ email });
  }

  async signOut() {
    if (this.supabase.client) {
      await this.supabase.client.auth.signOut();
    } else {
      this.currentUserSignal.set(null);
      this.router.navigate(['/auth/login']);
    }
  }
}
