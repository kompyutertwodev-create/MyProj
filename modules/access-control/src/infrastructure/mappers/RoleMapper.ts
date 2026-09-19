import { Role } from '../../domain/role/Role.js';
import { RoleId } from '../../domain/role/RoleId.js';
import { RoleName } from '../../domain/role/RoleName.js';
import { Permission } from '../../domain/permission/Permission.js';
import type { AcRoleRow, AcRolePermissionRow } from '../database/schema/index.js';

/**
 * Persistence representation of a Role.
 *
 * The role row and its permission rows travel together: the aggregate
 * cannot exist without its permission set, so the mapper always asks for
 * both halves rather than relying on lazy loading.
 */
export interface RolePersistence {
  row: AcRoleRow;
  permissionRows: AcRolePermissionRow[];
}

/**
 * RoleMapper вЂ” converts between the Role aggregate and its two persistence
 * rows (ac_roles + ac_role_permissions).
 *
 * `toDomain` throws if any value object rejects its stored value вЂ” that
 * indicates a data-integrity problem the caller must handle (log + alert),
 * not a user error.
 */
export class RoleMapper {
  static toDomain(input: RolePersistence): Role {
    const nameResult = RoleName.create(input.row.name);
    if (nameResult.isErr()) {
      throw nameResult.error;
    }

    const permissions: Permission[] = [];
    for (const pRow of input.permissionRows) {
      const pResult = Permission.create(pRow.permissionName, pRow.description);
      if (pResult.isErr()) {
        throw pResult.error;
      }
      permissions.push(pResult.value);
    }

    return Role.reconstruct({
      id: new RoleId(input.row.id),
      name: nameResult.value,
      description: input.row.description,
      permissions,
      isSystem: input.row.isSystem,
      tenantId: input.row.tenantId,
      createdAt: input.row.createdAt,
      updatedAt: input.row.updatedAt,
      version: input.row.version,
    });
  }

  /**
   * Produce the primary row for `ac_roles`. Permission rows are produced
   * separately via {@link toPermissionRows} because they are written in a
   * second statement (delete-then-insert).
   */
  static toPersistence(role: Role): AcRoleRow {
    return {
      id: role.id.value,
      name: role.name.value,
      description: role.description,
      isSystem: role.isSystem,
      tenantId: role.tenantId,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      version: role.version,
    };
  }

  /** Produce the join rows for `ac_role_permissions`. */
  static toPermissionRows(role: Role): AcRolePermissionRow[] {
    const now = new Date();
    return role.permissions.map((p) => ({
      roleId: role.id.value,
      permissionName: p.name,
      description: p.description,
      grantedAt: now,
    }));
  }
}