import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './shared/components/navbar.component';
import { ToastComponent } from './shared/components/toast.component';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, NavbarComponent, ToastComponent],
  template: `
    @if (showNav) {
      <app-navbar />
    }
    <router-outlet />
    <app-toast />
  `
})
export class AppComponent {
  private auth  = inject(AuthService);
  private router = inject(Router);

  showNav = false;

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        this.showNav = !e.urlAfterRedirects.startsWith('/auth');
      });
  }
}
