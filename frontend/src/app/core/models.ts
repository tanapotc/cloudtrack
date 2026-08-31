// Response DTOs are re-exported from the generated OpenAPI client (`npm run api-generate`).
export type { UserSummary } from '../api/models/user-summary';
export type { AuthResponse } from '../api/models/auth-response';
export type { ProjectSummary } from '../api/models/project-summary';
export type { WorkItemSummary } from '../api/models/work-item-summary';
export type { ProjectDetails } from '../api/models/project-details';
export type { ProjectMemberSummary } from '../api/models/project-member-summary';
export type { DashboardSummary } from '../api/models/dashboard-summary';
export type { ActivitySummary } from '../api/models/activity-summary';
export type { ManagedUserSummary } from '../api/models/managed-user-summary';
export type { RoleSummary } from '../api/models/role-summary';
export type { PermissionSummary } from '../api/models/permission-summary';

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ASP.NET Core Problem Details are not part of the OpenAPI schema.
export interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
}
