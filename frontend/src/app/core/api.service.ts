import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminApi } from '../api/services/admin-api';
import { DashboardApi } from '../api/services/dashboard-api';
import { ProjectsApi } from '../api/services/projects-api';
import type { ProjectStatus } from '../api/models/project-status';
import type { WorkItemPriority } from '../api/models/work-item-priority';
import type { WorkItemStatus } from '../api/models/work-item-status';
import {
  DashboardSummary,
  ManagedUserSummary,
  PagedResult,
  ProjectDetails,
  ProjectSummary,
  RoleSummary,
  WorkItemSummary,
} from './models';

/**
 * Thin facade over the generated OpenAPI services so feature components keep a small,
 * task-shaped surface instead of the generated `{ body }` parameter objects.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly projectsApi = inject(ProjectsApi);
  private readonly adminApi = inject(AdminApi);
  private readonly dashboardApi = inject(DashboardApi);

  dashboard(): Observable<DashboardSummary> {
    return this.dashboardApi.dashboardGet() as Observable<DashboardSummary>;
  }

  projects(search = '', status = ''): Observable<PagedResult<ProjectSummary>> {
    return this.projectsApi.projectsList({
      search: search || undefined,
      status: status === '' ? undefined : (Number(status) as ProjectStatus),
      page: 1,
      pageSize: 20,
    }) as Observable<PagedResult<ProjectSummary>>;
  }

  project(id: string): Observable<ProjectDetails> {
    return this.projectsApi.projectsGet({ projectId: id }) as Observable<ProjectDetails>;
  }

  createProject(name: string, description: string): Observable<ProjectDetails> {
    return this.projectsApi.projectsCreate({
      body: { name, description },
    }) as Observable<ProjectDetails>;
  }

  createTask(
    projectId: string,
    title: string,
    description: string,
    priority: number,
    dueDate: string | null,
  ): Observable<WorkItemSummary> {
    return this.projectsApi.projectsCreateTask({
      projectId,
      body: { title, description, priority: priority as WorkItemPriority, dueDate },
    }) as Observable<WorkItemSummary>;
  }

  updateTask(
    projectId: string,
    task: WorkItemSummary,
    status: number,
  ): Observable<WorkItemSummary> {
    return this.projectsApi.projectsUpdateTask({
      projectId,
      taskId: task.id,
      body: {
        title: task.title,
        description: task.description,
        status: status as WorkItemStatus,
        priority: task.priority,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        version: task.version,
      },
    }) as Observable<WorkItemSummary>;
  }

  users(search = '', page = 1, pageSize = 30): Observable<PagedResult<ManagedUserSummary>> {
    return this.adminApi.adminUsers({
      search: search || undefined,
      page,
      pageSize,
    }) as Observable<PagedResult<ManagedUserSummary>>;
  }

  roles(): Observable<RoleSummary[]> {
    return this.adminApi.adminRoles() as Observable<RoleSummary[]>;
  }

  updateUserStatus(userId: string, isActive: boolean): Observable<ManagedUserSummary> {
    return this.adminApi.adminUpdateStatus({
      userId,
      body: { isActive },
    }) as Observable<ManagedUserSummary>;
  }
}
