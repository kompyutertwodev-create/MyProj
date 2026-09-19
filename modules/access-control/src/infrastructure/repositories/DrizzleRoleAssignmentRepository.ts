import { and, eq, gt, isNull, or, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { RoleAssignmentRepository } from '../../domain/assignment/RoleAssignmentRepository.js';
import type { RoleAssignment } from '../../domain/assignment/RoleAssignment.js';
import type { RoleAssignmentId } from '../../domain/assignment/RoleAssignmentId.js';
import { acRoleAssignments } from '../database/schema/role-assignments.table.js';
import { RoleAssignmentMapper } from '../mappers/RoleAssignmentMapper.js';

interface ListOptions {
  includeInactive?: boolean;
}

/**
 * Drizzle-backed RoleAssignmentRepository.
 *
 * Single-table adapter. "Active" means `revokedAt IS NULL` AND (`expiresAt
 * IS NULL` OR `expiresAt > now`). The predicate is built once and reused by
 * every read method so the definition of "active" lives in exactly one
 * place.
 *
 * The `db` type is intentionally `any` вЂ” same reasoning as the other
 * repositories: the generated Drizzle generic cannot express a transaction
 * client that is interchangeable with the main connection.
 */
export class DrizzleRoleAssignmentRepository
  implements RoleAssignmentRepository
{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async findById(id: RoleAssignmentId): Promise<RoleAssignment | null> {
    const rows = await this.db
      .select()
      .from(acRoleAssignments)
      .where(eq(acRoleAssignments.id, id.value))
      .limit(1);
    const row = rows[0];
    return row ? RoleAssignmentMapper.toDomain(row) : null;
  }

  async findByUserId(
    userId: string,
    options?: ListOptions,
  ): Promise<RoleAssignment[]> {
    const conditions: SQL<unknown>[] = [eq(acRoleAssignments.userId, userId)];
    if (!(options?.includeInactive ?? false)) {
      conditions.push(this.activePredicate());
    }
    return this.runList(conditions);
  }

  async findByRoleId(
    roleId: string,
    options?: ListOptions,
  ): Promise<RoleAssignment[]> {
    const conditions: SQL<unknown>[] = [eq(acRoleAssignments.roleId, roleId)];
    if (!(options?.includeInactive ?? false)) {
      conditions.push(this.activePredicate());
    }
    return this.runList(conditions);
  }

  async findByTenant(
    tenantId: string | null,
    options?: ListOptions,
  ): Promise<RoleAssignment[]> {
    const conditions: SQL<unknown>[] = [
      tenantId === null
        ? isNull(acRoleAssignments.tenantId)
        : eq(acRoleAssignments.tenantId, tenantId),
    ];
    if (!(options?.includeInactive ?? false)) {
      conditions.push(this.activePredicate());
    }
    return this.runList(conditions);
  }

  async hasActiveRole(userId: string, roleName: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: acRoleAssignments.id })
      .from(acRoleAssignments)
      .where(
        and(
          eq(acRoleAssignments.userId, userId),
          eq(acRoleAssignments.roleName, roleName),
          this.activePredicate(),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  async hasActiveAssignment(userId: string, roleId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: acRoleAssignments.id })
      .from(acRoleAssignments)
      .where(
        and(
          eq(acRoleAssignments.userId, userId),
          eq(acRoleAssignments.roleId, roleId),
          this.activePredicate(),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  async save(assignment: RoleAssignment): Promise<void> {
    const row = RoleAssignmentMapper.toPersistence(assignment);
    await this.db
      .insert(acRoleAssignments)
      .values(row)
      .onConflictDoUpdate({
        target: acRoleAssignments.id,
        set: {
          roleName: row.roleName,
          expiresAt: row.expiresAt,
          revokedAt: row.revokedAt,
          revokedBy: row.revokedBy,
          revokedReason: row.revokedReason,
          isExpired: row.isExpired,
          updatedAt: row.updatedAt,
          version: row.version,
        },
      });
  }

  async delete(id: RoleAssignmentId): Promise<void> {
    await this.db
      .delete(acRoleAssignments)
      .where(eq(acRoleAssignments.id, id.value));
  }

  // в”Ђв”Ђ internal в”Ђв”Ђ

  /**
   * SQL predicate for "this row is currently active": not revoked and not
   * past its expiry. Reused by every read method so the definition lives in
   * exactly one place.
   */
  private activePredicate(): SQL<unknown> {
    const now = new Date();
    return and(
      isNull(acRoleAssignments.revokedAt),
      or(
        isNull(acRoleAssignments.expiresAt),
        gt(acRoleAssignments.expiresAt, now),
      ),
    ) as SQL<unknown>;
  }

  private async runList(conditions: SQL<unknown>[]): Promise<RoleAssignment[]> {
    const rows = await this.db
      .select()
      .from(acRoleAssignments)
      .where(and(...conditions))
      .orderBy(acRoleAssignments.assignedAt);
    return rows.map((row) => RoleAssignmentMapper.toDomain(row));
  }
}