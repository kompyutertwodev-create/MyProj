import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export interface TenantSettingsRow {
  locale: string;
  timezone: string;
  currency: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

export const tenants = pgTable('tenant_tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  status: text('status').notNull(),
  settings: jsonb('settings').$type<TenantSettingsRow>().notNull(),
  ownerUserId: text('owner_user_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type TenantRow = typeof tenants.$inferSelect;
export type TenantInsertRow = typeof tenants.$inferInsert;
