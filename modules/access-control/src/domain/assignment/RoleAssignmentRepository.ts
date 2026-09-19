import type { Repository } from '@workspace/kernel';
import type { RoleAssignment } from './RoleAssignment.js';
import type { RoleAssignmentId } from './RoleAssignmentId.js';

/**
 * Repository contract for the {@link RoleAssignment} aggregate.
 *
 * Query methods are intentionally narrow: the RBAC read path needs "give me
 * every active role for this user", while admin flows need paginated views
 * per user / role / tenant. Soft-deleted (revoked) and expired rows are
 * excluded by default and can be included via `includeInactive`.
 */
export interface RoleAssignmentRepository
  extends Repository<RoleAssignment, RoleAssignmentId> {
  /** Every role assignment for a subject, newest first. */
  findByUserId(
    userId: string,
    options?: { includeInactive?: boolean },
  ): Promise<RoleAssignment[]>;

  /** Every assignment of a given role, newest first. */
  findByRoleId(
    roleId: string,
    options?: { includeInactive?: boolean },
  ): Promise<RoleAssignment[]>;

  /** Assignments scoped to a tenant (null = global / system assignments). */
  findByTenant(
    tenantId: string | null,
    options?: { includeInactive?: boolean },
  ): Promise<RoleAssignment[]>;

  /**
   * Fast membership check вЂ” true when the user currently holds the named
   * role (not revoked, not expired). Used by the authorization hot path.
   */
  hasActiveRole(userId: string, roleName: string): Promise<boolean>;

  /**
   * True when an active assignment for (userId, roleId) already exists.
   * Used by the assign-role handler to avoid duplicate grants.
   */
  hasActiveAssignment(userId: string, roleId: string): Promise<boolean>;
}