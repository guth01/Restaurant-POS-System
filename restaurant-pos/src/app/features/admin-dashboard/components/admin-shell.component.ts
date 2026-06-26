import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-shell">
      <aside class="sidebar">
        <nav>
          <a routerLink="menu" routerLinkActive="active">🍕 Menu Items</a>
          <a routerLink="tables" routerLinkActive="active">🪑 Tables</a>
        </nav>
      </aside>
      <main class="admin-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .admin-shell { display: flex; height: calc(100vh - 56px); }
    .sidebar {
      width: 220px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      padding: 20px 12px;
      nav { display: flex; flex-direction: column; gap: 4px; }
      a {
        display: block;
        padding: 10px 14px;
        border-radius: 8px;
        text-decoration: none;
        color: var(--text-muted);
        font-size: 14px;
        font-weight: 500;
        transition: all 0.15s;
        &:hover { background: var(--surface2); color: var(--text); }
        &.active { background: rgba(233,69,96,0.1); color: var(--accent); }
      }
    }
    .admin-content { flex: 1; overflow-y: auto; padding: 24px; }
  `]
})
export class AdminShellComponent {}
