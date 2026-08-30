/* tslint:disable */
/* eslint-disable */
import { WorkItemPriority } from '../models/work-item-priority';
export interface CreateWorkItemRequest {
  description: string;
  dueDate?: string | null;
  priority: WorkItemPriority;
  title: string;
}
