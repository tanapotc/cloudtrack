/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { ProjectDetails } from '../models/project-details';
import { ProjectMemberSummary } from '../models/project-member-summary';
import { projectsAddComment } from '../fn/projects/projects-add-comment';
import { ProjectsAddComment$Params } from '../fn/projects/projects-add-comment';
import { projectsAddMember } from '../fn/projects/projects-add-member';
import { ProjectsAddMember$Params } from '../fn/projects/projects-add-member';
import { projectsComments } from '../fn/projects/projects-comments';
import { ProjectsComments$Params } from '../fn/projects/projects-comments';
import { projectsCreate } from '../fn/projects/projects-create';
import { ProjectsCreate$Params } from '../fn/projects/projects-create';
import { projectsCreateTask } from '../fn/projects/projects-create-task';
import { ProjectsCreateTask$Params } from '../fn/projects/projects-create-task';
import { projectsDelete } from '../fn/projects/projects-delete';
import { ProjectsDelete$Params } from '../fn/projects/projects-delete';
import { projectsDeleteComment } from '../fn/projects/projects-delete-comment';
import { ProjectsDeleteComment$Params } from '../fn/projects/projects-delete-comment';
import { projectsDeleteTask } from '../fn/projects/projects-delete-task';
import { ProjectsDeleteTask$Params } from '../fn/projects/projects-delete-task';
import { projectsGet } from '../fn/projects/projects-get';
import { ProjectsGet$Params } from '../fn/projects/projects-get';
import { projectsList } from '../fn/projects/projects-list';
import { ProjectsList$Params } from '../fn/projects/projects-list';
import { projectsMembers } from '../fn/projects/projects-members';
import { ProjectsMembers$Params } from '../fn/projects/projects-members';
import { projectsRemoveMember } from '../fn/projects/projects-remove-member';
import { ProjectsRemoveMember$Params } from '../fn/projects/projects-remove-member';
import { ProjectSummaryPagedResult } from '../models/project-summary-paged-result';
import { projectsUpdate } from '../fn/projects/projects-update';
import { ProjectsUpdate$Params } from '../fn/projects/projects-update';
import { projectsUpdateTask } from '../fn/projects/projects-update-task';
import { ProjectsUpdateTask$Params } from '../fn/projects/projects-update-task';
import { WorkItemCommentSummary } from '../models/work-item-comment-summary';
import { WorkItemSummary } from '../models/work-item-summary';

