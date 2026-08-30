import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { ApiConfiguration } from './api/api-configuration';
import { authInterceptor } from './core/auth.interceptor';
import { AuthService } from './core/auth.service';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    // The generated client's paths already include `/api`; rootUrl is just the origin.
    {
      provide: ApiConfiguration,
      useValue: { rootUrl: environment.apiUrl.replace(/\/api\/?$/, '') },
    },
    provideAppInitializer(() => inject(AuthService).restoreSession()),
    provideAnimationsAsync(),
  ],
};
