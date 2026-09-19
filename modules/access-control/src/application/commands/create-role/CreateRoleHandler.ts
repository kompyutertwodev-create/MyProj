import { err, ok, type Result } from '@workspace/kernel';
import { Role } from '../../../domain/role/Role.js';
import { RoleId } from '../../../domain/role/RoleId.js';
import { RoleName } from '../../../domain/role/RoleName.js';
import { Permission } from '../../../domain/permission/Permission.js';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import {
  ApplicationError,
  ConflictApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { CreateRoleCommand } from './CreateRoleCommand.js';

/**
 * Result of a successful role creation.
 *
 * Kept as a flat DTO so the presentation layer never sees the aggregate
 * itself (no accidental lazy-loading or invariant bypass).
 */
export interface CreateRoleResult {
  id: string;
  name: string;
  description: string;
  permissionNames: string[];
  isSystem: boolean;
  tenantId: string | null;
  createdAt: string;
}

/**
 * Create a new Role and persist it inside one transaction.
 *
 * Steps:
 *   1. Validate/normalize the incoming name into a {@link RoleName} VO.
 *   2. Refuse the request if a role with the same name already exists.
 *   3. Build the aggregate, applying the supplied permissions.
 *   4. Save the aggregate and enqueue its domain events to the outbox.
 */
export class CreateRoleHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    command: CreateRoleCommand,
  ): Promise<Result<CreateRoleResult, ApplicationError>> {
    // 1. Validate the command shape.
    const nameResult = RoleName.create(command.name);
    if (nameResult.isErr()) {
      return err(new ValidationApplicationError(nameResult.error.message));
    }
    const name = nameResult.value;

    const actorId = (command.actorId ?? '').trim();
    if (actorId.length === 0) {
      return err(
        new ValidationApplicationError('actorId is required', 'ACTOR_REQUIRED'),
      );
    }

    const permissionNames = normalizePermissionNames(command.permissionNames);

    // 2. Uniqueness check Р Р†Р вЂљРІР‚Сњ keep it inside the UoW so it shares the txn.
    const duplicate = await this.uow.roles.existsByName(name.value);
    if (duplicate) {
      return err(
        new ConflictApplicationError(
          `Role "${name.value}" already exists`,
          'ROLE_NAME_TAKEN',
        ),
      );
    }

    // 3. Build the aggregate.
    const permissions: Permission[] = [];
    for (const pName of permissionNames) {
      const perm = Permission.create(pName, '');
      if (perm.isErr()) {
        return err(new ValidationApplicationError(perm.error.message));
      }
      permissions.push(perm.value);
    }

    const roleId = command.roleId ? new RoleId(command.roleId) : undefined;
    const buildResult = Role.create(
      {
        name,
        description: command.description ?? '',
        permissions,
        isSystem: command.isSystem ?? false,
        tenantId: command.tenantId ?? null,
      },
      roleId,
    );
    if (buildResult.isErr()) {
      return err(new ValidationApplicationError(buildResult.error.message));
    }
    const role = buildResult.value;

    // 4. Persist + enqueue events inside a single transaction.
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
      createdAt: role.createdAt.toISOString(),
    });
  }
}

function normalizePermissionNames(input?: string[]): string[] {
  if (!input || input.length === 0) return [];
  return [...new Set(input.map((p) => p.trim()).filter((p) => p.length > 0))];
}