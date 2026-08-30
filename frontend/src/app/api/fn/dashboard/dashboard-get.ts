/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { DashboardSummary } from '../../models/dashboard-summary';

export interface DashboardGet$Params {
}

export function dashboardGet(http: HttpClient, rootUrl: string, params?: DashboardGet$Params, context?: HttpContext): Observable<StrictHttpResponse<DashboardSummary>> {
  const rb = new RequestBuilder(rootUrl, dashboardGet.PATH, 'get');
  if (params) {
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<DashboardSummary>;
    })
  );
}

dashboardGet.PATH = '/api/dashboard';
