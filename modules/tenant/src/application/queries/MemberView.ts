import type { MemberRole, MemberStatus } from '../../domain/index.js';

/**
 * Read-model DTO for a Member.
 */
export interface MemberView {
  id: string;
  tenantId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  invitedBy: string | null;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
