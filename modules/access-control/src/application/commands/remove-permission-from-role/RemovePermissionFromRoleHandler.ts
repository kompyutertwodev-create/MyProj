import { err, ok, type Result } from '@workspace/kernel';
import { RoleId } from '../../../domain/role/RoleId.js';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import {
  ApplicationError,
  NotFoundApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { RemovePermissionFromRoleCommand } from './RemovePermissionFromRoleCommand.js';

/** Flat DTO summarising the resulting permission set. */
export interface RemovePermissionFromRoleResult {
  roleId: string;
  permissionNames: string[];
  updatedAt: string;
}

/**
 * Revoke a single permission from a role.
 *
 * Missing permissions are treated as an error so callers cannot silently
 * drift from the intended state; system roles reject the operation outright.
 */
export class RemovePermissionFromRoleHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    command: RemovePermissionFromRoleCommand,
  ): Promise<Result<RemovePermissionFromRoleResult, ApplicationError>> {
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

    const permissionName = (command.permissionName ?? '').trim();
    if (permissionName.length === 0) {
      return err(
        new ValidationApplicationError(
          'permissionName is required',
          'PERMISSION_NAME_REQUIRED',
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

    const removeResult = role.removePermission(permissionName);
    if (removeResult.isErr()) {
      return err(new ValidationApplicationError(removeResult.error.message));
    }

    await this.uow.withTransaction(async (tx) => {
      await tx.roles.save(role);
      await tx.outbox.enqueueAll(role.pullDomainEvents());
    });

    return ok({
      roleId: role.id.value,
      permissionNames: role.permissionNames(),
      updatedAt: role.updatedAt.toISOString(),
    });
  }
}