import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const outboxEvents = pgTable('iam_outbox_events', {
  id: text('id').primaryKey(),
  eventName: text('event_name').notNull(),
  aggregateId: text('aggregate_id').notNull(),
  aggregateType: text('aggregate_type').notNull(),
  payload: jsonb('payload').notNull(),
  status: text('status').notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  availableAt: timestamp('available_at').notNull(),
  lockedAt: timestamp('locked_at'),
  lockToken: text('lock_token'),
  publishedAt: timestamp('published_at'),
  lastError: text('last_error'),
  occurredAt: timestamp('occurred_at').notNull(),
  createdAt: timestamp('created_at').notNull(),
});
