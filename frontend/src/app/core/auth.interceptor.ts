import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken;
  // Auth endpoints exchange the refresh-token cookie, so they must send credentials.
  const withCookies = request.url.includes('/auth/');
  const authenticatedRequest = request.clone({
    withCredentials: withCookies || request.withCredentials,
    setHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !request.url.includes('/auth/')) {
        auth.clearSession();
      }
      return throwError(() => error);
    }),
  );
};
