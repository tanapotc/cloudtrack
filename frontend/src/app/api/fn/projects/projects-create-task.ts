/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { CreateWorkItemRequest } from '../../models/create-work-item-request';
import { WorkItemSummary } from '../../models/work-item-summary';

export interface ProjectsCreateTask$Params {
  projectId: string;
      body?: CreateWorkItemRequest
}

export function projectsCreateTask(http: HttpClient, rootUrl: string, params: ProjectsCreateTask$Params, context?: HttpContext): Observable<StrictHttpResponse<WorkItemSummary>> {
  const rb = new RequestBuilder(rootUrl, projectsCreateTask.PATH, 'post');
  if (params) {
    rb.path('projectId', params.projectId, {});
    rb.body(params.body, 'application/*+json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<WorkItemSummary>;
    })
  );
}

projectsCreateTask.PATH = '/api/projects/{projectId}/tasks';
