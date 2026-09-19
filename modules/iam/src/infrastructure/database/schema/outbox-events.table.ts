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
 * Transactional outbox for IAM domain events.
 *
 * Uses the platform's `OutboxStore` shape (`status` / `availableAt` /
 * `lockedAt` / `lockToken`) so the shared dispatcher can claim, retry and
 * publish rows without a per-module adapter. Metadata columns mirror the
 * kernel's EventEnvelope shape so envelopes can be reconstructed directly.
 */
export const outboxEvents = pgTable(
  'iam_outbox_events',
  {
    id: uuid('id').primaryKey(),
    eventName: text('event_name').notNull(),
    aggregateType: text('aggregate_type').notNull(),
    aggregateId: uuid('aggregate_id').notNull(),
    tenantId: uuid('tenant_id'),
    payload: jsonb('payload').notNull(),

    // Platform dispatcher state
    status: text('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    availableAt: timestamp('available_at', { withTimezone: true }).notNull(),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    lockToken: text('lock_token'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    lastError: text('last_error'),

    // Event metadata (mirrors kernel.EventMetadata)
    correlationId: uuid('correlation_id'),
    causationId: uuid('causation_id'),
    actorId: uuid('actor_id'),
    schemaVersion: integer('schema_version').notNull().default(1),
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    aggregateVersion: integer('aggregate_version').notNull().default(0),

    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pendingIdx: index('iam_outbox_events_pending_idx').on(
      table.status,
      table.availableAt,
      table.createdAt,
    ),
    lockIdx: index('iam_outbox_events_lock_idx').on(
      table.status,
      table.lockedAt,
    ),
  }),
);

export type OutboxEventRow = typeof outboxEvents.$inferSelect;
export type NewOutboxEventRow = typeof outboxEvents.$inferInsert;