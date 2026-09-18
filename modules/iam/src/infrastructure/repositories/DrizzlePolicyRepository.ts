import { eq, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PolicyRepository } from '../../domain/policy/PolicyRepository.js';
import { Policy } from '../../domain/policy/Policy.js';
import { PolicyEffect } from '../../domain/policy/PolicyEffect.js';
import { policies } from '../database/schema/policies.table.js';
import type { AttributeCondition } from '../../domain/policy/AttributeCondition.js';

export class DrizzlePolicyRepository implements PolicyRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async findById(id: string): Promise<Policy | null> {
    const rows = await this.db.select().from(policies).where(eq(policies.id, id)).limit(1);
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async findAll(onlyActive = false): Promise<Policy[]> {
    const rows = onlyActive
      ? await this.db.select().from(policies).where(eq(policies.isActive, true))
      : await this.db.select().from(policies);
    return rows.map((r) => this.toDomain(r));
  }

  async findForSubjects(subjects: string[]): Promise<Policy[]> {
    const rows = await this.db.select().from(policies).where(eq(policies.isActive, true));
    return rows
      .map((r) => this.toDomain(r))
      .filter((p) => p.subjects.some((s) => subjects.includes(s) || s === '*'));
  }

  async save(policy: Policy): Promise<void> {
    const row = policy.toPersistence();
    await this.db
      .insert(policies)
      .values({
        id: row.id,
        name: row.name,
        description: row.description,
        effect: row.effect,
        subjects: row.subjects,
        resources: row.resources,
        actions: row.actions,
        conditions: row.conditions,
        priority: row.priority,
        isActive: row.isActive,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
      .onConflictDoUpdate({
        target: policies.id,
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
          updatedAt: row.updatedAt,
        },
      });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(policies).where(eq(policies.id, id));
  }

  private toDomain(row: typeof policies.$inferSelect): Policy {
    return Policy.reconstitute({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      effect: row.effect as PolicyEffect,
      subjects: (row.subjects ?? []) as string[],
      resources: (row.resources ?? []) as string[],
      actions: (row.actions ?? []) as string[],
      conditions: (row.conditions ?? []) as AttributeCondition[],
      priority: row.priority,
      isActive: row.isActive,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

// Suppress unused import warning
void inArray;
