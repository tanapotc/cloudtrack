import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { DashboardSummary, ManagedUserSummary, PagedResult, ProjectDetails, ProjectSummary, RoleSummary, WorkItemSummary } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  dashboard() {
    return this.http.get<DashboardSummary>(`${environment.apiUrl}/dashboard`);
  }

  projects(search = '', status = '') {
    let params = new HttpParams().set('page', 1).set('pageSize', 20);
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    return this.http.get<PagedResult<ProjectSummary>>(`${environment.apiUrl}/projects`, { params });
  }

  project(id: string) {
    return this.http.get<ProjectDetails>(`${environment.apiUrl}/projects/${id}`);
  }

  createProject(name: string, description: string) {
    return this.http.post<ProjectDetails>(`${environment.apiUrl}/projects`, { name, description });
  }

  createTask(projectId: string, title: string, description: string, priority: number, dueDate: string | null) {
    return this.http.post<WorkItemSummary>(`${environment.apiUrl}/projects/${projectId}/tasks`, { title, description, priority, dueDate });
  }

  updateTask(projectId: string, task: WorkItemSummary, status: number) {
    return this.http.put<WorkItemSummary>(`${environment.apiUrl}/projects/${projectId}/tasks/${task.id}`, { ...task, status });
  }

  users(search = '') {
    let params = new HttpParams().set('page', 1).set('pageSize', 30);
    if (search) params = params.set('search', search);
    return this.http.get<PagedResult<ManagedUserSummary>>(`${environment.apiUrl}/admin/users`, { params });
  }

  roles() {
    return this.http.get<RoleSummary[]>(`${environment.apiUrl}/admin/roles`);
  }

  updateUserStatus(userId: string, isActive: boolean) {
    return this.http.put<ManagedUserSummary>(`${environment.apiUrl}/admin/users/${userId}/status`, { isActive });
  }
}
