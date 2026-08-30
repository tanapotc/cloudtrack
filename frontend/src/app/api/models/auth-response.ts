/* tslint:disable */
/* eslint-disable */
import { UserSummary } from '../models/user-summary';
export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: UserSummary;
}
