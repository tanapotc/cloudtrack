/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { RoleSummary } from '../../models/role-summary';
import { UpdateRolePermissionsRequest } from '../../models/update-role-permissions-request';

export interface AdminUpdateRolePermissions$Params {
  roleId: string;
      body?: UpdateRolePermissionsRequest
}

export function adminUpdateRolePermissions(http: HttpClient, rootUrl: string, params: AdminUpdateRolePermissions$Params, context?: HttpContext): Observable<StrictHttpResponse<RoleSummary>> {
  const rb = new RequestBuilder(rootUrl, adminUpdateRolePermissions.PATH, 'put');
  if (params) {
    rb.path('roleId', params.roleId, {});
    rb.body(params.body, 'application/*+json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<RoleSummary>;
    })
  );
}

adminUpdateRolePermissions.PATH = '/api/admin/roles/{roleId}/permissions';
