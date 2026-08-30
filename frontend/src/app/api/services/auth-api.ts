/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { authChangePassword } from '../fn/auth/auth-change-password';
import { AuthChangePassword$Params } from '../fn/auth/auth-change-password';
import { authForgotPassword } from '../fn/auth/auth-forgot-password';
import { AuthForgotPassword$Params } from '../fn/auth/auth-forgot-password';
import { authLogin } from '../fn/auth/auth-login';
import { AuthLogin$Params } from '../fn/auth/auth-login';
import { authLogout } from '../fn/auth/auth-logout';
import { AuthLogout$Params } from '../fn/auth/auth-logout';
import { authMe } from '../fn/auth/auth-me';
import { AuthMe$Params } from '../fn/auth/auth-me';
import { authRefresh } from '../fn/auth/auth-refresh';
import { AuthRefresh$Params } from '../fn/auth/auth-refresh';
import { authRegister } from '../fn/auth/auth-register';
import { AuthRegister$Params } from '../fn/auth/auth-register';
import { authResetPassword } from '../fn/auth/auth-reset-password';
import { AuthResetPassword$Params } from '../fn/auth/auth-reset-password';
import { AuthResponse } from '../models/auth-response';
import { ForgotPasswordResult } from '../models/forgot-password-result';
import { UserSummary } from '../models/user-summary';

@Injectable({ providedIn: 'root' })
export class AuthApi extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `authRegister()` */
  static readonly AuthRegisterPath = '/api/auth/register';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authRegister()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  authRegister$Response(params?: AuthRegister$Params, context?: HttpContext): Observable<StrictHttpResponse<AuthResponse>> {
    return authRegister(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authRegister$Response()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  authRegister(params?: AuthRegister$Params, context?: HttpContext): Observable<AuthResponse> {
    return this.authRegister$Response(params, context).pipe(
      map((r: StrictHttpResponse<AuthResponse>): AuthResponse => r.body)
    );
  }

  /** Path part for operation `authLogin()` */
  static readonly AuthLoginPath = '/api/auth/login';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authLogin()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  authLogin$Response(params?: AuthLogin$Params, context?: HttpContext): Observable<StrictHttpResponse<AuthResponse>> {
    return authLogin(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authLogin$Response()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  authLogin(params?: AuthLogin$Params, context?: HttpContext): Observable<AuthResponse> {
    return this.authLogin$Response(params, context).pipe(
      map((r: StrictHttpResponse<AuthResponse>): AuthResponse => r.body)
    );
  }

  /** Path part for operation `authRefresh()` */
  static readonly AuthRefreshPath = '/api/auth/refresh';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authRefresh()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  authRefresh$Response(params?: AuthRefresh$Params, context?: HttpContext): Observable<StrictHttpResponse<AuthResponse>> {
    return authRefresh(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authRefresh$Response()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  authRefresh(params?: AuthRefresh$Params, context?: HttpContext): Observable<AuthResponse> {
    return this.authRefresh$Response(params, context).pipe(
      map((r: StrictHttpResponse<AuthResponse>): AuthResponse => r.body)
    );
  }

  /** Path part for operation `authLogout()` */
  static readonly AuthLogoutPath = '/api/auth/logout';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authLogout()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  authLogout$Response(params?: AuthLogout$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
    return authLogout(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authLogout$Response()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  authLogout(params?: AuthLogout$Params, context?: HttpContext): Observable<void> {
    return this.authLogout$Response(params, context).pipe(
      map((r: StrictHttpResponse<void>): void => r.body)
    );
  }

  /** Path part for operation `authForgotPassword()` */
  static readonly AuthForgotPasswordPath = '/api/auth/forgot-password';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authForgotPassword()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  authForgotPassword$Response(params?: AuthForgotPassword$Params, context?: HttpContext): Observable<StrictHttpResponse<ForgotPasswordResult>> {
    return authForgotPassword(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authForgotPassword$Response()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  authForgotPassword(params?: AuthForgotPassword$Params, context?: HttpContext): Observable<ForgotPasswordResult> {
    return this.authForgotPassword$Response(params, context).pipe(
      map((r: StrictHttpResponse<ForgotPasswordResult>): ForgotPasswordResult => r.body)
    );
  }

  /** Path part for operation `authResetPassword()` */
  static readonly AuthResetPasswordPath = '/api/auth/reset-password';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authResetPassword()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  authResetPassword$Response(params?: AuthResetPassword$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
    return authResetPassword(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authResetPassword$Response()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  authResetPassword(params?: AuthResetPassword$Params, context?: HttpContext): Observable<void> {
    return this.authResetPassword$Response(params, context).pipe(
      map((r: StrictHttpResponse<void>): void => r.body)
    );
  }

  /** Path part for operation `authChangePassword()` */
  static readonly AuthChangePasswordPath = '/api/auth/change-password';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authChangePassword()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  authChangePassword$Response(params?: AuthChangePassword$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
    return authChangePassword(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authChangePassword$Response()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  authChangePassword(params?: AuthChangePassword$Params, context?: HttpContext): Observable<void> {
    return this.authChangePassword$Response(params, context).pipe(
      map((r: StrictHttpResponse<void>): void => r.body)
    );
  }

  /** Path part for operation `authMe()` */
  static readonly AuthMePath = '/api/auth/me';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authMe()` instead.
   *
   * This method doesn't expect any request body.
   */
  authMe$Response(params?: AuthMe$Params, context?: HttpContext): Observable<StrictHttpResponse<UserSummary>> {
    return authMe(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authMe$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  authMe(params?: AuthMe$Params, context?: HttpContext): Observable<UserSummary> {
    return this.authMe$Response(params, context).pipe(
      map((r: StrictHttpResponse<UserSummary>): UserSummary => r.body)
    );
  }

}
