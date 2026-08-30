import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AuthResponse } from './models';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const response: AuthResponse = {
    accessToken: 'memory-only-token',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: '7bb193ed-63a6-4acd-b6d7-7e90ac9b4036',
      email: 'portfolio@example.test',
      displayName: 'Portfolio Developer',
      roles: ['User'],
      permissions: ['projects.read'],
    },
  };

  beforeEach(() => {
    sessionStorage.setItem('cloudtrack.accessToken', 'legacy-token');
    sessionStorage.setItem('cloudtrack.user', '{}');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigateByUrl: vi.fn() } },
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('keeps the access token in memory and removes legacy browser storage', () => {
    service.login('portfolio@example.test', 'Portfolio!234').subscribe();
    http.expectOne((request) => request.url.endsWith('/api/auth/login')).flush(response);

    expect(service.accessToken).toBe('memory-only-token');
    expect(service.currentUser()?.email).toBe('portfolio@example.test');
    expect(sessionStorage.getItem('cloudtrack.accessToken')).toBeNull();
    expect(sessionStorage.getItem('cloudtrack.user')).toBeNull();
  });

  it('restores a session through the HttpOnly refresh cookie', () => {
    service.restoreSession().subscribe();
    const request = http.expectOne((candidate) => candidate.url.endsWith('/api/auth/refresh'));
    expect(request.request.withCredentials).toBe(true);
    request.flush(response);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.accessToken).toBe('memory-only-token');
  });

  it('finishes anonymously when no refresh session exists', () => {
    let completed = false;
    service.restoreSession().subscribe({ complete: () => (completed = true) });
    http
      .expectOne((request) => request.url.endsWith('/api/auth/refresh'))
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(completed).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.accessToken).toBeNull();
  });
});
