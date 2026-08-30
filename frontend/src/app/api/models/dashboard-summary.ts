/* tslint:disable */
/* eslint-disable */
import { ActivitySummary } from '../models/activity-summary';
export interface DashboardSummary {
  activeProjectCount: number;
  apiStatus: string;
  completedTaskCount: number;
  databaseStatus: string;
  dueSoonCount: number;
  generatedAt: string;
  loginCountToday: number;
  openTaskCount: number;
  projectCount: number;
  recentActivity: Array<ActivitySummary>;
  totalUserCount: number;
}
