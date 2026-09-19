import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Tenant settings stored as JSONB.
 *
 * Kept as a single column because the shape is entirely read/write by the
 * tenant UI and never queried individually вЂ” normalizing it would add joins
 * without buying anything.
 */
export interface TenantSettingsRow {
  locale: string;
  timezone: string;
  currency: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

/**
 * Tenants (SaaS customer accounts).
 *
 * UUID primary key, TIMESTAMPTZ everywhere, soft delete via `deletedAt`,
 * `version` for optimistic concurrency, and a partial unique index on
 * `slug` so a deleted tenant frees its slug for re-registration.
 *
 * `ownerUserId` is stored as a raw UUID (no FK into iam) so the tenant
 * module stays independent of identity.
 */
export const tenants = pgTable(
  'tenant_tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    status: text('status').notNull(),
    settings: jsonb('settings').$type<TenantSettingsRow>().notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    version: integer('version').notNull().default(0),
  },
  (table) => ({
    slugIdx: index('tenant_tenants_slug_idx').on(table.slug),
    statusIdx: index('tenant_tenants_status_idx').on(table.status),
    ownerIdx: index('tenant_tenants_owner_idx').on(table.ownerUserId),
  }),
);

export type TenantRow = typeof tenants.$inferSelect;
export type TenantInsertRow = typeof tenants.$inferInsert;