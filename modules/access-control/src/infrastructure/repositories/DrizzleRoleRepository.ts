import { eq, isNull, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { RoleRepository } from '../../domain/role/RoleRepository.js';
import type { Role } from '../../domain/role/Role.js';
import type { RoleId } from '../../domain/role/RoleId.js';
import { acRoles } from '../database/schema/roles.table.js';
import { acRolePermissions } from '../database/schema/role-permissions.table.js';
import { RoleMapper } from '../mappers/RoleMapper.js';

/**
 * Drizzle-backed RoleRepository.
 *
 * Reads join `ac_roles` with `ac_role_permissions` in a single query and
 * fold the rows into aggregates. Writes are two-statement: the primary row
 * is upserted, then the join rows are deleted and re-inserted so the
 * permission set can be replaced atomically.
 *
 * The `db` type is intentionally `any`: the generated Drizzle generic is
 * too narrow to accept both the main connection and a transaction client,
 * and the adapter hides it behind the domain port anyway.
 */
export class DrizzleRoleRepository implements RoleRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async findById(id: RoleId): Promise<Role | null> {
    return (await this.loadRoles(eq(acRoles.id, id.value)))[0] ?? null;
  }

  async findByName(name: string): Promise<Role | null> {
    return (await this.loadRoles(eq(acRoles.name, name)))[0] ?? null;
  }

  async findAll(): Promise<Role[]> {
    return this.loadRoles();
  }

  async findByTenant(tenantId: string | null): Promise<Role[]> {
    // Drizzle distinguishes `eq(col, null)` (which is invalid for nullable
    // columns) from `isNull(col)`. The domain interface uses `null` to mean
    // "global roles", so translate that here.
    const where: SQL<unknown> =
      tenantId === null ? isNull(acRoles.tenantId) : eq(acRoles.tenantId, tenantId);
    return this.loadRoles(where);
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: acRoles.id })
      .from(acRoles)
      .where(eq(acRoles.name, name));
    if (excludeId === undefined) return rows.length > 0;
    return rows.some((row) => row.id !== excludeId);
  }

  async save(role: Role): Promise<void> {
    const row = RoleMapper.toPersistence(role);
    const permissionRows = RoleMapper.toPermissionRows(role);

    await this.db
      .insert(acRoles)
      .values(row)
      .onConflictDoUpdate({
        target: acRoles.id,
        set: {
          name: row.name,
          description: row.description,
          isSystem: row.isSystem,
          tenantId: row.tenantId,
          updatedAt: row.updatedAt,
          version: row.version,
        },
      });

    // Replace the permission set in full: simpler than diffing and safe
    // because the aggregate already enforces idempotency on its side.
    await this.db
      .delete(acRolePermissions)
      .where(eq(acRolePermissions.roleId, role.id.value));

    if (permissionRows.length > 0) {
      await this.db.insert(acRolePermissions).values(permissionRows);
    }
  }

  async delete(id: RoleId): Promise<void> {
    // Cascade on ac_role_permissions handles the join rows.
    await this.db.delete(acRoles).where(eq(acRoles.id, id.value));
  }

  // в”Ђв”Ђ internal в”Ђв”Ђ

  private async loadRoles(where?: SQL<unknown>): Promise<Role[]> {
    const rows = await this.db
      .select({
        id: acRoles.id,
        name: acRoles.name,
        description: acRoles.description,
        isSystem: acRoles.isSystem,
        tenantId: acRoles.tenantId,
        createdAt: acRoles.createdAt,
        updatedAt: acRoles.updatedAt,
        version: acRoles.version,
        permissionName: acRolePermissions.permissionName,
        permissionDescription: acRolePermissions.description,
      })
      .from(acRoles)
      .leftJoin(
        acRolePermissions,
        eq(acRolePermissions.roleId, acRoles.id),
      )
      .where(where);

    const roleMap = new Map<
      string,
      {
        row: {
          id: string;
          name: string;
          description: string;
          isSystem: boolean;
          tenantId: string | null;
          createdAt: Date;
          updatedAt: Date;
          version: number;
        };
        permissionRows: Array<{
          roleId: string;
          permissionName: string;
          description: string;
          grantedAt: Date;
        }>;
      }
    >();

    for (const row of rows) {
      const entry = roleMap.get(row.id) ?? {
        row: {
          id: row.id,
          name: row.name,
          description: row.description,
          isSystem: row.isSystem,
          tenantId: row.tenantId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          version: row.version,
        },
        permissionRows: [],
      };
      if (row.permissionName) {
        entry.permissionRows.push({
          roleId: row.id,
          permissionName: row.permissionName,
          description: row.permissionDescription ?? '',
          grantedAt: row.updatedAt,
        });
      }
      roleMap.set(row.id, entry);
    }

    return [...roleMap.values()].map((entry) => RoleMapper.toDomain(entry));
  }
}