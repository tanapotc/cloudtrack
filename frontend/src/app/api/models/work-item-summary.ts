/* tslint:disable */
/* eslint-disable */
import { WorkItemPriority } from '../models/work-item-priority';
import { WorkItemStatus } from '../models/work-item-status';
export interface WorkItemSummary {
  assigneeId?: string | null;
  commentCount: number;
  description: string;
  dueDate?: string | null;
  id: string;
  priority: WorkItemPriority;
  status: WorkItemStatus;
  title: string;
  version: number;
}
