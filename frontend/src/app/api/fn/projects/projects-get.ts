/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ProjectDetails } from '../../models/project-details';

export interface ProjectsGet$Params {
  projectId: string;
}

export function projectsGet(http: HttpClient, rootUrl: string, params: ProjectsGet$Params, context?: HttpContext): Observable<StrictHttpResponse<ProjectDetails>> {
  const rb = new RequestBuilder(rootUrl, projectsGet.PATH, 'get');
  if (params) {
    rb.path('projectId', params.projectId, {});
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

projectsGet.PATH = '/api/projects/{projectId}';
