/* tslint:disable */
/* eslint-disable */
import { ProjectSummary } from '../models/project-summary';
export interface ProjectSummaryPagedResult {
  items: Array<ProjectSummary>;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
