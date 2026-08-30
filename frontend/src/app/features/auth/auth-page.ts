import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth.service';
import { AuthResponse, ProblemDetails } from '../../core/models';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-card">
      <div class="mobile-brand"><span>☁</span> CloudTrack</div>
      <div class="heading">
        <span class="section-label">{{ eyebrow() }}</span>
        <h2>{{ title() }}</h2>
        <p>{{ subtitle() }}</p>
      </div>

      @if (success()) {
        <div class="notice success"><mat-icon>check_circle</mat-icon><span>{{ success() }}</span></div>
      }
      @if (error()) {
        <div class="notice error" role="alert"><mat-icon>error_outline</mat-icon><span>{{ error() }}</span></div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (mode() === 'register') {
          <mat-form-field appearance="outline">
            <mat-label>Full name</mat-label><mat-icon matPrefix>person_outline</mat-icon>
            <input matInput formControlName="displayName" autocomplete="name" placeholder="Alex Morgan" />
            @if (form.controls.displayName.touched && form.controls.displayName.invalid) { <mat-error>Enter at least 2 characters</mat-error> }
          </mat-form-field>
        }

        @if (mode() !== 'reset') {
          <mat-form-field appearance="outline">
            <mat-label>Work email</mat-label><mat-icon matPrefix>mail_outline</mat-icon>
            <input matInput formControlName="email" autocomplete="email" placeholder="you@company.com" />
            @if (form.controls.email.touched && form.controls.email.invalid) { <mat-error>Enter a valid email address</mat-error> }
          </mat-form-field>
        }

        @if (mode() === 'reset') {
          <mat-form-field appearance="outline">
            <mat-label>Reset token</mat-label><mat-icon matPrefix>key</mat-icon>
            <input matInput formControlName="token" autocomplete="one-time-code" />
          </mat-form-field>
        }

        @if (mode() === 'login' || mode() === 'register' || mode() === 'reset') {
          <mat-form-field appearance="outline">
            <mat-label>{{ mode() === 'reset' ? 'New password' : 'Password' }}</mat-label><mat-icon matPrefix>lock_outline</mat-icon>
            <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="password" [autocomplete]="mode() === 'login' ? 'current-password' : 'new-password'" />
            <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())" [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"><mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon></button>
            @if (form.controls.password.touched && form.controls.password.invalid) { <mat-error>Password must be at least 8 characters</mat-error> }
          </mat-form-field>
        }

        @if (mode() === 'login') {
          <div class="form-meta"><label><input type="checkbox" /> Keep me signed in</label><a routerLink="/auth/forgot-password">Forgot password?</a></div>
        }

        <button class="submit" mat-flat-button type="submit" [disabled]="loading()">
          @if (loading()) { <mat-spinner diameter="20" /> } @else { <span class="button-content">{{ buttonLabel() }} <mat-icon>arrow_forward</mat-icon></span> }
        </button>
      </form>

      @if (developmentToken()) {
        <div class="dev-token"><strong>Local demo token</strong><code>{{ developmentToken() }}</code><a [routerLink]="['/auth/reset-password']" [queryParams]="{ token: developmentToken() }">Continue to reset</a></div>
      }

      <div class="switch-link">
        @switch (mode()) {
          @case ('login') { New to CloudTrack? <a routerLink="/auth/register">Create an account</a> }
          @case ('register') { Already have an account? <a routerLink="/auth/login">Sign in</a> }
          @default { Remembered your password? <a routerLink="/auth/login">Back to sign in</a> }
        }
      </div>
    </div>
  `,
  styles: `
    :host { width:min(100%,470px); display:block; }
    .auth-card { width:100%; }
    .mobile-brand { display:none; color:#1d4ed8; font-size:20px; font-weight:800; margin-bottom:36px; }
    .heading { margin-bottom:30px; } .section-label { color:#2563eb; font-size:12px; font-weight:800; letter-spacing:.14em; }
    h2 { margin:10px 0 8px; color:#0f172a; font-size:36px; line-height:1.15; letter-spacing:-.035em; } .heading p { margin:0; color:#64748b; line-height:1.6; }
    form { display:grid; gap:8px; } mat-form-field { width:100%; } mat-icon[matPrefix] { margin:0 12px 0 2px; color:#94a3b8; }
    .form-meta { display:flex; justify-content:space-between; align-items:center; margin:-2px 0 14px; color:#64748b; font-size:13px; } .form-meta label { display:flex; align-items:center; gap:8px; } input[type=checkbox] { accent-color:#2563eb; }
    a { color:#2563eb; font-weight:700; text-decoration:none; } a:hover { text-decoration:underline; }
    .submit { width:100%; height:52px; margin-top:4px; border-radius:12px; font-weight:750; font-size:15px; } .button-content { display:flex; align-items:center; gap:8px; }
    .notice { display:flex; align-items:flex-start; gap:10px; margin:0 0 20px; padding:13px 14px; border-radius:12px; font-size:13px; line-height:1.45; } .notice mat-icon { flex:0 0 auto; }
    .notice.error { color:#991b1b; background:#fef2f2; border:1px solid #fecaca; } .notice.success { color:#166534; background:#f0fdf4; border:1px solid #bbf7d0; }
    .switch-link { margin-top:26px; text-align:center; color:#64748b; font-size:14px; }
    .dev-token { display:grid; gap:8px; margin-top:18px; padding:14px; border-radius:12px; background:#fffbeb; color:#92400e; font-size:12px; } .dev-token code { overflow-wrap:anywhere; }
    @media(max-width:900px) { .mobile-brand { display:block; } h2 { font-size:32px; } }
  `,
})
export class AuthPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly mode = signal<AuthMode>((this.route.snapshot.data['mode'] as AuthMode) ?? 'login');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly developmentToken = signal('');
  readonly showPassword = signal(false);
  readonly title = computed(() => ({ login: 'Welcome back', register: 'Create your account', forgot: 'Reset your password', reset: 'Choose a new password' })[this.mode()]);
  readonly eyebrow = computed(() => ({ login: 'SIGN IN', register: 'GET STARTED', forgot: 'ACCOUNT RECOVERY', reset: 'SECURE YOUR ACCOUNT' })[this.mode()]);
  readonly subtitle = computed(() => ({ login: 'Enter your details to continue to your workspace.', register: 'Start organizing projects in less than a minute.', forgot: 'We’ll prepare a secure reset link if the account exists.', reset: 'Use the reset token and choose a strong new password.' })[this.mode()]);
  readonly buttonLabel = computed(() => ({ login: 'Sign in', register: 'Create account', forgot: 'Send reset instructions', reset: 'Reset password' })[this.mode()]);

  readonly form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    token: [this.route.snapshot.queryParamMap.get('token') ?? '', Validators.required],
  });

  submit(): void {
    const requiredControls = this.mode() === 'register' ? ['displayName', 'email', 'password'] : this.mode() === 'forgot' ? ['email'] : this.mode() === 'reset' ? ['token', 'password'] : ['email', 'password'];
    if (requiredControls.some((name) => this.form.get(name)?.invalid)) {
      requiredControls.forEach((name) => this.form.get(name)?.markAsTouched());
      return;
    }

    this.loading.set(true); this.error.set(''); this.success.set('');
    const value = this.form.getRawValue();
    const request: Observable<AuthResponse | { message: string; developmentResetToken?: string } | void> = this.mode() === 'login' ? this.auth.login(value.email, value.password)
      : this.mode() === 'register' ? this.auth.register(value.email, value.password, value.displayName)
      : this.mode() === 'forgot' ? this.auth.forgotPassword(value.email)
      : this.auth.resetPassword(value.token, value.password);

    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (response: AuthResponse | { message: string; developmentResetToken?: string } | void) => {
        if (this.mode() === 'login' || this.mode() === 'register') void this.router.navigateByUrl('/dashboard');
        else if (this.mode() === 'forgot') {
          const result = response as { message: string; developmentResetToken?: string };
          this.success.set(result.message); this.developmentToken.set(result.developmentResetToken ?? '');
        } else { this.success.set('Password updated. You can now sign in.'); }
      },
      error: (response: HttpErrorResponse) => {
        const problem = response.error as ProblemDetails;
        this.error.set(problem?.detail ?? problem?.title ?? 'Something went wrong. Please try again.');
      },
    });
  }
}
