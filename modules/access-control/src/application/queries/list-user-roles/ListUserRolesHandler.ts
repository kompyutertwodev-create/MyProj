import { err, ok, type Result } from '@workspace/kernel';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import {
  ApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { ListUserRolesQuery } from './ListUserRolesQuery.js';

/** Flat read model for a role held by a user. */
export interface UserRoleItem {
  assignmentId: string;
  roleId: string;
  roleName: string;
  tenantId: string | null;
  assignedBy: string;
  assignedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  isActive: boolean;
}

/** Response for {@link ListUserRolesHandler}. */
export interface ListUserRolesResult {
  userId: string;
  items: UserRoleItem[];
  total: number;
}

/**
 * Return every role held by a subject.
 *
 * The repository already filters by user; the handler only projects to a
 * flat DTO and (when `includeInactive` is false) drops rows that are
 * currently inactive using the aggregate predicate `isActive()`.
 */
export class ListUserRolesHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    query: ListUserRolesQuery,
  ): Promise<Result<ListUserRolesResult, ApplicationError>> {
    const userId = (query.userId ?? '').trim();
    if (userId.length === 0) {
      return err(
        new ValidationApplicationError('userId is required', 'USER_ID_REQUIRED'),
      );
    }

    const assignments = await this.uow.roleAssignments.findByUserId(userId, {
      includeInactive: query.includeInactive ?? false,
    });

    const now = new Date();
    const items: UserRoleItem[] = assignments.map((a) => ({
      assignmentId: a.id.value,
      roleId: a.roleId,
      roleName: a.roleName,
      tenantId: a.tenantId,
      assignedBy: a.assignedBy,
      assignedAt: a.assignedAt.toISOString(),
      expiresAt: a.expiresAt?.toISOString() ?? null,
      revokedAt: a.revokedAt?.toISOString() ?? null,
      isActive: a.isActive(now),
    }));

    return ok({ userId, items, total: items.length });
  }
}