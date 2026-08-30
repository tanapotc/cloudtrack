/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ProjectStatus } from '../../models/project-status';
import { ProjectSummaryPagedResult } from '../../models/project-summary-paged-result';

export interface ProjectsList$Params {
  search?: string;
  status?: ProjectStatus;
  sort?: string;
  descending?: boolean;
  page?: number;
  pageSize?: number;
}

export function projectsList(http: HttpClient, rootUrl: string, params?: ProjectsList$Params, context?: HttpContext): Observable<StrictHttpResponse<ProjectSummaryPagedResult>> {
  const rb = new RequestBuilder(rootUrl, projectsList.PATH, 'get');
  if (params) {
    rb.query('search', params.search, {});
    rb.query('status', params.status, {});
    rb.query('sort', params.sort, {});
    rb.query('descending', params.descending, {});
    rb.query('page', params.page, {});
    rb.query('pageSize', params.pageSize, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<ProjectSummaryPagedResult>;
    })
  );
}

projectsList.PATH = '/api/projects';
