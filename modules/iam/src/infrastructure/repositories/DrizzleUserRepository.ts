import { eq, ilike, and, count, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { UserRepository, UserFilters } from '../../domain/repositories/UserRepository.js';
import type { User } from '../../domain/User.js';
import type { PaginationParams, PaginatedResult } from '@workspace/kernel';
import { identities } from '../database/schema/identities.table.js';
import { identityRoles } from '../database/schema/identity-roles.table.js';
import { roles } from '../database/schema/roles.table.js';
import { rolePermissions } from '../database/schema/role-permissions.table.js';
import { permissions } from '../database/schema/permissions.table.js';
import { UserMapper } from '../mappers/UserMapper.js';
import { RoleMapper, type RolePersistence } from '../mappers/RoleMapper.js';

export class DrizzleUserRepository implements UserRepository {
  // The generated Drizzle database type varies by schema setup; the adapter keeps it behind this port.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.select().from(identities).where(eq(identities.id, id)).limit(1);
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(identities)
      .where(eq(identities.email, email))
      .limit(1);
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async findAll(
    filters: UserFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<User>> {
    const conditions: SQL<unknown>[] = [];
    if (filters.search) conditions.push(ilike(identities.displayName, `%${filters.search}%`));
    if (filters.status)
      conditions.push(
        eq(identities.status, filters.status as 'active' | 'suspended' | 'unverified' | 'deleted')
      );
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await this.db
      .select()
      .from(identities)
      .where(where)
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize);
    const totalRows = await this.db.select({ count: count() }).from(identities).where(where);
    const total = Number(totalRows[0]?.count ?? 0);
    const totalPages = Math.ceil(total / pagination.pageSize);
    return {
      items: await Promise.all(rows.map((r) => this.toDomain(r))),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1,
    };
  }

  async save(user: User): Promise<void> {
    const row = UserMapper.toPersistence(user);
    const values = {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      passwordSet: row.passwordSet,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      status: row.status as 'active' | 'suspended' | 'unverified' | 'deleted',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    await this.db
      .insert(identities)
      .values(values)
      .onConflictDoUpdate({
        target: identities.id,
        set: {
          email: row.email,
          passwordHash: row.passwordHash,
          passwordSet: row.passwordSet,
          displayName: row.displayName,
          avatarUrl: row.avatarUrl,
          status: values.status,
          updatedAt: row.updatedAt,
        },
      });
  }

  async assignRole(userId: string, role: import('../../domain/Role.js').Role): Promise<void> {
    await this.db
      .insert(identityRoles)
      .values({
        identityId: userId,
        roleId: role.id.value,
      })
      .onConflictDoNothing();
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(identities).where(eq(identities.id, id));
  }

  async exists(email: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: identities.id })
      .from(identities)
      .where(eq(identities.email, email))
      .limit(1);
    return rows.length > 0;
  }

  private async toDomain(row: typeof identities.$inferSelect): Promise<User> {
    const relationRows = await this.db
      .select({
        roleId: roles.id,
        roleName: roles.name,
        roleDescription: roles.description,
        roleIsSystem: roles.isSystem,
        permissionName: permissions.name,
        permissionDescription: permissions.description,
      })
      .from(identityRoles)
      .innerJoin(roles, eq(identityRoles.roleId, roles.id))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(identityRoles.identityId, row.id));

    const roleMap = new Map<string, RolePersistence>();
    for (const relation of relationRows) {
      const existing = roleMap.get(relation.roleId) ?? {
        id: relation.roleId,
        name: relation.roleName,
        description: relation.roleDescription,
        isSystem: relation.roleIsSystem,
        permissions: [],
      };
      if (relation.permissionName) {
        existing.permissions?.push({
          name: relation.permissionName,
          description: relation.permissionDescription ?? '',
        });
      }
      roleMap.set(relation.roleId, existing);
    }

    return UserMapper.toDomain(
      row,
      [...roleMap.values()].map((role) => RoleMapper.toDomain(role))
    );
  }
}
