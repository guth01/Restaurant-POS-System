import { Routes } from '@angular/router';
import { AdminShellComponent } from './components/admin-shell.component';
import { MenuManagementComponent } from './components/menu-management.component';
import { TableManagementComponent } from './components/table-management.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    children: [
      { path: '', redirectTo: 'menu', pathMatch: 'full' },
      { path: 'menu', component: MenuManagementComponent },
      { path: 'tables', component: TableManagementComponent },
    ]
  }
];
