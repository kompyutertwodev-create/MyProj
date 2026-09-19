import { and, eq, sql, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PolicyRepository } from '../../domain/policy/PolicyRepository.js';
import type { Policy } from '../../domain/policy/Policy.js';
import type { PolicyId } from '../../domain/policy/PolicyId.js';
import { acPolicies } from '../database/schema/policies.table.js';
import { PolicyMapper } from '../mappers/PolicyMapper.js';

/**
 * Drizzle-backed PolicyRepository.
 *
 * Single-table adapter: the aggregate carries its subjects/resources/actions
 * /conditions as JSONB columns, so no join is required. `findForSubjects`
 * is the hot path used by the evaluator вЂ” it filters out soft-deleted and
 * inactive rows at the SQL level so the aggregate stays cheap to hydrate.
 *
 * The `db` type is intentionally `any` вЂ” same reasoning as in the other
 * repositories: the generated Drizzle generic cannot express a transaction
 * client that is interchangeable with the main connection.
 */
export class DrizzlePolicyRepository implements PolicyRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async findById(id: PolicyId): Promise<Policy | null> {
    const rows = await this.db
      .select()
      .from(acPolicies)
      .where(eq(acPolicies.id, id.value))
      .limit(1);
    const row = rows[0];
    if (!row || row.isDeleted) return null;
    return PolicyMapper.toDomain(row);
  }

  async findAll(onlyActive?: boolean): Promise<Policy[]> {
    const conditions: SQL<unknown>[] = [eq(acPolicies.isDeleted, false)];
    if (onlyActive === true) {
      conditions.push(eq(acPolicies.isActive, true));
    }
    const rows = await this.db
      .select()
      .from(acPolicies)
      .where(and(...conditions))
      .orderBy(acPolicies.priority);
    return rows.map((row) => PolicyMapper.toDomain(row));
  }

  async findForSubjects(subjects: string[]): Promise<Policy[]> {
    if (subjects.length === 0) return [];

    const rows = await this.db
      .select()
      .from(acPolicies)
      .where(
        and(
          eq(acPolicies.isDeleted, false),
          eq(acPolicies.isActive, true),
          sqlOverlapsSubjects(subjects),
        ),
      )
      .orderBy(acPolicies.priority);

    return rows.map((row) => PolicyMapper.toDomain(row));
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const conditions: SQL<unknown>[] = [
      eq(acPolicies.name, name),
      eq(acPolicies.isDeleted, false),
    ];
    const rows = await this.db
      .select({ id: acPolicies.id })
      .from(acPolicies)
      .where(and(...conditions));
    if (excludeId === undefined) return rows.length > 0;
    return rows.some((row) => row.id !== excludeId);
  }

  async save(policy: Policy): Promise<void> {
    const row = PolicyMapper.toPersistence(policy);
    await this.db
      .insert(acPolicies)
      .values(row)
      .onConflictDoUpdate({
        target: acPolicies.id,
        set: {
          name: row.name,
          description: row.description,
          effect: row.effect,
          subjects: row.subjects,
          resources: row.resources,
          actions: row.actions,
          conditions: row.conditions,
          priority: row.priority,
          isActive: row.isActive,
          isDeleted: row.isDeleted,
          updatedAt: row.updatedAt,
          version: row.version,
        },
      });
  }

  async delete(id: PolicyId): Promise<void> {
    // Soft delete: preserve the row for audit. Callers who need the policy
    // gone for good can add a hard-delete method later.
    await this.db
      .update(acPolicies)
      .set({ isDeleted: true, isActive: false, updatedAt: new Date() })
      .where(eq(acPolicies.id, id.value));
  }
}

// в”Ђв”Ђ internal в”Ђв”Ђ

/**
 * SQL fragment: `subjects::jsonb ?| ARRAY[...]::text[]`.
 *
 * The overlap operator (`?|`) is provided by PostgreSQL for JSONB arrays.
 * Every element is bound as a parameter вЂ” there is no injection surface
 * regardless of what the caller puts in `subjects`.
 */
function sqlOverlapsSubjects(subjects: string[]): SQL<unknown> {
  const params = sql.join(
    subjects.map((s) => sql`${s}`),
    sql`, `,
  );
  return sql`${acPolicies.subjects}::jsonb ?| ARRAY[${params}]::text[]`;
}