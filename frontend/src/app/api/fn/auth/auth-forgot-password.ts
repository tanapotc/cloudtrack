/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ForgotPasswordRequest } from '../../models/forgot-password-request';
import { ForgotPasswordResult } from '../../models/forgot-password-result';

export interface AuthForgotPassword$Params {
      body?: ForgotPasswordRequest
}

export function authForgotPassword(http: HttpClient, rootUrl: string, params?: AuthForgotPassword$Params, context?: HttpContext): Observable<StrictHttpResponse<ForgotPasswordResult>> {
  const rb = new RequestBuilder(rootUrl, authForgotPassword.PATH, 'post');
  if (params) {
    rb.body(params.body, 'application/*+json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<ForgotPasswordResult>;
    })
  );
}

authForgotPassword.PATH = '/api/auth/forgot-password';
