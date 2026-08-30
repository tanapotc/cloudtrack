/* tslint:disable */
/* eslint-disable */
import { ProjectStatus } from '../models/project-status';
export interface ProjectSummary {
  completedTaskCount: number;
  description: string;
  id: string;
  memberCount: number;
  name: string;
  status: ProjectStatus;
  taskCount: number;
  updatedAt: string;
  version: number;
}
