import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';
import { AuthApi } from '../api/services/auth-api';
import { AuthResponse, UserSummary } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApi);
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
    return this.authApi
      .authLogin({ body: { email, password } })
      .pipe(tap((response) => this.storeSession(response as AuthResponse)));
  }

  register(email: string, password: string, displayName: string): Observable<AuthResponse> {
    // Registration only persists the account; the user then signs in from the login page.
    return this.authApi.authRegister({
      body: { email, password, displayName },
    }) as Observable<AuthResponse>;
  }

  forgotPassword(email: string): Observable<{ message: string; developmentResetToken?: string }> {
    return this.authApi.authForgotPassword({ body: { email } }).pipe(
      map((result) => ({
        message: result.message ?? '',
        developmentResetToken: result.developmentResetToken ?? undefined,
      })),
    );
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.authApi.authResetPassword({ body: { token, newPassword } });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.authApi.authChangePassword({ body: { currentPassword, newPassword } });
  }

  refresh(): Observable<AuthResponse> {
    return this.authApi
      .authRefresh({ body: {} })
      .pipe(tap((response) => this.storeSession(response as AuthResponse)));
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
    this.authApi
      .authLogout()
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
