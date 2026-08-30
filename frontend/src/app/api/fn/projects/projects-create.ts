/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { CreateProjectRequest } from '../../models/create-project-request';
import { ProjectDetails } from '../../models/project-details';

export interface ProjectsCreate$Params {
      body?: CreateProjectRequest
}

export function projectsCreate(http: HttpClient, rootUrl: string, params?: ProjectsCreate$Params, context?: HttpContext): Observable<StrictHttpResponse<ProjectDetails>> {
  const rb = new RequestBuilder(rootUrl, projectsCreate.PATH, 'post');
  if (params) {
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

projectsCreate.PATH = '/api/projects';
