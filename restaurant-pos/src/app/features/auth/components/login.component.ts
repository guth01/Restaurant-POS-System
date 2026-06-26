import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">🍽️</div>
          <h1>RestoPOS</h1>
          <p>Sign in to your account</p>
        </div>

        @if (error) {
          <div class="error-banner">{{ error }}</div>
        }

        <div class="form-group">
          <label>Email</label>
          <input type="email" [(ngModel)]="email" name="email" placeholder="staff@restaurant.com" (keyup.enter)="login()" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" (keyup.enter)="login()" />
        </div>

        <button class="btn btn-primary btn-block btn-lg" (click)="login()" [disabled]="loading">
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>

        <p class="auth-footer">
          No account? <a routerLink="/auth/register">Register</a>
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
export class LoginComponent {
  private authSvc = inject(AuthService);
  private router   = inject(Router);
  private toast    = inject(ToastService);

  email    = '';
  password = '';
  loading  = false;
  error    = '';

  login(): void {
    if (!this.email || !this.password) { this.error = 'Please fill all fields.'; return; }
    this.loading = true;
    this.error   = '';
    this.authSvc.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.toast.success('Welcome back!');
        const role = this.authSvc.getRole();
        
        let navPromise;
        if (role === 'WAITER')  navPromise = this.router.navigate(['/waiter']);
        else if (role === 'KITCHEN') navPromise = this.router.navigate(['/kitchen']);
        else                    navPromise = this.router.navigate(['/admin']);
        
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
        this.error   = err?.error?.message ?? 'Login failed. Check credentials.';
      }
    });
  }
}
