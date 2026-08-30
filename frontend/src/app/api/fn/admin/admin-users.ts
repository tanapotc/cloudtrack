/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ManagedUserSummaryPagedResult } from '../../models/managed-user-summary-paged-result';

export interface AdminUsers$Params {
  search?: string;
  page?: number;
  pageSize?: number;
}

export function adminUsers(http: HttpClient, rootUrl: string, params?: AdminUsers$Params, context?: HttpContext): Observable<StrictHttpResponse<ManagedUserSummaryPagedResult>> {
  const rb = new RequestBuilder(rootUrl, adminUsers.PATH, 'get');
  if (params) {
    rb.query('search', params.search, {});
    rb.query('page', params.page, {});
    rb.query('pageSize', params.pageSize, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<ManagedUserSummaryPagedResult>;
    })
  );
}

adminUsers.PATH = '/api/admin/users';
