import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { identities } from './identities.table.js';

/**
 * Session aggregate persistence.
 *
 * `refreshTokenHash` stores a SHA-256 digest of the raw token вЂ” the
 * plaintext never leaves the application layer, so a leaked database dump
 * does not expose every active session.
 *
 * Revocation is soft (`revokedAt`): rows stay for audit and so a user
 * cannot silently re-use a refresh token whose hash is already known.
 */
export const sessions = pgTable(
  'iam_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identityId: uuid('identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'cascade' }),
    deviceId: text('device_id').notNull(),
    deviceName: text('device_name').notNull(),
    deviceType: text('device_type').notNull(),
    ipAddress: text('ip_address').notNull(),
    userAgent: text('user_agent').notNull(),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedReason: text('revoked_reason'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    version: integer('version').notNull().default(0),
  },
  (table) => ({
    identityIdx: index('iam_sessions_identity_idx').on(table.identityId),
  }),
);

export type SessionRow = typeof sessions.$inferSelect;
export type NewSessionRow = typeof sessions.$inferInsert;