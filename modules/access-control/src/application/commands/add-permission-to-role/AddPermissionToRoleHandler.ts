import { err, ok, type Result } from '@workspace/kernel';
import { RoleId } from '../../../domain/role/RoleId.js';
import { Permission } from '../../../domain/permission/Permission.js';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import {
  ApplicationError,
  NotFoundApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { AddPermissionToRoleCommand } from './AddPermissionToRoleCommand.js';

/** Flat DTO summarising the resulting permission set. */
export interface AddPermissionToRoleResult {
  roleId: string;
  permissionNames: string[];
  updatedAt: string;
}

/**
 * Grant a single permission to a role.
 *
 * The Permission is constructed from the command's name; the aggregate
 * rejects duplicates and mutations on system roles.
 */
export class AddPermissionToRoleHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    command: AddPermissionToRoleCommand,
  ): Promise<Result<AddPermissionToRoleResult, ApplicationError>> {
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

    const permissionResult = Permission.create(
      command.permissionName,
      command.permissionDescription ?? '',
    );
    if (permissionResult.isErr()) {
      return err(new ValidationApplicationError(permissionResult.error.message));
    }
    const permission = permissionResult.value;

    const role = await this.uow.roles.findById(new RoleId(roleId));
    if (!role) {
      return err(
        new NotFoundApplicationError(
          `Role "${roleId}" was not found`,
          'ROLE_NOT_FOUND',
        ),
      );
    }

    const addResult = role.addPermission(permission);
    if (addResult.isErr()) {
      return err(new ValidationApplicationError(addResult.error.message));
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