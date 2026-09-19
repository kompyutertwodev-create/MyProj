import { err, ok, type Result } from '@workspace/kernel';
import { RoleAssignment } from '../../../domain/assignment/RoleAssignment.js';
import { RoleId } from '../../../domain/role/RoleId.js';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import {
  ApplicationError,
  ConflictApplicationError,
  NotFoundApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { AssignRoleCommand } from './AssignRoleCommand.js';

/** Result of a successful assignment. */
export interface AssignRoleResult {
  assignmentId: string;
  userId: string;
  roleId: string;
  roleName: string;
  tenantId: string | null;
  assignedAt: string;
  expiresAt: string | null;
}

/**
 * Grant a role to a subject.
 *
 * Steps:
 *   1. Validate command shape (ids, actor).
 *   2. Load the Role to confirm it exists and capture its name for the
 *      denormalized RoleAssignment.roleName field.
 *   3. Refuse duplicates via `hasActiveAssignment`.
 *   4. Build the aggregate, save it, and enqueue its domain events.
 */
export class AssignRoleHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    command: AssignRoleCommand,
  ): Promise<Result<AssignRoleResult, ApplicationError>> {
    const userId = (command.userId ?? '').trim();
    if (userId.length === 0) {
      return err(
        new ValidationApplicationError('userId is required', 'USER_ID_REQUIRED'),
      );
    }

    const roleId = (command.roleId ?? '').trim();
    if (roleId.length === 0) {
      return err(
        new ValidationApplicationError('roleId is required', 'ROLE_ID_REQUIRED'),
      );
    }

    const assignedBy = (command.assignedBy ?? '').trim();
    if (assignedBy.length === 0) {
      return err(
        new ValidationApplicationError(
          'assignedBy is required',
          'ASSIGNED_BY_REQUIRED',
        ),
      );
    }

    const role = await this.uow.roles.findById(new RoleId(roleId));
    if (!role) {
      return err(
        new NotFoundApplicationError(
          `Role "${roleId}" was not found`,
          'ROLE_NOT_FOUND',
        ),
      );
    }

    const already = await this.uow.roleAssignments.hasActiveAssignment(
      userId,
      roleId,
    );
    if (already) {
      return err(
        new ConflictApplicationError(
          `User "${userId}" already has role "${role.name.value}"`,
          'ROLE_ALREADY_ASSIGNED',
        ),
      );
    }

    const buildResult = RoleAssignment.create({
      userId,
      roleId: role.id.value,
      roleName: role.name.value,
      assignedBy,
      tenantId: command.tenantId ?? role.tenantId,
      expiresAt: command.expiresAt ?? null,
    });
    if (buildResult.isErr()) {
      return err(new ValidationApplicationError(buildResult.error.message));
    }
    const assignment = buildResult.value;

    await this.uow.withTransaction(async (tx) => {
      await tx.roleAssignments.save(assignment);
      await tx.outbox.enqueueAll(assignment.pullDomainEvents());
    });

    return ok({
      assignmentId: assignment.id.value,
      userId: assignment.userId,
      roleId: assignment.roleId,
      roleName: assignment.roleName,
      tenantId: assignment.tenantId,
      assignedAt: assignment.assignedAt.toISOString(),
      expiresAt: assignment.expiresAt?.toISOString() ?? null,
    });
  }
}