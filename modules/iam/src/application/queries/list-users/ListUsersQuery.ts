import type { UserStatus } from '../../../domain/UserStatus.js';

export interface ListUsersQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: UserStatus;
  roleFilter?: string;
}
