import { pgTable, text } from 'drizzle-orm/pg-core';

export const permissions = pgTable('iam_permissions', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull().default(''),
});

export type PermissionRow = typeof permissions.$inferSelect;
