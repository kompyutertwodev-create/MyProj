import type { TenantStatus } from '../../../domain/TenantStatus.js';

export interface ListTenantsQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: TenantStatus;
}
