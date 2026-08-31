import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { CreateProjectRequest } from '../api/models/create-project-request';
import type { CreateWorkItemRequest } from '../api/models/create-work-item-request';
import type { ProjectDetails } from '../api/models/project-details';
import type { ProjectStatus } from '../api/models/project-status';
import type { ProjectSummary } from '../api/models/project-summary';
import type { UpdateProjectRequest } from '../api/models/update-project-request';
import type { UpdateWorkItemRequest } from '../api/models/update-work-item-request';
import type { WorkItemSummary } from '../api/models/work-item-summary';
import { ProjectsApi } from '../api/services/projects-api';
import { PagedResult } from './models';
import { CrudResource } from './crud-resource';

export interface ProjectSelectQuery {
  search?: string;
  status?: ProjectStatus;
  sort?: 'name' | 'createdAt' | 'updatedAt';
  descending?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Single typed boundary for Project and nested Task CRUD. Pages call this service, never the
 * generated transport client, so route keys and request shapes remain in one maintainable place.
 */
@Injectable({ providedIn: 'root' })
export class ProjectResourceService implements CrudResource<
  ProjectSummary,
  ProjectDetails,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectSelectQuery
> {
  private readonly projectsApi = inject(ProjectsApi);

  select(query: ProjectSelectQuery = {}): Observable<PagedResult<ProjectSummary>> {
    return this.projectsApi.projectsList({
      search: query.search || undefined,
      status: query.status,
      sort: query.sort ?? 'updatedAt',
      descending: query.descending ?? true,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    }) as Observable<PagedResult<ProjectSummary>>;
  }

  selectById(projectId: string): Observable<ProjectDetails> {
    return this.projectsApi.projectsGet({ projectId }) as Observable<ProjectDetails>;
  }

  add(command: CreateProjectRequest): Observable<ProjectDetails> {
    return this.projectsApi.projectsCreate({ body: command }) as Observable<ProjectDetails>;
  }

  edit(projectId: string, command: UpdateProjectRequest): Observable<ProjectDetails> {
    return this.projectsApi.projectsUpdate({
      projectId,
      body: command,
    }) as Observable<ProjectDetails>;
  }

  delete(projectId: string): Observable<void> {
    return this.projectsApi.projectsDelete({ projectId });
  }

  addTask(projectId: string, command: CreateWorkItemRequest): Observable<WorkItemSummary> {
    return this.projectsApi.projectsCreateTask({
      projectId,
      body: command,
    }) as Observable<WorkItemSummary>;
  }

  editTask(
    projectId: string,
    taskId: string,
    command: UpdateWorkItemRequest,
  ): Observable<WorkItemSummary> {
    return this.projectsApi.projectsUpdateTask({
      projectId,
      taskId,
      body: command,
    }) as Observable<WorkItemSummary>;
  }

  deleteTask(projectId: string, taskId: string): Observable<void> {
    return this.projectsApi.projectsDeleteTask({ projectId, taskId });
  }
}
