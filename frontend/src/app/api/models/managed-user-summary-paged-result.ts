/* tslint:disable */
/* eslint-disable */
import { ManagedUserSummary } from '../models/managed-user-summary';
export interface ManagedUserSummaryPagedResult {
  items: Array<ManagedUserSummary>;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
