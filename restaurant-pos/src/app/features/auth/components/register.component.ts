import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Role } from '../../../shared/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">🍽️</div>
          <h1>Create Account</h1>
          <p>Register a new staff account</p>
        </div>

        @if (error) { <div class="error-banner">{{ error }}</div> }

        <div class="form-group">
          <label>Full Name</label>
          <input type="text" [(ngModel)]="name" name="name" placeholder="Jane Smith" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" [(ngModel)]="email" name="email" placeholder="jane@restaurant.com" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" />
        </div>
        <div class="form-group">
          <label>Role</label>
          <select [(ngModel)]="role" name="role">
            <option value="ADMIN">Admin</option>
            <option value="WAITER">Waiter</option>
            <option value="KITCHEN">Kitchen</option>
          </select>
        </div>

        <button class="btn btn-primary btn-block btn-lg" (click)="register()" [disabled]="loading">
          {{ loading ? 'Creating account…' : 'Register' }}
        </button>

        <p class="auth-footer">
          Have an account? <a routerLink="/auth/login">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg);
      padding: 20px;
    }
    .auth-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: var(--shadow);
    }
    .auth-header {
      text-align: center;
      margin-bottom: 32px;
      .auth-logo { font-size: 48px; margin-bottom: 12px; }
      h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
      p { color: var(--text-muted); font-size: 14px; }
    }
    .auth-footer {
      text-align: center;
      margin-top: 20px;
      color: var(--text-muted);
      font-size: 13px;
      a { color: var(--accent); text-decoration: none; }
    }
  `]
})
export class RegisterComponent {
  private authSvc = inject(AuthService);
  private router   = inject(Router);
  private toast    = inject(ToastService);

  name     = '';
  email    = '';
  password = '';
  role: Role = 'WAITER';
  loading  = false;
  error    = '';

  register(): void {
    if (!this.name || !this.email || !this.password) {
      this.error = 'Please fill all fields.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.authSvc.register({ name: this.name, email: this.email, password: this.password, role: this.role }).subscribe({
      next: () => {
        this.toast.success('Account created!');
        const role = this.authSvc.getRole();
        
        let navPromise;
        if (role === 'WAITER')       navPromise = this.router.navigate(['/waiter']);
        else if (role === 'KITCHEN') navPromise = this.router.navigate(['/kitchen']);
        else                         navPromise = this.router.navigate(['/admin']);
        
        navPromise?.then(success => {
          if (!success) console.error('Navigation failed or was canceled');
        }).catch(err => {
          console.error('Navigation error:', err);
        }).finally(() => {
          this.loading = false;
        });
      },
      error: err => {
        this.loading = false;
        this.error   = err?.error?.message ?? 'Registration failed.';
      }
    });
  }
}
