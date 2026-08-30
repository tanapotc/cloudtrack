/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ManagedUserSummary } from '../../models/managed-user-summary';
import { UpdateUserRolesRequest } from '../../models/update-user-roles-request';

export interface AdminUpdateRoles$Params {
  userId: string;
      body?: UpdateUserRolesRequest
}

export function adminUpdateRoles(http: HttpClient, rootUrl: string, params: AdminUpdateRoles$Params, context?: HttpContext): Observable<StrictHttpResponse<ManagedUserSummary>> {
  const rb = new RequestBuilder(rootUrl, adminUpdateRoles.PATH, 'put');
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

adminUpdateRoles.PATH = '/api/admin/users/{userId}/roles';
