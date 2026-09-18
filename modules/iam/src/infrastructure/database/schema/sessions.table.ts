import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { identities } from './identities.table.js';

export const sessions = pgTable('iam_sessions', {
  id: text('id').primaryKey(),
  identityId: text('identity_id')
    .notNull()
    .references(() => identities.id, { onDelete: 'cascade' }),
  deviceId: text('device_id').notNull(),
  deviceName: text('device_name').notNull(),
  deviceType: text('device_type').notNull(),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent').notNull(),
  refreshToken: text('refresh_token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  lastActiveAt: timestamp('last_active_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type SessionRow = typeof sessions.$inferSelect;
