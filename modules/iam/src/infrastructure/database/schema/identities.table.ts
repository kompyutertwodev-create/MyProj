import {
  boolean,
  customType,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * CITEXT column type.
 *
 * Drizzle has no built-in `citext` type, so we declare a custom one. The
 * `pgcrypto` + `citext` extensions must be enabled by a migration before
 * this table is queried.
 */
const citext = customType<{ data: string }>({
  dataType() {
    return 'citext';
  },
});

/**
 * Identity aggregate persistence.
 *
 * One row per user. Emails are case-insensitive (CITEXT) but only unique
 * among live rows вЂ” soft-deleted identities free their email for
 * re-registration.
 *
 * `version` enables optimistic concurrency; `tenantId` is nullable so
 * platform-scoped identities coexist with tenant-scoped ones.
 */
export const identities = pgTable(
  'identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: citext('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    passwordSet: boolean('password_set').notNull().default(true),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    status: text('status').notNull().default('unverified'),
    mfaEnabled: boolean('mfa_enabled').notNull().default(false),
    mfaSecret: text('mfa_secret'),
    mfaBackupCodes: text('mfa_backup_codes').array(),
    tenantId: uuid('tenant_id'),
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
    tenantIdx: index('identities_tenant_idx').on(table.tenantId),
    statusIdx: index('identities_status_idx').on(table.status),
    deletedAtIdx: index('identities_deleted_at_idx').on(table.deletedAt),
  }),
);

export type IdentityRow = typeof identities.$inferSelect;
export type NewIdentityRow = typeof identities.$inferInsert;