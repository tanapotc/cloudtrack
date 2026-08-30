/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ManagedUserSummary } from '../../models/managed-user-summary';
import { UpdateUserStatusRequest } from '../../models/update-user-status-request';

export interface AdminUpdateStatus$Params {
  userId: string;
      body?: UpdateUserStatusRequest
}

export function adminUpdateStatus(http: HttpClient, rootUrl: string, params: AdminUpdateStatus$Params, context?: HttpContext): Observable<StrictHttpResponse<ManagedUserSummary>> {
  const rb = new RequestBuilder(rootUrl, adminUpdateStatus.PATH, 'put');
  if (params) {
    rb.path('userId', params.userId, {});
    rb.body(params.body, 'application/*+json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<ManagedUserSummary>;
    })
  );
}

adminUpdateStatus.PATH = '/api/admin/users/{userId}/status';
