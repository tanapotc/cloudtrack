/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface ProjectsRemoveMember$Params {
  projectId: string;
  memberUserId: string;
}

export function projectsRemoveMember(http: HttpClient, rootUrl: string, params: ProjectsRemoveMember$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
  const rb = new RequestBuilder(rootUrl, projectsRemoveMember.PATH, 'delete');
  if (params) {
    rb.path('projectId', params.projectId, {});
    rb.path('memberUserId', params.memberUserId, {});
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

projectsRemoveMember.PATH = '/api/projects/{projectId}/members/{memberUserId}';
