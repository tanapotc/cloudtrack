/* tslint:disable */
/* eslint-disable */
import { ProjectMemberSummary } from '../models/project-member-summary';
import { ProjectStatus } from '../models/project-status';
import { WorkItemSummary } from '../models/work-item-summary';
export interface ProjectDetails {
  createdAt: string;
  description: string;
  id: string;
  members: Array<ProjectMemberSummary>;
  name: string;
  ownerId: string;
  status: ProjectStatus;
  updatedAt: string;
  version: number;
  workItems: Array<WorkItemSummary>;
}
