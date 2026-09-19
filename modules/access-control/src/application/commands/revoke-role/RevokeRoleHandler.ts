import { err, ok, type Result } from '@workspace/kernel';
import { RoleAssignmentId } from '../../../domain/assignment/RoleAssignmentId.js';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import {
  ApplicationError,
  NotFoundApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { RevokeRoleCommand } from './RevokeRoleCommand.js';

/** Result of a successful revocation. */
export interface RevokeRoleResult {
  assignmentId: string;
  revokedAt: string;
  revokedBy: string;
  reason: string | null;
}

/**
 * Revoke a role assignment.
 *
 * The aggregate rejects double revocation and missing actor; validation
 * errors are surfaced unchanged.
 */
export class RevokeRoleHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    command: RevokeRoleCommand,
  ): Promise<Result<RevokeRoleResult, ApplicationError>> {
    const assignmentId = (command.assignmentId ?? '').trim();
    if (assignmentId.length === 0) {
      return err(
        new ValidationApplicationError(
          'assignmentId is required',
          'ASSIGNMENT_ID_REQUIRED',
        ),
      );
    }

    const revokedBy = (command.revokedBy ?? '').trim();
    if (revokedBy.length === 0) {
      return err(
        new ValidationApplicationError(
          'revokedBy is required',
          'REVOKED_BY_REQUIRED',
        ),
      );
    }

    const assignment = await this.uow.roleAssignments.findById(
      new RoleAssignmentId(assignmentId),
    );
    if (!assignment) {
      return err(
        new NotFoundApplicationError(
          `RoleAssignment "${assignmentId}" was not found`,
          'ASSIGNMENT_NOT_FOUND',
        ),
      );
    }

    const revokeResult = assignment.revoke(revokedBy, command.reason);
    if (revokeResult.isErr()) {
      return err(new ValidationApplicationError(revokeResult.error.message));
    }

    await this.uow.withTransaction(async (tx) => {
      await tx.roleAssignments.save(assignment);
      await tx.outbox.enqueueAll(assignment.pullDomainEvents());
    });

    return ok({
      assignmentId: assignment.id.value,
      revokedAt: assignment.revokedAt!.toISOString(),
      revokedBy: assignment.revokedBy!,
      reason: assignment.revokedReason,
    });
  }
}