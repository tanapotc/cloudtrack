/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { WorkItemCommentSummary } from '../../models/work-item-comment-summary';

export interface ProjectsComments$Params {
  projectId: string;
  taskId: string;
}

export function projectsComments(http: HttpClient, rootUrl: string, params: ProjectsComments$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<WorkItemCommentSummary>>> {
  const rb = new RequestBuilder(rootUrl, projectsComments.PATH, 'get');
  if (params) {
    rb.path('projectId', params.projectId, {});
    rb.path('taskId', params.taskId, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<WorkItemCommentSummary>>;
    })
  );
}

projectsComments.PATH = '/api/projects/{projectId}/tasks/{taskId}/comments';
