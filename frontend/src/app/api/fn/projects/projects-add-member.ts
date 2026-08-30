/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { AddProjectMemberRequest } from '../../models/add-project-member-request';
import { ProjectMemberSummary } from '../../models/project-member-summary';

export interface ProjectsAddMember$Params {
  projectId: string;
      body?: AddProjectMemberRequest
}

export function projectsAddMember(http: HttpClient, rootUrl: string, params: ProjectsAddMember$Params, context?: HttpContext): Observable<StrictHttpResponse<ProjectMemberSummary>> {
  const rb = new RequestBuilder(rootUrl, projectsAddMember.PATH, 'post');
  if (params) {
    rb.path('projectId', params.projectId, {});
    rb.body(params.body, 'application/*+json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<ProjectMemberSummary>;
    })
  );
}

projectsAddMember.PATH = '/api/projects/{projectId}/members';
