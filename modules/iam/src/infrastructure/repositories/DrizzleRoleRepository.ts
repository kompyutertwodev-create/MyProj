import { eq, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { RoleRepository } from '../../domain/repositories/RoleRepository.js';
import type { Role } from '../../domain/Role.js';
import { roles } from '../database/schema/roles.table.js';
import { rolePermissions } from '../database/schema/role-permissions.table.js';
import { permissions } from '../database/schema/permissions.table.js';
import { RoleMapper } from '../mappers/RoleMapper.js';

export class DrizzleRoleRepository implements RoleRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async findById(id: string): Promise<Role | null> {
    return (await this.loadRoles(eq(roles.id, id)))[0] ?? null;
  }

  async findByName(name: string): Promise<Role | null> {
    return (await this.loadRoles(eq(roles.name, name)))[0] ?? null;
  }

  async findAll(): Promise<Role[]> {
    return this.loadRoles();
  }

  async save(role: Role): Promise<void> {
    const row = RoleMapper.toPersistence(role);
    await this.db
      .insert(roles)
      .values({
        id: row.id,
        name: row.name,
        description: row.description,
        isSystem: row.isSystem,
      })
      .onConflictDoUpdate({
        target: roles.id,
        set: { name: row.name, description: row.description, isSystem: row.isSystem },
      });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(roles).where(eq(roles.id, id));
  }

  private async loadRoles(where?: SQL<unknown>): Promise<Role[]> {
    const rows = await this.db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isSystem: roles.isSystem,
        permissionName: permissions.name,
        permissionDescription: permissions.description,
      })
      .from(roles)
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(where);

    const roleMap = new Map<
      string,
      {
        id: string;
        name: string;
        description: string;
        isSystem: boolean;
        permissions: Array<{ name: string; description: string }>;
      }
    >();

    for (const row of rows) {
      const role = roleMap.get(row.id) ?? {
        id: row.id,
        name: row.name,
        description: row.description,
        isSystem: row.isSystem,
        permissions: [],
      };
      if (row.permissionName) {
        role.permissions.push({
          name: row.permissionName,
          description: row.permissionDescription ?? '',
        });
      }
      roleMap.set(row.id, role);
    }

    return [...roleMap.values()].map((role) => RoleMapper.toDomain(role));
  }
}
