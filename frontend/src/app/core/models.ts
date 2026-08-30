export interface UserSummary {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: UserSummary;
}

export interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  status: number;
  taskCount: number;
  completedTaskCount: number;
  memberCount: number;
  version: number;
  updatedAt: string;
}

export interface WorkItemSummary {
  id: string;
  title: string;
  description: string;
  status: number;
  priority: number;
  dueDate: string | null;
  assigneeId: string | null;
  version: number;
  commentCount: number;
}

export interface ProjectDetails extends ProjectSummary {
  ownerId: string;
  createdAt: string;
  workItems: WorkItemSummary[];
}

export interface DashboardSummary {
  projectCount: number;
  activeProjectCount: number;
  openTaskCount: number;
  completedTaskCount: number;
  dueSoonCount: number;
  apiStatus: string;
  recentActivity: { action: string; entityType: string; entityId?: string; occurredAt: string }[];
}

export interface ManagedUserSummary extends UserSummary {
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface RoleSummary {
  id: string;
  name: string;
  description: string;
  userCount: number;
}
