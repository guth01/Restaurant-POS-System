import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="nav-brand">
        <span class="brand-icon">🍽️</span>
        <span class="brand-name">RestoPOS</span>
      </div>
      <div class="nav-links">
        @if (auth.hasRole('WAITER', 'ADMIN')) {
          <a routerLink="/waiter" routerLinkActive="active">Waiter Terminal</a>
        }
        @if (auth.hasRole('KITCHEN', 'ADMIN')) {
          <a routerLink="/kitchen" routerLinkActive="active">Kitchen Display</a>
        }
        @if (auth.hasRole('ADMIN')) {
          <a routerLink="/admin" routerLinkActive="active">Admin</a>
        }
      </div>
      <div class="nav-user">
        <span class="user-info">
          <span class="role-badge">{{ auth.currentUser()?.role }}</span>
          {{ auth.currentUser()?.email }}
        </span>
        <button class="btn btn-sm btn-outline" (click)="auth.logout()">Logout</button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 0 24px;
      height: 56px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 16px;
    }
    .brand-icon { font-size: 20px; }
    .nav-links {
      display: flex;
      gap: 4px;
      flex: 1;
      a {
        padding: 6px 14px;
        border-radius: 8px;
        text-decoration: none;
        color: var(--text-muted);
        font-size: 13px;
        font-weight: 500;
        transition: all 0.15s;
        &:hover, &.active {
          background: var(--surface2);
          color: var(--text);
        }
        &.active { color: var(--accent); }
      }
    }
    .nav-user {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .user-info {
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .role-badge {
      background: var(--surface2);
      border: 1px solid var(--border);
      padding: 2px 8px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 600;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
}
