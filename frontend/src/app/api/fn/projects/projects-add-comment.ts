/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { CreateWorkItemCommentRequest } from '../../models/create-work-item-comment-request';
import { WorkItemCommentSummary } from '../../models/work-item-comment-summary';

export interface ProjectsAddComment$Params {
  projectId: string;
  taskId: string;
      body?: CreateWorkItemCommentRequest
}

export function projectsAddComment(http: HttpClient, rootUrl: string, params: ProjectsAddComment$Params, context?: HttpContext): Observable<StrictHttpResponse<WorkItemCommentSummary>> {
  const rb = new RequestBuilder(rootUrl, projectsAddComment.PATH, 'post');
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
      return r as StrictHttpResponse<WorkItemCommentSummary>;
    })
  );
}

projectsAddComment.PATH = '/api/projects/{projectId}/tasks/{taskId}/comments';
