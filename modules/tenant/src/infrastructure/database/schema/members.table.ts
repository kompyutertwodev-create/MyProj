import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenants.table.js';

/**
 * Tenant members (join entity between Tenant and User).
 *
 * A member is *not* an aggregate root вЂ” it lives inside the Tenant
 * aggregate. One user can be a member of many tenants.
 *
 * `userId` and `invitedBy` are stored as raw UUIDs (no FK into iam) so
 * the tenant module stays independent of identity.
 */
export const members = pgTable(
  'tenant_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    role: text('role').notNull(),
    status: text('status').notNull(),
    invitedBy: uuid('invited_by'),
    joinedAt: timestamp('joined_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    version: integer('version').notNull().default(0),
  },
  (table) => ({
    tenantUserIdx: uniqueIndex('tenant_members_tenant_user_idx').on(
      table.tenantId,
      table.userId,
    ),
    tenantIdx: index('tenant_members_tenant_idx').on(table.tenantId),
    userIdx: index('tenant_members_user_idx').on(table.userId),
  }),
);

export type MemberRow = typeof members.$inferSelect;
export type MemberInsertRow = typeof members.$inferInsert;