import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { identities } from './identities.table.js';

export const devices = pgTable('iam_devices', {
  id: text('id').primaryKey(),
  identityId: text('identity_id')
    .notNull()
    .references(() => identities.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  name: text('name').notNull(),
  lastSeenAt: timestamp('last_seen_at').notNull().defaultNow(),
});
