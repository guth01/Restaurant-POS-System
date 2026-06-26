import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import {
  LoginRequest, RegisterRequest, AuthResponse, CurrentUser, JwtPayload, Role
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'pos_token';
  private _token: string | null = null;
  currentUser = signal<CurrentUser | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    // Restore from memory on init (token kept in-memory only; see note in docs)
    // If you'd prefer sessionStorage uncomment:
    // const saved = sessionStorage.getItem(this.TOKEN_KEY);
    // if (saved) this.setToken(saved);
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.gatewayUrl}/auth/login`, req).pipe(
      tap(res => this.setToken(res.token))
    );
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.gatewayUrl}/auth/register`, req).pipe(
      tap(res => this.setToken(res.token))
    );
  }

  logout(): void {
    this._token = null;
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this._token;
  }

  isLoggedIn(): boolean {
    if (!this._token) return false;
    try {
      const decoded = jwtDecode<JwtPayload>(this._token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getRole(): Role | null {
    return this.currentUser()?.role ?? null;
  }

  hasRole(...roles: Role[]): boolean {
    const r = this.getRole();
    return r != null && roles.includes(r);
  }

  private setToken(token: string): void {
    this._token = token;
    try {
      const payload = jwtDecode<JwtPayload>(token);
      console.log('Decoded JWT payload:', payload);
      
      let normalizedRole = payload.role ? String(payload.role).toUpperCase() : '';
      if (normalizedRole.startsWith('ROLE_')) {
        normalizedRole = normalizedRole.substring(5);
      }
      
      this.currentUser.set({
        userId: payload.userId,
        email: payload.sub,
        role: normalizedRole as Role,
      });
    } catch (e) {
      console.error('Failed to decode JWT', e);
    }
  }
}
