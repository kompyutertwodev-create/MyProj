import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * ABAC policies.
 *
 * Subjects / resources / actions are stored as JSONB arrays because they
 * are inherently list-shaped and never queried individually (the evaluator
 * loads *all* candidate policies for a subject, then filters in memory).
 *
 * Conditions are stored as JSONB too: the shape is a discriminated union
 * that would bloat a normalized schema without buying anything for our
 * read pattern.
 *
 * `isDeleted` implements a soft delete: rows are never physically removed
 * so the audit trail survives. `isActive` is the runtime switch that
 * decides whether the evaluator considers the policy at all.
 */
export const acPolicies = pgTable(
  'ac_policies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    effect: text('effect').notNull(),
    subjects: jsonb('subjects').$type<string[]>().notNull(),
    resources: jsonb('resources').$type<string[]>().notNull(),
    actions: jsonb('actions').$type<string[]>().notNull(),
    conditions: jsonb('conditions').$type<unknown[]>().notNull().default([]),
    priority: integer('priority').notNull().default(100),
    isActive: boolean('is_active').notNull().default(true),
    isDeleted: boolean('is_deleted').notNull().default(false),
    tenantId: uuid('tenant_id'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    version: integer('version').notNull().default(0),
  },
  (table) => ({
    nameIdx: index('ac_policies_name_idx').on(table.name),
    tenantIdx: index('ac_policies_tenant_idx').on(table.tenantId),
    activeIdx: index('ac_policies_active_idx').on(table.isActive),
  }),
);

export type AcPolicyRow = typeof acPolicies.$inferSelect;
export type AcPolicyInsert = typeof acPolicies.$inferInsert;