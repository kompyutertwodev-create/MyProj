import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenants } from './tenants.table.js';

export const members = pgTable(
  'tenant_members',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    role: text('role').notNull(),
    status: text('status').notNull(),
    invitedBy: text('invited_by'),
    joinedAt: timestamp('joined_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantUserIdx: uniqueIndex('tenant_members_tenant_user_idx').on(table.tenantId, table.userId),
  })
);

export type MemberRow = typeof members.$inferSelect;
export type MemberInsertRow = typeof members.$inferInsert;
