import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, UserSummary } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly accessTokenState = signal<string | null>(null);
  private readonly currentUserState = signal<UserSummary | null>(null);

  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserState() && !!this.accessToken);

  constructor() {
    sessionStorage.removeItem('cloudtrack.accessToken');
    sessionStorage.removeItem('cloudtrack.user');
  }

  get accessToken(): string | null {
    return this.accessTokenState();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${environment.apiUrl}/auth/login`,
        { email, password },
        { withCredentials: true },
      )
      .pipe(tap((response) => this.storeSession(response)));
  }

  register(email: string, password: string, displayName: string): Observable<AuthResponse> {
    // Registration only persists the account; the user then signs in from the login page.
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}/auth/register`,
      { email, password, displayName },
      { withCredentials: true },
    );
  }

  forgotPassword(email: string): Observable<{ message: string; developmentResetToken?: string }> {
    return this.http.post<{ message: string; developmentResetToken?: string }>(
      `${environment.apiUrl}/auth/forgot-password`,
      { email },
    );
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/reset-password`, {
      token,
      newPassword,
    });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(tap((response) => this.storeSession(response)));
  }

  restoreSession(): Observable<void> {
    return this.refresh().pipe(
      map(() => undefined),
      catchError(() => {
        this.clearSession();
        return of(undefined);
      }),
    );
  }

  logout(): void {
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        finalize(() => {
          this.clearSession();
          void this.router.navigateByUrl('/auth/login');
        }),
      )
      .subscribe({ error: () => undefined });
  }

  clearSession(): void {
    this.accessTokenState.set(null);
    this.currentUserState.set(null);
  }

  private storeSession(response: AuthResponse): void {
    this.accessTokenState.set(response.accessToken);
    this.currentUserState.set(response.user);
  }
}
