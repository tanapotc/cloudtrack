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
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
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
  readonly showConfirmPassword = signal(false);
  readonly title = computed(
    () =>
      ({
        login: 'Welcome back',
        register: 'Create your account',
        forgot: 'Reset your password',
        reset: 'Choose a new password',
      })[this.mode()],
  );
  readonly eyebrow = computed(
    () =>
      ({
        login: 'SIGN IN',
        register: 'GET STARTED',
        forgot: 'ACCOUNT RECOVERY',
        reset: 'SECURE YOUR ACCOUNT',
      })[this.mode()],
  );
  readonly subtitle = computed(
    () =>
      ({
        login: 'Sign in to pick up where you left off.',
        register: 'Start organizing projects in less than a minute.',
        forgot: 'We’ll prepare a secure reset link if the account exists.',
        reset: 'Use the reset token and choose a strong new password.',
      })[this.mode()],
  );
  readonly buttonLabel = computed(
    () =>
      ({
        login: 'Sign in',
        register: 'Create account',
        forgot: 'Send reset instructions',
        reset: 'Reset password',
      })[this.mode()],
  );

  readonly form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    token: [this.route.snapshot.queryParamMap.get('token') ?? '', Validators.required],
  });

  submit(): void {
    const value = this.form.getRawValue();
    const confirmPassword = this.form.controls.confirmPassword;
    if (this.mode() === 'register' && value.password !== value.confirmPassword) {
      confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
    } else if (confirmPassword.hasError('passwordMismatch')) {
      const { passwordMismatch: _passwordMismatch, ...remainingErrors } =
        confirmPassword.errors ?? {};
      confirmPassword.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
    }

    const requiredControls =
      this.mode() === 'register'
        ? ['displayName', 'email', 'password', 'confirmPassword']
        : this.mode() === 'forgot'
          ? ['email']
          : this.mode() === 'reset'
            ? ['token', 'password']
            : ['email', 'password'];
    if (requiredControls.some((name) => this.form.get(name)?.invalid)) {
      requiredControls.forEach((name) => this.form.get(name)?.markAsTouched());
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');
    const request: Observable<
      AuthResponse | { message: string; developmentResetToken?: string } | void
    > =
      this.mode() === 'login'
        ? this.auth.login(value.email, value.password)
        : this.mode() === 'register'
          ? this.auth.register(value.email, value.password, value.displayName)
          : this.mode() === 'forgot'
            ? this.auth.forgotPassword(value.email)
            : this.auth.resetPassword(value.token, value.password);

    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (
        response: AuthResponse | { message: string; developmentResetToken?: string } | void,
      ) => {
        if (this.mode() === 'login' || this.mode() === 'register')
          void this.router.navigateByUrl('/dashboard');
        else if (this.mode() === 'forgot') {
          const result = response as { message: string; developmentResetToken?: string };
          this.success.set(result.message);
          this.developmentToken.set(result.developmentResetToken ?? '');
        } else {
          this.success.set('Password updated. You can now sign in.');
        }
      },
      error: (response: HttpErrorResponse) => {
        const problem = response.error as ProblemDetails;
        this.error.set(
          problem?.detail ?? problem?.title ?? 'Something went wrong. Please try again.',
        );
      },
    });
  }
}
