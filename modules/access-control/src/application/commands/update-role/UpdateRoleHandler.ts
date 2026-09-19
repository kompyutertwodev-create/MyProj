import { err, ok, type Result } from '@workspace/kernel';
import { RoleId } from '../../../domain/role/RoleId.js';
import { RoleName } from '../../../domain/role/RoleName.js';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import {
  ApplicationError,
  ConflictApplicationError,
  NotFoundApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { UpdateRoleCommand } from './UpdateRoleCommand.js';

/** Flat DTO mirroring {@link CreateRoleResult} for symmetry. */
export interface UpdateRoleResult {
  id: string;
  name: string;
  description: string;
  permissionNames: string[];
  isSystem: boolean;
  tenantId: string | null;
  updatedAt: string;
}

/**
 * Update an existing Role's name and/or description.
 *
 * The aggregate rejects no-op updates ("name is unchanged") so handlers do
 * not need to pre-diff; the error is simply surfaced to the caller.
 */
export class UpdateRoleHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    command: UpdateRoleCommand,
  ): Promise<Result<UpdateRoleResult, ApplicationError>> {
    // 1. Validate command shape.
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

    // 2. Load aggregate.
    const role = await this.uow.roles.findById(new RoleId(roleId));
    if (!role) {
      return err(
        new NotFoundApplicationError(
          `Role "${roleId}" was not found`,
          'ROLE_NOT_FOUND',
        ),
      );
    }

    // 3. Apply changes вЂ” the aggregate enforces invariants.
    if (command.name !== undefined) {
      const nameResult = RoleName.create(command.name);
      if (nameResult.isErr()) {
        return err(new ValidationApplicationError(nameResult.error.message));
      }

      // Uniqueness check excludes the role itself.
      const taken = await this.uow.roles.existsByName(
        nameResult.value.value,
        roleId,
      );
      if (taken) {
        return err(
          new ConflictApplicationError(
            `Role name "${nameResult.value.value}" is already taken`,
            'ROLE_NAME_TAKEN',
          ),
        );
      }

      const renameResult = role.rename(nameResult.value);
      if (renameResult.isErr()) {
        return err(new ValidationApplicationError(renameResult.error.message));
      }
    }

    if (command.description !== undefined) {
      const descResult = role.updateDescription(command.description);
      if (descResult.isErr()) {
        return err(new ValidationApplicationError(descResult.error.message));
      }
    }

    // 4. Persist + enqueue.
    await this.uow.withTransaction(async (tx) => {
      await tx.roles.save(role);
      await tx.outbox.enqueueAll(role.pullDomainEvents());
    });

    return ok({
      id: role.id.value,
      name: role.name.value,
      description: role.description,
      permissionNames: role.permissionNames(),
      isSystem: role.isSystem,
      tenantId: role.tenantId,
      updatedAt: role.updatedAt.toISOString(),
    });
  }
}