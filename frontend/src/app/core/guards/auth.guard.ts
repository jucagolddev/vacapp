import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirigir al login si no está autenticado
  // (Para el MVP, como el mock hace auto-login en el constructor, 
  // esto solo afectará si falla el mock o si estamos en modo real sin sesión)
  return router.parseUrl('/auth/login');
};
