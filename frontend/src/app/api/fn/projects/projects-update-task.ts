/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { UpdateWorkItemRequest } from '../../models/update-work-item-request';
import { WorkItemSummary } from '../../models/work-item-summary';

export interface ProjectsUpdateTask$Params {
  projectId: string;
  taskId: string;
      body?: UpdateWorkItemRequest
}

export function projectsUpdateTask(http: HttpClient, rootUrl: string, params: ProjectsUpdateTask$Params, context?: HttpContext): Observable<StrictHttpResponse<WorkItemSummary>> {
  const rb = new RequestBuilder(rootUrl, projectsUpdateTask.PATH, 'put');
  if (params) {
    rb.path('projectId', params.projectId, {});
    rb.path('taskId', params.taskId, {});
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

projectsUpdateTask.PATH = '/api/projects/{projectId}/tasks/{taskId}';
