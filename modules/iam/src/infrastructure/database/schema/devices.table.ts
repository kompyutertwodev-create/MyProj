import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { identities } from './identities.table.js';

/**
 * Device registry.
 *
 * A device is a long-lived record of a browser/app instance. Sessions
 * reference it indirectly through `deviceId`; the device row survives
 * session revocation so we keep an audit trail of where a user has been
 * seen.
 */
export const devices = pgTable(
  'iam_devices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identityId: uuid('identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    name: text('name').notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    identityIdx: index('iam_devices_identity_idx').on(table.identityId),
  }),
);

export type DeviceRow = typeof devices.$inferSelect;
export type NewDeviceRow = typeof devices.$inferInsert;