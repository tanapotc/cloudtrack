import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminApi } from '../api/services/admin-api';
import { DashboardApi } from '../api/services/dashboard-api';
import { DashboardSummary, ManagedUserSummary, PagedResult, RoleSummary } from './models';

/**
 * Thin facade over the generated OpenAPI services so feature components keep a small,
 * task-shaped surface instead of the generated `{ body }` parameter objects.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly adminApi = inject(AdminApi);
  private readonly dashboardApi = inject(DashboardApi);

  dashboard(): Observable<DashboardSummary> {
    return this.dashboardApi.dashboardGet() as Observable<DashboardSummary>;
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
