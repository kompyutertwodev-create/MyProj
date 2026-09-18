import { Permission, Role, RoleId, RoleName } from '../../domain/index.js';

export interface RolePersistence {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions?: Array<{ name: string; description: string }>;
}

export class RoleMapper {
  static toDomain(row: RolePersistence): Role {
    const name = RoleName.create(row.name);
    if (name.isErr()) throw name.error;
    const permissions = (row.permissions ?? []).map((p) => {
      const permission = Permission.create(p.name, p.description);
      if (permission.isErr()) throw permission.error;
      return permission.value;
    });
    return Role.create(new RoleId(row.id), {
      name: name.value,
      description: row.description,
      permissions,
      isSystem: row.isSystem,
    });
  }

  static toPersistence(role: Role): RolePersistence {
    return {
      id: role.id.value,
      name: role.name.value,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map((p) => ({
        name: p.name,
        description: p.description,
      })),
    };
  }
}
