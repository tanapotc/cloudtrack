/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { adminPermissions } from '../fn/admin/admin-permissions';
import { AdminPermissions$Params } from '../fn/admin/admin-permissions';
import { adminRoles } from '../fn/admin/admin-roles';
import { AdminRoles$Params } from '../fn/admin/admin-roles';
import { adminUpdateRolePermissions } from '../fn/admin/admin-update-role-permissions';
import { AdminUpdateRolePermissions$Params } from '../fn/admin/admin-update-role-permissions';
import { adminUpdateRoles } from '../fn/admin/admin-update-roles';
import { AdminUpdateRoles$Params } from '../fn/admin/admin-update-roles';
import { adminUpdateStatus } from '../fn/admin/admin-update-status';
import { AdminUpdateStatus$Params } from '../fn/admin/admin-update-status';
import { adminUsers } from '../fn/admin/admin-users';
import { AdminUsers$Params } from '../fn/admin/admin-users';
import { ManagedUserSummary } from '../models/managed-user-summary';
import { ManagedUserSummaryPagedResult } from '../models/managed-user-summary-paged-result';
import { PermissionSummary } from '../models/permission-summary';
import { RoleSummary } from '../models/role-summary';

@Injectable({ providedIn: 'root' })
export class AdminApi extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `adminUsers()` */
  static readonly AdminUsersPath = '/api/admin/users';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `adminUsers()` instead.
   *
   * This method doesn't expect any request body.
   */
  adminUsers$Response(params?: AdminUsers$Params, context?: HttpContext): Observable<StrictHttpResponse<ManagedUserSummaryPagedResult>> {
    return adminUsers(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `adminUsers$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  adminUsers(params?: AdminUsers$Params, context?: HttpContext): Observable<ManagedUserSummaryPagedResult> {
    return this.adminUsers$Response(params, context).pipe(
      map((r: StrictHttpResponse<ManagedUserSummaryPagedResult>): ManagedUserSummaryPagedResult => r.body)
    );
  }

  /** Path part for operation `adminRoles()` */
  static readonly AdminRolesPath = '/api/admin/roles';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `adminRoles()` instead.
   *
   * This method doesn't expect any request body.
   */
  adminRoles$Response(params?: AdminRoles$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<RoleSummary>>> {
    return adminRoles(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `adminRoles$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  adminRoles(params?: AdminRoles$Params, context?: HttpContext): Observable<Array<RoleSummary>> {
    return this.adminRoles$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<RoleSummary>>): Array<RoleSummary> => r.body)
    );
  }

  /** Path part for operation `adminPermissions()` */
  static readonly AdminPermissionsPath = '/api/admin/permissions';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `adminPermissions()` instead.
   *
   * This method doesn't expect any request body.
   */
  adminPermissions$Response(params?: AdminPermissions$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<PermissionSummary>>> {
    return adminPermissions(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `adminPermissions$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  adminPermissions(params?: AdminPermissions$Params, context?: HttpContext): Observable<Array<PermissionSummary>> {
    return this.adminPermissions$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<PermissionSummary>>): Array<PermissionSummary> => r.body)
    );
  }

  /** Path part for operation `adminUpdateRoles()` */
  static readonly AdminUpdateRolesPath = '/api/admin/users/{userId}/roles';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `adminUpdateRoles()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  adminUpdateRoles$Response(params: AdminUpdateRoles$Params, context?: HttpContext): Observable<StrictHttpResponse<ManagedUserSummary>> {
    return adminUpdateRoles(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `adminUpdateRoles$Response()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  adminUpdateRoles(params: AdminUpdateRoles$Params, context?: HttpContext): Observable<ManagedUserSummary> {
    return this.adminUpdateRoles$Response(params, context).pipe(
      map((r: StrictHttpResponse<ManagedUserSummary>): ManagedUserSummary => r.body)
    );
  }

  /** Path part for operation `adminUpdateStatus()` */
  static readonly AdminUpdateStatusPath = '/api/admin/users/{userId}/status';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `adminUpdateStatus()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  adminUpdateStatus$Response(params: AdminUpdateStatus$Params, context?: HttpContext): Observable<StrictHttpResponse<ManagedUserSummary>> {
    return adminUpdateStatus(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `adminUpdateStatus$Response()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  adminUpdateStatus(params: AdminUpdateStatus$Params, context?: HttpContext): Observable<ManagedUserSummary> {
    return this.adminUpdateStatus$Response(params, context).pipe(
      map((r: StrictHttpResponse<ManagedUserSummary>): ManagedUserSummary => r.body)
    );
  }

  /** Path part for operation `adminUpdateRolePermissions()` */
  static readonly AdminUpdateRolePermissionsPath = '/api/admin/roles/{roleId}/permissions';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `adminUpdateRolePermissions()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  adminUpdateRolePermissions$Response(params: AdminUpdateRolePermissions$Params, context?: HttpContext): Observable<StrictHttpResponse<RoleSummary>> {
    return adminUpdateRolePermissions(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `adminUpdateRolePermissions$Response()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  adminUpdateRolePermissions(params: AdminUpdateRolePermissions$Params, context?: HttpContext): Observable<RoleSummary> {
    return this.adminUpdateRolePermissions$Response(params, context).pipe(
      map((r: StrictHttpResponse<RoleSummary>): RoleSummary => r.body)
    );
  }

}
