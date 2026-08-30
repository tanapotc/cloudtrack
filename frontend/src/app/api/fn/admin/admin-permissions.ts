/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { PermissionSummary } from '../../models/permission-summary';

export interface AdminPermissions$Params {
}

export function adminPermissions(http: HttpClient, rootUrl: string, params?: AdminPermissions$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<PermissionSummary>>> {
  const rb = new RequestBuilder(rootUrl, adminPermissions.PATH, 'get');
  if (params) {
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<PermissionSummary>>;
    })
  );
}

adminPermissions.PATH = '/api/admin/permissions';
