/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ProjectDetails } from '../../models/project-details';
import { UpdateProjectRequest } from '../../models/update-project-request';

export interface ProjectsUpdate$Params {
  projectId: string;
      body?: UpdateProjectRequest
}

export function projectsUpdate(http: HttpClient, rootUrl: string, params: ProjectsUpdate$Params, context?: HttpContext): Observable<StrictHttpResponse<ProjectDetails>> {
  const rb = new RequestBuilder(rootUrl, projectsUpdate.PATH, 'put');
  if (params) {
    rb.path('projectId', params.projectId, {});
    rb.body(params.body, 'application/*+json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<ProjectDetails>;
    })
  );
}

projectsUpdate.PATH = '/api/projects/{projectId}';
