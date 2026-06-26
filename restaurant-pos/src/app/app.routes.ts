import { Routes } from '@angular/router';
import { roleGuard, authGuard } from './core/auth/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/components/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/components/register.component').then(m => m.RegisterComponent)
      },
    ]
  },

  {
    path: 'waiter',
    canActivate: [roleGuard('WAITER', 'ADMIN')],
    loadChildren: () => import('./features/waiter-terminal/waiter.routes').then(m => m.WAITER_ROUTES)
  },

  {
    path: 'kitchen',
    canActivate: [roleGuard('KITCHEN', 'ADMIN')],
    loadChildren: () => import('./features/kitchen-display/kitchen.routes').then(m => m.KITCHEN_ROUTES)
  },

  {
    path: 'admin',
    canActivate: [roleGuard('ADMIN')],
    loadChildren: () => import('./features/admin-dashboard/admin.routes').then(m => m.ADMIN_ROUTES)
  },

  { path: '**', redirectTo: '/auth/login' }
];
