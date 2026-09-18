import { boolean, pgTable, text } from 'drizzle-orm/pg-core';

export const roles = pgTable('iam_roles', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull().default(''),
  isSystem: boolean('is_system').notNull().default(false),
});

export type RoleRow = typeof roles.$inferSelect;