@Injectable({ providedIn: 'root' })
export class ProjectsApi extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `projectsList()` */
  static readonly ProjectsListPath = '/api/projects';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `projectsList()` instead.
   *
   * This method doesn't expect any request body.
   */
  projectsList$Response(params?: ProjectsList$Params, context?: HttpContext): Observable<StrictHttpResponse<ProjectSummaryPagedResult>> {
    return projectsList(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `projectsList$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  projectsList(params?: ProjectsList$Params, context?: HttpContext): Observable<ProjectSummaryPagedResult> {
    return this.projectsList$Response(params, context).pipe(
      map((r: StrictHttpResponse<ProjectSummaryPagedResult>): ProjectSummaryPagedResult => r.body)
    );
  }

  /** Path part for operation `projectsCreate()` */
  static readonly ProjectsCreatePath = '/api/projects';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `projectsCreate()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  projectsCreate$Response(params?: ProjectsCreate$Params, context?: HttpContext): Observable<StrictHttpResponse<ProjectDetails>> {
    return projectsCreate(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `projectsCreate$Response()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  projectsCreate(params?: ProjectsCreate$Params, context?: HttpContext): Observable<ProjectDetails> {
    return this.projectsCreate$Response(params, context).pipe(
      map((r: StrictHttpResponse<ProjectDetails>): ProjectDetails => r.body)
    );
  }

  /** Path part for operation `projectsGet()` */
  static readonly ProjectsGetPath = '/api/projects/{projectId}';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `projectsGet()` instead.
   *
   * This method doesn't expect any request body.
   */
  projectsGet$Response(params: ProjectsGet$Params, context?: HttpContext): Observable<StrictHttpResponse<ProjectDetails>> {
    return projectsGet(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `projectsGet$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  projectsGet(params: ProjectsGet$Params, context?: HttpContext): Observable<ProjectDetails> {
    return this.projectsGet$Response(params, context).pipe(
      map((r: StrictHttpResponse<ProjectDetails>): ProjectDetails => r.body)
    );
  }

  /** Path part for operation `projectsUpdate()` */
  static readonly ProjectsUpdatePath = '/api/projects/{projectId}';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `projectsUpdate()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  projectsUpdate$Response(params: ProjectsUpdate$Params, context?: HttpContext): Observable<StrictHttpResponse<ProjectDetails>> {
    return projectsUpdate(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `projectsUpdate$Response()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  projectsUpdate(params: ProjectsUpdate$Params, context?: HttpContext): Observable<ProjectDetails> {
    return this.projectsUpdate$Response(params, context).pipe(
      map((r: StrictHttpResponse<ProjectDetails>): ProjectDetails => r.body)
    );
  }

  /** Path part for operation `projectsDelete()` */
  static readonly ProjectsDeletePath = '/api/projects/{projectId}';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `projectsDelete()` instead.
   *
   * This method doesn't expect any request body.
   */
  projectsDelete$Response(params: ProjectsDelete$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
    return projectsDelete(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `projectsDelete$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  projectsDelete(params: ProjectsDelete$Params, context?: HttpContext): Observable<void> {
    return this.projectsDelete$Response(params, context).pipe(
      map((r: StrictHttpResponse<void>): void => r.body)
    );
  }

  /** Path part for operation `projectsCreateTask()` */
  static readonly ProjectsCreateTaskPath = '/api/projects/{projectId}/tasks';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `projectsCreateTask()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  projectsCreateTask$Response(params: ProjectsCreateTask$Params, context?: HttpContext): Observable<StrictHttpResponse<WorkItemSummary>> {
    return projectsCreateTask(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `projectsCreateTask$Response()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  projectsCreateTask(params: ProjectsCreateTask$Params, context?: HttpContext): Observable<WorkItemSummary> {
    return this.projectsCreateTask$Response(params, context).pipe(
      map((r: StrictHttpResponse<WorkItemSummary>): WorkItemSummary => r.body)
    );
  }

  /** Path part for operation `projectsUpdateTask()` */
  static readonly ProjectsUpdateTaskPath = '/api/projects/{projectId}/tasks/{taskId}';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `projectsUpdateTask()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  projectsUpdateTask$Response(params: ProjectsUpdateTask$Params, context?: HttpContext): Observable<StrictHttpResponse<WorkItemSummary>> {
    return projectsUpdateTask(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `projectsUpdateTask$Response()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  projectsUpdateTask(params: ProjectsUpdateTask$Params, context?: HttpContext): Observable<WorkItemSummary> {
    return this.projectsUpdateTask$Response(params, context).pipe(
      map((r: StrictHttpResponse<WorkItemSummary>): WorkItemSummary => r.body)
    );
  }

  /** Path part for operation `projectsDeleteTask()` */
  static readonly ProjectsDeleteTaskPath = '/api/projects/{projectId}/tasks/{taskId}';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `projectsDeleteTask()` instead.
   *
   * This method doesn't expect any request body.
   */
  projectsDeleteTask$Response(params: ProjectsDeleteTask$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
    return projectsDeleteTask(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `projectsDeleteTask$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  projectsDeleteTask(params: ProjectsDeleteTask$Params, context?: HttpContext): Observable<void> {
    return this.projectsDeleteTask$Response(params, context).pipe(
      map((r: StrictHttpResponse<void>): void => r.body)
    );
  }

  /** Path part for operation `projectsMembers()` */
  static readonly ProjectsMembersPath = '/api/projects/{projectId}/members';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `projectsMembers()` instead.
   *
   * This method doesn't expect any request body.
   */
  projectsMembers$Response(params: ProjectsMembers$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<ProjectMemberSummary>>> {
    return projectsMembers(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `projectsMembers$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  projectsMembers(params: ProjectsMembers$Params, context?: HttpContext): Observable<Array<ProjectMemberSummary>> {
    return this.projectsMembers$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<ProjectMemberSummary>>): Array<ProjectMemberSummary> => r.body)
    );
  }

  /** Path part for operation `projectsAddMember()` */
  static readonly ProjectsAddMemberPath = '/api/projects/{projectId}/members';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `projectsAddMember()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  projectsAddMember$Response(params: ProjectsAddMember$Params, context?: HttpContext): Observable<StrictHttpResponse<ProjectMemberSummary>> {
    return projectsAddMember(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `projectsAddMember$Response()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  projectsAddMember(params: ProjectsAddMember$Params, context?: HttpContext): Observable<ProjectMemberSummary> {
    return this.projectsAddMember$Response(params, context).pipe(
      map((r: StrictHttpResponse<ProjectMemberSummary>): ProjectMemberSummary => r.body)
    );
  }

  /** Path part for operation `projectsRemoveMember()` */
  static readonly ProjectsRemoveMemberPath = '/api/projects/{projectId}/members/{memberUserId}';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `projectsRemoveMember()` instead.
   *
   * This method doesn't expect any request body.
   */
  projectsRemoveMember$Response(params: ProjectsRemoveMember$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
    return projectsRemoveMember(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `projectsRemoveMember$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  projectsRemoveMember(params: ProjectsRemoveMember$Params, context?: HttpContext): Observable<void> {
    return this.projectsRemoveMember$Response(params, context).pipe(
      map((r: StrictHttpResponse<void>): void => r.body)
    );
  }

  /** Path part for operation `projectsComments()` */
  static readonly ProjectsCommentsPath = '/api/projects/{projectId}/tasks/{taskId}/comments';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `projectsComments()` instead.
   *
   * This method doesn't expect any request body.
   */
  projectsComments$Response(params: ProjectsComments$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<WorkItemCommentSummary>>> {
    return projectsComments(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `projectsComments$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  projectsComments(params: ProjectsComments$Params, context?: HttpContext): Observable<Array<WorkItemCommentSummary>> {
    return this.projectsComments$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<WorkItemCommentSummary>>): Array<WorkItemCommentSummary> => r.body)
    );
  }

  /** Path part for operation `projectsAddComment()` */
  static readonly ProjectsAddCommentPath = '/api/projects/{projectId}/tasks/{taskId}/comments';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `projectsAddComment()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  projectsAddComment$Response(params: ProjectsAddComment$Params, context?: HttpContext): Observable<StrictHttpResponse<WorkItemCommentSummary>> {
    return projectsAddComment(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `projectsAddComment$Response()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  projectsAddComment(params: ProjectsAddComment$Params, context?: HttpContext): Observable<WorkItemCommentSummary> {
    return this.projectsAddComment$Response(params, context).pipe(
      map((r: StrictHttpResponse<WorkItemCommentSummary>): WorkItemCommentSummary => r.body)
    );
  }

  /** Path part for operation `projectsDeleteComment()` */
  static readonly ProjectsDeleteCommentPath = '/api/projects/{projectId}/tasks/{taskId}/comments/{commentId}';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `projectsDeleteComment()` instead.
   *
   * This method doesn't expect any request body.
   */
  projectsDeleteComment$Response(params: ProjectsDeleteComment$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
    return projectsDeleteComment(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `projectsDeleteComment$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  projectsDeleteComment(params: ProjectsDeleteComment$Params, context?: HttpContext): Observable<void> {
    return this.projectsDeleteComment$Response(params, context).pipe(
      map((r: StrictHttpResponse<void>): void => r.body)
    );
  }

}
