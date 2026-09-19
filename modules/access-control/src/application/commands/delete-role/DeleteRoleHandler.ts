import { err, ok, type Result } from '@workspace/kernel';
import { RoleId } from '../../../domain/role/RoleId.js';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import {
  ApplicationError,
  NotFoundApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { DeleteRoleCommand } from './DeleteRoleCommand.js';

/** Result of a successful delete. */
export interface DeleteRoleResult {
  id: string;
  deleted: true;
}

/**
 * Delete a Role.
 *
 * The aggregate enforces that system roles cannot be deleted and emits a
 * {@link RoleDeletedEvent} so downstream consumers can react before the
 * repository removes the row (hard delete).
 */
export class DeleteRoleHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    command: DeleteRoleCommand,
  ): Promise<Result<DeleteRoleResult, ApplicationError>> {
    const roleId = (command.roleId ?? '').trim();
    if (roleId.length === 0) {
      return err(
        new ValidationApplicationError('roleId is required', 'ROLE_ID_REQUIRED'),
      );
    }

    const actorId = (command.actorId ?? '').trim();
    if (actorId.length === 0) {
      return err(
        new ValidationApplicationError('actorId is required', 'ACTOR_REQUIRED'),
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

    const deleteResult = role.delete(actorId);
    if (deleteResult.isErr()) {
      return err(new ValidationApplicationError(deleteResult.error.message));
    }

    await this.uow.withTransaction(async (tx) => {
      await tx.roles.delete(role.id);
      await tx.outbox.enqueueAll(role.pullDomainEvents());
    });

    return ok({ id: role.id.value, deleted: true });
  }
}