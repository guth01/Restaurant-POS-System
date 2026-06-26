import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from '../../shared/models';

export function roleGuard(...roles: Role[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const loggedIn = auth.isLoggedIn();
    const currentRole = auth.getRole();
    console.log(`[roleGuard] required=${JSON.stringify(roles)} | isLoggedIn=${loggedIn} | currentRole=${currentRole}`);

    if (!loggedIn) {
      console.error('[roleGuard] Not logged in → redirecting to login');
      router.navigate(['/auth/login']);
      return false;
    }

    if (roles.length && !auth.hasRole(...roles)) {
      console.error(`[roleGuard] Role mismatch: user has "${currentRole}" but route needs one of ${JSON.stringify(roles)}`);
      // Redirect to the user's appropriate home
      if (currentRole === 'WAITER') router.navigate(['/waiter']);
      else if (currentRole === 'KITCHEN') router.navigate(['/kitchen']);
      else if (currentRole === 'ADMIN') router.navigate(['/admin']);
      else router.navigate(['/auth/login']);
      return false;
    }

    console.log('[roleGuard] Access granted ✓');
    return true;
  };
}

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }
  return true;
};
