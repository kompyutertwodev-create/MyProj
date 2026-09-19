import type { AccessControlUnitOfWork } from '../../../application/ports/AccessControlUnitOfWork.js';
import { Role } from '../../../domain/role/Role.js';
import { RoleId } from '../../../domain/role/RoleId.js';
import { RoleName } from '../../../domain/role/RoleName.js';
import { Permission } from '../../../domain/permission/Permission.js';
import { SEED_ROLES, type SeedRoleDefinition } from './roles.seed.js';

/**
 * Seeder for the default RBAC configuration.
 *
 * Idempotent: re-running the seed leaves existing roles untouched and
 * creates only the ones that are missing. This makes it safe to call on
 * every application boot.
 *
 * System roles are created with `isSystem: true`, which the aggregate
 * enforces by refusing renames, permission mutations and deletion. The
 * seed therefore never *updates* a system role; if you need to change its
 * permissions, edit `roles.seed.ts` and add an explicit migration step.
 */
export class RbacSeeder {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async run(): Promise<{ created: string[]; skipped: string[] }> {
    const created: string[] = [];
    const skipped: string[] = [];

    for (const def of SEED_ROLES) {
      const existing = await this.uow.roles.findById(new RoleId(def.id));
      if (existing) {
        skipped.push(def.name);
        continue;
      }
      await this.createRole(def);
      created.push(def.name);
    }

    return { created, skipped };
  }

  private async createRole(def: SeedRoleDefinition): Promise<void> {
    const nameResult = RoleName.create(def.name);
    if (nameResult.isErr()) {
      throw new Error(
        `RBAC seed: invalid role name "${def.name}" вЂ” ${nameResult.error.message}`,
      );
    }

    const permissions: Permission[] = [];
    for (const pName of def.permissionNames) {
      const perm = Permission.create(pName, '');
      if (perm.isErr()) {
        throw new Error(
          `RBAC seed: invalid permission "${pName}" вЂ” ${perm.error.message}`,
        );
      }
      permissions.push(perm.value);
    }

    const result = Role.create(
      {
        name: nameResult.value,
        description: def.description,
        permissions,
        isSystem: def.isSystem,
        tenantId: null,
      },
      new RoleId(def.id),
    );
    if (result.isErr()) {
      throw new Error(
        `RBAC seed: failed to build role "${def.name}" вЂ” ${result.error.message}`,
      );
    }
    const role = result.value;

    await this.uow.withTransaction(async (tx) => {
      await tx.roles.save(role);
      await tx.outbox.enqueueAll(role.pullDomainEvents());
    });
  }
}