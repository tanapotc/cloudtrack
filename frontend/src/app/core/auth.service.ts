import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, UserSummary } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenKey = 'cloudtrack.accessToken';
  private readonly userKey = 'cloudtrack.user';
  private readonly currentUserState = signal<UserSummary | null>(this.readUser());

  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserState() && !!this.accessToken);

  get accessToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password }, { withCredentials: true }).pipe(tap((response) => this.storeSession(response)));
  }

  register(email: string, password: string, displayName: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, { email, password, displayName }, { withCredentials: true }).pipe(tap((response) => this.storeSession(response)));
  }

  forgotPassword(email: string): Observable<{ message: string; developmentResetToken?: string }> {
    return this.http.post<{ message: string; developmentResetToken?: string }>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  refresh(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(tap((response) => this.storeSession(response)));
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe({ error: () => undefined });
    this.clearSession();
    void this.router.navigateByUrl('/auth/login');
  }

  clearSession(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
    this.currentUserState.set(null);
  }

  private storeSession(response: AuthResponse): void {
    sessionStorage.setItem(this.tokenKey, response.accessToken);
    sessionStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.currentUserState.set(response.user);
  }

  private readUser(): UserSummary | null {
    const value = sessionStorage.getItem(this.userKey);
    if (!value) return null;
    try {
      return JSON.parse(value) as UserSummary;
    } catch {
      sessionStorage.removeItem(this.userKey);
      return null;
    }
  }
}

