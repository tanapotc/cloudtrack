/* tslint:disable */
/* eslint-disable */
import { ProjectStatus } from '../models/project-status';
export interface UpdateProjectRequest {
  description: string;
  name: string;
  status: ProjectStatus;
  version: number;
}
