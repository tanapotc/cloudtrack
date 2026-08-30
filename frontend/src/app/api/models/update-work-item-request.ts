/* tslint:disable */
/* eslint-disable */
import { WorkItemPriority } from '../models/work-item-priority';
import { WorkItemStatus } from '../models/work-item-status';
export interface UpdateWorkItemRequest {
  assigneeId?: string | null;
  description: string;
  dueDate?: string | null;
  priority: WorkItemPriority;
  status: WorkItemStatus;
  title: string;
  version: number;
}
