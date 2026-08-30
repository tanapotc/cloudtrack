/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ProjectMemberSummary } from '../../models/project-member-summary';

export interface ProjectsMembers$Params {
  projectId: string;
}

export function projectsMembers(http: HttpClient, rootUrl: string, params: ProjectsMembers$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<ProjectMemberSummary>>> {
  const rb = new RequestBuilder(rootUrl, projectsMembers.PATH, 'get');
  if (params) {
    rb.path('projectId', params.projectId, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<ProjectMemberSummary>>;
    })
  );
}

projectsMembers.PATH = '/api/projects/{projectId}/members';
