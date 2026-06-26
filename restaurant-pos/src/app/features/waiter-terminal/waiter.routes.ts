import { Routes } from '@angular/router';
import { TableGridComponent } from './components/table-grid.component';
import { OrderScreenComponent } from './components/order-screen.component';

export const WAITER_ROUTES: Routes = [
  { path: '', component: TableGridComponent },
  { path: 'table/:id', component: OrderScreenComponent },
];
