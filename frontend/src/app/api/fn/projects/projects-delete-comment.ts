/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface ProjectsDeleteComment$Params {
  projectId: string;
  taskId: string;
  commentId: string;
}

export function projectsDeleteComment(http: HttpClient, rootUrl: string, params: ProjectsDeleteComment$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
  const rb = new RequestBuilder(rootUrl, projectsDeleteComment.PATH, 'delete');
  if (params) {
    rb.path('projectId', params.projectId, {});
    rb.path('taskId', params.taskId, {});
    rb.path('commentId', params.commentId, {});
  }

  return http.request(
    rb.build({ responseType: 'text', accept: '*/*', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
    })
  );
}

projectsDeleteComment.PATH = '/api/projects/{projectId}/tasks/{taskId}/comments/{commentId}';
