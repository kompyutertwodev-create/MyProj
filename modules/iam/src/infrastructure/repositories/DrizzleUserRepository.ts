import { and, count, eq, ilike, isNull, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  UserRepository,
  UserFilters,
} from '../../domain/repositories/UserRepository.js';
import type { User } from '../../domain/User.js';
import type { PaginationParams, PaginatedResult } from '@workspace/kernel';
import { identities } from '../database/schema/identities.table.js';
import { UserMapper } from '../mappers/UserMapper.js';

/**
 * Drizzle-backed UserRepository.
 *
 * Reads a single `identities` row and maps it to the User aggregate вЂ” no
 * joins, because RBAC lives in a different module (access-control) with
 * its own tables. Soft-deleted rows are excluded by default and can be
 * included via `filters.includeDeleted`.
 */
export class DrizzleUserRepository implements UserRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async findById(id: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(identities)
      .where(eq(identities.id, id))
      .limit(1);
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
    pagination: PaginationParams,
  ): Promise<PaginatedResult<User>> {
    const conditions: SQL<unknown>[] = [];

    if (!filters.includeDeleted) {
      conditions.push(isNull(identities.deletedAt));
    }
    if (filters.tenantId) {
      conditions.push(eq(identities.tenantId, filters.tenantId));
    }
    if (filters.search) {
      conditions.push(ilike(identities.displayName, `%${filters.search}%`));
    }
    if (filters.status) {
      conditions.push(
        eq(
          identities.status,
          filters.status as 'active' | 'suspended' | 'unverified' | 'deleted',
        ),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(identities)
      .where(where)
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize);

    const totalRows = await this.db
      .select({ count: count() })
      .from(identities)
      .where(where);
    const total = Number(totalRows[0]?.count ?? 0);
    const totalPages = Math.ceil(total / pagination.pageSize);

    return {
      items: rows.map((r) => this.toDomain(r)),
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
    const status = row.status as 'active' | 'suspended' | 'unverified' | 'deleted';
    await this.db
      .insert(identities)
      .values({
        id: row.id,
        email: row.email,
        passwordHash: row.passwordHash,
        passwordSet: row.passwordSet,
        displayName: row.displayName,
        avatarUrl: row.avatarUrl,
        status,
        tenantId: row.tenantId,
        deletedAt: row.deletedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        version: row.version,
      })
      .onConflictDoUpdate({
        target: identities.id,
        set: {
          email: row.email,
          passwordHash: row.passwordHash,
          passwordSet: row.passwordSet,
          displayName: row.displayName,
          avatarUrl: row.avatarUrl,
          status,
          tenantId: row.tenantId,
          deletedAt: row.deletedAt,
          updatedAt: row.updatedAt,
          version: row.version,
        },
      });
  }

  async delete(id: string): Promise<void> {
    // Hard delete вЂ” callers that need soft delete should set `deletedAt`
    // through the aggregate and call `save` instead.
    await this.db.delete(identities).where(eq(identities.id, id));
  }

  async exists(email: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: identities.id })
      .from(identities)
      .where(and(eq(identities.email, email), isNull(identities.deletedAt)))
      .limit(1);
    return rows.length > 0;
  }

  private toDomain(row: typeof identities.$inferSelect): User {
    return UserMapper.toDomain({
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      passwordSet: row.passwordSet,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      status: row.status,
      tenantId: row.tenantId,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    });
  }
}