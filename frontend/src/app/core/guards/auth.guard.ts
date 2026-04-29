import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  const { data: { session } } = await supabaseService.getUserSession();

  if (session) {
    return true;
  }

  // Redirigir al login si no está autenticado
  return router.parseUrl('/auth/login');
};
