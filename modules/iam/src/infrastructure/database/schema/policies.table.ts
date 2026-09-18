import { pgTable, text, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import type { AttributeCondition } from '../../../domain/policy/AttributeCondition.js';

export const policies = pgTable('iam_policies', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull().default(''),
  effect: text('effect').notNull(), // "allow" | "deny"
  subjects: jsonb('subjects').$type<string[]>().notNull().default([]),
  resources: jsonb('resources').$type<string[]>().notNull().default([]),
  actions: jsonb('actions').$type<string[]>().notNull().default([]),
  conditions: jsonb('conditions').$type<AttributeCondition[]>().notNull().default([]),
  priority: integer('priority').notNull().default(100),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type PolicyRow = typeof policies.$inferSelect;
export type NewPolicyRow = typeof policies.$inferInsert;
