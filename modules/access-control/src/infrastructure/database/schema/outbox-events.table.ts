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
 * Transactional outbox for domain events.
 *
 * Handlers enqueue events here *inside* the same transaction that saves
 * the aggregate, guaranteeing atomicity without distributed transactions.
 * A separate dispatcher (owned by the platform) drains rows where
 * `publishedAt IS NULL` in batches and publishes them to the real bus.
 *
 * The event payload is JSONB: the dispatcher does not need to know the
 * concrete event class, only its `eventName` and `aggregateId`, both
 * duplicated into dedicated columns for indexing.
 */
export const acOutboxEvents = pgTable(
  'ac_outbox_events',
  {
    id: uuid('id').primaryKey(),
    eventName: text('event_name').notNull(),
    aggregateType: text('aggregate_type').notNull(),
    aggregateId: uuid('aggregate_id').notNull(),
    tenantId: uuid('tenant_id'),
    payload: jsonb('payload').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    unpublishedIdx: index('ac_outbox_events_unpublished_idx').on(
      table.publishedAt,
    ),
    aggregateIdx: index('ac_outbox_events_aggregate_idx').on(
      table.aggregateType,
      table.aggregateId,
    ),
    nameIdx: index('ac_outbox_events_name_idx').on(table.eventName),
  }),
);

export type AcOutboxEventRow = typeof acOutboxEvents.$inferSelect;
export type AcOutboxEventInsert = typeof acOutboxEvents.$inferInsert;