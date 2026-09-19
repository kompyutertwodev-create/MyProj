import { err, ok, type Result } from '@workspace/kernel';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import {
  ApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { ListRoleAssignmentsQuery } from './ListRoleAssignmentsQuery.js';

/** Flat read model describing one subject's hold on a role. */
export interface RoleAssignmentItem {
  assignmentId: string;
  userId: string;
  tenantId: string | null;
  assignedBy: string;
  assignedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  isActive: boolean;
}

/** Response for {@link ListRoleAssignmentsHandler}. */
export interface ListRoleAssignmentsResult {
  roleId: string;
  items: RoleAssignmentItem[];
  total: number;
}

/**
 * List every subject that currently holds (or held) a given role.
 */
export class ListRoleAssignmentsHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    query: ListRoleAssignmentsQuery,
  ): Promise<Result<ListRoleAssignmentsResult, ApplicationError>> {
    const roleId = (query.roleId ?? '').trim();
    if (roleId.length === 0) {
      return err(
        new ValidationApplicationError('roleId is required', 'ROLE_ID_REQUIRED'),
      );
    }

    const assignments = await this.uow.roleAssignments.findByRoleId(roleId, {
      includeInactive: query.includeInactive ?? false,
    });

    const now = new Date();
    const items: RoleAssignmentItem[] = assignments.map((a) => ({
      assignmentId: a.id.value,
      userId: a.userId,
      tenantId: a.tenantId,
      assignedBy: a.assignedBy,
      assignedAt: a.assignedAt.toISOString(),
      expiresAt: a.expiresAt?.toISOString() ?? null,
      revokedAt: a.revokedAt?.toISOString() ?? null,
      isActive: a.isActive(now),
    }));

    return ok({ roleId, items, total: items.length });
  }
}