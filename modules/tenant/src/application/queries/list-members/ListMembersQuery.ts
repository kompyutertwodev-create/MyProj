import type { MemberRole, MemberStatus } from '../../../domain/index.js';

export interface ListMembersQuery {
  tenantId: string;
  page: number;
  pageSize: number;
  role?: MemberRole;
  status?: MemberStatus;
}
